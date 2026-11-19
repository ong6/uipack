// uipack/objects: lazy 3D object scenes, each drawn in ink line art in the page's own colours, the
// player and the gallery. Every export is listed by name, so a new module cannot shadow or collide
// with an existing name.
export { ObjectScene, type ObjectSceneProps, type ObjectSceneSubject } from "./ObjectScene";
export { objectScenes } from "./scene-list";
export { AnimationWorkspace, ObjectGallery } from "./gallery";
export type { ObjectKind } from "./scenes";
