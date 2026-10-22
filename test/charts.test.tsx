import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  LayerStack,
  SpanChart,
  buildLayerStack,
  buildSpanModel,
  enhanceLayerStack,
  enhanceSpanChart,
  spanChartCss,
  type SpanItem,
  type SpanLayer,
} from "../src/charts";
import { cssIdent, LABEL_GAP, columnWidth, monogram, spanRuns, spanThresholds, textWidth, twoLineWidth } from "../src/charts/model";
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

  it("estimates label widths within a few percent of the system sans, breaking after hyphens", () => {
    // Measured in Chromium on macOS at 500 weight: "Gateways and" 80.91px at 12px, "Inference" 50.46px and "Gateway" 46.18px at 11px.
    expect(twoLineWidth("Gateways and observability")).toBeGreaterThan(80.9);
    expect(twoLineWidth("Gateways and observability")).toBeLessThan(83);
    expect(textWidth("Inference", 11)).toBeGreaterThanOrEqual(50.46);
    expect(textWidth("Inference", 11)).toBeLessThan(51.5);
    expect(textWidth("Gateway", 11)).toBeGreaterThanOrEqual(46.18);
    expect(twoLineWidth("Post-train", 11)).toBeLessThan(35);
  });

  it("places the layout breakpoints where the labels fit, so a 56rem host gets words, not codes", () => {
    const t = spanThresholds(aiStackLayers);
    expect(t.wide).toBeLessThanOrEqual(894); // a 896px figure: name column beside the bars
    expect(t.short).toBeLessThanOrEqual(718); // a 720px figure: stacked rows with short labels
    expect(t.stagger).toBeGreaterThan(318); // phones: codes alternate lines to keep an 8px gap
    expect(t.full).toBeGreaterThan(1000);
    expect(t.large).toBeGreaterThanOrEqual(t.full);
  });

  it("keeps at least 8px between neighbouring short labels wherever they show", () => {
    const t = spanThresholds(aiStackLayers);
    const width = (l: (typeof aiStackLayers)[number]) => textWidth(l.short!.split("-")[0] + (l.short!.includes("-") ? "-" : ""), 11, -0.01);
    for (const c of [t.short, t.wide, 894, t.full - 1]) {
      const col = columnWidth(c, aiStackLayers.length, c >= t.wide);
      for (let i = 1; i < aiStackLayers.length; i++) {
        const gap = col - (width(aiStackLayers[i]) + width(aiStackLayers[i - 1])) / 2;
        expect(gap).toBeGreaterThanOrEqual(LABEL_GAP);
      }
    }
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
    expect(h.querySelectorAll('label[for="ai-stack-deals"]')).toHaveLength(4); // toolbar, drawer, phone key line, active row
    expect(h.querySelectorAll('input[name="ai-stack-layer"]')).toHaveLength(aiStackLayers.length + 1);
    expect(h.querySelectorAll('input[name="ai-stack-tier"]')).toHaveLength(aiStackTiers.length + 1);
    expect(h.querySelector('[role="radiogroup"][aria-label="Layer"]')).not.toBeNull();
    expect(h.querySelector('[role="radiogroup"][aria-label="Size"]')).not.toBeNull();
    // The same radio is labelled by its column header and its chip in the
    // narrow drawer.
    expect(h.querySelectorAll('label[for="ai-stack-layer-inference"]')).toHaveLength(2);
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
    expect(css).toContain(`#ai-stack${on("layer-inference")} [data-l="inference"]{--sp-sel:1;--sp-now:inline-flex;--sp-now-text:inline}`);
    expect(css).toContain(`#ai-stack${on("layer-inference")} .uipack-span__item:not([data-layers~="inference"])`);
    expect(css).toContain(`#ai-stack${on("tier-small")} .uipack-span__item:not([data-tier="small"])`);
    expect(css).toContain(`#ai-stack:has(#ai-stack-layer-inference:focus-visible) [data-l="inference"]{--sp-focus:1}`);
    expect(model.groupRules.length).toBeGreaterThan(0);
    expect(css).toContain(".uipack-span__group:not([data-k~=");
    expect(model.emptyStates.length).toBeGreaterThan(0);
    expect(css).toContain(".uipack-span__empty{display:grid}");
    expect(css).toContain(`@container uipack-span (min-width: ${model.thresholds.wide}px)`);
    for (const line of css.split("\n").filter((l) => !l.startsWith("@"))) expect(line.startsWith("#ai-stack")).toBe(true);
    // Hovering a column header on a fine pointer shows that column's faint band.
    expect(css).toContain("@media (hover: hover) and (pointer: fine){#ai-stack:has(.uipack-span__col[data-l=");
    expect(css).toContain(`#ai-stack:has(.uipack-span__col[data-l="inference"]:hover){--sp-hover:7;--sp-hover-on:block}`);
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

  it("states deals and shutdowns in words; pills carry only the counterparty and differ by kind", () => {
    const h = host();
    const sr = (id: string) => h.querySelector(`[data-item="${id}"] .uipack-span__sr`)!.textContent;
    const badge = (id: string) => h.querySelector(`[data-item="${id}"] .uipack-span__badge`)!;
    expect(sr("openrouter")).toContain("Acquired by Stripe, 2026.");
    expect(badge("openrouter").textContent).toBe("→ Stripe");
    expect(sr("hugging-face")).toContain("Sale agreed to Nvidia, 2026.");
    expect(badge("hugging-face").textContent).toBe("→ Nvidia");
    expect(badge("hugging-face")).toHaveAttribute("data-kind", "pending");
    expect(sr("groq")).toContain("Technology licensed to Nvidia, 2025.");
    expect(badge("groq").textContent).toBe("↝ Nvidia");
    expect(sr("builder")).toContain("Shut down, 2025.");
    expect(badge("builder").textContent).toBe("shut");
  });

  it("explains bars, each deal kind, values and tags in one key strip of labelled sections", () => {
    const h = host();
    const key = h.querySelector(".uipack-span__panel .uipack-span__key")!;
    const sections = [...key.children].map((li) => li.querySelector(".uipack-span__key-label")!.textContent);
    expect(sections).toEqual(["Bars", "Deals", "Size", "Type"]);
    expect(key.children[0].textContent).toBe("BarsMainAlso in");
    const kinds = [...key.querySelectorAll(".uipack-span__badge")].map((b) => [b.getAttribute("data-kind"), b.textContent]);
    // Each kind: a sample badge as rows show it, then its word in plain ink.
    expect(kinds).toEqual([
      ["acquired", "→"],
      ["pending", "→"],
      ["licensed", "↝"],
      ["shutdown", "shut"],
    ]);
    expect(key.children[1].textContent).toBe("Deals→acquired→pending↝licensedshutshut down");
    expect(key.children[2].textContent).toBe("Size$4.5Tlargest first");
    expect(key.children[3].textContent).toBe("Typenuclearfocus");
    // The phone drawer holds the same sections.
    expect(h.querySelector(".uipack-span__drawer .uipack-span__key")!.textContent).toBe(key.textContent);
    // Older hosts pass only tagLegend; the other words have defaults.
    const relabelled = mount(<SpanChart {...aiStack} id="k2" labels={{ tagLegend: "model type", valueLegend: "market cap or valuation", keyDeals: "Exits" }} />);
    expect(relabelled.querySelector(".uipack-span__key")!.textContent).toContain("Exits");
    expect(relabelled.querySelector(".uipack-span__key")!.textContent).toContain("$4.5Tmarket cap or valuation");
    expect(relabelled.querySelector(".uipack-span__key")!.textContent).toContain("nuclearmodel type");
  });

  it("gives the size control a SIZE cell and static counts, and counts each layer", () => {
    const h = host();
    const model = buildSpanModel(aiStack);
    const seg = h.querySelector(".uipack-span__toolbar .uipack-span__seg")!;
    expect(seg.querySelector(".uipack-span__seg-label")!.textContent).toBe("Size");
    const chips = [...seg.querySelectorAll(".uipack-span__chip")].map((c) => c.textContent);
    expect(chips[0]).toBe(`All sizes${aiStackItems.length}`);
    expect(model.tierCounts.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(aiStackItems.length);
    aiStackTiers.forEach((tier, k) => {
      expect(model.tierCounts[k]).toBe(aiStackItems.filter((i) => i.tier === tier.id).length);
      expect(chips[k + 1]).toBe(`${tier.label}${model.tierCounts[k]}`);
    });
    aiStackLayers.forEach((layer, k) => {
      const n = aiStackItems.filter((i) => i.primary === layer.id || i.also?.includes(layer.id)).length;
      expect(model.layerCounts[k]).toBe(n);
      expect(h.querySelector(`.uipack-span__col[data-l="${layer.id}"] .uipack-span__ccount`)!.textContent).toBe(String(n));
    });
    expect(h.querySelector(".uipack-span__toolbar .uipack-span__chip--toggle")!.textContent).toBe(`Deals${deals.length}`);
    const featured = aiStackItems.filter((i) => i.featured).length;
    expect(h.querySelector(".uipack-span__toggle--foot")!.textContent).toBe(`Show all ${aiStackItems.length} companiesShow the ${featured} featured`);
  });

  it("ships a hidden search field and a hidden no-match state for the enhancement", () => {
    const h = host();
    const field = h.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(field.closest("label")).toHaveAttribute("hidden");
    expect(field.closest("label")!.textContent).toBe("Find a company");
    expect(field).toHaveAttribute("placeholder", "Find a company");
    const none = h.querySelector(".uipack-span__nomatch")!;
    expect(none).toHaveAttribute("hidden");
    expect(none).toHaveAttribute("data-span-nomatch", "No company matches “{q}”");
  });

  it("keeps each input beside the controls that label it, in the order the eye meets them", () => {
    const h = host();
    // Layer radios and the expand toggle stick with the column headers.
    const header = h.querySelector(".uipack-span__header")!;
    expect(header.querySelectorAll("input")).toHaveLength(aiStackLayers.length + 1 + 1);
    // Size and Deals sit in the toolbar, before the search field.
    const toolbar = h.querySelector(".uipack-span__toolbar")!;
    expect(toolbar.querySelectorAll(".uipack-span__inputs input")).toHaveLength(aiStackTiers.length + 1 + 1);
    // Tab order: size, Deals, search, then (with a filter on) Clear, then the columns.
    const stops = [...h.querySelectorAll<HTMLElement>("input, button, summary")]
      .filter((el) => !(el instanceof HTMLInputElement && el.type === "radio" && !el.defaultChecked))
      .map((el) => el.id.replace("ai-stack-", "") || el.getAttribute("type") || el.tagName.toLowerCase());
    expect(stops.slice(0, 6)).toEqual(["summary", "tier-all", "deals", "search", "reset", "layer-all"]);
    expect(stops.indexOf("tier-all")).toBeLessThan(stops.indexOf("search"));
    expect(stops.indexOf("search")).toBeLessThan(stops.indexOf("layer-all"));
  });

  it("puts the search field on the key's row when there is no size or deals control", () => {
    const lean = mount(<SpanChart id="lean" layers={layers} items={[item("x"), item("y", { tags: ["coding"] })]} />);
    const root = lean.querySelector(".uipack-span")!;
    expect(root).toHaveAttribute("data-lean", "");
    expect(lean.querySelector(".uipack-span__toolbar .uipack-span__inputs")).toBeNull();
    const css = spanChartCss(buildSpanModel({ id: "lean", layers, items: [item("x")] }));
    expect(css).toContain("#lean[data-lean] .uipack-span__toolbar{grid-column:2}");
    expect(host().querySelector(".uipack-span")).not.toHaveAttribute("data-lean");
  });

  it("keeps units and names as written in uppercase labels", () => {
    const h = mount(
      <SpanChart
        id="units"
        layers={[
          { id: "a", label: "Memory (TB/s)", abbr: "MEM", zone: "z" },
          { id: "b", label: "Tools and MCP", abbr: "TLS", zone: "z" },
        ]}
        zones={[{ id: "z", label: "32k context" }]}
        items={[item("x"), item("y", { primary: "b" })]}
      />,
    );
    const head = h.querySelector('[id="units-g-a"] > span')!;
    expect(head.textContent).toBe("Memory (TB/s)");
    expect([...head.querySelectorAll(".uipack-span__keep")].map((k) => k.textContent)).toEqual(["(TB/s)"]);
    expect(h.querySelector('[id="units-g-b"] .uipack-span__keep')).toBeNull();
    expect(h.querySelector(".uipack-span__zones .uipack-span__keep")!.textContent).toBe("32k");
  });

  it("puts the column hint in the corner cell (or the toolbar), and the layer chips only in the phone drawer", () => {
    const h = host();
    const css = spanChartCss(buildSpanModel(aiStack));
    expect(css).toMatch(/--sp-hint-toolbar:none/);
    expect(h.querySelector(".uipack-span__corner")!.textContent).toBe("Click a column to filterTap a column to filterCompany");
    expect(h.querySelector(".uipack-span__hint--toolbar")!.textContent).toBe("Click a column to filterTap a column to filter");
    expect(h.querySelectorAll(".uipack-span__panel .uipack-span__chip[data-l]")).toHaveLength(0);
    expect(h.querySelectorAll(".uipack-span__drawer .uipack-span__chip[data-l]")).toHaveLength(aiStackLayers.length + 1);
    // Nothing focusable or scrollable sits inside the hidden chip rows.
    expect(h.querySelector(".uipack-span__scroll")).toBeNull();
    expect(h.querySelectorAll('[aria-hidden="true"] :is(a[href], button, input, summary, [tabindex]:not([tabindex="-1"]))')).toHaveLength(0);
  });

  it("shows the two swatches and the deals toggle outside the phone drawer", () => {
    const key = host().querySelector(".uipack-span__keyline")!;
    expect(key.textContent).toContain("Main");
    expect(key.textContent).toContain("Also in");
    expect(key.querySelector('label[for="ai-stack-deals"]')).not.toBeNull();
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
    expect(chips.querySelector(".uipack-span__mark")).toHaveAttribute("style", "--k:1");
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

    expect(document.activeElement).toBe($("#ai-stack-layer-all")); // focus lands on the chart's first filter after a reset
    inference.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect($("#ai-stack-layer-all").checked).toBe(true);
    inference.click();
    inference.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
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

  it("finds rows by name, tag or deal, ignoring case and accents, and resets with Escape or Clear", () => {
    const host = mount(
      <SpanChart
        id="find"
        layers={layers}
        items={[
          item("soc", { name: "Société Générale", featured: true }),
          item("mis", { name: "Mistral AI", tags: ["voice"] }),
          item("grq", { name: "Groq", primary: "b", status: { kind: "licensed", label: "Nvidia, 2025" } }),
          item("zed", { name: "Zed", primary: "c" }),
        ]}
      />,
    );
    const root = host.querySelector<HTMLElement>(".uipack-span")!;
    const field = root.querySelector<HTMLInputElement>("input[type=search]")!;
    const missing = () => [...root.querySelectorAll(".uipack-span__item[data-span-miss]")].map((el) => el.getAttribute("data-item")).sort();
    const type = (text: string) => {
      field.value = text;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const cleanup = enhanceSpanChart(root);
    expect(field.closest("label")!.hidden).toBe(false);
    type("SOCIETE");
    expect(missing()).toEqual(["grq", "mis", "zed"]);
    expect(root).toHaveAttribute("data-span-searching");
    // A group with no match hides with its rows.
    expect(root.querySelectorAll(".uipack-span__group[data-span-miss]")).toHaveLength(2);
    type("voice");
    expect(missing()).toEqual(["grq", "soc", "zed"]);
    type("nvidia");
    expect(missing()).toEqual(["mis", "soc", "zed"]);
    // jsdom has no layout, so nothing counts as shown: the no-match state names the query.
    expect(root.querySelector<HTMLElement>(".uipack-span__nomatch")!.hidden).toBe(false);
    expect(root.querySelector(".uipack-span__nomatch p")!.textContent).toBe("No company matches “nvidia”");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(field.value).toBe("");
    expect(missing()).toEqual([]);
    expect(root).not.toHaveAttribute("data-span-searching");
    expect(root.querySelector<HTMLElement>(".uipack-span__nomatch")!.hidden).toBe(true);
    type("zzz");
    root.querySelector<HTMLButtonElement>("[data-span-clear-search]")!.click();
    expect(field.value).toBe("");
    expect(document.activeElement).toBe(field);
    type("zed");
    cleanup();
    expect(field.closest("label")!.hidden).toBe(true);
    expect(missing()).toEqual([]);
  });

  it("announces showing all rows or the featured subset", () => {
    const { root } = setup();
    enhanceSpanChart(root);
    const expand = root.querySelector<HTMLInputElement>(".uipack-span__expand")!;
    expand.click();
    expect(root.querySelector("[data-span-live]")!.textContent).toBe(`${aiStackItems.length} of ${aiStackItems.length} shown`);
    expand.click();
    const featured = aiStackItems.filter((i) => i.featured).length;
    expect(root.querySelector("[data-span-live]")!.textContent).toBe(`${featured} of ${aiStackItems.length} shown`);
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
    expect(host.querySelector(".uipack-stack__band")!.textContent).toContain("Apps");
    // Each zone heading comes right before its own bands.
    const order = [...host.querySelectorAll(".uipack-stack__zone-head, .uipack-stack__band")].map((el) =>
      el.classList.contains("uipack-stack__zone-head") ? `zone:${el.textContent}` : el.id.replace("ai-stack-layers-", ""),
    );
    expect(order.slice(0, 5)).toEqual(["zone:Serving and productrun on every request", "apps", "harness", "inference", "zone:Modelsbuilt once per model"]);
  });

  it("spans each rail over exactly its layers' rows, and each zone box from its label to its end row", () => {
    const model = buildLayerStack(aiStackDiagram);
    const layers = model.zones.flatMap((z) => z.layers);
    const row = (id: string) => layers.find((l) => l.layer.id === id)!.place.wide[0];
    const evals = model.rails.find((r) => r.rail.id === "evals")!;
    expect(evals.place.wide).toEqual([row("apps"), row("post-training") - row("apps") + 1]);
    expect(evals.span).toBe("layers 7–10");
    const safety = model.rails.find((r) => r.rail.id === "safety")!;
    expect(safety.place.wide).toEqual([row("apps"), row("power") - row("apps") + 1]);
    const serving = model.zones[0];
    expect(serving.box.wide).toEqual([serving.place.wide[0], serving.endRow.wide[0] - serving.place.wide[0] + 1]);
    expect(serving.endRow.wide[0]).toBe(row("inference") + 1);
    expect(model.zones[1].place.wide[0]).toBe(serving.endRow.wide[0] + 1);
  });

  it("makes every band one link to its section, with no disclosure when there is no detail", () => {
    const host = mount(<LayerStack {...aiStackDiagram} />);
    const bands = [...host.querySelectorAll(".uipack-stack__band")];
    expect(bands).toHaveLength(10);
    for (const band of bands) expect(band.tagName).toBe("A");
    expect(host.querySelector("details, summary, .uipack-stack__check, .uipack-stack__metric")).toBeNull();
    const inference = host.querySelector<HTMLAnchorElement>("#ai-stack-layers-inference")!;
    expect(inference.getAttribute("href")).toBe("#inference");
    // "↓" at rest (CSS content, so not text a label-in-name check compares); the words show on hover and focus and are part of the name.
    expect(inference.querySelector(".uipack-stack__go")).toHaveAttribute("aria-hidden", "true");
    expect(inference.querySelector(".uipack-stack__go")!.textContent).toBe("");
    expect(inference.querySelector(".uipack-stack__go-text")).toHaveAttribute("aria-hidden", "true");
    expect(inference.querySelector(".uipack-stack__go-text")!.textContent).toBe("Go to section");
    expect(inference).toHaveAttribute("aria-label", "Layer 08 Inference. Every request costs compute; price per token sets the margin. Go to section");
    expect(inference.textContent!.replace("Go to section", "")).toBe("Layer 08 Inference. Every request costs compute; price per token sets the margin.");
    const relabelled = mount(<LayerStack {...aiStackDiagram} id="g2" labels={{ go: "Read" }} />);
    expect(relabelled.querySelector(".uipack-stack__go-text")!.textContent).toBe("Read");
    expect(relabelled.querySelector(".uipack-stack__band")!.getAttribute("aria-label")).toMatch(/\. Read$/);
  });

  it("opens a band with detail and shows a metric only when given", () => {
    const host = mount(
      <LayerStack
        id="opt"
        zones={[{ id: "z", label: "Z" }]}
        layers={[
          { id: "a", label: "A", zone: "z", summary: "s", detail: "Why?", metric: { value: "280×", label: "cheaper" }, href: "#a" },
          { id: "b", label: "B", zone: "z", summary: "Only a summary." },
        ]}
      />,
    );
    const a = host.querySelector("#opt-a")!;
    expect(a.tagName).toBe("DETAILS");
    expect(a.querySelector("strong")!.textContent).toBe("280×");
    expect(a.querySelector(".uipack-stack__detail")!.textContent).toContain("Check yourself Why?");
    expect(a.querySelector(".uipack-stack__read")).toHaveAttribute("href", "#a");
    const b = host.querySelector("#opt-b")!;
    expect(b.tagName).toBe("DIV");
    expect(b.textContent).toContain("Only a summary.");
    expect(b.querySelector(".uipack-stack__go")).toBeNull();
  });

  it("draws rails as named links with their short label, and lists them as nodes for phones", () => {
    const host = mount(<LayerStack {...aiStackDiagram} />);
    const rail = host.querySelector('a.uipack-stack__rail[href="#gateways"]')!;
    expect(rail.textContent).toBe("Gateways ");
    expect(rail.querySelector(".uipack-stack__arrow")).toHaveAttribute("aria-hidden", "true");
    expect(rail).toHaveAttribute("aria-label", "Gateways and observability, layers 8–10");
    expect(rail).toHaveAttribute("title", "Route, log and meter every model call across providers.");
    expect(rail).not.toHaveAttribute("aria-hidden");
    expect(rail).not.toHaveAttribute("tabindex");
    const list = [...host.querySelectorAll<HTMLAnchorElement>(".uipack-stack__across a.uipack-stack__node")];
    expect(list.map((a) => a.getAttribute("href"))).toEqual(["#gateways", "#evals", "#safety"]);
    expect(list[1].textContent).toBe("Evalslayers 7–10Measure whether a change made the model or the product better.");
    expect(host.querySelectorAll(".uipack-stack__note")).toHaveLength(3);
  });

  it("puts bracket labels above the zone they start in, below 1000px", () => {
    const model = buildLayerStack({ ...aiStackDiagram, brackets: [{ label: "Shared", from: "power", to: "cloud" }] });
    const infra = model.zones.find((z) => z.zone.id === "infrastructure")!;
    expect(infra.brackets).toHaveLength(1);
    expect(infra.brackets[0].place.compact[0]).toBe(infra.place.compact[0] - 1);
    expect(infra.brackets[0].place.wide[1]).toBe(4);
  });

  it("renders zone labels as text in named groups when headingLevel is none", () => {
    const host = mount(<LayerStack {...aiStackDiagram} headingLevel="none" />);
    expect(host.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
    const groups = [...host.querySelectorAll('.uipack-stack__zone[role="group"]')];
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(host.querySelector(`[id="${g.getAttribute("aria-labelledby")}"]`)!.textContent).toMatch(/\w/);
  });

  it("scrolls smoothly to a section with enhanceLayerStack, unless motion is reduced", () => {
    const host = mount(
      <>
        <LayerStack {...aiStackDiagram} />
        <h2 id="inference">Inference</h2>
      </>,
    );
    const root = host.querySelector<HTMLElement>(".uipack-stack")!;
    const section = host.querySelector<HTMLElement>("#inference")!;
    const calls: unknown[] = [];
    section.scrollIntoView = (arg?: boolean | ScrollIntoViewOptions) => void calls.push(arg);
    const reduce = { matches: false };
    window.matchMedia = (() => reduce) as unknown as typeof window.matchMedia;
    const cleanup = enhanceLayerStack(root);
    const band = root.querySelector<HTMLAnchorElement>("#ai-stack-layers-inference")!;
    const click = () => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
      band.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(click()).toBe(true);
    expect(calls).toEqual([{ behavior: "smooth", block: "start" }]);
    expect(location.hash).toBe("#inference");
    expect(document.activeElement).toBe(section);
    reduce.matches = true;
    expect(click()).toBe(false);
    cleanup();
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

  it("keeps LayerStack to one accent hue, with no outer frame and no rotated text", () => {
    const stack = css.slice(css.indexOf("/* ==================== LayerStack"));
    expect(stack).not.toMatch(/--sp-(request|change)\b/);
    expect(stack).not.toMatch(/writing-mode|rotate\(90|rotate\(-90/);
    expect(css).toMatch(/\.uipack-span,\n\.uipack-stack \{[^}]*background: none;\n  border: 0;/);
  });

  it("sets every uppercase label in the host's label font", () => {
    expect(css).toContain("--sp-label-font: var(--uipack-label-font, var(--sp-mono))");
    const upper = css.split("}").filter((rule) => rule.includes("text-transform: uppercase"));
    expect(upper.length).toBeGreaterThan(2);
    for (const rule of upper) expect(rule).toContain("var(--sp-label-font)");
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
    // Diagram nodes: a 70% ink edge at 3:1 on the page; uppercase labels (80%)
    // and band constraints (75%) at 4.5:1.
    expect(css).toContain("--sp-node-edge: color-mix(in srgb, var(--sp-fg) 70%, transparent)");
    expect(css).toContain("--sp-label-ink: color-mix(in srgb, var(--sp-fg) 80%, transparent)");
    expect(contrast(mix(fg, bg, 0.7), bg)).toBeGreaterThanOrEqual(3);
    // Dashed zone boxes: 50% ink, the article clusters' group edge, at 3:1.
    expect(css).toContain("--sp-group-edge: color-mix(in srgb, var(--sp-fg) 50%, transparent)");
    expect(contrast(mix(fg, bg, 0.5), bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(mix(fg, bg, 0.8), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(mix(fg, bg, 0.75), bg)).toBeGreaterThanOrEqual(4.5);
    // Chosen chips, headers and filter tags: accent ink (75% accent) on the
    // band tint (accent 10% light, 20% dark), counts included.
    expect(css).toContain("--sp-accent-ink: color-mix(in srgb, var(--sp-accent) 75%, var(--sp-fg))");
    expect(css).toContain("color: color-mix(in srgb, var(--sp-accent) calc(var(--sp-sel, 0) * 75%), var(--sp-fg));");
    const tint = mix(accent, bg, _name.endsWith("dark") ? 0.2 : 0.1);
    expect(contrast(mix(accent, fg, 0.75), tint)).toBeGreaterThanOrEqual(4.5);
  });
});
