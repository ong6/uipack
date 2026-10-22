import type { ReactNode } from "react";
import { Callout, ChangeNote, LayerHead, LinkList, NoteCluster, TermList, type NoteCardProps } from "../src/article";

/* Example content for uipack/article: the Inference and Harness sections of
   "The AI stack, one constraint per layer" (notes.junxiong.dev/ai-stack-roadmap),
   and cards for the author's other published articles, from their front
   matter. The playground and the static e2e fixtures render the same data. */

const SITE = "https://notes.junxiong.dev";

/** The author's published articles, keyed by slug. Minutes use the site's reading-time rule. */
export const notes = {
  prefillVsDecode: {
    href: `${SITE}/prefill-vs-decode`,
    kicker: "Inference",
    title: "Prefill and decode want different machines",
    description: "LLM inference has two phases with opposite bottlenecks. Which one you care about decides what hardware to buy.",
    date: "2026-08-30",
    minutes: 7,
  },
  quantization: {
    href: `${SITE}/quantization-what-it-costs`,
    kicker: "Inference",
    title: "What changes when you quantize a model",
    description:
      "How quantization changes model size, speed and answers, and why weight memory and KV-cache memory need separate budgets.",
    date: "2026-08-28",
    minutes: 10,
  },
  promptCaching: {
    href: `${SITE}/prompt-caching-across-harnesses`,
    kicker: "Gateways",
    title: "Why the same prompt can cost more on the next request",
    description:
      "How prefix caching actually bills, what silently breaks it, and a worked cost example across Claude Code, Codex, Cursor and the raw API.",
    date: "2026-08-29",
    minutes: 8,
  },
  localHardware: {
    href: `${SITE}/local-inference-hardware`,
    kicker: "Chips and memory",
    title: "How I think about hardware for local models",
    description:
      "Bandwidth, capacity, KV cache and MoE active parameters — the four numbers that decide local inference hardware, with sources.",
    date: "2026-08-31",
    minutes: 7,
  },
  contextEngineering: {
    href: `${SITE}/context-engineering-for-coding-agents`,
    kicker: "Harness",
    title: "Where your tokens actually go in a coding agent",
    description:
      "How files and tool output fill a coding agent's context, what long-context studies show, and how I would keep a session focused.",
    date: "2026-09-01",
    minutes: 10,
  },
  agentIntegrations: {
    href: `${SITE}/agent-integrations-in-large-orgs`,
    kicker: "Harness",
    title: "How agent integrations get built inside large organisations",
    description:
      "Registries, auth brokering, generated tool schemas and the org failure modes that stall internal agent platforms — grounded in public specs.",
    date: "2026-09-02",
    minutes: 9,
  },
  opusOrchestrating: {
    href: `${SITE}/opus-orchestrating-gpt-agents`,
    kicker: "Evals",
    title: "Opus orchestrated, GPT agents built, and nobody graded their own work",
    description:
      "How Claude Opus ran GPT-5.6 coding agents through a nine-hour build, and why the quality came from reviewers, not from the workers' self-scores.",
    date: "2026-10-03",
    minutes: 7,
  },
} satisfies Record<string, NoteCardProps>;

/** A planned card, to show the state; the title is a placeholder, not a published article. */
export const plannedNote: NoteCardProps = {
  status: "planned",
  kicker: "Harness",
  title: "Sandboxes instead of permission prompts",
  description: "Placeholder for a planned note: what a sandbox has to enforce once people approve almost every prompt.",
};

const a = (href: string, text: ReactNode) => <a href={href}>{text}</a>;

export const inference = {
  head: { index: 8, zone: "Serving and product", metric: { value: "~10 GB", label: "KV cache, one 32k chat" } },
  title: "Inference",
  paragraphs: [
    <>
      Every new token re-reads the active weights plus that conversation's KV cache. Batching shares the weight read across every
      request in the batch, which is why hosted tokens are cheap, but each conversation's cache is its own. Llama 3 70B's cache is
      about 320 KiB per token at FP16, so a 32k-token conversation holds about 10 GB, and a few long agent sessions can fill a GPU
      by themselves. I did that arithmetic in {a(`${SITE}/prefill-vs-decode`, "prefill vs decode")}. Nearly every technique in
      this layer moves fewer bytes per useful token.
    </>,
    <>
      The list is long, and it all serves that goal: paged KV memory, prefix caching, quantisation, speculative decoding, sparse
      attention, and running prefill and decode on separate machines. The DistServe authors wrote in late 2025 that "almost every
      production-grade" serving framework now splits the two phases (
      {a("https://hao-ai-lab.github.io/blogs/distserve-retro/", "retrospective")}).
    </>,
  ],
  terms: [
    "prefill vs decode, TTFT vs TPOT",
    "KV cache and PagedAttention",
    "continuous batching",
    "prefix caching",
    "quantisation",
    "speculative decoding",
    "disaggregated serving",
    "cost per task",
  ],
  changed: (
    <>
      The KV cache became a storage tier. In early 2025, 56.3% of DeepSeek's daily input tokens hit an on-disk KV cache (
      {a(
        "https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md",
        "DeepSeek",
      )}
      ), and vLLM now offloads KV to host memory, files and peers (
      {a("https://vllm.ai/blog/2026-09-10-tiered-kv-offloading", "vLLM")}). The engines became companies: vLLM's creators raised a
      $150M seed as Inferact in January 2026 (
      {a("https://techcrunch.com/2026/01/22/inference-startup-inferact-lands-150m-to-commercialize-vllm/", "TechCrunch")}). And
      the price per token keeps falling at fixed capability, 9–900× a year by Epoch's count (
      {a("https://epoch.ai/data-insights/llm-inference-price-trends", "Epoch")}), while the cost of running frontier models rises
      3–18× a year ({a("https://arxiv.org/abs/2511.23455", "MIT FutureTech")}). So I budget per task, not per token.
    </>
  ),
  selftest: "Why does one 32k-token conversation reduce how many users a GPU can serve at once?",
  links: [
    { href: "https://arxiv.org/abs/2309.06180", title: "The PagedAttention paper" },
    {
      href: "https://jax-ml.github.io/scaling-book/inference/",
      title: (
        <>
          The inference chapter of <em>How to Scale Your Model</em>
        </>
      ),
    },
  ],
  cluster: {
    label: "My notes on serving and product",
    notes: [notes.prefillVsDecode, notes.quantization, notes.promptCaching, notes.localHardware],
  },
};

export const harness = {
  head: { index: 9, zone: "Serving and product", metric: { value: "150k → 2k", label: "tokens, one MCP workflow" } },
  title: "Harness",
  paragraphs: [
    <>
      A model acts only on what is in its context window, and its recall over that window degrades as the window fills. Chroma
      measured the degradation across 18 models, even on simple tasks ({a("https://research.trychroma.com/context-rot", "Chroma")}
      ). The harness is the loop around the model, and its real job is choosing which tokens go in. It loads instructions and tool
      definitions only when needed, retrieves just in time, compacts or resets, and hands subtasks to subagents with clean
      windows. Anthropic's code-execution approach to MCP cut one workflow from 150,000 tokens to 2,000 (
      {a("https://www.anthropic.com/engineering/code-execution-with-mcp", "Anthropic")}).
    </>,
    <>
      The second constraint is blast radius. An agent can damage whatever it can reach, and Anthropic reports that users approved
      about 93% of permission prompts ({a("https://www.anthropic.com/engineering/how-we-contain-claude", "Anthropic")}). Asking
      before every step stops working as a control, so sandboxes have to do that job instead.
    </>,
  ],
  terms: [
    "the agent loop and tool calls",
    "context engineering, compaction and resets",
    "MCP and A2A",
    "progressive disclosure (Agent Skills, AGENTS.md)",
    "subagents",
    "sandboxes and permissions",
    "memory",
  ],
  changed: (
    <>
      MCP and AGENTS.md moved to the Linux Foundation's Agentic AI Foundation in December 2025 (
      {a(
        "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation",
        "Linux Foundation",
      )}
      ). MCP's July 2026 spec dropped session state from its core (
      {a("https://blog.modelcontextprotocol.io/posts/2026-07-28/", "MCP")}). Harnesses also became hosted products, from Claude
      Managed Agents ({a("https://www.anthropic.com/engineering/managed-agents", "Anthropic")}) to OpenAI's dots (
      {a("https://openai.com/index/introducing-dots/", "OpenAI")}).
    </>
  ),
  selftest: "Why can giving an agent more tools make it worse at its task?",
  links: [
    {
      href: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
      title: "Effective context engineering, Anthropic",
    },
  ],
  cluster: {
    label: "My notes on agents and harnesses",
    notes: [notes.contextEngineering, notes.agentIntegrations, notes.opusOrchestrating],
  },
};

type Section = typeof inference;

/**
 * One layer section composed from the parts, the way the article would use
 * them: strip, heading, the prose, then the labelled blocks. `wide` breaks
 * the cluster out to the 56rem figure slot.
 */
export function LayerSection({
  section,
  id,
  mapHref,
  wide,
  headingLevel = 3,
}: {
  section: Section;
  id: string;
  mapHref?: string;
  wide?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <>
      <LayerHead {...section.head} mapHref={mapHref} />
      <Heading id={id}>{section.title}</Heading>
      {section.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <TermList terms={section.terms} />
      <ChangeNote kicker="2025–26">{section.changed}</ChangeNote>
      <Callout kind="selftest">{section.selftest}</Callout>
      <LinkList links={section.links} />
      <NoteCluster label={section.cluster.label} notes={section.cluster.notes} wide={wide} />
    </>
  );
}
