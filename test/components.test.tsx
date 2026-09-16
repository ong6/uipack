import { fireEvent, render, screen } from "@testing-library/react";
import { Chip, Connector, Defs, Figure, Group, Lane, Legend, Node, Packet, useFigureMotion } from "../src";

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
        <Connector points={[[0, 0], [50, 0], [50, 50]]} defs="t" kind="request" arrow="both" />
      </>,
    );
    const p = container.querySelector('[data-uipack="connector"]')!;
    expect(p.getAttribute("d")).toMatch(/^M0,0 L44,0 Q50,0 50,6 L50,50$/);
    expect(p.getAttribute("marker-end")).toBe("url(#t-head-request)");
    expect(p.getAttribute("marker-start")).toBe("url(#t-head-request)");
    expect(container.querySelector("#t-head-request")).not.toBeNull();
  });
  it("Packet animates with animateMotion on the same path", () => {
    const { container } = wrap(<Packet points={[[0, 0], [50, 0], [50, 50]]} kind="change" dur={2} />);
    const am = container.querySelector("animateMotion");
    expect(am).not.toBeNull();
    expect(am!.getAttribute("dur")).toBe("2s");
    expect(am!.getAttribute("path")).toMatch(/^M0,0/);
  });
  it("Packet reverses the path for a response", () => {
    const { container } = wrap(<Packet points={[[0, 0], [50, 0]]} kind="response" reverse />);
    expect(container.querySelector("animateMotion")!.getAttribute("path")).toBe("M50,0 L0,0");
  });
  it("Packet renders a static token at `at` under reduced motion", () => {
    globalThis.__reduced = true;
    const { container } = wrap(<Packet points={[[0, 0], [100, 0]]} kind="request" at={0.25} />);
    expect(container.querySelector("animateMotion")).toBeNull();
    const rect = container.querySelector('[data-static="true"] rect')!;
    expect(Number(rect.getAttribute("x"))).toBe(20); // 25 - r(5)
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
