import { useContext, useEffect, useRef, useState } from "react";
import { FigureScaleContext, useFontFloor } from "./scale";

export interface LabelProps {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  accent?: boolean;
  size?: number;
  /** Mono is the default; sans for a sentence. */
  font?: "mono" | "sans";
}

/** Text with a page-coloured underlay so it can sit on a connector. */
export function Label({ x, y, text, anchor = "start", accent, size: size0 = 11, font = "mono" }: LabelProps) {
  const size = useFontFloor(size0);
  const { floor } = useContext(FigureScaleContext);
  const textRef = useRef<SVGTextElement>(null);
  const [measured, setMeasured] = useState(0);
  // The browser's own width, where it is wider than the estimate below: a renderer that rounds
  // glyph advances to whole pixels (Linux Chromium at 1x) sets an 11px mono label up to 0.4px a
  // character wider. Measured after paint (renderStatic and server HTML keep the estimate), and
  // again when the size, the drawing's scale (the floor follows the rendered width) or the face
  // changes.
  useEffect(() => {
    const node = textRef.current;
    if (!node || typeof node.getComputedTextLength !== "function") return undefined;
    const measure = () => setMeasured(node.getComputedTextLength());
    measure();
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    fonts?.addEventListener?.("loadingdone", measure);
    return () => fonts?.removeEventListener?.("loadingdone", measure);
  }, [text, size, floor, font]);
  // Mono: the label face's 0.6em advance plus the .06em tracking below; sans: an average advance.
  // 4 units of underlay on each side, so a connector never shows through the ends.
  const w = Math.max(text.length * size * (font === "mono" ? 0.66 : 0.56), measured) + 8;
  const rx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w + 4 : x - 4;
  return (
    <g data-uipack="label">
      <rect x={rx} y={y - size + 1} width={w} height={size + 5} fill="var(--uipack-bg)" />
      <text
        ref={textRef}
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={size}
        fontFamily={font === "mono" ? "var(--uipack-mono)" : undefined}
        letterSpacing={font === "mono" ? ".06em" : undefined}
        fill={accent ? "var(--uipack-accent-ink)" : "currentColor"}
        fillOpacity={accent ? 1 : 0.8}
      >
        {font === "mono" ? text.toUpperCase() : text}
      </text>
    </g>
  );
}
