/**
 * The Assets tab (/gallery): every asset uipack draws, as cards, for review at a glance. It explains
 * nothing: each card links to the docs page that documents the asset, and the cards come from the
 * same registries the docs pages render (figure sections, presets, example decks, slide starters,
 * object scenes, 3D stories, the asset manifest and the docs demos), so a new asset appears here
 * once it is registered there.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { PRESETS } from "../src/presets";
import { FigureLayoutWidthContext } from "../src";
import { SlideThumbnail } from "../src/deck";
import { renderSlideSvg } from "../src/presentations";
import { ObjectScene, objectScenes, objectVariants } from "../src/objects";
import { SlidePlayer, slideStories } from "../src/slides";
import { VerificationGate } from "../src/mechanism";
import manifest from "../assets/manifest.json";
import { figureSections } from "./figures";
import { figureEntries, pageDefs, pageHref } from "./catalog";
import { deckExamples } from "./deckExamples";
import { presentationStarters } from "./presentationExamples";
import { demos } from "./demos";
import { galleryCategories, type GalleryCategory } from "./gallery-index";
import { useShowcaseTheme } from "./ShowcaseShell";
import "../src/theme.css";
import "../src/canvas.css";
import "../src/web/fonts.css";
import "../src/deck/deck.css";
import "../src/deck/bento.css";
import "../src/deck/consulting/consulting.css";
import "../src/objects/objects.css";
import "../src/slides/slides.css";
import "../src/mechanism/mechanism.css";
import "./gallery-showcase.css";

declare const __UIPACK_ROOT__: string;

type Theme = "light" | "dark";

/** How a card shows its asset: a still SVG, a live render at its own size, or a live render scaled from a design width. */
type Preview =
  | { kind: "svg"; svg: (theme: Theme) => string }
  | { kind: "live"; render: (theme: Theme) => ReactNode; ratio: string }
  /** Rendered at `width` CSS px, then scaled: "contain" fits the whole thing in the box, "top" fills the width and crops below. */
  | { kind: "scaled"; render: (theme: Theme) => ReactNode; width: number; fit: "contain" | "top"; ratio?: string };

interface GalleryItem {
  id: string;
  category: GalleryCategory;
  /** A sub-group inside the category (a deck's name, "Presets"), shown as a small heading. */
  group?: string;
  title: string;
  /** What kind of asset it is, one or two words ("Pattern", "Slide 3 of 12"). */
  kind: string;
  /** The docs page that documents it, by manifest id, and an optional #anchor on it. */
  page: string;
  anchor?: string;
  preview: Preview;
  /** Icons and marks: small square tiles. */
  tile?: boolean;
  /** Wide assets (figures, pages, components): bigger cards. */
  wide?: boolean;
}

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const lazyNamed = <M,>(load: () => Promise<M>, name: keyof M) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));
const WebSampleStill = lazyNamed(() => import("./WebShowcase"), "WebSampleStill");

/** Every card, built from the registries, in category order. */
function galleryItems(): GalleryItem[] {
  const items: GalleryItem[] = [];
  const title = (id: string) => figureEntries.find((e) => e.id === id)?.title ?? id;

  // Architecture: each diagram pattern, then the presets from their default specs.
  figureSections.forEach((section, i) =>
    items.push({
      id: `figure-${section.id}`,
      category: "architecture",
      wide: true,
      group: "Diagram patterns",
      title: title(section.id).split(":")[0],
      kind: "Pattern",
      page: "figures",
      anchor: section.id,
      preview: figurePreview(() => section.render(`Figure ${String(i + 1).padStart(2, "0")}`)),
    }),
  );
  for (const [name, preset] of Object.entries(PRESETS)) {
    const { render, spec } = preset as unknown as { render: (s: unknown) => ReactNode; spec: unknown };
    items.push({
      id: `preset-${name}`,
      category: "architecture",
      wide: true,
      group: "Presets",
      title: preset.name,
      kind: "Preset",
      page: "figure-api",
      anchor: "presets",
      preview: figurePreview(() => render(spec)),
    });
  }

  // Slides: every slide of each example deck, then the slide starters.
  for (const deck of deckExamples) {
    const page = pageDefs.find((p) => p.query?.deck === deck.id)?.id ?? "deck";
    deck.slides.forEach((slide, i) =>
      items.push({
        id: `deck-${deck.id}-${slide.id}`,
        category: "slides",
        group: `${deck.name} deck`,
        title: slide.title,
        kind: `Slide ${i + 1} of ${deck.slides.length}`,
        page,
        preview: {
          kind: "live",
          ratio: "16 / 9",
          render: (theme) => (
            <div className="uipack-deck" data-theme={theme}>
              <SlideThumbnail slide={slide} index={i} count={deck.slides.length} theme={theme} />
            </div>
          ),
        },
      }),
    );
  }
  for (const starter of presentationStarters)
    items.push({
      id: `starter-${starter.id}`,
      category: "slides",
      group: "Slide starters",
      title: starter.title,
      kind: "Starter",
      page: "presentations",
      preview: { kind: "svg", svg: (theme) => renderSlideSvg(starter, { theme }) },
    });

  // Demos: the sample landing page and the mechanism.
  items.push(
    {
      id: "demo-web",
      category: "demos",
      wide: true,
      title: "Tidy sample landing page",
      kind: "Web page",
      page: "web",
      preview: { kind: "scaled", width: 1440, fit: "top", render: () => <WebSampleStill /> },
    },
    {
      id: "demo-gate",
      category: "demos",
      wide: true,
      title: "Verification gate",
      kind: "Mechanism",
      page: "mechanism",
      preview: { kind: "scaled", width: 960, fit: "contain", render: (theme) => <VerificationGate theme={theme} /> },
    },
  );

  // 3D: each object scene (its still illustration; the docs page plays it live), then the camera stories.
  for (const scene of objectScenes) {
    const looks = Object.values(objectVariants[scene.id] ?? {}).filter(Boolean);
    items.push({
      id: `object-${scene.id}`,
      category: "3d",
      group: "Object scenes",
      title: scene.title,
      kind: looks.length === 1 ? "1 look" : `${looks.length} looks`,
      page: "objects",
      preview: {
        kind: "live",
        ratio: "4 / 3",
        render: (theme) => <ObjectScene kind={scene.id} label={scene.title} theme={theme} active={false} controls="playback" />,
      },
    });
  }
  for (const story of slideStories)
    items.push({
      id: `story-${story.id}`,
      category: "3d",
      group: "Camera stories",
      wide: true,
      title: story.title,
      kind: `${story.stops.length} stops`,
      page: "animations",
      preview: {
        kind: "scaled",
        width: 1280,
        fit: "contain",
        render: (theme) => <SlidePlayer story={story} theme={theme} renderMode="diagram" />,
      },
    });

  // Components: the docs demos for charts, article parts and the docs layout.
  const component = (demo: string, id: string, label: string, page: string) => {
    const Demo = demos[demo]?.Component;
    if (Demo)
      items.push({
        id,
        category: "components",
        wide: true,
        title: label,
        kind: "Component",
        page,
        preview: { kind: "scaled", width: 1120, fit: "top", render: () => <Demo /> },
      });
  };
  component("span-chart", "component-span-chart", "Span chart", "charts");
  component("layer-stack-chart", "component-layer-stack", "Layer stack", "charts");
  component("article-parts", "component-article", "Article parts", "article");
  component("docs-layout", "component-docs-layout", "Docs layout", "docs");

  // Icons and marks: every entry in the asset manifest.
  for (const asset of (
    manifest as { assets: { id: string; name: string; category: string; preview: string; previewDark?: string }[] }
  ).assets)
    items.push({
      id: `asset-${asset.id}`,
      category: "icons",
      group: asset.category,
      title: asset.name,
      kind: asset.category.replace(/s$/, ""),
      page: "assets",
      tile: true,
      preview: {
        kind: "live",
        ratio: "1 / 1",
        render: (theme) => (
          <img
            src={`/@fs${__UIPACK_ROOT__}/${theme === "dark" && asset.previewDark ? asset.previewDark : asset.preview}`}
            alt=""
            loading="lazy"
          />
        ),
      },
    });
  return items;
}

/** A figure rendered live at the site's figure width (1088px) and fitted whole into the card. */
function figurePreview(figure: () => ReactNode): Preview {
  return { kind: "scaled", width: 1088, fit: "contain", render: () => figure() };
}

/**
 * Previews still waiting to mount, in page order. Each mounts when it nears the viewport, or,
 * failing that, in idle time, a couple at a time, so a card the reader jumps or scrolls past
 * without the page ever seeing it (a filter, a #link, a fast scroll on a busy page) still fills in.
 */
const waiting: (() => void)[] = [];
let pumping = false;
const whenIdle = (run: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(run, { timeout: 400 }) : setTimeout(run, 60);
function mountLater(mount: () => void) {
  waiting.push(mount);
  if (pumping) return;
  pumping = true;
  const step = () => {
    // Two per turn keeps each mount's render a short task.
    waiting.splice(0, 2).forEach((m) => m());
    if (waiting.length) whenIdle(step);
    else pumping = false;
  };
  whenIdle(step);
}

/** Mount children once the box nears the viewport (or in idle time), and keep them; inert and hidden from assistive tech. */
function useNearViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("inert", "");
    if (typeof IntersectionObserver === "undefined") return;
    let live = true;
    const mount = () => {
      if (!live) return;
      live = false;
      io.disconnect();
      setNear(true);
    };
    // A busy page can deliver several entries at once (out of view, in view, out again): any
    // entry in view counts, not just the first.
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && mount(), {
      rootMargin: "800px 0px",
    });
    io.observe(el);
    mountLater(mount);
    return () => {
      live = false;
      io.disconnect();
    };
  }, []);
  return { ref, near };
}

function Scaled({
  width,
  fit,
  ratio = "16 / 10",
  children,
}: {
  width: number;
  fit: "contain" | "top";
  ratio?: string;
  children: ReactNode;
}) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    // The stage's own height at its design width: transforms don't change layout size.
    const ro = new ResizeObserver(() => setNatural(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [near]);
  const byWidth = box.w / width;
  const scale = fit === "contain" && natural ? Math.min(byWidth, box.h / natural) : byWidth;
  const left = (box.w - width * scale) / 2;
  const top = fit === "contain" && natural ? Math.max(0, (box.h - natural * scale) / 2) : 0;
  return (
    <div ref={ref} className="gallery-preview gallery-preview--scaled" style={{ aspectRatio: ratio }} aria-hidden="true">
      {near && (
        <div
          ref={stage}
          className="gallery-preview__stage"
          style={{ width, transform: `translate(${left}px, ${top}px) scale(${scale})`, visibility: box.w ? undefined : "hidden" }}
        >
          {/* Figures inside lay out at the design width, so their text floor ignores the scale. */}
          <FigureLayoutWidthContext.Provider value={width}>
            <Suspense fallback={null}>{children}</Suspense>
          </FigureLayoutWidthContext.Provider>
        </div>
      )}
    </div>
  );
}

function PreviewBox({ preview, theme, tile }: { preview: Preview; theme: Theme; tile?: boolean }) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  if (preview.kind === "scaled")
    return (
      <Scaled width={preview.width} fit={preview.fit} ratio={preview.ratio}>
        {preview.render(theme)}
      </Scaled>
    );
  const ratio = preview.kind === "live" ? preview.ratio : "16 / 10";
  return (
    <div
      ref={ref}
      className={`gallery-preview gallery-preview--${preview.kind}${tile ? " gallery-preview--tile" : ""}`}
      style={tile ? undefined : { aspectRatio: ratio }}
      aria-hidden="true"
    >
      {near && (preview.kind === "svg" ? <SvgStill svg={preview.svg} theme={theme} /> : preview.render(theme))}
    </div>
  );
}

function SvgStill({ svg, theme }: { svg: (theme: Theme) => string; theme: Theme }) {
  const src = useMemo(() => svg(theme), [svg, theme]);
  return src ? <img src={svgUrl(src)} alt="" decoding="async" /> : <span className="gallery-preview__none">Open to view</span>;
}

function Card({ item, theme }: { item: GalleryItem; theme: Theme }) {
  const page = pageDefs.find((p) => p.id === item.page);
  const href = page ? `${pageHref(page, theme)}${item.anchor ? `#${item.anchor}` : ""}` : undefined;
  return (
    <li className={`gallery-card${item.tile ? " gallery-card--tile" : ""}`} data-gallery-item={item.id}>
      <PreviewBox preview={item.preview} theme={theme} tile={item.tile} />
      <div className="gallery-card__text">
        {/* The title is the card's one link; it stretches over the whole card. */}
        <a className="gallery-card__link" href={href}>
          {item.title}
        </a>
        {!item.tile && (
          <span className="gallery-card__meta">
            {item.kind}
            {page && <> · {page.title ?? page.label}</>}
          </span>
        )}
      </div>
    </li>
  );
}

/** Items grouped by their sub-group, in first-seen order. */
function byGroup(items: GalleryItem[]) {
  const groups = new Map<string, GalleryItem[]>();
  for (const it of items) {
    const key = it.group ?? "";
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups];
}

const ALL = "all";

export default function GalleryShowcase() {
  const { theme } = useShowcaseTheme();
  const items = useMemo(() => galleryItems(), []);
  const initial = new URLSearchParams(location.search).get("type");
  const [shown, setShown] = useState<GalleryCategory | typeof ALL>(
    galleryCategories.some((c) => c.id === initial) ? (initial as GalleryCategory) : ALL,
  );
  const choose = (next: GalleryCategory | typeof ALL) => {
    setShown(next);
    const url = new URL(location.href);
    if (next === ALL) url.searchParams.delete("type");
    else url.searchParams.set("type", next);
    url.hash = "";
    history.replaceState(null, "", url);
  };
  const count = (id: GalleryCategory) => items.filter((i) => i.category === id).length;
  const categories = galleryCategories.filter((c) => shown === ALL || c.id === shown);

  return (
    <div className="gallery" data-route="gallery">
      <div className="gallery-head">
        <h1>Assets</h1>
        <p>
          Every diagram, slide, demo, 3D scene, component and icon UiPack draws, rendered live from the library. Open a card for
          its docs.
        </p>
      </div>
      <div className="gallery-filters" role="group" aria-label="Show">
        <button type="button" aria-pressed={shown === ALL} onClick={() => choose(ALL)}>
          All <span className="gallery-filters__count">{items.length}</span>
        </button>
        {galleryCategories.map((c) => (
          <button key={c.id} type="button" aria-pressed={shown === c.id} onClick={() => choose(c.id)}>
            {c.label} <span className="gallery-filters__count">{count(c.id)}</span>
          </button>
        ))}
      </div>
      {categories.map((c) => (
        <section key={c.id} id={`gallery-${c.id}`} className="gallery-section" aria-labelledby={`gallery-${c.id}-title`}>
          <h2 id={`gallery-${c.id}-title`}>{c.label}</h2>
          {byGroup(items.filter((i) => i.category === c.id)).map(([group, list]) => (
            <div key={group || c.id} className="gallery-group">
              {group && <h3>{group}</h3>}
              <ul
                className={`gallery-grid${list[0]?.tile ? " gallery-grid--tiles" : list[0]?.wide ? " gallery-grid--wide" : ""}`}
              >
                {list.map((item) => (
                  <Card key={item.id} item={item} theme={theme} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
