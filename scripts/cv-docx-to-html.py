"""Render the generated CV .docx into HTML that keeps the document's geometry,
so a browser can print it to PDF.

There is no LibreOffice in the build image, and shipping one to convert a
single one-page document would be a heavy dependency for a static site. The
document is written by scripts/build-cv.mjs, so its structure is known: a
handful of paragraph and run properties, one table at most, and positional
tabs. Reading those directly is smaller and more predictable than a general
converter, and it fails loudly on anything it was not built for.

Usage: python3 scripts/cv-docx-to-html.py <input.docx> <output.html>
"""

import html
import sys
import xml.etree.ElementTree as ET
import zipfile

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

TWIP = 1 / 20  # twips to points

source, destination = sys.argv[1], sys.argv[2]
archive = zipfile.ZipFile(source)
root = ET.fromstring(archive.read('word/document.xml'))

targets = {
    rel.get('Id'): rel.get('Target')
    for rel in ET.fromstring(archive.read('word/_rels/document.xml.rels'))
}


def prop(node, tag, attr='val', default=None):
    found = node.find(f'.//{W}{tag}') if node is not None else None
    return found.get(W + attr, default) if found is not None else default


def run_html(run):
    props = run.find(W + 'rPr')
    style = []
    if props is not None:
        size = prop(props, 'sz')
        if size:
            style.append(f'font-size:{int(size) / 2}pt')
        colour = prop(props, 'color')
        if colour:
            style.append(f'color:#{colour}')
        if props.find(W + 'b') is not None:
            style.append('font-weight:700')
        spacing = prop(props, 'spacing')
        if spacing:
            style.append(f'letter-spacing:{int(spacing) * TWIP}pt')

    text = ''.join(node.text or '' for node in run.iter(W + 't'))
    if not text:
        return ''
    return f'<span style="{";".join(style)}">{html.escape(text)}</span>'


def paragraph_html(par):
    props = par.find(W + 'pPr')
    style = ['margin:0']
    if props is not None:
        spacing = props.find(W + 'spacing')
        if spacing is not None:
            before = int(spacing.get(W + 'before', 0)) * TWIP
            after = int(spacing.get(W + 'after', 0)) * TWIP
            style.append(f'margin:{before}pt 0 {after}pt')
            line = spacing.get(W + 'line')
            if line:
                style.append(f'line-height:{int(line) * TWIP}pt')

        border = props.find(f'{W}pBdr/{W}bottom')
        if border is not None:
            width = int(border.get(W + 'sz', 6)) / 8
            style.append(f'border-bottom:{width}pt solid #{border.get(W + "color", "000000")}')
            style.append(f'padding-bottom:{int(border.get(W + "space", 0))}pt')

    bulleted = props is not None and props.find(W + 'numPr') is not None
    if bulleted:
        style.append('padding-left:10pt;text-indent:-7pt')

    # A right positional tab splits the line: what follows it belongs against
    # the right margin. Word lays that out with a tab stop; a browser needs a
    # row that pushes the two halves apart.
    head, tail, past_tab = [], [], False
    for child in par:
        if child.tag == W + 'hyperlink':
            target = targets.get(child.get(R + 'id'), '#')
            inner = ''.join(run_html(run) for run in child.findall(W + 'r'))
            markup = f'<a href="{html.escape(target)}" style="text-decoration:none">{inner}</a>'
            (tail if past_tab else head).append(markup)
        elif child.tag == W + 'r':
            if child.find(f'.//{W}ptab') is not None:
                past_tab = True
                continue
            (tail if past_tab else head).append(run_html(child))

    body = ''.join(head)
    if bulleted:
        body = '<span style="color:#5F6874">·&nbsp;&nbsp;</span>' + body
    if tail:
        body = (
            '<span style="display:flex;justify-content:space-between;'
            f'align-items:baseline;gap:12pt"><span>{body}</span>'
            f'<span style="white-space:nowrap">{"".join(tail)}</span></span>'
        )
    if not body.strip():
        return ''
    return f'<p style="{";".join(style)}">{body}</p>'


blocks = []
for node in root.find(W + 'body'):
    if node.tag == W + 'p':
        blocks.append(paragraph_html(node))
    elif node.tag == W + 'tbl':
        raise SystemExit('the CV no longer contains tables; update this renderer if it does again')

section = root.find(f'.//{W}sectPr')
page = section.find(W + 'pgSz')
margin = section.find(W + 'pgMar')
width = int(page.get(W + 'w')) * TWIP
height = int(page.get(W + 'h')) * TWIP
edges = {side: int(margin.get(W + side)) * TWIP for side in ('top', 'right', 'bottom', 'left')}

with open(destination, 'w', encoding='utf-8') as handle:
    handle.write(f"""<!doctype html><meta charset="utf-8">
<title>CV</title>
<style>
  @page {{
    size: {width:.0f}pt {height:.0f}pt;
    margin: {edges['top']:.0f}pt {edges['right']:.0f}pt {edges['bottom']:.0f}pt {edges['left']:.0f}pt;
  }}
  html, body {{ margin: 0; padding: 0; }}
  body {{
    font-family: Arial, 'Liberation Sans', Helvetica, sans-serif;
    color: #14181D;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  /* A heading stranded at the foot of a page reads as a section with nothing
     in it, and a single trailing line looks like a mistake. */
  p {{ orphans: 2; widows: 2; break-inside: avoid; }}
</style>
<body>{''.join(blocks)}</body>
""")

print(f'{destination}: {width:.0f}x{height:.0f}pt, {len(blocks)} blocks')
