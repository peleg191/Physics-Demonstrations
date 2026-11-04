const colors = { weight: '#a94729', normal: '#267a62', tension: '#246b9c', friction: '#994e94', applied: '#b77820' };
const vector = (id, latex, fx, fy, color, ox = 0, oy = 0) => ({ id, latex, fx, fy, color: colors[color], ox, oy });
export function bodyForces(kind, params, state, g) {
  if (kind === 'stacked') {
    const f = state.friction;
    const contactSymbol = state.slipping ? 'f_{k,t}' : 'f_s';
    const weight = params.mass * g;
    return [
      [vector('normal', 'N_t', 0, -weight, 'normal'), vector('weight', 'mg', 0, weight, 'weight'), vector('friction', contactSymbol, f, 0, 'friction')],
      [vector('normal', 'N_f', 0, -2 * weight, 'normal'), vector('weight', 'mg', 0, weight, 'weight', -14),
        vector('contact', 'N_t', 0, weight, 'normal', 14), vector('applied', 'F', params.force, 0, 'applied'),
        vector('friction', contactSymbol, -f, 0, 'friction', 0, -10), vector('floor', state.resting ? 'f_{s,f}' : 'f_k', -state.groundFriction, 0, 'friction', 0, 10)],
    ];
  }
  const angle = params.angle * Math.PI / 180, c = Math.cos(angle), sn = Math.sin(angle);
  const m1 = params.mass1 * g, m2 = params.mass2 * g;
  const slope = [vector('weight', 'm_2g', 0, m2, 'weight'),
    vector('normal', 'N_2', m2 * c * sn, -m2 * c * c, 'normal'),
    vector('tension', 'T', -state.tension * c, -state.tension * sn, 'tension')];
  if (kind === 'hanging') slope.push(vector('friction', state.resting ? 'f_s' : 'f_k', -state.direction * state.friction * c, -state.direction * state.friction * sn, 'friction', 9 * sn, -9 * c));
  return [kind === 'table'
    ? [vector('weight', 'm_1g', 0, m1, 'weight'), vector('normal', 'N_1', 0, -m1, 'normal'),
      vector('tension', 'T', state.tension, 0, 'tension'), vector('friction', state.resting ? 'f_s' : 'f_k', -state.friction, 0, 'friction')]
    : [vector('weight', 'm_1g', 0, m1, 'weight'), vector('tension', 'T', 0, -state.tension, 'tension')], slope];
}
