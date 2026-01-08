#!/usr/bin/env python3
"""
Compare the live Supabase schema dump (public schema) with migrations state.

Usage:
  python3 scripts/reconcile-schema.py
  python3 scripts/reconcile-schema.py --remote supabase/remote-schema.sql --migrations supabase/migrations
  python3 scripts/reconcile-schema.py --fail-on-diff
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys


def preprocess_type_parens(text: str) -> str:
    # Replace type(size) with type_size so regex doesn't stop at the ')'.
    return re.sub(r"([A-Za-z_]+)\s*\(\s*(\d+)\s*\)", r"\1_\2", text)


def norm_type(type_str: str) -> str:
    type_str = type_str.strip().lower()
    type_str = type_str.replace("timestamp with time zone", "timestamptz")
    type_str = type_str.replace("character varying", "varchar")
    type_str = re.sub(r"varchar_\d+", "varchar", type_str)
    type_str = re.sub(r"varchar\s*\(\s*\d+\s*\)", "varchar", type_str)
    type_str = re.sub(r"\s+", " ", type_str)
    return type_str


def parse_args(arg_str: str) -> list[str]:
    if not arg_str.strip():
        return []
    args: list[str] = []
    for raw in arg_str.split(","):
        part = raw.strip()
        part = re.split(r"\s+DEFAULT\s+", part, flags=re.IGNORECASE)[0].strip()
        part = re.split(r"\s*=\s*", part)[0].strip()
        tokens = part.split()
        if len(tokens) == 1:
            arg_type = tokens[0]
        else:
            # Assume first token is param name.
            arg_type = " ".join(tokens[1:])
        args.append(norm_type(arg_type))
    return args


def extract_columns_from_create_table(text: str, schema_prefix: str) -> dict[str, list[str]]:
    tables: dict[str, list[str]] = {}
    pattern = re.compile(
        rf"^\s*CREATE TABLE {re.escape(schema_prefix)}([\w_]+) \(\n(.*?)\n\);",
        re.MULTILINE | re.DOTALL,
    )
    for match in pattern.finditer(text):
        table = match.group(1)
        body = match.group(2)
        cols: list[str] = []
        for line in body.splitlines():
            line = line.strip().rstrip(",")
            if not line or line.startswith("--"):
                continue
            if re.match(r"^(CONSTRAINT|UNIQUE|PRIMARY|FOREIGN|CHECK)\b", line, re.IGNORECASE):
                continue
            col = line.split()[0].strip('"')
            if col in {")"}:
                continue
            cols.append(col)
        tables[table] = cols
    return tables


def diff_sets(a: set, b: set) -> tuple[list, list]:
    return sorted(a - b), sorted(b - a)


def parse_remote(remote_text: str) -> dict[str, set]:
    remote_tables = extract_columns_from_create_table(remote_text, "public.")
    remote_types = set(
        re.findall(r"^\s*CREATE TYPE\s+public\.([\w_]+)\s+AS\s+ENUM", remote_text, re.MULTILINE)
    )
    remote_matviews = set(
        re.findall(
            r"^\s*CREATE MATERIALIZED VIEW public\.([\w_]+)\s+AS", remote_text, re.MULTILINE
        )
    )
    remote_views = set(
        re.findall(r"^\s*CREATE VIEW public\.([\w_]+)\s+AS", remote_text, re.MULTILINE)
    )

    remote_funcs = set()
    for name, args in re.findall(
        r"^\s*CREATE FUNCTION public\.([\w_]+)\s*\(([^)]*)\)",
        preprocess_type_parens(remote_text),
        re.MULTILINE,
    ):
        remote_funcs.add((name, tuple(parse_args(args))))

    remote_policies = set()
    for name, table in re.findall(
        r"^\s*CREATE POLICY\s+\"?([^\"\n]+)\"?\s+ON public\.([\w_]+)",
        remote_text,
        re.MULTILINE,
    ):
        remote_policies.add((name.strip(), table))

    remote_triggers = set()
    for trig, table in re.findall(
        r"^\s*CREATE TRIGGER\s+([\w_]+)\s+.*?ON public\.([\w_]+)",
        remote_text,
        re.MULTILINE,
    ):
        remote_triggers.add((trig, table))

    remote_indexes = set()
    for name, table in re.findall(
        r"^\s*CREATE INDEX\s+(?:IF NOT EXISTS\s+)?([\w_]+)\s+ON public\.([\w_]+)",
        remote_text,
        re.MULTILINE,
    ):
        remote_indexes.add((name, table))

    return {
        "tables": remote_tables,
        "types": remote_types,
        "matviews": remote_matviews,
        "views": remote_views,
        "funcs": remote_funcs,
        "policies": remote_policies,
        "triggers": remote_triggers,
        "indexes": remote_indexes,
    }


def parse_migrations(migrations_dir: pathlib.Path) -> dict[str, set]:
    mig_tables: dict[str, set[str]] = {}
    mig_types: set[str] = set()
    mig_matviews: set[str] = set()
    mig_views: set[str] = set()
    mig_funcs: set[tuple[str, tuple[str, ...]]] = set()
    mig_policies: set[tuple[str, str]] = set()
    mig_triggers: set[tuple[str, str]] = set()
    mig_indexes: set[tuple[str, str]] = set()

    for path in sorted(migrations_dir.glob("*.sql")):
        raw = path.read_text()
        text = raw

        for name in re.findall(r"^\s*CREATE TYPE\s+([\w_]+)\s+AS\s+ENUM", text, re.MULTILINE):
            mig_types.add(name)

        for table, cols in extract_columns_from_create_table(text, "").items():
            mig_tables.setdefault(table, set()).update(cols)

        for table, body in re.findall(
            r"ALTER TABLE\s+([\w\.]+)\s+([^;]+);", text, re.IGNORECASE | re.DOTALL
        ):
            table_name = table.split(".")[-1]
            for col in re.findall(r"ADD COLUMN(?: IF NOT EXISTS)?\s+([\w_]+)", body, re.IGNORECASE):
                mig_tables.setdefault(table_name, set()).add(col)

        for name in re.findall(
            r"^\s*CREATE MATERIALIZED VIEW\s+([\w_]+)\s+AS", text, re.MULTILINE
        ):
            mig_matviews.add(name)
        for name in re.findall(r"^\s*CREATE VIEW\s+([\w_]+)\s+AS", text, re.MULTILINE):
            mig_views.add(name)

        func_events = []
        safe_text = preprocess_type_parens(text)
        for match in re.finditer(
            r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([\w\.]+)\s*\(([^)]*)\)",
            safe_text,
            re.MULTILINE | re.IGNORECASE,
        ):
            func_events.append((match.start(), "create", match.group(1), match.group(2)))
        for match in re.finditer(
            r"^\s*DROP FUNCTION IF EXISTS\s+([\w\.]+)\s*\(([^)]*)\)",
            safe_text,
            re.MULTILINE | re.IGNORECASE,
        ):
            func_events.append((match.start(), "drop", match.group(1), match.group(2)))

        for _, kind, name, args in sorted(func_events, key=lambda x: x[0]):
            sig = (name.split(".")[-1], tuple(parse_args(args)))
            if kind == "create":
                mig_funcs.add(sig)
            else:
                mig_funcs.discard(sig)

        policy_events = []
        for match in re.finditer(
            r"^\s*CREATE POLICY\s+\"?([^\"\n]+)\"?\s+ON\s+([\w\.]+)",
            text,
            re.MULTILINE,
        ):
            policy_events.append((match.start(), "create", match.group(1), match.group(2)))
        for match in re.finditer(
            r"^\s*DROP POLICY IF EXISTS\s+\"?([^\"\n]+)\"?\s+ON\s+([\w\.]+)",
            text,
            re.MULTILINE | re.IGNORECASE,
        ):
            policy_events.append((match.start(), "drop", match.group(1), match.group(2)))

        for _, kind, name, table in sorted(policy_events, key=lambda x: x[0]):
            entry = (name.strip(), table.split(".")[-1])
            if kind == "create":
                mig_policies.add(entry)
            else:
                mig_policies.discard(entry)

        for trig, table in re.findall(
            r"^\s*CREATE TRIGGER\s+([\w_]+)\s+.*?ON\s+([\w\.]+)", text, re.MULTILINE
        ):
            mig_triggers.add((trig, table))

        for name, table in re.findall(
            r"^\s*CREATE INDEX\s+(?:IF NOT EXISTS\s+)?([\w_]+)\s+ON\s+([\w\.]+)",
            text,
            re.MULTILINE,
        ):
            mig_indexes.add((name, table.split(".")[-1]))

    return {
        "tables": mig_tables,
        "types": mig_types,
        "matviews": mig_matviews,
        "views": mig_views,
        "funcs": mig_funcs,
        "policies": mig_policies,
        "triggers": mig_triggers,
        "indexes": mig_indexes,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--remote", default="supabase/remote-schema.sql")
    parser.add_argument("--migrations", default="supabase/migrations")
    parser.add_argument("--fail-on-diff", action="store_true")
    args = parser.parse_args()

    remote_path = pathlib.Path(args.remote)
    migrations_dir = pathlib.Path(args.migrations)

    if not remote_path.exists():
        print(f"Remote schema not found: {remote_path}", file=sys.stderr)
        return 2
    if not migrations_dir.exists():
        print(f"Migrations dir not found: {migrations_dir}", file=sys.stderr)
        return 2

    remote = parse_remote(remote_path.read_text())
    migrations = parse_migrations(migrations_dir)

    print("=== RECONCILIATION ===")

    r_only, m_only = diff_sets(remote["types"], migrations["types"])
    print("\nTypes:")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    r_only, m_only = diff_sets(set(remote["tables"]), set(migrations["tables"]))
    print("\nTables:")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    print("\nColumns (remote vs migrations):")
    for table in sorted(set(remote["tables"]) | set(migrations["tables"])):
        rcols = set(remote["tables"].get(table, []))
        mcols = set(migrations["tables"].get(table, []))
        if rcols != mcols:
            print(
                f"  {table}: remote_only={sorted(rcols - mcols)} "
                f"migrations_only={sorted(mcols - rcols)}"
            )

    r_only, m_only = diff_sets(remote["matviews"], migrations["matviews"])
    print("\nMaterialized views:")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    r_only, m_only = diff_sets(remote["views"], migrations["views"])
    print("\nViews:")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    r_only, m_only = diff_sets(remote["funcs"], migrations["funcs"])
    print("\nFunctions (name + arg types):")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    r_only, m_only = diff_sets(remote["policies"], migrations["policies"])
    print("\nPolicies (name, table):")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    remote_public = remote["triggers"]
    mig_public = {t for t in migrations["triggers"] if "." not in t[1]}
    r_only, m_only = diff_sets(remote_public, mig_public)
    print("\nTriggers (public tables only):")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    mig_non_public = {t for t in migrations["triggers"] if "." in t[1]}
    print("\nTriggers on non-public tables (expected missing from remote dump):")
    print("  migrations_only_non_public:", sorted(mig_non_public))

    r_only, m_only = diff_sets(remote["indexes"], migrations["indexes"])
    print("\nIndexes (name, table):")
    print("  remote_only:", r_only)
    print("  migrations_only:", m_only)

    has_diff = any(
        [
            r_only,
            m_only,
            any(
                set(remote["tables"].get(table, [])) != set(migrations["tables"].get(table, []))
                for table in set(remote["tables"]) | set(migrations["tables"])
            ),
        ]
    )

    return 1 if (args.fail_on_diff and has_diff) else 0


if __name__ == "__main__":
    raise SystemExit(main())
