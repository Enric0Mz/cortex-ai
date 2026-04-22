import Head from "next/head";
import { useRouter } from "next/router";
import { Compare } from "@/components/compare/Compare";

function parseModelCount(raw: string | string[] | undefined): 2 | 3 | 4 {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (n === 2 || n === 3 || n === 4) return n;
  return 3;
}

export default function ComparePage() {
  const router = useRouter();
  const modelCount = parseModelCount(router.query.models);

  return (
    <>
      <Head>
        <title>LLMap — Comparação</title>
        <meta
          name="description"
          content="Compare respostas de múltiplos modelos de IA lado a lado."
        />
      </Head>
      <Compare modelCount={modelCount} />
    </>
  );
}
