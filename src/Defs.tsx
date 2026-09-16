export interface DefsProps {
  /** Prefix for marker ids; keep unique per SVG on the page. */
  id: string;
}

/** Arrowhead markers. `url(#<id>-head)` and `url(#<id>-head-accent)`. */
export function Defs({ id }: DefsProps) {
  const head = (suffix: string, fill: string) => (
    <marker
      id={`${id}-head${suffix}`}
      markerWidth="8"
      markerHeight="8"
      refX="7"
      refY="4"
      orient="auto-start-reverse"
      markerUnits="userSpaceOnUse">
      <path d="M0,0 L8,4 L0,8 z" fill={fill} />
    </marker>
  );
  return (
    <defs>
      {head("", "currentColor")}
      {head("-accent", "var(--uipack-accent)")}
      {head("-request", "var(--uipack-token-request)")}
      {head("-response", "var(--uipack-token-response)")}
      {head("-change", "var(--uipack-token-change)")}
    </defs>
  );
}
