import { objectScenes } from "../src/objects";
/** Content type and visual style are independent axes. Register styles here, never fork the shell. */
export const visualStyles = [
  {
    id: "technical",
    name: "Technical",
    description:
      "Precise system diagrams, restrained colour, directional motion, and clear labels.",
    tokens: "src/theme.css",
    guidance: "docs/design-direction.md",
  },
] as const;
export const libraryPages = [
  { id: "figures", label: "Figures", path: "/" },
  { id: "assets", label: "Assets", path: "/assets" },
  { id: "animations", label: "3D animations", path: "/animations" },
  { id: "presentations", label: "Presentations", path: "/presentations" },
  { id: "styles", label: "Styles", path: "/styles" },
] as const;
export type LibraryPage = (typeof libraryPages)[number]["id"];
export interface CatalogEntry {
  id: string;
  title: string;
  type: LibraryPage;
  styleId: string;
  tags: string[];
}
export const animationEntries: CatalogEntry[] = [
  ...objectScenes.map((scene) => ({
    id: scene.id,
    title: scene.title,
    type: "animations" as const,
    styleId: "technical",
    tags: ["Objects", "Transform"],
  })),
  {
    id: "harness-dive",
    title: "Harness dive",
    type: "animations",
    styleId: "technical",
    tags: ["Camera", "Agents"],
  },
  {
    id: "retrieval-layers",
    title: "Retrieval layers",
    type: "animations",
    styleId: "technical",
    tags: ["Layers", "Data"],
  },
  {
    id: "parallel-agents",
    title: "Parallel agents",
    type: "animations",
    styleId: "technical",
    tags: ["Transform", "Agents"],
  },
  {
    id: "quarter-turn",
    title: "Quarter turn",
    type: "animations",
    styleId: "technical",
    tags: ["Camera", "Architecture"],
  },
  {
    id: "staged-assembly",
    title: "Staged assembly",
    type: "animations",
    styleId: "technical",
    tags: ["Layers", "Architecture"],
  },
  {
    id: "architecture-shift",
    title: "Before / after",
    type: "animations",
    styleId: "technical",
    tags: ["Transform", "Architecture"],
  },
];
