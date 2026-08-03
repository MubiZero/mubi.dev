import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const usage = `Usage:
  npm run qa:capture -- --output /tmp/mubi-dev-final-qa [--base-url http://127.0.0.1:4321]

Capture EN/RU at 320px and 200% text: the masthead, the focused skip link, and contact.
Start the production preview before running this command.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const outputArgument = argumentValue('--output');
if (!outputArgument) throw new Error(`Missing --output.\n\n${usage}`);

const outputDirectory = resolve(outputArgument);
const baseUrl = argumentValue('--base-url') ?? 'http://127.0.0.1:4321';
const states = [
  { locale: 'en', path: '/' },
  { locale: 'ru', path: '/ru/' },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();

try {
  for (const { locale, path } of states) {
    const page = await browser.newPage({
      colorScheme: 'light',
      viewport: { width: 320, height: 900 },
    });
    await page.goto(new URL(path, baseUrl).toString(), { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });

    await page.screenshot({ path: resolve(outputDirectory, `${locale}-320-200-top.png`) });

    const skipLink = page.locator('.v2-skip');
    await skipLink.focus();
    await skipLink.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    await page.screenshot({
      path: resolve(outputDirectory, `${locale}-320-200-skip-focus.png`),
    });

    // The section nav is hidden at this width by design, so contact is reached
    // by its anchor rather than by a control that is not on screen.
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('[data-v2-copy]').focus();
    await page.screenshot({ path: resolve(outputDirectory, `${locale}-320-200-contact.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}

process.stdout.write(`Captured 6 screenshots in ${outputDirectory}\n`);
