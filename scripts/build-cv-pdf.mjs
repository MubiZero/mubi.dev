import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';

const usage = `Usage:
  npm run build:cv:pdf

Builds both CVs: the .docx for each locale, rendered to HTML with the same
geometry and printed to PDF by the Chromium that Playwright already installs.
Nothing else in the toolchain can turn a .docx into a PDF - there is no
LibreOffice in the build image.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

// The Russian CV keeps the address it was published under; the English one
// gets its own rather than taking over /cv, because that link is already out
// in the world.
const BUILDS = [
  { locale: 'ru', out: resolve('public/MukhamedovM_CV.pdf') },
  { locale: 'en', out: resolve('public/MukhamedovM_CV_EN.pdf') },
];

const work = resolve(tmpdir(), `cv-${process.pid}`);
await mkdir(work, { recursive: true });

try {
  const browser = await chromium.launch();
  try {
    for (const build of BUILDS) {
      const docx = resolve(work, `${build.locale}.docx`);
      const page = resolve(work, `${build.locale}.html`);

      execFileSync('node', [resolve('scripts/build-cv.mjs'), docx, '--locale', build.locale], {
        stdio: 'inherit',
      });
      execFileSync('python3', [resolve('scripts/cv-docx-to-html.py'), docx, page], {
        stdio: 'inherit',
      });

      await mkdir(dirname(build.out), { recursive: true });
      const tab = await browser.newPage();
      await tab.goto(`file://${page}`, { waitUntil: 'load' });
      // The page size and margins are declared in the document's own @page
      // rule, taken from its sectPr, so Chromium must not substitute its own.
      await tab.pdf({ path: build.out, preferCSSPageSize: true, printBackground: true });

      const height = await tab.evaluate(() => document.body.getBoundingClientRect().height);
      const pages = Math.ceil(height / (11.69 * 96));
      if (pages > 1) {
        process.stdout.write(`warning: the ${build.locale} CV runs to about ${pages} pages\n`);
      }
      await tab.close();

      process.stdout.write(`CV written to ${build.out}\n`);
    }
  } finally {
    await browser.close();
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
