import type { CSSProperties } from "react";

export type TokenKind = "request" | "response" | "change" | "accent" | "neutral";
export type TokenShape = "square" | "circle" | "diamond";

export const TOKEN_SHAPE: Record<TokenKind, TokenShape> = {
  request: "square",
  response: "circle",
  change: "diamond",
  accent: "square",
  neutral: "circle",
};

export function tokenColor(kind: TokenKind): string {
  switch (kind) {
    case "request":
      return "var(--uipack-token-request)";
    case "response":
      return "var(--uipack-token-response)";
    case "change":
      return "var(--uipack-token-change)";
    case "accent":
      return "var(--uipack-accent)";
    default:
      return "currentColor";
  }
}

export interface TokenProps {
  shape?: TokenShape;
  kind?: TokenKind;
  /** Half the token's width in user units. */
  r?: number;
  cx?: number;
  cy?: number;
  style?: CSSProperties;
}

/** The small shape that rides a connector or sits in a legend. */
export function Token({ shape, kind = "neutral", r = 5, cx = 0, cy = 0, style }: TokenProps) {
  const s = shape ?? TOKEN_SHAPE[kind];
  const fill = tokenColor(kind);
  const common = { fill, stroke: "var(--uipack-bg)", strokeWidth: 1.5, style };
  if (s === "circle") return <circle cx={cx} cy={cy} r={r} {...common} />;
  if (s === "diamond") {
    const d = r * 1.2;
    return <path d={`M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`} {...common} />;
  }
  return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={1.5} {...common} />;
}
