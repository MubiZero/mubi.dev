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
      // plenty of other GitHub endpoints, and the list this feeds is of public
      // work. The check is stated rather than assumed.
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
  total: number;
  /** One digit per day, 0 to 4, in date order starting from `from`. */
  levels: string;
  /** Contributions per day, same order and length as `levels`. */
  counts: number[];
}

const CALENDAR = `https://github.com/users/${OWNER}/contributions`;

/**
 * Per-day counts come from the cell tooltips, not from the headline number.
 * Without them the page could only ever state a yearly total, and any shorter
 * window it draws would be captioned with a figure that does not match it.
 */
function parseCalendar(html: string): Contributions | null {
  const tooltips = new Map<string, number>();
  for (const match of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g)) {
    const count = match[2].match(/^(\d+|No) contribution/);
    if (count) tooltips.set(match[1], count[1] === 'No' ? 0 : Number(count[1]));
  }

  const cells: { date: string; level: string; count: number }[] = [];
  for (const [tag] of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
    const level = tag.match(/data-level="(\d)"/);
    const id = tag.match(/id="([^"]+)"/);
    if (!date || !level || !id) continue;
    const count = tooltips.get(id[1]);
    if (count === undefined) continue;
    cells.push({ date: date[1], level: level[1], count });
  }

  if (cells.length < 300) return null;
  cells.sort((a, b) => a.date.localeCompare(b.date));

  return {
    from: cells[0].date,
    to: cells[cells.length - 1].date,
    total: cells.reduce((sum, cell) => sum + cell.count, 0),
    levels: cells.map((cell) => cell.level).join(''),
    counts: cells.map((cell) => cell.count),
  };
}

/**
 * The contribution calendar, read at build time from the profile page. That
 * page is the only source that counts every repository rather than the public
 * ones: the REST API does not expose the calendar at all, and building it from
 * commits can only reach repositories the build is allowed to read. Private
 * work arrives anonymised - a count with nothing behind it - which is the
 * trade for showing the whole year instead of a slice of it.
 *
 * It is markup parsing, so a redesign can break it; a failed or unrecognisable
 * response falls back to the committed snapshot rather than throwing, and the
 * caption always states the period covered, so a stale fallback is visible
 * rather than silent.
 */
let contributions: Promise<Contributions> | null = null;

/** Memoised for the same reason as loadRepoFacts. */
export function loadContributions(): Promise<Contributions> {
  contributions ??= fetchContributions();
  return contributions;
}

async function fetchContributions(): Promise<Contributions> {
  try {
    const response = await fetch(CALENDAR, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'text/html' },
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

    const parsed = parseCalendar(await response.text());
    if (!parsed) throw new Error('the calendar markup did not parse');
    return parsed;
  } catch (error) {
    console.warn(`[github] contributions from snapshot: ${(error as Error).message}`);
    return contributionsSnapshot as Contributions;
  }
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
