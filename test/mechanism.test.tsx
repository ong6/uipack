import { readFileSync, readdirSync } from "node:fs";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { CYCLE_LENGTH, LIMIT, MechanismFrame, PASS_CHECK, RETURN_CHECK, VerificationGate, checkAt, sceneAt, stillScene, tallyOf, tallyText, tokenAt, verdictOf, verdictText, RUN_LONG, PERIOD, type GatePose } from "../src/mechanism";
import { idleScene, liftAt, armAt, IDLE_START } from "../src/mechanism/gate/motion";
import { BT, GX, LIFTED } from "../src/mechanism/gate/view";

const POSES: GatePose[] = ["idle", "pass", "return", "apart"];

describe("gate model", () => {
  it("checks a value against the limit, inclusive", () => {
    expect(LIMIT).toBe(6);
    expect(verdictOf(6)).toBe("pass");
    expect(verdictOf(6.01)).toBe("return");
    expect(verdictOf(3.8)).toBe("pass");
  });

  it("runs a deterministic twelve-check cycle: 9 passed, 3 returned", () => {
    expect(CYCLE_LENGTH).toBe(12);
    expect(tallyText(tallyOf(12))).toBe("checked 12 · passed 9 · returned 3");
    expect(tallyOf(24)).toEqual({ checked: 24, passed: 18, returned: 6 });
    expect(checkAt(5)).toEqual(checkAt(5));
    expect(checkAt(12).value).toBe(checkAt(0).value);
  });

  it("returns a proposal and later passes its revision under the same id", () => {
    const returned = Array.from({ length: CYCLE_LENGTH }, (_, index) => checkAt(index)).filter((check) => check.verdict === "return");
    expect(returned).toHaveLength(3);
    for (const check of returned) {
      const revision = Array.from({ length: CYCLE_LENGTH }, (_, index) => checkAt(index)).find((other) => other.proposal === check.proposal && other.attempt === 2);
      expect(revision?.verdict).toBe("pass");
      expect(revision!.index).toBeGreaterThan(check.index);
    }
  });

  it("words the verdicts", () => {
    expect(verdictText(PASS_CHECK)).toBe("reads 4.2 ≤ 6.0 · passed");
    expect(verdictText(RETURN_CHECK)).toBe("reads 6.6 > 6.0 · returned");
  });
});

describe("motion scripts", () => {
  const largestJump = (sample: (u: number) => [number, number, number], until: number) => {
    let worst = 0;
    let last = sample(0);
    for (let u = 0.01; u <= until; u += 0.01) {
      const next = sample(u);
      worst = Math.max(worst, Math.hypot(next[0] - last[0], next[1] - last[1], next[2] - last[2]));
      last = next;
    }
    return worst;
  };

  it("moves a token continuously along both routes", () => {
    for (const check of [PASS_CHECK, RETURN_CHECK]) {
      const long = RUN_LONG[check.verdict];
      expect(largestJump((u) => tokenAt(u, check, 0).pos, long + 0.5)).toBeLessThan(1.5);
      expect(tokenAt(long + 0.1, check, 0).done).toBe(true);
    }
    expect(tokenAt(RUN_LONG.pass + 0.1, PASS_CHECK, 0).layer).toBe("tray");
    const back = tokenAt(RUN_LONG.return + 0.1, RETURN_CHECK, 0);
    expect(back.layer).toBe("chute");
    expect(back.pos[0]).toBeLessThan(-90);
  });

  it("rests the plunger on the belt, stops each token under the gauge, and diverts only returns", () => {
    expect(liftAt(0)).toBe(LIFTED);
    const under = tokenAt(2, PASS_CHECK, 0);
    expect(under.pos[0]).toBe(GX);
    expect(under.pos[2]).toBe(BT);
    expect(liftAt(2)).toBe(0);
    for (let u = 0; u < RUN_LONG.pass; u += 0.05) expect(armAt(u, PASS_CHECK)).toBe(0);
    expect(Math.max(...Array.from({ length: 200 }, (_, index) => armAt(index * 0.05, RETURN_CHECK)))).toBe(1);
  });

  it("keeps idle tokens continuous over time and the tally monotonic", () => {
    const seen = new Map<string, [number, number, number]>();
    let checked = 0;
    for (let t = 0; t < PERIOD * 14; t += 0.02) {
      const scene = idleScene(IDLE_START + t);
      const now = Number(/checked (\d+)/.exec(scene.readout)![1]);
      expect(now).toBeGreaterThanOrEqual(checked);
      checked = now;
      const keys = scene.tokens.map((token) => token.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(scene.tokens.length).toBeLessThanOrEqual(8);
      for (const token of scene.tokens) {
        const last = seen.get(token.key);
        if (last) expect(Math.hypot(token.pos[0] - last[0], token.pos[1] - last[1], token.pos[2] - last[2])).toBeLessThan(4); // under 200 units/s: the end of a drop is the fastest move; a jump would be tens of units
        seen.set(token.key, token.pos);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(16);
  });

  it("has one still scene per pose with a true readout", () => {
    expect(stillScene("idle").readout).toMatch(/^checked \d+ · passed \d+ · returned \d+$/);
    expect(stillScene("pass").readout).toBe(verdictText(PASS_CHECK));
    expect(stillScene("return").readout).toBe(verdictText(RETURN_CHECK));
    expect(stillScene("apart").apart).toBe(true);
    expect(sceneAt("pass", 0).readout).toBe("checking proposal 1");
  });
});

describe("VerificationGate", () => {
  it("renders a still thumbnail without loops or observers", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const observe = vi.fn();
    const Observer = vi.fn(() => ({ observe, disconnect: vi.fn(), unobserve: vi.fn(), takeRecords: vi.fn() }));
    vi.stubGlobal("IntersectionObserver", Observer);
    const { container, unmount } = render(
      <>
        {POSES.map((pose) => (
          <VerificationGate key={pose} pose={pose} interactive={false} />
        ))}
      </>,
    );
    expect(container.querySelectorAll("svg.iso-svg")).toHaveLength(4);
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(raf).not.toHaveBeenCalled();
    expect(Observer).not.toHaveBeenCalled();
    unmount();
    raf.mockRestore();
    vi.unstubAllGlobals();
  });

  it("writes each pose's readout into the frame, and keeps SVG ids unique per instance", () => {
    const html = renderToStaticMarkup(
      <>
        <VerificationGate pose="pass" interactive={false} />
        <VerificationGate pose="return" interactive={false} />
      </>,
    );
    expect(html).toContain("reads 4.2 ≤ 6.0 · passed");
    expect(html).toContain("reads 6.6 &gt; 6.0 · returned");
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders the bare machine without a card, and the frame on its own", () => {
    const bare = renderToStaticMarkup(<VerificationGate frame={false} interactive={false} theme="dark" />);
    expect(bare).not.toContain("<figure");
    expect(bare).toContain('class="um-machine uipack-mechanism"');
    expect(bare).toContain('data-theme="dark"');
    const card = renderToStaticMarkup(
      <MechanismFrame number="Fig 2" title="Lock" hint="Hover" readout="ready" caption="A caption.">
        <svg />
      </MechanismFrame>,
    );
    expect(card).toContain('data-corner="fig">Fig 2');
    expect(card).toContain('data-readout="">ready');
    expect(card).toContain("<figcaption");
  });

  it("is focusable and operable from the keyboard when interactive", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn(), takeRecords: vi.fn() })),
    );
    const { container, unmount } = render(<VerificationGate pose="idle" />);
    const machine = container.querySelector(".um-machine") as HTMLElement;
    expect(machine.getAttribute("role")).toBe("button");
    expect(machine.tabIndex).toBe(0);
    expect(machine.getAttribute("aria-label")).toMatch(/Space/);
    unmount();
    vi.unstubAllGlobals();
  });
});

describe("vendored Anatomy kit", () => {
  it("keeps the MIT notice and names the pinned upstream commit", () => {
    const licence = readFileSync("src/mechanism/kit/LICENSE", "utf8");
    expect(licence).toMatch(/MIT License/);
    expect(licence).toMatch(/Copyright \(c\) 2026 Ryan/);
    for (const file of ["iso-kit.ts", "draw.tsx", "live.tsx"]) {
      const source = readFileSync(`src/mechanism/kit/${file}`, "utf8");
      expect(source).toContain("github.com/wheresryan22/anatomy");
      expect(source).toContain("1482e8469b0a9e0d8cc18ea2740a01423d29ae80");
    }
  });

  it("keeps Three.js out of the mechanism entry", () => {
    const files = readdirSync("src/mechanism", { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f));
    expect(files).toContain("gate/VerificationGate.tsx");
    for (const file of files) expect(readFileSync(`src/mechanism/${file}`, "utf8")).not.toMatch(/from "three"|from "gsap"/);
  });
});
