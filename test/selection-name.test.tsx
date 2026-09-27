import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectionContext } from "../src/selection";
import { Chip } from "../src/Chip";
import { Node } from "../src/Node";

const selectable = { enabled: true, selected: null, select: () => {} };

describe("selectable figure items are named", () => {
  it("an empty chip still has a name", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Chip x={0} y={0} w={40} label="" /></svg></SelectionContext.Provider>);
    expect(container.querySelector('[role="button"]')?.getAttribute("aria-label")).toBe("Empty slot");
  });
  it("a node's name includes its visible subtitle", () => {
    const { container } = render(<SelectionContext.Provider value={selectable}><svg><Node x={0} y={0} w={160} h={56} label="Skillpack" sub="subtree" /></svg></SelectionContext.Provider>);
    expect(container.querySelector('[role="button"]')?.getAttribute("aria-label")).toBe("Skillpack, subtree");
  });
});
