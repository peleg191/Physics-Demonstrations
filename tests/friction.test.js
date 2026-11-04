import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
setMaxListeners(0);
import { defaults, solve, sample, endTime, stackedSlipLimit } from '../public/js/demos/friction/physics.js';
import { mountSystem } from '../public/js/demos/friction/index.js';
import { browserFixture } from './dom-fixture.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('stacked blocks: both Newton equations, floor load and slip threshold', () => {
  for (const g of [9.81, 10, 3.7]) {
    for (const mass of [1, 3, 15]) {
      const p = { mass, mu: 0.25, force: 8 * 0.25 * mass * g };
      const state = solve('stacked', p, g);
      near(state.groundNormal, 2 * mass * g);
      near(state.friction, state.limit);
      near(p.force - state.groundFriction - state.friction, mass * state.acceleration);
      assert.equal(state.slipping, false);
      p.force += 0.1;
      assert.equal(solve('stacked', p, g).slipping, true);
      assert.ok(endTime('stacked', p, g) > 0);
      const moving = sample('stacked', p, endTime('stacked', p, g), g);
      assert.ok(moving.bottomPosition > moving.topPosition);
    }
  }
});

test('table pulley: numerical solution and force balance across parameter extremes', () => {
  const state = solve('table', defaults.table, 10);
  near(state.acceleration, 2.2); near(state.tension, 8.4);
  for (const g of [3.7, 10]) for (const mass1 of [1, 15]) for (const mass2 of [1, 15]) for (const angle of [10, 60]) {
    const p = { ...defaults.table, mass1, mass2, angle, mu: 0.6 };
    const s = solve('table', p, g);
    near(s.tension - s.friction, mass1 * s.acceleration);
    near(mass2 * g * Math.sin(angle * Math.PI / 180) - s.tension, mass2 * s.acceleration);
  }
});

test('hanging pulley: friction follows velocity for both acceleration signs', () => {
  for (const g of [3.7, 10]) for (const direction of [-1, 1]) for (const mass1 of [1, 15]) {
    const p = { ...defaults.hanging, mass1, direction, speed: 1 };
    const s = solve('hanging', p, g), angle = p.angle * Math.PI / 180;
    near(s.normal, p.mass2 * g * Math.cos(angle));
    near(s.tension - mass1 * g, mass1 * s.acceleration);
    near(p.mass2 * g * Math.sin(angle) - s.tension - direction * s.friction, p.mass2 * s.acceleration);
    assert.equal(Math.sign(s.velocity), direction);
  }
});

test('moving branches stop at rest or exactly 2 m without reversing velocity', () => {
  for (const kind of ['stacked', 'table', 'hanging']) for (const mass1 of [1, 15]) for (const direction of [-1, 1]) {
    const p = { ...defaults[kind], mass1, direction, speed: 1 };
    const end = endTime(kind, p, 10), state = sample(kind, p, end, 10);
    assert.ok(Number.isFinite(end) && end >= 0 && end <= 4);
    assert.ok(Math.abs(state.position) <= 2 + 1e-8);
    const initial = kind === 'stacked' || kind === 'table' ? 1 : direction;
    assert.ok(state.velocity * initial >= -1e-8);
    if (end < 4) assert.ok(Math.abs(state.velocity) < 1e-8 || Math.abs(Math.abs(state.position) - 2) < 1e-8);
    near(sample(kind, p, end + 10, 10).position, state.position);
  }
});

test('slipping animates separate bodies and preserves analysis, graphs and translation', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mountSystem('stacked', { root: fixture.root, lang: 'en' });
    const input = fixture.find(n => n.id === 'friction-stacked-force');
    input.value = '100'; input.dispatchEvent(new Event('change'));
    const feedback = fixture.find(n => n.className === 'feedback');
    assert.match(feedback.textContent, /slips backward/);
    const reading = fixture.find(n => n.className === 'metrics');
    assert.doesNotMatch(reading.textContent, /NaN|—/);
    const body = i => fixture.find(n => n.getAttribute('data-body') === String(i));
    body(1).dispatchEvent(new Event('click'));
    const panel = fixture.find(n => n.className === 'body-analysis');
    assert.ok(nodes(panel).some(n => n.tagName === 'math' && n.getAttribute('aria-label').includes('f_{k,t}')));
    const step = fixture.find(n => n.tagName === 'button' && n.textContent === 'Step');
    step.dispatchEvent(new Event('click')); step.dispatchEvent(new Event('click'));
    const x = body => Number(body.getAttribute('transform').match(/translate\(([^ ]+)/)[1]);
    assert.ok(x(body(1)) > x(body(0)), 'lower block must visibly move ahead');
    assert.equal(panel.hidden, false);
    assert.match(reading.textContent, /44.00/); assert.match(reading.textContent, /2.00/);
    const toggle = fixture.find(n => n.type === 'checkbox'); toggle.checked = true; toggle.dispatchEvent(new Event('change'));
    const curves = [];
    function inspect(node) {
      if ((node.getAttribute('class') || '').includes('graph-curve')) curves.push(node);
      node.children.forEach(inspect);
    }
    inspect(fixture.root); assert.equal(curves.length, 6);
    for (const curve of curves) assert.doesNotMatch(curve.getAttribute('d'), /NaN|Infinity/);
    const solution = fixture.find(n => n.className.includes('friction-solution'));
    solution.open = true; demo.setLanguage('he');
    assert.equal(solution.open, true); assert.match(feedback.textContent, /מחליק לאחור/);
  } finally { demo?.dispose(); fixture.cleanup(); }
});

// The diagram is a model too: the rope must be tangent and preserve its length.
import { sceneGeometry } from '../public/js/demos/friction/geometry.js';
import { bodyForces } from '../public/js/demos/friction/forces.js';
import { strings } from '../public/js/demos/friction/strings.js';
import { solutionSteps, accelerationCalculation } from '../public/js/demos/friction/analysis.js';
import { latexExpression } from '../public/js/core/latex.js';
const keyEvent = name => Object.assign(new Event('keydown', { cancelable: true }), { key: name });
const nodes = root => [root, ...root.children.flatMap(nodes)];

test('pulley ropes are tangent to the wheel and retain length throughout motion at every angle', () => {
  for (const kind of ['table', 'hanging']) for (const angle of [10, 30, 60]) {
    let initialLength;
    for (const position of [-2, 0, 2]) {
      const geometry = sceneGeometry(kind, { ...defaults[kind], angle }, position);
      const { wheel, entry, exit, start, end, c, sn } = geometry;
      const label = geometry.angleLabel;
      assert.ok(label.x - 45 > 310 && label.x + 45 < geometry.foot.x);
      assert.ok(label.y + 11 < geometry.foot.y);
      assert.ok(label.y - 11 > 145 + (label.x + 45 - 310) * Math.tan(angle * Math.PI / 180), 'angle text must stay below the sloping edge');
      near(Math.hypot(entry.x - wheel.x, entry.y - wheel.y), wheel.radius);
      near(Math.hypot(exit.x - wheel.x, exit.y - wheel.y), wheel.radius);
      near((entry.x - wheel.x) * (entry.x - start.x) + (entry.y - wheel.y) * (entry.y - start.y), 0);
      near((exit.x - wheel.x) * (end.x - exit.x) + (exit.y - wheel.y) * (end.y - exit.y), 0);
      near((end.x - exit.x) * sn - (end.y - exit.y) * c, 0);
      const length = Math.hypot(entry.x - start.x, entry.y - start.y) + wheel.radius * (angle * Math.PI / 180 + (kind === 'hanging' ? Math.PI / 2 : 0)) + Math.hypot(end.x - exit.x, end.y - exit.y);
      if (initialLength === undefined) initialLength = length; else near(length, initialLength);
      assert.doesNotMatch(geometry.rope, /NaN|Infinity|Q/);
    }
  }
});

test('canvas force vectors obey Newton equations in the screen frame, including friction reversal', () => {
  for (const kind of ['stacked', 'table', 'hanging']) for (const direction of [-1, 1]) {
    const p = { ...defaults[kind], direction }, state = solve(kind, p, 10);
    const forces = bodyForces(kind, p, state, 10);
    const sum = list => list.reduce(([x, y], f) => [x + f.fx, y + f.fy], [0, 0]);
    const first = sum(forces[0]), second = sum(forces[1]);
    if (kind === 'stacked') {
      near(first[0], p.mass * state.acceleration); near(second[0], first[0]); near(first[1], 0); near(second[1], 0);
      near(forces[0].find(f => f.id === 'friction').fx, -forces[1].find(f => f.id === 'friction').fx);
    } else {
      near(first[0], kind === 'table' ? p.mass1 * state.acceleration : 0);
      near(first[1], kind === 'table' ? 0 : -p.mass1 * state.acceleration);
      near(second[0], p.mass2 * state.acceleration * Math.cos(p.angle * Math.PI / 180));
      near(second[1], p.mass2 * state.acceleration * Math.sin(p.angle * Math.PI / 180));
      const weight = forces[1].find(f => f.id === 'weight'); near(weight.fx, 0); near(weight.fy, p.mass2 * 10);
    }
  }
});

for (const kind of ['stacked', 'table', 'hanging']) {
  test(`${kind}: body selection, continued playback, equations, on-canvas parameters and cleanup`, () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = mountSystem(kind, { root: fixture.root, lang: 'en' });
      if (kind === 'hanging') {
        const mass = fixture.find(n => n.id === 'friction-hanging-mass1');
        mass.value = '3'; mass.dispatchEvent(new Event('change'));
      }
      const body = index => fixture.find(n => n.getAttribute('data-body') === String(index));
      const panel = fixture.find(n => n.className === 'body-analysis');
      const overlay = fixture.find(n => (n.getAttribute('class') || '').includes('friction-forces'));
      const play = fixture.find(n => n.tagName === 'button' && n.textContent === 'Play');
      const time = fixture.find(n => n.className === 'metric-value');
      const canvas = fixture.find(n => n.getAttribute('class') === 'system-svg');
      assert.equal(panel.hidden, true); assert.equal(overlay.getAttribute('display'), 'none');
      play.dispatchEvent(new Event('click')); fixture.frame(0); fixture.frame(200);
      body(1).dispatchEvent(new Event('click'));
      assert.equal(time.textContent, '0.20s'); assert.equal(fixture.frames.size, 0);
      assert.equal(body(1).getAttribute('aria-pressed'), 'true'); assert.equal(panel.hidden, false);
      assert.match(panel.textContent, /Playback paused/);
      assert.ok(nodes(panel).some(n => n.tagName === 'mfrac'));
      assert.ok(nodes(panel).some(n => n.tagName === 'msub'));
      assert.equal(overlay.children.filter(n => n.getAttribute('display') === 'inline').length, kind === 'stacked' ? 6 : kind === 'table' ? 3 : 4);
      const expansions = panel.children.filter(n => n.tagName === 'details'); expansions.forEach(n => n.open = true);
      const initialTransform = overlay.getAttribute('transform');
      play.dispatchEvent(new Event('click')); fixture.frame(300); fixture.frame(400);
      assert.notEqual(overlay.getAttribute('transform'), initialTransform);
      body(0).dispatchEvent(keyEvent('Enter'));
      assert.equal(body(0).getAttribute('aria-pressed'), 'true'); assert.equal(body(1).getAttribute('aria-pressed'), 'false');
      const input = fixture.find(n => n.id === `friction-${kind}-${kind === 'stacked' ? 'mass' : 'angle'}`);
      input.value = kind === 'stacked' ? '5' : '60'; input.dispatchEvent(new Event('change'));
      assert.equal(time.textContent, '0.00s'); assert.equal(panel.hidden, false);
      const labels = nodes(canvas).filter(n => n.tagName === 'math').map(n => n.getAttribute('aria-label'));
      assert.ok(labels.some(label => kind === 'stacked' ? label === 'm' : label.includes('alpha=60')));
      demo.setLanguage('he'); assert.ok(expansions.every(n => n.open)); assert.match(panel.textContent, /ניתוח גוף/);
      panel.dispatchEvent(keyEvent('Escape')); assert.equal(panel.hidden, true);
      assert.equal(overlay.getAttribute('display'), 'none'); assert.equal(fixture.document.activeElement, body(0));
      body(1).dispatchEvent(keyEvent(' ')); assert.equal(panel.hidden, false);
      canvas.dispatchEvent(new Event('click')); assert.equal(panel.hidden, true);
      demo.dispose(); demo = null; assert.equal(fixture.frames.size, 0); assert.equal(fixture.root.children.length, 0);
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('authored LaTeX produces fractions, scripts and upright trigonometry in both languages', () => {
  const walk = tree => Array.isArray(tree) ? [tree, ...tree.slice(1).flatMap(walk)] : [];
  for (const lang of ['en', 'he']) for (const kind of ['stacked', 'table', 'hanging']) {
    const steps = solutionSteps(kind, strings[lang]);
    for (const step of steps.filter(s => s.math)) assert.doesNotThrow(() => latexExpression(step.text));
    assert.ok(steps.filter(s => s.math).some(s => walk(s.expression).some(node => node[0] === 'mfrac')));
    if (kind !== 'stacked') assert.ok(steps.some(s => s.math && walk(s.expression).some(n => n[0] === 'mi' && n[1]?.mathvariant === 'normal' && n[2] === 'sin')));
  }
});

test('sliding obeys both Newton equations, action–reaction and energy balance until the support cutoff', () => {
  for (const g of [3.7, 10]) for (const mass of [1, 15]) for (const muBetween of [0, 0.2, 0.6]) {
    const p = { mass, mu: 0.2, muBetween, force: 8 * 0.2 * mass * g + 20 };
    const state = solve('stacked', p, g), t = endTime('stacked', p, g) / 2;
    near(state.friction, muBetween * mass * g);
    near(state.friction, mass * state.topAcceleration);
    near(p.force - state.groundFriction - state.friction, mass * state.bottomAcceleration);
    assert.ok(state.bottomAcceleration > state.topAcceleration);
    const moving = sample('stacked', p, t, g);
    near(moving.relativeDisplacement, (state.bottomAcceleration - state.topAcceleration) * t * t / 2);
    const kineticGain = mass * (moving.topVelocity ** 2 + moving.bottomVelocity ** 2 - 2 * (p.speed ?? 0) ** 2) / 2;
    near(kineticGain, (p.force - state.groundFriction) * moving.bottomPosition - state.friction * moving.relativeDisplacement);
    const forces = bodyForces('stacked', p, moving, g);
    near(forces[0].find(f => f.id === 'friction').fx, -forces[1].find(f => f.id === 'friction').fx);
    const end = sample('stacked', p, 100, g);
    assert.ok(end.relativeDisplacement <= stackedSlipLimit + 1e-8);
    assert.ok(Math.abs(end.relativeDisplacement - stackedSlipLimit) < 1e-8 || Math.abs(end.bottomPosition - 2) < 1e-8);
    near(sample('stacked', p, 200, g).topPosition, end.topPosition);
    const geometry = sceneGeometry('stacked', p, end.bottomPosition, end.topPosition);
    assert.ok(geometry.bodies[0].x > geometry.bodies[1].x - 32, 'upper centre remains supported');
  }
});

test('kinetic coefficient does not affect the static threshold or no-slip motion', () => {
  const a = solve('stacked', { ...defaults.stacked, muBetween: 0 }, 10);
  const b = solve('stacked', { ...defaults.stacked, muBetween: 0.6 }, 10);
  near(a.threshold, b.threshold); near(a.acceleration, b.acceleration); near(a.friction, b.friction);
  near(a.topAcceleration, a.bottomAcceleration);
  assert.equal(solve('stacked', { ...defaults.stacked, force: a.threshold }, 10).slipping, false);
});

test('coefficient edits stay physical, and slow-slip playback animates with a visible nonzero duration', () => {
  const fixture = browserFixture(); let demo;
  try {
    demo = mountSystem('stacked', { root: fixture.root, lang: 'en' });
    const input = key => fixture.find(n => n.id === `friction-stacked-${key}`);
    input('muBetween').value = '1.8'; input('muBetween').dispatchEvent(new Event('change'));
    near(Number(input('muBetween').value), 0.6);
    input('mu').value = '0.1'; input('mu').dispatchEvent(new Event('change'));
    near(Number(input('muBetween').value), 0.3);
    input('force').value = '100'; input('force').dispatchEvent(new Event('change'));
    const slow = fixture.find(n => n.className.includes('slip-playback'));
    assert.equal(slow.hidden, false); slow.dispatchEvent(new Event('click'));
    fixture.frame(0); fixture.frame(200);
    const time = fixture.find(n => n.className === 'metric-value');
    assert.equal(time.textContent, '0.05s');
    const rate = fixture.find(n => n.id === 'playback-rate'); assert.equal(rate.value, '0.25');
    const body = i => fixture.find(n => n.getAttribute('data-body') === String(i));
    assert.notEqual(body(0).getAttribute('transform'), body(1).getAttribute('transform'));
    const x = i => Number(body(i).getAttribute('transform').match(/translate\(([^ ]+)/)[1]);
    assert.ok(x(1) > x(0));
    demo.reset(); assert.equal(time.textContent, '0.00s'); near(x(0), x(1));
  } finally { demo?.dispose(); fixture.cleanup(); }
});

test('all systems default to zero speed with bonus initial motion collapsed', () => {
  for (const kind of ['stacked', 'table', 'hanging']) {
    near(defaults[kind].speed, 0);
    const state = sample(kind, defaults[kind], 0, 10);
    near(state.velocity, 0); near(state.position, 0);
    assert.equal(state.resting, false); assert.ok(Math.abs(state.acceleration) > 1e-8);
    assert.ok(Math.abs(sample(kind, defaults[kind], 0.1, 10).position) > 0);
    if (kind === 'stacked') near(state.topVelocity, 0);
    const fixture = browserFixture(); let demo;
    try {
      demo = mountSystem(kind, { root: fixture.root, lang: 'en' });
      const input = fixture.find(n => n.id === `friction-${kind}-speed`);
      assert.equal(input.value, '0'); assert.equal(input.min, '0');
      const bonus = fixture.find(n => n.className.includes('friction-bonus'));
      assert.ok(!bonus.open); assert.ok(nodes(bonus).includes(input));
      input.value = '1'; input.dispatchEvent(new Event('change'));
      const speed = sample(kind, { ...defaults[kind], speed: 1 }, 0, 10).velocity;
      near(speed, 1);
      const restore = fixture.find(n => n.tagName === 'button' && n.textContent === 'Restore defaults');
      restore.dispatchEvent(new Event('click')); assert.equal(input.value, '0');
    } finally { demo?.dispose(); fixture.cleanup(); }
  }
});

test('release from rest either holds or accelerates in the force-driven direction without an invented initial velocity', () => {
  const cases = [
    ['stacked', { ...defaults.stacked, force: 1 }],
    ['table', { ...defaults.table, mu: 0.6, mass1: 10 }],
    ['hanging', { ...defaults.hanging, mass1: 2 }],
  ];
  for (const [kind, p] of cases) {
    const s = sample(kind, p, 2, 10);
    assert.equal(s.resting, true); near(s.acceleration, 0); near(s.velocity, 0); near(s.position, 0);
    assert.ok(endTime(kind, p, 10) > 0);
    const forces = bodyForces(kind, p, s, 10);
    for (const list of forces) {
      near(list.reduce((v, f) => v + f.fx, 0), 0);
      near(list.reduce((v, f) => v + f.fy, 0), 0);
    }
  }
  for (const [mass1, expectedDirection] of [[1, 1], [4, -1]]) {
    const p = { ...defaults.hanging, mass1, angle: 45, direction: -expectedDirection };
    const initial = sample('hanging', p, 0, 10), later = sample('hanging', p, 0.1, 10);
    near(initial.velocity, 0); assert.equal(initial.resting, false);
    assert.equal(initial.direction, expectedDirection);
    assert.equal(Math.sign(later.position), expectedDirection);
    assert.equal(Math.sign(later.velocity), expectedDirection);
    assert.ok(Number.isFinite(endTime('hanging', p, 10)));
  }
  const driven = sample('stacked', { ...defaults.stacked, force: 100 }, 0.1, 10);
  assert.ok(driven.bottomPosition > driven.topPosition); assert.ok(driven.topVelocity > 0);
});

test('bonus initial direction remains available for an already moving hanging system', () => {
  const p = { ...defaults.hanging, mass1: 1, speed: 1, direction: -1 };
  const initial = sample('hanging', p, 0, 10);
  near(initial.velocity, -1); assert.equal(initial.direction, -1);
  const end = sample('hanging', p, endTime('hanging', p, 10), 10);
  assert.ok(end.velocity <= 1e-8); assert.ok(end.position < 0);
});

test('acceleration substitutions cover the actual static, sticking and slipping regimes', () => {
  const calculations = (kind, p, g = 10) => accelerationCalculation(kind, p, g, strings.en);
  const math = steps => steps.filter(s => s.math).map(s => s.text).join('\n');
  assert.match(math(calculations('stacked', defaults.stacked)), /a_t=a_b=.*3\.00/);
  const slipping = math(calculations('stacked', { ...defaults.stacked, force: 100 }));
  assert.match(slipping, /a_t=.*2\.00/); assert.match(slipping, /a_b=.*44\.00/);
  assert.match(math(calculations('stacked', { ...defaults.stacked, force: 1 })), /a_t=a_b=0/);
  assert.match(math(calculations('table', defaults.table)), /a=.*2\.20/);
  const held = calculations('hanging', { ...defaults.hanging, mass1: 2 });
  assert.equal(held.at(-1).text, String.raw`a=0\,\mathrm{m}/\mathrm{s}^{2}`);
  assert.ok(held.some(s => s.math && s.text.includes(String.raw`\leq`)));
  for (const direction of [-1, 1]) {
    const p = { ...defaults.hanging, speed: 1, direction };
    const actual = calculations('hanging', p), value = solve('hanging', p, 10).acceleration.toFixed(2);
    assert.ok(actual.some(s => s.text === (direction === 1 ? strings.en.downBranch : strings.en.upBranch)));
    assert.ok(actual.some(s => s.math && s.text.startsWith('a=') && s.text.includes(value)));
    assert.ok(math(actual).includes(direction === 1 ? String.raw`-(${p.mu})\cos` : String.raw`+(${p.mu})\cos`));
  }
  for (const kind of ['stacked', 'table', 'hanging']) {
    const steps = calculations(kind, { ...defaults[kind], speed: 1 }, 3.7);
    for (const step of steps.filter(s => s.math)) assert.doesNotThrow(() => latexExpression(step.text));
    assert.ok(math(steps).includes('3.7'));
  }
});

for (const [kind, key, changed, expected] of [['stacked', 'force', '100', '44.00'], ['table', 'mass1', '4', '1.00'], ['hanging', 'mass1', '4', '-2.83']]) {
  test(`${kind}: acceleration calculation updates in both solution sections and preserves expansion state`, () => {
    const fixture = browserFixture(); let demo;
    try {
      demo = mountSystem(kind, { root: fixture.root, lang: 'en' });
      const solution = fixture.find(n => n.className.includes('friction-solution'));
      const calculation = fixture.find(n => n.className.includes('friction-calculation'));
      solution.open = true; calculation.open = true;
      assert.equal(calculation.parentNode, solution);
      const body = fixture.find(n => n.getAttribute('data-body') === '0'); body.dispatchEvent(new Event('click'));
      const panel = fixture.find(n => n.className === 'body-analysis');
      const input = fixture.find(n => n.id === `friction-${kind}-${key}`);
      input.value = changed; input.dispatchEvent(new Event('change'));
      const calculated = root => nodes(root).filter(n => n.tagName === 'math').map(n => n.getAttribute('aria-label')).join('\n');
      assert.ok(calculated(calculation).includes(expected)); assert.ok(calculated(panel).includes(expected));
      assert.ok(nodes(panel).some(n => n.tagName === 'h3' && n.textContent === strings.en.computeAcceleration));
      assert.ok(nodes(calculation).some(n => n.tagName === 'mfrac'));
      demo.setLanguage('he'); assert.equal(solution.open, true); assert.equal(calculation.open, true);
      assert.equal(calculation.children[0].textContent, strings.he.computeAcceleration);
      assert.ok(calculated(calculation).includes(expected));
      demo.reset(); assert.equal(calculation.open, true); assert.ok(calculated(calculation).includes(expected));
    } finally { demo?.dispose(); fixture.cleanup(); }
  });
}

test('hanging static-equilibrium mass interval agrees with release and both friction directions', () => {
  const p = { ...defaults.hanging, angle: 45, mu: 0.2, speed: 0 };
  const angle = p.angle * Math.PI / 180;
  const lower = p.mass2 * (Math.sin(angle) - p.mu * Math.cos(angle));
  const upper = p.mass2 * (Math.sin(angle) + p.mu * Math.cos(angle));
  for (const g of [3.7, 10]) {
    for (const mass1 of [lower, p.mass2 * Math.sin(angle), upper]) {
      const state = solve('hanging', { ...p, mass1 }, g);
      assert.equal(state.resting, true); near(state.acceleration, 0); near(state.tension, mass1 * g);
      near(state.friction, Math.abs(mass1 * g - p.mass2 * g * Math.sin(angle)));
      assert.ok(state.friction <= p.mu * state.normal + 1e-8);
    }
    assert.equal(solve('hanging', { ...p, mass1: lower - 1e-5 }, g).direction, 1);
    assert.equal(solve('hanging', { ...p, mass1: upper + 1e-5 }, g).direction, -1);
    assert.equal(solve('hanging', { ...p, mass1: lower - 1e-5 }, g).resting, false);
    assert.equal(solve('hanging', { ...p, mass1: upper + 1e-5 }, g).resting, false);
  }
  for (const lang of ['en', 'he']) {
    const steps = solutionSteps('hanging', strings[lang]);
    assert.equal(steps[0].text, strings[lang].staticCase);
    assert.deepEqual(steps.filter(s => s.heading).map(s => s.text), [strings[lang].staticCase, strings[lang].downCase, strings[lang].upCase]);
    assert.ok(steps.some(s => s.math && s.text.includes(String.raw`\lvert f_s\rvert\leq\mu_sN_2`)));
  }
});
