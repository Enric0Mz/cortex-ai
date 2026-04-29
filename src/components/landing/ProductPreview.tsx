import { StarFilled, StarOutline } from "@/components/landing/icons";

type ModelCard = {
  badge?: "Top";
  provider: string;
  initial: string;
  avatarColor: string;
  body: React.ReactNode;
  cost: string;
  votes: number;
  voteIcon: "filled" | "outline";
  highlight?: boolean;
};

const CARDS: readonly ModelCard[] = [
  {
    badge: "Top",
    provider: "Gemini 2.5 Flash",
    initial: "G",
    avatarColor: "#4285f4",
    body: (
      <>
        Para treinar um cachorro, comece com{" "}
        <strong className="font-semibold text-ink">sessões curtas</strong> de
        5–10 minutos por dia. Use reforço positivo — recompense cada acerto com
        petiscos e elogios no momento certo.
      </>
    ),
    cost: "$0.00031",
    votes: 847,
    voteIcon: "filled",
    highlight: true,
  },
  {
    provider: "Llama 3.3 (Groq)",
    initial: "L",
    avatarColor: "#7c3aed",
    body: (
      <>
        Pense num jogador aprendendo xadrez: primeiro ele memoriza os
        movimentos, depois entende padrões, e finalmente antecipa jogadas.
        Treinar um cachorro segue lógica parecida — repetição vira intuição.
      </>
    ),
    cost: "$0.00028",
    votes: 612,
    voteIcon: "outline",
  },
  {
    provider: "Mistral Small",
    initial: "M",
    avatarColor: "#f97316",
    body: null,
    cost: "$0.00019",
    votes: 384,
    voteIcon: "outline",
  },
];

const SKELETON_WIDTHS = ["100%", "88%", "95%", "70%"] as const;

export function ProductPreview() {
  return (
    <section className="relative z-10 mx-auto max-w-[1100px] px-6 pb-28">
      <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border)] bg-[color:var(--bg2)] shadow-[var(--shadow-frame)]">
        <div className="flex items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--bg3)] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto hidden rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-1 font-mono text-[11.5px] text-ink-3 xs:block">
            cortexai.app/compare
          </div>
          <span aria-hidden="true" className="w-[66px] xs:block hidden" />
        </div>

        <div className="space-y-5 p-5 md:p-7">
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg)] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--purple-pale)] font-mono text-[13px] font-semibold text-[color:var(--purple)]">
              P
            </span>
            <p className="flex-1 text-[14.5px] text-ink-2">
              Qual a melhor forma de começar a treinar um cachorro filhote?
            </p>
            <span className="hidden font-mono text-[11.5px] text-ink-3 md:inline">
              3 modelos · 1.4s
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {CARDS.map((card) => (
              <article
                key={card.provider}
                className={
                  card.highlight
                    ? "relative flex flex-col gap-3 rounded-[var(--radius-lg)] border-[1.5px] border-[color:var(--purple)] bg-[color:var(--bg)] p-4 shadow-[var(--shadow-ring)]"
                    : "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--bg)] p-4 shadow-[var(--shadow-card)]"
                }
              >
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[12px] font-semibold text-white"
                      style={{ background: card.avatarColor }}
                    >
                      {card.initial}
                    </span>
                    <span className="text-[13px] font-medium text-ink">
                      {card.provider}
                    </span>
                  </div>
                  {card.badge ? (
                    <span className="rounded-[var(--radius-sm)] bg-[color:var(--purple)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white">
                      {card.badge}
                    </span>
                  ) : null}
                </header>

                <div className="min-h-[96px] text-[13.5px] leading-[1.55] text-ink-2">
                  {card.body ?? (
                    <div className="flex flex-col gap-2">
                      {SKELETON_WIDTHS.map((width, i) => (
                        <span
                          key={i}
                          className="block h-2.5 rounded-[var(--radius-sm)] bg-[color:var(--bg3)] [animation:var(--animate-skeleton)]"
                          style={{
                            width,
                            animationDelay: `${i * 120}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <footer className="flex items-center justify-between border-t border-[color:var(--border)] pt-3 font-mono text-[11.5px] text-ink-3">
                  <span>{card.cost}</span>
                  <span className="inline-flex items-center gap-1">
                    {card.voteIcon === "filled" ? (
                      <StarFilled className="text-[color:var(--purple)]" />
                    ) : (
                      <StarOutline />
                    )}
                    {card.votes}
                  </span>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
