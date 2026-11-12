import type { ReactNode } from "react";
import type { Job } from "./content";

/**
 * The job cards' line drawings (LandingShowcase.tsx), one per kind of work: 76×50 units, stroked in
 * the card's section hue by landing.css. Decorative; each card is named by its title and line.
 */
export const JOB_ART: Record<Job["art"], ReactNode> = {
  landing: (
    <>
      <rect x="1" y="1" width="74" height="48" />
      <path d="M1 9h74" />
      <path d="M8 17h30M8 22h22" strokeWidth="2" />
      <rect x="48" y="15" width="20" height="13" />
      <rect x="8" y="34" width="17" height="9" />
      <rect x="30" y="34" width="17" height="9" />
      <rect x="52" y="34" width="16" height="9" />
    </>
  ),
  docs: (
    <>
      <rect x="1" y="1" width="74" height="48" />
      <path d="M20 1v48" />
      <path d="M6 9h9M6 14h9M6 19h7" />
      <path d="M27 10h26" strokeWidth="2" />
      <path d="M27 18h40M27 23h40M27 28h34M27 36h40M27 41h28" />
    </>
  ),
  deck: (
    <>
      <rect x="9" y="1" width="64" height="36" />
      <path d="M5 5v36h64" opacity=".6" />
      <path d="M1 9v36h64" opacity=".35" />
      <path d="M17 11h28" strokeWidth="2" />
      <path d="M17 19h20M17 24h16" />
      <path d="M53 15l9 6-9 6z" />
    </>
  ),
  diagram: (
    <>
      <rect x="1" y="17" width="18" height="16" />
      <circle cx="38" cy="25" r="9" />
      <path d="M66 15l9 10-9 10-9-10z" />
      <path d="M19 25h10M47 25h10" />
      <path d="M26 22l3 3-3 3M54 22l3 3-3 3" />
      <path d="M10 33v12h56V35" strokeDasharray="2 2.5" />
    </>
  ),
  spec: (
    <>
      <path d="M1 1h40l8 8v40H1z" />
      <path d="M41 1v8h8" />
      <path d="M7 10h18" strokeWidth="2" />
      <rect x="7" y="17" width="8" height="8" />
      <rect x="18" y="17" width="8" height="8" />
      <rect x="29" y="17" width="8" height="8" />
      <path d="M7 32h30M7 38h24M7 43h28" />
      <path d="M57 38l6-16 6 16M59.5 32h7" strokeWidth="1.6" />
    </>
  ),
  grade: (
    <>
      <rect x="1" y="1" width="46" height="48" />
      <path d="M8 12l3 3 5-6M8 26l3 3 5-6M8 40l3 3 5-6" />
      <path d="M22 12h18M22 26h18M22 40h12" />
      <circle cx="62" cy="30" r="11" />
      <path d="M62 30l6-6" strokeWidth="1.6" />
      <path d="M53 30h2M62 21v2M69 30h2" />
    </>
  ),
};
