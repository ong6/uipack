import * as react from 'react';
import { ReactNode } from 'react';

type ObjectKind = "ai" | "contact" | "tennis" | "trading" | "server" | "travel" | "reading";
interface ObjectPalette {
    paper: number;
    ink: number;
    muted: number;
    accent: number;
}

/** Curated looks. Numeric IDs stay stable for screenshots and consumer previews. */
type ObjectEdition = 0 | 1 | 2;
type ObjectVariant = ObjectEdition | 3 | 4 | 5;
declare const objectDirections: readonly [{
    readonly id: "studio";
    readonly name: "Studio objects";
    readonly description: "Product photography: one object on a seamless sweep, soft light, a low lens.";
}, {
    readonly id: "paper-theatre";
    readonly name: "Paper worlds";
    readonly description: "Cut-card toy theatres: layered flats in a proscenium under one warm light.";
}, {
    readonly id: "kinetic";
    readonly name: "Kinetic sculptures";
    readonly description: "Brass armatures and glazed ceramic turning on a slate base.";
}, {
    readonly id: "cartoon";
    readonly name: "Cartoon worlds";
    readonly description: "Floating toy islands with toon shading, by day and by night.";
}, {
    readonly id: "realistic";
    readonly name: "Realistic close‑ups";
    readonly description: "Low close-ups on real surfaces under grazing window light.";
}, {
    readonly id: "abstract";
    readonly name: "Abstract forms";
    readonly description: "Refractive glass against bands of colour, lit from behind at night.";
}];
/**
 * The looks each subject offers, best first: the single source of truth for what the player, the
 * gallery and the catalog show. A subject keeps the two or three directions that suit it (from
 * blind per-direction reviews; docs/objects.md, "Directions per subject"). Its first look is its
 * default, shown whenever a requested variant is one the subject does not have. Contact keeps its
 * original numeric IDs: 0–2 are Studio inbox editions and 3 is Cartoon.
 */
declare const lookTable: {
    readonly ai: readonly [readonly [2, "Kinetic · Neural orrery"], readonly [5, "Abstract · Thought lattice"], readonly [3, "Cartoon · Night workshop"]];
    readonly contact: readonly [readonly [0, "Signature inbox"], readonly [1, "Blue inbox"], readonly [2, "Terracotta inbox"], readonly [3, "Cartoon · Little post office"]];
    readonly tennis: readonly [readonly [4, "Realistic · Match point"], readonly [3, "Cartoon · Courtside club"], readonly [0, "Studio · Club rally"]];
    readonly trading: readonly [readonly [2, "Kinetic · Market balance"], readonly [5, "Abstract · Risk rhythm"], readonly [0, "Studio · Market abacus"]];
    readonly server: readonly [readonly [4, "Realistic · Hot swap"], readonly [0, "Studio · Inference hardware"]];
    readonly travel: readonly [readonly [0, "Studio · Folded atlas"], readonly [1, "Paper · Alpine passage"], readonly [2, "Kinetic · Armillary globe"]];
    readonly reading: readonly [readonly [4, "Realistic · Quiet chapter"], readonly [3, "Cartoon · Reading nook"], readonly [1, "Paper · A world inside"]];
};
type LookTable = typeof lookTable;
/** The kinds that offer variant `V`. Each direction keys its builders by it, so none is missing or extra. */
type KindWithLook<V extends ObjectVariant> = {
    [K in ObjectKind]: V extends LookTable[K][number][0] ? K : never;
}[ObjectKind];
/** Each kind's available variants, its default first. */
declare const objectLooks: Record<ObjectKind, readonly ObjectVariant[]>;
/** Each kind's look names by variant ID; only the looks it offers have one. */
declare const objectVariants: Record<ObjectKind, Partial<Record<ObjectVariant, string>>>;
/**
 * One of the kind's looks for a random value in [0, 1), then `step` looks further on in its list
 * (Another look). Deterministic for a given `random`.
 */
declare function chooseObjectVariant(kind: ObjectKind, random?: () => number, step?: number): ObjectVariant;
/** Original Studio editions, independent of art direction, for the kinds that offer Studio. */
declare const objectEditions: Record<KindWithLook<0>, readonly [string, string, string]>;
declare const directionSymbols: readonly ["◒", "▱", "◎", "▧", "◉", "◇"];
/** A variant ID from a URL or attribute; anything else is 0. Pass it through `normalizeObjectVariant` for a kind. */
declare function parseObjectVariant(value: string | null | undefined): ObjectVariant;
/** Whether `kind` offers `variant`; narrows the kind for a direction's builders. */
declare function hasObjectLook<V extends ObjectVariant>(kind: ObjectKind, variant: V): kind is KindWithLook<V>;
/** The shared art direction (an index into `objectDirections`) a variant draws: contact's 0–2 are Studio editions. */
declare function objectDirectionIndex(kind: ObjectKind, variant: ObjectVariant): ObjectVariant;
/** The variant itself when the kind offers it, otherwise the kind's default (its first look). */
declare function normalizeObjectVariant(kind: ObjectKind, variant: ObjectVariant): ObjectVariant;
/** Carries a look to another kind: the same direction when that kind has it, otherwise its default. */
declare function transferObjectVariant(from: ObjectKind, to: ObjectKind, variant: ObjectVariant): ObjectVariant;

interface ObjectSceneProps {
    kind: ObjectKind;
    label: string;
    active?: boolean;
    theme?: "light" | "dark";
    palette?: ObjectPalette;
    /** Compact embeds can keep playback while leaving gallery controls to the library page. */
    controls?: "full" | "playback";
    /** Reveal the host page behind the artwork, in either theme. */
    surface?: "styled" | "page";
    /**
     * Pick once per mount from the kind's looks (`objectLooks`), or pin one for a reproducible
     * preview. A variant the kind does not offer shows its default look.
     */
    variant?: ObjectVariant | "random";
    /** Original edition within Studio; ignored by the other directions. */
    edition?: ObjectEdition;
    /**
     * Where Studio tennis fetches its model. Default: the package's
     * `assets/objects/tennis-return.glb`, which the bundler copies and rewrites. Set it when
     * you serve the file yourself (a CDN, a bundler without `new URL(…, import.meta.url)`, CommonJS).
     */
    modelUrl?: string;
}
/** The Studio scenes' material palette per theme (src/styles/scene-palettes.ts). */
declare const objectPalettes: {
    light: {
        paper: number;
        ink: number;
        muted: number;
        accent: number;
    };
    dark: {
        paper: number;
        ink: number;
        muted: number;
        accent: number;
    };
};
/** Framework-independent player. The scene is mounted once, including in Open canvas. */
declare function ObjectScene(props: ObjectSceneProps): react.JSX.Element;
/**
 * Shared style selector; consumers own the selected value and URL persistence. With `kind`, it
 * offers only that kind's looks (`objectLooks`); without, every direction, for a set of scenes
 * (each scene shows its own default for a direction it lacks).
 */
declare function ObjectDirectionPicker({ value, onChange, kind, }: {
    value: ObjectVariant | "random";
    onChange: (value: ObjectVariant) => void;
    kind?: Exclude<ObjectKind, "contact">;
}): react.JSX.Element;

/** The object scenes, in gallery order: plain data, so a catalog can list them without loading the 3D code. */
declare const objectScenes: {
    id: ObjectKind;
    title: string;
    description: string;
}[];

/** One scene library, one mounted preview, one context panel. Consumers own routing. */
declare function AnimationWorkspace({ library, children, theme, }: {
    library: ReactNode;
    children: ReactNode;
    theme?: "light" | "dark";
}): react.JSX.Element;
declare function ObjectInspector({ kind, variant: requested, edition, onVariantChange, onEditionChange, }: {
    kind: ObjectKind;
    variant: ObjectVariant;
    edition?: ObjectEdition;
    onVariantChange: (value: ObjectVariant) => void;
    onEditionChange: (value: ObjectEdition) => void;
}): react.JSX.Element;
declare function ObjectGallery({ kind, variant: requested, edition, theme, palette, modelUrl, onChange, }: {
    kind: ObjectKind;
    variant?: ObjectVariant;
    edition?: ObjectEdition;
    theme?: "light" | "dark";
    palette?: ObjectPalette;
    /** Passed to `ObjectScene`: where Studio tennis fetches its model. */
    modelUrl?: string;
    onChange: (kind: ObjectKind, variant: ObjectVariant, edition: ObjectEdition) => void;
}): react.JSX.Element;

export { AnimationWorkspace, type KindWithLook, ObjectDirectionPicker, type ObjectEdition, ObjectGallery, ObjectInspector, type ObjectKind, type ObjectPalette, ObjectScene, type ObjectSceneProps, type ObjectVariant, chooseObjectVariant, directionSymbols, hasObjectLook, normalizeObjectVariant, objectDirectionIndex, objectDirections, objectEditions, objectLooks, objectPalettes, objectScenes, objectVariants, parseObjectVariant, transferObjectVariant };
