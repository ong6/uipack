import { objectDirections, objectScenes } from "../src/objects";
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
  ...objectDirections.map((direction, variant) => ({
    id: direction.id, name: direction.name, description: direction.description,
    tokens: variant === 0 ? 'src/objects/objects.css' : variant < 3 ? 'src/objects/art-directions.ts' : 'src/objects/expanded-directions.ts',
    guidance: 'docs/objects.md', variant,
  })),
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

/** Each style has six real rendered examples, reachable through the gallery's selector. */
export const objectStyleEntries = objectDirections.flatMap((direction, variant) =>
  objectScenes.filter(scene => scene.id !== 'contact').map(scene => ({
    id: `${scene.id}-${direction.id}`, title: `${scene.title} / ${direction.name}`,
    type: 'animations' as const, styleId: direction.id,
    tags: ['Objects', direction.id], href: `/animations?story=${scene.id}&variant=${variant}`,
  })));

objectStyleEntries.push(...([{variant:3, styleId:'cartoon', title:'Little post office'}, {variant:4, styleId:'kinetic', title:'Correspondence mobile'}] as const).map(item=>({
  id:`contact-${item.styleId}`,title:`Contact inbox / ${item.title}`,type:'animations' as const,styleId:item.styleId,
  tags:['Objects',item.styleId],href:`/animations?story=contact&variant=${item.variant}`,
})));
