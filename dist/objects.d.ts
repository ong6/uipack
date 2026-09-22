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
    readonly description: "Physical details, soft light, close-up choreography.";
}, {
    readonly id: "paper-theatre";
    readonly name: "Paper worlds";
    readonly description: "Cut-paper stages, layered landscapes and pop-up architecture.";
}, {
    readonly id: "kinetic";
    readonly name: "Kinetic sculptures";
    readonly description: "Brass mechanisms, ceramic forms and suspended motion.";
}, {
    readonly id: "cartoon";
    readonly name: "Cartoon worlds";
    readonly description: "Rounded little places, toy-like details and playful motion.";
}, {
    readonly id: "realistic";
    readonly name: "Realistic close-ups";
    readonly description: "Tactile materials, precision details and intimate camera angles.";
}, {
    readonly id: "abstract";
    readonly name: "Abstract forms";
    readonly description: "Optical glass, sculptural rhythms and unexpected silhouettes.";
}];
declare const objectVariants: Record<ObjectKind, readonly string[]>;
declare function chooseObjectVariant(random?: () => number, count?: number): ObjectVariant;
/** Original Studio editions, independent of art direction. */
declare const objectEditions: Record<ObjectKind, readonly [string, string, string]>;
declare const directionSymbols: readonly ["◒", "▱", "◎", "▧", "◉", "◇"];
declare function parseObjectVariant(value: string | null | undefined): ObjectVariant;
/** Contact keeps legacy finish IDs 0–2; new authored directions use 3 and 4. */
declare function objectDirectionIndex(kind: ObjectKind, variant: ObjectVariant): ObjectVariant;
declare function normalizeObjectVariant(kind: ObjectKind, variant: ObjectVariant): ObjectVariant;
declare function transferObjectVariant(from: ObjectKind, to: ObjectKind, variant: ObjectVariant): ObjectVariant;

/** One scene library, one mounted preview, one context panel. Consumers own routing. */
declare function AnimationWorkspace({ library, children, theme }: {
    library: ReactNode;
    children: ReactNode;
    theme?: 'light' | 'dark';
}): react.JSX.Element;
declare function ObjectInspector({ kind, variant, edition, onVariantChange, onEditionChange }: {
    kind: ObjectKind;
    variant: ObjectVariant;
    edition?: ObjectEdition;
    onVariantChange: (value: ObjectVariant) => void;
    onEditionChange: (value: ObjectEdition) => void;
}): react.JSX.Element;
declare function ObjectGallery({ kind, variant, edition, theme, palette, onChange }: {
    kind: ObjectKind;
    variant?: ObjectVariant;
    edition?: ObjectEdition;
    theme?: 'light' | 'dark';
    palette?: ObjectPalette;
    onChange: (kind: ObjectKind, variant: ObjectVariant, edition: ObjectEdition) => void;
}): react.JSX.Element;

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
    /** Pick once per mount, or pin a curated look for a reproducible preview. */
    variant?: ObjectVariant | "random";
    /** Original edition within Studio; ignored by Paper and Kinetic. */
    edition?: ObjectEdition;
}
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
declare const objectScenes: {
    id: ObjectKind;
    title: string;
    description: string;
}[];
/** Framework-independent player. The scene is mounted once, including in Open canvas. */
declare function ObjectScene(props: ObjectSceneProps): react.JSX.Element;
/** Shared style selector; consumers own the selected value and URL persistence. */
declare function ObjectDirectionPicker({ value, onChange }: {
    value: ObjectVariant | "random";
    onChange: (value: ObjectVariant) => void;
}): react.JSX.Element;

export { AnimationWorkspace, ObjectDirectionPicker, type ObjectEdition, ObjectGallery, ObjectInspector, type ObjectKind, type ObjectPalette, ObjectScene, type ObjectSceneProps, type ObjectVariant, chooseObjectVariant, directionSymbols, normalizeObjectVariant, objectDirectionIndex, objectDirections, objectEditions, objectPalettes, objectScenes, objectVariants, parseObjectVariant, transferObjectVariant };
