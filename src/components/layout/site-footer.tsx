import { Github, Linkedin, Mail } from "lucide-react";

const SOCIAL_LINKS = [
  { icon: () => <span className="text-lg font-bold">X</span>, href: "https://x.com/Brunopenzar", label: "X (Twitter)" },
  { icon: Github, href: "https://github.com/BPenzar", label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/bruno-penzar", label: "LinkedIn" },
  { icon: Mail, href: "mailto:penzar.bruno@gmail.com", label: "Email" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/50 py-6 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-white/60">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://www.bsp-lab.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white hover:underline"
          >
            BSP Lab
          </a>
          . Crafted to turn feedback into growth.
        </p>
        <div className="flex gap-3">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
