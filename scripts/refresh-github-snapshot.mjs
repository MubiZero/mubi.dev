import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const usage = `Usage:
  npm run refresh:github

Re-fetches the live GitHub state (repo list and commit calendar) and
overwrites the two committed snapshots that src/lib/github.ts reads at
build time. Exits with code 2 (no error) if nothing changed, so the
workflow that runs this can skip an empty commit.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

const OWNER = 'MubiZero';
const TIMEOUT_MS = 15000;

/**
 * Commits are matched on the author address, not on GitHub's own attribution.
 * GitHub only credits an address it has verified against the account, and the
 * work in these repositories was committed from several machines under several
 * addresses, so filtering by login would silently drop a large part of it.
 * A new address means a line here; nothing else discovers it.
 */
const AUTHORS = new Set([
  'mukhamedov044@gmail.com',
  'mukhamedov.m@eskhata.com',
  '46155247+mubizero@users.noreply.github.com',
  '46155247+mubi007@users.noreply.github.com',
]);
const DAY_MS = 24 * 60 * 60 * 1000;

const repoSnapshotPath = resolve('src/data/github-snapshot.json');
const contributionsSnapshotPath = resolve('src/data/github-contributions.json');

const token = process.env.GITHUB_TOKEN;

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function api(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: headers() });
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limited = response.status === 403 && remaining === '0';
    throw new Error(
      limited ? `GitHub rate limit exhausted for ${url}` : `GitHub responded ${response.status} for ${url}`,
    );
  }
  return response;
}

/**
 * Only repositories the owner wrote and anyone can read. The endpoint is
 * already public-only, but a token widens plenty of other GitHub endpoints,
 * so the private check is stated here rather than assumed: the page says
 * "public repositories" above this data, and nothing else may reach it.
 */
async function fetchRepoSnapshot() {
  const response = await api(`https://api.github.com/users/${OWNER}/repos?per_page=100&type=owner`);
  const live = await response.json();
  return live
    .filter((repo) => !repo.fork && !repo.private)
    .map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      language: repo.language,
      license: repo.license?.spdx_id ?? null,
      pushedAt: repo.pushed_at,
    }));
}

/**
 * The calendar used to be scraped from the profile page at
 * github.com/users/<owner>/contributions. That page is not a measure of
 * public work: when "include private contributions on my profile" is on,
 * GitHub folds private commits into the same squares, anonymised and
 * impossible to subtract. The site draws that calendar under a heading that
 * says "public repositories", so the two disagreed, and no amount of parsing
 * could tell them apart.
 *
 * Counting commits in the public repositories instead makes the claim true by
 * construction: every commit behind every square can be opened by the reader.
 * It is a narrower number than GitHub's own, which also counts issues, pull
 * requests and reviews, and it is meant to be. An unverifiable larger number
 * is worth less than a smaller one anybody can check.
 */
function calendarWindow(today = new Date()) {
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(to.getTime() - 364 * DAY_MS);
  // GitHub's calendar starts its weeks on Sunday and the page draws it the
  // same way, so the window starts on one too and the columns stay square.
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return { from: start, to };
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchCommitDays(repo, since, until) {
  const days = new Map();
  let url =
    `https://api.github.com/repos/${OWNER}/${repo}/commits` +
    `?since=${since}T00:00:00Z&until=${until}T23:59:59Z&per_page=100`;

  while (url) {
    let response;
    try {
      response = await api(url);
    } catch (error) {
      // 409 is how GitHub reports a repository with no commits at all, and
      // 404 a repository that went private or was renamed since the list was
      // read. Neither is a reason to abandon the other repositories.
      if (/responded 40[49]/.test(error.message)) return days;
      throw error;
    }

    for (const commit of await response.json()) {
      const email = commit.commit?.author?.email?.toLowerCase();
      // Bots and co-authors commit into these repositories too, and their work
      // is not the owner's to claim.
      if (!email || !AUTHORS.has(email)) continue;

      // The author date, not the committer date: a rebase rewrites the second
      // one, which would move old work onto the day it was replayed.
      const date = commit.commit?.author?.date;
      if (!date) continue;
      const day = date.slice(0, 10);
      days.set(day, (days.get(day) ?? 0) + 1);
    }

    const next = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/);
    url = next?.[1] ?? null;
  }

  return days;
}

/**
 * GitHub paints its squares by quartile rather than by a fixed scale, so a
 * quiet year still shows shape instead of one flat colour. The thresholds are
 * taken over active days only: counting the empty ones would put three
 * quarters of the year in the first bucket and flatten everything else.
 */
function levelsFor(counts) {
  const active = counts.filter(Boolean).sort((a, b) => a - b);
  if (active.length === 0) return counts.map(() => '0');

  const at = (fraction) => active[Math.min(active.length - 1, Math.floor(active.length * fraction))];
  const [first, second, third] = [at(0.25), at(0.5), at(0.75)];

  return counts.map((count) => {
    if (count === 0) return '0';
    if (count <= first) return '1';
    if (count <= second) return '2';
    if (count <= third) return '3';
    return '4';
  });
}

async function buildContributionsSnapshot(repos) {
  const { from, to } = calendarWindow();
  const [since, until] = [isoDay(from), isoDay(to)];

  const perRepo = await Promise.all(repos.map((repo) => fetchCommitDays(repo.name, since, until)));

  const byDay = new Map();
  for (const days of perRepo) {
    for (const [day, count] of days) byDay.set(day, (byDay.get(day) ?? 0) + count);
  }

  const span = Math.round((to - from) / DAY_MS) + 1;
  const counts = Array.from({ length: span }, (_, index) =>
    byDay.get(isoDay(new Date(from.getTime() + index * DAY_MS))) ?? 0,
  );

  return {
    from: since,
    to: until,
    // Names what the numbers are, so a reader of the JSON does not have to
    // guess and src/lib/github.ts can refuse a snapshot from the old source.
    source: 'public-commits',
    repos: repos.length,
    total: counts.reduce((sum, count) => sum + count, 0),
    levels: levelsFor(counts).join(''),
    counts,
  };
}

async function writeIfChanged(path, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = await readFile(path, 'utf8').catch(() => null);
  if (current === next) return false;
  await writeFile(path, next);
  return true;
}

const repos = await fetchRepoSnapshot();
const contributions = await buildContributionsSnapshot(repos);

const changed = await Promise.all([
  writeIfChanged(repoSnapshotPath, repos),
  writeIfChanged(contributionsSnapshotPath, contributions),
]);

if (!changed.some(Boolean)) {
  process.stdout.write('Snapshots already current; nothing written.\n');
  process.exit(2);
}

process.stdout.write(
  `Snapshots refreshed: ${contributions.total} commits across ${repos.length} public repositories.\n`,
);
