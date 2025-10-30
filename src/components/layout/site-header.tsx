import Image from "next/image";
import Link from "next/link";

type SiteHeaderProps = {
  title: string;
  subtitle: string;
  destination?: string;
};

export function SiteHeader({
  title,
  subtitle,
  destination = "/",
}: SiteHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="https://bsp-lab.dev"
          className="flex items-center gap-3 text-sm transition-opacity hover:opacity-80"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/bsp-lab-logo.png"
            alt="BSP Lab"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
          />
          <span className="text-sm font-semibold text-white sm:text-base">
            BSP Lab
          </span>
        </Link>
        <span className="hidden h-10 w-px rounded-full bg-white/15 sm:block" />
        <Link
          href={destination}
          className="flex flex-col gap-1 leading-tight text-left text-white transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40"
        >
          <span className="text-sm font-semibold sm:text-lg">{title}</span>
          <span className="text-xs text-white/60 sm:text-sm">{subtitle}</span>
        </Link>
      </div>
    </header>
  );
}
