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
  it("has no composer, lists the steps as progress, and never shows an empty result pane", () => {
    const { container } = render(<DemoPlayer steps={steps} label="Demo" autoplay={false} />);
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
