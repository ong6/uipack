import { test, expect } from '@playwright/test';
import { objectDirections } from '../src/objects/variants';
test.describe.configure({ mode: 'parallel' });
const kinds=['ai','tennis','trading','server','travel','reading'];
for(const theme of ['light','dark']) for(const width of [390,1440]) {
  test(`six art directions: ${theme} ${width}`,async({page},info)=>{
    test.setTimeout(180000);
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const metrics=[];
    for(const kind of kinds) for(const variant of [0,1,2,3,4,5]) {
      await page.goto(`/animations?story=${kind}&variant=${variant}&theme=${theme}`);
      const canvas=page.locator('.uipack-object canvas');
      await expect(canvas).toHaveAttribute('data-renderer','webgl');
      await expect(canvas).toHaveAttribute('data-phase','rest');
      await expect(canvas).toHaveCSS('opacity','1');
      await expect(canvas).toHaveAttribute('data-art-direction',objectDirections[variant].id);
      await canvas.scrollIntoViewIfNeeded();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator('.uipack-object').screenshot({path:info.outputPath(`${kind}-${variant}.png`)});
      metrics.push({kind,variant,calls:await canvas.getAttribute('data-draw-calls'),triangles:await canvas.getAttribute('data-triangles')});
    }
    expect(errors).toEqual([]);
    await info.attach('render-cost',{body:JSON.stringify(metrics),contentType:'application/json'});
  });
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
for(const variant of [1,2,3,4,5]) test(`new direction ${variant} stays within mobile geometry and paint budgets`, async({page},info)=>{
  test.setTimeout(45000);
  await page.setViewportSize({width:390,height:900});
  const samples=[];
  for(const kind of kinds) {
    await page.goto(`/animations?story=${kind}&variant=${variant}`);
    const canvas=page.locator('.uipack-object canvas');
    await expect(canvas).toHaveAttribute('data-renderer','webgl');
    await canvas.scrollIntoViewIfNeeded();
    const first=Number(await canvas.getAttribute('data-frames')),started=Date.now();
    await page.waitForTimeout(1000);
    const fps=(Number(await canvas.getAttribute('data-frames'))-first)*1000/(Date.now()-started);
    const calls=Number(await canvas.getAttribute('data-draw-calls')), triangles=Number(await canvas.getAttribute('data-triangles'));
    samples.push({kind,variant,fps,calls,triangles});
    expect(calls).toBeLessThan(220);expect(triangles).toBeLessThan(100000);
    expect(fps).toBeGreaterThan(15);expect(fps).toBeLessThan(34);
  }
  await info.attach('mobile-viewport-performance',{body:JSON.stringify({samples,note:'Desktop engine at phone width; not a physical phone benchmark'}),contentType:'application/json'});
  const fs=await import('node:fs/promises');await fs.writeFile(info.outputPath('performance.json'),JSON.stringify(samples,null,2));
});

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
