import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { onServer } from "./on-server";
import { readFileSync } from "node:fs";
import {
  Bento,
  BentoCell,
  Build,
  DeckPlayer,
  bentoCamera,
  bentoFocusAt,
  deckMotion,
  Morph,
  Slide,
  type DeckSlide,
} from "../src/deck";
// Internal to the player: tested at their module, not exported from uipack/deck.
import { flipFrom, resolveTransition, slideZoomFrame, slideZoomSamples, slideZoomWindow } from "../src/deck/transitions";
import { slidePlan } from "../src/deck/player/Presenter";

// A factory over the slide parts, so a server render (onServer) can build the slides from the same
// fresh modules as its DeckPlayer: parts read the player's context, which is one per module copy.
type SlideParts = Pick<typeof import("../src/deck"), "Slide" | "Morph" | "Build">;
const slidesFrom = ({ Slide, Morph, Build }: SlideParts): DeckSlide[] => [
  {
    id: "one",
    title: "First claim",
    render: () => (
      <Slide footer="Deck">
        <Morph id="title" as="h1">
          First
        </Morph>
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
        <Morph id="title" as="p">
          First
        </Morph>
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
const slides = slidesFrom({ Slide, Morph, Build });

const deck = () => screen.getByRole("region", { name: "Test deck" });
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    fireEvent.keyDown(deck(), { key, ...init });
  });
const current = () => deck().getAttribute("data-index");
const step = () => deck().getAttribute("data-step");

describe("deck clock", () => {
  it("deck.css carries the same easing curves as deckMotion", () => {
    const css = readFileSync("src/deck/deck.css", "utf8");
    expect(css).toContain(`--deck-settle: ${deckMotion.settle};`);
    expect(css).toContain(`--deck-travel: ${deckMotion.travel};`);
  });
});

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
    const f = slideZoomFrame(target)!;
    expect(f.Z).toBeCloseTo(5);
    // Scaling by Z about F sends the target's centre to the canvas centre.
    const map = (v: number, c: number) => (v - c) * f.Z + c;
    expect(map(target.x + target.w / 2, f.fx)).toBeCloseTo(960);
    expect(map(target.y + target.h / 2, f.fy)).toBeCloseTo(540);
    // A target that already fills the canvas has nothing to zoom into.
    expect(slideZoomFrame({ x: 0, y: 0, w: 1900, h: 1070 })).toBeNull();
  });

  it("opens the incoming slide whole in a 16:9 window inside the target, and ends with both slides at rest", () => {
    const target = { x: 1400, y: 500, w: 384, h: 216 };
    const s = slideZoomSamples(target, true)!;
    const first = s[0];
    const last = s[s.length - 1];
    const win = slideZoomWindow(target);
    // The window keeps the slide's aspect and sits inside the target, with a margin.
    expect(win.w / win.h).toBeCloseTo(16 / 9);
    expect(win.x).toBeGreaterThan(target.x);
    expect(win.y).toBeGreaterThan(target.y);
    expect(win.x + win.w).toBeLessThan(target.x + target.w);
    expect(win.y + win.h).toBeLessThan(target.y + target.h);
    expect(first.outer).toBe("scale(1.00000)");
    expect(Number(/scale\(([\d.]+)\)/.exec(first.inner)![1])).toBeCloseTo(win.w / 1920, 4);
    expect(first.innerOpacity).toBe(0);
    expect(last.inner).toBe("scale(1.00000)");
    expect(last.innerOpacity).toBe(1);
    // Never cropped: the clip is the slide's own frame, its corners squaring off as it lands.
    for (const sample of s) expect(sample.clip).toMatch(/^inset\(0px round [\d.]+px\)$/);
    expect(last.clip).toBe("inset(0px round 0.00px)");
    const back = slideZoomSamples(target, false)!;
    expect(back[0].outer).toBe(last.outer);
    expect(back[back.length - 1].inner).toBe(first.inner);
  });

  it("keeps the incoming slide inside the target as it opens, and on the canvas all the way", () => {
    // A tall panel in the right third, and a wide card: neither crops the slide inside it.
    for (const target of [
      { x: 1300, y: 260, w: 560, h: 520 },
      { x: 200, y: 300, w: 900, h: 260 },
    ]) {
      const frame = slideZoomFrame(slideZoomWindow(target))!;
      for (const s of slideZoomSamples(target, true)!) {
        const k = Number(/scale\(([\d.]+)\)/.exec(s.inner)![1]);
        const x = (v: number) => frame.fx + k * (v - frame.fx);
        const y = (v: number) => frame.fy + k * (v - frame.fy);
        expect(x(0), `left at ${s.offset}`).toBeGreaterThanOrEqual(-0.5);
        expect(x(1920), `right at ${s.offset}`).toBeLessThanOrEqual(1920.5);
        expect(y(0)).toBeGreaterThanOrEqual(-0.5);
        expect(y(1080)).toBeLessThanOrEqual(1080.5);
        if (s.offset === 0) {
          expect(x(0)).toBeGreaterThanOrEqual(target.x);
          expect(x(1920)).toBeLessThanOrEqual(target.x + target.w);
        }
      }
    }
  });

  it("flips text uniformly and boxes by their own shape", () => {
    const text = flipFrom({ x: 100, y: 100, w: 800, h: 240 }, { x: 50, y: 40, w: 1000, h: 60 }, 0.5, "auto", 2);
    expect(text.transform).toBe("translate(100.00px, 120.00px) scale(2.0000)");
    const box = flipFrom({ x: 0, y: 0, w: 200, h: 100 }, { x: 0, y: 0, w: 400, h: 400 }, 1);
    expect(box.transform).toContain("scale(0.5000, 0.2500)");
  });
});

describe("DeckPlayer", () => {
  it("server-renders the first slide with its accessible name", async () => {
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/deck");
      return renderToString(<server.DeckPlayer id="t" title="Test deck" slides={slidesFrom(server)} />);
    });
    expect(html).toContain('aria-roledescription="slide deck"');
    expect(html).toContain("1 of 3: First claim");
  });

  it("hydrates server HTML without a mismatch, then offers full screen", async () => {
    // The server half runs with no window or document, as on a real server.
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/deck");
      return renderToString(<server.DeckPlayer id="h" title="Test deck" slides={slidesFrom(server)} />);
    });
    expect(html).not.toContain("Full screen");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    // jsdom has no Fullscreen API; this browser says it has one.
    Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
    try {
      const root = await act(async () =>
        hydrateRoot(host, <DeckPlayer id="h" title="Test deck" slides={slides} />, {
          onRecoverableError: (e) => recoverable.push(e),
        }),
      );
      expect(recoverable).toEqual([]);
      expect(errors).not.toHaveBeenCalled();
      // After mount the browser's support is known.
      expect(screen.getByRole("button", { name: "Full screen" })).toBeInTheDocument();
      act(() => root.unmount());
    } finally {
      delete (document as { fullscreenEnabled?: boolean }).fullscreenEnabled;
      errors.mockRestore();
      host.remove();
    }
  });

  it("hydrates the speaker view without a mismatch, its clock starting at 00:00 after hydration", async () => {
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/deck");
      return renderToString(<server.DeckPlayer id="hp" title="Test deck" mode="presenter" slides={slidesFrom(server)} />);
    });
    expect(html).toContain("00:00");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const recoverable: unknown[] = [];
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const root = await act(async () =>
        hydrateRoot(host, <DeckPlayer id="hp" title="Test deck" mode="presenter" slides={slides} />, {
          onRecoverableError: (e) => recoverable.push(e),
        }),
      );
      expect(recoverable).toEqual([]);
      expect(errors).not.toHaveBeenCalled();
      expect(screen.getByRole("timer")).toHaveTextContent("00:00");
      act(() => root.unmount());
    } finally {
      errors.mockRestore();
      host.remove();
    }
  });

  it("offers no Full screen where the API is missing (iPhone Safari: fullscreenEnabled undefined)", () => {
    expect(document.fullscreenEnabled).toBeUndefined();
    const { unmount } = render(<DeckPlayer id="nf" title="Test deck" slides={slides} />);
    expect(screen.getByRole("button", { name: "All slides" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Full screen" })).toBeNull();
    unmount();
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

  it("disables Next as soon as it lands on the last slide's last step, mid-transition", () => {
    // A measurable stage and animations that never finish, so the transition holds (no settle re-render).
    const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(960);
    const running = { finished: new Promise(() => {}), cancel: vi.fn(), reverse: vi.fn() };
    const animate = vi.fn(() => running as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    try {
      const { unmount } = render(<DeckPlayer id="t9" title="Test deck" slides={slides} initial={{ slide: "two", step: 2 }} />);
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
      // The last slide has no builds; the previous one had two. The count must follow the slide.
      press("ArrowRight");
      expect(current()).toBe("2");
      expect(deck()).toHaveAttribute("data-transitioning");
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      // Unmounting mid-transition stops the animations.
      unmount();
      expect(running.cancel).toHaveBeenCalled();
    } finally {
      width.mockRestore();
      delete (HTMLElement.prototype as { animate?: unknown }).animate;
    }
  });

  it("renders an empty stage for an empty deck instead of throwing", async () => {
    render(<DeckPlayer id="t10" title="Test deck" slides={[]} />);
    expect(deck()).toHaveTextContent("No slides");
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/deck");
      return renderToString(<server.DeckPlayer id="t10" title="Test deck" slides={[]} />);
    });
    expect(html).toContain("No slides");
  });

  it("lands on the last slide left when the list shrinks under the current slide, then moves on", () => {
    const many = (n: number): DeckSlide[] =>
      Array.from({ length: n }, (_, i) => ({ id: `s${i}`, title: `S${i}`, render: () => <Slide>{`Slide ${i}`}</Slide> }));
    const { rerender } = render(<DeckPlayer id="t-shrink" title="Test deck" slides={many(5)} initial={{ slide: 4 }} />);
    expect(current()).toBe("4");
    rerender(<DeckPlayer id="t-shrink" title="Test deck" slides={many(2)} initial={{ slide: 4 }} />);
    expect(current()).toBe("1");
    expect(screen.getByText("Slide 2 of 2: S1")).toBeInTheDocument();
    // The corrected position is the one presses start from.
    press("ArrowLeft");
    expect(current()).toBe("0");
  });

  it("speaker sync: a remote move clamped to where this window already is doesn't swallow the next local move", () => {
    const channels: { onmessage: ((e: MessageEvent) => void) | null; sent: unknown[] }[] = [];
    class FakeChannel {
      onmessage: ((e: MessageEvent) => void) | null = null;
      sent: unknown[] = [];
      constructor() {
        channels.push(this);
      }
      postMessage(m: unknown) {
        this.sent.push(m);
      }
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    try {
      render(<DeckPlayer id="t-sync" title="Test deck" slides={slides} initial={{ slide: 2 }} />);
      const ch = channels[channels.length - 1];
      // Another window, with a longer deck, went to its slide 9: here that is the last slide, where we are.
      act(() => ch.onmessage?.({ data: { type: "go", index: 9, step: 0 } } as MessageEvent));
      expect(current()).toBe("2");
      ch.sent.length = 0;
      // The next local move is still broadcast.
      press("ArrowLeft");
      expect(current()).toBe("1");
      expect(ch.sent).toContainEqual(expect.objectContaining({ type: "go", index: 1 }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("warns once, in development, when a slide's heading has drifted from its headline", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const drifted: DeckSlide[] = [
        { id: "a", title: "A", headline: "Latency fell 52%.", render: () => <Slide>{<h2>Latency fell 52%</h2>}</Slide> },
        { id: "b", title: "B", headline: "Cost fell 18%.", render: () => <Slide>{<h2>Cost fell 20%.</h2>}</Slide> },
      ];
      render(<DeckPlayer id="t-drift" title="Test deck" slides={drifted} />);
      expect(warn).not.toHaveBeenCalled();
      press("ArrowRight");
      press("ArrowLeft");
      press("ArrowRight");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toMatch(/slide "b".*\n  headline: Cost fell 18%\.\n  on slide: Cost fell 20%/s);
    } finally {
      warn.mockRestore();
    }
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
    const withField: DeckSlide[] = [...slides, { id: "form", title: "Form", render: () => <input aria-label="Answer" /> }];
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
      fireEvent.click(screen.getByRole("button", { name: "Present from here, slide 2: Three points" }));
    });
    expect(current()).toBe("1");
    expect(deck().querySelector(".uipack-deck-stage")).not.toBeNull();
  });

  it("speaker view shows the talk track, the next slide and a clock", () => {
    render(<DeckPlayer id="t7" title="Test deck" slides={slides} mode="presenter" />);
    expect(screen.getByText("Say the first thing.")).toBeInTheDocument();
    expect(screen.getByText("Slowly.")).toBeInTheDocument();
    expect(screen.getByText("Then the list.")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("Elapsed time 00:00");
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

  const toured: DeckSlide[] = [
    {
      id: "grid",
      title: "Grid",
      headline: "The grid proves the claim.",
      render: () => (
        <Bento tour={["a", "b"]}>
          <BentoCell id="a" detail={<p>Where the time went</p>}>
            <p className="uipack-deck-bento-label">Latency</p>
          </BentoCell>
          <BentoCell id="b">
            <p className="uipack-deck-bento-label">Shipped</p>
          </BentoCell>
        </Bento>
      ),
      notes: { say: "Walk the grid.", delivery: "" },
    },
    { id: "after", title: "After", headline: "After the grid, the ask.", render: () => <p>After</p>, notes: "Ask." },
  ];

  it("read view: the claim is the heading, the short title sits small above it, and a tour's details get stills", () => {
    render(<DeckPlayer id="t10" title="Test deck" slides={toured} view="read" />);
    expect(screen.getByRole("heading", { level: 2, name: "The grid proves the claim." })).toBeInTheDocument();
    expect(screen.getByText("Grid", { selector: ".uipack-deck-read__title", exact: false })).toBeInTheDocument();
    // Only the stop whose cell has a detail gets a still, captioned with the detail's title.
    expect(screen.getAllByText(/^Detail · /).map((el) => el.textContent)).toEqual(["Detail · Where the time went"]);
    const still = screen.getByText("Detail · Where the time went").closest("figure")!;
    expect(still.querySelector(".uipack-deck-bento")).toHaveAttribute("data-focus", "a");
  });

  it("print view: a page per slide plus a page per tour detail, headed by the claim beside notes", () => {
    render(<DeckPlayer id="t11" title="Test deck" slides={toured} view="print" printNotes />);
    const pages = Array.from(deck().querySelectorAll(".uipack-deck-print__page"));
    expect(pages.map((p) => p.getAttribute("aria-label"))).toEqual([
      "01: Grid",
      "01: Grid, detail: Where the time went",
      "02: After",
    ]);
    expect(pages[1].querySelector(".uipack-deck-bento")).toHaveAttribute("data-focus", "a");
    expect(pages[1].querySelector(".uipack-deck-bento")).toHaveAttribute("data-still", "");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "The grid proves the claim.",
      "Where the time went",
      "After the grid, the ask.",
    ]);
    // A detail page carries a talk track too: the slide's own, as this slide names no stop note.
    expect(pages[1].querySelector(".uipack-deck-print__say")).toHaveTextContent("Walk the grid.");
    // The pages scroll sideways in a narrow window, so the box is a named region on the Tab order.
    expect(screen.getByRole("region", { name: "Printable pages" })).toHaveAttribute("tabindex", "0");
  });

  it("print view: a detail page says what the notes give for its stop", () => {
    const stops: DeckSlide[] = [{ ...toured[0], notes: { say: "Walk the grid.", delivery: "", stops: { a: "Latency first." } } }];
    render(<DeckPlayer id="t11b" title="Test deck" slides={stops} view="print" printNotes />);
    const pages = Array.from(deck().querySelectorAll(".uipack-deck-print__page"));
    expect(pages.map((p) => p.querySelector(".uipack-deck-print__say")?.textContent)).toEqual([
      "SayWalk the grid.",
      "SayLatency first.",
    ]);
  });

  it("speaker view: cues the next build or tour stop, and paces the clock against the budget", () => {
    render(<DeckPlayer id="t12" title="Test deck" slides={toured} mode="presenter" minutes={2} />);
    const cue = () => deck().querySelector(".uipack-deck-presenter__cue")!.textContent;
    expect(cue()).toBe("Build 1 of 3: camera to Where the time went");
    press("ArrowRight");
    expect(cue()).toBe("Build 2 of 3: camera to Shipped");
    press("ArrowRight");
    expect(cue()).toBe("Build 3 of 3: camera pulls back to the whole grid");
    press("ArrowRight");
    expect(cue()).toBe("Next slide: After");
    expect(screen.getByText("Time budget").parentElement).toHaveTextContent("Time budget / 02:00");
    expect(deck().querySelector(".uipack-deck-presenter__pace")).toHaveTextContent(/on pace · this slide 00:00–01:/);
  });

  it("speaker view: at a camera stop the stop's notes lead, with the slide's whole track one click away", () => {
    const stops: DeckSlide[] = [
      { ...toured[0], notes: { say: "Walk the grid.", delivery: "Slowly.", stops: { a: "Latency first." } } },
      toured[1],
    ];
    render(<DeckPlayer id="t12b" title="Test deck" slides={stops} mode="presenter" />);
    const track = () => screen.getByRole("region", { name: "Talk track" });
    expect(track()).toHaveTextContent(/^SayWalk the grid\./);
    press("ArrowRight");
    expect(screen.getByRole("heading", { name: "Say at this stop" })).toBeInTheDocument();
    expect(track()).toHaveTextContent("Latency first.");
    const whole = track().querySelector("details")!;
    expect(whole).not.toHaveAttribute("open");
    expect(whole).toHaveTextContent("Walk the grid.");
    expect(track()).toHaveTextContent("DeliverySlowly.");
    // A stop without its own notes falls back to the slide's track.
    press("ArrowRight");
    expect(screen.queryByRole("heading", { name: "Say at this stop" })).toBeNull();
    expect(track()).toHaveTextContent(/^SayWalk the grid\./);
  });

  it("paces each slide by its share of the talk track, scaled to the budget", () => {
    const plan = slidePlan(toured, 120);
    expect(plan[0].start).toBe(0);
    expect(plan[plan.length - 1].end).toBeCloseTo(120);
    expect(plan[0].end).toBeGreaterThan(plan[1].end - plan[1].start);
  });
});
