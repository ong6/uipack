import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { gradeUrl } from "../src/grade/run";
import { resolveSpec } from "../src/grade/spec";
import { expect, test } from "./fixtures";

// The tier-1 grader on two pages it has never seen: one with a planted defect for every check,
// one built to pass them all. Each check must catch its defect and stay quiet on the clean page, in
// a real browser, so the in-page measuring (not only the rules) is tested. The pages are served
// from a throwaway server with IBM Plex Sans as their one face, so the rendered-font check sees the
// same font on every machine.
const face = `@font-face { font-family: "IBM Plex Sans"; src: url(/plex.woff2) format("woff2"); font-weight: 100 900; }
  html, body, button { font-family: "IBM Plex Sans"; } body { margin: 0; background: #fff; color: #111; font-size: 16px; }`;

const BAD = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Bad</title><style>${face}
  .wide { width: 2000px; height: 10px; background: #eee; }
  .clip { width: 120px; height: 20px; overflow: hidden; }
  .stack { position: relative; height: 40px; } .stack p { position: absolute; top: 0; left: 0; margin: 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .grid > div { border: 1px solid #333; padding: 8px; }
  .faint { color: #aaa; }
  .tiny { font-size: 9px; }
  .noring:focus { outline: none; }
  @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.2); } }
  .spin { display: inline-block; animation: pulse 1s infinite alternate; }
  .serif { font-family: Georgia, serif; }
</style></head><body>
  <h1>Planted defects</h1><h1>A second h1</h1>
  <h3>Skips h2</h3>
  <div class="wide"></div>
  <div class="clip">This sentence is far too long for its fixed box and wraps under the cut</div>
  <div class="stack"><p>First words here</p><p>Second words here</p></div>
  <div class="grid"><div style="height: 120px">Short card</div><div style="height: 200px">Tall card</div></div>
  <button style="width: 20px; height: 20px; padding: 0">x</button>
  <p><a href="#alpha">Alpha</a> · <a href="#beta">Beta</a></p>
  <p class="faint">Faint grey text that fails contrast</p>
  <p><span class="tiny">Nine pixel label</span></p>
  <p class="serif">A paragraph in another face</p>
  <img src="/plex.woff2" width="10" height="10">
  <p><button class="noring" style="width: 120px; height: 48px">No focus ring</button></p>
  <p><span class="spin">Spinning</span></p>
</body></html>`;

const CLEAN = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Clean</title><style>${face}
  main { max-width: 640px; margin: 0 auto; padding: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid > div { border: 1px solid #333; padding: 8px; min-height: 100px; }
  button, a { min-width: 48px; min-height: 48px; display: inline-flex; align-items: center; color: #111; }
  :focus-visible { outline: 2px solid #0645ad; outline-offset: 2px; }
  @media (prefers-reduced-motion: no-preference) { .spin { animation: pulse 1s infinite alternate; } }
  @keyframes pulse { from { opacity: 1; } to { opacity: 0.6; } }
  @media (prefers-color-scheme: dark) { body { background: #111; color: #eee; } button { background: #222; border-color: #ccc; } button, a { color: #eee; } .grid > div { border-color: #ccc; } }
</style></head><body><main>
  <h1>A clean page</h1>
  <p>Every check should pass here, in both themes and at both widths.</p>
  <h2>Cards</h2>
  <div class="grid"><div>One card with a little text</div><div>Another card with rather more text in it, enough to wrap</div></div>
  <h2>Controls</h2>
  <p><button>Save</button> <a href="#top">Back to top</a></p>
  <p>An inline <a href="#x" style="min-height:0;min-width:0;display:inline">text link</a> is exempt.</p>
  <ul><li><strong>Index:</strong> <a href="#y" style="min-height:0;min-width:0;display:inline">one page</a>, <a href="#z" style="min-height:0;min-width:0;display:inline">another page</a></li></ul>
  <img src="/plex.woff2" alt="" width="10" height="10">
  <p class="spin">Pulses only when motion is allowed</p>
</main></body></html>`;

// Body stays transparent; the app root paints the ground, dark only when the scheme asks for it
// (as .uipack-web does). `fixed` never changes, so its dark view really is not themed.
const wrapper = (
  themed: boolean,
) => `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Wrapper</title><style>${face}
  body { background: transparent; } .app { min-height: 100vh; padding: 24px; background: #fff; color: #111; }
  ${themed ? "@media (prefers-color-scheme: dark) { .app { background: #111; color: #eee; } }" : ""}
</style></head><body><div class="app"><h1>Painted on a wrapper</h1><p>The body has no background of its own.</p></div></body></html>`;

let server: Server;
let base = "";

test.beforeAll(async () => {
  const font = readFileSync("src/web/fonts/ibm-plex-sans-latin-400-normal.woff2");
  server = createServer((req, res) => {
    if (req.url === "/plex.woff2") return void (res.setHeader("Content-Type", "font/woff2"), res.end(font));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const url = req.url ?? "";
    res.end(
      url.startsWith("/bad")
        ? BAD
        : url.startsWith("/wrapper")
          ? wrapper(true)
          : url.startsWith("/fixed")
            ? wrapper(false)
            : CLEAN,
    );
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(() => new Promise<void>((r) => server.close(() => r())));

const spec = resolveSpec({ faces: ["IBM Plex Sans"] });

test("tier 1 catches a planted defect for every check", async () => {
  test.setTimeout(120_000);
  const report = await gradeUrl(`${base}/bad`, spec, { themes: ["light"] });
  expect(report.passed).toBe(false);
  const phone = report.views.find((v) => v.view === "390-light")!;
  const desk = report.views.find((v) => v.view === "1440-light")!;
  const status = (v: typeof phone, id: string) => v.checks.find((c) => c.id === id)!;
  for (const id of [
    "overflow-x",
    "text-clip",
    "text-overlap",
    "row-heights",
    "tap-targets",
    "contrast",
    "font-faces",
    "text-size",
    "img-alt",
    "heading-order",
    "one-h1",
    "focus-visible",
    "reduced-motion",
  ])
    expect(
      status(phone, id).status,
      `${id} at 390: ${JSON.stringify(status(phone, id).findings[0] ?? status(phone, id).note)}`,
    ).toBe("fail");
  // Each finding points at the planted element.
  expect(status(phone, "overflow-x").findings[0].selector).toContain("div.wide");
  expect(status(phone, "text-clip").findings[0].text).toMatch(/far too long/);
  expect(status(phone, "row-heights").findings[0].detail).toMatch(/differ in height by 80px/);
  expect(status(phone, "contrast").findings.map((f) => f.text)).toContain("Faint grey text that fails contrast");
  expect(status(phone, "text-size").findings[0].detail).toBe("9px, floor 12px");
  expect(status(phone, "font-faces").findings[0].detail).toMatch(/asks for "Georgia"/);
  expect(status(phone, "focus-visible").findings.map((f) => f.text)).toContain("No focus ring");
  expect(status(phone, "reduced-motion").findings[0].detail).toMatch(/pulse/);
  // The 20px button fails the 24px pointer minimum too; the 48px one does not. Links with only a
  // separator between them are a row of targets, not a sentence, so they are graded.
  expect(status(desk, "tap-targets").findings.map((f) => f.text)).toEqual(["x", "Alpha", "Beta"]);
  expect(status(desk, "overflow-x").status).toBe("fail");
});

test("tier 1 passes a clean page in every view", async () => {
  test.setTimeout(120_000);
  const report = await gradeUrl(`${base}/clean`, spec);
  const failing = report.views.flatMap((v) =>
    v.checks.filter((c) => c.status === "fail").map((c) => `${v.view} ${c.id}: ${JSON.stringify(c.findings[0])}`),
  );
  expect(failing).toEqual([]);
  expect(report.passed).toBe(true);
  expect(report.views.map((v) => v.view)).toEqual(["1440-light", "1440-dark", "390-light", "390-dark"]);
  expect(report.views.find((v) => v.view === "1440-dark")!.themeApplied).toBe(true);
  // The motion the page allows is off under reduced motion, and focus was walked.
  expect(report.views[0].checks.find((c) => c.id === "focus-visible")!.checked).toBeGreaterThanOrEqual(2);
});

test("the dark theme is read from the ground a wrapper paints, not only body", async () => {
  test.setTimeout(120_000);
  const themed = await gradeUrl(`${base}/wrapper`, spec, { views: ["1440"], screenshots: false });
  expect(themed.views.find((v) => v.view === "1440-dark")!.themeApplied).toBe(true);
  const fixed = await gradeUrl(`${base}/fixed`, spec, { views: ["1440"], screenshots: false });
  expect(fixed.views.find((v) => v.view === "1440-dark")!.themeApplied).toBe(false);
});
