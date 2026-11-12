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
import { useMediaQuery, useShowcaseTheme } from "./ShowcaseShell";
import { Scaled, useNearViewport } from "./preview-stage";
import { BUILD_JOBS, BUILT_NEXT, READ_ORDER, SUPPORT_JOBS, type Job } from "./landing/content";
import { JOB_ART } from "./landing/job-art";
import { NAV_MEMORY_KEY, SectionIcon, sectionHueStyle } from "./site-settings";
import "./landing.css";

type Theme = "light" | "dark";

const HeroFigure = lazy(() => import("./landing/HeroFigure"));
const BuiltStack = lazy(() => import("./landing/BuiltStack"));
const DiagramPreview = lazy(() => import("./landing/DiagramPreview"));
const DeckPreview = lazy(() => import("./landing/DeckPreview"));
const ChartPreview = lazy(() => import("./landing/ChartPreview"));
const ArticlePreview = lazy(() => import("./landing/ArticlePreview"));
const ObjectPreview = lazy(() => import("./landing/ObjectPreview"));

/** How near the viewport a lazy part mounts: about a screen ahead, so it is drawn before it shows. */
const NEAR_MARGIN = "600px 0px";

/** How long the copy button says "Copied" (or "Select it") before it reads "Copy" again. */
const COPY_STATE_MS = 1800;

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
    timer.current = setTimeout(() => setState("idle"), COPY_STATE_MS);
  };
  return (
    <div className="landing-install">
      <span className="landing-install__prompt" aria-hidden="true">
        $
      </span>
      <code className="landing-install__cmd">{line}</code>
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
            The design system for <em>every site</em> that installs it.
          </h1>
          <p className="landing-hero__sub">
            Diagrams, slides, web pages, motion and 3D, as React and SVG components with the rules for writing and laying them
            out. Agents read its docs as Markdown.
          </p>
          <InstallCommand />
          <p className="landing-install__note">
            UiPack is made for Jun Xiong's own sites and is not a public product. It installs from the tarball attached to each
            GitHub release (ES modules only, not on npm).
          </p>
          <div className="landing-hero__ctas">
            <a className="landing-btn landing-btn--primary" href={pageHref(page("start"), theme)}>
              Read the docs <Arrow />
            </a>
            <a className="landing-btn landing-btn--ghost" href={galleryHref(theme)}>
              Open Assets
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

function JobCard({ job, theme }: { job: Job; theme: Theme }) {
  return (
    <li className="landing-jobs__item">
      {/* The whole card is the link: one large target, named by its title and its line. */}
      <a
        className="landing-job"
        data-section={job.section}
        style={sectionHueStyle(job.section)}
        href={pageHref(page(job.page), theme)}
      >
        <div className="landing-job__top">
          <svg
            className="landing-job__art"
            viewBox="0 0 76 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
          >
            {JOB_ART[job.art]}
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
          lead="Each card names what to read first for the thing you are making."
          aside={
            <>
              Writing a site's own spec and grading the work are <a href="#around">further down</a>.
            </>
          }
        />
        <ul className="landing-jobs landing-jobs--build">
          {BUILD_JOBS.map((job) => (
            <JobCard key={job.title} job={job} theme={theme} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The steps either side of building, kept out of "Start from your job": most readers only build. */
function Around({ theme }: { theme: Theme }) {
  return (
    <section className="landing-block" id="around" aria-labelledby="around-title">
      <div className="landing-wrap">
        <SectionHead
          id="around-title"
          title="Rules and checks"
          lead="A site's own spec comes before building, and grading comes after."
          aside="A new site writes its spec first. A page on an existing site uses that site's spec."
        />
        <ul className="landing-jobs landing-jobs--around">
          {SUPPORT_JOBS.map((job) => (
            <JobCard key={job.title} job={job} theme={theme} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ how it is built */

/**
 * Mounts its children once the box nears the viewport; the box keeps a minimum height meanwhile.
 * Back to the page mounts at once what had mounted when the reader left (`restored`, by the box's
 * class): it is taller mounted, and the reader's place is only the same place at the same heights.
 */
function WhenNear({ className, children }: { className: string; children: ReactNode }) {
  const { ref, near } = useNearViewport<HTMLDivElement>({ inert: false, idle: false, margin: NEAR_MARGIN, restored: className });
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
          <SectionHead id="built-title" title="How it is built" lead="Core rules at the bottom, the parts on top." />
          <p>
            Each website has its own layout, writing style, theme, fonts and design direction, all in its spec. The core rules
            keep only what must hold everywhere, and the libraries give a spec named layouts and component looks to pick from.
          </p>
          <p>A deck is a page of a site, so it reads the same spec.</p>
          <ul className="landing-built__next" aria-label="Read next">
            {BUILT_NEXT.map((link) => (
              <li key={link.page}>
                <a href={pageHref(page(link.page), theme)}>
                  {link.label} <Arrow />
                </a>
              </li>
            ))}
          </ul>
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
  // Decided once, on the client: a still without motion, WebGL or IntersectionObserver.
  const [stillOnly] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches || !hasWebGL() || typeof IntersectionObserver === "undefined",
  );
  // "On screen": a third of the tile showing, with no margin and no idle-time mount.
  const { ref, near } = useNearViewport<HTMLDivElement>({ inert: false, idle: false, margin: "0px", threshold: 0.35 });
  const mode = stillOnly ? "still" : near ? "live" : "waiting";
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

/**
 * A scaled, inert picture of a part (the deck, the chart, the article parts), drawn at `width`
 * CSS px, or at `phone` px on a phone, where the tile is a full-width column: near the tile's own
 * width, so the part's words keep close to their size (landing.css crops each and fades its end).
 */
function Picture({ width, phone, children }: { width: number; phone?: number; children: ReactNode }) {
  const narrow = useMediaQuery("(max-width: 639px)");
  return (
    <Scaled
      width={narrow && phone ? phone : width}
      fit="top"
      ratio="auto"
      className="landing-preview"
      stageClassName="landing-preview__stage"
      margin={NEAR_MARGIN}
      idle={false}
    >
      {children}
    </Scaled>
  );
}

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
    preview: (theme) => (
      <Picture width={960}>
        <DeckPreview theme={theme} />
      </Picture>
    ),
  },
  {
    id: "charts",
    title: "Charts",
    entry: "uipack/charts",
    page: "charts",
    preview: () => (
      <Picture width={560} phone={360}>
        <ChartPreview />
      </Picture>
    ),
  },
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
    preview: () => (
      <Picture width={520} phone={330}>
        <ArticlePreview />
      </Picture>
    ),
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
          lead="Each import path loads only what it draws."
          aside={
            <>
              Every component page shows its live demo, and <a href={galleryHref(theme)}>Assets</a> shows all of them in one
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
            How agents use UiPack <Arrow />
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
              <p>
                Every docs page renders one Markdown file, which its View as Markdown link opens, and the site serves each file at
                its repo path.
              </p>
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
              style={sectionHueStyle(section.id)}
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
          <span>Jun Xiong's own design system. Its only consumers are the sites in the registry.</span>
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
        <Around theme={theme} />
        <Agents theme={theme} />
      </main>
      <SiteMap theme={theme} />
    </div>
  );
}
