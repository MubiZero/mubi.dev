import { getEntry } from 'astro:content';
import type { Locale } from './locale';

/**
 * Each collection is fetched by its own literal name rather than through a
 * generic helper: a helper parameterised over the collection name collapses
 * every schema into one union, and each caller then has to narrow a type the
 * build already knows exactly.
 */
function required<T>(entry: { data: T } | undefined, collection: string, locale: Locale): T {
  if (!entry) throw new Error(`missing ${collection} data for locale ${locale}`);
  return entry.data;
}

export async function loadSitePage(locale: Locale) {
  const [profile, experience, education, cases, stack, contact, ui, copy, repos, projects, languages] =
    await Promise.all([
      getEntry('profile', locale),
      getEntry('experience', locale),
      getEntry('education', locale),
      getEntry('cases', locale),
      getEntry('stack', locale),
      getEntry('contact', locale),
      getEntry('ui', locale),
      getEntry('copy', locale),
      getEntry('repos', locale),
      getEntry('projects', locale),
      getEntry('languages', locale),
    ]);

  return {
    profile: required(profile, 'profile', locale),
    experience: required(experience, 'experience', locale),
    education: required(education, 'education', locale),
    cases: required(cases, 'cases', locale),
    stack: required(stack, 'stack', locale),
    contact: required(contact, 'contact', locale),
    ui: required(ui, 'ui', locale),
    copy: required(copy, 'copy', locale),
    repos: required(repos, 'repos', locale),
    projects: required(projects, 'projects', locale),
    languages: required(languages, 'languages', locale),
  };
}
