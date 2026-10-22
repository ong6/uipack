import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BarChart,
  CX_TYPE,
  ConsultingSlide,
  DeckSlideContext,
  HarveyBall,
  HarveyTable,
  KpiTiles,
  LineChart,
  MIN_TEXT_PX,
  Matrix2x2,
  Panel,
  StackedBar,
  Waterfall,
  bandLayout,
  barPath,
  bubbleRadius,
  annotationGeometry,
  formatValue,
  harveyWedge,
  linearScale,
  lintDeck,
  niceStep,
  niceTicks,
  spreadLabels,
  stackSegments,
  storylineOf,
  waterfallBars,
  wrapToWidth,
  textWidth,
} from "../src/deck";
import { consultingDeck, consultingDeckLint } from "../playground/consultingDeck";

const size = { width: 600, height: 360 };

describe("consulting chart maths", () => {
  test("linear scales map and invert, including reversed ranges", () => {
    const y = linearScale([0, 10], [300, 100]);
    expect(y(0)).toBe(300);
    expect(y(10)).toBe(100);
    expect(y(5)).toBe(200);
    expect(y.invert(150)).toBeCloseTo(7.5);
    expect(linearScale([4, 4], [0, 50])(4)).toBe(0);
  });

  test("nice ticks are round, evenly stepped and cover the data", () => {
    expect(niceStep(9.3, 5)).toBe(2);
    expect(niceStep(168 - 100, 4)).toBe(20);
    const { domain, ticks } = niceTicks(100, 168, 4);
    expect(domain).toEqual([100, 180]);
    expect(ticks).toEqual([100, 120, 140, 160, 180]);
    const neg = niceTicks(-8, 11.4, 4);
    expect(neg.domain[0]).toBeLessThanOrEqual(-8);
    expect(neg.domain[1]).toBeGreaterThanOrEqual(11.4);
    expect(neg.ticks).toContain(0);
    expect(niceTicks(5, 5).domain[0]).toBeLessThan(5);
  });

  test("bands split the length evenly and cap the mark, leaving air", () => {
    const bands = bandLayout(4, 0, 400, 0.6, 48);
    expect(bands.map((b) => b.start)).toEqual([0, 100, 200, 300]);
    expect(bands[0].mark).toBe(48);
    expect(bands[0].markStart).toBe(26);
    expect(bands[3].centre).toBe(350);
    expect(bandLayout(10, 0, 100, 0.5, 48)[0].mark).toBe(5);
    expect(bandLayout(0, 0, 100)).toEqual([]);
  });

  test("a waterfall runs start → deltas → end and closes at the running level", () => {
    const bars = waterfallBars([
      { label: "FY22", value: 7.3, total: true },
      { label: "Freight", value: -1.6 },
      { label: "Labour", value: -1.2 },
      { label: "Rent", value: -0.6 },
      { label: "Mix", value: 0.3 },
      { label: "FY25", total: true },
    ]);
    expect(bars.map((b) => b.kind)).toEqual(["total", "down", "down", "down", "up", "total"]);
    expect(bars[1].from).toBe(7.3);
    expect(bars[1].to).toBeCloseTo(5.7);
    expect(bars[4].from).toBeCloseTo(3.9);
    expect(bars[4].to).toBeCloseTo(4.2);
    expect(bars[5].value).toBeCloseTo(4.2);
    expect(bars[5].from).toBe(0);
    // Each delta starts where the previous bar ended.
    for (let i = 2; i < 5; i++) expect(bars[i].from).toBeCloseTo(bars[i - 1].to);
  });

  test("stacks are contiguous; percent mode sums to 100", () => {
    const abs = stackSegments([2.6, 2.4, 1.0, 0.9]);
    expect(abs[0]).toMatchObject({ from: 0, to: 2.6 });
    expect(abs[3].to).toBeCloseTo(6.9);
    for (let i = 1; i < abs.length; i++) expect(abs[i].from).toBeCloseTo(abs[i - 1].to);
    const pct = stackSegments([62, 38], true);
    expect(pct[1].to).toBeCloseTo(100);
    expect(pct[0].share).toBeCloseTo(0.62);
    expect(stackSegments([0, 0], true).every((s) => s.to === 0)).toBe(true);
    expect(stackSegments([3, -2])[1]).toMatchObject({ from: 3, to: 3 });
  });

  test("Harvey wedges fill clockwise from 12 o'clock by quarters", () => {
    expect(harveyWedge(0, 10, 10, 8)).toBe("");
    expect(harveyWedge(1, 10, 10, 8)).toBe("M10 10L10 2A8 8 0 0 1 18 10Z");
    expect(harveyWedge(2, 10, 10, 8)).toBe("M10 10L10 2A8 8 0 0 1 10 18Z");
    expect(harveyWedge(3, 10, 10, 8)).toContain("A8 8 0 1 1 2 10");
    expect(harveyWedge(4, 10, 10, 8)).toMatch(/^M2 10a8 8 0 1 0 16 0a8 8 0 1 0 -16 0Z$/);
    expect(harveyWedge(7, 10, 10, 8)).toBe(harveyWedge(4, 10, 10, 8));
  });

  test("bubble area, not radius, is proportional to size", () => {
    const big = bubbleRadius(4, 4, 40);
    const small = bubbleRadius(1, 4, 40);
    expect(big).toBe(40);
    expect((small / big) ** 2).toBeCloseTo(0.25);
    expect(bubbleRadius(0.0001, 4, 40, 8)).toBe(8);
  });

  test("bars are square at the baseline and rounded at the data end", () => {
    const h = barPath("horizontal", 100, 300, 10, 20, 4);
    expect(h.startsWith("M100 10H296Q300 10 300 14")).toBe(true);
    expect(h.endsWith("H100Z")).toBe(true);
    const v = barPath("vertical", 200, 50, 0, 40, 4);
    expect(v.startsWith("M0 200V54Q0 50 4 50")).toBe(true);
    // A bar shorter than the radius never overshoots its own length.
    expect(barPath("horizontal", 0, 2, 0, 20, 4)).toContain("Q2 0 2 2");
  });

  test("numbers use a real minus sign, explicit plus on request, and compact units", () => {
    expect(formatValue(-1.6, { decimals: 1 })).toBe("−1.6");
    expect(formatValue(0.3, { decimals: 1, sign: true })).toBe("+0.3");
    expect(formatValue(0, { sign: true })).toBe("0");
    expect(formatValue(-0.04, { decimals: 1 })).toBe("0.0");
    expect(formatValue(8.4, { prefix: "$", decimals: 2 })).toBe("$8.40");
    expect(formatValue(12600000, { compact: true, decimals: 1 })).toBe("12.6M");
    expect(formatValue(1234)).toBe("1,234");
  });

  test("labels spread to a minimum gap and stay in bounds", () => {
    const placed = spreadLabels([100, 104, 300], 28, 0, 400);
    expect(placed[1] - placed[0]).toBeGreaterThanOrEqual(28);
    expect(placed[2]).toBe(300);
    const squeezed = spreadLabels([390, 395, 399], 28, 0, 400);
    expect(Math.max(...squeezed)).toBeLessThanOrEqual(400);
    expect(squeezed[2] - squeezed[1]).toBeGreaterThanOrEqual(28);
  });

  test("text wraps to the width and the line budget", () => {
    const lines = wrapToWidth("Split shipments from five sites", 22, 200, 3);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines.slice(0, -1)) expect(textWidth(l, 22)).toBeLessThanOrEqual(200);
    expect(wrapToWidth("one two three four five six seven", 22, 40, 2)).toHaveLength(2);
  });

  test("a callout's leader leaves the text block's nearest edge and ends on the point", () => {
    const right = annotationGeometry({ x: 400, y: 100 }, { x: 100, y: 80 }, "Fifth site opens", 200);
    expect(right.leader.x2).toBe(400);
    expect(right.leader.y2).toBe(100);
    expect(right.leader.x1).toBeCloseTo(right.box.x + right.box.w + 10);
    const below = annotationGeometry({ x: 150, y: 20 }, { x: 100, y: 80 }, "Split shipments", 200);
    expect(below.leader.y1).toBe(below.box.y - 10);
    expect(below.leader).toMatchObject({ x2: 150, y2: 20 });
    const end = annotationGeometry({ x: 10, y: 100 }, { x: 300, y: 80 }, "Text", 200, "end");
    expect(end.box.x + end.box.w).toBeCloseTo(300);
  });
});

describe("consulting parts render", () => {
  test("the frame has a tracker, an action title, a sticker, notes, a source and the page", () => {
    render(
      <DeckSlideContext.Provider value={{ step: Infinity, active: true, thumbnail: false, index: 2, count: 7 }}>
        <ConsultingSlide
          tracker={{ sections: ["Summary", "Situation", "Diagnosis"], current: "Situation" }}
          sticker="Illustrative"
          title="Cost per order rose 22% in three years"
          subtitle="$, FY22–FY25"
          takeaway="Freight drove it."
          notes={["First note.", "Second note."]}
          source="Example data."
          label="Review"
        >
          <Panel title="Panel A" unit="$M" cols={6} morphId="a">
            body
          </Panel>
        </ConsultingSlide>
      </DeckSlideContext.Provider>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Cost per order rose 22% in three years");
    const current = screen.getByRole("navigation", { name: "Sections" }).querySelector('[aria-current="step"]');
    expect(current).toHaveTextContent("Situation");
    expect(screen.getByText("Illustrative")).toBeInTheDocument();
    expect(screen.getByText("Second note.")).toBeInTheDocument();
    expect(screen.getByText("Example data.")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "So what" })).toHaveTextContent("Freight drove it.");
    const panel = document.querySelector('[data-morph="a"]') as HTMLElement;
    expect(panel).toHaveClass("uipack-cx-panel");
    expect(panel.style.gridColumn).toBe("span 6");
  });

  test("ranked bars sort descending and only the highlight wears the accent", () => {
    const { container } = render(
      <BarChart
        {...size}
        data={[
          { label: "B", value: 7.2 },
          { label: "A", value: 10.9, highlight: true },
          { label: "C", value: 8.1 },
        ]}
      />,
    );
    const titles = Array.from(container.querySelectorAll("path > title"), (t) => t.textContent);
    expect(titles).toEqual(["A: 10.9", "C: 8.1", "B: 7.2"]);
    const fills = Array.from(container.querySelectorAll<SVGPathElement>("path.uipack-cx-grow"), (p) => p.style.fill);
    expect(fills).toEqual(["var(--uipack-cx-accent)", "var(--uipack-cx-context)", "var(--uipack-cx-context)"]);
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", expect.stringContaining("A: 10.9"));
  });

  test("waterfall deltas are signed and arrowed, and colour follows whether the move is good", () => {
    const { container } = render(
      <Waterfall
        {...size}
        goodDirection="down"
        steps={[
          { label: "Start", value: 106, total: true },
          { label: "Freight", value: -6.1 },
          { label: "Price", value: 2 },
          { label: "End", total: true },
        ]}
      />,
    );
    const kinds = Array.from(container.querySelectorAll("[data-kind]"), (g) => g.getAttribute("data-kind"));
    expect(kinds).toEqual(["total", "down", "up", "total"]);
    const text = container.textContent ?? "";
    expect(text).toContain("▼ −6.1");
    expect(text).toContain("▲ +2");
    expect(text).toContain("101.9");
    const rects = container.querySelectorAll<SVGRectElement>("rect.uipack-cx-grow");
    expect(rects[0].style.fill).toBe("var(--uipack-cx-good)");
    expect(rects[1].style.fill).toBe("var(--uipack-cx-bad)");
  });

  test("stacked bars label segments that fit and give every series a legend swatch", () => {
    const { container } = render(
      <StackedBar
        {...size}
        series={["One", "Two"]}
        mode="percent"
        orientation="horizontal"
        categories={[
          { label: "X", values: [62, 38] },
          { label: "Y", values: [97, 3] },
        ]}
      />,
    );
    expect(container.querySelectorAll(".uipack-cx-legend rect")).toHaveLength(2);
    const labels = Array.from(container.querySelectorAll(".uipack-cx-seglabel"), (t) => t.textContent);
    expect(labels).toEqual(["62%", "38%", "97%"]); // 3% is too thin to label
  });

  test("line charts end-label each series and annotate one point", () => {
    const { container } = render(
      <LineChart
        {...size}
        x={["FY22", "FY23", "FY24", "FY25"]}
        series={[
          { name: "Cost", values: [100, 116, 145, 168], highlight: true },
          { name: "Orders", values: [100, 112, 127, 138] },
        ]}
        annotate={{ series: "Cost", index: 2, text: "Fifth site opens", dx: -150, dy: -90 }}
      />,
    );
    expect(container.textContent).toContain("Cost 168");
    expect(container.textContent).toContain("Orders 138");
    const dots = container.querySelectorAll(".uipack-cx-callout__dot");
    expect(dots).toHaveLength(1);
    const leader = container.querySelector(".uipack-cx-callout__leader")!;
    expect(leader.getAttribute("x2")).toBe(dots[0].getAttribute("cx"));
    expect(leader.getAttribute("y2")).toBe(dots[0].getAttribute("cy"));
  });

  test("KPI deltas carry direction by arrow and sign, and a morph id wraps the value", () => {
    const { container } = render(
      <KpiTiles
        items={[
          {
            label: "Cost per order",
            value: "$8.40",
            morphId: "cpo",
            delta: { text: "+22%", direction: "up", sentiment: "bad", period: "vs FY22" },
            trend: [1, 2, 3],
          },
          { label: "Margin", value: "4.2%", delta: { text: "−3.1 pts", direction: "down", sentiment: "bad" } },
        ]}
      />,
    );
    expect(container.querySelector('[data-morph="cpo"]')).toHaveTextContent("$8.40");
    const deltas = container.querySelectorAll(".uipack-cx-delta");
    expect(deltas[0]).toHaveAttribute("data-sentiment", "bad");
    expect(deltas[0].querySelector("path")?.getAttribute("d")).toBe("M9 2 L16 14 H2 Z");
    expect(deltas[1].querySelector("path")?.getAttribute("d")).toBe("M9 16 L16 4 H2 Z");
    expect(container.querySelector(".uipack-cx-spark")).not.toBeNull();
  });

  test("Harvey tables name each ball's level and tag the recommended row in words", () => {
    render(
      <HarveyTable
        columns={[
          { key: "saving", label: "Saving", kind: "text" },
          { key: "risk", label: "Risk" },
        ]}
        rows={[
          { label: "Do nothing", cells: { saving: "$0", risk: 1 } },
          { label: "Two hubs", highlight: true, cells: { saving: "$14M", risk: 3 } },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "High (3 of 4)" })).toBeInTheDocument();
    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Two hubs/ })).toHaveAttribute("data-highlight", "");
    render(<HarveyBall level={2} />);
    expect(screen.getAllByRole("img", { name: "Medium (2 of 4)" }).length).toBeGreaterThan(0);
  });

  test("the 2×2 names its quadrants and sizes bubbles by area", () => {
    const { container } = render(
      <Matrix2x2
        {...size}
        x={{ label: "Utilisation", domain: [40, 100], split: 75 }}
        y={{ label: "Cost", domain: [5, 12], split: 8.4 }}
        quadrants={["Consolidate", "Fix", "Fill", "Keep"]}
        focus="tl"
        points={[
          { label: "A", x: 56, y: 10.9, size: 1, highlight: true },
          { label: "B", x: 90, y: 7, size: 4 },
        ]}
      />,
    );
    expect(container.textContent).toContain("CONSOLIDATE");
    const r = Array.from(container.querySelectorAll("circle.uipack-cx-bubble"), (c) => Number(c.getAttribute("r")));
    expect(Math.max(...r) / Math.min(...r)).toBeCloseTo(2);
  });
});

describe("minimum text size", () => {
  const css = readFileSync(resolve(__dirname, "../src/deck/consulting/consulting.css"), "utf8");

  test("every font size in consulting.css is at least 20 canvas px", () => {
    const sizes: number[] = [];
    for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) sizes.push(Number(m[1]));
    for (const m of css.matchAll(/\bfont:\s*[^;]*?(\d+(?:\.\d+)?)px/g)) sizes.push(Number(m[1]));
    expect(sizes.length).toBeGreaterThan(20);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(MIN_TEXT_PX);
    // No relative sizes that could shrink below the floor.
    expect(css).not.toMatch(/font-size:\s*[\d.]+(?:em|rem|%)/);
    expect(css).not.toMatch(/font-size:\s*(?:small|smaller|x-small)/);
  });

  test("the chart type scale never goes below the floor", () => {
    expect(MIN_TEXT_PX).toBe(20);
    for (const v of Object.values(CX_TYPE)) expect(v).toBeGreaterThanOrEqual(MIN_TEXT_PX);
  });

  test("no SVG text on any example slide is set below 20 canvas px", () => {
    let checked = 0;
    for (const [i, slide] of consultingDeck.entries()) {
      const { container, unmount } = render(
        <div className="uipack-deck">
          <DeckSlideContext.Provider
            value={{ step: Infinity, active: false, thumbnail: true, index: i, count: consultingDeck.length }}
          >
            {slide.render({ step: Infinity, active: false, thumbnail: true, theme: "light", reducedMotion: true })}
          </DeckSlideContext.Provider>
        </div>,
      );
      const texts = container.querySelectorAll("text");
      checked += texts.length;
      for (const t of texts)
        expect(Number(t.getAttribute("font-size")), `${slide.id}: ${t.textContent}`).toBeGreaterThanOrEqual(MIN_TEXT_PX);
      for (const el of container.querySelectorAll<HTMLElement>("[style*='font-size']")) {
        expect(parseFloat(el.style.fontSize)).toBeGreaterThanOrEqual(MIN_TEXT_PX);
      }
      unmount();
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("example consulting deck", () => {
  test("follows the decision-request storyline with no lint findings", () => {
    expect(consultingDeckLint).toEqual({ template: "decision-request" });
    expect(lintDeck(consultingDeck, consultingDeckLint)).toEqual([]);
    expect(storylineOf(consultingDeck).map((e) => e.role)).toEqual([
      "answer",
      "context",
      "problem",
      "option",
      "recommendation",
      "plan",
      "ask",
      "appendix",
    ]);
  });

  test("every slide has a headline, a full talk track and an Illustrative sticker", () => {
    expect(consultingDeck.length).toBeGreaterThanOrEqual(5);
    // Seven presented slides and one appendix slide.
    expect(consultingDeck.filter((s) => s.role !== "appendix").length).toBeLessThanOrEqual(7);
    for (const [i, slide] of consultingDeck.entries()) {
      expect(slide.headline, slide.id).toBeTruthy();
      const notes = slide.notes as { say: string; delivery: string; next?: string };
      expect(notes.say && notes.delivery && notes.next, slide.id).toBeTruthy();
      const { container, unmount } = render(
        <DeckSlideContext.Provider
          value={{ step: Infinity, active: false, thumbnail: true, index: i, count: consultingDeck.length }}
        >
          {slide.render({ step: Infinity, active: false, thumbnail: true, theme: "light", reducedMotion: true })}
        </DeckSlideContext.Provider>,
      );
      expect(container.querySelector(".uipack-cx-sticker")).toHaveTextContent("Illustrative");
      // The on-slide title is the headline the storyline reads.
      expect(container.querySelector(".uipack-cx-title")?.textContent).toBe(slide.headline);
      unmount();
    }
  });

  test("slides that show the same site show the same numbers", () => {
    const text = (i: number) => {
      const { container, unmount } = render(
        <DeckSlideContext.Provider
          value={{ step: Infinity, active: false, thumbnail: true, index: i, count: consultingDeck.length }}
        >
          {consultingDeck[i].render({ step: Infinity, active: false, thumbnail: true, theme: "light", reducedMotion: true })}
        </DeckSlideContext.Provider>,
      );
      // Chart marks carry "<site>: <value>" tooltips; collect them per site.
      const values = new Map<string, string>();
      for (const t of Array.from(container.querySelectorAll("title"))) {
        const m = /^(Northgate|Riverside|Eastfield|Harbour|Westpark)\b.*?(\$\d+\.\d{2})/.exec(t.textContent ?? "");
        if (m) values.set(m[1], m[2]);
      }
      unmount();
      return values;
    };
    const situation = text(consultingDeck.findIndex((s) => s.id === "situation"));
    const sites = text(consultingDeck.findIndex((s) => s.id === "sites"));
    expect(situation.size).toBe(5);
    expect(sites.size).toBe(5);
    expect(Object.fromEntries(sites)).toEqual(Object.fromEntries(situation));
  });

  test("the talk track only points at slides that exist", () => {
    const mentionsAppendix = consultingDeck.some((s) => JSON.stringify(s.notes).toLowerCase().includes("appendix"));
    if (mentionsAppendix) expect(consultingDeck.some((s) => s.role === "appendix")).toBe(true);
  });

  test("zooms into a panel that exists on the previous slide, and morphs a KPI value into the next title", () => {
    const html = (i: number) => {
      const { container, unmount } = render(
        <DeckSlideContext.Provider
          value={{ step: Infinity, active: false, thumbnail: true, index: i, count: consultingDeck.length }}
        >
          {consultingDeck[i].render({ step: Infinity, active: false, thumbnail: true, theme: "light", reducedMotion: true })}
        </DeckSlideContext.Provider>,
      );
      const out = container.cloneNode(true) as HTMLElement;
      unmount();
      return out;
    };
    const zoomAt = consultingDeck.findIndex((s) => typeof s.transition === "object");
    expect(zoomAt).toBeGreaterThan(0);
    const target = (consultingDeck[zoomAt].transition as { zoom: string }).zoom;
    expect(html(zoomAt - 1).querySelector(`.uipack-cx-panel[data-morph="${target}"]`)).not.toBeNull();

    const morphAt = consultingDeck.findIndex((s) => s.transition === "morph");
    const before = html(morphAt - 1).querySelector(".uipack-cx-kpi [data-morph]")!;
    const id = before.getAttribute("data-morph")!;
    const after = html(morphAt).querySelector(`.uipack-cx-title [data-morph="${id}"]`);
    expect(after?.textContent).toBe(before.textContent);
  });
});
