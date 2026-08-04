import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const widths = [320, 375, 768, 1280, 2560];

type HorizontalBounds = {
  body: {
    left: number;
    right: number;
    scrollWidth: number;
  };
  document: {
    clientWidth: number;
    scrollWidth: number;
  };
  elementViolations: string[];
  textViolations: string[];
};

async function horizontalBounds(page: Page) {
  return page.evaluate<HorizontalBounds>(() => {
    const tolerance = 0.5;
    const viewportWidth = window.innerWidth;
    const bodyRect = document.body.getBoundingClientRect();
    const elements = [...document.querySelectorAll<HTMLElement>('header, header *, main, main *')];
    const isRendered = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    // Content scrolled out of view inside its own horizontal scroller sits
    // outside the viewport by design and cannot widen the page. Only elements
    // laid out against the page itself are held to the viewport bounds.
    const isScrolledInside = (element: HTMLElement) => {
      for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).overflowX !== 'visible') return true;
      }
      return false;
    };
    const isPageLevel = (element: HTMLElement) => isRendered(element) && !isScrolledInside(element);
    const describe = (element: HTMLElement) => {
      const selector = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${
        typeof element.className === 'string' && element.className.trim()
          ? `.${element.className.trim().replaceAll(/\s+/g, '.')}`
          : ''
      }`;
      return `${selector}: ${element.textContent?.trim().replaceAll(/\s+/g, ' ').slice(0, 60) ?? ''}`;
    };

    const elementViolations = elements.filter(isPageLevel).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -tolerance || rect.right > viewportWidth + tolerance
        ? [`${describe(element)} [${rect.left.toFixed(1)}, ${rect.right.toFixed(1)}]`]
        : [];
    });

    const textViolations = elements.filter(isPageLevel).flatMap((element) =>
      [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
        .flatMap((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return [...range.getClientRects()].flatMap((rect) =>
            rect.width > 0 && (rect.left < -tolerance || rect.right > viewportWidth + tolerance)
              ? [`${describe(element)} [${rect.left.toFixed(1)}, ${rect.right.toFixed(1)}]`]
              : [],
          );
        }),
    );

    return {
      body: {
        left: bodyRect.left,
        right: bodyRect.right,
        scrollWidth: document.body.scrollWidth,
      },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      elementViolations,
      textViolations,
    };
  });
}

for (const path of ['/', '/ru/']) {
  for (const textScale of [100, 200]) {
    test(`${path} keeps body, visible elements, and text inside 320px at ${textScale}% text`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(path);
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${scale / 100}rem`;
      }, textScale);

      const bounds = await horizontalBounds(page);
      expect(bounds.document.scrollWidth, 'document scroll width').toBeLessThanOrEqual(
        bounds.document.clientWidth,
      );
      expect(bounds.body.scrollWidth, 'body scroll width').toBeLessThanOrEqual(
        bounds.document.clientWidth,
      );
      expect(bounds.body.left, 'body left edge').toBeGreaterThanOrEqual(-0.5);
      expect(bounds.body.right, 'body right edge').toBeLessThanOrEqual(
        bounds.document.clientWidth + 0.5,
      );
      expect(bounds.elementViolations, 'visible element bounds').toEqual([]);
      expect(bounds.textViolations, 'visible text range bounds').toEqual([]);
    });
  }
}

for (const width of widths) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`no horizontal overflow at ${width}px with 200 percent text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '32px';
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`visible header controls are at least 44px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const controls = await page.locator('header a[href], header button').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
        })
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            label: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName,
            width: rect.width,
            height: rect.height,
          };
        }),
    );

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.width, `${control.label} width`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${control.label} height`).toBeGreaterThanOrEqual(44);
    }
  });
}

test('body copy is capped at a comfortable measure', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const widths = await page
    .locator('main p')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widths.length).toBeGreaterThan(0);
  for (const width of widths) {
    expect(width).toBeLessThanOrEqual(800);
  }
});

test('localized headings stay fully inside the desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/ru/');
  const clipped = await page.locator('main h1, main h2, main h3').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return rect.left < 0 || rect.right > window.innerWidth;
      })
      .map((node) => node.textContent?.trim()),
  );

  expect(clipped).toEqual([]);
});

// The section links are out of reach on a phone, so the sheet is the only way
// to move around six thousand pixels of page. Every step of it is held here.
test.describe('the section sheet on a narrow screen', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('replaces the header links rather than sitting beside them', async ({ page }) => {
    await page.goto('/ru/');
    await expect(page.locator('.masthead nav')).toBeHidden();
    await expect(page.locator('[data-menu]')).toBeVisible();
  });

  test('opens, jumps to the section, and closes behind itself', async ({ page }) => {
    await page.goto('/ru/');
    await page.locator('[data-menu]').click();

    const sheet = page.locator('[data-sheet]');
    await expect(sheet).toBeVisible();
    await expect(page.locator('[data-menu]')).toHaveAttribute('aria-expanded', 'true');

    await sheet.locator('[data-section-link="code"]').click();
    await expect(sheet).toBeHidden();
    await expect(page.locator('#code')).toBeInViewport();
    await expect(page.locator('[data-menu]')).toHaveAttribute('aria-expanded', 'false');
  });

  test('names the section being read', async ({ page }) => {
    await page.goto('/ru/');
    await page.evaluate(() => document.getElementById('track')?.scrollIntoView());
    await page.locator('[data-menu]').click();
    await expect(
      page.locator('[data-sheet] [data-section-link="track"]'),
    ).toHaveAttribute('aria-current', 'location');
  });

  test('closes on Escape and on a tap outside it', async ({ page }) => {
    await page.goto('/ru/');
    const sheet = page.locator('[data-sheet]');

    await page.locator('[data-menu]').click();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    await page.locator('[data-menu]').click();
    await page.mouse.click(195, 60);
    await expect(sheet).toBeHidden();
  });

  test('a tapped day states its date, and a drag drops the reading', async ({ page }) => {
    await page.goto('/ru/');
    const tip = page.locator('[data-calendar-tip]');

    await page.locator('.calendar__day[data-day]').nth(120).tap();
    await expect(tip).toHaveAttribute('data-shown', '');
    await expect(tip).toContainText(/\d{4}/);
    // the reading never hangs off either edge of the screen
    const box = (await tip.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);

    await page.locator('[data-calendar]').evaluate((node) => {
      node.scrollLeft -= 60;
    });
    await expect(tip).not.toHaveAttribute('data-shown', '');
  });

  test('has no detectable accessibility violations while open', async ({ page }) => {
    await page.goto('/ru/');
    await page.locator('[data-menu]').click();
    await expect(page.locator('[data-sheet]')).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(violations.map((violation) => violation.id)).toEqual([]);
  });
});
