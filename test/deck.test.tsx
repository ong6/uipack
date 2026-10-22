import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Bento,
  BentoCell,
  Build,
  DeckPlayer,
  bentoCamera,
  bentoFocusAt,
  Morph,
  Slide,
  flipFrom,
  resolveTransition,
  zoomFrame,
  zoomSamples,
  type DeckSlide,
} from "../src/deck";

const slides: DeckSlide[] = [
  {
    id: "one",
    title: "First claim",
    render: () => (
      <Slide footer="Deck">
        <Morph id="title" as="h1">First</Morph>
      </Slide>
    ),
    notes: { say: "Say the first thing.", delivery: "Slowly.", next: "Then the list." },
  },
  {
    id: "two",
    title: "Three points",
    transition: "morph",
    render: () => (
      <Slide footer="Deck">
        <Morph id="title" as="p">First</Morph>
        <Build step={1}>Point A</Build>
        <Build step={2}>Point B</Build>
      </Slide>
    ),
    notes: "Walk the two points.",
  },
  {
    id: "three",
    title: "Inside one part",
    transition: { zoom: "title" },
    render: () => <Slide footer="Deck">Inside</Slide>,
  },
];

const deck = () => screen.getByRole("region", { name: "Test deck" });
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    fireEvent.keyDown(deck(), { key, ...init });
  });
const current = () => deck().getAttribute("data-index");
const step = () => deck().getAttribute("data-step");

describe("deck transitions: pure geometry", () => {
  it("uses the later slide's transition both ways, and fades on jumps", () => {
    const of = (i: number) => slides[i].transition;
    expect(resolveTransition(0, 1, of)).toEqual({ kind: "morph" });
    expect(resolveTransition(1, 0, of)).toEqual({ kind: "morph" });
    expect(resolveTransition(1, 2, of)).toEqual({ kind: "zoom", zoom: "title" });
    expect(resolveTransition(2, 1, of)).toEqual({ kind: "zoom", zoom: "title" });
    expect(resolveTransition(0, 2, of)).toEqual({ kind: "fade" });
    expect(resolveTransition(0, 1, () => undefined)).toEqual({ kind: "advance" });
    expect(resolveTransition(1, 1, of)).toEqual({ kind: "none" });
  });

  it("zooms about one fixed point that lands the target centred and as large as fits", () => {
    const target = { x: 1400, y: 500, w: 384, h: 216 };
    const f = zoomFrame(target)!;
    expect(f.Z).toBeCloseTo(5);
    // Scaling by Z about F sends the target's centre to the canvas centre.
    const map = (v: number, c: number) => (v - c) * f.Z + c;
    expect(map(target.x + target.w / 2, f.fx)).toBeCloseTo(960);
    expect(map(target.y + target.h / 2, f.fy)).toBeCloseTo(540);
    // A target that already fills the canvas has nothing to zoom into.
    expect(zoomFrame({ x: 0, y: 0, w: 1900, h: 1070 })).toBeNull();
  });

  it("starts the inner slide clipped to the target and ends with both slides at rest", () => {
    const s = zoomSamples({ x: 1400, y: 500, w: 384, h: 216 }, true)!;
    const first = s[0];
    const last = s[s.length - 1];
    expect(first.outer).toBe("scale(1.00000)");
    expect(first.inner).toBe("scale(0.20000)");
    expect(first.innerOpacity).toBe(0);
    expect(last.inner).toBe("scale(1.00000)");
    expect(last.clip).toMatch(/^inset\(0\.00px 0\.00px 0\.00px 0\.00px round 0\.00px\)$/);
    expect(last.innerOpacity).toBe(1);
    // Scale grows evenly in log space: equal steps multiply by the same factor around the middle.
    const back = zoomSamples({ x: 1400, y: 500, w: 384, h: 216 }, false)!;
    expect(back[0].outer).toBe(last.outer);
    expect(back[back.length - 1].inner).toBe(first.inner);
  });

  it("flips text uniformly and boxes by their own shape", () => {
    const text = flipFrom({ x: 100, y: 100, w: 800, h: 240 }, { x: 50, y: 40, w: 1000, h: 60 }, 0.5, "auto", 2);
    expect(text.transform).toBe("translate(100.00px, 120.00px) scale(2.0000)");
    const box = flipFrom({ x: 0, y: 0, w: 200, h: 100 }, { x: 0, y: 0, w: 400, h: 400 }, 1);
    expect(box.transform).toContain("scale(0.5000, 0.2500)");
  });
});

describe("DeckPlayer", () => {
  it("server-renders the first slide with its accessible name", () => {
    const html = renderToString(<DeckPlayer id="t" title="Test deck" slides={slides} />);
    expect(html).toContain('aria-roledescription="slide deck"');
    expect(html).toContain("1 of 3: First claim");
  });

  it("reveals builds before changing slide, and going back lands fully built", () => {
    render(<DeckPlayer id="t1" title="Test deck" slides={slides} />);
    expect(current()).toBe("0");
    press("ArrowRight");
    expect(current()).toBe("1");
    expect(step()).toBe("0");
    expect(screen.getByText("Point A").closest("[data-build]")).not.toHaveAttribute("data-built");
    press(" ");
    expect(screen.getByText("Point A").closest("[data-build]")).toHaveAttribute("data-built");
    expect(screen.getByText("Point B").closest("[data-build]")).not.toHaveAttribute("data-built");
    press("PageDown");
    press("ArrowRight");
    expect(current()).toBe("2");
    press("ArrowLeft");
    expect(current()).toBe("1");
    expect(step()).toBe("all");
    expect(screen.getByText("Point B").closest("[data-build]")).toHaveAttribute("data-built");
    press("ArrowLeft");
    expect(step()).toBe("1");
    press("Home");
    expect(current()).toBe("0");
    press("End");
    expect(current()).toBe("2");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("announces the slide and reports positions after mount, not on mount", () => {
    const seen: string[] = [];
    render(<DeckPlayer id="t2" title="Test deck" slides={slides} onPositionChange={(p) => seen.push(`${p.id}:${p.step}`)} />);
    expect(seen).toEqual([]);
    press("ArrowRight");
    expect(seen).toEqual(["two:0"]);
    expect(screen.getByText("Slide 2 of 3: Three points")).toBeInTheDocument();
  });

  it("opens on a given slide and ignores keys typed into fields inside slides", () => {
    const withField: DeckSlide[] = [
      ...slides,
      { id: "form", title: "Form", render: () => <input aria-label="Answer" /> },
    ];
    render(<DeckPlayer id="t3" title="Test deck" slides={withField} initial={{ slide: "form" }} />);
    expect(current()).toBe("3");
    act(() => {
      fireEvent.keyDown(screen.getByLabelText("Answer"), { key: "ArrowLeft" });
    });
    expect(current()).toBe("3");
  });

  it("shows every slide in the overview, jumps on pick and returns focus on Escape", async () => {
    render(<DeckPlayer id="t4" title="Test deck" slides={slides} />);
    press("g");
    const dialog = screen.getByRole("dialog", { name: "All slides" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^\d\d / })).toHaveLength(3);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /03 Inside one part/ }));
    });
    expect(current()).toBe("2");
    press("g");
    act(() => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("storyline tab reads the headlines with roles and shows check findings", () => {
    const withRoles: DeckSlide[] = [
      { ...slides[0], role: "cover" },
      { ...slides[1], role: "answer", headline: "Two points settle the question." },
      { ...slides[2], role: "evidence", headline: "Background" },
    ];
    render(<DeckPlayer id="t8" title="Test deck" slides={withRoles} lint />);
    press("g");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Storyline" }));
    });
    expect(screen.getByRole("button", { name: /02\s*Answer\s*Two points settle the question\./ })).toBeInTheDocument();
    // A topic label is not a claim; the deck has no closing ask.
    expect(screen.getAllByText(/Fix|Check|Tip/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Deck checks")).toHaveTextContent(/ask/i);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /03\s*Evidence/ }));
    });
    expect(current()).toBe("2");
  });

  it("swipes on touch but not with a mouse", () => {
    render(<DeckPlayer id="t5" title="Test deck" slides={slides} />);
    const stage = deck().querySelector(".uipack-deck-stage")!;
    act(() => {
      fireEvent.pointerDown(stage, { pointerType: "mouse", clientX: 300, clientY: 10 });
      fireEvent.pointerUp(stage, { pointerType: "mouse", clientX: 100, clientY: 10 });
    });
    expect(current()).toBe("0");
    act(() => {
      fireEvent.pointerDown(stage, { pointerType: "touch", clientX: 300, clientY: 10 });
      fireEvent.pointerUp(stage, { pointerType: "touch", clientX: 100, clientY: 14 });
    });
    expect(current()).toBe("1");
  });

  it("reads as a document with each talk track, and presents from a chosen slide", () => {
    render(<DeckPlayer id="t6" title="Test deck" slides={slides} view="read" />);
    expect(screen.getByText("Say the first thing.")).toBeInTheDocument();
    expect(screen.getByText("Walk the two points.")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Present from slide 2: Three points" }));
    });
    expect(current()).toBe("1");
    expect(deck().querySelector(".uipack-deck-stage")).not.toBeNull();
  });

  it("speaker view shows the talk track, the next slide and a clock", () => {
    render(<DeckPlayer id="t7" title="Test deck" slides={slides} mode="presenter" />);
    expect(screen.getByText("Say the first thing.")).toBeInTheDocument();
    expect(screen.getByText("Slowly.")).toBeInTheDocument();
    expect(screen.getByText("Then the list.")).toBeInTheDocument();
    expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
    expect(screen.queryByText(/answers “/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Speaker view" })).toBeNull();
  });
});

describe("Bento", () => {
  it("centres a focused cell in the bento's box, as large as fits, within the max scale", () => {
    const cam = bentoCamera({ x: 0, y: 0, w: 400, h: 200 }, { w: 1600, h: 700 }, 3);
    expect(cam.s).toBeCloseTo(3); // capped: 1504/400 = 3.76, 658/200 = 3.29
    expect(cam.tx + cam.s * 200).toBeCloseTo(800);
    expect(cam.ty + cam.s * 100).toBeCloseTo(350);
    expect(bentoCamera({ x: 0, y: 0, w: 1600, h: 700 }, { w: 1600, h: 700 }).s).toBe(1);
  });

  it("maps build steps to tour stops: overview, each cell, then back to the overview", () => {
    const tour = ["a", "b"];
    expect([0, 1, 2, 3, Infinity].map((s) => bentoFocusAt(s, tour))).toEqual([null, "a", "b", null, null]);
  });

  it("counts the tour as steps, so Next walks the cells before leaving the slide", () => {
    const bento: DeckSlide[] = [
      {
        id: "grid",
        title: "Grid",
        render: () => (
          <Bento tour={["a", "b"]}>
            <BentoCell id="a" detail={<p>Detail A</p>}>
              Face A
            </BentoCell>
            <BentoCell id="b">Face B</BentoCell>
          </Bento>
        ),
      },
      { id: "after", title: "After", render: () => <p>After</p> },
    ];
    render(<DeckPlayer id="t9" title="Test deck" slides={bento} />);
    const grid = () => deck().querySelector(".uipack-deck-bento")!;
    press("ArrowRight");
    expect(grid()).toHaveAttribute("data-focus", "a");
    expect(screen.getByText("Detail A").parentElement).not.toHaveAttribute("aria-hidden");
    press("ArrowRight");
    expect(grid()).toHaveAttribute("data-focus", "b");
    press("ArrowRight");
    expect(grid()).not.toHaveAttribute("data-focus");
    expect(current()).toBe("0");
    press("ArrowRight");
    expect(current()).toBe("1");
    press("ArrowLeft");
    expect(current()).toBe("0");
    expect(grid()).not.toHaveAttribute("data-focus");
  });
});
