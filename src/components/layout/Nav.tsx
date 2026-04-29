import { ArrowRight, BrandMark, MenuIcon } from "@/components/landing/icons";

const NAV_LINKS = [
  { label: "Comparar", href: "#" },
  { label: "Ranking", href: "#" },
  { label: "Modelos", href: "#" },
  { label: "Preços", href: "#" },
] as const;

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border)]/70 bg-[color:var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 md:grid-cols-[1fr_auto_1fr] md:px-10">
        <a
          href="#"
          aria-label="CortexAI — início"
          className="flex items-center gap-2.5 text-ink"
        >
          <BrandMark />
          <span className="font-sans text-[17px] font-semibold tracking-[-0.02em]">
            CortexAI
          </span>
        </a>

        <nav
          aria-label="Principal"
          className="hidden items-center justify-center gap-7 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-ink-2 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-3 md:flex">
          <a
            href="#"
            className="text-sm text-ink-2 transition-colors hover:text-ink"
          >
            Entrar
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--ink)] px-4 py-2 text-sm font-medium text-[color:var(--bg)] transition-transform hover:-translate-y-px"
          >
            Começar grátis
            <ArrowRight width={14} height={14} />
          </a>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-[var(--radius-md)] border border-[color:var(--border)] text-ink md:hidden"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}
