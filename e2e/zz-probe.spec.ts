import { test } from "@playwright/test";
const configs: Record<string, Record<string, string>> = {
  base: {}, aa0: { aa0: "1" }, nosh: { nosh: "1" }, sm1024: { sm1024: "1" }, full: { full: "1" },
  old: { full: "1", sm1024: "1" }, nowall: { nowall: "1" }, noground: { noground: "1" }, shfreeze: { shfreeze: "1" }, sh4: { sh4: "1" }, basic: { basic: "1" },
};
test.setTimeout(900_000);
test("probe", async ({ browser }) => {
  const out: Record<string, number[]> = {};
  for (let r = 0; r < 3; r++)
    for (const [name, ls] of Object.entries({ ...configs, "ai5": { story: "ai", variant: "5" } })) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
      const page = await ctx.newPage();
      await page.addInitScript((e) => { for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v); }, ls);
      const story = name === "ai5" ? "ai&variant=5" : "server&variant=4";
      await page.goto(`/animations?story=${story}`);
      const canvas = page.locator(".uipack-object canvas");
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Number(document.querySelector(".uipack-object canvas")?.getAttribute("data-frames")) > 5, null, { timeout: 120000 });
      const fps = await canvas.evaluate(async (c) => { const f0 = Number(c.dataset.frames), t0 = performance.now(); await new Promise((r) => setTimeout(r, 2000)); return ((Number(c.dataset.frames) - f0) * 1000) / (performance.now() - t0); });
      (out[name] ??= []).push(Math.round(fps * 10) / 10);
      await ctx.close();
    }
  console.log("PROBE " + JSON.stringify(out));
});
