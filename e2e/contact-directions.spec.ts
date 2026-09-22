import { test, expect } from '@playwright/test';
for(const width of [390,1440])for(const theme of ['light','dark'])for(const [variant,style] of [[3,'cartoon'],[4,'kinetic']] as const) {
  test(`contact ${style} at ${width} ${theme}`,async({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.goto(`/animations?story=contact&variant=${variant}&theme=${theme}`);
    const canvas=page.locator('.uipack-object canvas');
    await expect(canvas).toHaveAttribute('data-renderer','webgl');
    await expect(canvas).toHaveAttribute('data-art-direction',style);
    await expect(canvas).toHaveCSS('opacity','1');
    await page.getByRole('button',{name:'Pause motion',exact:true}).click();
    const frames=await canvas.getAttribute('data-frames');
    await page.waitForTimeout(180);
    expect(await canvas.getAttribute('data-frames')).toBe(frames);
    await page.screenshot({path:info.outputPath('contact.png')});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await page.getByRole('button',{name:'Resume motion',exact:true}).click();
    await expect.poll(()=>canvas.getAttribute('data-frames')).not.toBe(frames);
    await page.getByRole('button',{name:'Studio objects',exact:true}).click();
    await expect(page.getByRole('combobox',{name:/Inbox edition/})).toBeVisible();
  });
}
for(const variant of [3,4])test(`contact ${variant} respects reduced motion and WebGL fallback`,async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/animations?story=contact&variant=${variant}`);
  const canvas=page.locator('.uipack-object canvas');
  await expect(canvas).toHaveAttribute('data-renderer','webgl');
  await expect(page.getByRole('button',{name:'Pause motion',exact:true})).toHaveCount(0);
  const frames=await canvas.getAttribute('data-frames');
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute('data-frames')).toBe(frames);
  await canvas.dispatchEvent('webglcontextlost');
  await expect(canvas).toHaveAttribute('data-renderer','fallback');
  await expect(page.locator('.uipack-object [role="img"]')).toHaveAttribute('aria-label','Contact inbox illustration');
});
