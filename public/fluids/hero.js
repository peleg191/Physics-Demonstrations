export function drawHydroHero(canvas) {
  const ctx = canvas.getContext('2d');
  const palette = getComputedStyle(document.documentElement);
  const ink = palette.getPropertyValue('--ink').trim();
  const line = palette.getPropertyValue('--line').trim();
  const accent = palette.getPropertyValue('--orange').trim();
  const dark = document.documentElement.dataset.theme === 'dark';
  const notebook = document.documentElement.dataset.illustrationStyle === 'notebook';
  const water = dark ? '#487a83' : notebook ? '#a9ccd0' : '#90c1c9';
  const current = dark ? '#c0e2e4' : '#315f69';

  ctx.setTransform(canvas.width / 720, 0, 0, canvas.height / 160, 0, 0);
  ctx.clearRect(0, 0, 720, 160);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function draw(path, { fill, stroke = ink } = {}) {
    const shape = new Path2D(path);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(shape);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke(shape);
    }
  }

  if (!notebook) {
    ctx.fillStyle = line;
    for (let y = 12; y < 160; y += 16) {
      for (let x = 8; x < 720; x += 16) ctx.fillRect(x, y, 2, 2);
    }
  }

  // Pascal's law: connected pistons lift a load.
  draw('M16 78h23v37h22V61h54v67H16Z', { fill: water, stroke: null });
  draw('M16 52v76h99V37m-76 15v63h22V37');
  draw('M16 78h23m22-17h54m-88 17V44m61 17V41');
  draw('M70 25h36v16H70Z', { fill: accent });
  draw('M27 28v12m-5-5 5 5 5-5m96 29V38m-5 5 5-5 5 5', { stroke: current });

  // Archimedes' principle: a floating block displaces water.
  draw('M154 79q12-4 24 0t24 0 24 0 24 0l8-2v49H154Z', { fill: water, stroke: null });
  draw('M154 45v81h104V45m-104 34q12-4 24 0t24 0 24 0 24 0l8-2');
  draw('M188 58l36 4-4 34-36-4Z', { fill: accent });
  draw('M204 57V31m-5 5 5-5 5 5', { stroke: current });

  // Continuity: water flows from the wide section into the narrow section.
  draw('M284 60h28l32 12h43v20h-43l-32 12h-28Z', { fill: water });
  draw('M304 82h60m-7-6 7 6-7 6', { stroke: current });

  // Bernoulli along a descending pipe: the outlet sits lower and is wider.
  draw('M412 48h21c28 0 43 35 66 35h40v43h-40c-37 0-50-54-66-54h-21Z', { fill: water });
  draw('M416 60h17c23 0 40 44 66 44h34m-7-5 7 5-7 5', { stroke: current });

  // Torricelli's law: the outlet jet curves below the tank.
  draw('M569 58q10-4 20 0t20 0 20 0l10-2v70h-70Z', { fill: water, stroke: null });
  draw('M569 29v97h70V97m0-11V29m-70 29q10-4 20 0t20 0 20 0l10-2');
  draw('M639 89q36 0 58 37m-11-3 11 3-1-11', { stroke: current });
  ctx.setLineDash([3, 4]);
  draw('M620 62v22', { stroke: current });
  ctx.setLineDash([]);
}
