import * as react from 'react';

type ObjectKind = "ai" | "contact" | "tennis" | "trading" | "server" | "travel" | "reading";
interface ObjectPalette {
    paper: number;
    ink: number;
    muted: number;
    accent: number;
}

/** Curated looks. Numeric IDs stay stable for screenshots and consumer previews. */
type ObjectVariant = 0 | 1 | 2;
declare const objectVariants: Record<ObjectKind, readonly [string, string, string]>;
declare function chooseObjectVariant(random?: () => number): ObjectVariant;

interface ObjectSceneProps {
    kind: ObjectKind;
    label: string;
    active?: boolean;
    theme?: "light" | "dark";
    palette?: ObjectPalette;
    /** Compact embeds can keep playback while leaving gallery controls to the library page. */
    controls?: "full" | "playback";
    /** Pick once per mount, or pin a curated look for a reproducible preview. */
    variant?: ObjectVariant | "random";
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

export { type ObjectKind, type ObjectPalette, ObjectScene, type ObjectSceneProps, type ObjectVariant, chooseObjectVariant, objectPalettes, objectScenes, objectVariants };
