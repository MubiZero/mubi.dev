import { getEntry } from 'astro:content';
import type { Locale } from './locale';

async function section<T extends 'profile' | 'experience' | 'education' | 'cases' | 'stack' | 'contact' | 'ui'>(
  collection: T,
  locale: Locale,
) {
  const entry = await getEntry(collection, locale);
  if (!entry) throw new Error(`missing ${collection} data for locale ${locale}`);
  return entry.data;
}

export async function loadPage(locale: Locale) {
  const [profile, experience, education, cases, stack, contact, ui] = await Promise.all([
    section('profile', locale),
    section('experience', locale),
    section('education', locale),
    section('cases', locale),
    section('stack', locale),
    section('contact', locale),
    section('ui', locale),
  ]);
  return { profile, experience, education, cases, stack, contact, ui };
}
