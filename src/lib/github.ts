import snapshot from '../data/github-snapshot.json';
import contributionsSnapshot from '../data/github-contributions.json';

export interface RepoFacts {
  name: string;
  url: string;
  language: string | null;
  /** SPDX identifier, or null for a repository that carries no licence. */
  license: string | null;
  pushedAt: string;
}

const OWNER = 'MubiZero';
const API = `https://api.github.com/users/${OWNER}/repos?per_page=100&type=owner`;
const TIMEOUT_MS = 8000;

/**
 * Volatile repository facts, read at build time. Descriptions are not taken
 * from here: GitHub holds one language per repo, and a Russian page must not
 * fall back to English prose. Only the fields that go stale live here.
 *
 * The committed snapshot is the fallback, so a build without network access,
 * or one that hits the GitHub rate limit, still produces the page instead of
 * failing. It is the last known state, not invented data.
 */
/**
 * One request per build, not one per locale. Both pages render the same
 * component, and two independent fetches can fail independently: a build where
 * one call times out and the other does not would publish an English page and
 * a Russian page carrying different dates.
 */
let repoFacts: Promise<Map<string, RepoFacts>> | null = null;

export function loadRepoFacts(): Promise<Map<string, RepoFacts>> {
  repoFacts ??= fetchRepoFacts();
  return repoFacts;
}

async function fetchRepoFacts(): Promise<Map<string, RepoFacts>> {
  const facts = new Map<string, RepoFacts>();
  for (const repo of snapshot as RepoFacts[]) facts.set(repo.name, repo);

  try {
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(API, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

    const live = (await response.json()) as {
      name: string;
      html_url: string;
      language: string | null;
      license: { spdx_id: string } | null;
      pushed_at: string;
      fork: boolean;
      private: boolean;
    }[];

    for (const repo of live) {
      // The endpoint returns public repositories only, but a token widens
      // plenty of other GitHub endpoints. The section is headed "public
      // repositories", so the check is stated rather than assumed.
      if (repo.fork || repo.private) continue;
      facts.set(repo.name, {
        name: repo.name,
        url: repo.html_url,
        language: repo.language,
        license: repo.license?.spdx_id ?? null,
        pushedAt: repo.pushed_at,
      });
    }
  } catch (error) {
    console.warn(`[github] using the committed snapshot: ${(error as Error).message}`);
  }

  return facts;
}

export interface Contributions {
  from: string;
  to: string;
  /** How the numbers were produced. Only `public-commits` is accepted. */
  source: string;
  /** How many public repositories were counted. */
  repos: number;
  total: number;
  /** One digit per day, 0 to 4, in date order starting from `from`. */
  levels: string;
  /** Commits per day, same order and length as `levels`. */
  counts: number[];
}

/**
 * The calendar is read from the committed snapshot, which
 * scripts/refresh-github-snapshot.mjs rebuilds nightly by counting commits in
 * the owner's public repositories.
 *
 * It used to be scraped live from the profile page instead. That page cannot
 * support the claim this section makes: with "include private contributions on
 * my profile" enabled, GitHub folds private commits into the same squares,
 * anonymised, and nothing in the markup separates them again. Drawing that
 * under a heading reading "public repositories" overstated the case, so the
 * live fetch is gone rather than merely discouraged, and the build has no path
 * back to it.
 *
 * A snapshot from the old source is refused outright. Failing the build is the
 * right outcome: a number nobody can open and verify is worse than no number.
 */
export function loadContributions(): Promise<Contributions> {
  const snapshot = contributionsSnapshot as Contributions;
  if (snapshot.source !== 'public-commits') {
    throw new Error(
      `[github] the contribution snapshot claims source "${snapshot.source}"; ` +
        'run `npm run refresh:github` to rebuild it from the public repositories',
    );
  }
  return Promise.resolve(snapshot);
}

/**
 * Dates are assembled from parts rather than format(), because the Russian
 * short form appends a literal " г." that is noise in a column of dates.
 */
function joinParts(parts: Intl.DateTimeFormatPart[], wanted: Intl.DateTimeFormatPartTypes[]) {
  return wanted
    .map((type) => parts.find((part) => part.type === type)?.value ?? '')
    .filter(Boolean)
    .join(' ');
}

export function formatMonth(iso: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(iso));
  return joinParts(parts, ['month', 'year']);
}

export function formatDay(iso: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(iso));
  return joinParts(parts, ['day', 'month', 'year']);
}
