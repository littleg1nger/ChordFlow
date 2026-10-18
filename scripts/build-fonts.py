"""Rebuild checked-in local fonts. Requires fonttools[woff] and brotli.

Run from the repository root; downloads stay in .cache/font-sources.
The application build serves the prebuilt files and does not run Python.
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path('.cache/font-tools').resolve()))
from fontTools import subset
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

(target/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
