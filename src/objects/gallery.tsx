import type { ReactNode } from "react";
import { ObjectScene, objectScenes, type ObjectKind, type ObjectPalette } from "./index";
import { objectDirectionIndex, normalizeObjectVariant, transferObjectVariant, objectDirections, objectEditions, directionSymbols, type ObjectEdition, type ObjectVariant } from "./variants";

/** One scene library, one mounted preview, one context panel. Consumers own routing. */
export function AnimationWorkspace({ library, children, theme = 'light' }: { library: ReactNode; children: ReactNode; theme?: 'light' | 'dark' }) {
  return <div className="uipack-animation-workspace" data-theme={theme}>
    <aside className="uipack-animation-library">{library}</aside>
    <div className="uipack-animation-detail">{children}</div>
  </div>;
}
export function ObjectInspector({ kind, variant, edition = 0, onVariantChange, onEditionChange }: {
  kind: ObjectKind; variant: ObjectVariant; edition?: ObjectEdition;
  onVariantChange: (value: ObjectVariant) => void; onEditionChange: (value: ObjectEdition) => void;
}) {
  variant = normalizeObjectVariant(kind, variant);
  const contact = kind === 'contact';
  return <aside className="uipack-object-inspector">
    {<><h3>Art direction</h3><div role="group" aria-label="3D art direction" className="uipack-direction-list">
      {objectDirections.map((direction, index) => ({direction, index})).filter(({index}) => !contact || [0,2,3].includes(index)).map(({direction, index}) => <button type="button" key={direction.id} aria-label={direction.name} aria-pressed={objectDirectionIndex(kind, variant) === index} onClick={() => onVariantChange((contact && index === 2 ? 4 : index) as ObjectVariant)}>
        <span className="uipack-direction-symbol" aria-hidden="true">{directionSymbols[index]}</span>
        <span><strong>{direction.name}</strong><small>{direction.description}</small></span>
      </button>)}
    </div></>}
    {(contact ? variant < 3 : variant === 0) && <label className="uipack-edition-select">{contact ? 'Inbox edition' : 'Studio edition'}
      <select value={contact ? variant % 3 : edition} onChange={e => (contact ? onVariantChange : onEditionChange)(Number(e.target.value) as ObjectEdition)}>
        {objectEditions[kind].map((name, index) => <option value={index} key={name}>{name}</option>)}
      </select><small>{contact ? 'Three original inbox finishes.' : 'The original looks, kept together in Studio.'}</small>
    </label>}
  </aside>;
}
export function ObjectGallery({ kind, variant = 0, edition = 0, theme = 'light', palette, onChange }: {
  kind: ObjectKind; variant?: ObjectVariant; edition?: ObjectEdition; theme?: 'light' | 'dark'; palette?: ObjectPalette;
  onChange: (kind: ObjectKind, variant: ObjectVariant, edition: ObjectEdition) => void;
}) {
  variant = normalizeObjectVariant(kind, variant);
  const scene = objectScenes.find(item => item.id === kind)!;
  return <AnimationWorkspace theme={theme} library={<><h3>Object library</h3><nav aria-label="Choose an object" className="uipack-scene-list">{objectScenes.map(item => <button type="button" key={item.id} aria-pressed={kind === item.id} onClick={() => onChange(item.id, transferObjectVariant(kind, item.id, variant), edition)}>{item.title}<span aria-hidden="true">↗</span></button>)}</nav></>}>
    <header className="uipack-animation-heading"><h3>{scene.title}</h3><span>Live 3D preview</span></header>
    <div className="uipack-object-review"><div className="uipack-gallery-stage"><ObjectScene key={kind} kind={kind} label={scene.title} variant={variant} edition={edition} theme={theme} palette={palette} /></div>
      <ObjectInspector kind={kind} variant={variant} edition={edition} onVariantChange={value => onChange(kind, value, edition)} onEditionChange={value => onChange(kind, variant, value)} />
    </div>
    <p className="uipack-gallery-description">{objectDirectionIndex(kind, variant) === 0 ? scene.description : objectDirections[objectDirectionIndex(kind, variant)].description}</p>
  </AnimationWorkspace>;
}
