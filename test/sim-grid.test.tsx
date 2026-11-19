import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SimGrid, type SimChoice, type SimRun } from "../src";
import { cellMarks, cellState, choiceKey, gridColumns, gridViewBox, prepareRun, simAt, statePaths } from "../src/sim/model";
import { onServer } from "./on-server";

const subpaths = (d: string) => (d.match(/M/g) ?? []).length;

describe("SimGrid model", () => {
  const run = prepareRun({ start: [0, 1, 2, 0], end: [3, 2, 5, -1] });

  it("prepares a run: sorted times, an end never before its start, the finish and the longest cell", () => {
    expect([...run.starts]).toEqual([0, 0, 1, 2]);
    expect([...run.ends]).toEqual([0, 2, 3, 5]);
    expect(run.end[3]).toBe(0);
    expect(run.finish).toBe(5);
    expect(run.longest).toBe(3);
  });

  it("reads any moment: started, done and the mean over the cells done so far", () => {
    expect(simAt(run, 0)).toEqual({ t: 0, started: 2, done: 1, mean: 0 });
    expect(simAt(run, 2)).toEqual({ t: 2, started: 4, done: 2, mean: 0.5 });
    expect(simAt(run, 5)).toEqual({ t: 5, started: 4, done: 4, mean: (0 + 1 + 3 + 3) / 4 });
    expect(simAt(prepareRun({ end: [1, 2] }), 0.5).mean).toBeNull();
    expect(cellState(run, 2, 1.5)).toBe("waiting");
    expect(cellState(run, 0, 1.5)).toBe("running");
    expect(cellState(run, 1, 2)).toBe("done");
  });

  it("starts every cell at 0 without start times", () => {
    const r = prepareRun({ end: [2, 1] });
    expect(simAt(r, 0).started).toBe(2);
  });

  it("throws on mismatched lengths and on a time that is not a number", () => {
    expect(() => prepareRun({ start: [0], end: [1, 2] })).toThrow(/one time per cell/);
    expect(() => prepareRun({ end: [1, Number.NaN] })).toThrow(/cell 1/);
  });

  it("lays a thousand cells out 50 by 20 wide and 25 by 40 narrow", () => {
    expect(gridColumns(1000, false)).toBe(50);
    expect(gridColumns(1000, true)).toBe(25);
    expect(gridViewBox(1000, 50)).toBe("0 0 498 198");
    expect(gridColumns(3, false)).toBe(3);
    expect(gridColumns(0, false)).toBe(1);
  });

  it("draws one path per state, each cell in exactly one, with a shape per state", () => {
    const marks = cellMarks(run.count, 2);
    const d = statePaths(run, marks, 1.5);
    expect(subpaths(d.waiting) + subpaths(d.running) + subpaths(d.done)).toBe(4);
    expect([subpaths(d.waiting), subpaths(d.running), subpaths(d.done)]).toEqual([1, 2, 1]);
    expect(marks.waiting[0]).toBe("M0.5 0.5h7v7h-7z");
    expect(marks.running[1]).toBe("M12 2h4v4h-4z");
    expect(marks.done[2]).toBe("M0 10h8v8h-8z");
  });

  it("keys a choice by design and options, whatever order the options come in", () => {
    expect(choiceKey({ design: "a", options: { y: true, x: false } })).toBe(
      choiceKey({ design: "a", options: { x: false, y: true } }),
    );
    expect(choiceKey({ design: "a", options: { x: true } })).not.toBe(choiceKey({ design: "a", options: { x: false } }));
  });
});

// A controllable IntersectionObserver: on screen only when a test says so.
let observers: { cb: IntersectionObserverCallback }[] = [];
class FakeIO {
  entry: { cb: IntersectionObserverCallback };
  constructor(cb: IntersectionObserverCallback) {
    this.entry = { cb };
    observers.push(this.entry);
  }
  observe() {}
  disconnect() {
    observers = observers.filter((o) => o !== this.entry);
  }
}
const setVisible = (visible: boolean) =>
  act(() => {
    for (const o of [...observers])
      o.cb(
        [{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
  });

// requestAnimationFrame driven by hand: each frame() call runs the queued callbacks at `now`.
let queue: FrameRequestCallback[] = [];
const frame = (now: number) =>
  act(() => {
    const due = queue;
    queue = [];
    due.forEach((cb) => cb(now));
  });

const designs = [
  { id: "fast", label: "Fast" },
  { id: "slow", label: "Slow" },
];
const options = [{ id: "jitter", label: "Jitter" }];
// Fast: four cells done at 1, 2, 3, 4. Slow: the same, twice as long. Jitter adds 1 to every end.
const simulate = vi.fn(({ design, options }: SimChoice): SimRun => {
  const k = design === "slow" ? 2 : 1;
  const extra = options.jitter ? 1 : 0;
  return { end: [1, 2, 3, 4].map((t) => t * k + extra) };
});

const grid = (props: Partial<Parameters<typeof SimGrid>[0]> = {}) => (
  <SimGrid title="Writers" alt="Four writers" designs={designs} options={options} simulate={simulate} duration={4} {...props} />
);
const counters = () => [...document.querySelectorAll(".uipack-sim__readout dd > span:first-child")].map((s) => s.textContent);
const pathOf = (state: string) => document.querySelector(`.uipack-sim__cells[data-sim="${state}"]`)!.getAttribute("d")!;

describe("SimGrid", () => {
  beforeEach(() => {
    observers = [];
    queue = [];
    simulate.mockClear();
    globalThis.__reduced = false;
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      queue.push(cb);
      return queue.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      queue = [];
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.__reduced = false;
  });

  it("renders the finished run on the server: counters, every cell done, the key and the controls", async () => {
    const html = await onServer(async ({ renderToString }) => {
      const { SimGrid: ServerGrid } = await import("../src");
      return renderToString(
        <ServerGrid title="Writers" alt="Four writers" designs={designs} options={options} simulate={simulate} duration={4} />,
      );
    });
    expect(html).toContain("4.0 s");
    expect(html).toMatch(/>4<\/span><span class="uipack-sim__total">/);
    expect(html).toContain('data-sim-state="finished"');
    expect(html).toContain("Simulated time");
    expect(html).toContain("Play</button>");
  });

  it("rests finished until it nears the viewport, then rewinds and plays at the first design's speed", () => {
    render(grid());
    expect(counters()).toEqual(["4.0 s", "2.5 s", "4"]);
    expect(subpaths(pathOf("done"))).toBe(4);
    setVisible(true);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(counters()[0]).toBe("0.0 s");
    // duration 4 s for a 4 s run: one simulated second per real second, at most 50ms a frame.
    frame(1000);
    for (let now = 1050; now <= 3000; now += 50) frame(now);
    expect(counters()[0]).toBe("2.0 s");
    expect(counters()[2]).toBe("2");
    expect(subpaths(pathOf("done"))).toBe(2);
    expect(subpaths(pathOf("running"))).toBe(2);
  });

  it("pauses off screen and resumes where it was", () => {
    render(grid());
    setVisible(true);
    frame(0);
    for (let now = 50; now <= 1000; now += 50) frame(now);
    expect(counters()[0]).toBe("1.0 s");
    setVisible(false);
    expect(queue).toHaveLength(0);
    setVisible(true);
    frame(5000);
    frame(5050);
    frame(5100);
    expect(counters()[0]).toBe("1.1 s");
  });

  it("finishes, announces it and offers Play again; Reset waits at zero with every cell waiting", () => {
    render(grid());
    setVisible(true);
    frame(0);
    for (let now = 50; now <= 4100; now += 50) frame(now);
    expect(screen.getByRole("status")).toHaveTextContent("Finished. 4 of 4 done at 4.0 s, mean time to done 2.5 s.");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(counters()).toEqual(["0.0 s", "–", "0"]);
    expect(subpaths(pathOf("waiting"))).toBe(0);
    expect(subpaths(pathOf("running"))).toBe(4);
    expect(document.querySelector(".uipack-sim")).toHaveAttribute("data-sim-state", "idle");
    expect(screen.getByRole("status")).toHaveTextContent("Reset.");
  });

  it("Pause holds the moment and says so", () => {
    render(grid());
    setVisible(true);
    frame(0);
    for (let now = 50; now <= 1500; now += 50) frame(now);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("status")).toHaveTextContent("Paused. 1 of 4 done at 1.5 s");
    frame(9000);
    expect(counters()[0]).toBe("1.5 s");
    expect(document.querySelector(".uipack-sim")).toHaveAttribute("data-sim-state", "paused");
  });

  it("compares designs at the same moment, and a finished run switches to the other run finished", () => {
    render(grid());
    // Finished: the slow design shows finished too, at its own end.
    fireEvent.click(screen.getByRole("radio", { name: "Slow" }));
    expect(simulate).toHaveBeenLastCalledWith({ design: "slow", options: { jitter: false } });
    expect(counters()).toEqual(["8.0 s", "5.0 s", "4"]);
    expect(screen.getByRole("status")).toHaveTextContent("Slow. 4 of 4 done at 8.0 s");
    // Paused at 3.3 s on the slow design: the fast one at the same moment has three done.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    setVisible(true);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    frame(0);
    for (let now = 50; now <= 3300; now += 50) frame(now);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(counters()).toEqual(["3.3 s", "2.0 s", "1"]);
    fireEvent.click(screen.getByRole("radio", { name: "Fast" }));
    expect(counters()).toEqual(["3.3 s", "2.0 s", "3"]);
  });

  it("an option re-simulates with its state", () => {
    render(grid());
    fireEvent.click(screen.getByRole("checkbox", { name: "Jitter" }));
    expect(simulate).toHaveBeenLastCalledWith({ design: "fast", options: { jitter: true } });
    expect(counters()[0]).toBe("5.0 s");
  });

  it("under reduced motion holds the finished run, with no Play or Reset, and never plays", () => {
    globalThis.__reduced = true;
    render(grid());
    setVisible(true);
    expect(screen.queryByRole("button", { name: /Play|Pause|Reset/ })).toBeNull();
    expect(counters()).toEqual(["4.0 s", "2.5 s", "4"]);
    fireEvent.click(screen.getByRole("radio", { name: "Slow" }));
    expect(counters()[0]).toBe("8.0 s");
    expect(queue).toHaveLength(0);
  });

  it("static holds the finished run and keeps the design and option controls", () => {
    render(grid({ static: true }));
    setVisible(true);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("one design: no design control; the site's labels and time format", () => {
    render(
      grid({
        designs: [designs[0]],
        labels: { time: "Clock", count: "Writers done", running: "Pushing" },
        formatTime: (t) => `${t * 1000} ms`,
      }),
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("Clock")).toBeInTheDocument();
    expect(screen.getByText("Writers done")).toBeInTheDocument();
    expect(screen.getByText("Pushing")).toBeInTheDocument();
    expect(counters()[0]).toBe("4000 ms");
  });

  it("pointing at a key entry fades the other states", () => {
    render(grid());
    fireEvent.pointerEnter(within(screen.getByRole("list", { name: "Legend" })).getByText("Done"), { pointerType: "mouse" });
    expect(document.querySelector('.uipack-sim__cells[data-sim="done"]')).toHaveAttribute("data-state", "hit");
    expect(document.querySelector('.uipack-sim__cells[data-sim="waiting"]')).toHaveAttribute("data-state", "dim");
    fireEvent.pointerLeave(within(screen.getByRole("list", { name: "Legend" })).getByText("Done"), { pointerType: "mouse" });
    expect(document.querySelector('.uipack-sim__cells[data-sim="done"]')).not.toHaveAttribute("data-state");
  });

  it("names the grid for assistive technology and labels the figure by its title", () => {
    render(grid());
    expect(screen.getByRole("img", { name: "Four writers" })).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Writers" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Design" })).toBeInTheDocument();
  });
});
