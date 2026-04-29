import Head from "next/head";
import { Landing } from "@/components/landing/Landing";
import { Nav } from "@/components/layout/Nav";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>CortexAI — A melhor IA para cada tarefa</title>
        <meta
          name="description"
          content="Compare respostas de múltiplos modelos ao mesmo tempo e descubra a melhor IA para cada tarefa."
        />
      </Head>
      <Nav />
      <main>
        <Landing />
      </main>
    </>
  );
}
