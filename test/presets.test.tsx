import { render } from "@testing-library/react";
import { PRESETS, type PresetName } from "../src/presets";
import { serviceMap, serviceMapParts, defaultServiceMap } from "../src/presets";

describe("presets", () => {
  for (const name of Object.keys(PRESETS) as PresetName[]) {
    it(`${name} renders wide and narrow from its default spec`, () => {
      const { render: r, spec } = PRESETS[name] as { render: (s: unknown) => JSX.Element; spec: unknown };
      const { container } = render(r(spec));
      expect(container.querySelector("svg.uipack--wide [data-uipack='node']")).not.toBeNull();
      expect(container.querySelector("svg.uipack--narrow [data-uipack='node']")).not.toBeNull();
      expect(container.querySelector("figure")).toHaveClass("uipack--has-narrow");
      expect(container.querySelectorAll("animateMotion").length).toBeGreaterThan(0);
    });
  }
  it("a spec change reaches the drawing", () => {
    const parts = serviceMapParts({ ...defaultServiceMap, clients: [{ label: "Only client", icon: "client" }], sinks: undefined }, "t");
    const { container } = render(<svg>{parts.wide}</svg>);
    expect(container.textContent).toContain("Only client");
    expect(container.textContent).not.toContain("Warehouse");
    expect(parts.legend.map((l) => l.kind)).toEqual(["request", "response"]);
  });
  it("every connector carries at most one arrowhead", () => {
    for (const name of Object.keys(PRESETS) as PresetName[]) {
      const { render: r, spec } = PRESETS[name] as { render: (s: unknown) => JSX.Element; spec: unknown };
      const { container } = render(r(spec));
      for (const c of container.querySelectorAll('[data-uipack="connector"]')) expect(c.getAttribute("marker-start")).toBeNull();
    }
  });
});

describe("preset ids", () => {
  it("two figures of one preset on a page share no element ids", () => {
    const { container } = render(
      <>
        {serviceMap()}
        {serviceMap()}
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(4);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll("marker").length).toBeGreaterThanOrEqual(10);
  });
  it("an explicit id is used verbatim", () => {
    const { container } = render(serviceMap(undefined, "mine"));
    expect(container.querySelector("#mine-head")).not.toBeNull();
  });
});

describe("preset layout", () => {
  it("every lane header sits on the 8px grid", () => {
    for (const name of Object.keys(PRESETS) as PresetName[]) {
      const { render: r, spec } = PRESETS[name] as { render: (s: unknown) => JSX.Element; spec: unknown };
      const { container } = render(r(spec));
      for (const t of container.querySelectorAll('svg.uipack--wide [data-uipack="lane"] > text')) expect(Number(t.getAttribute("y")) % 8).toBe(0);
    }
  });
  it("serviceMap narrow wraps six cells into rows of three and truncates a long label with a hint", () => {
    const parts = serviceMapParts(
      {
        ...defaultServiceMap,
        platform: {
          title: "A platform whose title is far too long to fit inside a narrow node at all",
          cells: ["Auth", "Rate limit", "Routing", "Caching", "Encryption", "Audit"].map((label) => ({ label })),
        },
      },
      "t",
    );
    const { container } = render(<svg>{parts.narrow}</svg>);
    const labels = [...container.querySelectorAll('[data-uipack="node"] > text:first-of-type')].map((t) => t.textContent ?? "");
    expect(labels).toContain("Auth · Rate limit · Routing");
    expect(labels).toContain("Caching · Encryption · Audit");
    expect(labels.some((l) => l.includes(" · ") && l.split(" · ").length > 3)).toBe(false);
    const cut = labels.find((l) => l.endsWith("\u2026"))!;
    expect(cut).toBeDefined();
    expect(container.querySelector('[data-uipack="node"] > title')?.textContent).toMatch(/far too long/);
    // every narrow label fits the node's text width at the sizes the stack uses
    for (const l of labels) expect(l.length * 13 * 0.55).toBeLessThanOrEqual(328);
    const [, , , h] = parts.narrowViewBox.split(" ").map(Number);
    expect(h).toBeGreaterThan(300);
  });
});
