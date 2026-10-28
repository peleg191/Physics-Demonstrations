// Analytic models are sampled at this clock's time, never integrated per frame.
export function createClock({ onTick, duration, request = cb => requestAnimationFrame(cb), cancel = id => cancelAnimationFrame(id) }) {
  let time = 0, playing = false, rate = 1, frame = null, last = null, disposed = false;
  function schedule() { if (playing && !disposed) frame = request(tick); }
  function tick(now) {
    frame = null;
    if (!playing || disposed) return;
    if (last !== null) time = Math.min(duration(), time + Math.max(0, now - last) / 1000 * rate);
    last = now;
    if (time >= duration()) playing = false;
    onTick(time, playing);
    schedule();
  }
  function stop() {
    playing = false; last = null;
    if (frame !== null) cancel(frame);
    frame = null;
  }
  return {
    get time() { return time; }, get playing() { return playing; }, get ended() { return time >= duration(); },
    play() { if (disposed || playing) return; if (time >= duration()) time = 0; playing = true; last = null; onTick(time, playing); schedule(); },
    pause() { stop(); if (!disposed) onTick(time, playing); },
    reset() { stop(); time = 0; if (!disposed) onTick(time, playing); },
    step(dt = 0.05) { if (disposed) return; stop(); time = Math.min(duration(), time + dt); onTick(time, playing); },
    setRate(value) { rate = value; last = null; },
    dispose() { stop(); disposed = true; },
  };
}
