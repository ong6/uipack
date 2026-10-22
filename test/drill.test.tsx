import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import {
  Defs,
  DrillFigure,
  DrillNode,
  Node,
  drillBox,
  drillFocusTarget,
  drillMove,
  drillReducer,
  normalizeDrillPath,
  type DrillLevel,
} from "../src";
import { easeInOutCubic, innerClipStart, scaleAbout, zoomFrame, zoomSamples } from "../src/zoom-math";
import { renderStatic } from "../src/static";

const W = 1120;
const H = 480;

describe("zoom-math", () => {
  const target = { x: 696, y: 184, w: 176, h: 64 };

  it("is one scale about F that lands the target centred and as large as the surface allows", () => {
    const f = zoomFrame(target, W, H)!;
    expect(f.Z).toBeCloseTo(Math.min(W / target.w, H / target.h), 6);
    const c = scaleAbout(target.x + target.w / 2, target.y + target.h / 2, f.Z, f.fx, f.fy);
    expect(c.x).toBeCloseTo(W / 2, 6);
    expect(c.y).toBeCloseTo(H / 2, 6);
    // The limiting dimension fills the surface exactly.
    expect(target.w * f.Z).toBeCloseTo(W, 6);
  });

  it("opens the inner layer from a clip that sits exactly on the target at the first frame", () => {
    const f = zoomFrame(target, W, H)!;
    const clip = innerClipStart(target, f, W, H);
    // Inner layer at p = 0 is scaled 1/Z about F: its clip box maps back onto the target.
    const tl = scaleAbout(clip.left, clip.top, 1 / f.Z, f.fx, f.fy);
    const br = scaleAbout(W - clip.right, H - clip.bottom, 1 / f.Z, f.fx, f.fy);
    expect(tl.x).toBeCloseTo(target.x, 6);
    expect(tl.y).toBeCloseTo(target.y, 6);
    expect(br.x).toBeCloseTo(target.x + target.w, 6);
    expect(br.y).toBeCloseTo(target.y + target.h, 6);
  });

  it("samples ease in log space, keep the corner radius on screen, and reverse exactly", () => {
    const fwd = zoomSamples(target, true, W, H, { samples: 16, radius: 6 })!;
    const back = zoomSamples(target, false, W, H, { samples: 16, radius: 6 })!;
    const f = zoomFrame(target, W, H)!;
    expect(fwd[0].outer).toBe("scale(1.00000)");
    expect(fwd[16].inner).toBe("scale(1.00000)");
    expect(fwd[0].inner).toBe(`scale(${(1 / f.Z).toFixed(5)})`);
    expect(fwd[0].innerOpacity).toBe(0);
    expect(fwd[16].clip).toBe("inset(0.00px 0.00px 0.00px 0.00px round 0.00px)");
    // 6px on screen at the first frame: 6·Z in the inner layer's own units, then scaled by 1/Z.
    expect(fwd[0].clip).toContain(`round ${(6 * f.Z).toFixed(2)}px`);
    fwd.forEach((s, i) => {
      expect(back[16 - i].outer).toBe(s.outer);
      expect(back[16 - i].clip).toBe(s.clip);
    });
    // Halfway in time is halfway in log scale.
    expect(Math.log(parseFloat(fwd[8].outer.slice(6))) / Math.log(f.Z)).toBeCloseTo(easeInOutCubic(0.5), 4);
  });

  it("declines a target that already fills the surface", () => {
    expect(zoomFrame({ x: 0, y: 0, w: W, h: H }, W, H)).toBeNull();
    expect(zoomSamples({ x: 0, y: 0, w: 1100, h: 470 }, true, W, H)).toBeNull();
  });
});

describe("path stack", () => {
  const ids = ["a", "b", "c", "d"];
  it("opens known children once, goes up, jumps to a depth and normalises a set path", () => {
    expect(drillReducer(["a"], { type: "open", id: "b" }, ids)).toEqual(["a", "b"]);
    const p = ["a", "b"];
    expect(drillReducer(p, { type: "open", id: "zzz" }, ids)).toBe(p);
    expect(drillReducer(p, { type: "open", id: "a" }, ids)).toBe(p);
    expect(drillReducer(["a", "b", "c"], { type: "up" }, ids)).toEqual(["a", "b"]);
    const root = ["a"];
    expect(drillReducer(root, { type: "up" }, ids)).toBe(root);
    expect(drillReducer(["a", "b", "c"], { type: "to", depth: 0 }, ids)).toEqual(["a"]);
    expect(drillReducer(["a", "b", "c"], { type: "set", path: ["a", "c", "nope", "d"] }, ids)).toEqual(["a", "c"]);
    expect(normalizeDrillPath(["b", "c"], ids, "a")).toEqual(["a", "b", "c"]);
    expect(normalizeDrillPath(["a", "b", "b"], ids, "a")).toEqual(["a", "b"]);
    expect(normalizeDrillPath(undefined, ids, "a")).toEqual(["a"]);
  });

  it("names the move and picks where focus lands", () => {
    expect(drillMove(["a"], ["a", "b"])).toBe("in");
    expect(drillMove(["a", "b"], ["a"])).toBe("out");
    expect(drillMove(["a", "b", "c"], ["a"])).toBe("jump");
    expect(drillMove(["a", "b"], ["a", "c"])).toBe("jump");
    expect(drillFocusTarget(["a"], ["a", "b"])).toEqual({ kind: "heading" });
    expect(drillFocusTarget(["a", "b"], ["a"])).toEqual({ kind: "node", drill: "b" });
    // Up two levels: the node in the root that leads back toward where you were.
    expect(drillFocusTarget(["a", "b", "c"], ["a"])).toEqual({ kind: "node", drill: "b" });
    expect(drillFocusTarget(["a", "b"], ["a", "c"])).toEqual({ kind: "heading" });
  });

  it("grows a drillable box one step about its centre", () => {
    expect(drillBox({ x: 10, y: 100, w: 176, h: 56 })).toEqual({ x: 10, y: 96, w: 176, h: 64 });
  });
});

const levels: DrillLevel[] = [
  {
    id: "top",
    label: "Overview",
    title: "Overview title",
    alt: "Top level",
    render: (ctx) => (
      <>
        <Defs id={ctx.id} />
        <Node x={40} y={200} w={176} h={56} label="Plain" hint="Not drillable" />
        <DrillNode x={400} y={200} w={176} h={56} drill="mid" sub="inside" />
      </>
    ),
  },
  {
    id: "mid",
    label: "Middle",
    alt: "Middle level",
    render: (ctx) => (
      <>
        <Defs id={ctx.id} />
        <Node x={40} y={200} w={176} h={56} label="One" />
        <Node x={300} y={200} w={176} h={56} label="Two" />
        <DrillNode x={600} y={200} w={176} h={56} drill="leaf" />
      </>
    ),
  },
  {
    id: "leaf",
    label: "Leaf",
    alt: "Leaf level",
    render: (ctx) => (
      <>
        <Defs id={ctx.id} />
        <Node x={40} y={200} w={176} h={56} label="End" />
      </>
    ),
  },
];

const fig = (props: Partial<React.ComponentProps<typeof DrillFigure>> = {}) => (
  <DrillFigure levels={levels} viewBox={`0 0 ${W} ${H}`} eyebrow="Drill" controls={false} {...props} />
);

describe("DrillFigure", () => {
  it("renders the root with a drillable button named by what is inside", () => {
    render(fig());
    expect(screen.getByRole("heading", { name: "Overview title" })).toBeInTheDocument();
    // Visible label and sub first (label in name), then the count from the child drawing: One, Two and the Leaf node.
    const node = screen.getByRole("button", { name: "Middle, inside, open: 3 parts inside" });
    expect(node).toHaveAttribute("data-drill", "mid");
    expect(node.querySelector(".uipack-drill-node__ghost")).not.toBeNull();
    expect(node.querySelector(".uipack-drill-node__ghost")!.closest('[aria-hidden="true"]')).not.toBeNull();
    // Non-drillable nodes are unchanged: a selection button only because of their hint.
    expect(screen.getByRole("button", { name: "Plain" })).not.toHaveAttribute("data-drill");
  });

  it("drills down and back with click and keyboard, moving focus and announcing the level", () => {
    const changes: string[][] = [];
    render(fig({ onPathChange: (p) => changes.push(p) }));
    fireEvent.click(screen.getByRole("button", { name: /^Middle, inside, open/ }));
    const heading = screen.getByRole("heading", { name: "Middle" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("navigation", { name: "Figure levels" })).toHaveTextContent("Overview›Middle");
    expect(document.querySelector("[data-drill-announce]")).toHaveTextContent("Opened Middle. Overview › Middle");
    fireEvent.keyDown(screen.getByRole("button", { name: /^Leaf, open/ }), { key: "Enter" });
    expect(screen.getByRole("heading", { name: "Leaf" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("heading", { name: "Leaf" }), { key: "Escape" });
    expect(screen.getByRole("heading", { name: "Middle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Leaf, open/ })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Back to Overview" }));
    expect(screen.getByRole("button", { name: /^Middle, inside, open/ })).toHaveFocus();
    expect(document.querySelector("[data-drill-announce]")).toHaveTextContent("Back to Overview");
    expect(changes).toEqual([["top", "mid"], ["top", "mid", "leaf"], ["top", "mid"], ["top"]]);
  });

  it("Escape clears a selection before it goes up, and Backspace goes up", () => {
    render(fig({ defaultPath: ["top", "mid"] }));
    fireEvent.keyDown(screen.getByRole("heading", { name: "Middle" }), { key: "Backspace" });
    expect(screen.getByRole("heading", { name: "Overview title" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Plain" }));
    expect(screen.getByRole("button", { name: "Plain" })).toHaveAttribute("aria-pressed", "true");
  });

  it("follows a controlled path, and a breadcrumb jumps up", () => {
    function Host() {
      const [path, setPath] = useState<string[]>(["top", "mid", "leaf"]);
      return fig({ path, onPathChange: setPath });
    }
    render(<Host />);
    expect(screen.getByRole("heading", { name: "Leaf" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByRole("heading", { name: "Overview title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Middle, inside, open/ })).toHaveFocus();
  });

  it("keeps every SVG id unique while both levels are mounted mid-flight", () => {
    const proto = Element.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    const pending = () => ({ reverse() {}, cancel() {}, finish() {}, pause() {}, finished: new Promise(() => {}) });
    proto.animate = pending;
    try {
      render(
        <>
          {fig({ id: "one" })}
          {fig({ id: "two" })}
        </>,
      );
      act(() => {
        fireEvent.click(screen.getAllByRole("button", { name: /^Middle, inside, open/ })[0]);
      });
      const fig1 = document.getElementById("one")!;
      expect(fig1.querySelectorAll(".uipack-drill__layer")).toHaveLength(2);
      expect(fig1.querySelector(".uipack-drill__stage")).toHaveAttribute("data-flight", "in");
      const ids = Array.from(document.querySelectorAll("[id]"), (el) => el.id);
      expect(ids.length).toBeGreaterThan(20);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      if (original) proto.animate = original;
      else delete proto.animate;
    }
  });

  it("exports the current level statically with the affordance drawn and no buttons", () => {
    const svg = renderStatic(fig({ defaultPath: ["top", "mid"] }), { theme: "dark" });
    expect(svg).toContain("Overview › Middle".toUpperCase());
    expect(svg).toContain('data-drill="leaf"');
    expect(svg).toContain("uipack-drill-node__halo");
    expect(svg).toContain("uipack-drill-node__ghost");
    expect(svg).not.toContain('role="button"');
    expect(svg).not.toContain("var(--");
    const ids = Array.from(svg.matchAll(/ id="([^"]+)"/g), (m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
