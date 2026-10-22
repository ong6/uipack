import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { AssetBrowser } from "../src/browser";
import manifest from "../assets/manifest.json";
import "../src/browser/browser.css";
import { useEffect, useRef, useState } from "react";
import { LayerStack, SpanChart, enhanceLayerStack, enhanceSpanChart } from "../src/charts";
import { aiStack, aiStackDiagram } from "../examples/aiStack";
import { chartEntries, figureEntries } from "./catalog";
import { figureSections } from "./figures";
import "../src/charts/charts.css";

declare const __UIPACK_ROOT__: string;

// Client-rendered here; the same markup works as static HTML. The playground
// opts into the optional enhancement (repeat activation and Escape clear).
function SpanChartDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>(".uipack-span");
    return root ? enhanceSpanChart(root) : undefined;
  }, []);
  return (
    <div ref={ref}>
      <SpanChart {...aiStack} />
    </div>
  );
}

// The stack's optional enhancement: band and rail links scroll smoothly.
function LayerStackDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>(".uipack-stack");
    return root ? enhanceLayerStack(root) : undefined;
  }, []);
  return (
    <div ref={ref}>
      <LayerStack {...aiStackDiagram} />
    </div>
  );
}

const entry = (id: string) => chartEntries.find((e) => e.id === id)!;

/* The charts are previewed in a frame at a host's real figure width (the notes
   site's slot is 56rem, 896px), so a layout that only works at 1280px cannot
   hide here. ?frame=896|720|390|320|full picks the width. */
const FRAMES = ["896", "720", "390", "320", "full"] as const;
function useFrame() {
  const value = new URLSearchParams(location.search).get("frame");
  return (FRAMES as readonly string[]).includes(value ?? "") ? (value as (typeof FRAMES)[number]) : "896";
}
function ChartFrame({ children }: { children: React.ReactNode }) {
  const frame = useFrame();
  // The width the page can actually give the frame. A host width wider than that cannot be
  // shown, so its button is left out (a phone offers only what fits, on one row) and the frame
  // is reported as "full" at the real width.
  const bar = useRef<HTMLParagraphElement>(null);
  const [room, setRoom] = useState<number | null>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const measure = () => setRoom(Math.floor(el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fits = (f: string) => f === "full" || room === null || Number(f) <= room;
  const shown = fits(frame) ? frame : "full";
  const pick = (next: string) => {
    const url = new URL(location.href);
    url.searchParams.set("frame", next);
    location.assign(url);
  };
  return (
    <>
      <p className="chart-frame__bar" ref={bar}>
        <span>Host width{shown === "full" && room !== null ? ` · ${room}px` : ""}</span>
        {FRAMES.filter(fits).map((f) => (
          <button type="button" key={f} aria-pressed={f === shown} onClick={() => pick(f)}>
            {f === "full" ? "full" : `${f}px`}
          </button>
        ))}
      </p>
      <div className="chart-frame" data-frame={frame} style={{ maxWidth: frame === "full" ? undefined : `${frame}px` }}>
        {children}
      </div>
    </>
  );
}

function Assets() {
  return (
    <section data-route="assets">
      <h2>Browse and copy</h2>
      <p className="showcase-section-intro">
        Filter by category, search by name or tag, then copy the import line or the SVG.
        Diagrams are coded figures, so they live on the Architecture diagrams page instead.
      </p>
      <AssetBrowser manifest={manifest as never} base={`/@fs${__UIPACK_ROOT__}/`} />
    </section>
  );
}

function Charts() {
  return (
    <>
      <section data-catalog-entry="layer-stack" id="layer-stack">
        <h2>{entry("layer-stack").title}</h2>
        <p className="showcase-section-intro">
          A stack of layers that opens band by band, for explaining how a system is built up.
        </p>
        <ChartFrame>
          <LayerStackDemo />
        </ChartFrame>
      </section>
      <section data-catalog-entry="span-chart" id="span-chart">
        <h2>{entry("span-chart").title}</h2>
        <p className="showcase-section-intro">
          A comparison across the same layers, with filters that keep one selection at a time.
        </p>
        <ChartFrame>
          <SpanChartDemo />
        </ChartFrame>
      </section>
    </>
  );
}

/* One section per pattern, in catalog order: the h2 is the catalog title, the intro says when
   to use it and what it is built from, and figures are numbered in page order. */
function Diagrams() {
  // /drill is an alias that opens this page at the drill-down section.
  useEffect(() => {
    if (location.pathname.replace(/\/$/, "") === "/drill") document.getElementById("drill-figure")?.scrollIntoView();
  }, []);
  let n = 0;
  return (
    <>
      {figureEntries.map((e) => {
        const s = figureSections.find((x) => x.id === e.id)!;
        // The bare figure has no header, so it takes no number.
        const number = s.id === "bare-figure" ? "" : `Figure ${String(++n).padStart(2, "0")}`;
        return (
          <section key={e.id} id={e.id} data-section={e.id} data-catalog-entry={e.id} data-preset={s.preset}>
            <h2>{e.title}</h2>
            <p className="showcase-section-intro">{s.intro}</p>
            {s.render(number)}
          </section>
        );
      })}
    </>
  );
}

export function App() {
  const { theme, flip } = useShowcaseTheme();
  const path = location.pathname.replace(/\/$/, "");
  const active = path === "/assets" ? "assets" : path === "/charts" ? "charts" : "figures";
  return (
    <ShowcaseShell active={active} theme={theme} flip={flip}>
      {active === "assets" ? <Assets /> : active === "charts" ? <Charts /> : <Diagrams />}
    </ShowcaseShell>
  );
}
