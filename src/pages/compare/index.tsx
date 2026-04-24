import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Compare } from "@/components/compare/Compare";
import {
  readAndConsumePending,
  type PendingComparison,
} from "@/components/compare/session";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; pending: PendingComparison }
  | { kind: "empty" };

export default function ComparePage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  // Strict Mode invokes mount effects twice in dev; the read is destructive
  // (removes the key), so guard with a ref to consume exactly once.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;
    const pending = readAndConsumePending();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(pending ? { kind: "ready", pending } : { kind: "empty" });
  }, []);

  return (
    <>
      <Head>
        <title>LLMap — Comparação</title>
        <meta
          name="description"
          content="Compare respostas de múltiplos modelos de IA lado a lado."
        />
      </Head>
      {state.kind === "ready" ? (
        <Compare
          prompt={state.pending.prompt}
          selections={state.pending.selections}
        />
      ) : state.kind === "empty" ? (
        <EmptyState />
      ) : null}
    </>
  );
}

function EmptyState() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-white p-6 text-center">
        <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
          Nenhuma comparação em andamento
        </h1>
        <p className="mt-2 text-[13px] leading-[1.55] text-ink-3">
          Digite um prompt e escolha os modelos na página inicial para comparar.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-[var(--radius-pill)] bg-[color:var(--ink)] px-4 py-2 text-[13px] font-medium text-[color:var(--bg)] transition-colors hover:bg-[#2a2218]"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
