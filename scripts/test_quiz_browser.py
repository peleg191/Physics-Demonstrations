"""Real Firefox click tests, using its built-in Marionette protocol (no packages).

Run `npm run test:browser`. FIREFOX_BIN or --firefox can select a Firefox binary.
The test uses an isolated temporary profile and serves only public/ on localhost.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer
from serve import make_handler


class Marionette:
    def __init__(self, connection):
        self.connection = connection
        self.connection.settimeout(20)
        self.sequence = 0
        self.read()

    def read(self):
        length = b''
        while True:
            byte = self.connection.recv(1)
            if not byte:
                raise RuntimeError('Firefox closed the automation connection')
            if byte == b':':
                break
            length += byte
        remaining = int(length)
        data = bytearray()
        while remaining:
            chunk = self.connection.recv(remaining)
            if not chunk:
                raise RuntimeError('Incomplete Firefox response')
            data.extend(chunk)
            remaining -= len(chunk)
        return json.loads(data)

    def command(self, name, parameters=None):
        self.sequence += 1
        data = json.dumps([0, self.sequence, name, parameters or {}]).encode()
        self.connection.sendall(str(len(data)).encode() + b':' + data)
        response = self.read()
        if response[2]:
            raise AssertionError(f'{name}: {response[2]}')
        result = response[3]
        return result.get('value') if isinstance(result, dict) and set(result) == {'value'} else result

    def evaluate(self, expression):
        return self.command('WebDriver:ExecuteScript', {'script': f'return ({expression});', 'args': [], 'newSandbox': False, 'sandbox': None})

    def wait(self, expression, seconds=10):
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            if self.evaluate(expression):
                return
            time.sleep(0.05)
        raise AssertionError(f'Timed out: {expression}')

    def click(self, selector):
        self.wait(f'''(()=>{{const el=document.querySelector({json.dumps(selector)});return el && !el.disabled && el.getBoundingClientRect().height>0;}})()''')
        element = self.command('WebDriver:FindElement', {'using': 'css selector', 'value': selector})
        element_id = next(value for key, value in element.items() if key.startswith('element-') or key == 'ELEMENT')
        self.command('WebDriver:ElementClick', {'id': element_id})


def run(browser, url, artifacts=None):
    def screenshot(name):
        if artifacts:
            path = Path(artifacts)
            path.mkdir(parents=True, exist_ok=True)
            data = browser.command('WebDriver:TakeScreenshot', {'id': None, 'highlights': [], 'full': False})
            (path / f'{name}.png').write_bytes(base64.b64decode(data))
    browser.command('WebDriver:NewSession', {'capabilities': {'alwaysMatch': {'acceptInsecureCerts': True}}})
    browser.command('WebDriver:SetWindowRect', {'width': 1440, 'height': 1000})
    browser.command('WebDriver:Navigate', {'url': url})
    browser.wait("document.querySelector('.experiment-card.spring') !== null")
    assert browser.evaluate("document.querySelector('.achievements summary').textContent.includes('0 of 14')")
    browser.evaluate("(()=>{document.querySelector('main > .achievements').scrollIntoView({block:'start'}); return true;})()")
    screenshot('physics-journey-desktop')
    browser.click('.experiment-card.spring')
    browser.wait("document.querySelector('#spring-mass') !== null")
    browser.click('.quiz-launcher')
    screenshot('quiz-desktop')
    browser.click('.quiz-modes button:nth-child(2)')  # Experiment challenges.
    for challenge in range(2):
        browser.wait("document.querySelector('.quiz-action') !== null")
        state = browser.evaluate("JSON.parse(localStorage.getItem('physics-quiz-progress-v1-spring')).active")
        question_id = state['ids'][state['index']]
        # Correct answer positions in the authored spring experiment questions.
        correct = {'spring-2': 2, 'spring-4': 1, 'spring-8': 2}[question_id]
        browser.click(f'.quiz-options input[value="{correct}"]')
        browser.click('.quiz-action')
        browser.wait("!document.querySelector('.experiment-coach').hidden && !document.querySelector('.quiz-window').hidden")
        assert browser.evaluate("document.querySelector('.coach-next').textContent") == 'Run A'
        for setup in range(2):
            browser.click('.coach-next')
            assert browser.evaluate("document.querySelector('.selectable-mass').getAttribute('aria-pressed')") == 'true'
            before = browser.evaluate("document.querySelector('.selectable-mass').getAttribute('transform')")
            browser.wait(f"document.querySelector('.selectable-mass').getAttribute('transform') !== {json.dumps(before)}")
            if challenge == 0 and setup == 0:
                browser.click('.coach-run[data-run=\"0\"]')
                assert browser.evaluate("document.querySelector('.transport .primary').textContent") == 'Play'
                assert browser.evaluate("document.querySelector('.coach-next').textContent") == 'Continue playback'
                browser.click('.coach-next')
            expected = [2, 8] if question_id == 'spring-2' else [2, 2]
            assert browser.evaluate("Number(document.querySelector('#spring-mass').value)") == expected[setup]
            if question_id == 'spring-8':
                assert browser.evaluate("Number(document.querySelector('#spring-stiffness').value)") == [20, 80][setup]
            browser.wait(f"JSON.parse(localStorage.getItem('physics-quiz-progress-v1-spring')).active.current.observed[{setup}] === true")
            assert browser.evaluate("!document.querySelector('.experiment-coach').hidden && !document.querySelector('.quiz-window').hidden")
            assert browser.evaluate(f"JSON.parse(localStorage.getItem('physics-quiz-progress-v1-spring')).active.current.observedTimes[{setup}] > 0.2")
            assert browser.evaluate("document.querySelector('.transport .primary').textContent") == 'Play'
            if artifacts and challenge == 0 and setup == 0:
                screenshot('challenge-observe-desktop')
        browser.click('.coach-next')
        browser.wait("!document.querySelector('.quiz-window').hidden")
        assert browser.evaluate("document.querySelector('.quiz-options legend').textContent.startsWith('Why')")
        reason_correct = {'spring-2': 1, 'spring-4': 0}[question_id]
        browser.click(f'.quiz-options input[value="{reason_correct}"]')
        if challenge == 0:
            screenshot('challenge-explain-desktop')
        browser.click('.quiz-action')
        assert browser.evaluate("document.querySelector('.quiz-feedback').textContent.startsWith('Correct.')")
        browser.click('.quiz-action')
    assert browser.evaluate("JSON.parse(localStorage.getItem('physics-quiz-progress-v1-spring')).investigations.length") == 2
    print('PASS: native quiz clicks load both setups and animate both spring prediction experiments')

    browser.click('.quiz-modes button:nth-child(1)')
    browser.click('.quiz-hint')
    browser.click('.quiz-options input[value="0"]')
    browser.command('WebDriver:Refresh')
    browser.wait("document.querySelector('.quiz-launcher') !== null")
    browser.click('.quiz-launcher')
    assert browser.evaluate("document.querySelector('.quiz-options input[value=\"0\"]').checked")
    assert browser.evaluate("!document.querySelector('.quiz-feedback').hidden")
    browser.click('#language')
    assert browser.evaluate("document.documentElement.dir") == 'rtl'
    assert browser.evaluate("document.querySelector('.quiz-options input[value=\"0\"]').checked")
    print('PASS: answers, hints, and progress survive refresh and language switching')

    browser.command('WebDriver:SetWindowRect', {'width': 390, 'height': 844})
    browser.click('.quiz-close')
    browser.click('.quiz-launcher')
    browser.click('.quiz-modes button:nth-child(2)')
    browser.click('.quiz-options input[value="2"]')
    browser.click('.quiz-action')
    browser.wait("!document.querySelector('.experiment-coach').hidden")
    browser.click('.coach-next')
    browser.wait("JSON.parse(localStorage.getItem('physics-quiz-progress-v1-spring')).active.current.observed[0]")
    assert browser.evaluate("!document.querySelector('.quiz-window').hidden && !document.querySelector('.experiment-coach').hidden")
    assert browser.evaluate("document.querySelector('.experiment-coach').getBoundingClientRect().right <= innerWidth + 1")
    screenshot('challenge-observe-mobile-hebrew')
    print('PASS: mobile Hebrew experiment controls work and reveal the canvas for observation')


    # Seed only this isolated test profile with one example of each earned tier.
    browser.evaluate("""(()=>{
      const levels=['explorer','investigator','mastery'];
      for (const [index,id] of ['basketball','pulley','incline'].entries()) {
        const count=index+1;
        const answers=Object.fromEntries(Array.from({length:count===3?10:count*3},(_,i)=>[id+'-'+(i+1),{seen:true,clean:true,solved:true,attempts:1}]));
        localStorage.setItem('physics-quiz-progress-v1-'+id,JSON.stringify({answers,review:{},investigations:index?[id+'-'+(id==='pulley'?7:6)]:[],sessions:1,earned:levels.slice(0,count),active:null}));
      }
      localStorage.setItem('physics-language','en'); return true;
    })()""")
    browser.command('WebDriver:SetWindowRect', {'width': 1440, 'height': 1000})
    browser.command('WebDriver:Navigate', {'url': url})
    browser.wait("document.querySelector('.experiment-card.incline[data-achievement-tier=gold]') !== null")
    colors = []
    for system, tier in [('basketball', 'bronze'), ('pulley', 'silver'), ('incline', 'gold')]:
        assert browser.evaluate(f"document.querySelector('.experiment-card.{system}').dataset.achievementTier") == tier
        assert browser.evaluate(f"document.querySelector('.achievement-demo:has(a[href=\"#/{system}\"])').dataset.achievementTier") == tier
        colors.append(browser.evaluate(f"getComputedStyle(document.querySelector('.experiment-card.{system} .achievement-star.is-earned svg')).fill"))
        assert browser.evaluate(f"getComputedStyle(document.querySelector('.experiment-card.{system}')).borderTopColor") != browser.evaluate("getComputedStyle(document.querySelector('.experiment-card.pendulum')).borderTopColor")
    assert len(set(colors)) == 3, 'Bronze, silver, and gold stars must have distinct rendered colors'
    browser.evaluate("(()=>{document.querySelector('main > .achievements').scrollIntoView({block:'start'}); return true;})()")
    screenshot('physics-journey-medals-desktop')

    # Firefox desktop windows have a minimum width. An actual iframe viewport
    # exercises smaller phone widths without mocking matchMedia or layout.
    for language in ['en', 'he']:
        for width in [320, 375, 430]:
            browser.evaluate(f"""(()=>{{
              document.querySelector('#phone-preview')?.remove();
              localStorage.setItem('physics-language',{json.dumps(language)});
              const frame=document.createElement('iframe'); frame.id='phone-preview';
              frame.style.cssText='position:fixed;inset:0 auto auto 0;width:{width}px;height:920px;border:0;z-index:9999;background:white';
              frame.src={json.dumps(url)}; document.body.append(frame); return true;
            }})()""")
            browser.wait("document.querySelector('#phone-preview').contentDocument.querySelectorAll('main > .achievements .achievement-demo').length === 14")
            layout = browser.evaluate("""(()=>{
              const frame=document.querySelector('#phone-preview'),doc=frame.contentDocument;
              const panel=doc.querySelector('main > .achievements'), width=doc.documentElement.clientWidth;
              const overflow=[panel,...panel.querySelectorAll('*')].filter(el=>{
                const r=el.getBoundingClientRect();return r.width>1 && r.height>1 && (r.left < -1 || r.right > width+1);
              }).map(el=>el.className.baseVal??el.className);
              const link=panel.querySelector('.achievement-demo>a');
              const heading=doc.querySelector('.experiment-card h3').getBoundingClientRect();
              const stars=doc.querySelector('.experiment-card .card-achievements').getBoundingClientRect();
              return {width:frame.contentWindow.innerWidth,contentWidth:width,overflow,linkHeight:link.getBoundingClientRect().height,titleAndStarsShareRow:stars.top<heading.bottom&&stars.bottom>heading.top};
            })()""")
            assert layout['width'] == width
            assert not layout['overflow'], f"{language} at {width}px: {layout['overflow']}"
            assert layout['linkHeight'] >= 44, 'Journey links must have a mobile touch target'
            assert layout['titleAndStarsShareRow'], 'Catalog stars must stay beside the title on phones'
            if width == 375:
                browser.evaluate("(()=>{document.querySelector('#phone-preview').contentDocument.querySelector('main > .achievements').scrollIntoView({block:'start'}); return true;})()")
                screenshot(f'physics-journey-medals-mobile-{language}')
            browser.evaluate(f"(()=>{{document.querySelector('#phone-preview').src={json.dumps(url + '#/spring')};return true;}})()")
            browser.wait("document.querySelector('#phone-preview').contentDocument.querySelector('#spring-mass') !== null")
            browser.evaluate("""(()=>{
              const doc=document.querySelector('#phone-preview').contentDocument;
              doc.querySelector('.quiz-launcher').click();doc.querySelector('.quiz-modes button:nth-child(2)').click();
              doc.querySelector('.quiz-options input[value="2"]').click();doc.querySelector('.quiz-action').click();return true;
            })()""")
            browser.wait("!document.querySelector('#phone-preview').contentDocument.querySelector('.experiment-coach').hidden")
            coach_layout = browser.evaluate("""(()=>{
              const doc=document.querySelector('#phone-preview').contentDocument,coach=doc.querySelector('.experiment-coach'),width=doc.documentElement.clientWidth;
              const overflow=[coach,...coach.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.width>1&&r.height>1&&(r.left < -1 || r.right > width+1);}).map(el=>el.className.baseVal??el.className);
              return {overflow,touch:coach.querySelector('.coach-next').getBoundingClientRect().height,hidden:doc.querySelector('.quiz-window').hidden};
            })()""")
            assert not coach_layout['overflow'], f"Challenge {language} at {width}px: {coach_layout['overflow']}"
            assert coach_layout['touch'] >= 44 and not coach_layout['hidden']
            if width == 375:
                screenshot(f'challenge-phone-{language}')
    browser.evaluate("(()=>{document.querySelector('#phone-preview').remove();return true;})()")
    print('PASS: bronze/silver/gold frames and stars; no journey overflow at 320, 375, or 430 px in English and Hebrew')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--firefox', default=os.environ.get('FIREFOX_BIN', shutil.which('firefox')))
    parser.add_argument('--artifacts', help='Optional directory for desktop and mobile screenshots')
    args = parser.parse_args()
    if not args.firefox:
        parser.error('Firefox is required; install it or set FIREFOX_BIN.')
    class QuietHandler(make_handler('/')):
        def log_message(self, *_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with socket.socket() as reserve:
        reserve.bind(('127.0.0.1', 0))
        port = reserve.getsockname()[1]
    # Snap Firefox has a private /tmp; put its isolated profile in a directory
    # visible to the launcher and the browser. Regular Firefox can use /tmp.
    snap_common = Path.home() / 'snap/firefox/common'
    profile_root = snap_common if Path('/snap/firefox/current').exists() and snap_common.is_dir() and not args.firefox.startswith('/snap/') else None
    with tempfile.TemporaryDirectory(prefix='physics-quiz-firefox-', dir=profile_root) as directory:
        profile = Path(directory) / 'profile'
        profile.mkdir()
        (profile / 'user.js').write_text(f'user_pref("marionette.port", {port});\nuser_pref("browser.shell.checkDefaultBrowser", false);\n')
        with (Path(directory) / 'firefox.log').open('w+') as log:
            process = subprocess.Popen([args.firefox, '--headless', '--no-remote', '--marionette', '--profile', str(profile), 'about:blank'], stdout=log, stderr=log)
            connection = None
            try:
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        log.seek(0)
                        raise RuntimeError(f'Firefox did not start: {log.read()}')
                    try:
                        connection = socket.create_connection(('127.0.0.1', port), timeout=1)
                        break
                    except OSError:
                        time.sleep(0.1)
                if connection is None:
                    log.seek(0)
                    raise RuntimeError(f'Firefox automation did not start: {log.read()}')
                run(Marionette(connection), f'http://127.0.0.1:{server.server_port}/', args.artifacts)
            finally:
                if connection:
                    connection.close()
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                server.shutdown()


if __name__ == '__main__':
    main()
