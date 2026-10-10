/* ExposureIQ landing page: animated network background.
   Drifting nodes and links, with an occasional amber pulse
   to suggest "something changed". Static if reduced motion is on. */
(function () {
  var canvas = document.getElementById('net');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, nodes = [], pulses = [], raf = null, nextPulse = 0;

  function make() {
    return {
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: 1.6 + Math.random() * 1.8,
      c: Math.random() < 0.25 ? '124,131,253' : '22,184,166'
    };
  }

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(22, Math.min(70, Math.round(w * h / 24000)));
    while (nodes.length < n) nodes.push(make());
    nodes.length = n;
    if (motion.matches) draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    var link = w < 600 ? 110 : 150, i, j, a, b, dx, dy, d, al;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < link) {
          al = (1 - d / link) * 0.28;
          ctx.strokeStyle = 'rgba(22,184,166,' + al.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = 'rgba(' + a.c + ',0.75)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
    for (i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i], k = (t - p.t0) / 2000;
      if (k >= 1) { pulses.splice(i, 1); continue; }
      ctx.strokeStyle = 'rgba(245,158,11,' + (0.7 * (1 - k)).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.n.x, p.n.y, 4 + k * 46, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(245,158,11,' + (0.95 * (1 - k)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(p.n.x, p.n.y, 3.2, 0, 6.2832); ctx.fill();
    }
  }

  function tick(t) {
    var i, n;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i]; n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
    }
    if (t > nextPulse) {
      pulses.push({ n: nodes[Math.floor(Math.random() * nodes.length)], t0: t });
      nextPulse = t + 3500 + Math.random() * 2500;
    }
    draw(t);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf || motion.matches || document.hidden) return;
    raf = requestAnimationFrame(tick);
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if (motion.addEventListener) motion.addEventListener('change', function () { stop(); resize(); start(); });

  resize(); start();
})();
