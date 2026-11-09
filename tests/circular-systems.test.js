import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { defaults, tubeState, twoStringState, bowlState, duration } from '../public/js/demos/circular/physics.js';
import { demonstrations } from '../public/js/registry.js';
import { browserFixture } from './dom-fixture.js';
setMaxListeners(0);
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const hasClass = className => node => (node.getAttribute('class') || node.className || '').split(' ').includes(className);

test('tube: friction threshold, hertz conversion and radius bound match the force balance', () => {
  const params = defaults['rotating-tube'], state = tubeState(params, 0.3);
  near(state.maximumFrequency, Math.sqrt(2) / (2 * Math.PI));
  near(state.normal, params.mass * 10); near(state.required, params.mass * state.omega ** 2 * params.radius);
  assert.equal(state.valid, true);
  assert.equal(tubeState({ ...params, frequency: 1 }, 0).valid, false);
  near(tubeState({ ...params, frequency: 1 }, 0).maximumRadius, 2 / (4 * Math.PI ** 2));
  const threshold = { ...params, frequency: state.maximumFrequency };
  assert.equal(tubeState(threshold, 0).valid, true);
  assert.equal(tubeState({ ...threshold, frequency: threshold.frequency * 1.00001 }, 0).valid, false);
  for (const mass of [1, 15, 30]) {
    const result = tubeState({ ...params, mass }, 0);
    near(result.maximumFrequency, state.maximumFrequency); near(result.limit, mass * 2);
  }
  const unsupported = tubeState({ ...params, friction: 0 }, 0.5);
  assert.equal(unsupported.valid, false); near(unsupported.phase, 0); near(unsupported.velocity, 0);
});

test('two strings: geometry, independent force balances, and slack-string boundary', () => {
  const params = { ...defaults['two-string'], frequency: 5 }, state = twoStringState(params, 0.1);
  near(state.radius, Math.sqrt(3) / 2); near(state.alpha, Math.PI / 6);
  near(state.speed, 5 * Math.PI * Math.sqrt(3));
  near(state.upper, 50 * Math.PI ** 2 + 10); near(state.lower, 50 * Math.PI ** 2 - 10);
  for (const length of [0.5, 1, 3]) for (const separation of [0.2 * length, length, 1.9 * length]) {
    const result = twoStringState({ ...params, length, separation }, 0.2);
    near((result.upper - result.lower) * Math.sin(result.alpha), params.mass * 10);
    near((result.upper + result.lower) * Math.cos(result.alpha), params.mass * result.omega ** 2 * result.radius);
    near(result.radius ** 2 + separation ** 2 / 4, length ** 2);
    assert.equal(result.valid, true);
  }
  const boundary = { ...params, frequency: state.minimumFrequency };
  near(twoStringState(boundary, 0).lower, 0);
  assert.equal(twoStringState(boundary, 0).valid, true);
  const unsupported = twoStringState({ ...boundary, frequency: boundary.frequency / 2 }, 0.5);
  assert.equal(unsupported.valid, false); assert.ok(unsupported.lower < 0); near(unsupported.phase, 0);
});

test('bowl: full nonlinear motion conserves energy, stays in contact and gives A/B/C accelerations', () => {
  for (const mass of [1, 15]) for (const radius of [0.2, 1, 3]) for (const releaseAngle of [10, 45, 90]) {
    const params = { mass, radius, releaseAngle }, initial = bowlState(params, 0);
    near(initial.speed, 0); near(initial.theta, releaseAngle * Math.PI / 180);
    for (const fraction of [0.01, 0.13, 0.25, 0.37, 0.5, 0.75, 0.91, 1]) {
      const state = bowlState(params, initial.period * fraction);
      near(state.kinetic + state.potential, initial.total);
      near(state.normal - mass * 10 * Math.cos(state.theta), mass * state.centripetal);
      near(state.tangential, -10 * Math.sin(state.theta));
      assert.ok(state.normal >= -1e-8); assert.ok(Math.abs(state.theta) <= initial.theta + 1e-8);
    }
    const bottom = bowlState(params, initial.quarter);
    near(bottom.theta, 0); near(bottom.potential, 0); near(bottom.kinetic, initial.total);
    near(bowlState(params, initial.period / 2).theta, -initial.theta);
    near(bowlState({ ...params, radius: radius * 4 }, 0).period, initial.period * 2);
    near(duration('energy-bowl', params), initial.period * 2);
  }
  const params = defaults['energy-bowl'], initial = bowlState(params, 0), bottom = bowlState(params, initial.quarter);
  near(initial.centripetal, 0); near(Math.abs(initial.tangential), 10);
  near(bottom.centripetal, 20); near(bottom.tangential, 0); near(bottom.normal, 30);
  let left = 0, right = initial.quarter;
  for (let i = 0; i < 50; i++) {
    const mid = (left + right) / 2;
    if (bowlState(params, mid).theta > Math.PI / 6) left = mid; else right = mid;
  }
  const atB = bowlState(params, (left + right) / 2);
  near(atB.centripetal, Math.sqrt(3) * 10); near(atB.tangential, -5);
  assert.ok(initial.period > 2 * Math.PI * Math.sqrt(params.radius / 10), 'rim release must not use the small-angle period');
});

for (const kind of ['rotating-tube', 'two-string', 'energy-bowl']) {
  test(`${kind}: belongs to Intermediate and selection pauses and localizes force analysis`, async () => {
    const fixture = browserFixture(); let demo;
    try {
      const entry = demonstrations.find(item => item.id === kind); assert.equal(entry.level, 'intermediate');
      demo = (await entry.load()).mount({ root: fixture.root, lang: 'en' });
      fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
      fixture.frame(0); fixture.frame(200);
      const body = fixture.find(hasClass('selectable-mass'));
      body.dispatchEvent(new Event('click'));
      assert.equal(fixture.frames.size, 0);
      const panel = fixture.find(node => node.id === `${kind}-analysis`);
      assert.equal(panel.hidden, false); assert.match(panel.textContent, /Playback paused/);
      demo.setLanguage('he'); assert.match(panel.textContent, /הושהתה/);
      const key = new Event('keydown', { cancelable: true }); key.key = 'Escape'; fixture.root.dispatchEvent(key);
      assert.equal(panel.hidden, true); assert.equal(fixture.document.activeElement, body);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('bowl energy bar exchanges equal total energy, follows language and resets to potential energy', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'energy-bowl').load()).mount({ root: fixture.root, lang: 'en' });
    const bar = fixture.find(hasClass('energy-bar'));
    const panel = fixture.find(hasClass('energy-panel')), stage = fixture.find(hasClass('stage'));
    const transport = fixture.find(hasClass('transport'));
    assert.equal(panel.parentNode, stage);
    assert.ok(stage.children.indexOf(panel) < stage.children.indexOf(transport), 'energy must be visible above playback controls');
    assert.match(bar.getAttribute('aria-label'), /Potential energy: 10.00 J; Kinetic energy: 0.00 J/);
    fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
    fixture.frame(0); fixture.frame(bowlState(defaults['energy-bowl'], 0).quarter * 1000);
    assert.match(bar.getAttribute('aria-label'), /Potential energy: 0.00 J; Kinetic energy: 10.00 J/);
    demo.setLanguage('he'); assert.match(bar.getAttribute('aria-label'), /אנרגיה קינטית: 10.00 J/);
    demo.reset(); assert.match(bar.getAttribute('aria-label'), /אנרגיה פוטנציאלית: 10.00 J/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('two-string geometry controls keep both lengths compatible', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'two-string').load()).mount({ root: fixture.root, lang: 'en' });
    const length = fixture.find(node => node.id === 'two-string-length'), separation = fixture.find(node => node.id === 'two-string-separation');
    length.value = '0.5'; length.dispatchEvent(new Event('change'));
    near(Number(separation.value), 0.9);
    separation.value = '5.5'; separation.dispatchEvent(new Event('change'));
    near(Number(separation.value), 0.9);
    assert.doesNotMatch(fixture.root.textContent, /NaN|Infinity/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('two-string default is a slower valid orbit and the angle has a perpendicular reference', async () => {
  assert.equal(defaults['two-string'].frequency, 1);
  assert.equal(twoStringState(defaults['two-string'], 0).valid, true);
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'two-string').load()).mount({ root: fixture.root, lang: 'en' });
    const reference = fixture.find(hasClass('two-string-horizontal-reference'));
    assert.match(reference.getAttribute('d'), /^M 285 240 H 450 M 285 228 h 12 v 12$/);
    assert.ok(fixture.root.textContent.includes('α = 30.0°'));
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('bowl resolved components reconstruct weight on both sides and follow the radial and tangent axes', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'energy-bowl').load()).mount({ root: fixture.root, lang: 'en' });
    const toggle = fixture.find(node => node.id === 'energy-bowl-resolve-forces');
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    const axes = fixture.find(hasClass('bowl-force-axes')), forces = axes.parentNode;
    const initial = bowlState(defaults['energy-bowl'], 0);
    const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
    const vector = path => path.getAttribute('d') ? path.getAttribute('d').match(/ l ([^ ]+) ([^ ]+)/).slice(1).map(Number) : [0, 0];
    for (const fraction of [0, 0.125, 0.25, 0.375, 0.5]) {
      demo.reset(); play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(initial.period * fraction * 1000);
      const state = bowlState(defaults['energy-bowl'], initial.period * fraction);
      const paths = forces.children.filter(node => node.tagName === 'path' && node.getAttribute('display') === 'inline');
      assert.equal(paths.length, 3);
      assert.equal(axes.getAttribute('display'), 'inline'); assert.equal(forces.getAttribute('display'), 'inline');
      const [normal, tangential, radial] = paths.map(vector), scale = 85 / Math.max(state.normal, state.weight);
      near(tangential[0] + radial[0], 0); near(tangential[1] + radial[1], state.weight * scale);
      const sine = Math.sin(state.theta), cosine = Math.cos(state.theta);
      near(normal[0] * cosine - normal[1] * sine, 0);
      near(tangential[0] * sine + tangential[1] * cosine, 0);
      near(-(normal[0] + radial[0]) * sine - (normal[1] + radial[1]) * cosine, state.centripetal * scale);
      assert.doesNotMatch(forces.textContent, /NaN|Infinity/);
    }
    demo.setLanguage('he'); assert.match(toggle.parentNode.textContent, /פירוק הכוחות/);
    assert.equal(toggle.checked, true);
    toggle.checked = false; toggle.dispatchEvent(new Event('change'));
    assert.equal(forces.getAttribute('display'), 'none');
    demo.setLanguage('en');
    toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    fixture.find(node => node.tagName === 'button' && node.textContent === 'Restore defaults').dispatchEvent(new Event('click'));
    assert.equal(toggle.checked, false);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('tube side view follows the top-view projection and carries the selected forces', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'rotating-tube').load()).mount({ root: fixture.root, lang: 'en' });
    const side = fixture.find(node => node.getAttribute('data-view') === 'side');
    const housing = fixture.find(hasClass('tube-side-housing'));
    const play = fixture.find(node => node.tagName === 'button' && node.textContent === 'Play');
    const period = tubeState(defaults['rotating-tube'], 0).period;
    const position = () => side.getAttribute('transform').match(/translate\(([^)]+)\)/)[1].split(' ').map(Number);
    near(position()[0], 720); near(position()[1], 250);
    play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(period * 250);
    near(position()[0], 620); near(position()[1], 250);
    const sideAtQuarter = housing.getAttribute('d');
    fixture.frame(period * 500);
    near(position()[0], 520); near(position()[1], 250);
    assert.notEqual(housing.getAttribute('d'), sideAtQuarter);
    side.dispatchEvent(new Event('click'));
    assert.equal(fixture.frames.size, 0);
    const normalLabel = fixture.find(node => node.tagName === 'text' && node.textContent === 'N');
    const forces = normalLabel.parentNode;
    assert.equal(forces.getAttribute('display'), 'inline');
    const normalPath = forces.children.find(node => node.tagName === 'path');
    assert.match(normalPath.getAttribute('d'), /^M 520 250 l 0 -80/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('energy display uses mathematical notation without visible prose in either language', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'energy-bowl').load()).mount({ root: fixture.root, lang: 'en' });
    const panel = fixture.find(hasClass('energy-panel'));
    const legend = fixture.find(hasClass('energy-legend'), panel);
    assert.equal(legend.children.length, 3);
    assert.equal(legend.children.every(reading => reading.children[0].tagName === 'math' && reading.children[0].getAttribute('display') === 'inline'), true);
    assert.equal(fixture.find(hasClass('energy-identity'), panel), undefined);
    assert.doesNotMatch(panel.textContent, /Energy|Potential|Kinetic|Total|zero|conserved/);
    const reading = key => fixture.find(node => node.tagName === 'math' && node.getAttribute('aria-label')?.startsWith(`${key} =`), panel);
    assert.equal(reading('E_k').getAttribute('aria-label'), 'E_k = 0.00 J');
    assert.equal(reading('E_g').getAttribute('aria-label'), 'E_g = 10.00 J');
    assert.equal(reading('E_tot').getAttribute('aria-label'), 'E_tot = 10.00 J');
    fixture.find(node => node.tagName === 'button' && node.textContent === 'Play').dispatchEvent(new Event('click'));
    fixture.frame(0); fixture.frame(bowlState(defaults['energy-bowl'], 0).quarter * 1000);
    assert.equal(reading('E_k').getAttribute('aria-label'), 'E_k = 10.00 J');
    assert.equal(reading('E_g').getAttribute('aria-label'), 'E_g = 0.00 J');
    demo.setLanguage('he'); assert.equal(reading('E_k').getAttribute('aria-label'), 'E_k = 10.00 J');
    assert.doesNotMatch(panel.textContent, /אנרגיה|פוטנציאלית|קינטית/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});


test('bowl worked solution uses zero height at A and substitutes the values at A, B and C', async () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = (await demonstrations.find(entry => entry.id === 'energy-bowl').load()).mount({ root: fixture.root, lang: 'en' });
    fixture.find(hasClass('selectable-mass')).dispatchEvent(new Event('click'));
    const panel = fixture.find(node => node.id === 'energy-bowl-analysis');
    assert.match(panel.textContent, /zero at the rim A/);
    assert.match(panel.textContent, /tangential results below are magnitudes/);
    const nodes = node => [node, ...node.children.flatMap(nodes)];
    const labels = nodes(panel).filter(node => node.tagName === 'math').map(node => node.getAttribute('aria-label'));
    assert.ok(labels.includes(String.raw`h_A=0,\quad h(\theta)=-R\cos\theta`));
    assert.ok(labels.includes(String.raw`E_g^{(A)}=mgh=-mgR\cos\theta`));
    assert.ok(labels.some(label => label.includes('E_{\\mathrm{tot}}^{(A)}=0')));
    for (const expected of ['a_r(A)=2(10)', 'a_r(B)=2(10)', 'a_r(C)=2(10)', '17.32', '|a_t(A)|=10', '|a_t(B)|=10', '|a_t(C)|=10']) {
      assert.ok(labels.some(label => label.includes(expected)), expected);
    }
    const initial = bowlState(defaults['energy-bowl'], 0);
    for (const fraction of [0, 0.125, 0.25, 0.375, 0.5]) {
      const state = bowlState(defaults['energy-bowl'], initial.period * fraction);
      const potentialAtA = state.potential - state.weight * defaults['energy-bowl'].radius;
      near(potentialAtA, -state.weight * defaults['energy-bowl'].radius * Math.cos(state.theta));
      near(state.kinetic + potentialAtA, 0);
    }
    demo.setLanguage('he'); assert.match(panel.textContent, /בשפה A/); assert.match(panel.textContent, /פתרון בנקודות/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});
