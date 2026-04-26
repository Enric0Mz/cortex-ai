import { ArrowRight, PlayTriangle } from "@/components/landing/icons";
import { LiveBadge } from "@/components/landing/LiveBadge";
import { PromptBox } from "@/components/landing/PromptBox";
import { Rotator } from "@/components/landing/Rotator";

const ROTATING_PHRASES = [
  "prototipar sites",
  "brainstorm de idéias",
  "escrever emails",
  "código back-end",
  "pesquisa científica",
] as const;

export function Hero() {
  return (
    <section className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center gap-10 px-6 pt-32 pb-20 text-center md:pt-40 md:pb-28">
      <LiveBadge />

      <h1 className="font-sans text-[76px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink lg:text-[64px] md:text-[48px] xs:text-[36px]">
        <span className="block">Nós encontramos a</span>
        <span className="block">melhor IA para</span>
        <span className="block">
          <Rotator phrases={ROTATING_PHRASES} />
        </span>
      </h1>

      <p className="max-w-[42rem] text-[19px] leading-[1.6] text-ink-2 md:text-[17px]">
        Pare de adivinhar qual modelo usar. Envie um prompt uma vez e veja lado
        a lado como{" "}
        <strong className="font-semibold text-ink">Claude, Gemini, GPT</strong>{" "}
        e diversos outros modelos respondem — com custo, latência e votos da
        comunidade para cada resposta. Descubra em segundos qual IA funciona
        melhor para o seu caso, sem precisar assinar quatro ferramentas
        diferentes.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="#"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[color:var(--purple)] px-6 py-3 text-[15px] font-medium text-white shadow-[0_6px_18px_rgba(124,58,237,0.28)] transition-transform hover:-translate-y-px"
        >
          Testar agora
          <ArrowRight />
        </a>
        <a
          href="#"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-[color:var(--bg2)] px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-[color:var(--bg3)]"
        >
          <PlayTriangle />
          Ver demo
        </a>
      </div>

      <PromptBox />
    </section>
  );
}
