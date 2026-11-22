export function drawHydroHero(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / 560, 0, 0, canvas.height / 345, 0, 0);
  const { theme, illustrationStyle } = document.documentElement.dataset;
  const dark = theme === 'dark';
  const notebook = illustrationStyle === 'notebook';

  const background = ctx.createLinearGradient(0, 0, 560, 345);
  background.addColorStop(0, dark ? '#102932' : notebook ? '#f3ecdb' : '#edf6f2');
  background.addColorStop(1, dark ? '#153e42' : notebook ? '#d4e7df' : '#b9dbdc');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 560, 345);

  ctx.strokeStyle = dark ? '#b2e4e019' : '#315c631c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 16; x < 560; x += 24) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 345);
  }
  for (let y = 16; y < 345; y += 24) {
    ctx.moveTo(0, y);
    ctx.lineTo(560, y);
  }
  ctx.stroke();

  // A contracting flow channel. The streamlines crowd through the throat.
  const center = x => 171 - 21 * Math.sin((x - 220) / 174);
  const halfWidth = x => 89 - 62 * Math.exp(-(((x - 309) / 112) ** 2));
  const ordinate = (x, lane) => center(x) + lane * halfWidth(x);
  function trace(lane, from = -12, to = 572) {
    const step = from < to ? 4 : -4;
    ctx.lineTo(from, ordinate(from, lane));
    for (let x = from + step; step > 0 ? x < to : x > to; x += step) ctx.lineTo(x, ordinate(x, lane));
    ctx.lineTo(to, ordinate(to, lane));
  }

  const water = ctx.createLinearGradient(0, 60, 560, 290);
  water.addColorStop(0, dark ? '#23636c' : '#78b8c1');
  water.addColorStop(.55, dark ? '#246e78' : '#4095a5');
  water.addColorStop(1, dark ? '#30796d' : '#82bba9');
  ctx.beginPath();
  trace(-1);
  trace(1, 572, -12);
  ctx.closePath();
  ctx.fillStyle = water;
  ctx.fill();

  for (const lane of [-1, -.76, -.51, -.26, 0, .26, .51, .76, 1]) {
    const wall = Math.abs(lane) === 1;
    ctx.beginPath();
    trace(lane);
    ctx.strokeStyle = wall ? (dark ? '#a5d8d2' : '#225964') : (dark ? '#c5f0ed90' : '#f8ffffb0');
    ctx.lineWidth = wall ? 2.4 : 1.35;
    if (notebook && !wall) ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const [x, lane] of [[102, -.51], [155, .26], [280, -.26], [325, .51], [443, 0], [487, -.51]]) {
    const y = ordinate(x, lane);
    const angle = Math.atan2(ordinate(x + 2, lane) - ordinate(x - 2, lane), 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = dark ? '#e0fff8' : '#f7fff9';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
