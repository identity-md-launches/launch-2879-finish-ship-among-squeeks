// Optional production smoke test. See README.md for installing Playwright outside the repository.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const output = process.env.CHECK_OUTPUT || '/tmp/among-squeeks-checks';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url, 'http://localhost').pathname.replace(/^\/preview\//, '/');
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, '.' + decodeURIComponent(path));
    assert.ok(file.startsWith(root));
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
await mkdir(output, { recursive: true });
const browser = await engine.launch();
const reports = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width === 390, isMobile: width === 390, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [], failed = [], frames = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => { if (!r.failure().errorText.includes('ABORTED')) failed.push(r.url()); });
    page.on('websocket', (ws) => ws.on('framesent', (frame) => frames.push(typeof frame.payload === 'string' ? frame.payload : Buffer.from(frame.payload).toString())));
    const address = `http://127.0.0.1:${port}${width === 390 ? '/preview/' : '/'}`;
    await page.goto(address);
    const play = page.getByRole('button', { name: 'Play now', exact: true });
    await play.waitFor();
    const box = await play.boundingBox();
    assert.ok(box.y + box.height < 844, 'Play now must be on the first screen');
    const titleWidth = await page.evaluate(() => ({ view: innerWidth, page: document.documentElement.scrollWidth }));
    assert.equal(titleWidth.view, titleWidth.page, 'Title must not overflow');
    await page.screenshot({ path: `${output}/${engine.name()}-title-${width}.png` });
    await play.click();
    try { await page.locator('.game-hud[data-phase="playing"]').waitFor({ timeout: 100000 }); }
    catch (error) {
      await page.screenshot({ path: `${output}/${engine.name()}-failure-${width}.png` });
      console.error(JSON.stringify({ errors, failed, text: await page.locator('body').innerText() }, null, 2));
      throw error;
    }
    assert.equal(frames.filter((f) => f.includes('addBot')).length, 5);
    assert.equal(frames.filter((f) => f.includes('start')).length, 1);
    const role = await page.locator('.self-card').innerText();
    assert.match(role, /Miner|Rugger/);
    const gameWidth = await page.evaluate(() => ({ view: innerWidth, page: document.documentElement.scrollWidth }));
    assert.equal(gameWidth.view, gameWidth.page, 'Game must not overflow');
    await page.screenshot({ path: `${output}/${engine.name()}-playing-${width}.png` });
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    await page.getByRole('button', { name: 'Leave room', exact: true }).click();
    await play.waitFor();
    const report = { engine: engine.name(), width, role, rootOrSubfolder: width === 390 ? '/preview/' : '/', fiveBots: true, errors, failed };
    reports.push(report); console.log(JSON.stringify(report));
    await context.close();
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
  await writeFile(`${output}/${engine.name()}-results.json`, JSON.stringify(reports, null, 2));
}
