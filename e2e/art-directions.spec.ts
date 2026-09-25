import { test, expect } from '@playwright/test';
import { objectDirections } from '../src/objects/variants';
test.describe.configure({ mode: 'parallel' });
const kinds=['ai','tennis','trading','server','travel','reading'];
// One page/context per combination keeps retries and CI shards bounded. The full
// 6 objects × 6 directions × 2 themes × 2 widths matrix is still exercised.
for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
  for (const kind of kinds) for (const [variant, direction] of objectDirections.entries()) {
    test(`art direction ${kind}/${direction.id}: ${theme} ${width}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`/animations?story=${kind}&variant=${variant}&theme=${theme}`);
      const canvas = page.locator('.uipack-object canvas');
      await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
      await expect(canvas).toHaveAttribute('data-phase', 'rest');
      await expect(canvas).toHaveCSS('opacity', '1');
      await expect(canvas).toHaveAttribute('data-art-direction', direction.id);
      await canvas.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator('.uipack-object').screenshot({ path: info.outputPath(`${kind}-${variant}.png`) });
      const metrics = { kind, variant, calls: await canvas.getAttribute('data-draw-calls'), triangles: await canvas.getAttribute('data-triangles') };
      await info.attach('render-cost', { body: JSON.stringify(metrics), contentType: 'application/json' });
      expect(errors).toEqual([]);
    });
  }
}
for(const variant of [1,2]) test(`direction ${variant} loops, pauses, changes via keyboard, and survives context loss`,async({page})=>{
  test.setTimeout(60000);
  await page.goto(`/animations?story=travel&variant=${variant}`);
  const canvas=page.locator('.uipack-object canvas');
  await expect(canvas).toHaveAttribute('data-playback','loop');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(36500);
  await page.getByRole('button',{name:'Pause motion',exact:true}).click();
  const paused=await canvas.getAttribute('data-pose');
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute('data-pose')).toBe(paused);
  await page.getByRole('button',{name:'Resume motion',exact:true}).click();
  await expect.poll(()=>canvas.getAttribute('data-pose')).not.toBe(paused);
  await page.getByRole('button',{name:variant===1?'Kinetic sculptures':'Paper worlds',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(canvas).toHaveAttribute('data-art-direction',variant===1?'kinetic':'paper-theatre');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(canvas).toHaveAttribute('data-phase','rest');
  const frames=await canvas.getAttribute('data-frames');await page.waitForTimeout(200);
  expect(await canvas.getAttribute('data-frames')).toBe(frames);
  await page.getByRole('button',{name:'Open canvas',exact:true}).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Open canvas',exact:true})).toBeFocused();
  await canvas.dispatchEvent('webglcontextlost');
  await expect(canvas).toHaveAttribute('data-renderer','fallback');
  await expect(page.getByRole('img',{name:'Local map illustration'})).toBeVisible();
});
for (const variant of [1, 2, 3, 4, 5]) for (const kind of kinds) {
  test(`mobile geometry and paint budget: ${kind}/${objectDirections[variant].id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/animations?story=${kind}&variant=${variant}`);
    const canvas = page.locator('.uipack-object canvas');
    await expect(canvas).toHaveAttribute('data-renderer', 'webgl');
    await canvas.scrollIntoViewIfNeeded();
    // Wait for playback to start, then sample frames and elapsed time together in
    // the browser so protocol round trips do not distort the measured paint rate.
    await expect.poll(async () => Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(3);
    const sample = await canvas.evaluate(async element => {
      const canvas = element as HTMLCanvasElement;
      const first = Number(canvas.dataset.frames), started = performance.now();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const elapsed = performance.now() - started;
      const frames = Number(canvas.dataset.frames) - first;
      return { frames, elapsed, fps: frames * 1000 / elapsed, calls: Number(canvas.dataset.drawCalls), triangles: Number(canvas.dataset.triangles) };
    });
    const metrics = { kind, variant, ...sample };
    // Attach before asserting so a failing budget retains the measured evidence.
    await info.attach('mobile-viewport-performance', { body: JSON.stringify({ samples: [metrics], note: 'Desktop engine at phone width; not a physical phone benchmark' }), contentType: 'application/json' });
    const fs = await import('node:fs/promises');
    await fs.writeFile(info.outputPath('performance.json'), JSON.stringify(metrics, null, 2));
    expect(sample.calls).toBeLessThan(220);
    expect(sample.triangles).toBeLessThan(100000);
    expect(sample.fps).toBeGreaterThan(15);
    expect(sample.fps).toBeLessThan(34);
  });
}

for (const variant of [3,4,5]) test(`expanded direction ${variant} playback and fallback`, async ({page}) => {
  await page.goto(`/animations?story=travel&variant=${variant}`);
  const canvas=page.locator('.uipack-object canvas');
  await expect(canvas).toHaveAttribute('data-renderer','webgl');
  await page.getByRole('button',{name:'Pause motion',exact:true}).click();
  const pose=await canvas.getAttribute('data-pose');
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute('data-pose')).toBe(pose);
  await page.getByRole('button',{name:'Resume motion',exact:true}).click();
  await expect.poll(()=>canvas.getAttribute('data-pose')).not.toBe(pose);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(canvas).toHaveAttribute('data-phase','rest');
  await page.getByRole('button',{name:'Open canvas',exact:true}).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-art-direction',objectDirections[variant].id);
  await page.keyboard.press('Escape');
  await canvas.dispatchEvent('webglcontextlost');
  await expect(canvas).toHaveAttribute('data-renderer','fallback');
});
