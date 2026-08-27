import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const usage = `Usage:
  npm run refresh:github

Re-fetches the live GitHub state (repo list and contribution calendar) and
overwrites the two committed snapshots that src/lib/github.ts falls back to
at build time. Exits with code 2 (no error) if nothing changed, so the
workflow that runs this can skip an empty commit.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

const OWNER = 'MubiZero';
const TIMEOUT_MS = 15000;

const repoSnapshotPath = resolve('src/data/github-snapshot.json');
const contributionsSnapshotPath = resolve('src/data/github-contributions.json');

async function fetchRepoSnapshot() {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100&type=owner`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub responded ${response.status} for the repo list`);

  const live = await response.json();
  return live
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      language: repo.language,
      license: repo.license?.spdx_id ?? null,
      pushedAt: repo.pushed_at,
    }));
}

// Mirrors parseCalendar() in src/lib/github.ts. Keep the two in sync: this
// script is what keeps the fallback that function reads current.
function parseCalendar(html) {
  const tooltips = new Map();
  for (const match of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g)) {
    const count = match[2].match(/^(\d+|No) contribution/);
    if (count) tooltips.set(match[1], count[1] === 'No' ? 0 : Number(count[1]));
  }

  const cells = [];
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

async function fetchContributionsSnapshot() {
  const response = await fetch(`https://github.com/users/${OWNER}/contributions`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`GitHub responded ${response.status} for the contribution calendar`);

  const parsed = parseCalendar(await response.text());
  if (!parsed) throw new Error('the calendar markup did not parse');
  return parsed;
}

async function writeIfChanged(path, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = await readFile(path, 'utf8').catch(() => null);
  if (current === next) return false;
  await writeFile(path, next);
  return true;
}

const [repos, contributions] = await Promise.all([fetchRepoSnapshot(), fetchContributionsSnapshot()]);

const changed = await Promise.all([
  writeIfChanged(repoSnapshotPath, repos),
  writeIfChanged(contributionsSnapshotPath, contributions),
]);

if (!changed.some(Boolean)) {
  process.stdout.write('Snapshots already current; nothing written.\n');
  process.exit(2);
}

process.stdout.write('Snapshots refreshed.\n');
