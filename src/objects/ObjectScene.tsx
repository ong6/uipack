import { studioObjectPalettes } from "../styles/scene-palettes";
import { useEffect, useRef, useState } from "react";
import {
  objectDirectionIndex,
  normalizeObjectVariant,
  chooseObjectVariant,
  hasObjectLook,
  objectDirections,
  objectEditions,
  objectLooks,
  objectVariants,
  directionSymbols,
  type ObjectEdition,
  type ObjectVariant,
} from "./variants";
import { CanvasView } from "../CanvasView";
import { usePrefersReducedMotion } from "../env";
import { mountObjectScene, type ObjectSceneHandle, type ObjectStageFlags } from "./mount";
import type { ObjectKind, ObjectPalette } from "./scenes";
export interface ObjectSceneProps {
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
export const objectPalettes = studioObjectPalettes;
const styles = {
  scene: "uipack-object",
  canvas: "uipack-object__canvas",
  fallback: "uipack-object__fallback",
  fallbackSvg: "uipack-object__illustration",
  pause: "uipack-object__motion",
};
const Fallback = ({ kind, label }: { kind: ObjectKind; label: string }) => {
  const scenes = {
    ai: (
      <>
        <rect x="83" y="36" width="194" height="126" rx="8" />
        <path d="M83 162l-25 25h244l-25-25" />
        <path className="soft" d="M104 62h88m-88 22h143m-126 22h92m-109 22h120" />
        <rect x="20" y="56" width="42" height="48" rx="5" />
        <path d="M32 72l-6 8 6 8m16-16l6 8-6 8M62 102l32 43" />
        <rect x="298" y="56" width="42" height="48" rx="5" />
        <path d="M306 80l8 8 16-19M298 104l-32 40" />
      </>
    ),
    contact: (
      <>
        <rect x="28" y="28" width="76" height="42" rx="6" />
        <rect x="28" y="86" width="76" height="42" rx="6" />
        <rect x="28" y="144" width="76" height="42" rx="6" />
        <path className="soft" d="M104 49c62 0 76 50 126 58M104 107h126M104 165c62 0 76-50 126-58" />
        <circle cx="142" cy="58" r="6" fill="currentColor" />
        <path d="M48 42l18 13 18-13M48 42v17h36V42M49 101h34v17H61l-8 7 2-7h-6z" />
        <circle cx="66" cy="165" r="12" />
        <path d="M54 165h24m-12-12v24" />
        <rect x="230" y="52" width="102" height="110" rx="8" />
        <path d="M246 116h70v29h-70zM254 108h54m-54-12h54m-54-12h54" />
        <text x="281" y="72">
          INBOX
        </text>
      </>
    ),
    tennis: (
      <>
        <path className="soft" d="M45 187l55-162h160l55 162zM69 113h222M86 64h187M180 64v94M62 158h238" />
        <path d="M70 106h220m-220 0v23m220-23v23" />
        <circle cx="151" cy="125" r="8" />
        <path d="M140 137h22l5 25h-30zM142 163l-8 19m23-19l10 19M160 141l17 9 12-9" />
        <ellipse cx="199" cy="133" rx="10" ry="14" transform="rotate(40 199 133)" />
        <circle cx="213" cy="42" r="7" />
        <path d="M202 53h21l4 23h-29zM202 77l-9 17m27-17l8 17M202 57l-18 9-10-8" />
        <ellipse cx="165" cy="50" rx="8" ry="12" transform="rotate(-40 165 50)" />
        <circle cx="190" cy="90" r="5" />
      </>
    ),
    trading: (
      <>
        <rect x="26" y="24" width="308" height="152" rx="8" />
        <path d="M161 176v18h38v-18m-60 22h82" />
        <path className="soft" d="M43 70h268M43 100h268M43 130h268M43 151h268" />
        {/* Candles stay inside the plot (y 44–140); the caption is HTML below. */}
        <path
          stroke="#269764"
          d="M62 98V131M55 108h14v16h-14zM109 89V130M102 102h14v20h-14zM170 86V108M163 95h14v22h-14zM218 80V102M211 86h14v11h-14zM55 163v-8h14v8m33 0v-11h14v11m54 0v-14h14v14m41 0v-18h14v18"
        />
        <path
          stroke="#d85b65"
          d="M85 109V140M78 116h14v16h-14zM135 93V125M128 102h14v15h-14zM193 70V100M186 79h14v13h-14zM243 44V78M236 54h14v16h-14zM78 163v-6h14v6m36 0v-9h14v9m51 0v-11h14v11m43 0v-8h14v8"
        />
      </>
    ),
    server: (
      <>
        <path d="M78 38h204v142H78zM96 58h168v26H96zM96 96h168v26H96zM96 134h168v26H96z" />
        <path className="soft" d="M114 66h112m-112 38h112m-112 38h112" />
        <circle cx="246" cy="71" r="5" fill="currentColor" />
        <circle cx="246" cy="109" r="5" fill="currentColor" />
        <path d="M58 28l20 10m204 0l20-10M58 190l20-10m204 0l20 10" />
      </>
    ),
    travel: (
      <>
        <path d="M34 46l96-24 100 28 96-24v142l-96 24-100-28-96 24zM130 22v142m100-114v142" />
        <path className="soft" d="M62 78l52 28m36 16l56-34m44 20l48 30" />
        <path d="M62 78c36 30 68 18 88 44s70 18 100-14 48 30 48 30" />
        <circle cx="62" cy="78" r="7" fill="currentColor" />
        <circle cx="298" cy="138" r="7" fill="currentColor" />
      </>
    ),
    reading: (
      <>
        <path d="M34 52c54-20 102-16 146 8v132c-44-24-92-28-146-8zM326 52c-54-20-102-16-146 8v132c44-24 92-28 146-8z" />
        <path className="soft" d="M58 84h88m-88 24h96m-96 24h78m166-48h-88m88 24h-96m96 24h-78" />
        <path d="M180 60v132" />
      </>
    ),
  };
  // Words live in HTML beside the drawing, so they keep the 12px floor at any size.
  const captions: Partial<Record<ObjectKind, string>> = {
    trading: "DEMO / USD · SIMULATED",
  };
  return (
    <div className={styles.fallback} role="img" aria-label={`${label} illustration`}>
      <svg
        className={styles.fallbackSvg}
        viewBox="0 0 360 214"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {scenes[kind]}
      </svg>
      {captions[kind] && (
        <span className="uipack-object__fallback-caption" aria-hidden="true">
          {captions[kind]}
        </span>
      )}
    </div>
  );
};

/** The player's quiet controls draw a 16px glyph; the accessible name is the hidden text beside it. */
const ControlIcon = ({ name }: { name: "pause" | "play" | "replay" | "expand" }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    {name === "pause" && <path d="M5.5 3.5v9M10.5 3.5v9" />}
    {name === "play" && <path d="M5 3.2v9.6L12.5 8z" fill="currentColor" />}
    {name === "replay" && <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M3.5 2.8v2.4h2.4" />}
    {name === "expand" && <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />}
  </svg>
);

function ObjectStage({
  kind,
  label,
  active = true,
  theme = "light",
  palette,
  zoom = 1,
  variant = 0,
  edition = 0,
  controls = "full",
  surface = "styled",
  modelUrl,
}: ObjectSceneProps & { zoom?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const reduced = usePrefersReducedMotion();
  // What the running scene reads every frame. React state mirrors paused and completed for the
  // controls; these are the copies the loop sees without waiting for a render.
  const flagsRef = useRef<ObjectStageFlags>({ active, paused: false, completed: false, reduced: false, zoom });
  const sceneRef = useRef<ObjectSceneHandle | null>(null);
  // The scene keys on the palette's values, not its identity: an inline `palette={{…}}` is a new
  // object on every parent render and must not tear down and rebuild the WebGL renderer.
  const paletteKey = palette ? JSON.stringify(palette) : "";
  const resolvedVariant = normalizeObjectVariant(kind, variant === "random" ? objectLooks[kind][0] : variant);

  useEffect(() => {
    flagsRef.current.zoom = zoom;
    sceneRef.current?.resize();
  }, [zoom]);

  useEffect(() => {
    const flags = flagsRef.current;
    flags.reduced = reduced;
    if (reduced) {
      sceneRef.current?.settle();
      sceneRef.current?.stop();
    } else if (flags.active && !flags.paused && !flags.completed) sceneRef.current?.resume();
  }, [reduced]);

  useEffect(() => {
    const flags = flagsRef.current;
    flags.active = active;
    if (active && !flags.paused && !flags.reduced) sceneRef.current?.draw();
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      setReady(false);
      return undefined;
    }
    setReady(false);
    flagsRef.current.paused = false;
    flagsRef.current.completed = false;
    setPaused(false);
    setCompleted(false);
    const scene = mountObjectScene(canvas, {
      kind,
      colors: paletteKey ? (JSON.parse(paletteKey) as ObjectPalette) : objectPalettes[theme],
      variant: resolvedVariant,
      edition,
      modelUrl,
      theme,
      flags: flagsRef.current,
      host: () => hostRef.current,
      onReady: setReady,
      onCompleted: () => setCompleted(true),
      onReplayed: () => {
        setCompleted(false);
        setPaused(false);
      },
    });
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.dispose();
    };
  }, [active, kind, theme, paletteKey, resolvedVariant, edition, modelUrl]);

  const togglePaused = () => {
    const flags = flagsRef.current;
    const next = !flags.paused;
    flags.paused = next;
    setPaused(next);
    if (next) sceneRef.current?.stop();
    else sceneRef.current?.resume();
  };
  const replay = () => sceneRef.current?.replay();

  return (
    <div
      ref={hostRef}
      data-theme={theme}
      data-surface={surface}
      className={styles.scene}
      data-active={active ? "true" : "false"}
      data-kind={kind}
      data-variant={resolvedVariant}
      data-edition={edition}
      data-art-direction={objectDirections[objectDirectionIndex(kind, resolvedVariant)].id}
      data-controls={controls}
      data-variant-label={objectVariants[kind][resolvedVariant]}
    >
      <Fallback kind={kind} label={label} />
      {active && <canvas ref={canvasRef} className={styles.canvas} data-ready={ready ? "true" : "false"} aria-hidden="true" />}

      {ready && !reduced && (
        <button
          type="button"
          className={styles.pause}
          onClick={completed ? replay : togglePaused}
          aria-pressed={completed ? undefined : paused}
          title={completed ? "Replay" : paused ? "Resume" : "Pause"}
        >
          <ControlIcon name={completed ? "replay" : paused ? "play" : "pause"} />
          <span className="uipack-object__sr">{completed ? "Replay motion" : paused ? "Resume motion" : "Pause motion"}</span>
        </button>
      )}
    </div>
  );
}

/** Framework-independent player. The scene is mounted once, including in Open canvas. */
export function ObjectScene(props: ObjectSceneProps) {
  const [open, setOpen] = useState(false),
    [zoom, setZoom] = useState(1);
  const opener = useRef<HTMLButtonElement>(null);
  // One random roll per mount, taken after it so the server and client agree. The look is derived
  // from it among the current kind's looks, and Another look steps on through them.
  const [pick, setPick] = useState<{ roll: number; turns: number } | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a client-only random value, set once after hydration
    setPick({ roll: Math.random(), turns: 0 });
  }, []);
  const randomVariant = pick === null ? null : chooseObjectVariant(props.kind, () => pick.roll, pick.turns);
  const canVary = props.variant === undefined || props.variant === "random";
  const controls = props.controls ?? "full";
  const chosenVariant = canVary ? randomVariant : (props.variant as ObjectVariant);
  const variant = chosenVariant === null ? null : normalizeObjectVariant(props.kind, chosenVariant);
  const anotherLook = () => setPick((current) => current && { ...current, turns: current.turns + 1 });
  return (
    <div className="uipack-object-frame" data-theme={props.theme ?? "light"} data-controls={controls}>
      {controls === "full" && variant !== null && (
        <div className="uipack-object-edition">
          <span>
            {objectVariants[props.kind][variant]}
            {/* A non-default Studio edition is named after the direction's own name, never instead of it. */}
            {variant === 0 && props.kind !== "contact" && props.edition && hasObjectLook(props.kind, 0)
              ? ` · ${objectEditions[props.kind][props.edition]}`
              : ""}
          </span>
          {canVary && (
            <button type="button" onClick={anotherLook} aria-label="Another look">
              ↻
            </button>
          )}
        </div>
      )}
      {controls === "full" && (
        <button ref={opener} type="button" className="uipack-object-open" onClick={() => setOpen(true)} title="Open canvas">
          <ControlIcon name="expand" />
          <span className="uipack-object__sr">Open canvas</span>
        </button>
      )}
      <CanvasView
        open={open}
        onClose={() => setOpen(false)}
        title={props.label}
        theme={props.theme}
        restoreFocus={() => opener.current?.focus()}
        zoom={{ value: zoom, min: 0.75, max: 2, onChange: setZoom }}
      >
        <ObjectStage
          key={`${props.kind}-${props.theme ?? "light"}-${variant ?? "pending"}-${props.edition ?? 0}`}
          {...props}
          active={(props.active ?? true) && variant !== null}
          variant={variant ?? 0}
          zoom={zoom}
        />
      </CanvasView>
    </div>
  );
}

/**
 * Shared style selector; consumers own the selected value and URL persistence. With `kind`, it
 * offers only that kind's looks (`objectLooks`); without, every direction, for a set of scenes
 * (each scene shows its own default for a direction it lacks).
 */
export function ObjectDirectionPicker({
  value,
  onChange,
  kind,
}: {
  value: ObjectVariant | "random";
  onChange: (value: ObjectVariant) => void;
  kind?: Exclude<ObjectKind, "contact">;
}) {
  return (
    <div className="uipack-object-directions" role="group" aria-label="3D art direction">
      {objectDirections.map((direction, index) =>
        kind && !hasObjectLook(kind, index as ObjectVariant) ? null : (
          <button
            key={direction.id}
            type="button"
            aria-pressed={value === index}
            onClick={() => onChange(index as ObjectVariant)}
          >
            <span aria-hidden="true">{directionSymbols[index]}</span>
            {direction.name}
          </button>
        ),
      )}
    </div>
  );
}
