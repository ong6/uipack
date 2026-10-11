import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LayerStack,
  SpanChart,
  buildLayerStack,
  buildSpanModel,
  enhanceSpanChart,
  spanChartCss,
  type SpanItem,
  type SpanLayer,
} from "../src/charts";
import { monogram, spanRuns, twoLineWidth } from "../src/charts/model";
import { aiStack, aiStackDiagram, aiStackItems, aiStackLayers, aiStackTiers, aiStackZones, syntheticStack } from "../examples/aiStack";

const mount = (el: ReactElement) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(el);
  document.body.append(host);
  return host;
};
afterEach(() => {
  document.body.innerHTML = "";
});

const layers: SpanLayer[] = [
  { id: "a", label: "Alpha", abbr: "ALP" },
  { id: "b", label: "Beta", abbr: "BET" },
  { id: "c", label: "Gamma", abbr: "GAM" },
];
const item = (id: string, extra: Partial<SpanItem> = {}): SpanItem => ({ id, name: id, primary: "a", ...extra });

describe("SpanChart model", () => {
  it("groups rows by primary layer in column order and skips empty layers", () => {
    const host = mount(<SpanChart {...aiStack} />);
    const heads = [...host.querySelectorAll(".uipack-span__group-name")].map((h) => h.textContent);
    const used = aiStackLayers.filter((l) => aiStackItems.some((i) => i.primary === l.id)).map((l) => l.label);
    expect(heads).toEqual(used);
  });

  it("sorts each group by value, largest first, rows without a value last, then by name", () => {
    const model = buildSpanModel({
      id: "s",
      layers,
      items: [item("b-mid", { value: 5 }), item("none"), item("z-big", { value: 10 }), item("a-big", { value: 10 }), item("aaa-none")],
    });
    expect(model.groups[0].rows.map((r) => r.item.id)).toEqual(["a-big", "z-big", "b-mid", "aaa-none", "none"]);
  });

  it("does not move featured rows ahead of larger ones", () => {
    const model = buildSpanModel({ id: "s", layers, items: [item("small", { value: 1, featured: true }), item("big", { value: 9 })] });
    expect(model.groups[0].rows.map((r) => r.item.id)).toEqual(["big", "small"]);
  });

  it("splits covered layers into contiguous runs and marks the main column", () => {
    expect(spanRuns([1, 2, 3, 4, 5, 7], 1)).toEqual([
      { start: 1, end: 5, main: 1 },
      { start: 7, end: 7, main: null },
    ]);
    const nvidia = mount(<SpanChart {...aiStack} />).querySelector('[data-item="nvidia"]')!;
    const runs = [...nvidia.querySelectorAll<HTMLElement>(".uipack-span__run")].map((r) => r.style.gridColumn);
    expect(runs).toEqual(["2 / 7", "8 / 9"]);
    expect(nvidia.querySelectorAll(".uipack-span__main")).toHaveLength(1);
  });

  it("makes one or two initials for the monogram tile", () => {
    expect(monogram("OpenRouter")).toBe("OR");
    expect(monogram("Thinking Machines Lab")).toBe("TM");
    expect(monogram("Oklo")).toBe("O");
    expect(monogram("Weights & Biases")).toBe("WB");
  });

  it("estimates two-line label widths close to system sans", () => {
    // Measured in Chromium on macOS at 12px/500: "Gateways and" is 80.9px wide.
    const w = twoLineWidth("Gateways and observability");
    expect(w).toBeGreaterThan(80);
    expect(w).toBeLessThan(90);
  });
});

describe("SpanChart markup", () => {
  const host = () => mount(<SpanChart {...aiStack} />);

  it("flags featured rows and states counts in the expand control", () => {
    const h = host();
    const featured = aiStackItems.filter((i) => i.featured).length;
    expect(h.querySelectorAll(".uipack-span__item[data-featured]")).toHaveLength(featured);
    expect(h.querySelector(".uipack-span__more")!.textContent).toBe(`Show all ${aiStackItems.length} companies`);
    expect(h.querySelector(".uipack-span__less")!.textContent).toBe(`Show the ${featured} featured`);
    const expand = h.querySelector<HTMLInputElement>(".uipack-span__expand")!;
    expect(expand.checked).toBe(false);
    expect(expand.closest("label")).not.toBeNull();
  });

  it("starts expanded with initial all, and drops the control when nothing or everything is featured", () => {
    expect(mount(<SpanChart {...aiStack} initial="all" />).querySelector<HTMLInputElement>(".uipack-span__expand")!.checked).toBe(true);
    expect(mount(<SpanChart id="n" layers={layers} items={[item("x"), item("y")]} />).querySelector(".uipack-span__expand")).toBeNull();
    expect(mount(<SpanChart id="f" layers={layers} items={[item("x", { featured: true })]} />).querySelector(".uipack-span__expand")).toBeNull();
  });

  it("emits scoped per-layer, per-size and combined filter rules", () => {
    const css = spanChartCss(buildSpanModel(aiStack));
    const root = '.uipack-span[id="ai-stack"]';
    const inference = `${root}:has(.uipack-span__layer-input[value="inference"]:checked)`;
    expect(css).toContain(`${inference}{--sp-active:7}`);
    expect(css).toContain(`${inference} .uipack-span__item:not([data-layers~="inference"])`);
    expect(css).toContain(`${inference} .uipack-span__group:not([data-layers~="inference"])`);
    expect(css).toContain(`${root}:has(.uipack-span__tier-input[value="small"]:checked) .uipack-span__item:not([data-tier="small"])`);
    expect(css).toContain(`${inference}:has(.uipack-span__tier-input[value="small"]:checked) .uipack-span__group:not([data-pairs~="inference|small"])`);
    expect(css).toMatch(/@container uipack-span \(min-width: \d+px\)/);
    // Every rule is keyed by the chart's id, so two charts on a page do not collide.
    for (const line of css.split("\n").filter((l) => !l.startsWith("@container"))) expect(line.startsWith(root)).toBe(true);
    // And the component ships those rules inside itself.
    expect(host().querySelector("style")!.innerHTML).toBe(css);
  });

  it("escapes ids that would break out of a selector or the style element", () => {
    const css = spanChartCss(buildSpanModel({ id: 'x"</style>', layers: [{ id: 'l"<', label: "L", abbr: "L" }], items: [] }));
    expect(css).not.toContain("</style>");
    expect(css).toContain('[id="x\\"\\3c /style>"]');
  });

  it("keys counts and footer lines by filter state, with an empty state", () => {
    const model = buildSpanModel(aiStack);
    const chips = model.groups.find((g) => g.layer?.id === "chips")!;
    expect(chips.counts.get("inference|*")).toBe(3); // Nvidia, Cerebras, Groq
    const h = host();
    const status = h.querySelector('.uipack-span__status [data-span-key="inference|*"]')!;
    const inInference = aiStackItems.filter((i) => i.primary === "inference" || i.also?.includes("inference")).length;
    expect(status.textContent).toBe(`${inInference} of ${aiStackItems.length} in Inference`);
    expect(h.querySelector('.uipack-span__status [data-span-key="inference|small"]')!.textContent).toMatch(/^\d+ of \d+ in Inference · Small$/);
    const empty = model.filters.find((f) => f.count === 0);
    if (empty) expect(spanChartCss(model)).toContain(`[data-span-key="${empty.key}"]`);
    expect(h.querySelector(".uipack-span__empty")).not.toBeNull();
  });

  it("gives each row one screen-reader sentence and hides the drawn bars", () => {
    const h = host();
    const fireworks = h.querySelector('[data-item="fireworks"] summary')!;
    expect(fireworks.querySelector(".uipack-span__sr")!.textContent).toBe(
      "Fireworks AI. Main layer: Inference. Also in: Post-training. Size: $4B, Small.",
    );
    expect(fireworks.querySelector(".uipack-span__line")).toHaveAttribute("aria-hidden", "true");
    expect(fireworks.querySelector(".uipack-span__track")!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("states acquisitions, pending sales, licences and shutdowns in words", () => {
    const h = host();
    const sr = (id: string) => h.querySelector(`[data-item="${id}"] .uipack-span__sr`)!.textContent;
    const badge = (id: string) => h.querySelector(`[data-item="${id}"] .uipack-span__badge`)!.textContent;
    expect(sr("openrouter")).toContain("Acquired by Stripe, 2026.");
    expect(badge("openrouter")).toBe("→ Stripe");
    expect(sr("hugging-face")).toContain("Sale agreed to Nvidia, 2026.");
    expect(badge("hugging-face")).toBe("→ Nvidia (pending)");
    expect(sr("groq")).toContain("Technology licensed to Nvidia, 2025.");
    expect(sr("builder")).toContain("Shut down, 2025.");
    expect(badge("builder")).toBe("shut");
  });

  it("loads logos lazily with empty alt, and falls back to a monogram", () => {
    const h = host();
    const img = h.querySelector('[data-item="nvidia"] img')!;
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(h.querySelector('[data-item="oklo"] .uipack-span__logo--mono')!.textContent).toBe("O");
  });

  it("keeps links as links in the opened row", () => {
    const links = [...mount(<SpanChart {...aiStack} />).querySelectorAll<HTMLAnchorElement>('[data-item="fireworks"] .uipack-span__detail a')];
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Website", "https://fireworks.ai"],
      ["Source", "https://docs.fireworks.ai"],
    ]);
  });

  it("builds the layer and size filters from native radios inside labels", () => {
    const h = host();
    const layerRadios = h.querySelectorAll<HTMLInputElement>('input[type="radio"][name="ai-stack-layer"]');
    expect(layerRadios).toHaveLength(aiStackLayers.length + 1);
    expect(h.querySelector("#ai-stack-layer-all")).toBeChecked();
    expect(h.querySelector('[role="radiogroup"][aria-label="Filter by layer"]')).not.toBeNull();
    const sizes = [...h.querySelectorAll(".uipack-span__chip")].map((c) => c.querySelector(".uipack-span__chip-label")!.textContent);
    expect(sizes).toEqual(["All sizes", ...aiStackTiers.map((t) => t.label)]);
    expect(h.querySelector("#ai-stack-tier-all")).toBeChecked();
  });

  it("renders 160 rows", () => {
    const h = mount(<SpanChart id="big" layers={aiStackLayers} zones={aiStackZones} tiers={aiStackTiers} items={syntheticStack(160)} />);
    expect(h.querySelectorAll(".uipack-span__item")).toHaveLength(160);
    expect(h.querySelector(".uipack-span__more")!.textContent).toBe("Show all 160 companies");
  });
});

describe("SpanChart validation", () => {
  const build = (items: SpanItem[], extra = {}) => () => buildSpanModel({ id: "v", layers, items, ...extra });
  it("fails loudly on bad data", () => {
    expect(build([item("x", { primary: "zz" })])).toThrow(/item "x" has unknown primary layer "zz". Known layers: a, b, c/);
    expect(build([item("x", { also: ["b", "nope"] })])).toThrow(/item "x" lists unknown layer "nope" in `also`/);
    expect(build([item("x"), item("x")])).toThrow(/item id "x" is used twice/);
    expect(build([item("x", { tier: "huge" })], { tiers: [{ id: "big", label: "Big" }] })).toThrow(/unknown tier "huge"/);
    expect(build([item("x", { tier: "huge" })])).toThrow(/has a tier but the chart has no `tiers`/);
    expect(build([item("x", { status: { kind: "acquired" } })])).toThrow(/needs a status `label`/);
    expect(() => buildSpanModel({ id: "has space", layers, items: [] })).toThrow(/`id` must be a non-empty string without spaces/);
    expect(() =>
      buildSpanModel({
        id: "z",
        layers: [
          { id: "a", label: "A", abbr: "A", zone: "one" },
          { id: "b", label: "B", abbr: "B", zone: "two" },
          { id: "c", label: "C", abbr: "C", zone: "one" },
        ],
        zones: [
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ],
        items: [],
      }),
    ).toThrow(/zone "one" must cover consecutive layers/);
  });
});

describe("enhanceSpanChart", () => {
  it("clears a filter on repeat activation and Escape, and cleans up", () => {
    const host = mount(<SpanChart {...aiStack} />);
    const root = host.querySelector<HTMLElement>(".uipack-span")!;
    const all = root.querySelector<HTMLInputElement>("#ai-stack-layer-all")!;
    const inference = root.querySelector<HTMLInputElement>("#ai-stack-layer-inference")!;
    const small = root.querySelector<HTMLInputElement>("#ai-stack-tier-small")!;
    const live = root.querySelector("[data-span-live]")!;
    const cleanup = enhanceSpanChart(root);
    expect(root).toHaveAttribute("data-span-enhanced");

    inference.click();
    expect(inference.checked).toBe(true);
    expect(live.textContent).toMatch(/in Inference$/);
    inference.click();
    expect(all.checked).toBe(true);

    inference.click();
    small.click();
    expect(live.textContent).toMatch(/in Inference · Small$/);
    small.click();
    expect(root.querySelector<HTMLInputElement>("#ai-stack-tier-all")!.checked).toBe(true);
    small.click();
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(all.checked).toBe(true);
    expect(root.querySelector<HTMLInputElement>("#ai-stack-tier-all")!.checked).toBe(true);

    inference.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(inference.checked).toBe(true);

    cleanup();
    expect(root).not.toHaveAttribute("data-span-enhanced");
    inference.click();
    expect(inference.checked).toBe(true);
  });
});

describe("LayerStack", () => {
  it("numbers layers bottom-up and draws the first layer at the bottom", () => {
    const model = buildLayerStack(aiStackDiagram);
    expect(model.layers.map((l) => l.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
    const row = (id: string) => model.layers.find((l) => l.layer.id === id)!.place.wide[0];
    expect(row("apps")).toBeLessThan(row("harness"));
    expect(row("harness")).toBeLessThan(row("power"));
    expect(model.zones.find((z) => z.zone.id === "product")!.place.wide[0]).toBe(1);
  });

  it("spans each rail and bracket over exactly its layers' rows", () => {
    const model = buildLayerStack(aiStackDiagram);
    const row = (id: string) => model.layers.find((l) => l.layer.id === id)!.place.wide[0];
    const evals = model.rails.find((r) => r.rail.id === "evals")!;
    expect(evals.place.wide).toEqual([row("apps"), row("post-training") - row("apps") + 1]);
    expect(evals.span).toBe("layers 7–10");
    const safety = model.rails.find((r) => r.rail.id === "safety")!;
    expect(safety.place.wide).toEqual([row("apps"), row("power") - row("apps") + 1]);
    const shared = model.brackets[0];
    expect(shared.place.wide).toEqual([row("cloud"), row("power") - row("cloud") + 1]);
  });

  it("puts each bracket label above its zone on narrow screens", () => {
    const model = buildLayerStack(aiStackDiagram);
    const zoneRow = (id: string) => model.zones.find((z) => z.zone.id === id)!.place.narrow;
    expect(model.brackets.map((b) => b.place.narrow)).toEqual([zoneRow("infrastructure") - 1, zoneRow("models") - 1, zoneRow("product") - 1]);
    const lastBand = Math.max(...model.layers.map((l) => l.place.narrow));
    expect(model.railsCaptionRow).toBe(lastBand + 1);
    expect(model.rails.map((r) => r.place.narrow)).toEqual([lastBand + 2, lastBand + 3, lastBand + 4]);
  });

  it("renders bands as details with the question and a section link; rails as links", () => {
    const host = mount(<LayerStack {...aiStackDiagram} />);
    const bands = host.querySelectorAll("details.uipack-stack__band");
    expect(bands).toHaveLength(10);
    const inference = host.querySelector("#ai-stack-layers-inference")!;
    expect(inference.querySelector("summary")!.textContent).toContain("Inference");
    expect(inference.querySelector(".uipack-stack__metric-value")!.textContent).toBe("280×");
    expect(inference.querySelector(".uipack-stack__detail")!.textContent).toContain("Why does a longer answer cost more");
    expect(inference.querySelector("a")).toHaveAttribute("href", "#inference");
    const rails = [...host.querySelectorAll<HTMLAnchorElement>("a.uipack-stack__rail")];
    expect(rails.map((a) => a.getAttribute("href"))).toEqual(["#gateways", "#evals", "#safety"]);
    expect(rails[1].textContent).toContain("Evals");
    expect(rails[1].textContent).toContain("layers 7–10");
    expect(host.querySelectorAll("h4.uipack-stack__zone")).toHaveLength(4);
  });

  it("renders a band without detail or link as plain text", () => {
    const host = mount(
      <LayerStack id="plain" zones={[{ id: "z", label: "Z" }]} layers={[{ id: "a", label: "A", zone: "z", summary: "Only a summary." }]} />,
    );
    expect(host.querySelector("details")).toBeNull();
    expect(host.querySelector(".uipack-stack__band")!.textContent).toContain("Only a summary.");
  });

  it("fails loudly on bad data", () => {
    const zones = [{ id: "z", label: "Z" }, { id: "y", label: "Y" }];
    const base = { id: "bad", zones, layers: [{ id: "a", label: "A", zone: "z", summary: "s" }] };
    expect(() => buildLayerStack({ ...base, layers: [{ id: "a", label: "A", zone: "q", summary: "s" }] })).toThrow(/unknown zone "q"/);
    expect(() => buildLayerStack({ ...base, rails: [{ id: "r", label: "R", from: "a", to: "nope" }] })).toThrow(/rail "r" ends at unknown layer "nope"/);
    expect(() => buildLayerStack({ ...base, brackets: [{ label: "B", from: "x", to: "a" }] })).toThrow(/bracket "B" starts at unknown layer "x"/);
    expect(() =>
      buildLayerStack({
        ...base,
        layers: [
          { id: "a", label: "A", zone: "z", summary: "s" },
          { id: "b", label: "B", zone: "y", summary: "s" },
          { id: "c", label: "C", zone: "z", summary: "s" },
        ],
      }),
    ).toThrow(/zone "z" must cover consecutive layers/);
  });
});

describe("charts.css", () => {
  const css = readFileSync("src/charts/charts.css", "utf8");
  it("scopes every selector under one of the chart roots", () => {
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/[^{}@;]+(?=\{)/g)!
      .flatMap((s) => s.split(/,(?![^(]*\))/))
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("@") && !s.startsWith("(") && !/^(media|supports|container)\b/.test(s) && !s.includes("prefers-"));
    expect(selectors.length).toBeGreaterThan(100);
    for (const s of selectors) expect(s).toMatch(/uipack-(span|stack)/);
  });
  it("switches themes like theme.css and lets host variables win", () => {
    expect(css).toContain(':root:not([data-theme="light"]) .uipack-span');
    expect(css).toContain('[data-theme="dark"] .uipack-span');
    expect(css).toContain("--sp-accent: var(--uipack-accent, #205f49)");
    expect(css).toContain("--sp-accent: var(--uipack-accent, #71dcb2)");
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });
});
