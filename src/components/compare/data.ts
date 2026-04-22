import { PROVIDER_MODELS } from "@/lib/constants";

export type ProviderKey = keyof typeof PROVIDER_MODELS;

export type MockModel = {
  id: ProviderKey;
  name: string;
  sub: string;
  initial: string;
  color: string;
  bg: string;
  startDelayMs: number;
  latency: string;
  cost: string;
  tokens: string;
  text: string;
};

export const MOCK_MODELS: readonly MockModel[] = [
  {
    id: "openrouter",
    name: "GPT-OSS-120B",
    sub: "OpenAI · Ago 2024",
    initial: "G",
    color: "#0e8f6e",
    bg: "rgba(14,143,110,0.10)",
    startDelayMs: 0,
    latency: "1.2s",
    cost: "$0.00012",
    tokens: "218",
    text: `Aprendizado por reforço (RL) é um tipo de machine learning onde um agente aprende tomando decisões e recebendo feedback do ambiente.

Pense assim: imagine que você está aprendendo a jogar um videogame. No começo, você tenta coisas aleatórias. Quando acerta, ganha pontos. Quando erra, perde. Com o tempo, você aprende quais ações levam a mais pontos.

O agente de RL faz exatamente isso:
• Observa o estado atual do ambiente
• Escolhe uma ação
• Recebe uma recompensa (positiva ou negativa)
• Atualiza sua estratégia com base nisso

Repetindo esse ciclo milhões de vezes, o agente aprende uma política ótima — a melhor sequência de ações para maximizar a recompensa total.`,
  },
  {
    id: "mistral",
    name: "Mistral Small",
    sub: "Mistral AI · Mar 2024",
    initial: "M",
    color: "#b8623c",
    bg: "rgba(184,98,60,0.10)",
    startDelayMs: 300,
    latency: "1.8s",
    cost: "$0.00009",
    tokens: "241",
    text: `Imagine um cachorro aprendendo truques com seu dono.

O dono é o "ambiente". O cachorro é o "agente". Quando o cachorro senta ao comando, ganha um petisco (recompensa positiva). Quando desobedece, não ganha nada ou leva uma repreensão (recompensa negativa).

Ao longo de muitas tentativas, o cachorro aprende que sentar → petisco. Esse é o ciclo central do aprendizado por reforço:

1. Observar → o que está acontecendo?
2. Agir → o que devo fazer?
3. Receber feedback → foi boa ou ruim minha escolha?
4. Aprender → ajustar comportamento futuro

Algoritmos famosos como o Q-Learning e o PPO seguem exatamente essa lógica, só que em escala computacional — com milhões de iterações por hora.`,
  },
  {
    id: "gemini",
    name: "Gemini 2.5 Flash",
    sub: "Google · Mai 2024",
    initial: "G",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.10)",
    startDelayMs: 180,
    latency: "0.9s",
    cost: "$0.00007",
    tokens: "196",
    text: `Aprendizado por reforço é sobre aprender pela experiência, não por exemplos prontos.

Ao contrário do aprendizado supervisionado (onde você aprende com um "gabarito"), no RL o agente descobre sozinho quais ações são boas, explorando o ambiente e coletando sinais de recompensa.

O conceito central é o trade-off entre exploração e explotação:
— Exploração: tentar coisas novas para descobrir opções melhores
— Explotação: usar o que já sabe que funciona

Um agente muito explorador demora a convergir. Um muito explotador fica preso em soluções medianas. O equilíbrio entre os dois é o que define um bom algoritmo de RL.

Aplicações reais: treinamento de IAs para xadrez (AlphaGo), robótica, otimização de data centers e os próprios modelos de linguagem que você usa hoje.`,
  },
  {
    id: "groq",
    name: "Llama 3.3 (Groq)",
    sub: "Meta · Dez 2024",
    initial: "L",
    color: "#e87d2e",
    bg: "rgba(232,125,46,0.10)",
    startDelayMs: 450,
    latency: "2.1s",
    cost: "$0.00000",
    tokens: "229",
    text: `Aprendizado por reforço é um paradigma de ML onde um agente aprende a tomar decisões ótimas interagindo com um ambiente.

Formalmente, o problema é modelado como um Processo de Decisão de Markov (MDP):
• Estado (s): situação atual do agente
• Ação (a): escolha feita pelo agente
• Recompensa (r): sinal de feedback imediato
• Política (π): estratégia que mapeia estados → ações

O objetivo é encontrar a política que maximize a recompensa acumulada esperada ao longo do tempo.

Algoritmos populares incluem Q-Learning (tabular), DQN (com redes neurais) e PPO (para espaços de ação contínuos). O RLHF — aprendizado por reforço com feedback humano — é a técnica por trás do ajuste fino de modelos como este.`,
  },
];

export const MOCK_PROMPT =
  "Explique aprendizado por reforço em termos simples, como se eu fosse um estudante de graduação.";
