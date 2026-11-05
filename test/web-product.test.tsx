import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BeforeAfter,
  DataTable,
  DemoPlayer,
  FileTable,
  ItemList,
  ProductWindow,
  Proof,
  RecordCard,
  ScheduleGrid,
  WorkedExample,
  type DemoStep,
} from "../src/web";
import { pipelineParts } from "../src/presets";
import { PricingPlans } from "../src/web";
import { styleBootScript } from "../src/style";

describe("product surfaces", () => {
  it("DataTable: real rows, a marked row, bars to scale, a focusable named scroll region", () => {
    const { container } = render(
      <DataTable
        label="Friday forecast"
        columns={[
          { key: "hour", label: "Hour" },
          { key: "covers", label: "Covers", barMax: 90 },
          { key: "servers", label: "Servers", align: "end" },
        ]}
        rows={[
          { hour: "18:00", covers: 45, servers: 4 },
          { hour: "19:00", covers: 84, servers: 6 },
        ]}
        highlight={1}
        note="84 ÷ 14 = 6"
      />,
    );
    const region = screen.getByRole("region", { name: "Friday forecast" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Hour", "Covers", "Servers"]);
    expect(screen.getByRole("rowheader", { name: "19:00" }).closest("tr")).toHaveAttribute("data-highlight", "true");
    const bars = [...container.querySelectorAll<HTMLElement>(".uipack-web-table__bar")];
    expect(bars.map((b) => b.style.getPropertyValue("--v"))).toEqual(["0.5", String(84 / 90)]);
    expect(screen.getByText("84 ÷ 14 = 6")).toBeInTheDocument();
  });

  it("ScheduleGrid: empty cells are days off, marked cells carry their tone, the legend names them", () => {
    const { container } = render(
      <ScheduleGrid
        label="Rota"
        columns={["Thu", "Fri"]}
        rows={[{ name: "Ana", detail: "Server", cells: ["", { value: "16–23", tone: "peak" }] }]}
        legend={[{ tone: "peak", label: "Friday peak" }]}
      />,
    );
    const cells = [...container.querySelectorAll("td")];
    expect(cells.map((c) => [c.getAttribute("data-tone"), c.textContent])).toEqual([
      ["off", "Off"],
      ["peak", "16–23"],
    ]);
    expect(screen.getByRole("rowheader")).toHaveTextContent("AnaServer");
    expect(screen.getByText("Friday peak")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Rota" })).toBeInTheDocument();
  });

  it("ProductWindow, FileTable, RecordCard and ItemList name what they show", () => {
    render(
      <ProductWindow label="Rota window" title="Rota" status="Ready" address="app.example/rota" footer="84 covers">
        <ItemList label="Swaps" items={[{ title: "Tom ↔ Jess", meta: "Fri", status: "attention" }]} />
        <RecordCard title="Jess" eyebrow="Staff" fields={[{ label: "Hours", value: "32" }]} />
        <FileTable fileName="sales.csv" columns={[{ key: "d", label: "Day" }]} rows={[{ d: "Mon" }]} />
      </ProductWindow>,
    );
    expect(screen.getByRole("group", { name: "Rota window" })).toHaveTextContent("Ready");
    expect(within(screen.getByRole("list", { name: "Swaps" })).getByRole("img", { name: "Needs you" })).toBeInTheDocument();
    expect(screen.getByText("Hours").closest("div")).toHaveTextContent("Hours32");
    expect(screen.getByRole("region", { name: "sales.csv" })).toBeInTheDocument();
  });
});

describe("worked numbers", () => {
  it("WorkedExample shows the input, each rule with its arithmetic, and each result", () => {
    render(
      <WorkedExample
        title="Friday, 19:00"
        given={{ value: "84", label: "covers" }}
        lines={[
          { rule: "One server per 14", working: "84 ÷ 14 = 6", result: { value: "6", label: "servers" } },
          { rule: "One cook per 22", working: "84 ÷ 22 = 3.8", result: { value: "4", label: "cooks" } },
        ]}
      />,
    );
    const sheet = screen.getByRole("group", { name: "Friday, 19:00" });
    expect(within(sheet).getAllByRole("listitem")).toHaveLength(2);
    expect(sheet).toHaveTextContent("84 ÷ 22 = 3.8");
    expect(sheet).toHaveTextContent("4cooks");
  });

  it("BeforeAfter draws both bars to scale, and Proof takes it as compare", () => {
    const { container } = render(
      <Proof
        compare={{
          change: "9 minutes",
          before: { value: "~2.5 h", label: "estimate", measure: 150 },
          after: { value: "9 min", label: "median", measure: 9 },
        }}
      />,
    );
    const bars = [...container.querySelectorAll<HTMLElement>(".uipack-web-compare__bar")];
    expect(bars.map((b) => Number(b.style.getPropertyValue("--v")))).toEqual([1, 0.06]);
    expect(screen.getByText("9 minutes")).toBeInTheDocument();
    render(
      <BeforeAfter
        tags={["Then", "Now"]}
        before={{ value: "a", label: "x", measure: 0 }}
        after={{ value: "b", label: "y", measure: 0 }}
      />,
    );
    expect(screen.getByText("Now")).toBeInTheDocument();
  });
});

describe("DemoPlayer steps mode", () => {
  const steps: DemoStep[] = [
    {
      id: "a",
      label: "Read",
      title: "Read the sales",
      actions: [{ label: "Read", detail: "12 weeks" }],
      screen: <p>Sales table</p>,
    },
    { id: "b", label: "Draft", title: "Draft the rota", screen: <p>Rota grid</p> },
  ];
  it("rail=side: has no composer, lists the steps as progress, and never shows an empty result pane", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" autoplay={false} rail="side" />);
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-mode", "steps");
    expect(container.querySelector(".uipack-web-demo__composer")).toBeNull();
    const progress = screen.getByRole("list", { name: "Progress" });
    expect(progress.textContent).toContain("Read the sales");
    expect(progress.textContent).toContain("12 weeks");
    // At rest it shows its finished result, every step ticked off.
    const result = container.querySelector(".uipack-web-demo__result");
    expect(result).toHaveTextContent("Rota grid");
    expect([...progress.children].map((li) => li.getAttribute("data-state"))).toEqual(["done", "done"]);
    // Played from the start, the first screen fills the result pane before the first step settles.
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-step", "0");
    expect(result).toHaveTextContent("Sales table");
  });
  it("rail=compact (default): one row of step labels that are the step tabs, and no caption at rest", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" autoplay={false} />);
    const demo = container.querySelector(".uipack-web-demo")!;
    expect(demo).toHaveAttribute("data-rail", "compact");
    expect(container.querySelector(".uipack-web-demo__work")).toBeNull();
    const progress = screen.getByRole("list", { name: "Progress" });
    expect([...progress.children].map((li) => li.textContent)).toEqual(["01Read", "02Draft"]);
    // The rail is the tab row: no second "Demo steps" group of buttons.
    expect(screen.queryByRole("group", { name: "Demo steps" })).toBeNull();
    // At rest on the result, the "02 / 02 <title>" caption is visually hidden (it would read as a
    // frozen carousel); it narrates only while the demo runs.
    const caption = container.querySelector(".uipack-web-demo__caption")!;
    expect(caption).toHaveClass("uipack-web-demo__sr");
    fireEvent.click(within(progress).getByRole("button", { name: /01\s*Read/ }));
    expect(demo).toHaveAttribute("data-step", "0");
    expect(caption).not.toHaveClass("uipack-web-demo__sr");
    expect(within(progress).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
  });
  it("rail=none and static: no visible list, no controls, no caption", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" rail="none" static />);
    expect(screen.queryByRole("list", { name: "Progress" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector(".uipack-web-demo__caption")).toHaveClass("uipack-web-demo__sr");
    expect(container.querySelector(".uipack-web-demo__result")).toHaveTextContent("Rota grid");
  });
  it("keeps the agent composer when a step has a prompt", () => {
    const { container } = render(
      <DemoPlayer steps={[{ ...steps[0], prompt: "Draft next week" }, steps[1]]} label="Demo" autoplay={false} />,
    );
    expect(container.querySelector(".uipack-web-demo")).toHaveAttribute("data-mode", "agent");
    expect(container.querySelector(".uipack-web-demo__composer")).not.toBeNull();
  });
});

describe("pipeline preset", () => {
  const figure = { number: "Figure 1", title: "t", caption: "c", alt: "a" };
  it("widens its boxes to fit the longest label, and its legend can be replaced or hidden", () => {
    const short = pipelineParts({ figure, stages: [{ label: "A" }, { label: "B" }, { label: "C" }, { label: "D" }] }, "p1");
    const long = pipelineParts(
      {
        figure,
        stages: [{ label: "Staffing per hour", sub: "one server per 14 covers" }, { label: "B" }, { label: "C" }, { label: "D" }],
      },
      "p2",
    );
    const w = (vb: string) => Number(vb.split(" ")[2]);
    expect(w(long.viewBox)).toBeGreaterThan(w(short.viewBox));
    expect(short.legend).toEqual([]);
    expect(pipelineParts({ figure, stages: [{ label: "A" }], queue: { label: "Q", after: 0 } }, "p3").legend).toHaveLength(2);
    expect(
      pipelineParts({ figure, stages: [{ label: "A" }], queue: { label: "Q", after: 0 }, legend: false }, "p4").legend,
    ).toEqual([]);
    expect(
      pipelineParts({ figure, stages: [{ label: "A" }], legend: [{ label: "Covers", kind: "request" }] }, "p5").legend,
    ).toHaveLength(1);
  });
});

describe("narrow-safe product surfaces", () => {
  const cols = [
    { key: "order", label: "Order" },
    { key: "courier", label: "Courier" },
    { key: "charged", label: "Charged as", priority: "low" as const },
    { key: "price", label: "Label", align: "end" as const },
  ];
  it("DataTable marks low-priority columns (never the first) and fits by default", () => {
    const { container } = render(
      <DataTable
        label="Batch"
        columns={[{ ...cols[0], priority: "low" }, ...cols.slice(1)]}
        rows={[{ order: "#1", courier: "Evri", charged: "0.6 kg", price: "£2.79" }]}
      />,
    );
    expect(container.querySelector(".uipack-web-table")).toHaveAttribute("data-narrow", "fit");
    const low = [...container.querySelectorAll("[data-priority=low]")].map((c) => c.textContent);
    expect(low).toEqual(["Charged as", "0.6 kg"]);
  });
  it("DataTable stacks rows with a label per cell when more than four columns remain", () => {
    const wide = [...cols.map((c) => ({ ...c, priority: undefined })), { key: "promise", label: "Promise" }];
    const { container } = render(<DataTable label="Batch" columns={wide} rows={[{ order: "#1", promise: "2 days" }]} />);
    expect(container.querySelector(".uipack-web-table")).toHaveAttribute("data-narrow", "stack");
    // The label beside each value is presentational; the header row still names the columns.
    const labels = [...container.querySelectorAll(".uipack-web-table__label")];
    expect(labels.map((l) => l.textContent)).toEqual(["Courier", "Charged as", "Label", "Promise"]);
    for (const l of labels) expect(l).toHaveAttribute("aria-hidden", "true");
  });
  it("ProductWindow: source is a tag on the title row; a lone footer is a caption, not a ruled row", () => {
    const { container } = render(
      <ProductWindow
        label="Rates"
        title="Rates for 4.8 kg"
        status="Royal Mail wins"
        source="Sample rates"
        footer="Two-day promise"
      >
        <p>table</p>
      </ProductWindow>,
    );
    expect(container.querySelector(".uipack-web-window__source")).toHaveTextContent("Sample rates");
    expect(container.querySelector(".uipack-web-window__foot")).toBeNull();
    expect(container.querySelector(".uipack-web-window__caption")).toHaveTextContent("Two-day promise");
  });
  it("WorkedExample sets a unit small beside its value", () => {
    const { container } = render(
      <WorkedExample
        given={{ value: "3", unit: "kg", label: "actual" }}
        lines={[{ rule: "r", result: { value: "4.8", unit: "kg", label: "chargeable" } }]}
      />,
    );
    const values = [...container.querySelectorAll(".uipack-web-worked__value")];
    expect(values.map((v) => v.textContent)).toEqual(["3 kg", "4.8 kg"]);
    expect(values[1].querySelector("small")).toHaveTextContent("kg");
  });
  it("Proof sets a single stat as one compact line", () => {
    const { container } = render(<Proof stats={[{ value: "214", label: "beta shops" }]} />);
    expect(container.querySelector(".uipack-web-proof__stats")).toHaveAttribute("data-count", "1");
  });
  it("PricingPlans warns when every plan repeats one button label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const action = { label: "Start", href: "#" };
    render(
      <PricingPlans
        plans={[
          { name: "A", price: "£0", action },
          { name: "B", price: "£9", action, featured: true },
        ]}
      />,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("same button label"));
    warn.mockClear();
    render(
      <PricingPlans
        plans={[
          { name: "A", price: "£0", action },
          { name: "B", price: "£9", action: { label: "Try B", href: "#" } },
        ]}
      />,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("styleBootScript", () => {
  const run = (search: string, stored: Record<string, string> = {}, opts?: Parameters<typeof styleBootScript>[0]) => {
    const attrs: Record<string, string> = {};
    const store = { ...stored };
    const fake = {
      location: { search },
      localStorage: { getItem: (k: string) => store[k] ?? null, removeItem: (k: string) => delete store[k] },
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    };
    new Function("location", "localStorage", "document", styleBootScript(opts))(fake.location, fake.localStorage, fake.document);
    return { attrs, store };
  };
  it("accepts aliases and sets both theme attributes", () => {
    const { attrs } = run("?style=3&theme=dark", {}, { aliases: { "3": "landing" } });
    expect(attrs).toEqual({ "data-ui-style": "landing", "data-theme": "dark", "data-ui-theme": "dark" });
  });
  it("follows the system without a theme, remembers a stored one, and ?theme=system clears it", () => {
    expect(run("").attrs).toEqual({ "data-ui-style": "technical" });
    expect(run("", { "uipack-theme": "light" }).attrs["data-theme"]).toBe("light");
    const cleared = run("?theme=system", { "uipack-theme": "light" });
    expect(cleared.attrs["data-theme"]).toBeUndefined();
    expect(cleared.store["uipack-theme"]).toBeUndefined();
  });
  it("ignores unknown and prototype keys", () => {
    expect(run("?style=constructor").attrs["data-ui-style"]).toBe("technical");
  });
});
