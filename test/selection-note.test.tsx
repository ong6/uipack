import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip, Figure, Group, Node } from "../src";

const fig = (children: React.ReactNode) =>
  render(
    <Figure viewBox="0 0 400 200" alt="test figure" controls={false} expandable={false}>
      {children}
    </Figure>,
  );

describe("selection note", () => {
  it("selecting a node with a hint shows the hint beside it, and selecting again hides it", () => {
    const { container } = fig(<Node x={0} y={0} w={120} h={48} label="paper book" sub="paper only" hint="A simulated portfolio. No real money." />);
    const node = screen.getByRole("button", { name: "paper book, paper only" });
    fireEvent.click(node);
    expect(node).toHaveAttribute("aria-pressed", "true");
    const note = container.querySelector(".uipack__note");
    expect(note).toHaveTextContent("paper book");
    expect(note).toHaveTextContent("A simulated portfolio. No real money.");
    expect(screen.getByRole("status")).toHaveTextContent("paper book: A simulated portfolio. No real money.");
    fireEvent.click(node);
    expect(container.querySelector(".uipack__note")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("Escape and the empty canvas clear the note; there is no clear button", () => {
    const { container } = fig(<Node x={0} y={0} w={120} h={48} label="report" hint="The evidence report." />);
    const node = screen.getByRole("button", { name: "report" });
    fireEvent.click(node);
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();
    fireEvent.keyDown(node, { key: "Escape" });
    expect(container.querySelector(".uipack__note")).toBeNull();
    fireEvent.click(node);
    fireEvent.click(container.querySelector(".uipack__canvas")!);
    expect(container.querySelector(".uipack__note")).toBeNull();
  });

  it("a node with a flow but no hint pins its flow without a note", () => {
    const { container } = fig(<Node x={0} y={0} w={120} h={48} label="fill" flow="fill" />);
    fireEvent.click(screen.getByRole("button", { name: "fill" }));
    expect(container.querySelector('[data-selected="true"]')).not.toBeNull();
    expect(container.querySelector(".uipack__note")).toBeNull();
  });

  it("parts with nothing to show are not buttons", () => {
    fig(
      <>
        <Node x={0} y={0} w={120} h={48} label="plain" />
        <Group x={0} y={60} w={120} h={60} title="region" />
        <Chip x={0} y={140} w={40} label="slot" />
      </>,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("a hinted node inside a figure drops its native tooltip; a link keeps it", () => {
    const { container } = fig(
      <>
        <Node x={0} y={0} w={120} h={48} label="spec" hint="Frozen description." />
        <Node x={0} y={60} w={120} h={48} label="docs" href="#docs" hint="Opens the docs." />
      </>,
    );
    const titles = [...container.querySelectorAll("title")].map((t) => t.textContent);
    expect(titles).toEqual(["Opens the docs."]);
  });
});
