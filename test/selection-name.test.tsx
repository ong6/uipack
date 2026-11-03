import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { SelectionContext } from "../src/selection";
import { Chip } from "../src/Chip";
import { Node } from "../src/Node";
import { Group } from "../src/Group";

const selectable = { enabled: true, selected: null, select: () => {} };
const inSelectable = (children: ReactNode) => (
  <SelectionContext.Provider value={selectable}>
    <svg>{children}</svg>
  </SelectionContext.Provider>
);
const button = (c: HTMLElement) => c.querySelector('[role="button"]');

describe("selectable figure items are named", () => {
  it.each<[string, ReactNode, (container: HTMLElement) => void]>([
    [
      "an empty chip still has a name",
      inSelectable(<Chip x={0} y={0} w={40} label="" hint="A free connection slot" />),
      (c) => expect(button(c)?.getAttribute("aria-label")).toBe("Empty slot"),
    ],
    [
      "a node's name includes its visible subtitle",
      inSelectable(<Node x={0} y={0} w={160} h={56} label="Skillpack" sub="subtree" hint="The shared skills repo" />),
      (c) => expect(button(c)?.getAttribute("aria-label")).toBe("Skillpack, subtree"),
    ],
    [
      "a node's visible words stay apart, so its name contains them in order (label in name)",
      inSelectable(<Node x={0} y={0} w={160} h={56} label="Receive" sub="HTTP" flow="job" />),
      (c) => {
        expect(button(c)!.getAttribute("aria-label")).toBe("Receive, HTTP");
        // Checkers such as axe join text nodes without a separator; the space between the two <text>s keeps "ReceiveHTTP" from forming.
        expect(button(c)!.textContent?.replace(/\s+/g, " ").trim()).toBe("Receive HTTP");
      },
    ],
    [
      "a linked node's name carries its subtitle too",
      <svg key="linked">
        <Node x={0} y={0} w={160} h={56} label="Docs" sub="guide" href="/docs" />
      </svg>,
      (c) => expect(c.querySelector("a")?.getAttribute("aria-label")).toBe("Docs, guide"),
    ],
    [
      "an unlabelled node is decorative, never a nameless button",
      inSelectable(<Node x={0} y={0} w={160} h={56} label="" flow="job" />),
      (c) => expect(button(c)).toBeNull(),
    ],
    [
      "a selectable group's button is its frame, so it never contains the nodes inside it",
      inSelectable(
        <Group x={0} y={0} w={400} h={200} title="Cluster" hint="Runs the jobs">
          <Node x={20} y={40} w={160} h={56} label="Worker" hint="Does one job" />
        </Group>,
      ),
      (c) => {
        const buttons = [...c.querySelectorAll('[role="button"]')];
        expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Cluster", "Worker"]);
        expect(buttons[0].querySelector('[role="button"]')).toBeNull();
        expect(buttons[0].textContent).toBe("Cluster");
      },
    ],
  ])("%s", (_name, ui, check) => {
    const { container } = render(<>{ui}</>);
    check(container);
  });
});
