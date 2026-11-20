import { render } from "@testing-library/react";
import {
  CountUp,
  DeckPlayer,
  LetterReveal,
  Polyhedra,
  SLIDE_MOVES,
  SOLIDS,
  Slide,
  blindsClip,
  deckMotion,
  scatter,
  type DeckSlide,
} from "../src/deck";
import { DeckSlideContext, type DeckSlideState } from "../src/deck/parts";
import { poseAt, project, rotate } from "../src/deck/polyhedra";
import { resolveTransition, runTransition } from "../src/deck/transitions";

const live: DeckSlideState = { step: Infinity, active: true, thumbnail: false, index: 0, count: 1, reducedMotion: false };
const inSlide = (state: DeckSlideState, node: React.ReactNode) => (
  <DeckSlideContext.Provider value={state}>{node}</DeckSlideContext.Provider>
);

describe("whole-slide moves", () => {
  it("resolve like any other transition, reversing on the way back", () => {
    for (const move of SLIDE_MOVES) {
      const of = (i: number) => (i === 1 ? move : undefined);
      expect(resolveTransition(0, 1, of)).toEqual({ kind: move });
      expect(resolveTransition(1, 0, of)).toEqual({ kind: move });
    }
  });

  it("play on the deck's clock: turning moves on morph, the rest on slow, reversed going back", () => {
    const timings = (move: (typeof SLIDE_MOVES)[number], direction: 1 | -1) => {
      const calls: KeyframeAnimationOptions[] = [];
      const layer = () => {
        const el = document.createElement("div");
        el.animate = ((_k: Keyframe[], o: KeyframeAnimationOptions) => {
          calls.push(o);
          return {} as Animation;
        }) as unknown as typeof el.animate;
        return el;
      };
      runTransition({ transition: { kind: move }, from: layer(), to: layer(), direction, scale: 1, reducedMotion: false });
      return calls;
    };
    for (const move of SLIDE_MOVES) {
      const calls = timings(move, 1);
      expect(calls.length, move).toBeGreaterThan(0);
      const longest = Math.max(...calls.map((c) => Number(c.duration) + Number(c.delay ?? 0)));
      expect(longest, move).toBe(
        move === "flip" || move === "cube"
          ? deckMotion.morph
          : move === "rise"
            ? deckMotion.handoff + deckMotion.slow
            : deckMotion.slow,
      );
    }
    // A reveal closes back the way it opened.
    expect(timings("shutter", -1).every((c) => c.direction === "reverse")).toBe(true);
    expect(timings("blinds", 1).every((c) => c.direction === "normal")).toBe(true);
  });

  it("turn into a 160 ms fade with reduced motion", () => {
    const calls: KeyframeAnimationOptions[] = [];
    const el = () => {
      const d = document.createElement("div");
      d.animate = ((_k: Keyframe[], o: KeyframeAnimationOptions) => (
        calls.push(o),
        {} as Animation
      )) as unknown as typeof d.animate;
      return d;
    };
    runTransition({ transition: { kind: "cube" }, from: el(), to: el(), direction: 1, scale: 1, reducedMotion: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].duration).toBe(deckMotion.quick);
  });

  it("blinds: closed at 0, open at 1, the same number of points at every step, slats opening left to right", () => {
    const points = (t: number) => blindsClip(t).slice("polygon(".length, -1).split(", ");
    expect(points(0)).toHaveLength(points(0.5).length);
    expect(points(1)).toHaveLength(points(0.37).length);
    const widths = (t: number) => {
      const p = points(t).map((q) => parseFloat(q));
      return Array.from({ length: p.length / 4 }, (_, i) => p[i * 4 + 2] - p[i * 4]);
    };
    expect(widths(0).every((w) => w === 0)).toBe(true);
    expect(widths(1).every((w) => Math.abs(w - 12.5) < 1e-3)).toBe(true);
    const mid = widths(0.4);
    for (let i = 1; i < mid.length; i++) expect(mid[i]).toBeLessThanOrEqual(mid[i - 1]);
  });
});

describe("polyhedra", () => {
  it("have the right edges, every vertex on the unit sphere", () => {
    const edges = { tetrahedron: 6, cube: 12, octahedron: 12, icosahedron: 30, dodecahedron: 30, prism: 9 };
    for (const [name, n] of Object.entries(edges)) {
      const solid = SOLIDS[name as keyof typeof SOLIDS];
      expect(solid.edges, name).toHaveLength(n);
      for (const v of solid.vertices) expect(Math.hypot(...v)).toBeCloseTo(name === "prism" ? Math.hypot(...v) : 1, 6);
    }
  });

  it("rotation keeps length; projection splits near and far edges", () => {
    expect(Math.hypot(...rotate([0.3, -0.5, 0.8], 1, 2, 3))).toBeCloseTo(Math.hypot(0.3, -0.5, 0.8), 9);
    const p = project(SOLIDS.cube, 100, 100, 50, 0.4, 0.6, 0);
    expect(p.near.split("M").length - 1 + (p.far.split("M").length - 1)).toBe(12);
    expect(p.far).not.toBe("");
  });

  it("scatter is seeded and keeps one bold and one accent solid; poses agree at the same moment", () => {
    expect(scatter(9, 3)).toEqual(scatter(9, 3));
    expect(scatter(9, 3)).not.toEqual(scatter(9, 4));
    const field = scatter(9, 3);
    expect(field.filter((s) => s.tone === "ink")).toHaveLength(1);
    expect(field.filter((s) => s.tone === "accent")).toHaveLength(1);
    expect(poseAt(field[2], 2, 12.5)).toEqual(poseAt(field[2], 2, 12.5));
  });
});

describe("kinetic parts", () => {
  it("CountUp is plain, selectable text when still, and holds the final width while it counts", () => {
    const still = render(inSlide({ ...live, thumbnail: true }, <CountUp value={286884} suffix="+" />));
    expect(still.container.textContent).toBe("286,884+");
    expect(still.container.querySelector(".uipack-deck-count__run")).toBeNull();
    const counting = render(inSlide(live, <CountUp value={286884} suffix="+" />));
    expect(counting.container.querySelector(".uipack-deck-count__hold")!.getAttribute("data-value")).toBe("286,884+");
    // The text is in the page once (the counting copies draw from data-value).
    expect(counting.container.textContent).toBe("286,884+");
  });

  it("CountUp starts from `from` on a live slide and keeps the value's decimals", () => {
    const { container } = render(inSlide(live, <CountUp value={12.5} from={2} />));
    expect(container.querySelector(".uipack-deck-count__run")!.getAttribute("data-value")).toBe("2.0");
  });

  it("LetterReveal animates only on a live slide, never breaking a word, read once", () => {
    const still = render(inSlide({ ...live, reducedMotion: true }, <LetterReveal>move with the story</LetterReveal>));
    expect(still.container.querySelector("[data-reveal]")).toBeNull();
    expect(still.container.querySelector(".uipack-deck-reveal")!.innerHTML).toBe("move with the story");
    const moving = render(inSlide(live, <LetterReveal>move with the story</LetterReveal>));
    const root = moving.container.querySelector(".uipack-deck-reveal")!;
    expect(root.getAttribute("data-reveal")).toBe("");
    expect(root.querySelectorAll(".uipack-deck-reveal__word")).toHaveLength(4);
    expect(root.querySelectorAll(".uipack-deck-reveal__char")).toHaveLength(16);
    const delays = Array.from(root.querySelectorAll<HTMLElement>(".uipack-deck-reveal__char"), (c) =>
      parseFloat(c.style.animationDelay),
    );
    expect(Math.max(...delays)).toBeLessThanOrEqual(deckMotion.handoff + 480);
    expect(root.querySelector(".uipack-deck-sr")!.textContent).toBe("move with the story");
    expect(root.textContent!.replace(/\s+/g, " ").trim()).toBe("move with the story");
  });

  it("LetterReveal waits hidden for its build step", () => {
    const { container } = render(inSlide({ ...live, step: 0 }, <LetterReveal step={1}>later</LetterReveal>));
    expect(container.querySelector(".uipack-deck-reveal")!.getAttribute("data-reveal")).toBe("hidden");
  });

  it("DeckPlayer draws its backdrop into each slide's background, aria-hidden", () => {
    const slides: DeckSlide[] = [{ id: "a", title: "A", render: () => <Slide footer="f">A</Slide> }];
    const { container } = render(<DeckPlayer id="k" title="K" slides={slides} backdrop={<Polyhedra count={5} seed={2} />} />);
    const svg = container.querySelector(".uipack-deck-layer__bg > svg.uipack-deck-polyhedra")!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.querySelectorAll(":scope > g")).toHaveLength(5);
  });
});
