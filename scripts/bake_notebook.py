"""Bake the notebook catalog artwork as ordinary SVG geometry, without filters."""
from pathlib import Path
import math
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ROOT = Path(__file__).resolve().parents[1] / 'public' / 'assets'


def pencil_path(points):
    commands = []
    for i, (x, y) in enumerate(points):
        if i not in (0, len(points) - 1):
            x += math.sin(i * 2.17) * .45
            y += math.cos(i * 1.73) * .45
        commands.append(f'{"L" if i else "M"} {x:.2f} {y:.2f}')
    return ' '.join(commands)


def bake(name):
    root = ET.fromstring((ROOT / f'{name}.svg').read_text())
    for parent in list(root.iter()):
        if parent.tag == f'{{{NS}}}defs':
            continue
        for node in list(parent):
            tag = node.tag.removeprefix(f'{{{NS}}}')
            if (tag == 'rect' and node.get('width') == '600' and node.get('height') == '360') or node.get('fill', '').startswith('url('):
                parent.remove(node)
                continue
            if tag not in ('path', 'rect', 'circle', 'ellipse', 'line', 'text'):
                continue
            if tag == 'text':
                node.set('fill', '#354d46')
                continue
            node.set('stroke-linecap', 'round')
            node.set('stroke-linejoin', 'round')
            fill = node.get('fill', 'none')
            if fill != 'none':
                node.set('fill-opacity', '.2')
                if not node.get('stroke'):
                    node.set('stroke', fill)
                    node.set('stroke-width', '1.8')
            stroke = node.get('stroke')
            if not stroke:
                continue
            node.set('stroke-width', str(min(float(node.get('stroke-width', '1')), 2.4)))
            if node.get('stroke-dasharray'):
                continue
            outline = None
            if tag in ('circle', 'ellipse'):
                cx, cy = float(node.get('cx', '0')), float(node.get('cy', '0'))
                rx = float(node.get('r' if tag == 'circle' else 'rx', '0'))
                ry = float(node.get('r' if tag == 'circle' else 'ry', '0'))
                if min(rx, ry) >= 4:
                    outline = pencil_path([(cx + rx * math.cos(i / 48 * 2 * math.pi), cy + ry * math.sin(i / 48 * 2 * math.pi)) for i in range(49)])
            elif tag == 'path':
                outline = node.get('d')
            elif tag == 'rect':
                x, y, w, h = [float(node.get(key, '0')) for key in ('x', 'y', 'width', 'height')]
                r = min(float(node.get('rx', '0')), w / 2, h / 2)
                points = []
                for cx, cy, angle in ((x+w-r, y+r, -math.pi/2), (x+w-r, y+h-r, 0), (x+r, y+h-r, math.pi/2), (x+r, y+r, math.pi)):
                    points += [(cx+r*math.cos(angle+i/6*math.pi/2), cy+r*math.sin(angle+i/6*math.pi/2)) for i in range(7)]
                outline = pencil_path(points + points[:1])
            if outline:
                ET.SubElement(parent, f'{{{NS}}}path', {'d': outline, 'fill': 'none', 'stroke': stroke, 'stroke-width': '.85', 'opacity': '.4', 'transform': 'translate(.45 .3)', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})
    destination = ROOT / 'notebook' / f'{name}.svg'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(ET.tostring(root, encoding='unicode') + '\n')


if __name__ == '__main__':
    for illustration in ('basketball', 'pulley', 'spring', 'pendulum', 'incline'):
        bake(illustration)
