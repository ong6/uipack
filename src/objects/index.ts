// uipack/objects: lazy 3D objects, their curated variations, the gallery and the inspector.
// Every export is listed by name, so a new module cannot shadow or collide with an existing name.
export { ObjectDirectionPicker, ObjectScene, objectPalettes, type ObjectSceneProps } from "./ObjectScene";
export { objectScenes } from "./scene-list";
export { AnimationWorkspace, ObjectGallery, ObjectInspector } from "./gallery";
export {
  chooseObjectVariant,
  directionSymbols,
  hasObjectLook,
  normalizeObjectVariant,
  objectDirectionIndex,
  objectDirections,
  objectEditions,
  objectLooks,
  objectVariants,
  parseObjectVariant,
  transferObjectVariant,
  type KindWithLook,
  type ObjectEdition,
  type ObjectVariant,
} from "./variants";
export type { ObjectKind, ObjectPalette } from "./scenes";
