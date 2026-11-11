"""Check live light/dark SVG colors in every system and both illustration styles.

Run python3 scripts/test_canvas_browser.py [--artifacts /tmp/canvas-preview].
Uses the same isolated Firefox/local-server harness as the quiz browser checks.
"""
import base64
from pathlib import Path
import test_quiz_browser as harness

SYSTEMS = ['basketball', 'pulley', 'incline', 'pendulum', 'spring', 'elevator',
           'friction-stacked', 'friction-table', 'friction-hanging', 'double-spring',
           'carousel', 'rotating-tube', 'two-string', 'energy-bowl']

# Sample actual rendered SVG/MathML colors, including labels on filled bodies.
READ_COLORS = r'''(()=>{
 const svg=document.querySelector('.system-svg'), stage=document.querySelector('.stage');
 const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
 const lum=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const background=getComputedStyle(stage).backgroundColor;
 const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'};
 const text=[...svg.querySelectorAll('text,.friction-canvas-math')].filter(el=>visible(el)&&el.textContent.trim());
 const lowText=text.flatMap(el=>{
   let bg=background;
   const body=el.closest('.selectable-mass');
   const filled=body?.querySelector('.mass-body');
   if(filled&&!el.classList.contains('force-label')&&!document.documentElement.dataset.illustrationStyle.includes('notebook')) bg=getComputedStyle(filled).fill;
   const surface=svg.querySelector('.incline-surface,.friction-ground');
   if(surface&&el.closest('.incline-angle,.friction-angle-label')) bg=getComputedStyle(surface).fill;
   if(el.classList.contains('scale-reading')) bg=getComputedStyle(svg.querySelector('rect[y="340"]')).fill;
   const color=getComputedStyle(el)[el.tagName==='text'?'fill':'color'];
   const ratio=contrast(color,bg);
   return ratio<4.5?[{text:el.textContent,color,bg,ratio}]:[];
 });
 const arrows=[...svg.querySelectorAll('.canvas-forces path[stroke],.canvas-forces line[stroke],[stroke*="--scene-force-"]')].filter(visible);
 const brightSurfaces=[...svg.querySelectorAll('.incline-surface,.friction-ground')].filter(visible).filter(el=>lum(getComputedStyle(el).fill)>.15).map(el=>({class:el.getAttribute('class'),fill:getComputedStyle(el).fill}));
 return {background,luminance:lum(background),lowText,brightSurfaces,lowArrows:arrows.filter(el=>contrast(getComputedStyle(el).stroke,background)<3).map(el=>getComputedStyle(el).stroke),textCount:text.length};
})()'''


def run(browser, url, artifacts=None):
    browser.command('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {'acceptInsecureCerts': True}}})
    browser.command('WebDriver:SetWindowRect', {'width': 1440, 'height': 1000})
    failures = []
    for style in ['current', 'notebook']:
        for system in SYSTEMS:
            browser.command('WebDriver:Navigate', {'url': f'{url}?style={style}#/{system}'})
            browser.wait("document.querySelector('.system-svg [role=button]') !== null")
            if browser.evaluate("document.documentElement.dataset.theme") != 'light':
                browser.click('#theme')
            light = browser.evaluate("getComputedStyle(document.querySelector('.stage')).backgroundColor")
            # SVG groups have no HTML click box in Marionette; activate their keyboard handler.
            browser.evaluate("(()=>{const body=document.querySelector('.system-svg [role=button]');body.focus();body.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return true})()")
            if system == 'spring':
                browser.click('.transport .primary')
                browser.wait("parseFloat(document.querySelector('.metric-value').textContent)>0")
                browser.click('.transport .primary')
            time_before = browser.evaluate("document.querySelector('.metric-value').textContent")
            # Hold node identities to ensure changing themes doesn't remount or reset.
            browser.evaluate("(()=>{document.querySelector('.system-svg').dataset.themeProbe='same-scene';return true})()")
            browser.click('#theme')
            colors = browser.evaluate(READ_COLORS)
            assert colors['luminance'] < .06, (style, system, colors)
            assert colors['background'] != light
            assert not colors['brightSurfaces'], (style, system, colors['brightSurfaces'])
            if colors['lowText']:
                failures.append((style, system, colors['lowText']))
            if colors['lowArrows']:
                failures.append((style, system, colors['lowArrows']))
            assert colors['textCount'] > 0
            assert browser.evaluate("document.querySelector('.metric-value').textContent") == time_before
            if system in ['incline', 'energy-bowl']:
                browser.click(f'#{system}-resolve-forces')
                resolved = browser.evaluate(READ_COLORS)
                if resolved['lowText'] or resolved['lowArrows']:
                    failures.append((style, system, 'resolved forces', resolved))
            assert browser.evaluate("document.querySelector('.system-svg').dataset.themeProbe==='same-scene'")
            if artifacts and system in ['incline', 'friction-stacked', 'friction-table', 'friction-hanging', 'elevator', 'energy-bowl']:
                browser.evaluate("(()=>{document.querySelector('.stage').scrollIntoView({block:'center'});return true})()")
                output = Path(artifacts)
                output.mkdir(parents=True, exist_ok=True)
                data = browser.command('WebDriver:TakeScreenshot', {'id': None, 'highlights': [], 'full': False})
                (output / f'{style}-{system}-dark.png').write_bytes(base64.b64decode(data))
            browser.click('#theme')
            assert browser.evaluate("getComputedStyle(document.querySelector('.stage')).backgroundColor") == light
        print(f'Checked all 14 {style} canvases', flush=True)
    assert not failures, failures
    print('PASS: all canvases switch live with readable labels and force arrows in both styles')
    for style in ['current', 'notebook']:
        browser.command('WebDriver:Navigate', {'url': f'{url}?style={style}#/'})
        browser.wait("document.querySelector('img[data-illustration]') !== null")
        for level in range(2):
            browser.click(f'.level-tab:nth-child({level + 1})')
            for theme in ['light', 'dark']:
                if browser.evaluate("document.documentElement.dataset.theme") != theme:
                    browser.click('#theme')
                browser.wait("[...document.querySelectorAll('img[data-illustration]')].every(img=>img.complete&&img.naturalWidth>0)")
                images = browser.evaluate("[...document.querySelectorAll('img[data-illustration]')].map(img=>img.getAttribute('src'))")
                assert images
                for source in images:
                    assert ('/dark/' in source) == (theme == 'dark'), source
                    assert ('/notebook/' in source) == (style == 'notebook'), source
                if artifacts and theme == 'dark':
                    browser.evaluate("(()=>{document.querySelector('.catalog-grid').scrollIntoView({block:'start'});return true})()")
                    data = browser.command('WebDriver:TakeScreenshot', {'id': None, 'highlights': [], 'full': False})
                    (Path(artifacts) / f'{style}-catalog-{level}-dark.png').write_bytes(base64.b64decode(data))
        # Switching illustration styles while dark must keep the dark asset variant.
        browser.click('#illustration-style')
        browser.wait("[...document.querySelectorAll('img[data-illustration]')].every(img=>img.complete&&img.naturalWidth>0)")
        images = browser.evaluate("[...document.querySelectorAll('img[data-illustration]')].map(img=>img.getAttribute('src'))")
        assert all('/dark/' in source and ('/notebook/' in source) == (style == 'current') for source in images)
    print('PASS: every catalog SVG loads and follows live theme/style changes in both catalog levels')



if __name__ == '__main__':
    harness.run = run
    harness.main()
