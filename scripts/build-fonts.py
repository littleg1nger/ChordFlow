"""Rebuild checked-in local fonts. Requires fonttools[woff] and brotli.

Run from the repository root; downloads stay in .cache/font-sources.
The application build serves the prebuilt files and does not run Python.
"""
import hashlib
import html
import io
import json
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path('.cache/font-tools').resolve()))
from fontTools import subset
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

cache=Path('.cache/font-sources')
target=Path('public/fonts')
cache.mkdir(parents=True,exist_ok=True)
target.mkdir(parents=True,exist_ok=True)

def download(url,filename):
    path=cache/filename
    if not path.exists():
        with urllib.request.urlopen(url,timeout=90) as response:
            path.write_bytes(response.read())
    return path

def copy_license(source,destination):
    # Preserve every word of the original notice, normalize line endings/spacing.
    text=source.read_text(encoding='utf-8')
    destination.write_bytes(('\n'.join(line.rstrip() for line in text.splitlines())+'\n').encode('utf-8'))

sources={
    'geist':('https://raw.githubusercontent.com/google/fonts/main/ofl/geist/Geist%5Bwght%5D.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/geist/OFL.txt'),
    'noto-sans-sc':('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt'),
}
ui=''.join(p.read_text(encoding='utf-8') for p in Path('src').rglob('*') if p.suffix in {'.ts','.tsx'})
characters=''.join(sorted(set(ui)))
manifest=[]
for name,(url,license_url) in sources.items():
    path=download(url,name+'.ttf')
    font=TTFont(path,recalcTimestamp=False)
    text=''.join(chr(i) for i in range(32,383)) if name=='geist' else ''.join(c for c in characters if ord(c)>383)
    options=subset.Options()
    options.flavor='woff2'
    options.layout_features=['kern','liga','calt','tnum']
    options.name_IDs=['*']
    worker=subset.Subsetter(options=options)
    worker.populate(text=text)
    worker.subset(font)
    family='Chordflow Sans' if name=='geist' else 'Chordflow Sans SC'
    for record in font['name'].names:
        if record.nameID in (1,3,4,6,16):
            value=family.replace(' ','') if record.nameID==6 else family
            record.string=value.encode(record.getEncoding())
    font.flavor='woff2'
    output=target/(name+'-ui.woff2')
    font.save(output)
    copy_license(download(license_url,name+'-OFL.txt'),target/(name+'-OFL.txt'))
    manifest.append({'file':output.name,'source':url,'sourceSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'family':family})

# Only the two logo glyphs are outlined. No display-font runtime request is needed.
assets='https://github.com/atelier-anchor/smiley-sans/releases/expanded_assets/v2.0.1'
with urllib.request.urlopen(assets,timeout=45) as response:
    listing=response.read().decode()
href=next(html.unescape(x) for x in re.findall(r'href="([^"]+)"',listing) if '/download/' in x and x.endswith('.zip'))
url='https://github.com'+href if href.startswith('/') else href
archive=zipfile.ZipFile(download(url,'smiley-sans-v2.0.1.zip'))
font_file=next(n for n in archive.namelist() if n.endswith('.ttf'))
font=TTFont(io.BytesIO(archive.read(font_file)))
glyphs=font.getGlyphSet()
paths=[]
left=0
bounds=[]
for character in '和序':
    glyph=glyphs[font.getBestCmap()[ord(character)]]
    pen=SVGPathPen(glyphs)
    glyph.draw(pen)
    box=BoundsPen(glyphs)
    glyph.draw(box)
    x0,y0,x1,y1=box.bounds
    bounds.append((x0+left,y0,x1+left,y1))
    paths.append(f'<path transform="translate({left} 0)" d="{pen.getCommands()}"/>')
    left+=glyph.width+25
x0=min(b[0] for b in bounds);y0=min(b[1] for b in bounds)
x1=max(b[2] for b in bounds);y1=max(b[3] for b in bounds)
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1-x0} {y1-y0}" fill="#20242b"><g transform="translate({-x0} {y1}) scale(1 -1)">{"".join(paths)}</g></svg>\n'
Path('public/wordmark.svg').write_bytes(svg.encode('utf-8'))
copy_license(download('https://raw.githubusercontent.com/atelier-anchor/smiley-sans/v2.0.1/LICENSE','smiley-sans-OFL.txt'),target/'smiley-sans-OFL.txt')
manifest.append({'file':'../wordmark.svg','source':url,'font':font_file,'sha256':hashlib.sha256(svg.encode()).hexdigest()})
(target/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
