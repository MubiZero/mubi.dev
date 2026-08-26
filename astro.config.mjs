import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://mubi.dev',
  output: 'static',
  i18n: {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    // The head already declares hreflang; without this the sitemap emitted an
    // xhtml namespace it never used, so the two disagreed about the locales.
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ru: 'ru' } },
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html'),
    }),
    icon(),
  ],
});
