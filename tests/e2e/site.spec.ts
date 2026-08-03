import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = [
  { locale: 'ru', path: '/ru/', lead: 'Автоматизирую инфраструктуру' },
  { locale: 'en', path: '/', lead: 'I automate infrastructure' },
];

for (const route of ROUTES) {
  test.describe(`${route.locale} page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path);
    });

    test('opens on the name, the role, and the thesis', async ({ page }) => {
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.v2-hero__role')).toContainText('DevOps/SRE');
      await expect(page.getByText(route.lead)).toBeVisible();
      await expect(page.getByTestId('v2-hero-cta')).toHaveAttribute('href', /^mailto:/);
    });

    test('the portrait loads and is named', async ({ page }) => {
      const portrait = page.locator('.v2-hero__portrait img');
      // textContent, not innerText: the h1 is uppercased by CSS only
      const name = (await page.locator('h1').textContent())!.trim();
      await expect(portrait).toHaveAttribute('alt', name);
      await expect
        .poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
    });

    test('the portrait never crowds out the fold on a narrow screen', async ({ page }) => {
      for (const width of [360, 820]) {
        await page.setViewportSize({ width, height: 900 });
        const box = await page.locator('.v2-hero__portrait img').boundingBox();
        expect(box!.width, `at ${width}px`).toBeLessThanOrEqual(220);
      }
    });

    test('the print button sits with the profile links and actually prints', async ({ page }) => {
      const button = page.locator('[data-v2-print]');
      await expect(button).toHaveCount(1);
      await expect(button).toHaveAttribute('aria-label', /\S/);

      const siblings = page.locator('.v2-hero .v2-social > *');
      await expect(siblings).toHaveCount(4);

      await page.evaluate(() => {
        window.__printed = 0;
        window.print = () => {
          window.__printed += 1;
        };
      });
      await button.click();
      expect(await page.evaluate(() => window.__printed)).toBe(1);
    });

    test('printing produces a one page resume, not a screenshot of the site', async ({ page }) => {
      await page.emulateMedia({ media: 'print' });

      await expect(page.locator('.v2-masthead')).toBeHidden();
      await expect(page.locator('.v2-hero .v2-social')).toBeHidden();
      await expect(page.locator('#work')).toBeHidden();
      await expect(page.locator('.v2-track__screen')).toBeHidden();
      await expect(page.locator('.v2-track__print')).toBeVisible();
      await expect(page.getByTestId('v2-contact-mail')).toBeVisible();

      const background = await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      );
      expect(background).toBe('rgb(255, 255, 255)');

      // null, not 'screen': pdf() applies print styles itself, and leaving the
      // emulation pinned to screen would measure the on-screen layout instead.
      await page.emulateMedia({ media: null });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      const counts = [...pdf.toString('latin1').matchAll(/\/Count\s+(\d+)/g)].map((match) =>
        Number(match[1]),
      );
      expect(counts.length).toBeGreaterThan(0);
      expect(Math.max(...counts)).toBe(1);
    });

    test('the printed resume carries the link addresses, not just their names', async ({
      page,
    }) => {
      await page.emulateMedia({ media: 'print' });
      const printed = await page
        .getByTestId('v2-contact-links')
        .locator('a')
        .first()
        .evaluate((node) => getComputedStyle(node, '::after').content);
      expect(printed).toContain('https://');
    });

    test('the code section shows real repositories with live metadata', async ({ page }) => {
      const repos = page.getByTestId('v2-repo');
      await expect(repos).toHaveCount(5);

      for (const repo of await repos.all()) {
        await expect(repo).toHaveAttribute('href', /^https:\/\/github\.com\/MubiZero\//);
        await expect(repo.locator('.v2-repo__description')).not.toBeEmpty();
        // a month and a year, filled in at build time from the GitHub API
        await expect(repo.locator('.v2-repo__meta')).toContainText(/\d{4}/);
      }
    });

    test('the contribution calendar draws its window and names its own total', async ({
      page,
    }) => {
      const calendar = page.getByTestId('v2-calendar');
      await expect(calendar).toBeVisible();

      const days = calendar.locator('.v2-calendar__day[data-level]');
      // the drawn window, not the full year GitHub returns
      await expect.poll(() => days.count()).toBeGreaterThan(290);
      await expect.poll(() => days.count()).toBeLessThan(310);

      const scroller = calendar.locator('.v2-calendar__scroll');
      expect(await scroller.getAttribute('aria-label')).toMatch(/\d/);
      // a region you can scroll must also be reachable by keyboard
      expect(await scroller.getAttribute('tabindex')).toBe('0');

      const painted = await calendar
        .locator('.v2-calendar__day[data-level="4"]')
        .count();
      expect(painted).toBeGreaterThan(0);
    });

    test('a day answers when you point at it', async ({ page }) => {
      const calendar = page.getByTestId('v2-calendar');
      const tip = calendar.locator('.v2-calendar__tip');
      await expect(tip).toBeHidden();

      await calendar.locator('.v2-calendar__day[data-day]').last().hover();
      await expect(tip).toBeVisible();
      // the same sentence the caption uses: a count and a date, not a raw number
      await expect(tip).toContainText(/\d/);
      await expect(tip).toContainText(/\d{4}/);
    });

    test('the days are walkable from the keyboard, one tab stop away', async ({ page }) => {
      const calendar = page.getByTestId('v2-calendar');
      await calendar.locator('.v2-calendar__scroll').focus();

      await page.keyboard.press('ArrowLeft');
      const cursor = calendar.locator('.v2-calendar__day[data-cursor]');
      await expect(cursor).toHaveCount(1);
      const first = await cursor.getAttribute('data-day');

      // left moves a week, up moves a day: both have to land somewhere new
      await page.keyboard.press('ArrowUp');
      await expect(cursor).toHaveCount(1);
      expect(await cursor.getAttribute('data-day')).not.toBe(first);

      // whatever the pointer is shown, a screen reader is told
      await expect(calendar.locator('[data-v2-calendar-live]')).toHaveText(
        (await cursor.getAttribute('data-day'))!,
      );

      await page.keyboard.press('Escape');
      await expect(calendar.locator('.v2-calendar__day[data-cursor]')).toHaveCount(0);
    });

    test('the address can be copied, and the page says whether it worked', async ({
      page,
      context,
    }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const button = page.locator('[data-v2-copy]');
      const status = page.locator('[data-v2-copy-status]');
      await expect(status).toBeEmpty();

      const width = (await button.boundingBox())!.width;
      await button.click();

      await expect(status).not.toBeEmpty();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        await button.getAttribute('data-v2-copy'),
      );
      // the result is reported beside the button, so the button cannot resize
      // under the reader at the moment they check it
      expect((await button.boundingBox())!.width).toBe(width);
    });

    test('the language codes keep their seats when you switch', async ({ page }) => {
      const codes = page.locator('.v2-lang > *');
      await expect(codes).toHaveText(['RU', 'EN']);

      const before = await codes.nth(0).boundingBox();
      await page.locator('.v2-lang a').click();
      await expect(page.locator('html')).toHaveAttribute('lang', /\w/);

      // same order, same box: the code you just pressed has not moved out from
      // under the pointer
      await expect(codes).toHaveText(['RU', 'EN']);
      expect((await codes.nth(0).boundingBox())!.x).toBe(before!.x);
    });

    test('the header reports how far through the page you are', async ({ page }) => {
      const read = () =>
        page.$eval('[data-v2-progress]', (node) =>
          Number(getComputedStyle(node).getPropertyValue('--read')),
        );
      expect(await read()).toBeLessThan(0.05);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect.poll(read).toBeGreaterThan(0.9);
    });

    test('nothing rules off one section from the next', async ({ page }) => {
      const borders = await page.$$eval('.v2-section', (nodes) =>
        nodes.map((node) => getComputedStyle(node).borderTopWidth),
      );
      expect(borders.every((width) => width === '0px')).toBe(true);
    });

    test('the calendar scrolls inside itself, never widening the page', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      const scroller = page.locator('.v2-calendar__scroll');
      const overflows = await scroller.evaluate(
        (node) => node.scrollWidth > node.clientWidth,
      );
      expect(overflows).toBe(true);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(360);
    });

    test('the code section is reachable from the navigation', async ({ page }) => {
      await page.locator('[data-v2-section-link="code"]').click();
      await expect(page).toHaveURL(/#code$/);
      await expect(page.locator('#code')).toBeInViewport();
    });

    test('the navigation follows the section you are reading', async ({ page }) => {
      await page.evaluate(() => document.getElementById('work')?.scrollIntoView());
      await expect(page.locator('[data-v2-section-link="work"]')).toHaveAttribute(
        'aria-current',
        'location',
      );

      await page.evaluate(() => document.getElementById('contact')?.scrollIntoView());
      await expect(page.locator('[data-v2-section-link="contact"]')).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(page.locator('[data-v2-section-link="work"]')).not.toHaveAttribute(
        'aria-current',
        'location',
      );
    });

    test('the theme toggle flips and is remembered', async ({ page }) => {
      const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
      const before = await theme();
      await page.locator('#v2-theme-toggle').click();

      // the swap happens inside a view transition, so it lands a frame later
      await expect.poll(theme).not.toBe(before);
      const after = await theme();

      await page.reload();
      await expect.poll(theme).toBe(after);
    });

    test('the theme is stored the moment it is chosen, not when the wave ends', async ({
      page,
    }) => {
      await page.locator('#v2-theme-toggle').click();
      // read immediately: a reload mid-animation must not undo the choice
      const stored = await page.evaluate(() => localStorage.getItem('theme'));
      expect(stored).toMatch(/^(dark|light)$/);
      await page.reload();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
        .toBe(stored);
    });

    test('is offered to search engines, not held back as a draft', async ({ page }) => {
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    });

    test('no element animates the all property', async ({ page }) => {
      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll('*')]
          .filter((node) => {
            const style = getComputedStyle(node);
            return style.transitionProperty === 'all' && parseFloat(style.transitionDuration) > 0;
          })
          .map((node) => node.tagName),
      );
      expect(offenders).toEqual([]);
    });

    test('has no detectable accessibility violations', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('the language switch crosses to the other locale', async ({ page }) => {
  await page.goto('/ru/');
  await page.locator('.v2-lang a').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the page has no horizontal overflow on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/ru/');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
