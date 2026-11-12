/**
 * The landing page (/): the docs site's front door, outside the docs manifest like the Assets
 * gallery, in the shell's landing mode (the same header, no sidebar; this module brings its own
 * <main> and footer). Built to the landing recipe (docs/recipes/landing.md) in Technical: a split
 * hero with the product's real output (the read-order figure, a live uipack figure), plain-name
 * section heads, one primary action. Its words are in landing/content.ts, each from the doc it
 * links; the site map is the docs manifest; the install line is package.json's release.
 *
 * Every live part loads on its own: the hero figure at once (its slot keeps its size meanwhile),
 * the layer stack and the bento previews as they near the viewport, and the 3D scene only once it
 * is on screen, with WebGL, and motion allowed (a still of the same scene otherwise).
 */
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { version } from "../package.json";
import { librarySections, pageDefs, pageHref, type PageDef } from "./catalog";
import { REPO_URL } from "./docs-manifest";
import { galleryHref } from "./gallery-index";
import { installLine } from "./release";
import { SITE_ORIGIN } from "./site";
import { useShowcaseTheme } from "./ShowcaseShell";
import { Scaled, useNearViewport } from "./preview-stage";
import { JOBS, READ_ORDER, type Job } from "./landing/content";
import { NAV_MEMORY_KEY, SectionIcon } from "./site-settings";
import "./landing.css";

type Theme = "light" | "dark";

const HeroFigure = lazy(() => import("./landing/HeroFigure"));
const BuiltStack = lazy(() => import("./landing/BuiltStack"));
const DiagramPreview = lazy(() => import("./landing/DiagramPreview"));
const DeckPreview = lazy(() => import("./landing/DeckPreview"));
const ChartPreview = lazy(() => import("./landing/ChartPreview"));
const ArticlePreview = lazy(() => import("./landing/ArticlePreview"));
const ObjectPreview = lazy(() => import("./landing/ObjectPreview"));

const page = (id: string): PageDef => {
  const found = pageDefs.find((p) => p.id === id);
  if (!found) throw new Error(`landing: no docs page "${id}"`);
  return found;
};

/** The "go" arrow, drawn: Technical's faces have no arrow glyph, so a text "→" would fall back to a system font. */
const Arrow = () => (
  <svg
    className="landing-arrow"
    viewBox="0 0 12 12"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M1 6h9M6.5 2.5 10 6l-3.5 3.5" />
  </svg>
);

/* ------------------------------------------------------------------ hero */

/** The install line with a copy button. The line is package.json's release (playground/release.ts), as in the docs. */
function InstallCommand() {
  const line = installLine(version);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(line);
      else {
        const area = Object.assign(document.createElement("textarea"), { value: line, readOnly: true });
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        const ok = document.execCommand?.("copy") ?? false;
        area.remove();
        if (!ok) throw new Error("copy unavailable");
      }
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  };
  return (
    <div className="landing-install">
      <span className="landing-install__prompt" aria-hidden="true">
        $
      </span>
      <code className="landing-install__cmd" tabIndex={0} aria-label="Install command">
        {line}
      </code>
      <button className="landing-install__copy" type="button" onClick={() => void copy()} data-state={state}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" />
          <path d="M16 8V4H4v12h4" />
        </svg>
        <span>{state === "copied" ? "Copied" : state === "failed" ? "Select it" : "Copy"}</span>
        <span className="landing-vh">the install command</span>
      </button>
      <span className="landing-vh" role="status">
        {state === "copied" ? "Install command copied" : state === "failed" ? "Copy failed: select the command and copy it" : ""}
      </span>
    </div>
  );
}

function Hero({ theme }: { theme: Theme }) {
  return (
    <section className="landing-hero" id="top" aria-labelledby="landing-title">
      <div className="landing-wrap landing-hero__grid">
        <div className="landing-hero__text">
          <p className="landing-eyebrow">
            <span className="landing-dot" aria-hidden="true" />
            <b>UiPack</b> v{version} · design system
          </p>
          <h1 id="landing-title">
            The design manager for <em>every site</em> that installs it.
          </h1>
          <p className="landing-hero__sub">
            Diagrams, slides, web pages, motion and 3D, as React and SVG components with the rules for writing and laying them
            out. Agents read the same files as Markdown.
          </p>
          <InstallCommand />
          <p className="landing-install__note">
            ES modules only, not on npm: it installs from the tarball attached to each GitHub release.
          </p>
          <div className="landing-hero__ctas">
            <a className="landing-btn landing-btn--primary" href={pageHref(page("start"), theme)}>
              Read the docs <Arrow />
            </a>
            <a className="landing-btn landing-btn--ghost" href={galleryHref(theme)}>
              Open the gallery
            </a>
          </div>
        </div>
        <div className="landing-hero__figure">
          <Suspense fallback={<div className="landing-hero__placeholder" aria-hidden="true" />}>
            <HeroFigure />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ jobs */

const ART: Record<Job["art"], ReactNode> = {
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

function JobCard({ job, theme }: { job: Job; theme: Theme }) {
  return (
    <li className="landing-jobs__item">
      {/* The whole card is the link: one large target, named by its title and its line. */}
      <a className="landing-job" data-section={job.section} href={pageHref(page(job.page), theme)}>
        <div className="landing-job__top">
          <svg
            className="landing-job__art"
            viewBox="0 0 76 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            {ART[job.art]}
          </svg>
          <span className="landing-job__chip">
            <SectionIcon id={job.section} size={13} />
            {librarySections.find((s) => s.id === job.section)!.label}
          </span>
        </div>
        <h3>{job.title}</h3>
        <p>{job.text}</p>
        <span className="landing-job__go" aria-hidden="true">
          {job.go} <Arrow />
        </span>
      </a>
    </li>
  );
}

/** A section's head: the plain-name h2 (Technical's web section head), the lead and an aside. */
function SectionHead({ id, title, lead, aside }: { id: string; title: string; lead: string; aside?: ReactNode }) {
  return (
    <div className="landing-head">
      <div>
        <h2 id={id}>
          <span className="landing-dot" aria-hidden="true" />
          {title}
        </h2>
        <p className="landing-head__lead">{lead}</p>
      </div>
      {aside && <p className="landing-head__aside">{aside}</p>}
    </div>
  );
}

function Jobs({ theme }: { theme: Theme }) {
  return (
    <section className="landing-block" id="jobs" aria-labelledby="jobs-title">
      <div className="landing-wrap">
        <SectionHead
          id="jobs-title"
          title="Start from your job"
          lead="Pick what you are making; each card names what to read first."
          aside={
            <>
              Each card is tinted with its section in the docs: <span data-section="build">Build</span>,{" "}
              <span data-section="rules">Rules</span> or <span data-section="check">Check</span>.
            </>
          }
        />
        <ul className="landing-jobs">
          {JOBS.map((job) => (
            <JobCard key={job.title} job={job} theme={theme} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ how it's built */

/** Mounts its children once the box nears the viewport; the box keeps a minimum height meanwhile. */
function WhenNear({ className, children }: { className: string; children: ReactNode }) {
  const { ref, near } = useNearViewport<HTMLDivElement>({ inert: false, idle: false, margin: "600px 0px" });
  return (
    <div ref={ref} className={className}>
      {near && <Suspense fallback={null}>{children}</Suspense>}
    </div>
  );
}

function Built({ theme }: { theme: Theme }) {
  return (
    <section className="landing-block" id="built" aria-labelledby="built-title">
      <div className="landing-wrap landing-built">
        <div className="landing-built__text">
          <SectionHead id="built-title" title="How it's built" lead="Core rules at the bottom, the parts on top." />
          <p>
            Each website has its own layout, writing style, theme, fonts and design direction, all in its spec; the core rules
            keep only what must hold everywhere, and the libraries give a spec named layouts and component looks to pick from.
          </p>
          <p>A deck is a page of a site, so it reads the same spec.</p>
          <p>
            <a href={pageHref(page("start"), theme)}>
              What UiPack is <Arrow />
            </a>
          </p>
        </div>
        <WhenNear className="landing-built__stack">
          <BuiltStack theme={theme} />
        </WhenNear>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ parts bento */

/** WebGL in this browser, checked once with a throwaway context. */
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * The 3D tile: the Studio travel scene (uipack/objects), mounted only once the tile is on screen,
 * with WebGL and motion allowed; otherwise a still of the same scene and look
 * (playground/assets/styles, scripts/style-stills.mjs). Its own Pause stays usable.
 */
function ScenePreview({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  // Decided once, on the client: a still without motion, WebGL or IntersectionObserver.
  const [mode, setMode] = useState<"waiting" | "live" | "still">(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches || !hasWebGL() || typeof IntersectionObserver === "undefined"
      ? "still"
      : "waiting",
  );
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "waiting") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setMode("live");
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);
  const still = new URL(`./assets/styles/studio-${theme}.jpg`, import.meta.url).href;
  return (
    <div ref={ref} className="landing-scene" data-scene={mode}>
      {mode === "live" ? (
        <Suspense fallback={<img src={still} alt="" width={720} height={360} decoding="async" />}>
          <ObjectPreview theme={theme} />
        </Suspense>
      ) : (
        <img src={still} alt="" width={720} height={360} loading="lazy" decoding="async" />
      )}
    </div>
  );
}

interface Tile {
  id: "diagrams" | "deck" | "charts" | "3d" | "article";
  title: string;
  entry?: string;
  page: string;
  preview: (theme: Theme) => ReactNode;
}

/** A scaled, inert picture of a part (the deck, the chart, the article parts). */
const picture = (width: number, fit: "contain" | "top", content: ReactNode) => (
  <Scaled
    width={width}
    fit={fit}
    ratio="auto"
    className="landing-preview"
    stageClassName="landing-preview__stage"
    margin="600px 0px"
    idle={false}
  >
    {content}
  </Scaled>
);

const TILES: Tile[] = [
  {
    id: "diagrams",
    title: "Architecture diagrams",
    entry: "uipack · uipack/presets",
    page: "figures",
    preview: () => (
      <WhenNear className="landing-live">
        <DiagramPreview />
      </WhenNear>
    ),
  },
  {
    id: "deck",
    title: "Deck player",
    entry: "uipack/deck",
    page: "deck",
    preview: (theme) => picture(960, "contain", <DeckPreview theme={theme} />),
  },
  { id: "charts", title: "Charts", entry: "uipack/charts", page: "charts", preview: () => picture(960, "top", <ChartPreview />) },
  {
    id: "3d",
    title: "3D animations and object scenes",
    entry: "uipack/objects",
    page: "objects",
    preview: (theme) => <ScenePreview theme={theme} />,
  },
  {
    id: "article",
    title: "Article parts",
    entry: "uipack/article",
    page: "article",
    preview: () => picture(640, "top", <ArticlePreview />),
  },
];

function TileCard({ tile, theme }: { tile: Tile; theme: Theme }) {
  return (
    <li className={`landing-tile landing-tile--${tile.id}`} data-tile={tile.id}>
      <div className="landing-tile__canvas">{tile.preview(theme)}</div>
      <div className="landing-tile__label">
        <h3>
          <a className="landing-tile__link" href={pageHref(page(tile.page), theme)}>
            {tile.title}
          </a>
        </h3>
        {tile.entry && <code>{tile.entry}</code>}
      </div>
    </li>
  );
}

function Parts({ theme }: { theme: Theme }) {
  return (
    <section className="landing-block" id="parts" aria-labelledby="parts-title">
      <div className="landing-wrap">
        <SectionHead
          id="parts-title"
          title="The parts"
          lead="Each entry loads only what it draws."
          aside={
            <>
              Every component page shows its live demo; <a href={galleryHref(theme)}>open the gallery</a> for all of them in one
              place.
            </>
          }
        />
        {/* The diagram full width, at the size its drawing is made for; then two pairs. */}
        <ul className="landing-bento">
          {TILES.map((tile) => (
            <TileCard key={tile.id} tile={tile} theme={theme} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ for agents */

const RowIcon = ({ children }: { children: ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    {children}
  </svg>
);

function Agents({ theme }: { theme: Theme }) {
  const site = SITE_ORIGIN.replace(/^https?:\/\//, "");
  return (
    <section className="landing-band" id="agents" aria-labelledby="agents-title">
      <div className="landing-wrap landing-band__grid">
        <div>
          <SectionHead id="agents-title" title="For agents" lead="The same pages, as Markdown, in reading order." />
          <p>
            An agent building a page, deck, figure or copy for one of the owner's sites reads these files as Markdown, from{" "}
            <code>node_modules/uipack/docs/</code> in a site or a clone. Each file opens with what it is for and who should read
            it, so you can stop after the first paragraph.
          </p>
          <a className="landing-btn landing-btn--band" href={pageHref(page("agents"), theme)}>
            How an agent uses UiPack <Arrow />
          </a>
        </div>
        <div className="landing-band__rows">
          <div className="landing-band__row">
            <RowIcon>
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M15 3v4h4M9 11h7M9 15h7M9 19h4" />
            </RowIcon>
            <div>
              <h3>llms.txt</h3>
              <p>Lists every file with one line on what it is for.</p>
              <a className="landing-band__url" href="/llms.txt">
                {site}/llms.txt
              </a>
            </div>
          </div>
          <div className="landing-band__row">
            <RowIcon>
              <path d="M9 6h11M9 12h11M9 18h11" />
              <path d="M4 6h1M4 12h1M4 18h1" />
            </RowIcon>
            <div>
              <h3>Read in this order</h3>
              <ol className="landing-steps">
                {READ_ORDER.map((step) => (
                  <li key={step.title}>
                    <span>
                      {step.long}
                      <small>{step.note}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="landing-band__row">
            <RowIcon>
              <rect x="3" y="5" width="18" height="14" />
              <path d="M7 15V9l2.5 3L12 9v6M16 9v6M14 13l2 2 2-2" />
            </RowIcon>
            <div>
              <h3>View as Markdown</h3>
              <p>Every page renders the Markdown file named under its title, and the site serves each file at its repo path.</p>
              <a className="landing-band__url" href="/docs/agents/README.md">
                {site}/docs/agents/README.md
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

/**
 * The site map: the docs' five sections, each with its groups (a caption over each but the first)
 * and their pages, from the docs manifest (sub-pages and deck sub-views stay on their page).
 */
function SiteMap({ theme }: { theme: Theme }) {
  return (
    <footer className="landing-foot" id="site-map" aria-labelledby="site-map-title">
      <div className="landing-wrap">
        <h2 id="site-map-title" className="landing-vh">
          Site map
        </h2>
        <div className="landing-map">
          {librarySections.map((section) => (
            <nav
              key={section.id}
              aria-labelledby={`map-${section.id}`}
              className="landing-map__section"
              data-section={section.id}
            >
              <h3 id={`map-${section.id}`}>
                <SectionIcon id={section.id} size={15} />
                {section.label}
              </h3>
              <div className="landing-map__groups">
                {section.groups.map((g) => (
                  <div key={g.id} className="landing-map__group">
                    {g.caption && <p className="landing-map__caption">{g.caption}</p>}
                    <ul>
                      {pageDefs
                        .filter((p) => p.group === g.id && !p.parent && (!p.query || p.isDefault))
                        .map((p) => (
                          <li key={p.id}>
                            <a href={pageHref(p, theme)}>{p.query ? (p.title ?? p.label) : p.label}</a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          ))}
        </div>
        <div className="landing-foot__base">
          <span>Jun Xiong's own design system. Not a public product: the only consumers are the sites in the registry.</span>
          <span className="landing-foot__links">
            <a href={REPO_URL}>GitHub</a>
            <a href="/llms.txt">llms.txt</a>
            <a href={pageHref(page("releases"), theme)}>Releases</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingShowcase() {
  const { theme } = useShowcaseTheme();
  // The sidebar's marker travels from the page being left; the landing page has no sidebar, so a
  // docs page opened from here docks its marker in place rather than flying from an older page.
  useEffect(() => {
    try {
      sessionStorage.removeItem(NAV_MEMORY_KEY);
    } catch {
      /* storage blocked: nothing was remembered either */
    }
  }, []);
  return (
    <div className="uipack-landing" data-route="landing">
      <main id="showcase-main" tabIndex={-1} aria-labelledby="landing-title">
        <Hero theme={theme} />
        <Jobs theme={theme} />
        <Built theme={theme} />
        <Parts theme={theme} />
        <Agents theme={theme} />
      </main>
      <SiteMap theme={theme} />
    </div>
  );
}
