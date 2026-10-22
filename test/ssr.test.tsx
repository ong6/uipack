// @vitest-environment node
// The real server path: no window, no document, so useIsoLayoutEffect is useEffect and every
// `typeof window` guard takes its server branch. Each entry's main component must render to a string
// without throwing and without React warning (a bare useLayoutEffect, for one, warns here).
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { aiStack } from "../examples/aiStack";
import { notes } from "../examples/articleParts";
import { Connector, Defs, DrillFigure, DrillNode, Figure, Node } from "../src";
import { NoteCard } from "../src/article";
import { AssetBrowser } from "../src/browser";
import { SpanChart } from "../src/charts";
import { Bento, BentoCell, Build, DeckPlayer, Slide, type DeckSlide } from "../src/deck";
import { DocsLayout, DocsMarkdown } from "../src/docs";
import { VerificationGate } from "../src/mechanism";
import { ObjectScene } from "../src/objects";
import { SlideStarter } from "../src/presentations";
import { PRESETS } from "../src/presets";
import { SlidePlayer, harnessDive } from "../src/slides";
import { renderStatic } from "../src/static";
import { CtaButton, FAQ, HeadTags, Section, SmoothScroll, StarHero, WebSurface, pageMeta } from "../src/web";

const slides: DeckSlide[] = [
  {
    id: "one",
    title: "One",
    render: () => (
      <Slide footer="Deck">
        <Build step={1}>Point</Build>
        <Bento columns={2} rows={1}>
          <BentoCell id="a">a</BentoCell>
          <BentoCell id="b">b</BentoCell>
        </Bento>
      </Slide>
    ),
  },
  { id: "two", title: "Two", render: () => <Slide footer="Deck">Second</Slide> },
];

const drawing = (
  <>
    <Defs id="ssr" />
    <Node x={16} y={16} w={120} h={40} label="A" />
    <Node x={200} y={16} w={120} h={40} label="B" />
    <Connector
      points={[
        [136, 36],
        [200, 36],
      ]}
      defs="ssr"
      kind="request"
    />
  </>
);

const entries: Record<string, () => ReactElement> = {
  uipack: () => (
    <>
      <Figure viewBox="0 0 336 72" title="A figure" alt="Two nodes">
        {drawing}
      </Figure>
      <DrillFigure
        viewBox="0 0 336 72"
        levels={[
          { id: "top", label: "Top", alt: "Top level", render: () => <DrillNode x={16} y={16} w={120} h={40} drill="inner" /> },
          { id: "inner", label: "Inner", alt: "Inner level", render: () => drawing },
        ]}
      />
    </>
  ),
  "uipack/presets": () => {
    const { render, spec } = PRESETS.agentLoop as { render: (s: unknown) => ReactElement; spec: unknown };
    return render(spec);
  },
  "uipack/browser": () => (
    <AssetBrowser
      manifest={{
        version: 1,
        generated: "2026-10-22",
        assets: [{ id: "a", name: "A", category: "Figures", kind: "figure", preview: "a.svg", source: "a()", tags: [] }],
      }}
    />
  ),
  "uipack/slides": () => <SlidePlayer story={harnessDive} />,
  "uipack/presentations": () => (
    <SlideStarter
      slide={{
        id: "opening",
        layout: "opening",
        title: "Opening",
        description: "A thesis and context.",
        content: { eyebrow: "Eyebrow", headline: ["Design the slide.", "Plan what you say."], context: "Context." },
        speech: { say: "Say it.", delivery: "Slowly.", next: "Next." },
        footer: { label: "UIPACK", page: "01 / 01" },
      }}
    />
  ),
  "uipack/objects": () => <ObjectScene kind="contact" label="Contact inbox" />,
  "uipack/web": () => (
    <>
      <SmoothScroll />
      <HeadTags tags={pageMeta({ title: "Page", description: "A page.", url: "https://example.com/" })} />
      <WebSurface>
        <StarHero title="Forty in" subtitle="Three left" actions={<CtaButton href="#go">Start</CtaButton>} />
        <Section title="Questions">
          <FAQ items={[{ question: "Why?", answer: "Because." }]} />
        </Section>
      </WebSurface>
    </>
  ),
  "uipack/docs": () => (
    <DocsLayout
      productTitle="Product"
      productHref="/"
      sections={[{ title: "Start", items: [{ title: "Docs", href: "/docs" }] }]}
      activeHref="/docs"
    >
      <DocsMarkdown source={"# Overview\n\nA paragraph.\n\n## First step\n\n- one\n- two\n"} />
    </DocsLayout>
  ),
  "uipack/charts": () => <SpanChart {...aiStack} />,
  "uipack/article": () => <NoteCard {...notes.prefillVsDecode} />,
  "uipack/deck": () => <DeckPlayer id="ssr" title="Deck" slides={slides} />,
  "uipack/mechanism": () => <VerificationGate pose="idle" />,
};

describe("server render of each entry's main component", () => {
  let errors: unknown[][];
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(args));
  });
  afterEach(() => vi.restoreAllMocks());

  it("runs with no DOM", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  for (const [entry, element] of Object.entries(entries)) {
    it(entry, () => {
      const html = renderToString(element());
      expect(html.length).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  }

  it("uipack/static", () => {
    const svg = renderStatic({ children: drawing, viewBox: "0 0 336 72", title: "T", alt: "alt" }, { theme: "dark" });
    expect(svg.startsWith("<svg xmlns=")).toBe(true);
    expect(errors).toEqual([]);
  });

  it("covers every package entry", () => {
    const covered = [...Object.keys(entries), "uipack/static"].map((e) => (e === "uipack" ? "index" : e.slice("uipack/".length)));
    return import("../scripts/entries").then(({ entries: all }) => expect(covered.sort()).toEqual(Object.keys(all).sort()));
  });
});
