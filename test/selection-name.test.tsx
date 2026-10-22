import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectionContext } from "../src/selection";
import { Chip } from "../src/Chip";
import { Node } from "../src/Node";
import { Group } from "../src/Group";

const selectable = { enabled: true, selected: null, select: () => {} };

describe("selectable figure items are named", () => {
  it("an empty chip still has a name", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Chip x={0} y={0} w={40} label="" hint="A free connection slot" /></svg></SelectionContext.Provider>);
    expect(container.querySelector('[role="button"]')?.getAttribute("aria-label")).toBe("Empty slot");
  });
  it("a node's name includes its visible subtitle", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Node x={0} y={0} w={160} h={56} label="Skillpack" sub="subtree" hint="The shared skills repo" /></svg></SelectionContext.Provider>);
    expect(container.querySelector('[role="button"]')?.getAttribute("aria-label")).toBe("Skillpack, subtree");
  });
  it("a node's visible words stay apart, so its name contains them in order (label in name)", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Node x={0} y={0} w={160} h={56} label="Receive" sub="HTTP" flow="job" /></svg></SelectionContext.Provider>);
    const button = container.querySelector('[role="button"]')!;
    expect(button.getAttribute("aria-label")).toBe("Receive, HTTP");
    // Checkers such as axe join text nodes without a separator; the space between the two <text>s keeps "ReceiveHTTP" from forming.
    expect(button.textContent?.replace(/\s+/g, " ").trim()).toBe("Receive HTTP");
  });
  it("a linked node's name carries its subtitle too", () => {
    const { container } = render(<svg><Node x={0} y={0} w={160} h={56} label="Docs" sub="guide" href="/docs" /></svg>);
    expect(container.querySelector("a")?.getAttribute("aria-label")).toBe("Docs, guide");
  });
  it("an unlabelled node is decorative, never a nameless button", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Node x={0} y={0} w={160} h={56} label="" flow="job" /></svg></SelectionContext.Provider>);
    expect(container.querySelector('[role="button"]')).toBeNull();
  });
  it("a selectable group's button is its frame, so it never contains the nodes inside it", () => {
    const { container } = render(
      <SelectionContext.Provider value={selectable}>
        <svg>
          <Group x={0} y={0} w={400} h={200} title="Cluster" hint="Runs the jobs">
            <Node x={20} y={40} w={160} h={56} label="Worker" hint="Does one job" />
          </Group>
        </svg>
      </SelectionContext.Provider>,
    );
    const buttons = [...container.querySelectorAll('[role="button"]')];
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Cluster", "Worker"]);
    expect(buttons[0].querySelector('[role="button"]')).toBeNull();
    expect(buttons[0].textContent).toBe("Cluster");
  });
});
