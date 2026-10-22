/* Example data for SpanChart: companies placed on twelve layers of the AI
   stack. Placements are plausible editorial calls for a demo, not research.
   Logos are abstract local glyphs (data URIs), never third-party marks or
   hotlinked images; rows without one show the monogram tile. */
import type { LayerStackProps, SpanItem, SpanLayer, SpanTier, SpanZone } from "../src/charts";

export const aiStackZones: SpanZone[] = [
  { id: "infrastructure", label: "Infrastructure" },
  { id: "models", label: "Models" },
  { id: "serving", label: "Serving" },
  { id: "product", label: "Product" },
];

export const aiStackLayers: SpanLayer[] = [
  { id: "power", label: "Power and sites", short: "Power", abbr: "PWR", zone: "infrastructure" },
  { id: "chips", label: "Chips and memory", short: "Chips", abbr: "CHP", zone: "infrastructure" },
  { id: "systems", label: "Racks and networks", short: "Racks", abbr: "NET", zone: "infrastructure" },
  { id: "cloud", label: "Cloud and capital", short: "Cloud", abbr: "CLD", zone: "infrastructure" },
  { id: "data", label: "Data", short: "Data", abbr: "DAT", zone: "models" },
  { id: "pretraining", label: "Pretraining", short: "Pretrain", abbr: "PRE", zone: "models" },
  { id: "post-training", label: "Post-training", short: "Post-train", abbr: "PST", zone: "models" },
  { id: "inference", label: "Inference", short: "Inference", abbr: "INF", zone: "serving" },
  { id: "control", label: "Gateways and observability", short: "Gateway", abbr: "GWY", zone: "serving" },
  { id: "evals", label: "Evals", short: "Evals", abbr: "EVL", zone: "serving" },
  { id: "harness", label: "Harness", short: "Harness", abbr: "HRN", zone: "product" },
  { id: "apps", label: "Apps", short: "Apps", abbr: "APP", zone: "product" },
];

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${body}</svg>`)}`;
// Simple shapes in a brand-like colour. Several are dark glyphs on a
// transparent ground, the case the light logo tile exists for.
const glyph = {
  dot: (c: string) => svg(`<circle cx="10" cy="10" r="7" fill="${c}"/>`),
  ring: (c: string) => svg(`<circle cx="10" cy="10" r="6" fill="none" stroke="${c}" stroke-width="3"/>`),
  square: (c: string) => svg(`<rect x="3" y="3" width="14" height="14" rx="3" fill="${c}"/>`),
  tri: (c: string) => svg(`<path d="M10 3l7.5 13h-15z" fill="${c}"/>`),
  diamond: (c: string) => svg(`<path d="M10 2l8 8-8 8-8-8z" fill="${c}"/>`),
  bars: (c: string) => svg(`<path d="M3 4h4v12H3zM8 7h4v9H8zM13 10h4v6h-4z" fill="${c}"/>`),
  hex: (c: string) => svg(`<path d="M10 2l7 4v8l-7 4-7-4V6z" fill="none" stroke="${c}" stroke-width="2.5"/>`),
  spark: (c: string) => svg(`<path d="M10 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="${c}"/>`),
  slash: (c: string) =>
    svg(
      `<rect x="3" y="3" width="14" height="14" rx="3" fill="${c}"/><path d="M7 14l6-8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
    ),
  wave: (c: string) =>
    svg(`<path d="M2 12c3-6 5-6 8 0s5 6 8 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`),
  grid: (c: string) => svg(`<path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" fill="${c}"/>`),
  arc: (c: string) => svg(`<path d="M3 16a7 7 0 0 1 14 0" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`),
  plus: (c: string) => svg(`<path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5z" fill="${c}"/>`),
};

/** Size tiers, largest first. The consumer assigns them; the chart only shows and filters. */
export const aiStackTiers: SpanTier[] = [
  { id: "large", label: "Large", range: "$50B+" },
  { id: "mid", label: "Mid", range: "$5–50B" },
  { id: "small", label: "Small", range: "under $5B" },
  { id: "unsized", label: "Not sized", range: "no public figure" },
];

/* Rough market capitalisation or last reported private valuation, USD
   billions, for the demo only. Missing means undisclosed. */
const valuations: Record<string, number> = {
  crusoe: 13,
  constellation: 100,
  oklo: 15,
  nvidia: 4500,
  tsmc: 1500,
  amd: 350,
  cerebras: 8.1,
  groq: 6.9,
  "sk-hynix": 280,
  broadcom: 1600,
  arista: 170,
  coreweave: 60,
  amazon: 2400,
  microsoft: 3800,
  lambda: 4,
  scale: 29,
  mercor: 10,
  google: 3500,
  openai: 500,
  anthropic: 350,
  meta: 1800,
  mistral: 14,
  "hugging-face": 4.5,
  "thinking-machines": 12,
  fireworks: 4,
  together: 3.3,
  baseten: 2.2,
  modal: 1.1,
  openrouter: 0.5,
  braintrust: 0.8,
  wandb: 1.7,
  cursor: 29,
  cognition: 10.2,
  windsurf: 3,
  langchain: 1.25,
  elevenlabs: 6.6,
  perplexity: 20,
  runway: 3,
  character: 1,
};

const money = (billions: number) =>
  billions >= 1000
    ? `$${+(billions / 1000).toFixed(1)}T`
    : billions >= 1
      ? `$${+billions.toFixed(1)}B`
      : `$${Math.round(billions * 1000)}M`;
const tierOf = (billions: number) => (billions >= 50 ? "large" : billions >= 5 ? "mid" : "small");

const placements: SpanItem[] = [
  // Power and sites
  {
    id: "crusoe",
    name: "Crusoe",
    primary: "power",
    also: ["systems", "cloud"],
    featured: true,
    logo: glyph.tri("#e8590c"),
    href: "https://crusoe.ai",
    note: "Builds AI data centres on stranded and low-carbon power, then rents the GPUs inside them as a cloud.",
  },
  {
    id: "constellation",
    name: "Constellation Energy",
    primary: "power",
    tags: ["nuclear"],
    logo: glyph.arc("#1c7ed6"),
    href: "https://www.constellationenergy.com",
    note: "Sells nuclear power to hyperscalers under long-term contracts for data-centre load.",
  },
  {
    id: "oklo",
    name: "Oklo",
    primary: "power",
    tags: ["nuclear"],
    href: "https://oklo.com",
    note: "Designs small fast reactors pitched as on-site power for data centres.",
  },

  // Chips and memory
  {
    id: "nvidia",
    name: "Nvidia",
    primary: "chips",
    also: ["systems", "cloud", "data", "pretraining", "inference"],
    featured: true,
    logo: glyph.slash("#5e9e00"),
    href: "https://www.nvidia.com",
    note: "Sells the GPUs most models train and run on, plus the racks, networking, models and serving software around them.",
  },
  {
    id: "tsmc",
    name: "TSMC",
    primary: "chips",
    featured: true,
    logo: glyph.square("#c92a2a"),
    href: "https://www.tsmc.com",
    note: "Manufactures nearly every leading AI accelerator, including the advanced packaging that joins it to memory.",
  },
  {
    id: "amd",
    name: "AMD",
    primary: "chips",
    also: ["systems"],
    logo: glyph.diamond("#111111"),
    href: "https://www.amd.com",
    note: "Instinct accelerators and EPYC CPUs for training and inference clusters.",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    primary: "chips",
    also: ["systems", "inference"],
    logo: glyph.grid("#e8590c"),
    href: "https://www.cerebras.ai",
    note: "Wafer-scale chips sold as whole systems and as a fast inference cloud.",
  },
  {
    id: "groq",
    name: "Groq",
    primary: "chips",
    also: ["inference"],
    status: { kind: "licensed", label: "Nvidia, 2025" },
    logo: glyph.dot("#f76707"),
    href: "https://groq.com",
    note: "LPU chips for low-latency inference, served through its own cloud.",
  },
  {
    id: "sk-hynix",
    name: "SK hynix",
    primary: "chips",
    tags: ["memory"],
    logo: glyph.bars("#e03131"),
    href: "https://www.skhynix.com",
    note: "Leading supplier of the high-bandwidth memory stacked beside AI accelerators.",
  },

  // Racks and networks
  {
    id: "broadcom",
    name: "Broadcom",
    primary: "systems",
    also: ["chips"],
    logo: glyph.ring("#c92a2a"),
    href: "https://www.broadcom.com",
    note: "Ethernet switch silicon for AI clusters, and custom accelerators designed with hyperscalers.",
  },
  {
    id: "arista",
    name: "Arista Networks",
    primary: "systems",
    logo: glyph.wave("#1864ab"),
    href: "https://www.arista.com",
    note: "Switches and software for the back-end networks that link GPU clusters.",
  },

  // Cloud and capital
  {
    id: "coreweave",
    name: "CoreWeave",
    primary: "cloud",
    also: ["evals"],
    featured: true,
    logo: glyph.hex("#3b5bdb"),
    href: "https://www.coreweave.com",
    note: "GPU cloud for training and inference, and since buying Weights & Biases, the tools to track and evaluate runs.",
  },
  {
    id: "amazon",
    name: "Amazon",
    primary: "cloud",
    also: ["chips", "pretraining", "inference", "apps"],
    logo: glyph.arc("#111111"),
    href: "https://aws.amazon.com",
    note: "AWS rents compute and its own Trainium chips, hosts models in Bedrock and trains the Nova models.",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    primary: "cloud",
    also: ["chips", "inference", "harness", "apps"],
    logo: glyph.grid("#2f9e44"),
    href: "https://azure.microsoft.com",
    note: "Azure hosts frontier models; Maia chips sit below it and GitHub Copilot and Microsoft 365 Copilot above it.",
  },
  {
    id: "lambda",
    name: "Lambda",
    primary: "cloud",
    also: ["systems"],
    logo: glyph.tri("#5f3dc4"),
    href: "https://lambda.ai",
    note: "GPU cloud and on-premises clusters for training and inference.",
  },

  // Data
  {
    id: "scale",
    name: "Scale AI",
    primary: "data",
    also: ["evals"],
    featured: true,
    logo: glyph.plus("#111111"),
    href: "https://scale.com",
    note: "Labelled and expert-written data for post-training, plus evaluations and leaderboards.",
  },
  {
    id: "mercor",
    name: "Mercor",
    primary: "data",
    href: "https://mercor.com",
    note: "Recruits domain experts to write and grade the training data labs use for post-training.",
  },
  {
    id: "surge",
    name: "Surge AI",
    primary: "data",
    also: ["evals"],
    logo: glyph.wave("#d6336c"),
    href: "https://surgehq.ai",
    note: "Human preference data and evaluation for reinforcement learning from feedback.",
  },

  // Pretraining
  {
    id: "google",
    name: "Google",
    primary: "pretraining",
    also: ["chips", "cloud", "apps"],
    featured: true,
    logo: glyph.ring("#1c7ed6"),
    href: "https://deepmind.google",
    note: "Gemini models trained on its own TPUs, sold through Google Cloud and built into Search and Workspace.",
  },
  {
    id: "openai",
    name: "OpenAI",
    primary: "pretraining",
    also: ["post-training", "inference", "harness", "apps"],
    featured: true,
    logo: glyph.hex("#111111"),
    href: "https://openai.com",
    note: "Trains the GPT models and sells them through ChatGPT, Codex and its API.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    primary: "pretraining",
    also: ["post-training", "inference", "harness", "apps"],
    featured: true,
    logo: glyph.spark("#191919"),
    href: "https://www.anthropic.com",
    source: "https://docs.anthropic.com",
    note: "Trains the Claude models and sells them through the Claude apps, Claude Code and its API.",
  },
  {
    id: "meta",
    name: "Meta",
    primary: "pretraining",
    also: ["apps"],
    tags: ["open"],
    logo: glyph.wave("#1971c2"),
    href: "https://ai.meta.com",
    note: "Trains the Llama family and puts Meta AI in its consumer apps.",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    primary: "pretraining",
    also: ["post-training", "inference", "apps"],
    tags: ["open"],
    logo: glyph.bars("#f76707"),
    href: "https://mistral.ai",
    note: "Open-weight and commercial models with its own API and the Le Chat assistant.",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    primary: "pretraining",
    also: ["apps"],
    tags: ["open"],
    logo: glyph.dot("#3b5bdb"),
    href: "https://www.deepseek.com",
    note: "Publishes open-weight models trained at a low reported cost.",
  },

  // Post-training
  {
    id: "hugging-face",
    name: "Hugging Face",
    primary: "post-training",
    also: ["data", "inference", "evals"],
    featured: true,
    status: { kind: "pending", label: "Nvidia, 2026" },
    logo: glyph.dot("#f59f00"),
    href: "https://huggingface.co",
    source: "https://huggingface.co/docs",
    note: "The hub for open models and datasets, with the TRL library for fine-tuning and hosted inference.",
  },
  {
    id: "thinking-machines",
    name: "Thinking Machines Lab",
    primary: "post-training",
    also: ["pretraining"],
    href: "https://thinkingmachines.ai",
    note: "Tinker, its fine-tuning API, lets researchers post-train open-weight models without running the cluster.",
  },
  {
    id: "prime-intellect",
    name: "Prime Intellect",
    primary: "post-training",
    also: ["pretraining", "cloud"],
    href: "https://www.primeintellect.ai",
    note: "Decentralised training runs and an open hub of reinforcement-learning environments.",
  },

  // Inference
  {
    id: "fireworks",
    name: "Fireworks AI",
    primary: "inference",
    also: ["post-training"],
    featured: true,
    logo: glyph.spark("#7048e8"),
    href: "https://fireworks.ai",
    source: "https://docs.fireworks.ai",
    note: "Serverless and dedicated inference for open models, with fine-tuning on the same platform.",
  },
  {
    id: "together",
    name: "Together AI",
    primary: "inference",
    also: ["post-training", "cloud"],
    logo: glyph.square("#1c7ed6"),
    href: "https://www.together.ai",
    note: "Inference API for open models, plus GPU clusters and fine-tuning.",
  },
  {
    id: "baseten",
    name: "Baseten",
    primary: "inference",
    logo: glyph.diamond("#2f9e44"),
    href: "https://www.baseten.co",
    note: "Runs production inference for custom and open models.",
  },
  {
    id: "modal",
    name: "Modal",
    primary: "inference",
    also: ["cloud"],
    logo: glyph.square("#37b24d"),
    href: "https://modal.com",
    note: "Serverless GPUs for inference, batch jobs and sandboxes, billed by the second.",
  },

  // Gateways and observability
  {
    id: "openrouter",
    name: "OpenRouter",
    primary: "control",
    featured: true,
    status: { kind: "acquired", label: "Stripe, 2026" },
    logo: glyph.arc("#5c7cfa"),
    href: "https://openrouter.ai",
    source: "https://openrouter.ai/docs",
    note: "One API and one bill for hundreds of models, routing each request across providers.",
  },
  {
    id: "portkey",
    name: "Portkey",
    primary: "control",
    also: ["evals"],
    href: "https://portkey.ai",
    note: "AI gateway with routing, guardrails and request logs.",
  },
  {
    id: "langfuse",
    name: "Langfuse",
    primary: "control",
    also: ["evals"],
    logo: glyph.ring("#111111"),
    href: "https://langfuse.com",
    note: "Open-source tracing and prompt management for LLM apps.",
  },

  // Evals
  {
    id: "braintrust",
    name: "Braintrust",
    primary: "evals",
    also: ["control"],
    logo: glyph.tri("#111111"),
    href: "https://www.braintrust.dev",
    note: "Evals, datasets and production logs in one loop.",
  },
  {
    id: "wandb",
    name: "Weights & Biases",
    primary: "evals",
    also: ["post-training", "control"],
    status: { kind: "acquired", label: "CoreWeave, 2025" },
    logo: glyph.grid("#f59f00"),
    href: "https://wandb.ai",
    note: "Experiment tracking for training runs, and Weave for evaluating LLM apps.",
  },

  // Harness
  {
    id: "cursor",
    name: "Cursor",
    primary: "harness",
    also: ["post-training", "apps"],
    featured: true,
    logo: glyph.square("#111111"),
    href: "https://cursor.com",
    note: "AI code editor and agent that trains its own models for the agent loop.",
  },
  {
    id: "cognition",
    name: "Cognition",
    primary: "harness",
    also: ["post-training"],
    logo: glyph.hex("#495057"),
    href: "https://cognition.ai",
    note: "Devin, the autonomous software engineer, and since 2025 the Windsurf editor.",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    primary: "harness",
    status: { kind: "acquired", label: "Cognition, 2025" },
    logo: glyph.wave("#0ca678"),
    href: "https://windsurf.com",
    note: "AI code editor, bought by Cognition after Google hired its founders.",
  },
  {
    id: "langchain",
    name: "LangChain",
    primary: "harness",
    also: ["control", "evals"],
    logo: glyph.plus("#2f9e44"),
    href: "https://www.langchain.com",
    note: "Open-source agent frameworks, and LangSmith for tracing and evals.",
  },

  // Apps
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    primary: "apps",
    also: ["pretraining", "inference"],
    tags: ["voice"],
    featured: true,
    logo: glyph.bars("#111111"),
    href: "https://elevenlabs.io",
    note: "Voice models for speech, dubbing and agents, sold as apps and an API.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    primary: "apps",
    also: ["post-training"],
    logo: glyph.spark("#1098ad"),
    href: "https://www.perplexity.ai",
    note: "Answer engine and Comet browser, running its own post-trained Sonar models.",
  },
  {
    id: "runway",
    name: "Runway",
    primary: "apps",
    also: ["pretraining"],
    tags: ["video"],
    logo: glyph.tri("#212529"),
    href: "https://runwayml.com",
    note: "Trains its own video generation models and sells them through creative tools.",
  },
  {
    id: "character",
    name: "Character.AI",
    primary: "apps",
    also: ["pretraining", "post-training"],
    status: { kind: "licensed", label: "Google, 2024" },
    logo: glyph.dot("#212529"),
    href: "https://character.ai",
    note: "Companion chat app; Google licensed its models and hired its founders in 2024.",
  },
  {
    id: "builder",
    name: "Builder.ai",
    primary: "apps",
    status: { kind: "shutdown", label: "2025" },
    note: "AI-assisted app builder that entered insolvency in 2025.",
  },
];

export const aiStackItems: SpanItem[] = placements.map((item) => {
  const value = valuations[item.id];
  return value === undefined
    ? { ...item, valueLabel: "—", tier: "unsized" }
    : { ...item, value, valueLabel: money(value), tier: tierOf(value) };
});

export const aiStack = {
  id: "ai-stack",
  title: "Who builds which layer of the AI stack",
  caption:
    "Each row is a company; its bar covers the layers it works in, solid where its main business sits. Long bars are companies that span the stack. Tap a column heading or a chip to filter; open a row for details.",
  asOf: "2026-10",
  layers: aiStackLayers,
  zones: aiStackZones,
  tiers: aiStackTiers,
  items: aiStackItems,
  labels: { tagLegend: "focus" },
};

/** A synthetic set of `count` rows for scale tests: every row valid, a fixed share featured. */
export function syntheticStack(count: number): SpanItem[] {
  const ids = aiStackLayers.map((l) => l.id);
  return Array.from({ length: count }, (_, i) => {
    const primary = ids[i % ids.length];
    const p = i % ids.length;
    const also = ids.filter((_, k) => k !== p && (k * 7 + i) % 5 === 0);
    return {
      id: `co-${i}`,
      name: `Company ${String(i + 1).padStart(3, "0")}`,
      primary,
      also,
      featured: i % 6 === 0,
      note: "Synthetic row.",
      value: (i * 37) % 900,
      valueLabel: `$${(i * 37) % 900}B`,
      tier: tierOf((i * 37) % 900),
    };
  });
}

/* LayerStack example: the same stack walked bottom-up as ten bands, with
   gateways and evals drawn as rails beside it and safety across all of it.
   Metrics are illustrative figures for the demo. */
export const aiStackDiagram: LayerStackProps = {
  id: "ai-stack-layers",
  title: "The AI stack, bottom up",
  caption:
    "Ten layers from the power grid to the apps people use, each with the constraint it lives under. Each band links to its section.",
  zones: [
    { id: "infrastructure", label: "Infrastructure", note: "shared by building and serving" },
    { id: "models", label: "Models", note: "built once per model" },
    { id: "serving", label: "Serving and product", note: "run on every request" },
  ],
  layers: [
    {
      id: "power",
      label: "Power and sites",
      zone: "infrastructure",
      summary: "Grid hookups and permits now pace new clusters.",
      href: "#power",
    },
    {
      id: "chips",
      label: "Chips and memory",
      zone: "infrastructure",
      summary: "Memory bandwidth and packaging bind accelerators.",
      href: "#chips",
    },
    {
      id: "systems",
      label: "Racks and networks",
      zone: "infrastructure",
      summary: "Thousands of GPUs must act as one machine.",
      href: "#systems",
    },
    {
      id: "cloud",
      label: "Cloud and capital",
      zone: "infrastructure",
      summary: "Someone funds the hardware before any model trains.",
      href: "#cloud",
    },
    {
      id: "data",
      label: "Data",
      zone: "models",
      summary: "Public web text is largely used up; experts fill the gap.",
      href: "#data",
    },
    {
      id: "pretraining",
      label: "Pretraining",
      zone: "models",
      summary: "One run takes months on a whole cluster.",
      href: "#pretraining",
    },
    {
      id: "post-training",
      label: "Post-training",
      zone: "models",
      summary: "Fine-tuning and RL turn a base model into an assistant.",
      href: "#post-training",
    },
    {
      id: "inference",
      label: "Inference",
      zone: "serving",
      summary: "Every request costs compute; price per token sets the margin.",
      href: "#inference",
    },
    {
      id: "harness",
      label: "Harness",
      zone: "serving",
      summary: "Tools, memory and permissions turn a model into an agent.",
      href: "#harness",
    },
    {
      id: "apps",
      label: "Apps",
      zone: "serving",
      summary: "Distribution and workflow fit matter more than the model.",
      href: "#apps",
    },
  ],
  rails: [
    {
      id: "gateways",
      label: "Gateways and observability",
      short: "Gateways",
      from: "inference",
      to: "apps",
      summary: "Route, log and meter every model call across providers.",
      href: "#gateways",
    },
    {
      id: "evals",
      label: "Evals",
      from: "post-training",
      to: "apps",
      summary: "Measure whether a change made the model or the product better.",
      href: "#evals",
    },
    {
      id: "safety",
      label: "Safety",
      from: "power",
      to: "apps",
      summary: "Security and safety work that runs through every layer, from site access to model behaviour.",
      href: "#safety",
    },
  ],
};
