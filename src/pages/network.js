/**
 * Network Matrix Page — Global Node Topology & Traffic Monitor
 * Visualizes connection nodes, latency, and system traffic routing.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function NetworkMatrixPage() {
  const container = createElement('div', { class: 'network-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// NETWORK_MATRIX">// NETWORK_MATRIX</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Global infrastructure topology, live traffic routing, and node latency monitoring.</p>
    </div>

    <!-- Quick Action Control Bar -->
    <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:var(--accent,#06b6d4); font-weight:bold;">NETWORK COMMANDS:</span>
        <button id="btn-reroute-traffic" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#ef4444;">
          ⚡ REROUTE TRAFFIC
        </button>
        <button id="btn-ping-all" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.2); border-color:#10b981; color:#10b981;">
          📡 PING ALL NODES
        </button>
      </div>

      <div style="font-size: 0.8rem; color: #888;">
        TOTAL ACTIVE NODES: <span id="active-nodes-count" style="color: var(--accent,#06b6d4); font-weight: bold;">0</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 320px; gap:20px; font-family:'Share Tech Mono',monospace;">
      <!-- Canvas Topology Visualizer -->
      <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px; min-height: 400px; display: flex; flex-direction: column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:#fff;">
            GLOBAL CONNECTION TOPOLOGY
          </span>
          <span id="network-status" style="font-size:0.75rem; color:#10b981;">● SYNCED</span>
        </div>
        <div style="flex: 1; position: relative; width: 100%; border:1px solid rgba(255,255,255,0.08); border-radius:4px; overflow: hidden; background: rgba(0,0,0,0.4);">
          <canvas id="network-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
        </div>
      </div>

      <!-- Node Inspector Panel -->
      <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">
            NODE INSPECTOR
          </span>
        </div>

        <div id="node-inspector-content" style="flex:1; display:flex; flex-direction:column; gap: 15px; color: #ccc; font-size: 0.85rem;">
          <div style="text-align: center; color: #666; margin-top: 50px;">
            Hover or click on a node in the topology map to inspect its real-time telemetry.
          </div>
        </div>
      </div>
    </div>
  `;

  // Apply responsive grid for mobile
  const gridContainer = container.querySelector('div[style*="grid-template-columns"]');
  if (window.innerWidth <= 768) {
    gridContainer.style.gridTemplateColumns = '1fr';
  }

  function handleGridResize() {
    if (window.innerWidth <= 768) {
      gridContainer.style.gridTemplateColumns = '1fr';
    } else {
      gridContainer.style.gridTemplateColumns = '1fr 320px';
    }
  }

  window.addEventListener('resize', handleGridResize);

  const canvas = container.querySelector('#network-canvas');
  const ctx = canvas.getContext('2d');
  const nodeInspector = container.querySelector('#node-inspector-content');
  const activeNodesCount = container.querySelector('#active-nodes-count');

  let nodes = [];
  let links = [];
  let animationFrameId;
  let hoveredNode = null;

  // Configuration
  const nodeCount = 15;
  const linkDistance = 180;

  // Data sets for realistic looking nodes
  const regions = ['US-EAST', 'US-WEST', 'EU-CENTRAL', 'AP-NORTHEAST', 'SA-EAST', 'EU-WEST'];
  const types = ['EDGE', 'CORE', 'DATABASE', 'COMPUTE', 'GATEWAY'];

  function initNetwork() {
    nodes = [];
    links = [];

    // Core node
    nodes.push({
      id: 'ALPHA-PRIMARY',
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0, vy: 0,
      radius: 8,
      region: 'US-EAST',
      type: 'CORE',
      load: Math.random() * 100,
      ping: Math.floor(Math.random() * 10) + 1,
      isCore: true
    });

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `NODE-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 3,
        region: regions[Math.floor(Math.random() * regions.length)],
        type: types[Math.floor(Math.random() * types.length)],
        load: Math.random() * 100,
        ping: Math.floor(Math.random() * 120) + 5,
        isCore: false
      });
    }

    activeNodesCount.textContent = nodes.length;
    updateLinks();
  }

  function updateLinks() {
    links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Connect to core if close enough or connect other nodes
        if (dist < linkDistance || (nodes[i].isCore && dist < linkDistance * 2)) {
          links.push({
            source: nodes[i],
            target: nodes[j],
            distance: dist,
            activity: Math.random() // for animating packets
          });
        }
      }
    }
  }

  function resizeCanvas() {
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (nodes.length === 0) {
        initNetwork();
      }
    }
  }

  function renderNetwork() {
    if (!container.isConnected) return;

    const isEcoMode = localStorage.getItem('alphacore_eco_mode') === 'true';
    if (document.hidden || isEcoMode) {
       animationFrameId = requestAnimationFrame(renderNetwork);
       return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Node positions
    nodes.forEach(node => {
      if (!node.isCore) {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls
        if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1;
        if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1;

        // Randomly adjust load and ping
        if (Math.random() > 0.98) {
          node.load = Math.max(0, Math.min(100, node.load + (Math.random() * 20 - 10)));
          node.ping = Math.max(1, node.ping + Math.floor(Math.random() * 10 - 5));
        }
      } else {
        node.x = canvas.width / 2;
        node.y = canvas.height / 2;
        if (Math.random() > 0.95) {
            node.load = Math.max(0, Math.min(100, node.load + (Math.random() * 10 - 5)));
        }
      }
    });

    // Recalculate links periodically or based on movement
    if (Math.random() > 0.95) updateLinks();

    // Draw Links
    links.forEach(link => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const opacity = Math.max(0, 1 - (dist / (linkDistance * 1.5)));

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      // Highlight links connected to hovered node
      if (hoveredNode && (link.source === hoveredNode || link.target === hoveredNode)) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity + 0.2})`; // Emerald green for selected
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.5})`; // Cyan for regular
        ctx.lineWidth = 0.5;
      }
      ctx.stroke();

      // Animate data packets along the link
      link.activity += 0.02;
      if (link.activity > 1) link.activity = 0;

      if (opacity > 0.2) {
        const px = link.source.x + dx * link.activity;
        const py = link.source.y + dy * link.activity;

        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode)
          ? '#10b981' : '#06b6d4';
        ctx.fill();
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

      if (node === hoveredNode) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
      } else if (node.isCore) {
        ctx.fillStyle = '#f59e0b'; // Amber
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f59e0b';
      } else if (node.load > 85) {
        ctx.fillStyle = '#ef4444'; // Red if overloaded
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ef4444';
      } else {
        ctx.fillStyle = '#06b6d4'; // Cyan
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#06b6d4';
      }

      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw label for core or hovered
      if (node.isCore || node === hoveredNode) {
        ctx.font = '10px "Share Tech Mono"';
        ctx.fillStyle = '#fff';
        ctx.fillText(node.id, node.x + node.radius + 5, node.y + 3);
      }
    });

    animationFrameId = requestAnimationFrame(renderNetwork);
  }

  // Interaction
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = null;
    let minDist = Infinity;

    nodes.forEach(node => {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < node.radius + 5 && dist < minDist) {
        found = node;
        minDist = dist;
      }
    });

    if (found !== hoveredNode) {
      hoveredNode = found;
      updateInspector();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredNode = null;
    updateInspector();
  });

  function updateInspector() {
    if (!hoveredNode) {
      nodeInspector.innerHTML = `
        <div style="text-align: center; color: #666; margin-top: 50px;">
          Hover or click on a node in the topology map to inspect its real-time telemetry.
        </div>
      `;
      return;
    }

    const loadColor = hoveredNode.load > 85 ? '#ef4444' : (hoveredNode.load > 50 ? '#f59e0b' : '#10b981');
    const pingColor = hoveredNode.ping > 100 ? '#ef4444' : (hoveredNode.ping > 50 ? '#f59e0b' : '#10b981');

    nodeInspector.innerHTML = `
      <div style="display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
        <span style="color: #888;">NODE ID</span>
        <span style="color: #fff; font-weight: bold;">${hoveredNode.id}</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
        <span style="color: #888;">TYPE</span>
        <span style="color: var(--accent,#06b6d4);">${hoveredNode.type}</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
        <span style="color: #888;">REGION</span>
        <span style="color: #ccc;">${hoveredNode.region}</span>
      </div>

      <div style="margin-top: 10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
          <span style="color: #888; font-size: 0.75rem;">COMPUTE LOAD</span>
          <span style="color: ${loadColor}; font-weight: bold; font-size: 0.75rem;">${hoveredNode.load.toFixed(1)}%</span>
        </div>
        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div style="width: ${hoveredNode.load}%; height: 100%; background: ${loadColor}; transition: width 0.3s;"></div>
        </div>
      </div>

      <div style="margin-top: 5px;">
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
          <span style="color: #888; font-size: 0.75rem;">NETWORK LATENCY (PING)</span>
          <span style="color: ${pingColor}; font-weight: bold; font-size: 0.75rem;">${hoveredNode.ping} ms</span>
        </div>
        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div style="width: ${Math.min(100, (hoveredNode.ping / 200) * 100)}%; height: 100%; background: ${pingColor}; transition: width 0.3s;"></div>
        </div>
      </div>

      <div style="margin-top: auto; display: flex; gap: 10px; padding-top: 15px;">
        <button class="aim-btn aim-btn-sm" onclick="alert('Isolating Node: ${hoveredNode.id}')" style="flex: 1; border-color: rgba(255,255,255,0.2); color: #aaa;">
          ISOLATE
        </button>
        <button class="aim-btn aim-btn-sm" onclick="alert('Pinging Node: ${hoveredNode.id}')" style="flex: 1; background: rgba(6,182,212,0.1); border-color: var(--accent,#06b6d4); color: var(--accent,#06b6d4);">
          PING
        </button>
      </div>
    `;
  }

  // Start
  setTimeout(() => {
    resizeCanvas();
    renderNetwork();
  }, 100);

  // Button actions
  container.querySelector('#btn-reroute-traffic').onclick = () => {
    showToast('WARN', 'Initiating global BGP reroute. Optimization in progress...');
    nodes.forEach(n => {
      if (!n.isCore) {
        n.vx = (Math.random() - 0.5) * 2;
        n.vy = (Math.random() - 0.5) * 2;
        n.load = Math.max(0, n.load - 20); // Simulate load dropping after reroute
      }
    });
    updateLinks();
    setTimeout(() => {
      showToast('SUCCESS', 'Traffic rerouted. Latency normalized.');
    }, 2000);
  };

  container.querySelector('#btn-ping-all').onclick = () => {
    showToast('INFO', 'Pinging all network nodes...');
    nodes.forEach(n => {
      n.ping = Math.max(1, n.ping - Math.floor(Math.random() * 5)); // Simulate slight improvement
    });
    if (hoveredNode) updateInspector();
    setTimeout(() => {
      showToast('SUCCESS', 'Ping sweep complete. 0 nodes offline.');
    }, 1500);
  };

  // Cleanup
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleGridResize);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return container;
}
