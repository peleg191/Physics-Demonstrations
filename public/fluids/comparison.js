export function fluidComparison(id, reading, format, translate) {
  const value = (number, unit) => `${format(number)} ${unit}`;
  const row = (label, first, second, unit) => {
    const delta = second - first;
    const difference = Math.abs(delta) < .0005 ? 0 : delta;
    const sign = difference > 0 ? '+' : '';
    return [translate(label), value(first, unit), value(second, unit), sign + value(difference, unit)];
  };
  const title = translate(['Compare the two selections', 'השוואה בין שתי הבחירות']);
  const quantity = translate(['Quantity', 'גודל']);
  const difference = translate(['Change (Δ)', 'שינוי (Δ)']);
  const pressure = ['Pressure', 'לחץ'];
  const speed = ['Flow speed', 'גודל מהירות הזרימה'];
  if (id === 'pascal') {
    return {
      title, columns: [quantity, translate(['Input (1)', 'כניסה (1)']), translate(['Load (2)', 'עומס (2)']), difference],
      rows: [
        row(['Piston area', 'שטח הבוכנה'], reading.inputArea, reading.outputArea, 'cm²'),
        row(['Added pressure', 'תוספת לחץ'], reading.pressure / 1000, reading.pressure / 1000, 'kPa'),
        row(['Force magnitude', 'גודל הכוח'], reading.force, reading.outputForce, 'N'),
      ],
    };
  }
  if (id === 'bernoulli') {
    const atmospheric = translate(['Atmospheric', 'אטמוספרי']);
    return {
      title, columns: [quantity, translate(['Surface (1)', 'פני המים (1)']), translate(['Outlet (2)', 'פתח (2)']), difference],
      rows: [
        [translate(pressure), atmospheric, atmospheric, value(0, 'kPa')],
        row(speed, reading.surfaceSpeed, reading.speed, 'm/s'),
        row(['Height above outlet', 'גובה מעל הפתח'], reading.depth, 0, 'm'),
      ],
    };
  }
  return {
    title, columns: [quantity, translate(['Inlet (1)', 'כניסה (1)']), translate(['Outlet (2)', 'יציאה (2)']), difference],
    rows: [
      row(pressure, reading.pressure1, reading.pressure2 / 1000, 'kPa'),
      row(speed, reading.speed1, reading.speed2, 'm/s'),
      ...(id === 'descending-pipe' ? [row(['Height above outlet', 'גובה מעל היציאה'], reading.drop, 0, 'm')] : []),
    ],
  };
}
