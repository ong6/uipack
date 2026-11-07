import { blueprint, defineDiagramTheme, diagramThemeCss } from "../src/diagram-theme";
import { expect, test, type Locator, type Page } from "./fixtures";

// Diagram themes in a real browser: the demo on /looks/diagrams paints one figure per theme and
// mode, a blueprint scope draws exactly what an unscoped figure draws, the nearest scope wins, a
// host's own dark selector flips a theme, and the canvas dialog keeps the theme it was opened in.

/** Resolved paint of a figure: its ground, a node's fill and edge, and the canvas pattern. */
async function paint(fig: Locator) {
  return fig.evaluate((el) => {
    const node = el.querySelector('[data-uipack="node"] > rect') as SVGRectElement;
    const canvas = el.querySelector(".uipack__canvas") as HTMLElement;
    const n = getComputedStyle(node);
    return {
      color: getComputedStyle(el).color,
      ground: getComputedStyle(el).backgroundColor,
      nodeFill: n.fill,
      nodeStroke: n.stroke,
      pattern: getComputedStyle(canvas).backgroundImage,
    };
  });
}

const demo = (page: Page) => page.locator('[data-demo="diagram-themes"]');

test.describe("diagram themes", () => {
  test("the demo draws one figure per theme and mode, each in its own colours", async ({ page }) => {
    await page.goto("/looks/diagrams?theme=light");
    const figs = demo(page).locator("figure.uipack");
    await expect(figs).toHaveCount(6);
    const paints = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => paint(figs.nth(i))));
    // blueprint light, blueprint dark, warm-paper light, …: six different grounds.
    expect(new Set(paints.map((p) => p.ground)).size).toBe(6);
    expect(paints[0].ground).toBe("rgb(252, 253, 254)");
    expect(paints[1].ground).toBe("rgb(13, 42, 79)");
    expect(paints[2].ground).toBe("rgb(250, 246, 238)");
    // warm paper paints dots, terracotta nothing, blueprint the drafting grid.
    expect(paints[0].pattern).toContain("linear-gradient");
    expect(paints[2].pattern).toContain("radial-gradient");
    expect(paints[4].pattern).not.toContain("gradient");
  });

  test("a blueprint scope draws what an unscoped figure draws, in both modes", async ({ page }) => {
    for (const mode of ["light", "dark"] as const) {
      await page.goto(`/looks/diagrams?theme=${mode}`);
      const scoped = demo(page)
        .locator("figure.uipack")
        .nth(mode === "light" ? 0 : 1);
      // Re-create the same figure outside every scope, on the same page.
      const bare = await scoped.evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.id = "bare-clone";
        document.body.append(clone);
        return clone.id;
      });
      const a = await paint(scoped);
      const b = await paint(page.locator(`#${bare}`));
      expect(a).toEqual(b);
    }
  });

  test("the nearest scope wins, and a host's dark selector flips a theme", async ({ page }) => {
    await page.goto("/looks/diagrams?theme=light");
    const site = defineDiagramTheme({
      name: "site-x",
      light: { ...blueprint.light, surface: "#fff1f1" },
      dark: { ...blueprint.dark, surface: "#330000" },
      fonts: { heading: "Georgia, serif" },
    });
    const inner = defineDiagramTheme({
      name: "page-x",
      light: { ...blueprint.light, surface: "#f1fff1" },
      dark: { ...blueprint.dark, surface: "#003300" },
    });
    await expect(demo(page).locator("figure.uipack")).toHaveCount(6);
    const css = diagramThemeCss(site, { scope: "#host", darkSelector: ".host-dark" }) + diagramThemeCss(inner);
    const result = await page.evaluate((css) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.append(style);
      const fig = document.querySelector("figure.uipack")!.outerHTML;
      const host = document.createElement("div");
      host.id = "host";
      host.innerHTML = `<div id="outer">${fig}</div><div data-diagram-theme="page-x">${fig}</div>`;
      document.body.append(host);
      const [outer, inner] = [...host.querySelectorAll("figure.uipack")] as HTMLElement[];
      const bg = (el: HTMLElement) => getComputedStyle(el).backgroundColor;
      const before = [bg(outer), bg(inner)];
      // The page theme sets no face, so the site theme's heading face reaches both figures.
      const faces = [outer, inner].map((f) => getComputedStyle(f.querySelector(".uipack__title")!).fontFamily);
      host.classList.add("host-dark");
      return { before, faces, after: [bg(outer), bg(inner)] };
    }, css);
    expect(result.before).toEqual(["rgb(255, 241, 241)", "rgb(241, 255, 241)"]);
    expect(result.after).toEqual(["rgb(51, 0, 0)", "rgb(0, 51, 0)"]);
    expect(result.faces).toEqual(["Georgia, serif", "Georgia, serif"]);
  });

  test("the open canvas keeps the theme its figure sits in", async ({ page }) => {
    await page.goto("/looks/diagrams?theme=light");
    // The flow-parts figure has Open canvas; wrap it in the terracotta scope first.
    const fig = page.locator("figure.uipack", { hasText: "Who acts, what they see" });
    await fig.scrollIntoViewIfNeeded();
    await fig.evaluate((el) => {
      const scope = document.querySelector('[data-diagram-theme="terracotta"]') as HTMLElement;
      // Copy the terracotta carriers onto the figure's parent, as a page scope would set them.
      const parent = el.parentElement!;
      parent.setAttribute("data-diagram-theme", "terracotta");
      parent.setAttribute("style", scope.getAttribute("style")!.replace("display: contents;", ""));
    });
    const ground = await fig.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(ground).toBe("rgb(251, 244, 238)");
    await fig.getByRole("button", { name: "Open canvas" }).click();
    const dialog = page.locator("dialog.uipack-canvas-dialog");
    await expect(dialog).toBeVisible();
    const inDialog = await dialog.locator("figure.uipack").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(inDialog).toBe(ground);
  });

  test("the flow parts demo draws every user-flow and sequence part", async ({ page }) => {
    await page.goto("/looks/diagrams?theme=dark");
    const fig = page.locator("figure.uipack", { hasText: "Who acts, what they see" });
    for (const part of [
      "actor",
      "screen",
      "action",
      "decision",
      "outcome",
      "lane-rule",
      "lifeline",
      "activation",
      "message",
      "lost",
      "self-loop",
      "note",
    ])
      await expect(fig.locator(`[data-uipack="${part}"]`).first()).toBeAttached();
    // Hover traces the user flow: a screen with a flow turns its edge to the accent.
    const screen = fig.locator('[data-uipack="screen"]');
    await screen.hover();
    await expect(fig.locator('[data-uipack="action"]')).toHaveAttribute("data-state", "hit");
  });
});
