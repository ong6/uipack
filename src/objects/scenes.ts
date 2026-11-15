// The subject registry: which builder draws each kind, and freeing a built subject. Every subject
// is drawn in ink line art (ink.ts); a builder returns a THREE.Group whose parts carry their ink
// roles (src/objects/LOOK.md, "Adding a subject").
import type * as THREE from "three";
import { contact, tennis, trading, server, travel } from "./studio";
import { ai } from "./studio-ai";
import { reading } from "./studio-reading";

export type ObjectKind = "ai" | "contact" | "tennis" | "trading" | "server" | "travel" | "reading";

/** Builds one subject (called with no arguments; an optional palette parameter is fine). */
export type SubjectBuilder = () => THREE.Group;

const builders: Record<ObjectKind, SubjectBuilder | null> = {
  contact,
  tennis,
  trading,
  server,
  travel,
  ai,
  reading,
};

/** Build a kind's subject at its first frame, or null when it has none yet. */
export function createObject(kind: ObjectKind): THREE.Group | null {
  const build = builders[kind];
  if (!build) return null;
  const object = build();
  object.userData.style ??= "ink";
  object.userData.animate?.(0);
  return object;
}

/** Every texture a material holds: its own maps and, for a shader, its uniforms'. */
function texturesOf(material: THREE.Material) {
  const found: THREE.Texture[] = [];
  const consider = (value: unknown) => {
    if ((value as THREE.Texture | null)?.isTexture) found.push(value as THREE.Texture);
  };
  for (const value of Object.values(material)) consider(value);
  const uniforms = (material as THREE.ShaderMaterial).uniforms;
  if (uniforms) for (const uniform of Object.values(uniforms)) consider(uniform?.value);
  return found;
}

/** Free every GPU resource under a subject: geometries, materials and their textures. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((item) => item.userData.dispose?.());
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  root.traverse((item) => {
    const drawable = item as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material)
      for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) {
        materials.add(material);
        for (const texture of texturesOf(material)) textures.add(texture);
      }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
