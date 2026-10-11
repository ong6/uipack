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
import { cssIdent, monogram, spanRuns, spanThresholds, twoLineWidth } from "../src/charts/model";
import { aiStack, aiStackDiagram, aiStackItems, aiStackLayers, aiStackTiers, aiStackZones, syntheticStack } from "../examples/aiStack";

const mount = (el: ReactElement) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(el);
  document.body.append(host);
  return host;
};
afterEach(() => {
  document.body.innerHTML = "";
  history.replaceState(null, "", "/");
});

const layers: SpanLayer[] = [
  { id: "a", label: "Alpha", abbr: "ALP" },
  { id: "b", label: "Beta", abbr: "BET" },
  { id: "c", label: "Gamma", abbr: "GAM" },
];
const item = (id: string, extra: Partial<SpanItem> = {}): SpanItem => ({ id, name: id, primary: "a", ...extra });
const deals = aiStackItems.filter((i) => i.status && i.status.kind !== "shutdown");

describe("SpanChart model", () => {
  it("groups rows by primary layer in column order and skips empty layers", () => {
    const host = mount(<SpanChart {...aiStack} />);
    const heads = [...host.querySelectorAll(".uipack-span__group-head > span:first-child")].map((h) => h.textContent);
    const used = aiStackLayers.filter((l) => aiStackItems.some((i) => i.primary === l.id)).map((l) => l.label);
    expect(heads).toEqual(used);
  });

  it("sorts each group by value, largest first, rows without a value last, then by name; featured rows do not jump", () => {
    const model = buildSpanModel({
      id: "s",
      layers,
      items: [item("b-mid", { value: 5 }), item("none", { featured: true }), item("z-big", { value: 10 }), item("a-big", { value: 10 }), item("aaa-none")],
    });
    expect(model.groups[0].rows.map((r) => r.item.id)).toEqual(["a-big", "z-big", "b-mid", "aaa-none", "none"]);
  });

  it("splits covered layers into contiguous runs placed by column", () => {
    expect(spanRuns([1, 2, 3, 4, 5, 7], 1)).toEqual([
      { start: 1, end: 5, main: 1 },
      { start: 7, end: 7, main: null },
    ]);
    const nvidia = mount(<SpanChart {...aiStack} />).querySelector('[data-item="nvidia"] .uipack-span__track')!;
    const runs = [...nvidia.children].map((r) => (r as HTMLElement).getAttribute("style"));
    expect(runs).toEqual(["--a:2;--n:5", "--a:8;--n:1"]);
    expect(nvidia.querySelectorAll('[style="--at:0"]')).toHaveLength(1);
  });

  it("makes two-letter monograms that tell similar names apart", () => {
    expect(monogram("OpenRouter")).toBe("OR");
    expect(monogram("Thinking Machines Lab")).toBe("TM");
    expect(monogram("Oklo")).toBe("Ok");
    expect(monogram("Cerebras")).toBe("Ce");
    expect(monogram("Cursor")).toBe("Cu");
    expect(monogram("Weights & Biases")).toBe("WB");
  });

  it("estimates label widths close to system sans, breaking after hyphens", () => {
    // Measured in Chromium on macOS at 12px/500: "Gateways and" is 80.9px wide.
    const w = twoLineWidth("Gateways and observability");
    expect(w).toBeGreaterThan(80);
    expect(w).toBeLessThan(90);
    expect(twoLineWidth("Post-train", 11)).toBeLessThan(35);
  });

  it("places the layout breakpoints where the labels fit, so a 56rem host gets words, not codes", () => {
    const t = spanThresholds(aiStackLayers);
    expect(t.wide).toBeLessThanOrEqual(894); // a 896px figure: name column beside the bars
    expect(t.short).toBeLessThanOrEqual(718); // a 720px figure: stacked rows with short labels
    expect(t.stagger).toBeGreaterThan(318); // a 320px phone: codes alternate lines
    expect(t.stagger).toBeLessThan(388); // a 390px phone does not need to
    expect(t.full).toBeGreaterThan(1000);
    expect(t.large).toBeGreaterThanOrEqual(t.full);
  });
});

describe("SpanChart markup", () => {
  const host = () => mount(<SpanChart {...aiStack} />);

  it("flags featured rows and keeps the expand control out of the form so a reset does not collapse", () => {
    const h = host();
    const featured = aiStackItems.filter((i) => i.featured).length;
    expect(h.querySelectorAll(".uipack-span__item[data-featured]")).toHaveLength(featured);
    const more = [...h.querySelectorAll(".uipack-span__more")].map((m) => m.textContent);
    expect(more).toContain(`Show all ${aiStackItems.length} companies`);
    expect(more).toContain(`${featured} of ${aiStackItems.length} shown`);
    const expand = h.querySelector<HTMLInputElement>(".uipack-span__expand")!;
    expect(expand.checked).toBe(false);
    expect(expand.form).toBeNull();
    expect(h.querySelectorAll('label[for="ai-stack-all"]')).toHaveLength(2); // top and foot
  });

  it("starts expanded with initial all, and drops the control when nothing or everything is featured", () => {
    expect(mount(<SpanChart {...aiStack} initial="all" />).querySelector<HTMLInputElement>(".uipack-span__expand")!.checked).toBe(true);
    expect(mount(<SpanChart id="n" layers={layers} items={[item("x"), item("y")]} />).querySelector(".uipack-span__expand")).toBeNull();
    expect(mount(<SpanChart id="f" layers={layers} items={[item("x", { featured: true })]} />).querySelector(".uipack-span__expand")).toBeNull();
  });

  it("keeps all filter state in one set of inputs that every visible control labels", () => {
    const h = host();
    const ids = new Set([...h.querySelectorAll("input")].map((i) => i.id));
    const labels = [...h.querySelectorAll("label[for]")];
    expect(labels.length).toBeGreaterThan(40);
    for (const label of labels) expect(ids.has(label.getAttribute("for")!)).toBe(true);
    expect(h.querySelectorAll('input[name="ai-stack-layer"]')).toHaveLength(aiStackLayers.length + 1);
    expect(h.querySelectorAll('input[name="ai-stack-tier"]')).toHaveLength(aiStackTiers.length + 1);
    expect(h.querySelector('[role="radiogroup"][aria-label="Layer"]')).not.toBeNull();
    expect(h.querySelector('[role="radiogroup"][aria-label="Size"]')).not.toBeNull();
    // The same radio is labelled by its column header, its chip in the open
    // filter bar and its chip in the narrow drawer.
    expect(h.querySelectorAll('label[for="ai-stack-layer-inference"]')).toHaveLength(3);
    expect(h.querySelector("#ai-stack-layer-all")).toBeChecked();
  });

  it("offers a deals toggle counting every status but shutdown", () => {
    const h = host();
    const toggle = h.querySelector<HTMLInputElement>(".uipack-span__deals-input")!;
    expect(toggle).toHaveAttribute("aria-label", `Deals, ${deals.length}`);
    expect(h.querySelectorAll(".uipack-span__item[data-deal]")).toHaveLength(deals.length);
    expect(h.querySelector('[data-item="builder"]')).not.toHaveAttribute("data-deal");
    expect(mount(<SpanChart {...aiStack} id="d2" labels={{ deals: "Sold" }} />).querySelector(".uipack-span__deals-input")).toHaveAttribute("aria-label", `Sold, ${deals.length}`);
  });

  it("emits rules keyed by the chart's id for each layer, size and combination", () => {
    const model = buildSpanModel(aiStack);
    const css = spanChartCss(model);
    const on = (id: string) => `:has(#ai-stack-${id}:checked)`;
    expect(css).toContain(`#ai-stack${on("layer-inference")}{--sp-active:7}`);
    expect(css).toContain(`#ai-stack${on("layer-inference")} [data-l="inference"]{--sp-sel:1;--sp-now:inline-flex}`);
    expect(css).toContain(`#ai-stack${on("layer-inference")} .uipack-span__item:not([data-layers~="inference"])`);
    expect(css).toContain(`#ai-stack${on("tier-small")} .uipack-span__item:not([data-tier="small"])`);
    expect(css).toContain(`#ai-stack:has(#ai-stack-layer-inference:focus-visible) [data-l="inference"]{--sp-focus:1}`);
    expect(model.groupRules.length).toBeGreaterThan(0);
    expect(css).toContain(".uipack-span__group:not([data-k~=");
    expect(model.emptyStates.length).toBeGreaterThan(0);
    expect(css).toContain(".uipack-span__empty{display:block}");
    expect(css).toContain(`@container uipack-span (min-width: ${model.thresholds.wide}px)`);
    for (const line of css.split("\n").filter((l) => !l.startsWith("@container"))) expect(line.startsWith("#ai-stack")).toBe(true);
    expect(host().querySelector("style")!.innerHTML).toBe(css);
  });

  it("gives a group the key of a combined filter only when one of its rows passes it", () => {
    const model = buildSpanModel(aiStack);
    for (const { filter, key } of model.groupRules) {
      for (const g of model.groups) {
        const passes = g.rows.some(
          (r) => (!filter.layer || r.layerIds.includes(filter.layer)) && (!filter.tier || r.tier?.id === filter.tier) && (!filter.deals || r.deal),
        );
        expect(g.keys.includes(key)).toBe(passes);
      }
    }
  });

  it("escapes ids that would break out of a selector or the style element", () => {
    const css = spanChartCss(buildSpanModel({ id: 'x"</style>', layers: [{ id: 'l"<', label: "L", abbr: "L" }], items: [] }));
    expect(css).not.toContain("</style>");
    expect(cssIdent("9lives")).toBe("\\39 lives");
    expect(cssIdent("a.b")).toBe("a\\2e b");
  });

  it("gives each row one screen-reader sentence and hides the drawn bars", () => {
    const h = host();
    const fireworks = h.querySelector('[data-item="fireworks"] summary')!;
    expect(fireworks.querySelector(".uipack-span__sr")!.textContent).toBe(
      "Fireworks AI. Main layer: Inference. Also in: Post-training. Size: $4B, Small.",
    );
    expect(fireworks.querySelector(".uipack-span__line")).toHaveAttribute("aria-hidden", "true");
  });

  it("states deals and shutdowns in words, pending differently from acquired", () => {
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

  it("explains values, deals and tags in the legend with samples from the data", () => {
    const legend = host().querySelector(".uipack-span__legend")!;
    expect(legend.textContent).toContain("$4.5T");
    expect(legend.textContent).toContain("→ Stripe");
    expect(legend.textContent).toContain("nuclearfocus");
  });

  it("loads logos lazily with empty alt, and shows two letters without one", () => {
    const h = host();
    const img = h.querySelector('[data-item="nvidia"] img')!;
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(h.querySelector('[data-item="oklo"] .uipack-span__logo--mono')!.textContent).toBe("Ok");
  });

  it("keeps links as links in the opened row", () => {
    const links = [...host().querySelectorAll<HTMLAnchorElement>('[data-item="fireworks"] .uipack-span__detail a')];
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Website", "https://fireworks.ai"],
      ["Source", "https://docs.fireworks.ai"],
    ]);
  });

  it("counts featured rows of each group for the default view", () => {
    const chips = host().querySelector('[id="ai-stack-g-chips"]')!;
    expect(chips.querySelector(".uipack-span__count--featured")!.textContent).toBe("2 of 6");
    expect(chips.querySelector(".uipack-span__count--total")!.textContent).toBe("6");
    expect(chips.querySelector(".uipack-span__tick")).toHaveAttribute("style", "--k:1");
  });

  it("has a no-JavaScript reset for the filters and an empty state that uses it", () => {
    const h = host();
    const form = h.querySelector("form")!;
    expect(form.getAttribute("method")).toBe("dialog");
    const resets = [...h.querySelectorAll('button[type="reset"]')];
    expect(resets.map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Clear filters", "Clear filters"]);
    expect(h.querySelector(".uipack-span__empty")!.textContent).toContain("Nothing matches these filters.");
  });

  it("renders titles and group labels as text with group roles when headingLevel is none", () => {
    const h = mount(<SpanChart {...aiStack} headingLevel="none" />);
    expect(h.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
    const groups = [...h.querySelectorAll('.uipack-span__group[role="group"]')];
    expect(groups.length).toBeGreaterThan(5);
    for (const g of groups) expect(h.querySelector(`[id="${g.getAttribute("aria-labelledby")}"]`)).not.toBeNull();
    expect(mount(<SpanChart {...aiStack} id="hf" headingLevel={false} />).querySelectorAll("h3, h4")).toHaveLength(0);
    expect(mount(<SpanChart {...aiStack} id="h2" headingLevel={2} />).querySelector("h2.uipack-span__title")).not.toBeNull();
  });

  it("keeps 158 rows under 1.1 KB each", () => {
    const html = renderToStaticMarkup(<SpanChart id="big" layers={aiStackLayers} zones={aiStackZones} tiers={aiStackTiers} items={syntheticStack(158)} />);
    const rows = html.match(/<li class="uipack-span__item"[\s\S]*?<\/li>/g)!;
    expect(rows).toHaveLength(158);
    expect(rows.join("").length / rows.length).toBeLessThan(1100);
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
  const setup = () => {
    const host = mount(<SpanChart {...aiStack} />);
    const root = host.querySelector<HTMLElement>(".uipack-span")!;
    const $ = (sel: string) => root.querySelector<HTMLInputElement>(sel)!;
    return { root, $ };
  };

  it("clears a filter on repeat activation and Escape, resyncs after a reset, and cleans up", async () => {
    const { root, $ } = setup();
    const cleanup = enhanceSpanChart(root);
    expect(root).toHaveAttribute("data-span-enhanced");
    const inference = $("#ai-stack-layer-inference");
    inference.click();
    expect(inference.checked).toBe(true);
    inference.click();
    expect($("#ai-stack-layer-all").checked).toBe(true);

    inference.click();
    $("#ai-stack-tier-small").click();
    $("#ai-stack-deals").click();
    expect($("#ai-stack-deals").checked).toBe(true);
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect($("#ai-stack-layer-all").checked).toBe(true);
    expect($("#ai-stack-tier-all").checked).toBe(true);
    expect($("#ai-stack-deals").checked).toBe(false);

    // A native reset restores the defaults; the enhancement catches up after it.
    inference.click();
    root.querySelector("form")!.reset();
    await new Promise((r) => setTimeout(r, 5));
    expect($("#ai-stack-layer-all").checked).toBe(true);
    inference.click();
    expect(inference.checked).toBe(true); // not treated as a repeat

    inference.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect($("#ai-stack-layer-all").checked).toBe(true);

    cleanup();
    expect(root).not.toHaveAttribute("data-span-enhanced");
    inference.click();
    inference.click();
    expect(inference.checked).toBe(true);
  });

  it("writes the shown count while filtered", () => {
    const { root, $ } = setup();
    enhanceSpanChart(root);
    $("#ai-stack-layer-inference").click();
    // jsdom has no layout, so every row counts as not rendered; the template is what is under test.
    expect(root.querySelector("[data-span-status]")!.textContent).toBe(`0 of ${aiStackItems.length} shown`);
    expect(root.querySelector("[data-span-live]")!.textContent).toBe(`0 of ${aiStackItems.length} shown`);
  });

  it("selects the filter a URL hash names", () => {
    history.replaceState(null, "", "#ai-stack-layer-control");
    const { root, $ } = setup();
    root.scrollIntoView = () => {};
    enhanceSpanChart(root);
    expect($("#ai-stack-layer-control").checked).toBe(true);
  });
});

describe("LayerStack", () => {
  it("numbers layers bottom-up but puts the top layer first in reading order", () => {
    const host = mount(<LayerStack {...aiStackDiagram} />);
    const numbers = [...host.querySelectorAll(".uipack-stack__index")].map((n) => n.textContent!.replace("Layer ", ""));
    expect(numbers).toEqual(["10", "09", "08", "07", "06", "05", "04", "03", "02", "01"]);
    expect(host.querySelector("summary")!.textContent).toContain("Apps");
    // Each zone heading comes right before its own bands.
    const order = [...host.querySelectorAll(".uipack-stack__zone-head, .uipack-stack__band")].map((el) =>
      el.classList.contains("uipack-stack__zone-head") ? `zone:${el.textContent}` : el.id.replace("ai-stack-layers-", ""),
    );
    expect(order.slice(0, 5)).toEqual(["zone:Serving and productrun on every request", "apps", "harness", "inference", "zone:Modelsbuilt once per model"]);
  });

  it("spans each rail over exactly its layers' rows", () => {
    const model = buildLayerStack(aiStackDiagram);
    const layers = model.zones.flatMap((z) => z.layers);
    const row = (id: string) => layers.find((l) => l.layer.id === id)!.place.wide[0];
    const evals = model.rails.find((r) => r.rail.id === "evals")!;
    expect(evals.place.wide).toEqual([row("apps"), row("post-training") - row("apps") + 1]);
    expect(evals.span).toBe("layers 7–10");
    const safety = model.rails.find((r) => r.rail.id === "safety")!;
    expect(safety.place.wide).toEqual([row("apps"), row("power") - row("apps") + 1]);
  });

  it("ramps the zone edge up the stack in one hue and alternates the tints", () => {
    const model = buildLayerStack(aiStackDiagram);
    expect(model.zones.map((z) => [z.zone.id, z.ramp, z.alt])).toEqual([
      ["serving", 90, true],
      ["models", 60, false],
      ["infrastructure", 30, true],
    ]);
  });

  it("puts bracket labels above the zone they start in, below 1000px", () => {
    const model = buildLayerStack({ ...aiStackDiagram, brackets: [{ label: "Shared", from: "power", to: "cloud" }] });
    const infra = model.zones.find((z) => z.zone.id === "infrastructure")!;
    expect(infra.brackets).toHaveLength(1);
    expect(infra.brackets[0].place.compact[0]).toBe(infra.place.compact[0] - 1);
    expect(infra.brackets[0].place.wide[1]).toBe(4);
  });

  it("renders bands as details, rails as links and a rail list for every width", () => {
    const host = mount(<LayerStack {...aiStackDiagram} />);
    expect(host.querySelectorAll("details.uipack-stack__band")).toHaveLength(10);
    const inference = host.querySelector("#ai-stack-layers-inference")!;
    expect(inference.querySelector("strong")!.textContent).toBe("280×");
    expect(inference.querySelector(".uipack-stack__detail")!.textContent).toContain("Why does a longer answer cost more");
    expect(inference.querySelector(".uipack-stack__read")).toHaveAttribute("href", "#inference");
    // The bars are a pointer shortcut, out of the tab order and hidden from screen readers.
    for (const bar of host.querySelectorAll("a.uipack-stack__rail")) {
      expect(bar).toHaveAttribute("aria-hidden", "true");
      expect(bar).toHaveAttribute("tabindex", "-1");
    }
    const list = [...host.querySelectorAll<HTMLAnchorElement>(".uipack-stack__across a")];
    expect(list.map((a) => a.getAttribute("href"))).toEqual(["#gateways", "#evals", "#safety"]);
    expect(host.querySelector(".uipack-stack__across")!.textContent).toContain("layers 7–10");
    expect(host.querySelector(".uipack-stack__across")!.textContent).toContain("Measure whether a change made the model");
    expect(host.querySelectorAll(".uipack-stack__note")).toHaveLength(3);
  });

  it("renders zone labels as text in named groups when headingLevel is none", () => {
    const host = mount(<LayerStack {...aiStackDiagram} headingLevel="none" />);
    expect(host.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
    const groups = [...host.querySelectorAll('.uipack-stack__zone[role="group"]')];
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(host.querySelector(`[id="${g.getAttribute("aria-labelledby")}"]`)!.textContent).toMatch(/\w/);
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

/* sRGB colour-mix and WCAG contrast, to check the stylesheet's mixes. */
type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, p: number): RGB => a.map((v, i) => v * p + b[i] * (1 - p)) as RGB;
const lum = (c: RGB) =>
  c
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

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

  it("outranks host prose rules whichever stylesheet loads last", () => {
    expect(css).toContain(".uipack-span.uipack-span :where(");
    expect(css).toContain(".uipack-stack.uipack-stack :where(");
    expect(css).toMatch(/overflow-wrap: normal;\s+word-break: keep-all;/);
  });

  it("switches themes like theme.css and lets host variables win", () => {
    expect(css).toContain(':root:not([data-theme="light"]) .uipack-span');
    expect(css).toContain('[data-theme="dark"] .uipack-span');
    expect(css).toContain("--sp-accent: var(--uipack-accent, #205f49)");
    expect(css).toContain("--sp-accent: var(--uipack-accent, #71dcb2)");
    expect(css).toContain("var(--uipack-span-column-highlight,");
    expect(css).toContain("--sp-logo-bg: var(--uipack-span-logo-bg, color-mix(in srgb, var(--sp-fg) 82%, var(--sp-bg)))");
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("keeps LayerStack to one accent hue", () => {
    const stack = css.slice(css.indexOf("/* ==================== LayerStack"));
    expect(stack).not.toMatch(/--sp-(request|change)\b/);
  });

  // Palettes: Technical light and dark, and the notes site's light and dark.
  const palettes = {
    "technical light": { bg: "#ffffff", fg: "#1a1c1a", accent: "#205f49", change: "#9a63e0" },
    "technical dark": { bg: "#0e1512", fg: "#e8ece9", accent: "#71dcb2", change: "#c39aff" },
    "notes light": { bg: "#fffdf9", fg: "#14110d", accent: "#0f7a55", change: "#eb6834" },
    "notes dark": { bg: "#12110f", fg: "#ece7de", accent: "#199e70", change: "#d95926" },
  };
  it.each(Object.entries(palettes))("draws 'also' cells at 3:1 and badge text at 4.5:1 on %s", (_name, p) => {
    expect(css).toContain("--sp-line: color-mix(in srgb, var(--sp-accent) 72%, var(--sp-bg))");
    expect(css).toContain("--sp-change-ink: color-mix(in srgb, var(--sp-change) 70%, var(--sp-fg))");
    const [bg, fg, accent, change] = [p.bg, p.fg, p.accent, p.change].map(hex);
    expect(contrast(mix(accent, bg, 0.72), bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(mix(change, fg, 0.7), bg)).toBeGreaterThanOrEqual(4.5);
    // Main and also cells stay distinct from each other.
    expect(contrast(accent, mix(accent, bg, 0.2))).toBeGreaterThanOrEqual(2.5);
  });
});
