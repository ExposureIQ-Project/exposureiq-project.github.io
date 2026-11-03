/* ExposureIQ decorative network background. */

(function () {
  const canvas = document.getElementById("net");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];
  let frame = null;
  let resizeTimer = null;

  function makeNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: 1.3 + Math.random() * 1.5,
      color: Math.random() < 0.2
        ? "146,151,255"
        : "56,225,195"
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(
      20,
      Math.min(65, Math.round(width * height / 26000))
    );

    while (nodes.length < count) nodes.push(makeNode());
    nodes.length = count;

    for (const node of nodes) {
      node.x = Math.min(node.x, width);
      node.y = Math.min(node.y, height);
    }

    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const maxDistance = width < 600 ? 105 : 145;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (distance >= maxDistance) continue;

        const opacity = (1 - distance / maxDistance) * 0.34;

        ctx.strokeStyle = `rgba(56,225,195,${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      ctx.fillStyle = `rgba(${node.color},.72)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -10) node.x = width + 10;
      if (node.x > width + 10) node.x = -10;
      if (node.y < -10) node.y = height + 10;
      if (node.y > height + 10) node.y = -10;
    }

    draw();
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (frame !== null || reducedMotion.matches || document.hidden) return;
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  function onMotionChange() {
    stop();
    draw();
    start();
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", onMotionChange);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(onMotionChange);
  }

  resize();
  start();
})();