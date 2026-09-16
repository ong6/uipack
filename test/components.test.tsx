import { fireEvent, render, screen } from "@testing-library/react";
import { Bus, Chip, Connector, Defs, Figure, Group, Lane, Legend, Node, Packet, busStubs, useFigureMotion } from "../src";

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof Figure>> = {}) =>
  render(
    <Figure viewBox="0 0 100 100" alt="test figure" {...props}>
      {ui}
    </Figure>,
  );

describe("Figure", () => {
  it("renders eyebrow, title, caption and legend", () => {
    wrap(<Node x={0} y={0} w={10} h={10} label="n" />, {
      number: "Figure 01",
      eyebrow: "What is it",
      title: "Title",
      caption: "Caption",
      legend: [{ label: "Request", kind: "request" }],
    });
    expect(screen.getByText(/Figure 01/)).toHaveTextContent("Figure 01 · What is it");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title");
    expect(screen.getByText("Caption")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Request");
    expect(screen.getByRole("img", { name: "test figure" })).toBeInTheDocument();
  });
  it("Pause toggles aria-pressed and the label", () => {
    wrap(<Node x={0} y={0} w={10} h={10} label="n" />, { title: "t" });
    const btn = screen.getByRole("button", { name: /pause/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /^\s*play\s*$/i })).toHaveAttribute("aria-pressed", "true");
  });
  it("hides controls when controls=false", () => {
    wrap(<Node x={0} y={0} w={10} h={10} label="n" />, { title: "t", controls: false });
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("hides controls and stops motion under prefers-reduced-motion", () => {
    globalThis.__reduced = true;
    const Probe = () => {
      const m = useFigureMotion();
      return <text data-testid="probe">{`${m.playing}/${m.reduced}`}</text>;
    };
    wrap(<Probe />, { title: "t" });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("probe")).toHaveTextContent("false/true");
    globalThis.__reduced = false;
  });
  it("renders a narrow drawing when given", () => {
    const { container } = wrap(<Node x={0} y={0} w={10} h={10} label="wide" />, {
      narrow: <Node x={0} y={0} w={10} h={10} label="narrow" />,
      narrowViewBox: "0 0 50 50",
    });
    expect(container.querySelector("svg.uipack--narrow")).toHaveAttribute("viewBox", "0 0 50 50");
    expect(container.querySelector("figure")).toHaveClass("uipack--has-narrow");
  });
});

describe("parts", () => {
  it("Node renders label, sub and an icon", () => {
    const { container } = wrap(<Node x={0} y={0} w={100} h={40} label="ChatGPT" sub="client" icon="client" />);
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("client")).toHaveAttribute("font-family", "var(--uipack-mono)");
    expect(container.querySelector('[data-uipack="node"] g')).not.toBeNull();
  });
  it("Group solid centres its title; dashed uppercases it", () => {
    wrap(
      <>
        <Group x={0} y={0} w={100} h={50} title="Habitat" />
        <Group x={0} y={60} w={100} h={30} title="tenant" variant="dashed" />
      </>,
    );
    expect(screen.getByText("Habitat")).toHaveAttribute("text-anchor", "middle");
    expect(screen.getByText("TENANT")).toBeInTheDocument();
  });
  it("Lane and Chip uppercase their text", () => {
    wrap(
      <>
        <Lane x={0} w={100} y={10} title="clients" />
        <Chip x={0} y={20} w={40} label="a1" />
      </>,
    );
    expect(screen.getByText("CLIENTS")).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
  });
  it("Connector builds an orthogonal path with arrowhead markers by kind", () => {
    const { container } = wrap(
      <>
        <Defs id="t" />
        <Connector points={[[0, 0], [50, 0], [50, 50]]} defs="t" kind="request" />
      </>,
    );
    const p = container.querySelector('[data-uipack="connector"]')!;
    // inset 2 at the start, 2 + 2 at the arrow end, so the head clears the border
    expect(p.getAttribute("d")).toMatch(/^M2,0 L44,0 Q50,0 50,6 L50,46$/);
    expect(p.getAttribute("marker-end")).toBe("url(#t-head-request)");
    expect(p.getAttribute("marker-start")).toBeNull();
    expect(container.querySelector("#t-head-request")).not.toBeNull();
  });
  it("Packet animates with animateMotion on the same path", () => {
    const { container } = wrap(<Packet points={[[0, 0], [50, 0], [50, 50]]} kind="change" dur={2} />);
    const am = container.querySelector("animateMotion");
    expect(am).not.toBeNull();
    expect(am!.getAttribute("dur")).toBe("2s");
    expect(am!.getAttribute("path")).toMatch(/^M2,0/); // trimmed 2 at the start, 12 at the end
  });
  it("Packet reverses the path for a response", () => {
    const { container } = wrap(<Packet points={[[0, 0], [50, 0]]} kind="response" reverse />);
    expect(container.querySelector("animateMotion")!.getAttribute("path")).toBe("M48,0 L12,0");
  });
  it("Packet renders a static token at `at` under reduced motion", () => {
    globalThis.__reduced = true;
    const { container } = wrap(<Packet points={[[0, 0], [100, 0]]} kind="request" at={0.25} />);
    expect(container.querySelector("animateMotion")).toBeNull();
    const rect = container.querySelector('[data-static="true"] rect')!;
    // trimmed path runs 2..88, so 0.25 of the way is 23.5; minus r(5)
    expect(Number(rect.getAttribute("x"))).toBeCloseTo(18.5);
    globalThis.__reduced = false;
  });
  it("Legend draws one shape per item and skips when empty", () => {
    const { container, rerender } = render(<Legend items={[{ label: "A", kind: "request" }, { label: "B", kind: "change" }]} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("li:nth-child(1) rect")).not.toBeNull();
    expect(container.querySelector("li:nth-child(2) path")).not.toBeNull();
    rerender(<Legend items={[]} />);
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("Figure headingLevel", () => {
  it("renders the title at the requested heading level", () => {
    const { container } = render(
      <Figure title="Outline" headingLevel={2} viewBox="0 0 10 10" alt="outline">
        <g />
      </Figure>
    );
    expect(container.querySelector("h2.uipack__title")).not.toBeNull();
    expect(container.querySelector("h3.uipack__title")).toBeNull();
  });
});

describe("hover", () => {
  const scene = () =>
    wrap(
      <>
        <Defs id="h" />
        <Node x={0} y={0} w={20} h={10} label="A" flow="alpha" id="na" />
        <Node x={0} y={20} w={20} h={10} label="B" flow="beta" id="nb" />
        <Node x={0} y={40} w={20} h={10} label="C" id="nc" />
        <Connector points={[[20, 5], [60, 5]]} defs="h" kind="request" flow="alpha" id="ca" />
        <Connector points={[[20, 25], [60, 25]]} defs="h" kind="change" flow="beta" id="cb" />
      </>,
      { legend: [{ label: "Request", kind: "request" }, { label: "Change", kind: "change" }] },
    );
  it("hovering a node with a flow marks the figure, hits its flow and dims the rest", () => {
    const { container } = scene();
    const figure = container.querySelector("figure")!;
    fireEvent.pointerEnter(container.querySelector("#na")!);
    expect(figure).toHaveAttribute("data-hover-flow", "alpha");
    expect(container.querySelector("#na")).toHaveAttribute("data-state", "hit");
    expect(container.querySelector("#ca")).toHaveAttribute("data-state", "hit");
    expect(container.querySelector("#nb")).toHaveAttribute("data-state", "dim");
    expect(container.querySelector("#cb")).toHaveAttribute("data-state", "dim");
    expect(container.querySelector("#nc")).toHaveAttribute("data-state", "dim"); // no flow: part of "the rest"
    fireEvent.pointerLeave(container.querySelector("#na")!);
    expect(figure).not.toHaveAttribute("data-hover-flow");
    expect(container.querySelector("#nb")).not.toHaveAttribute("data-state");
  });
  it("hovering a legend item highlights that kind only", () => {
    const { container } = scene();
    fireEvent.pointerEnter(screen.getByText("Change").closest("li")!);
    expect(container.querySelector("figure")).toHaveAttribute("data-hover-kind", "change");
    expect(container.querySelector("#cb")).toHaveAttribute("data-state", "hit");
    expect(container.querySelector("#ca")).toHaveAttribute("data-state", "dim");
    expect(container.querySelector("#na")).not.toHaveAttribute("data-state"); // nodes have no kind
    fireEvent.pointerLeave(screen.getByText("Change").closest("li")!);
    expect(container.querySelector("#ca")).not.toHaveAttribute("data-state");
  });
  it("a node with href renders as a link with a title hint", () => {
    const { container } = wrap(<Node x={0} y={0} w={20} h={10} label="Docs" href="/docs" hint="Open the docs" />);
    const a = container.querySelector("a.uipack__link")!;
    expect(a).toHaveAttribute("href", "/docs");
    expect(a.querySelector("title")).toHaveTextContent("Open the docs");
  });
  it("a flow can be a list", () => {
    const { container } = wrap(<Node x={0} y={0} w={20} h={10} label="X" flow={["a", "b"]} id="nx" />);
    expect(container.querySelector("#nx")).toHaveAttribute("data-flow", "a b");
  });
});

describe("Bus", () => {
  const props = { axis: "v" as const, at: 232, from: 120, to: 344, stubs: [{ at: 120, to: 200 }, { at: 176, to: 200 }, { at: 232, to: 200 }, { at: 200, to: 328, arrow: true }] };
  it("draws a trunk, one stub per entry, a junction dot per stub, and a head only where asked", () => {
    const { container } = wrap(
      <>
        <Defs id="b" />
        <Bus {...props} defs="b" />
      </>,
    );
    const conns = container.querySelectorAll('[data-uipack="bus"] [data-uipack="connector"]');
    expect(conns).toHaveLength(5);
    expect(container.querySelectorAll('[data-uipack="junction"]')).toHaveLength(4);
    const heads = [...conns].filter((c) => c.getAttribute("marker-end"));
    expect(heads).toHaveLength(1);
    expect(heads[0].getAttribute("d")).toMatch(/L324,200$/); // 328 minus inset 2 minus head 2
  });
  it("busStubs gives packets the same points, junction first", () => {
    expect(busStubs(props)).toEqual([
      [[232, 120], [200, 120]],
      [[232, 176], [200, 176]],
      [[232, 232], [200, 232]],
      [[232, 200], [328, 200]],
    ]);
  });
  it("junctions sit on the 8px grid", () => {
    const { container } = wrap(<Bus {...props} />);
    for (const c of container.querySelectorAll('[data-uipack="junction"]')) {
      expect(Number(c.getAttribute("cx")) % 8).toBe(0);
      expect(Number(c.getAttribute("cy")) % 8).toBe(0);
    }
  });
});

describe("touch", () => {
  it("a touch pointer never sets the hover flow", () => {
    const { container } = render(
      <Figure viewBox="0 0 100 100" alt="touch">
        <Node x={0} y={0} w={10} h={10} label="n" flow="alpha" id="touch-node" />
      </Figure>,
    );
    fireEvent.pointerEnter(container.querySelector("#touch-node")!, { pointerType: "touch" });
    expect(container.querySelector("figure")).not.toHaveAttribute("data-hover-flow");
    fireEvent.pointerEnter(container.querySelector("#touch-node")!, { pointerType: "mouse" });
    expect(container.querySelector("figure")).toHaveAttribute("data-hover-flow", "alpha");
  });
});
