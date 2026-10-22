import { existsSync, readdirSync, readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  CtaButton,
  DemoPlayer,
  GlassNav,
  Heading,
  RevealText,
  SpotlightCard,
  StarHero,
  WebSurface,
  demoEnd,
  demoFrame,
  stepStart,
  typeMetrics,
  typeRole,
  typeScale,
  TYPE_FACES,
  type DemoStep,
} from "../src/web";
import { fontFiles } from "../scripts/css-bundles";
import { onServer } from "./on-server";

// Runs fake timers inside act. A block body: act on a non-void callback returns a promise.
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const steps: DemoStep[] = [
  { id: "ask", label: "Ask", title: "Say it", prompt: "Clear it" },
  {
    id: "act",
    label: "Act",
    title: "Watch it",
    actions: [
      { label: "Archived", metric: 20 },
      { label: "Filed", metric: 5 },
    ],
  },
  { id: "review", label: "Review", title: "Three left", metric: 3, screen: <p>Final screen</p> },
];
const timing = { leadMs: 100, typeMs: 10, actionMs: 200, holdMs: 300 };

describe("type scale", () => {
  it("is 16px x 1.25 in rem with tighter large headings", () => {
    expect(typeScale(0)).toBe(1);
    expect(typeScale(1)).toBe(1.25);
    expect(typeScale(6)).toBeCloseTo(3.8147, 4);
    expect(typeScale(-1)).toBe(0.8);
    expect(typeMetrics(0).lineHeight).toBe(1.5);
    expect(typeMetrics(6).lineHeight).toBeLessThan(typeMetrics(2).lineHeight);
    expect(typeMetrics(6).letterSpacing).toBe("-0.01em");
  });

  it("gives headings from step 4 the display face and smaller ones the text face", () => {
    expect([6, 5, 4].map(typeRole)).toEqual(["display", "display", "display"]);
    expect([3, 2, 1, 0].map(typeRole)).toEqual(["text", "text", "text", "text"]);
    expect(TYPE_FACES).toEqual({ display: "Instrument Serif", text: "IBM Plex Sans", mono: "IBM Plex Mono" });
    const css = readFileSync("src/web/web.css", "utf8");
    expect(css).toMatch(
      /\.uipack-web-heading:is\(\[data-step="4"\], \[data-step="5"\], \[data-step="6"\]\) \{\n  font-family: var\(--web-font-display\);/,
    );
    for (const step of [0, 1, 2, 3, 4, 5, 6]) {
      const rule = css.match(new RegExp(`\\.uipack-web-heading\\[data-step="${step}"\\] \\{([^}]*)\\}`))![1];
      expect(Number(rule.match(/line-height: ([\d.]+)/)![1])).toBe(typeMetrics(step).lineHeight);
      const tracking = rule.match(/letter-spacing: ([^;]+);/)?.[1] ?? "0em";
      expect(tracking).toBe(
        typeMetrics(step).role === "display" ? "var(--web-display-tracking)" : typeMetrics(step).letterSpacing,
      );
      // Text headings default to 600 on .uipack-web-heading; display weight comes from its token.
      if (typeMetrics(step).role === "text")
        expect(Number(rule.match(/font-weight: (\d+)/)?.[1] ?? 600)).toBe(typeMetrics(step).weight);
    }
    expect(css).toContain(`--web-display-tracking: ${typeMetrics(6).letterSpacing};`);
    expect(css).toMatch(/--web-font-display: "Instrument Serif", "Instrument Serif Fallback"/);
    expect(css).toMatch(/--web-font-sans: "IBM Plex Sans", "IBM Plex Sans Fallback"/);
    expect(css).toContain("--web-font-text: var(--web-font-sans);");
    expect(css).toMatch(/--web-font-mono: "IBM Plex Mono", "IBM Plex Mono Fallback"/);
  });

  it("keeps the CSS tokens on the same scale", () => {
    const css = readFileSync("src/web/web.css", "utf8");
    for (const step of [-1, 0, 1, 2, 3, 4, 5, 6]) {
      const m = css.match(new RegExp(`--web-step-${step}: ([\\d.]+)rem`));
      expect(Number(m?.[1])).toBeCloseTo(typeScale(step), 3);
    }
  });
});

// WCAG relative luminance and contrast, including text drawn with alpha over a surface.
type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const lum = (c: RGB) =>
  c
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const blend = (fg: RGB, bg: RGB, a: number): RGB => fg.map((v, i) => v * a + bg[i] * (1 - a)) as RGB;

describe("Landing fonts", () => {
  const urls = (css: string) => [...css.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
  it("self-hosts every face as woff2 with swap, latin only, beside its licence", () => {
    const css = readFileSync("src/web/web.css", "utf8");
    const faces = css.match(/@font-face \{[^}]*\}/g)!;
    const hosted = faces.filter((f) => f.includes("url("));
    expect(hosted).toHaveLength(7);
    for (const f of hosted) {
      expect(f).toContain("font-display: swap;");
      expect(f).toMatch(/unicode-range:\s+U\+0000-00FF/);
    }
    for (const u of urls(css)) {
      expect(u).toMatch(/^\.\/fonts\/[a-z0-9-]+\.woff2$/);
      expect(existsSync(`src/web/${u}`)).toBe(true);
    }
    // Nothing leaves the package: no absolute or protocol-relative font URLs.
    expect(css).not.toMatch(/url\("?(https?:)?\/\//);
    const files = readdirSync("src/web/fonts");
    for (const name of ["instrument-serif", "ibm-plex-sans", "ibm-plex-mono"]) expect(files).toContain(`OFL-${name}.txt`);
    expect(files.filter((f) => f.endsWith(".woff2")).sort()).toEqual(
      urls(css)
        .map((u) => u.slice(8))
        .sort(),
    );
    // Fallback faces are metric-matched so the swap barely moves text.
    for (const f of faces.filter((f) => f.includes("Fallback"))) expect(f).toMatch(/size-adjust: [\d.]+%;[\s\S]*ascent-override/);
  });
  it("ships the fonts in dist where the built web.css points", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.exports["./fonts/*"]).toBe("./dist/fonts/*");
    expect(fontFiles.out).toBe("fonts"); // scripts/build-css.ts copies src/web/fonts there
    const built = readFileSync("dist/web.css", "utf8");
    expect(urls(built).length).toBe(7);
    for (const u of urls(built)) expect(existsSync(`dist/${u}`)).toBe(true);
    for (const name of ["instrument-serif", "ibm-plex-sans", "ibm-plex-mono"])
      expect(existsSync(`dist/fonts/OFL-${name}.txt`)).toBe(true);
  });
});

describe("Landing colour tokens", () => {
  const css = readFileSync("src/web/web.css", "utf8");
  const blocks = {
    light: css.slice(css.indexOf(".uipack-web {"), css.indexOf("@media (prefers-color-scheme: dark)")),
    dark: css.slice(css.indexOf('[data-theme="dark"] .uipack-web:not')),
  };
  it.each(Object.entries(blocks))("passes 4.5:1 for small text in %s", (_name, block) => {
    const get = (k: string) => block.match(new RegExp(`--web-${k}: ([^;]+);`))![1].trim();
    const ink = get("ink-rgb").split(/\s+/).map(Number) as RGB;
    const [bg, surface, secondary, accent, onAccent] = ["bg", "surface", "secondary", "accent", "on-accent"].map((k) =>
      hex(get(k)),
    );
    for (const base of [bg, surface, secondary]) {
      expect(contrast(blend(ink, base, 0.66), base)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(blend(ink, base, 0.87), base)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(onAccent, accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it("uses the same 66% low emphasis the docs promise", () => {
    expect(css).toContain("--web-ink-low: rgb(var(--web-ink-rgb) / 0.66)");
    expect(css).toContain("--web-ink-medium: rgb(var(--web-ink-rgb) / 0.87)");
  });
  it("scopes every selector under the Landing prefix", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, "")
      .match(/[^{}@;]+(?=\{)/g)!
      .flatMap((s) => s.split(/,(?![^(]*\))/))
      .map((s) => s.trim())
      .filter(
        (s) =>
          s &&
          s !== "font-face" &&
          !s.startsWith("@") &&
          !/^(from|to|\d+%)$/.test(s) &&
          !s.startsWith("(") &&
          !s.includes("prefers-") &&
          !/^(media|supports|container)\b/.test(s),
      );
    expect(selectors.length).toBeGreaterThan(50);
    for (const s of selectors) expect(s).toMatch(/uipack-web/);
  });
});

describe("demo timeline", () => {
  it("types, ticks actions, settles, and stops at the last step", () => {
    expect(demoFrame(steps, 0, timing, 40)).toMatchObject({ step: 0, typed: 0, settled: false, metric: 40 });
    expect(demoFrame(steps, 100 + 35, timing, 40).typed).toBe(4);
    const actStart = stepStart(steps, 1, timing);
    expect(actStart).toBe(100 + 80 + 300);
    expect(demoFrame(steps, actStart + 100 + 250, timing, 40)).toMatchObject({ step: 1, actionsDone: 1, metric: 20 });
    const end = demoEnd(steps, timing);
    expect(demoFrame(steps, end, timing, 40)).toMatchObject({ step: 2, settled: true, done: true, metric: 3 });
    expect(demoFrame(steps, end + 99999, timing, 40)).toEqual(demoFrame(steps, end, timing, 40));
  });
});

describe("DemoPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.__reduced = false;
  });
  afterEach(() => {
    vi.useRealTimers();
    globalThis.__reduced = false;
  });
  const metric = () => screen.getByTestId("demo-metric").textContent;
  const step = (c: HTMLElement) => c.querySelector(".uipack-web-demo")!.getAttribute("data-step");

  it("plays through the steps, holds on Pause, and restarts on Replay", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} initialMetric={40} />);
    advance(stepStart(steps, 1, timing) + 700);
    expect(step(container)).toBe("1");
    expect(metric()).toBe("5");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    const held = step(container);
    advance(5000);
    expect(step(container)).toBe(held);
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-state", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(step(container)).toBe("0");
    expect(metric()).toBe("40");
    advance(demoEnd(steps, timing) + 200);
    expect(step(container)).toBe("2");
    expect(screen.getByText("Final screen")).toBeInTheDocument();
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-state", "finished");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("step tabs seek by click and by arrow keys, with 01/02/03 labels", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} autoplay={false} />);
    const tabs = screen.getByRole("group", { name: "Demo steps" });
    expect(tabs.textContent).toContain("01 Ask");
    fireEvent.click(screen.getByRole("button", { name: /03 Review/ }));
    expect(step(container)).toBe("2");
    expect(screen.getByRole("button", { name: /03 Review/ })).toHaveAttribute("aria-current", "step");
    fireEvent.keyDown(tabs, { key: "ArrowRight" });
    expect(step(container)).toBe("0");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /01 Ask/ }));
    fireEvent.keyDown(tabs, { key: "End" });
    expect(step(container)).toBe("2");
  });

  it("does not advance without autoplay until Play", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} autoplay={false} />);
    advance(3000);
    expect(step(container)).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(stepStart(steps, 1, timing) + 10);
    expect(step(container)).toBe("1");
  });

  it("holds the final state under reduced motion, with every step kept as text", () => {
    globalThis.__reduced = true;
    const { container } = render(
      <DemoPlayer steps={steps} label="Demo" timing={timing} initialMetric={40} cta={<a href="#try">Try it yourself</a>} />,
    );
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-state", "static");
    expect(metric()).toBe("3");
    expect(screen.getByText("Final screen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pause|Replay|Play/ })).toBeNull();
    const list = screen.getByRole("list", { name: "Demo steps" });
    expect(list.children).toHaveLength(3);
    expect(list.textContent).toContain("Filed");
    expect(screen.getByRole("link", { name: "Try it yourself" })).toBeInTheDocument();
  });

  it("opens on the plan: the first acting step's actions listed as queued, not an empty pane", () => {
    render(<DemoPlayer steps={steps} label="Demo" timing={timing} autoplay={false} />);
    const log = screen.getByRole("list", { name: "Agent actions" });
    expect([...log.children].map((li) => li.getAttribute("data-state"))).toEqual(["pending", "pending"]);
    expect(log.textContent).toContain("Archived");
    expect(log.textContent).toContain("(queued)");
  });

  it("server-renders the first frame without touching window", async () => {
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/web");
      return renderToString(<server.DemoPlayer steps={steps} label="Demo" initialMetric={40} />);
    });
    expect(html).toContain("Clear it");
    expect(html).toContain('data-step="0"');
  });
});

describe("SpotlightCard", () => {
  it("tracks a fine pointer through CSS variables and ignores touch", () => {
    render(<SpotlightCard href="#x">Card</SpotlightCard>);
    const card = screen.getByRole("link", { name: "Card" });
    fireEvent.pointerMove(card, { clientX: 30, clientY: 12, pointerType: "touch" });
    expect(card.style.getPropertyValue("--spot-x")).toBe("");
    fireEvent.pointerMove(card, { clientX: 30, clientY: 12, pointerType: "mouse" });
    expect(card.style.getPropertyValue("--spot-x")).toBe("30px");
    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue("--spot-x")).toBe("");
  });
});

describe("GlassNav", () => {
  it("toggles the menu, closes on Escape, and returns focus", () => {
    render(<GlassNav brand="Tidy" links={[{ label: "Pricing", href: "#p" }]} cta={<CtaButton href="#s">Start</CtaButton>} />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("data-variant", "primary");
  });
});

describe("RevealText and hierarchy", () => {
  it("keeps every word in the DOM and stays static under reduced motion", () => {
    globalThis.__reduced = true;
    const { container } = render(<RevealText text="Three things need you" />);
    expect(container.textContent).toBe("Three things need you");
    expect(container.firstElementChild).toHaveAttribute("data-state", "static");
    globalThis.__reduced = false;
  });

  it("renders the star hero with one h1 and the CTA as a link", () => {
    render(
      <WebSurface theme="dark">
        <StarHero title="Forty in" subtitle="Three left" actions={<CtaButton href="#go">Start</CtaButton>} />
        <Heading level={2}>Next</Heading>
      </WebSurface>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("data-step", "6");
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "#go");
  });
});
