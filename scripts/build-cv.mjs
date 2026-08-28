import { readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { load } from 'js-yaml';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  PageOrientation,
  Paragraph,
  PositionalTab,
  PositionalTabAlignment,
  PositionalTabLeader,
  PositionalTabRelativeTo,
  TextRun,
} from 'docx';

const usage = `Usage:
  npm run build:cv [-- <output path>]

Builds the CV from the same content the site renders. Everything but the
CV-only material in src/data/cv-ru.yaml is read from src/content and
src/data, so the document cannot claim something the site contradicts.`;

if (process.argv.includes('--help')) {
  process.stdout.write(`${usage}\n`);
  process.exit(0);
}

const out = resolve(process.argv[2] ?? 'cv/MukhamedovM_CV.docx');

const yaml = (path) => load(readFileSync(resolve(path), 'utf8'));

const profile = yaml('src/content/profile/ru.yaml');
const contact = yaml('src/content/contact/ru.yaml');
const copy = yaml('src/content/copy/ru.yaml');
const stack = yaml('src/content/stack/ru.yaml');
const experience = yaml('src/content/experience/ru.yaml');
const education = yaml('src/content/education/ru.yaml');
const cv = yaml('src/data/cv-ru.yaml');

/**
 * The site's light palette, because paper is a light ground. The dark-theme
 * accent (#f2a33c) sits at roughly 1.9:1 on white and would be decoration
 * rather than text; tokens.css already carries #8f5200 for exactly this case.
 */
const INK = '14181D';
const MUTED = '5F6874';
const LINE = 'CDD3DB';
const ACCENT = '8F5200';

/**
 * One typeface, named explicitly. The previous version of this CV specified
 * none at all, which left every reader's Word to pick its own default -
 * Calibri, Aptos, Arial depending on the version - and with it the line breaks
 * and the page count. Arial is on every machine that will open this, and it is
 * the face the email signature already uses.
 */
const FONT = 'Arial';

const A4 = { width: 11906, height: 16838 };
const MARGIN = { top: 560, bottom: 480, left: 850, right: 850 };
const TEXT_WIDTH = A4.width - MARGIN.left - MARGIN.right;

const half = (points) => points * 2;

function text(value, options = {}) {
  return new TextRun({ text: value, font: FONT, ...options });
}

/** A right-aligned date on the same line as its heading, without tab guesswork. */
function rightTab() {
  return new TextRun({
    children: [
      new PositionalTab({
        alignment: PositionalTabAlignment.RIGHT,
        relativeTo: PositionalTabRelativeTo.MARGIN,
        // Required by the schema even when nothing is drawn: Word rejects a
        // ptab without it, and the validator catches what Word would not open.
        leader: PositionalTabLeader.NONE,
      }),
    ],
  });
}

function sectionHeading(title) {
  return new Paragraph({
    spacing: { before: 120, after: 50 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 4, color: LINE } },
    children: [text(title.toUpperCase(), { bold: true, size: half(10), color: INK, characterSpacing: 24 })],
  });
}

function body(value, options = {}) {
  return new Paragraph({
    spacing: { after: 40, line: 242 },
    ...options,
    children: [text(value, { size: half(10), color: INK })],
  });
}

function bullet(value) {
  return new Paragraph({
    numbering: { reference: 'cv-bullets', level: 0 },
    spacing: { after: 26, line: 242 },
    children: [text(value, { size: half(10), color: INK })],
  });
}

/** "Role · Employer" on the left, the period pushed to the right margin. */
function roleLine(role, employer, period) {
  return new Paragraph({
    spacing: { before: 110, after: 30 },
    children: [
      text(role, { bold: true, size: half(10.5), color: INK }),
      text('  ·  ', { size: half(10.5), color: MUTED }),
      text(employer, { size: half(10.5), color: INK }),
      rightTab(),
      text(period, { size: half(9.5), color: MUTED }),
    ],
  });
}

/**
 * No mark on the CV. A logo beside a name on a one-page document is a brand
 * asserting itself where the reader is looking for a person, and the site and
 * the email signature already carry it.
 */
function header() {
  return [
    new Paragraph({
      spacing: { after: 20 },
      children: [text(profile.name, { bold: true, size: half(17), color: INK })],
    }),
    new Paragraph({ children: [text(cv.target, { size: half(11), color: MUTED })] }),
  ];
}

function link(label, url) {
  return new ExternalHyperlink({
    link: url,
    children: [text(label, { size: half(9.5), color: ACCENT })],
  });
}

const SEPARATOR = () => text('   ·   ', { size: half(9.5), color: LINE });

function contactLines() {
  const site = 'https://mubi.dev';
  return [
    new Paragraph({
      spacing: { before: 140, after: 40 },
      children: [
        link(contact.email, `mailto:${contact.email}`),
        SEPARATOR(),
        link('mubi.dev', site),
        SEPARATOR(),
        text(cv.location, { size: half(9.5), color: MUTED }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: contact.links.flatMap((entry, index) => [
        ...(index ? [SEPARATOR()] : []),
        link(entry.url.replace(/^https:\/\/(www\.)?/, ''), entry.url),
      ]),
    }),
  ];
}

/**
 * The only amber on the page, and the site's own rule for it: the accent is
 * reserved for measured results. A rule or a heading painted in it would spend
 * the colour on decoration and leave nothing to mark the numbers with.
 */
function proof() {
  return copy.proof.map((entry) =>
    new Paragraph({
      spacing: { after: 40, line: 242 },
      children: [
        text(entry.metric.replace('->', '→'), { bold: true, size: half(10), color: ACCENT }),
        text('   ', { size: half(10) }),
        text(entry.label, { size: half(10), color: MUTED }),
      ],
    }),
  );
}

function skills() {
  const omit = new Set(cv.stackOmit ?? []);
  return stack.groups.map((group) =>
    new Paragraph({
      spacing: { after: 40, line: 242 },
      children: [
        text(`${group.label[0].toUpperCase()}${group.label.slice(1)}: `, {
          bold: true,
          size: half(10),
          color: INK,
        }),
        text(group.items.filter((item) => !omit.has(item)).join(', '), { size: half(10), color: INK }),
      ],
    }),
  );
}

function experienceSection() {
  const unused = new Set(Object.keys(cv.extraLines ?? {}));
  const paragraphs = [];

  // entries, not printEntries: the latter is the site's condensed print card,
  // which folds the two bank roles into one line and drops most of the
  // history. A CV is read on its own and has to carry the whole progression.
  for (const entry of experience.entries) {
    const extra = cv.extraLines?.[entry.role] ?? [];
    unused.delete(entry.role);
    paragraphs.push(roleLine(entry.role, entry.employer, entry.period));
    for (const line of [...entry.lines, ...extra]) paragraphs.push(bullet(line));
  }

  if (unused.size) {
    throw new Error(
      `cv-ru.yaml adds lines to roles that no longer exist: ${[...unused].join(', ')}. ` +
        'Rename the key to match src/content/experience/ru.yaml, or drop it.',
    );
  }

  return paragraphs;
}

function projects() {
  return cv.projects.map((entry) => body(entry));
}

function educationSection() {
  // The institution carries the date; the degree gets its own line. Putting
  // both on one line pushes the date into the middle of a wrap, where it reads
  // as an interruption rather than as a column.
  return education.entries.flatMap((entry) => [
    new Paragraph({
      spacing: { before: 110, after: 20 },
      children: [
        text(entry.institution, { bold: true, size: half(10.5), color: INK }),
        rightTab(),
        text(entry.period, { size: half(9.5), color: MUTED }),
      ],
    }),
    body(entry.degree),
    ...(cv.showEducationDetails !== false && entry.details?.length
      ? [
          new Paragraph({
            spacing: { after: 40 },
            children: [text(entry.details.join(' · '), { size: half(9.5), color: MUTED })],
          }),
        ]
      : []),
  ]);
}

function certificates() {
  return cv.certificates.map((entry) =>
    new Paragraph({
      spacing: { after: 40, line: 242 },
      children: [
        text(entry.name, { size: half(10), color: INK }),
        text(` — ${entry.detail}`, { size: half(10), color: MUTED }),
        rightTab(),
        text(entry.period, { size: half(9.5), color: MUTED }),
      ],
    }),
  );
}

const document = new Document({
  creator: profile.name,
  title: `${profile.name} — ${cv.target}`,
  description: profile.manLine,
  styles: {
    default: {
      document: { run: { font: FONT, size: half(10), color: INK } },
    },
  },
  numbering: {
    config: [
      {
        reference: 'cv-bullets',
        levels: [
          {
            level: 0,
            format: 'bullet',
            text: '·',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 200, hanging: 140 } },
              run: { font: FONT, color: MUTED },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: A4.width, height: A4.height, orientation: PageOrientation.PORTRAIT },
          margin: MARGIN,
        },
      },
      children: [
        ...header(),
        ...contactLines(),
        sectionHeading('О себе'),
        body(cv.summary),
        ...(cv.showProof === false ? [] : [sectionHeading('Результаты'), ...proof()]),
        sectionHeading('Ключевые навыки'),
        ...skills(),
        sectionHeading('Опыт работы'),
        ...experienceSection(),
        sectionHeading('Проекты'),
        ...projects(),
        sectionHeading('Образование'),
        ...educationSection(),
        sectionHeading('Сертификаты'),
        ...certificates(),
      ],
    },
  ],
});

await mkdir(dirname(out), { recursive: true });
await writeFile(out, await Packer.toBuffer(document));
process.stdout.write(`CV written to ${out}\n`);
