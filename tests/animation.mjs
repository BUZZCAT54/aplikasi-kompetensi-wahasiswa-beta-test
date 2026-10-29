import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
await context.addInitScript(() => {
  const original = window.requestAnimationFrame;
  window.__frames = 0;
  window.requestAnimationFrame = callback => original(time => { window.__frames++; callback(time); });
});
const page = await context.newPage();
const errors = [];
const checks = [];
page.on("pageerror", e => errors.push(e.message));
const pass = message => { checks.push(message); console.log("PASS:", message); };
const coordinates = () => page.locator('.map-label').evaluateAll(elements => elements.map(el => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) })));
const difference = (a, b) => a.reduce((sum, point, i) => sum + Math.hypot(point.x - b[i].x, point.y - b[i].y), 0);
const frameCount = () => page.evaluate(() => window.__frames);

await page.goto(process.env.TEST_URL || "http://127.0.0.1:5174");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1900);
assert.equal(await page.locator('canvas').count(), 1);
await page.getByRole('button', { name: 'Ulang animasi', exact: true }).click();
await page.waitForTimeout(70);
const opening = await coordinates();
await page.waitForTimeout(600);
const middle = await coordinates();
await page.waitForTimeout(1400);
const end = await coordinates();
assert.ok(difference(opening, middle) > 10 && difference(middle, end) > 3);
pass('Replay visibly assembles six towers and moves the camera, then settles');
await page.screenshot({ path: 'docs/screenshots/animated-map.png', fullPage: true });

await page.waitForTimeout(500);
const idle = await frameCount();
await page.waitForTimeout(450);
assert.equal(await frameCount(), idle);
pass('Idle scene stops scheduling animation frames');

await page.getByRole('button', { name: 'Putar otomatis', exact: true }).click();
assert.equal(await page.getByRole('button', { name: 'Jeda putaran', exact: true }).getAttribute('aria-pressed'), 'true');
const beforeOrbit = await coordinates();
const framesBeforeOrbit = await frameCount();
await page.waitForTimeout(1600);
const afterOrbit = await coordinates();
assert.ok(difference(beforeOrbit, afterOrbit) > 5, JSON.stringify({beforeOrbit,afterOrbit,framesBeforeOrbit,framesAfterOrbit:await frameCount(),hidden:await page.evaluate(()=>document.hidden),stage:await page.locator('.map-stage').boundingBox(),controls:await page.locator('.motion-toolbar').innerText()}));
await page.getByRole('button', { name: 'Jeda putaran', exact: true }).click();
await page.waitForTimeout(800);
const paused = await coordinates();
await page.waitForTimeout(400);
assert.ok(difference(paused, await coordinates()) < .1);
pass('Automatic orbit moves the map; pause stops it and updates pressed state');

await page.getByRole('button', { name: 'Atur ulang', exact: true }).click();
await page.waitForTimeout(1000);
const beforeZoom = await coordinates();
await page.getByRole('button', { name: 'Perbesar peta', exact: true }).click();
await page.waitForTimeout(180);
const duringZoom = await coordinates();
await page.waitForTimeout(800);
assert.ok(difference(beforeZoom, duringZoom) > 1);
assert.ok(difference(duringZoom, await coordinates()) > .5);
await page.getByRole('button', { name: 'Atur ulang', exact: true }).click();
await page.waitForTimeout(1000);
assert.ok(difference(beforeZoom, await coordinates()) < .5);
pass('Zoom is interpolated over time and reset returns to the home camera');

const beforeSelection = await page.locator('canvas').screenshot();
await page.getByRole('button', { name: 'Pilih Basis data', exact: true }).click();
assert.equal(await page.getByRole('button', { name: 'Pilih Basis data', exact: true }).getAttribute('aria-pressed'), 'true');
await page.waitForTimeout(750);
assert.notDeepEqual(await page.locator('canvas').screenshot(), beforeSelection);
assert.ok((await page.locator('.domain-panel h2').textContent()).includes('Basis data'));
pass('Domain selection animates the focus treatment and updates the detail panel');

await page.getByRole('button', { name: 'Putar otomatis', exact: true }).click();
const canvas = await page.locator('canvas').boundingBox();
await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height - 25);
await page.mouse.down();
await page.mouse.move(canvas.x + canvas.width / 2 + 60, canvas.y + canvas.height - 25, { steps: 12 });
await page.mouse.up();
assert.equal(await page.getByRole('button', { name: 'Putar otomatis', exact: true }).getAttribute('aria-pressed'), 'false');
await page.waitForTimeout(1600);
pass('Dragging interrupts automatic orbit and hands camera control to the user');

await page.getByRole('button', { name: 'Putar otomatis', exact: true }).click();
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForTimeout(100);
const hiddenCount = await frameCount();
await page.waitForTimeout(350);
assert.equal(await frameCount(), hiddenCount);
await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(350);
assert.ok(await frameCount() > hiddenCount);
pass('Hidden-tab handling suspends rendering and resumes when visible');

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.waitForTimeout(500);
assert.ok(await page.getByRole('button', { name: 'Ulang animasi', exact: true }).isDisabled());
assert.ok(await page.getByRole('button', { name: 'Putar otomatis', exact: true }).isDisabled());
const reduced = await frameCount();
await page.waitForTimeout(350);
assert.equal(await frameCount(), reduced);
await page.getByRole('button', { name: 'Pilih Keamanan', exact: true }).click();
assert.ok((await page.locator('.domain-panel h2').textContent()).includes('Keamanan'));
pass('Live reduced-motion preference stops optional motion while domain selection remains usable');

await page.emulateMedia({ reducedMotion: 'no-preference' });
for (const width of [320, 390, 820, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.getByRole('button', { name: 'Ulang animasi', exact: true }).click();
  await page.waitForTimeout(2100);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const cropped = await page.locator('.map-label').evaluateAll(labels => {
    const stage = document.querySelector('.map-stage').getBoundingClientRect();
    return labels.filter(label => { const r = label.getBoundingClientRect(); return r.left < stage.left || r.right > stage.right || r.top < stage.top || r.bottom > stage.bottom; }).map(label => label.textContent);
  });
  assert.deepEqual(cropped, [], `Labels cropped at ${width}`);
  if (width === 390) await page.screenshot({ path: 'docs/screenshots/animated-mobile.png', fullPage: true });
}
pass('Animated map, labels, and controls remain within bounds at 320, 390, 820 and 1440 px');

await page.getByRole('button', { name: 'Putar otomatis', exact: true }).click();
await page.locator('nav').getByRole('button', { name: 'Asesmen mandiri', exact: true }).click();
await page.waitForTimeout(500);
const unmounted = await frameCount();
await page.waitForTimeout(350);
assert.equal(await frameCount(), unmounted);
assert.equal(await page.locator('canvas').count(), 0);
assert.deepEqual(errors, []);
pass('Leaving the map disposes the animation loop; no uncaught JavaScript errors');

await writeFile('docs/animation-results.json', JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
await browser.close();
