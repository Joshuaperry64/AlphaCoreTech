const { performance } = require('perf_hooks');
const matrixColor = '#06b6d4';
const range = 100;
let dists = [];
for (let i = 0; i < 10000; i++) {
  dists.push(Math.random() * range);
}

// Mock ctx
const ctx = {
  strokeStyle: '',
  globalAlpha: 1.0,
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {}
};

function benchOriginal() {
  const start = performance.now();
  for (let iter = 0; iter < 1000; iter++) {
    for (let i = 0; i < dists.length; i++) {
      const dist = dists[i];
      if (dist < range) {
        const alpha = (1 - (dist / range)) * 0.4;
        ctx.strokeStyle = matrixColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1, 1);
        ctx.stroke();
      }
    }
  }
  return performance.now() - start;
}

function benchGlobalAlpha() {
  const start = performance.now();
  for (let iter = 0; iter < 1000; iter++) {
    ctx.strokeStyle = matrixColor;
    for (let i = 0; i < dists.length; i++) {
      const dist = dists[i];
      if (dist < range) {
        const alpha = (1 - (dist / range)) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1, 1);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;
  }
  return performance.now() - start;
}

console.log('Original:', benchOriginal().toFixed(2), 'ms');
console.log('GlobalAlpha:', benchGlobalAlpha().toFixed(2), 'ms');
