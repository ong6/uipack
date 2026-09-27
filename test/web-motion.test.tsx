import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  Aurora,
  BeamLines,
  DotGrid,
  GrainOverlay,
  LineGrid,
  MagneticButton,
  Marquee,
  MaskedStar,
  NumberTicker,
  Reveal,
  ScrollTransform,
  TextScramble,
  TiltCard,
  scrambleFrame,
  scrollProgressOf,
  withViewTransition,
  withPaintTransition,
  DriftingGutters,
} from "../src/web";
import { paintTransitionCss } from "../src/web/hooks";

// A controllable IntersectionObserver: tests decide when things are on screen.
let observers: { cb: IntersectionObserverCallback; el?: Element }[] = [];
class FakeIO {
  entry: { cb: IntersectionObserverCallback; el?: Element };
  constructor(cb: IntersectionObserverCallback) {
    this.entry = { cb };
    observers.push(this.entry);
  }
  observe(el: Element) {
    this.entry.el = el;
  }
  disconnect() {}
  unobserve() {}
}
const setVisible = (visible: boolean) =>
  act(() => observers.forEach((o) => o.el && o.cb([{ isIntersecting: visible, target: o.el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)));

beforeEach(() => {
  observers = [];
  globalThis.__reduced = false;
});
afterEach(() => {
  vi.useRealTimers();
  globalThis.__reduced = false;
  // @ts-expect-error test cleanup
  delete window.IntersectionObserver;
});

describe("TextScramble", () => {
  it("frames resolve left to right and the typewriter reveals characters", () => {
    expect(scrambleFrame("Forty in", 0, "type")).toBe("");
    expect(scrambleFrame("Forty in", 0.5, "type")).toBe("Fort");
    const mid = scrambleFrame("Forty in", 0.5, "scramble", 3);
    expect(mid.startsWith("Fort")).toBe(true);
    expect(mid).toHaveLength(8);
    expect(mid[5]).toBe(" ");
    expect(scrambleFrame("Forty in", 1, "scramble")).toBe("Forty in");
  });

  it("scrambles once in view, then settles; screen readers get the final text", () => {
    vi.useFakeTimers();
    const { container } = render(<TextScramble text="Three left" duration={400} />);
    const live = container.querySelector(".uipack-web-scramble__live")!;
    expect(live).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".uipack-web-scramble__ghost")!.textContent).toBe("Three left");
    act(() => vi.advanceTimersByTime(120));
    expect(live.textContent).not.toBe("Three left");
    act(() => vi.advanceTimersByTime(400));
    expect(live.textContent).toBe("Three left");
  });

  it("shows the final text under reduced motion", () => {
    globalThis.__reduced = true;
    vi.useFakeTimers();
    const { container } = render(<TextScramble text="Three left" mode="type" />);
    act(() => vi.advanceTimersByTime(10));
    expect(container.querySelector(".uipack-web-scramble__live")!.textContent).toBe("Three left");
  });
});

describe("NumberTicker", () => {
  it("counts up when first in view and reserves the final width", () => {
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    vi.useFakeTimers();
    render(<NumberTicker value={92} suffix="%" duration={500} />);
    const live = screen.getByTestId("ticker-live");
    setVisible(true);
    act(() => vi.advanceTimersByTime(100));
    const early = Number(live.textContent!.replace("%", ""));
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(92);
    act(() => vi.advanceTimersByTime(600));
    expect(live.textContent).toBe("92%");
    expect(document.querySelector(".uipack-web-ticker .uipack-web-scramble__ghost")!.textContent).toBe("92%");
  });

  it("does not count before it is seen, and shows the value under reduced motion", () => {
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    const ssr = renderToString(<NumberTicker value={37} />);
    expect(ssr).toContain(">37<");
    render(<NumberTicker value={37} />);
    expect(screen.getByTestId("ticker-live").textContent).toBe("0");
    globalThis.__reduced = true;
    render(<NumberTicker value={9.4} format={{ minimumFractionDigits: 1 }} suffix=" s" />);
    setVisible(true);
    expect(screen.getAllByTestId("ticker-live")[1].textContent).toBe("9.4 s");
  });
});

describe("Marquee", () => {
  const items = ["React", "SVG", "Vite"].map((t) => <a href={`#${t}`}>{t}</a>);
  it("duplicates the list for the loop but keeps the copy inert and hidden", () => {
    const { container } = render(<Marquee label="Tools" items={items} />);
    const lists = container.querySelectorAll(".uipack-web-marquee__list");
    expect(lists).toHaveLength(2);
    expect(lists[1]).toHaveAttribute("aria-hidden", "true");
    expect(lists[1]).toHaveAttribute("inert");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
  it("pauses from its own button, and when off screen", () => {
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    const { container } = render(<Marquee label="Tools" items={items} />);
    const root = container.querySelector(".uipack-web-marquee")!;
    setVisible(true);
    expect(root).not.toHaveAttribute("data-paused");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(root).toHaveAttribute("data-paused");
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    setVisible(false);
    expect(root).toHaveAttribute("data-paused");
  });
  it("is a static wrapping row under reduced motion", () => {
    globalThis.__reduced = true;
    const { container } = render(<Marquee label="Tools" items={items} />);
    expect(container.querySelector(".uipack-web-marquee")).toHaveAttribute("data-static");
    expect(container.querySelectorAll(".uipack-web-marquee__list")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("hover motion", () => {
  it("tilts for a mouse, never for touch or reduced motion", () => {
    render(<TiltCard href="#t">Card</TiltCard>);
    const card = screen.getByRole("link", { name: "Card" });
    fireEvent.pointerMove(card, { clientX: 5, clientY: 5, pointerType: "touch" });
    expect(card.style.getPropertyValue("--tilt-x")).toBe("");
    fireEvent.pointerMove(card, { clientX: 5, clientY: 5, pointerType: "mouse" });
    expect(card.style.getPropertyValue("--tilt-x")).not.toBe("");
    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue("--tilt-x")).toBe("");
  });
  it("the magnetic button stays a real link and ignores reduced motion", () => {
    globalThis.__reduced = true;
    render(<MagneticButton href="#go">Start</MagneticButton>);
    const link = screen.getByRole("link", { name: "Start" });
    const wrap = link.parentElement!;
    fireEvent.pointerMove(wrap, { clientX: 5, clientY: 5, pointerType: "mouse" });
    expect(wrap.style.getPropertyValue("--pull-x")).toBe("");
  });
});

describe("scroll and reveal", () => {
  it("computes scroll progress through the viewport", () => {
    expect(scrollProgressOf({ top: 800, height: 200 }, 800)).toBe(0);
    expect(scrollProgressOf({ top: -200, height: 200 }, 800)).toBe(1);
    expect(scrollProgressOf({ top: 300, height: 200 }, 800)).toBe(0.5);
  });
  it("holds the midpoint under reduced motion", () => {
    globalThis.__reduced = true;
    const { container } = render(
      <ScrollTransform rotate={[-10, 10]} scale={[0.8, 1.2]}>
        <i />
      </ScrollTransform>,
    );
    const inner = container.querySelector<HTMLElement>(".uipack-web-scrollx__inner")!;
    expect(container.firstElementChild).toHaveAttribute("data-progress", "0.50");
    expect(inner.style.getPropertyValue("--st-rotate")).toBe("0.00deg");
    expect(inner.style.getPropertyValue("--st-scale")).toBe("1.000");
  });
  it("reveals children once in view, and is static without an observer", () => {
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    const { container } = render(
      <Reveal>
        <p>One</p>
        <p>Two</p>
      </Reveal>,
    );
    const group = container.firstElementChild as HTMLElement;
    expect(group).toHaveAttribute("data-state", "waiting");
    expect((group.children[1] as HTMLElement).style.getPropertyValue("--i")).toBe("1");
    setVisible(true);
    expect(group).toHaveAttribute("data-state", "shown");
    // @ts-expect-error remove observer
    delete window.IntersectionObserver;
    const plain = render(
      <Reveal>
        <p>Three</p>
      </Reveal>,
    );
    expect(plain.container.firstElementChild).toHaveAttribute("data-state", "static");
  });
});

describe("withViewTransition", () => {
  it("runs the update directly without the API or under reduced motion", async () => {
    const update = vi.fn();
    await withViewTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    Object.assign(document, { startViewTransition: start });
    await withViewTransition(update);
    expect(start).toHaveBeenCalledTimes(1);
    globalThis.__reduced = true;
    await withViewTransition(update);
    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(3);
    // @ts-expect-error cleanup
    delete document.startViewTransition;
  });
});

describe("withPaintTransition", () => {
  afterEach(() => {
    // @ts-expect-error cleanup
    delete document.startViewTransition;
    document.head.querySelectorAll("style[data-uipack-paint]").forEach((s) => s.remove());
  });

  it("runs the update directly without the API or under reduced motion, adding no style", async () => {
    const update = vi.fn();
    await withPaintTransition(update);
    expect(update).toHaveBeenCalledTimes(1);
    const start = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    Object.assign(document, { startViewTransition: start });
    globalThis.__reduced = true;
    await withPaintTransition(update);
    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
    expect(document.head.querySelector("style[data-uipack-paint]")).toBeNull();
    expect(document.documentElement).not.toHaveClass("theme-switching");
  });

  it("injects fresh keyframes for the transition and removes them when it finishes", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((r) => (finish = r));
    const update = vi.fn();
    let styleDuringUpdate: string | null = null;
    Object.assign(document, {
      startViewTransition: (cb: () => void) => {
        styleDuringUpdate = document.head.querySelector("style[data-uipack-paint]")?.textContent ?? null;
        cb();
        return { finished };
      },
    });
    const html = document.documentElement;
    expect(html).not.toHaveClass("theme-switching");
    const done = withPaintTransition(update, { duration: 900 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(html).toHaveClass("theme-switching");
    expect(styleDuringUpdate).toMatch(/html\.theme-switching \*,[^{]*\{\s*transition: none !important;/);
    expect(styleDuringUpdate).toContain("::view-transition-new(root)");
    expect(styleDuringUpdate).toContain("mix-blend-mode: normal");
    expect(styleDuringUpdate).toContain("900ms linear both");
    expect(document.head.querySelectorAll("style[data-uipack-paint]")).toHaveLength(1);
    finish();
    await done;
    expect(document.head.querySelector("style[data-uipack-paint]")).toBeNull();
    expect(html).not.toHaveClass("theme-switching");
  });

  it("removes the style even when the transition is skipped", async () => {
    Object.assign(document, { startViewTransition: () => ({ finished: Promise.reject(new Error("skipped")) }) });
    await expect(withPaintTransition(() => undefined)).resolves.toBeUndefined();
    expect(document.head.querySelector("style[data-uipack-paint]")).toBeNull();
    expect(document.documentElement).not.toHaveClass("theme-switching");
  });

  it("samples 41 keyframes of a sheet plus a body and bead per drip, new drips every call", () => {
    const a = paintTransitionCss(1120, 900);
    const b = paintTransitionCss(1120, 900);
    const frames = a.match(/^\s*[\d.]+% \{ .*\}$/gm) ?? [];
    expect(frames).toHaveLength(41);
    const first = frames[0]!;
    const last = frames[40]!;
    expect(first.startsWith("0% ")).toBe(true);
    expect(last.startsWith("100% ")).toBe(true);
    const drips = Math.max(7, Math.min(26, Math.round(1120 / 56)));
    const images = a.match(/mask-image: (.*);/)![1];
    expect(images.match(/linear-gradient/g)).toHaveLength(1 + drips);
    expect(images.match(/radial-gradient/g)).toHaveLength(drips);
    // The sheet starts empty and ends past the bottom edge (1.14 x height).
    expect(first).toContain("mask-size: 1120px 0px");
    expect(last).toContain("mask-size: 1120px 1026px");
    // The bead is 1.35x the body's width.
    const sizes = last.match(/mask-size: (.*);/)![1].split(", ");
    const body = parseFloat(sizes[1]!);
    const bead = parseFloat(sizes[2]!);
    expect(bead / body).toBeCloseTo(1.35, 1);
    expect(a.match(/@keyframes (\S+)/)![1]).not.toBe(b.match(/@keyframes (\S+)/)![1]);
    expect(a.replace(/uipack-paint-\S+/g, "")).not.toBe(b.replace(/uipack-paint-\S+/g, ""));
  });
});

describe("DriftingGutters", () => {
  it("renders two decorative gutters with drifting grids and signals, driven by props", () => {
    const { container } = render(<DriftingGutters />);
    const root = container.querySelector(".uipack-web-gutters") as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("data-min");
    expect(root.style.getPropertyValue("--gutters-content")).toBe("1120px");
    expect(root.style.getPropertyValue("--gutters-top")).toBe("72px");
    expect(root.style.getPropertyValue("--gutters-drift")).toBe("48s");
    const sides = root.querySelectorAll(".uipack-web-gutters__side");
    expect([...sides].map((s) => s.getAttribute("data-side"))).toEqual(["left", "right"]);
    expect(root.querySelectorAll(".uipack-web-gutters__drift")).toHaveLength(2);
    expect(root.querySelectorAll(".uipack-web-gutters__signal")).toHaveLength(6);
    expect(root.querySelector("style")).toBeNull();
    const norm = (html: string) => html.replace(/style="[^"]*"/g, (m) => m.replace(/[\s;]/g, ""));
    expect(norm(renderToString(<DriftingGutters />))).toBe(norm(container.innerHTML));
  });

  it("brings its own breakpoint rule for a non-default minViewport", () => {
    const { container } = render(<DriftingGutters minViewport={960} contentWidth="60%" top={0} drift={20} />);
    const root = container.querySelector(".uipack-web-gutters") as HTMLElement;
    expect(root).toHaveAttribute("data-min", "960");
    expect(root.style.getPropertyValue("--gutters-content")).toBe("60%");
    expect(root.querySelector("style")?.textContent).toContain("@media (min-width: 960px)");
  });

  it("stops moving under reduced motion and hides below 1280px in the stylesheet", () => {
    // Its own file so a page can load it without the rest of web.css.
    const css = readFileSync("src/web/gutters.css", "utf8");
    expect(readFileSync("src/web/web.css", "utf8")).not.toMatch(/uipack-web-gutters/);
    expect(JSON.parse(readFileSync("package.json", "utf8")).exports["./web-gutters.css"]).toBe("./dist/web-gutters.css");
    const reduced = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.uipack-web-gutters__drift,\s*\.uipack-web-gutters__signal \{ animation: none; \}/);
    expect(css).toMatch(/\.uipack-web-gutters \{ display: none; \}\s*@media \(min-width: 1280px\)/);
    expect(css).toMatch(/pointer-events: none;[^}]*color: var\(--web-gutters-color, var\(--web-accent/);
  });
});

describe("backgrounds", () => {
  it("are decorative and render identically on server and client", () => {
    const tree = (
      <>
        <GrainOverlay />
        <DotGrid spotlight />
        <LineGrid />
        <Aurora />
        <MaskedStar />
        <BeamLines />
      </>
    );
    const { container } = render(tree);
    const layers = container.querySelectorAll("[data-bg]");
    expect(layers).toHaveLength(6);
    layers.forEach((l) => expect(l).toHaveAttribute("aria-hidden", "true"));
    expect(renderToString(<BeamLines />)).toBe(renderToString(<BeamLines />));
  });
  it("moving backgrounds pause off screen", () => {
    window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    const { container } = render(
      <>
        <Aurora />
        <BeamLines />
      </>,
    );
    setVisible(false);
    expect(container.querySelector(".uipack-web-aurora")).toHaveAttribute("data-paused");
    expect(container.querySelector(".uipack-web-beams")).toHaveAttribute("data-paused");
    setVisible(true);
    expect(container.querySelector(".uipack-web-aurora")).not.toHaveAttribute("data-paused");
  });
  it("aurora stays under the contrast budget for low-emphasis text", () => {
    const css = readFileSync("src/web/web.css", "utf8");
    type RGB = [number, number, number];
    const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
    const lum = (c: RGB) =>
      c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: RGB, b: RGB) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const blend = (fg: RGB, bg: RGB, a: number): RGB => fg.map((v, i) => v * a + bg[i] * (1 - a)) as RGB;
    for (const block of [css.slice(css.indexOf(".uipack-web {"), css.indexOf("@media (prefers-color-scheme: dark)")), css.slice(css.indexOf('[data-theme="dark"] .uipack-web:not'))]) {
      const get = (k: string) => block.match(new RegExp(`--web-${k}: ([^;]+);`))![1].trim();
      const ink = get("ink-rgb").split(/\s+/).map(Number) as RGB;
      const bg = hex(get("bg"));
      // Worst case: the accent blob at full layer opacity over the page.
      const base = blend(hex(get("accent")), bg, Number(get("aurora-opacity")));
      expect(ratio(blend(ink, base, 0.66), base)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
