import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';

const usage = `Usage:
  npm run build:cv:pdf [-- <output path>]

Builds the CV .docx, renders it to HTML with the same geometry, and prints
that to PDF with the Chromium that Playwright already installs. Nothing else
in the toolchain can turn a .docx into a PDF: there is no LibreOffice in the
build image.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

const out = resolve(process.argv[2] ?? 'public/MukhamedovM_CV.pdf');
const work = resolve(tmpdir(), `cv-${process.pid}`);
const docx = resolve(work, 'cv.docx');
const page = resolve(work, 'cv.html');

await mkdir(work, { recursive: true });
await mkdir(dirname(out), { recursive: true });

try {
  execFileSync('node', [resolve('scripts/build-cv.mjs'), docx], { stdio: 'inherit' });
  execFileSync('python3', [resolve('scripts/cv-docx-to-html.py'), docx, page], { stdio: 'inherit' });

  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage();
    await tab.goto(`file://${page}`, { waitUntil: 'load' });
    // The page size and margins are declared in the document's own @page rule,
    // taken from its sectPr, so Chromium must not substitute its own.
    await tab.pdf({ path: out, preferCSSPageSize: true, printBackground: true });

    const pages = await tab.evaluate(() => {
      const height = document.body.getBoundingClientRect().height;
      return Math.ceil(height / (11.69 * 96));
    });
    if (pages > 1) {
      process.stdout.write(`warning: the content runs to about ${pages} pages\n`);
    }
  } finally {
    await browser.close();
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

process.stdout.write(`CV written to ${out}\n`);
