/**
 * AlphaCore Interactive Neural Node Topology Canvas
 * Interactive physics canvas simulating connected neural synapses.
 */

export function buildNeuralTopologyCanvas(width = 600, height = 280) {
  const container = document.createElement('div');
  container.className = 'neural-canvas-wrap panel';
  container.style.cssText = 'position: relative; padding: 10px; background: rgba(5,10,18,0.9); border: 1px solid var(--border-accent, rgba(6,182,212,0.3)); border-radius: 6px; overflow: hidden;';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = 'width: 100%; height: 100%; display: block; background: transparent; cursor: crosshair;';

  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const numNodes = 28;
  const nodes = [];

  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      radius: 2.5 + Math.random() * 2,
      pulse: Math.random() * Math.PI * 2
    });
  }

  let mouse = { x: -1000, y: -1000 };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  let animId = null;

  function renderFrame() {
    if (!container.isConnected) {
      if (animId) cancelAnimationFrame(animId);
      return;
    }

    if (document.hidden) {
      animId = requestAnimationFrame(renderFrame);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Get current theme color from CSS root or default
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#06b6d4';

    // Draw connecting synapses
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          const alpha = (1 - dist / 110) * 0.45;
          ctx.strokeStyle = accentColor;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Update & draw nodes
    for (let i = 0; i < numNodes; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      // Mouse interaction force
      const mdx = mouse.x - n.x;
      const mdy = mouse.y - n.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 90) {
        n.x -= (mdx / mdist) * 1.5;
        n.y -= (mdy / mdist) * 1.5;
      }

      n.pulse += 0.05;
      const r = n.radius + Math.sin(n.pulse) * 0.8;

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    animId = requestAnimationFrame(renderFrame);
  }

  animId = requestAnimationFrame(renderFrame);
  return container;
}
