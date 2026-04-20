import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { MicIcon, PlusIcon, SubmitArrowIcon } from "@/components/landing/icons";
import {
  MAX_MODELS_PER_COMPARISON,
  MIN_MODELS_PER_COMPARISON,
  PROVIDER_MODELS,
} from "@/lib/constants";

type ProviderKey = keyof typeof PROVIDER_MODELS;

type ModelChip = {
  id: ProviderKey;
  name: string;
  color: string;
};

const FREE_MODEL_DISPLAY: Record<ProviderKey, { name: string; color: string }> =
  {
    gemini: { name: "Gemini 2.5 Flash", color: "#4285f4" },
    groq: { name: "Llama 3.3 (Groq)", color: "#7c3aed" },
    mistral: { name: "Mistral Small", color: "#f97316" },
    openrouter: { name: "GPT-OSS-120B", color: "#10a37f" },
  };

const FREE_MODELS: readonly ModelChip[] = (
  Object.keys(PROVIDER_MODELS) as ProviderKey[]
).map((id) => ({ id, ...FREE_MODEL_DISPLAY[id] }));

const PRO_MODELS: ReadonlyArray<{ id: string; name: string; color: string }> = [
  { id: "gpt4o", name: "GPT-4o", color: "#10a37f" },
  { id: "claude", name: "Claude 3.5", color: "#b8623c" },
  { id: "geminipro", name: "Gemini Pro", color: "#7c5cbf" },
];

export function PromptBox() {
  const [value, setValue] = useState("");
  const [active, setActive] = useState<Set<ProviderKey>>(
    () => new Set(FREE_MODELS.map((m) => m.id)),
  );
  const [shakeId, setShakeId] = useState<ProviderKey | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ready = value.trim().length > 0;

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    resize();
  }

  function submit() {
    // Wired to the /compare route in a later pass.
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (ready) submit();
    }
  }

  function toggle(id: ProviderKey) {
    setActive((prev) => {
      if (prev.has(id)) {
        if (prev.size <= MIN_MODELS_PER_COMPARISON) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      if (prev.size >= MAX_MODELS_PER_COMPARISON) {
        setShakeId(id);
        window.setTimeout(() => setShakeId(null), 260);
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div className="relative z-[2] mx-auto w-full max-w-[720px]">
      <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white shadow-[0_2px_8px_rgba(26,20,16,0.05),0_12px_32px_-8px_rgba(124,92,191,0.10)] transition-[border-color,box-shadow] duration-200 focus-within:border-[color:var(--purple-light)] focus-within:shadow-[0_2px_8px_rgba(26,20,16,0.05),0_16px_40px_-8px_rgba(124,92,191,0.16)]">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 pl-5">
          <button
            type="button"
            aria-label="Anexar arquivo"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-[color:var(--bg2)] hover:text-ink"
          >
            <PlusIcon />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Digite seu prompt e compare as IAs…"
            className="max-h-40 min-h-7 flex-1 resize-none bg-transparent text-[15px] leading-[1.5] tracking-[-0.005em] text-ink placeholder:text-ink-3 focus:outline-none"
          />

          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Entrada de voz"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-[color:var(--bg2)] hover:text-ink-2"
            >
              <MicIcon />
            </button>
            <button
              type="button"
              aria-label="Comparar"
              onClick={submit}
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-white transition-[background-color,transform] active:scale-[0.93] ${
                ready
                  ? "bg-[color:var(--purple)]"
                  : "bg-[color:var(--ink)] hover:bg-[color:var(--purple)]"
              }`}
            >
              <SubmitArrowIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-[color:var(--bg2)] px-3.5 pt-2.5 pb-3.5">
          <span className="mr-1 cursor-default rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-[color:var(--bg2)] px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            Grátis
          </span>

          {FREE_MODELS.map((model) => {
            const isActive = active.has(model.id);
            return (
              <button
                key={model.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggle(model.id)}
                style={
                  shakeId === model.id
                    ? { animation: "shake 260ms ease-out" }
                    : undefined
                }
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-[5px] text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-[color:var(--purple-light)] bg-[color:var(--purple-pale)] text-[color:var(--purple)]"
                    : "border-[color:var(--border)] bg-transparent text-ink-2 hover:bg-[color:var(--bg2)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: model.color }}
                />
                {model.name}
              </button>
            );
          })}

          {PRO_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              disabled
              title="Plano Pro"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-transparent px-2.5 py-[5px] text-[12.5px] font-medium text-ink-2 opacity-45"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: model.color }}
              />
              {model.name}
              <span aria-hidden="true" className="ml-0.5 text-[9px]">
                🔒
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-[11px] text-center text-[11.5px] text-ink-3">
        Selecione até {MAX_MODELS_PER_COMPARISON} modelos ·{" "}
        <a
          href="#"
          className="font-medium text-[color:var(--purple)] underline underline-offset-2"
        >
          Upgrade para Pro
        </a>{" "}
        para desbloquear mais
      </p>
    </div>
  );
}
