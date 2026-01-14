#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

const docref = argValue('--docref');
const outPath = argValue('--out');

if (!docref || !outPath) {
  console.error('Missing required arguments: --docref and --out');
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (e) {
  console.error('Playwright not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(3);
}

const portalUrl = process.env.CSG_PORTAL_URL || 'https://csg.drdlr.gov.za/';
const downloadDir = path.dirname(outPath);
fs.mkdirSync(downloadDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

async function tryDownloadFromPage() {
  // Try generic search fields
  const candidates = [
    'input[type="search"]',
    'input[placeholder*="Search" i]',
    'input[aria-label*="Search" i]',
    'input[type="text"]'
  ];

  for (const sel of candidates) {
    const el = page.locator(sel).first();
    if (await el.count()) {
      try {
        await el.fill(docref);
        await el.press('Enter');
        await page.waitForTimeout(2000);
        break;
      } catch {
        // continue
      }
    }
  }

  // If there's a "Documents" entry, open it first
  const docsLink = page.locator('a:has-text("Documents"), button:has-text("Documents")').first();
  if (await docsLink.count()) {
    try {
      await docsLink.click({ timeout: 3000 });
      await page.waitForTimeout(1500);
    } catch {
      // ignore
    }
  }

  // Direct PDF links
  const pdfLink = page.locator('a[href$=".pdf"]').first();
  if (await pdfLink.count()) {
    const href = await pdfLink.getAttribute('href');
    if (href) {
      const url = href.startsWith('http') ? href : new URL(href, page.url()).toString();
      const r = await fetch(url);
      if (!r.ok) throw new Error(`PDF fetch failed (${r.status})`);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      return true;
    }
  }

  // Click-to-download capture
  const clickable = page.locator('a:has-text("Download"), button:has-text("Download"), a:has-text("PDF")').first();
  if (await clickable.count()) {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      clickable.click({ timeout: 3000 })
    ]);
    await dl.saveAs(outPath);
    return true;
  }

  return false;
}

try {
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  const ok = await tryDownloadFromPage();
  if (!ok) {
    throw new Error('Could not locate a downloadable PDF automatically. The portal layout likely needs a targeted selector update.');
  }

  process.exit(0);
} catch (e) {
  console.error(String(e?.message || e));
  process.exit(1);
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}
