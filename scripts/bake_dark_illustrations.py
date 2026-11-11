"""Generate dark catalog SVGs from the original and baked notebook artwork.

Run after bake_notebook.py when the source illustrations change. Geometry,
opacity, and pencil outlines are preserved; only the illustration palette changes.
"""
from pathlib import Path
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ROOT = Path(__file__).resolve().parents[1] / 'public' / 'assets'
PALETTE = {}


def colors(target, originals):
    for original in originals.split():
        PALETTE[original] = target


colors('#19271f', '#eeeee5')
colors('#23332c', '#f4efe5 #e8ede1')
colors('#34483c', '#e5e7d9 #dce3d1 #d1dac8')
colors('#8db99c', '#61816b #6f8e65 #a9bca0 #7e947a #536d55 #64836b')
colors('#a6c5b5', '#3c5e49 #476b60 #5f796b')
colors('#dbab7b', '#c38e60 #d3a374 #e7a16a #e8d3b6 #c99566')
colors('#c6a07c', '#775c45 #ad8959 #b59a79 #ba7950 #c18353 #a56d45 #b18c59')
colors('#92ad9a', '#839775 #71846f #829579 #90a087 #8c9c85')
colors('#b2c4b7', '#c4c7b7 #a3ac94 #9baa90 #a5b29b #9ca79c #bfcdbd #9ead94 #b3c0a8 #bdc9b5 #e3e7dc')
colors('#648071', '#c9cbbc')
colors('#f0c271', '#b77820 #9a642e #a56c3c')
colors('#83c6f5', '#174d77')
colors('#82d4b4', '#347b86')
colors('#f6a17b', '#9a451b')
colors('#dcacec', '#7a4e86')
colors('#e4eee7', '#354d46 #fff #ffffff70')


def bake(source, notebook=False):
    root = ET.fromstring(source.read_text())
    for node in root.iter():
        for attr in ['fill', 'stroke']:
            value = node.get(attr)
            if value and value.startswith('#'):
                if value not in PALETTE:
                    raise ValueError(f'{source.name}: unmapped {attr} color {value}')
                node.set(attr, PALETTE[value])
        if node.tag == f'{{{NS}}}text':
            # Solid mass fills need dark lettering; notebook fills are translucent.
            if not notebook and (node.text or '').strip() == 'm':
                node.set('fill', '#14251f')
            elif (node.text or '').strip() in ['α', 'θ']:
                node.set('fill', '#f0c271')
                node.set('stroke', '#19271f')
                node.set('stroke-width', '3')
                node.set('stroke-linejoin', 'round')
                node.set('paint-order', 'stroke fill')
            elif node.get('fill') != '#83c6f5':
                node.set('fill', '#e4eee7')
    destination = source.parent / 'dark' / source.name
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(ET.tostring(root, encoding='unicode') + '\n')


if __name__ == '__main__':
    count = 0
    for directory in [ROOT, ROOT / 'notebook']:
        for source in sorted(directory.glob('*.svg')):
            if source.stem != 'favicon':
                bake(source, notebook=directory.name == 'notebook')
                count += 1
    print(f'Generated {count} dark catalog illustrations.')
