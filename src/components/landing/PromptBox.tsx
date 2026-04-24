import { useRouter } from "next/router";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  MicIcon,
  PlusIcon,
  SubmitArrowIcon,
  FilterIcon,
  CheckSquareIcon,
  SquareIcon,
  SearchIcon,
} from "@/components/landing/icons";
import { ChevronDownIcon } from "@/components/compare/icons";
import { providerChrome } from "@/components/compare/chrome";
import { PENDING_COMPARISON_KEY } from "@/components/compare/session";
import {
  MAX_MODELS_PER_COMPARISON,
  MIN_MODELS_PER_COMPARISON,
} from "@/lib/constants";
import { PROVIDER_LABELS } from "@/lib/providers";
import type { AiModelResponse } from "@/features/ai-models/schemas";

function formatModelName(rawName: string) {
  let name = rawName;
  if (name.includes("/")) name = name.split("/")[1];

  return name
    .split("-")
    .map((word) => {
      if (word === "gpt" || word === "oss" || word === "b") {
        return word.toUpperCase();
      }
      if (word === "20b" || word === "120b" || word === "70b") {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(":free", "");
}

function isDefaultModel(model: AiModelResponse) {
  const name = model.name.toLowerCase();
  return name.includes("llama-3") || name.includes("mistral-small");
}

function getVendor(model: AiModelResponse) {
  return PROVIDER_LABELS[model.provider].toUpperCase();
}

export function PromptBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [models, setModels] = useState<AiModelResponse[]>([]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/v1/models")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((list: AiModelResponse[]) => {
        if (cancelled) return;
        setModels(list);

        const freeModels = list.filter((model) => model.isFree);
        const defaultModels = freeModels.filter(isDefaultModel);
        const initialActive =
          defaultModels.length >= MIN_MODELS_PER_COMPARISON
            ? defaultModels
            : freeModels.slice(0, MIN_MODELS_PER_COMPARISON);

        setActive(
          new Set(
            initialActive.slice(0, MAX_MODELS_PER_COMPARISON).map((m) => m.id),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    value.trim().length > 0 &&
    active.size >= MIN_MODELS_PER_COMPARISON &&
    !submitting;

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

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const modelIds = Array.from(active);
    const selections = models.filter((m) => active.has(m.id));
    sessionStorage.setItem(
      PENDING_COMPARISON_KEY,
      JSON.stringify({
        prompt: value.trim(),
        models: modelIds,
        selections,
      }),
    );
    await router.push(`/compare?n=${modelIds.length}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function toggle(id: string) {
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

  const activeSelections = models.filter((m) => active.has(m.id));

  const filteredModels = useMemo(() => {
    return models.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [models, searchQuery]);

  const groupedModels = useMemo(() => {
    const map = new Map<string, AiModelResponse[]>();
    filteredModels.forEach((m) => {
      const vendor = getVendor(m);
      if (!map.has(vendor)) map.set(vendor, []);
      map.get(vendor)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredModels]);

  function getSelectedText() {
    if (activeSelections.length === 0) return "Nenhum modelo selecionado";
    const names = activeSelections.map((m) => formatModelName(m.name));
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} mais`;
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
              disabled={!canSubmit}
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-white transition-[background-color,transform] active:scale-[0.93] ${
                canSubmit
                  ? "bg-[color:var(--ink)] hover:bg-[#2a2218]"
                  : "bg-[color:var(--ink)] disabled:opacity-60"
              }`}
            >
              <SubmitArrowIcon />
            </button>
          </div>
        </div>

        {!isSelectorOpen && (
          <div className="flex items-center justify-between border-t border-[color:var(--bg2)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-[5px]">
                {activeSelections.map((model) => {
                  const chrome = providerChrome(model.provider, model.name);
                  return (
                    <span
                      key={model.id}
                      aria-hidden="true"
                      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-white text-[9.5px] font-semibold tracking-[0.02em] shadow-sm"
                      style={{ background: chrome.color, color: "white" }}
                    >
                      {chrome.initial}
                    </span>
                  );
                })}
              </div>
              <span className="text-[13px] font-medium tracking-[-0.005em] text-ink-2">
                {getSelectedText()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSelectorOpen(true)}
              className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-[#f5f1e8] px-3.5 py-[7px] text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-[#eadeff] hover:text-[color:var(--purple)]"
            >
              <FilterIcon /> Selecionar modelos
            </button>
          </div>
        )}

        {isSelectorOpen && (
          <div className="border-t border-[color:var(--bg2)]">
            <div className="flex items-center gap-2.5 border-b border-[color:var(--bg2)] bg-[#f5f1e8] px-4 py-3">
              <SearchIcon className="text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar modelo..."
                className="flex-1 bg-transparent text-[13.5px] font-medium text-ink placeholder:font-normal placeholder:text-ink-3 focus:outline-none"
              />
              <div className="text-[12px] font-medium text-ink-3">
                <span className="font-semibold text-[color:var(--purple)]">
                  {active.size}
                </span>{" "}
                / {MAX_MODELS_PER_COMPARISON}
              </div>
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {groupedModels.map(([vendor, vendorModels]) => (
                <div
                  key={vendor}
                  className="mb-2 border-b border-[color:var(--bg2)] last:mb-0 last:border-0"
                >
                  <div className="flex items-center gap-1.5 px-4 py-[9px]">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[color:var(--bg2)] text-[10px] font-bold text-ink-3">
                      {vendor[0]}
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.04em] text-ink-3">
                      {vendor}
                    </span>
                  </div>
                  <ul>
                    {vendorModels.map((model) => {
                      const isActive = active.has(model.id);
                      const isLocked = !model.isFree;
                      const chrome = providerChrome(model.provider, model.name);

                      return (
                        <li key={model.id}>
                          <button
                            type="button"
                            disabled={isLocked}
                            title={
                              isLocked
                                ? "Faça upgrade para comparar com este modelo."
                                : undefined
                            }
                            onClick={() => !isLocked && toggle(model.id)}
                            style={
                              shakeId === model.id
                                ? { animation: "shake 260ms ease-out" }
                                : undefined
                            }
                            className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive
                                ? "bg-[color:var(--purple-pale)]"
                                : "hover:bg-[color:var(--bg2)]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isActive ? (
                                <CheckSquareIcon />
                              ) : (
                                <SquareIcon className="text-[color:var(--border)]" />
                              )}
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{ background: chrome.color }}
                              />
                              <span
                                className={`text-[13.5px] font-medium tracking-[-0.005em] ${
                                  isActive
                                    ? "text-[color:var(--purple)]"
                                    : "text-ink-2"
                                }`}
                              >
                                {formatModelName(model.name)}
                              </span>
                              <span className="text-[11px] font-mono tracking-tight text-ink-3">
                                {model.name}
                              </span>
                            </div>
                            <span
                              className={`rounded-md px-[5px] py-[3px] font-mono text-[9px] font-bold tracking-[0.04em] uppercase ${
                                isLocked
                                  ? "bg-[color:var(--bg2)] text-ink-3"
                                  : "bg-[#eaf6f1] text-[color:var(--success)]"
                              }`}
                            >
                              {isLocked ? "Pro" : "Grátis"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--bg2)] bg-[#f5f1e8] px-4 py-3">
              <span className="text-[12px] text-ink-3">
                Modelos Pro:{" "}
                <a
                  href="#"
                  className="font-medium text-[color:var(--purple)] underline underline-offset-2 hover:text-[color:var(--purple-dark)]"
                >
                  fazer upgrade
                </a>
              </span>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--ink)] px-4 py-[7px] text-[12.5px] font-medium text-white transition-colors hover:bg-[#2a2218]"
              >
                Confirmar
                <ChevronDownIcon />
              </button>
            </div>
          </div>
        )}
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
