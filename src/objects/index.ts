// uipack/objects: lazy 3D objects, their curated variations, the gallery and the inspector.
// Every export is listed by name, so a new module cannot shadow or collide with an existing name.
export { ObjectDirectionPicker, ObjectScene, objectPalettes, objectScenes, type ObjectSceneProps } from "./ObjectScene";
export { AnimationWorkspace, ObjectGallery, ObjectInspector } from "./gallery";
export {
  chooseObjectVariant,
  directionSymbols,
  normalizeObjectVariant,
  objectDirectionIndex,
  objectDirections,
  objectEditions,
  objectVariants,
  parseObjectVariant,
  transferObjectVariant,
  type ObjectEdition,
  type ObjectVariant,
} from "./variants";
export type { ObjectKind, ObjectPalette } from "./scenes";
