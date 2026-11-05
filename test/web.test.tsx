import { existsSync, readdirSync, readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
import { contrast as ratio, readStyle, role } from "./style-values";

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
      /\.uipack-web-heading:is\(\[data-step="4"\], \[data-step="5"\], \[data-step="6"\]\) \{\n\s+font-family: var\(--web-font-display\);/,
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
    // typeMetrics describes Landing, whose value set holds the display tracking.
    expect(readFileSync("src/styles/landing.css", "utf8")).toContain(`--ui-display-tracking: ${typeMetrics(6).letterSpacing};`);
    const landing = readStyle("landing");
    expect(landing["font-display"]).toMatch(/^"Instrument Serif", "Instrument Serif Fallback"/);
    expect(landing["font-text"]).toMatch(/^"IBM Plex Sans", "IBM Plex Sans Fallback"/);
    expect(landing["font-label"]).toMatch(/^"IBM Plex Mono", "IBM Plex Mono Fallback"/);
    expect(css).toContain("--web-font-text: var(--web-font-sans);");
    expect(css).toContain("--web-font-display: var(--ui-web-font-display, var(--ui-font-display));");
  });

  it("keeps the CSS tokens on the same scale", () => {
    const css = readFileSync("src/web/web.css", "utf8");
    for (const step of [-1, 0, 1, 2, 3, 4, 5, 6]) {
      const m = css.match(new RegExp(`--web-step-${step}: ([\\d.]+)rem`));
      expect(Number(m?.[1])).toBeCloseTo(typeScale(step), 3);
    }
  });
});

describe("Self-hosted fonts", () => {
  const urls = (css: string) => [...css.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
  it("self-hosts every face as woff2 with swap, latin only, beside its licence", () => {
    // Every style's faces, declared once; a browser fetches a face only when a style uses it.
    const css = readFileSync("src/web/fonts.css", "utf8");
    const faces = css.match(/@font-face \{[^}]*\}/g)!;
    const hosted = faces.filter((f) => f.includes("url("));
    expect(hosted).toHaveLength(14);
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
    for (const name of ["instrument-serif", "ibm-plex-sans", "ibm-plex-mono", "anton", "archivo", "martian-mono"])
      expect(files).toContain(`OFL-${name}.txt`);
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
    expect(urls(built).length).toBe(14);
    for (const u of urls(built)) expect(existsSync(`dist/${u}`)).toBe(true);
    // Every entry carries the faces (Technical's on figures, charts and the article too).
    expect(urls(readFileSync("dist/theme.css", "utf8")).length).toBe(14);
    for (const name of ["instrument-serif", "ibm-plex-sans", "ibm-plex-mono", "archivo", "martian-mono"])
      expect(existsSync(`dist/fonts/OFL-${name}.txt`)).toBe(true);
  });
});

describe("Landing colour tokens", () => {
  const css = readFileSync("src/web/web.css", "utf8");
  // Landing's values live in its value set (src/styles/landing.css); test/style-roles.test.tsx
  // checks every style. These are the web rules on top: 87 / 66% text on every web ground.
  it.each(["light", "dark"] as const)("passes 4.5:1 for small text in %s", (theme) => {
    for (const ground of ["paper", "surface", "surface-2"]) {
      const base = role("landing", ground, theme);
      expect(ratio(role("landing", "ink-3", theme), base)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(role("landing", "ink-2", theme), base)).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(role("landing", "on-accent", theme), role("landing", "accent", theme))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(role("landing", "accent", theme), role("landing", "paper", theme))).toBeGreaterThanOrEqual(4.5);
  });
  it("uses the same 70% low emphasis the docs promise", () => {
    const landing = readStyle("landing");
    expect(landing["ink-3"]).toBe("color-mix(in srgb, var(--ui-ink) 70%, transparent)");
    expect(landing["ink-2"]).toBe("color-mix(in srgb, var(--ui-ink) 87%, transparent)");
    expect(css).toContain("--web-ink-low: var(--ui-ink-3);");
    expect(css).toContain("--web-ink-medium: var(--ui-ink-2);");
  });
  it("has no colour literals: every colour is a role", () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  it("scopes every selector under the web prefix", () => {
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
          !/^layer\b/.test(s) &&
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

  it("rests on the result without autoplay, and Play runs it from the start", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} autoplay={false} initialMetric={40} />);
    advance(3000);
    expect(step(container)).toBe("2");
    expect(metric()).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(step(container)).toBe("0");
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

  it("keeps the step tabs under reduced motion: each shows its step's finished frame, nothing plays", () => {
    globalThis.__reduced = true;
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} initialMetric={40} />);
    const tabs = within(screen.getByRole("group", { name: "Demo steps" })).getAllByRole("button");
    expect(tabs.map((t) => t.textContent)).toEqual(["01 Ask", "02 Act", "03 Review"]);
    expect(tabs[2]).toHaveAttribute("aria-current", "step");
    fireEvent.click(tabs[1]);
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-step", "1");
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-state", "static");
    // The Act step, finished: both actions done, the metric set by the last one.
    expect(metric()).toBe("5");
    advance(5000);
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-step", "1");
  });

  it("static holds the result with no controls, like reduced motion", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" timing={timing} initialMetric={40} static />);
    advance(5000);
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-state", "static");
    expect(metric()).toBe("3");
    expect(screen.queryByRole("button", { name: /Pause|Replay|Play/ })).toBeNull();
  });

  it("opens on the plan: the first acting step's actions listed as queued, not an empty pane", () => {
    render(<DemoPlayer steps={steps} label="Demo" timing={timing} />);
    const log = screen.getByRole("list", { name: "Agent actions" });
    expect([...log.children].map((li) => li.getAttribute("data-state"))).toEqual(["pending", "pending"]);
    expect(log.textContent).toContain("Archived");
    expect(log.textContent).toContain("(queued)");
  });

  it("server-renders the finished result without touching window", async () => {
    const html = await onServer(async ({ renderToString }) => {
      const server = await import("../src/web");
      return renderToString(<server.DemoPlayer steps={steps} label="Demo" initialMetric={40} />);
    });
    expect(html).toContain("Clear it");
    expect(html).toContain('data-step="2"');
    expect(html).toContain('data-state="finished"');
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
    // The CTA renders twice: in the bar, and in the menu, where CSS shows it below 340px only.
    const ctas = screen.getAllByRole("link", { name: "Start" });
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) expect(cta).toHaveAttribute("data-variant", "primary");
    expect(ctas[0].closest(".uipack-web-nav__menu-cta")).not.toBeNull();
    expect(ctas[1].closest(".uipack-web-nav__cta")).not.toBeNull();
  });
});

describe("GlassNav short CTA", () => {
  it("takes the CTA as data and gives the bar a short label for a phone", () => {
    const { container } = render(
      <GlassNav brand="Parcelmark" links={[]} cta={{ label: "See what you'd have saved", short: "See savings", href: "#s" }} />,
    );
    const bar = container.querySelector(".uipack-web-nav__cta a")!;
    expect(bar).toHaveAttribute("href", "#s");
    expect(bar.querySelector(".uipack-web-cta__long")).toHaveTextContent("See what you'd have saved");
    expect(bar.querySelector(".uipack-web-cta__short")).toHaveTextContent("See savings");
    // CSS swaps the two below 720px, in the bar only; the open menu keeps the full label.
    const css = readFileSync("src/web/web.css", "utf8");
    expect(css).toMatch(/\.uipack-web-nav__cta \.uipack-web-cta__short \{\s*display: inline;/);
  });
});

describe("StarHero split and stamp", () => {
  it("marks the split layout and sticks the stamp on the proof's corner, above the media", () => {
    const { container } = render(
      <StarHero title="T" layout="split" stamp={{ value: "18%", label: "lower postage" }} media={<img alt="kit" />}>
        <p>proof</p>
      </StarHero>,
    );
    const hero = container.querySelector(".uipack-web-hero")!;
    expect(hero).toHaveAttribute("data-layout", "split");
    expect(hero).toHaveAttribute("data-has-proof");
    const proof = container.querySelector(".uipack-web-hero__proof")!;
    expect(proof).toHaveAttribute("data-stamped");
    const stamp = container.querySelector(".uipack-web-hero__stamp") as HTMLElement;
    expect(stamp.parentElement).toBe(proof);
    expect(stamp).toHaveTextContent("18%lower postage");
    expect(stamp.style.getPropertyValue("--stamp-len")).toBe("3");
    // The media comes first in the proof column, then the demo.
    expect(proof.querySelector(".uipack-web-hero__media + p")).toHaveTextContent("proof");
  });
  it("keeps the stamp in the copy of a stacked hero, and media alone is proof enough", () => {
    const { container } = render(<StarHero title="T" stamp={{ value: "3×", label: "faster" }} media={<img alt="kit" />} />);
    expect(container.querySelector(".uipack-web-hero__stamp")!.closest(".uipack-web-hero__copy")).not.toBeNull();
    expect(container.querySelector(".uipack-web-hero")).toHaveAttribute("data-has-proof");
    expect(container.querySelector(".uipack-web-star")).toBeNull();
  });
  it("every style paints the stamp, and Graphical's disc is no longer a bare backdrop", () => {
    for (const id of ["technical", "landing", "graphical"] as const) {
      const v = readStyle(id);
      for (const r of ["stamp-fill", "stamp-ink", "stamp-border", "stamp-radius", "stamp-face", "perf", "plan-featured-fill"])
        expect(v[r], `${id} ${r}`).toBeDefined();
    }
    expect(readStyle("graphical").backdrop).toBe("none");
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
