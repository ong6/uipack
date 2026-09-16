export type { Item, FigureMeta, PresetParts, StackStep } from "./shared";
export { Stack, stackHeight, toFigure, NARROW_W } from "./shared";
export { serviceMap, serviceMapParts, defaultServiceMap, type ServiceMapSpec } from "./serviceMap";
export { agentLoop, agentLoopParts, defaultAgentLoop, type AgentLoopSpec } from "./agentLoop";
export { ragPipeline, ragPipelineParts, defaultRagPipeline, type RagPipelineSpec } from "./ragPipeline";
export { skillLifecycle, skillLifecycleParts, defaultSkillLifecycle, type SkillLifecycleSpec } from "./skillLifecycle";
export { syncLoop, syncLoopParts, defaultSyncLoop, type SyncLoopSpec } from "./syncLoop";
export { beforeAfter, beforeAfterParts, defaultBeforeAfter, type BeforeAfterSpec, type BeforeAfterPanel } from "./beforeAfter";
export { pipeline, pipelineParts, defaultPipeline, type PipelineSpec } from "./pipeline";

import { serviceMap, defaultServiceMap } from "./serviceMap";
import { agentLoop, defaultAgentLoop } from "./agentLoop";
import { ragPipeline, defaultRagPipeline } from "./ragPipeline";
import { skillLifecycle, defaultSkillLifecycle } from "./skillLifecycle";
import { syncLoop, defaultSyncLoop } from "./syncLoop";
import { beforeAfter, defaultBeforeAfter } from "./beforeAfter";
import { pipeline, defaultPipeline } from "./pipeline";

/** Every preset with its default spec, for catalogues and tests. */
export const PRESETS = {
  serviceMap: { render: serviceMap, spec: defaultServiceMap, name: "Service map" },
  agentLoop: { render: agentLoop, spec: defaultAgentLoop, name: "Agent loop" },
  ragPipeline: { render: ragPipeline, spec: defaultRagPipeline, name: "RAG pipeline" },
  skillLifecycle: { render: skillLifecycle, spec: defaultSkillLifecycle, name: "Skill lifecycle" },
  syncLoop: { render: syncLoop, spec: defaultSyncLoop, name: "Sync loop" },
  beforeAfter: { render: beforeAfter, spec: defaultBeforeAfter, name: "Before and after" },
  pipeline: { render: pipeline, spec: defaultPipeline, name: "Pipeline" },
} as const;

export type PresetName = keyof typeof PRESETS;
