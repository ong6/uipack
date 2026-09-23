// The owner's own marks only: a uipack wordmark and one simple mark per tool
// in the family. Drawn in a 32×32 box, stroke and fill from the parent.
// No third-party logos: those are trademarks, and the site rule is no
// borrowed identity.

export const marks = {
  uipack: (
    <>
      <rect x="4" y="4" width="10" height="10" rx="2" />
      <rect x="18" y="4" width="10" height="10" rx="2" />
      <rect x="4" y="18" width="10" height="10" rx="2" />
      <rect x="18" y="18" width="10" height="10" rx="5" fill="currentColor" />
    </>
  ),
  groundplane: (
    <>
      <path d="M4 22h24" />
      <path d="M8 22V10l8-4 8 4v12" />
      <path d="M8 16h16" strokeDasharray="2 2" />
    </>
  ),
  jobforge: (
    <>
      <path d="M6 24h20" />
      <path d="M10 24V14h12v10" />
      <path d="M13 14V9h6v5M16 4v5" />
    </>
  ),
  skillsmith: (
    <>
      <path d="M16 4l3.5 7 7.5 1-5.5 5.3 1.3 7.7L16 21.4 9.2 25l1.3-7.7L5 12l7.5-1z" />
    </>
  ),
  deckforge: (
    <>
      <rect x="4" y="7" width="24" height="15" rx="2" />
      <path d="M12 26h8M16 22v4M9 13h8M9 17h5" />
    </>
  ),
  proofpack: (
    <>
      <path d="M8 4h11l5 5v19H8z" />
      <path d="M19 4v5h5" />
      <path d="M12 18l3 3 5-6" />
    </>
  ),
  fieldpack: (
    <>
      <rect x="5" y="10" width="22" height="16" rx="3" />
      <path d="M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 16h22" />
    </>
  ),
  skillpack: (
    <>
      <rect x="5" y="6" width="22" height="20" rx="3" />
      <path d="M10 12h12M10 16h12M10 20h7" />
    </>
  ),
};

export type MarkName = keyof typeof marks;

/** The uipack wordmark: the mark plus the name in mono. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 140 32" width={(size * 140) / 32} height={size} role="img" aria-label="uipack" style={{ display: "block" }}>
      <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {marks.uipack}
      </g>
      <text x="40" y="22" fontSize="18" fontWeight={700} fontFamily="var(--uipack-mono, ui-monospace, monospace)" letterSpacing=".02em" fill="currentColor">
        uipack
      </text>
    </svg>
  );
}
