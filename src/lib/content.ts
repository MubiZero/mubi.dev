import { getEntry } from 'astro:content';
import type { Locale } from './locale';

async function section<
  T extends
    | 'profile'
    | 'experience'
    | 'education'
    | 'cases'
    | 'stack'
    | 'contact'
    | 'repos'
    | 'ui'
    | 'v2',
>(collection: T, locale: Locale) {
  const entry = await getEntry(collection, locale);
  if (!entry) throw new Error(`missing ${collection} data for locale ${locale}`);
  return entry.data;
}

export async function loadSitePage(locale: Locale) {
  const [profile, experience, education, cases, stack, contact, ui, copy, repos] =
    await Promise.all([
      section('profile', locale),
      section('experience', locale),
      section('education', locale),
      section('cases', locale),
      section('stack', locale),
      section('contact', locale),
      section('ui', locale),
      section('v2', locale),
      section('repos', locale),
    ]);
  return { profile, experience, education, cases, stack, contact, ui, copy, repos };
}
