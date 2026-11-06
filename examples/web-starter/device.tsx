// The hero for a physical product: the thing itself beside its output. App.tsx sells software, so
// its demo screens are the product; when the product is a device (a sensor, a camera, a kit, a
// printed label), pass `media={<DeviceShot />}` to StarHero as well and keep the demo below it.
//
// The sample is Soilnote, a soil-moisture probe for allotment beds. Replace the drawing with your
// product's: a photo or render via `src` (the style treats it), or an SVG like these, painted only
// from roles (--ui-media-* for the picture's ramp, --ui-ink / --ui-surface / --ui-spot for line
// art), so each style repaints it (Technical: a cyanotype). Draw what the product sees or makes (a reading, a scan, a print), then the device
// small in the inset. Every number is sample data: keep it consistent with the rest of the page.
import { ProductShot } from "uipack/web";

const m = (role: string) => ({ stopColor: `var(--ui-media-${role})` });

/** What the probe measures: a bed in section, wet low and to the start side, drying near the top. */
function MoistureSection() {
  return (
    <svg viewBox="0 0 500 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sn-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={m("hot")} />
          <stop offset="0.3" style={m("warm")} />
          <stop offset="0.7" style={m("mid")} />
          <stop offset="1" style={m("cold")} />
        </linearGradient>
        <radialGradient id="sn-wet" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={m("cold")} />
          <stop offset="1" style={{ ...m("cold"), stopOpacity: 0 }} />
        </radialGradient>
        <filter id="sn-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <rect width="500" height="200" fill="url(#sn-soil)" />
      {/* A wet pocket under the last watering, and a dry crust along the top. */}
      <ellipse cx="140" cy="150" rx="150" ry="60" fill="url(#sn-wet)" />
      <rect x="-20" y="-10" width="540" height="34" style={{ fill: "var(--ui-media-hot)" }} filter="url(#sn-soft)" />
      {/* Roots: thin ink lines from the surface. */}
      <g style={{ stroke: "var(--ui-media-ink)", strokeWidth: 1.2, fill: "none", opacity: 0.55 }}>
        <path d="M120 22c4 30-10 52-2 84M126 60c18 10 24 24 30 40M330 22c-6 26 8 50 0 78M334 64c-16 12-20 26-26 36" />
      </g>
      {/* The probe in the bed: its three depth bands at 5, 15 and 30 cm. */}
      <g style={{ stroke: "var(--ui-media-ink)", strokeWidth: 1.5, fill: "none" }}>
        <rect x="246" y="4" width="16" height="22" rx="3" style={{ fill: "var(--ui-media-ground)" }} />
        <path d="M254 26v150" />
        <path d="M248 52h12M248 102h12M248 172h12" />
      </g>
    </svg>
  );
}

/** The device, small: the probe's head with its one status light. */
function Probe() {
  const ink = { stroke: "var(--ui-ink)", strokeWidth: 1.5, fill: "none", strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <rect x="42" y="8" width="36" height="26" rx="6" style={{ ...ink, fill: "var(--ui-surface)" }} />
      <circle cx="60" cy="21" r="4" style={{ fill: "var(--ui-spot, var(--ui-accent))" }} />
      <path d="M60 34v50" style={ink} />
      <path d="M55 50h10M55 64h10M55 80h10" style={{ ...ink, strokeWidth: 1 }} />
      <text x="96" y="66" style={{ fill: "var(--ui-ink-3)", font: "500 7px var(--ui-font-label)" }} textAnchor="middle">
        30 cm
      </text>
    </svg>
  );
}

/** StarHero `media`: the reading in the picture, the device in the inset, the place and time in the caption. */
export function DeviceShot() {
  return (
    <ProductShot
      label="Soil moisture in a bed in section from the sample probe: 18% at 5 cm, 34% at 30 cm"
      tag="Moisture, in section"
      readouts={[
        { label: "5 cm", value: "18%" },
        { label: "30 cm", value: "34%" },
      ]}
      callouts={[{ x: 24, y: 74, label: "Wet pocket", value: "34%, skip watering" }]}
      inset={{ label: "The probe", children: <Probe /> }}
      caption="Sample bed · plot 14, 07:10, after 2 dry days"
      scale={{ start: "wet", end: "dry" }}
    >
      <MoistureSection />
    </ProductShot>
  );
}
