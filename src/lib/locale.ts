export type Locale = 'en' | 'ru';

export const LOCALES: Locale[] = ['en', 'ru'];

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ru' : 'en';
}

export function localizedPath(locale: Locale): string {
  return locale === 'en' ? '/' : '/ru/';
}
