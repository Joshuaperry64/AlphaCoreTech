/**
 * AlphaCore Meade DS Observatory — Sky Catalog & 2D Polar Dome Radar Canvas
 * Provides astronomical coordinate conversions (LST, RA/Dec <-> Alt/Az),
 * catalog of Tonight's Best deep sky targets and bright alignment stars,
 * and an interactive 2D polar projection dome radar with live mount crosshairs.
 */

// -------------------------------------------------------------
// Astronomical Coordinate Math
// -------------------------------------------------------------

/**
 * Computes Local Sidereal Time (LST) in decimal hours [0, 24)
 * @param {Date} date Current UTC Date
 * @param {number} longitudeDeg Observer longitude in degrees (East positive, West negative)
 */
export function calculateLST(date = new Date(), longitudeDeg = -118.25) {
  // Julian Date calculation
  const time = date.getTime();
  const jd = time / 86400000.0 + 2440587.5;
  const d = jd - 2451545.0; // Days from J2000.0

  // Greenwich Mean Sidereal Time (GMST) in hours
  let gmst = 18.697374558 + 24.06570982441908 * d;
  gmst = ((gmst % 24) + 24) % 24;

  // Local Sidereal Time = GMST + (Longitude in degrees / 15.0)
  let lst = gmst + longitudeDeg / 15.0;
  return ((lst % 24) + 24) % 24;
}

/**
 * Converts Right Ascension (hours) and Declination (deg) to Altitude and Azimuth (deg)
 */
export function raDecToAltAz(raHours, decDeg, latDeg, lstHours) {
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;

  const latRad = latDeg * deg2rad;
  const decRad = decDeg * deg2rad;

  // Hour Angle in hours [-12, 12] converted to radians
  let haHours = lstHours - raHours;
  if (haHours > 12) haHours -= 24;
  if (haHours < -12) haHours += 24;
  const haRad = haHours * 15 * deg2rad;

  // Altitude
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altRad * rad2deg;

  // Azimuth - protect against zenith division by zero
  const cosAlt = Math.cos(altRad);
  let azDeg = 0;
  if (Math.abs(cosAlt) > 1e-6) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * Math.sin(altRad)) / (Math.cos(latRad) * cosAlt);
    const sinAz = -Math.cos(decRad) * Math.sin(haRad) / cosAlt;
    const azRad = Math.atan2(sinAz, Math.max(-1, Math.min(1, cosAz)));
    azDeg = azRad * rad2deg;
    azDeg = ((azDeg % 360) + 360) % 360;
  }

  return { altDeg, azDeg, isVisible: altDeg > 0 };
}

/**
 * Searches both deep sky catalog and bright alignment stars
 */
export function findCelestialTarget(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();
  const all = [...SKY_CATALOG, ...ALIGNMENT_STARS];
  return all.find(item => 
    item.id.toLowerCase() === q ||
    item.name.toLowerCase().includes(q) ||
    (item.catalog && item.catalog.toLowerCase().includes(q))
  ) || null;
}

// -------------------------------------------------------------
// Curated Deep-Sky & Planetary Catalog ("Tonight's Best")
// -------------------------------------------------------------
export const SKY_CATALOG = [
  // Planetary & Lunar
  {
    id: 'saturn',
    name: 'Saturn (Ringed Planet)',
    catalog: 'SOLAR-06',
    type: 'PLANET',
    raHours: 22.63, // 22h 38m
    decDeg: -10.42, // -10° 25'
    mag: 0.6,
    constellation: 'Aquarius',
    difficulty: 'NOVICE',
    bestMagnification: '120x - 250x',
    description: 'Gas giant adorned with brilliant ring system, Cassini division gap, and moon Titan.'
  },
  {
    id: 'jupiter',
    name: 'Jupiter (Gas Giant)',
    catalog: 'SOLAR-05',
    type: 'PLANET',
    raHours: 4.20, // 04h 12m
    decDeg: 20.25, // +20° 15'
    mag: -2.5,
    constellation: 'Taurus',
    difficulty: 'NOVICE',
    bestMagnification: '100x - 200x',
    description: 'Atmospheric cloud belts, the Great Red Spot oval, and 4 Galilean moons (Io, Europa, Ganymede, Callisto).'
  },
  {
    id: 'mars',
    name: 'Mars (Red Planet)',
    catalog: 'SOLAR-04',
    type: 'PLANET',
    raHours: 8.75, // 08h 45m
    decDeg: 19.5, // +19° 30'
    mag: -1.2,
    constellation: 'Cancer',
    difficulty: 'INTERMEDIATE',
    bestMagnification: '150x - 300x',
    description: 'Ochre disc with dark basaltic volcanic plains (Syrtis Major) and polar carbon dioxide ice cap.'
  },
  {
    id: 'tycho',
    name: 'Tycho Impact Crater (Moon)',
    catalog: 'LUNAR-CRATER',
    type: 'LUNAR',
    raHours: 12.0,
    decDeg: -43.3,
    mag: -12.5,
    constellation: 'Moon',
    difficulty: 'NOVICE',
    bestMagnification: '80x - 200x',
    description: 'Prominent 85km-wide impact crater featuring jagged rim walls and extensive bright radial rays.'
  },

  // Deep Sky Treasures (Nebulae, Galaxies, Clusters)
  {
    id: 'm42',
    name: 'M42 Orion Nebula',
    catalog: 'NGC 1976',
    type: 'NEBULA',
    raHours: 5.59, // 05h 35m 17s
    decDeg: -5.39, // -05° 23'
    mag: 4.0,
    constellation: 'Orion',
    difficulty: 'NOVICE',
    bestMagnification: '40x - 100x',
    description: 'Spectacular stellar nursery illuminated by the central Trapezium quadruple star cluster.'
  },
  {
    id: 'm31',
    name: 'M31 Andromeda Galaxy',
    catalog: 'NGC 224',
    type: 'GALAXY',
    raHours: 0.71, // 00h 42m 44s
    decDeg: 41.27, // +41° 16'
    mag: 3.4,
    constellation: 'Andromeda',
    difficulty: 'NOVICE',
    bestMagnification: '30x - 60x Wide',
    description: 'Massive spiral galaxy 2.5 million light years distant. Reveals elongated core and dust lanes.'
  },
  {
    id: 'm45',
    name: 'M45 Pleiades (Seven Sisters)',
    catalog: 'Melotte 22',
    type: 'OPEN_CLUSTER',
    raHours: 3.79, // 03h 47m 24s
    decDeg: 24.12, // +24° 07'
    mag: 1.6,
    constellation: 'Taurus',
    difficulty: 'NOVICE',
    bestMagnification: '25x - 50x Wide',
    description: 'Glittering cluster of young blue B-type stars wrapped in gossamer reflection nebulosity.'
  },
  {
    id: 'm13',
    name: 'M13 Great Hercules Cluster',
    catalog: 'NGC 6205',
    type: 'GLOBULAR_CLUSTER',
    raHours: 16.70, // 16h 41m 41s
    decDeg: 36.46, // +36° 27'
    mag: 5.8,
    constellation: 'Hercules',
    difficulty: 'INTERMEDIATE',
    bestMagnification: '80x - 180x',
    description: 'Densely concentrated stellar swarm of over 300,000 ancient stars 22,000 light years away.'
  },
  {
    id: 'm57',
    name: 'M57 Ring Nebula',
    catalog: 'NGC 6720',
    type: 'PLANETARY_NEBULA',
    raHours: 18.89, // 18h 53m 35s
    decDeg: 33.03, // +33° 01'
    mag: 8.8,
    constellation: 'Lyra',
    difficulty: 'INTERMEDIATE',
    bestMagnification: '100x - 220x',
    description: 'Glowing smoke-ring envelope of ionized gas expelled by a dying central white dwarf star.'
  },
  {
    id: 'm51',
    name: 'M51 Whirlpool Galaxy',
    catalog: 'NGC 5194',
    type: 'GALAXY',
    raHours: 13.50, // 13h 29m 52s
    decDeg: 47.20, // +47° 11'
    mag: 8.4,
    constellation: 'Canes Venatici',
    difficulty: 'ADVANCED',
    bestMagnification: '70x - 150x',
    description: 'Grand-design interacting spiral galaxy showing distinct spiral arms wrapping around companion NGC 5195.'
  },
  {
    id: 'albireo',
    name: 'Albireo (Beta Cygni)',
    catalog: 'HIP 95947',
    type: 'DOUBLE_STAR',
    raHours: 19.51, // 19h 30m 43s
    decDeg: 27.96, // +27° 57'
    mag: 3.1,
    constellation: 'Cygnus',
    difficulty: 'NOVICE',
    bestMagnification: '50x - 100x',
    description: 'The premier visual showcase double star in the sky: golden-topaz primary with sapphire companion.'
  }
];

// -------------------------------------------------------------
// 2-Star Alignment Reference Stars
// -------------------------------------------------------------
export const ALIGNMENT_STARS = [
  { id: 'polaris', name: 'Polaris (North Star)', raHours: 2.53, decDeg: 89.26, mag: 1.98, constellation: 'Ursa Minor' },
  { id: 'vega', name: 'Vega', raHours: 18.62, decDeg: 38.78, mag: 0.03, constellation: 'Lyra' },
  { id: 'arcturus', name: 'Arcturus', raHours: 14.26, decDeg: 19.18, mag: -0.05, constellation: 'Boötes' },
  { id: 'deneb', name: 'Deneb', raHours: 20.69, decDeg: 45.28, mag: 1.25, constellation: 'Cygnus' },
  { id: 'altair', name: 'Altair', raHours: 19.85, decDeg: 8.87, mag: 0.77, constellation: 'Aquila' },
  { id: 'capella', name: 'Capella', raHours: 5.28, decDeg: 46.0, mag: 0.08, constellation: 'Auriga' },
  { id: 'sirius', name: 'Sirius', raHours: 6.75, decDeg: -16.72, mag: -1.46, constellation: 'Canis Major' },
  { id: 'betelgeuse', name: 'Betelgeuse', raHours: 5.92, decDeg: 7.41, mag: 0.50, constellation: 'Orion' },
  { id: 'rigel', name: 'Rigel', raHours: 5.24, decDeg: -8.20, mag: 0.13, constellation: 'Orion' },
  { id: 'antares', name: 'Antares', raHours: 16.49, decDeg: -26.43, mag: 1.06, constellation: 'Scorpius' }
];

// -------------------------------------------------------------
// Interactive 2D Polar Sky Dome Radar Canvas Component
// -------------------------------------------------------------
export function createSkyRadarCanvas({ getMountState, onSelectTarget }) {
  const container = document.createElement('div');
  container.className = 'sky-radar-container';
  container.style.cssText = `
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 440px;
    margin: 0 auto;
    border-radius: 50%;
    background: radial-gradient(circle, #020814 0%, #010307 85%, #06111f 100%);
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.2), inset 0 0 35px rgba(0, 0, 0, 0.9);
    border: 2px solid rgba(6, 182, 212, 0.4);
    overflow: hidden;
  `;

  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 440;
  canvas.style.cssText = 'width: 100%; height: 100%; display: block; border-radius: 50%; cursor: crosshair;';
  container.appendChild(canvas);

  let animFrameId = null;
  let selectedTargetId = 'saturn';
  let hoveredTarget = null;

  const ctx = canvas.getContext('2d');

  function render() {
    if (!ctx) return;
    const mount = getMountState ? getMountState() : { altDeg: 40, azDeg: 0, raHours: 2.53, decDeg: 89.26 };
    const lst = calculateLST(new Date(), mount.longitudeDeg || -118.25);
    const observerLat = mount.latitudeDeg || 34.05;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = (canvas.width / 2) - 18;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Radar Background Grid Circles (Altitudes: 0° horizon, 30°, 60°, 90° zenith)
    ctx.lineWidth = 1;
    [0.33, 0.66, 1.0].forEach((scale, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 2 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(6, 182, 212, 0.15)';
      ctx.setLineDash(idx === 2 ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Altitude Labels
    ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText('ZENITH 90°', cx - 24, cy - 6);
    ctx.fillText('60°', cx + 6, cy - (r * 0.33) + 4);
    ctx.fillText('30°', cx + 6, cy - (r * 0.66) + 4);
    ctx.fillText('0° HORIZON', cx + 6, cy - r + 14);

    // 2. Cardinal Crosshairs & Rays (N=Top, E=Right, S=Bottom, W=Left in sky charts with N=0°, E=90°)
    // Standard celestial Alt-Az: North is 0°, East is 90°
    const cardinals = [
      { label: 'N', az: 0, x: cx, y: cy - r + 12 },
      { label: 'E', az: 90, x: cx + r - 12, y: cy + 4 },
      { label: 'S', az: 180, x: cx, y: cy + r - 4 },
      { label: 'W', az: 270, x: cx - r + 6, y: cy + 4 }
    ];

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    cardinals.forEach(c => {
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x, c.y);
    });

    // Helper: Project Alt/Az into (X, Y) canvas pixels
    // Zenith (Alt 90) = center (cx, cy). Horizon (Alt 0) = radius r.
    // Azimuth 0 = N (up), 90 = E (right), 180 = S (down), 270 = W (left)
    const project = (alt, az) => {
      const normR = Math.max(0, Math.min(1, (90 - alt) / 90)) * r;
      const azRad = (az - 90) * (Math.PI / 180); // shift so 0° is up
      return {
        x: cx + normR * Math.cos(azRad),
        y: cy + normR * Math.sin(azRad)
      };
    };

    // 3. Render Catalog Objects & Alignment Stars
    const allObjects = [...SKY_CATALOG, ...ALIGNMENT_STARS];

    allObjects.forEach(obj => {
      const { altDeg, azDeg, isVisible } = raDecToAltAz(obj.raHours, obj.decDeg, observerLat, lst);
      obj._alt = altDeg;
      obj._az = azDeg;
      obj._isVisible = isVisible;

      if (!isVisible && altDeg < -10) return; // skip far below horizon

      const pt = project(altDeg, azDeg);
      obj._x = pt.x;
      obj._y = pt.y;

      const isSelected = obj.id === selectedTargetId;

      ctx.save();
      // Target icon style
      if (obj.type === 'PLANET') {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      } else if (obj.type === 'NEBULA' || obj.type === 'PLANETARY_NEBULA') {
        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      } else if (obj.type === 'GALAXY') {
        ctx.fillStyle = '#8b5cf6';
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      }

      // Draw dot
      ctx.beginPath();
      const dotRadius = isSelected ? 5.5 : Math.max(2.5, 4.5 - obj.mag * 0.4);
      ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      // Halo if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius + 6, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#00ff66';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 10px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`▶ ${obj.name}`, pt.x + 10, pt.y + 3);
      } else if (obj.mag < 1.0) {
        // Show bright star/planet name
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(obj.name.split(' ')[0], pt.x + 6, pt.y - 4);
      }
      ctx.restore();
    });

    // 4. Slew Vector Line (From Mount to Selected Target)
    const activeTarget = allObjects.find(o => o.id === selectedTargetId);
    const mountAlt = Number.isFinite(mount.altDeg) ? mount.altDeg : 40;
    const mountAz = Number.isFinite(mount.azDeg) ? mount.azDeg : 0;
    const mountPt = project(mountAlt, mountAz);

    if (activeTarget && activeTarget._x && activeTarget._y) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mountPt.x, mountPt.y);
      ctx.lineTo(activeTarget._x, activeTarget._y);
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.35)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Mount Live Reticle Crosshair
    ctx.save();
    ctx.translate(mountPt.x, mountPt.y);

    // Glowing Reticle Ring
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.strokeStyle = mount.isSlewing ? '#ff003c' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = mount.isSlewing ? '#ff003c' : '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -7);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 14);
    ctx.moveTo(-14, 0);
    ctx.lineTo(-7, 0);
    ctx.moveTo(7, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Mount Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = mount.isSlewing ? '#ff003c' : '#06b6d4';
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mount.isSlewing ? 'SLEWING' : 'MOUNT', 0, 24);

    ctx.restore();

    animFrameId = requestAnimationFrame(render);
  }

  // Click event for selecting celestial target
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const allObjects = [...SKY_CATALOG, ...ALIGNMENT_STARS];
    let closest = null;
    let minDist = 25; // click radius tolerance

    allObjects.forEach(obj => {
      if (obj._x !== undefined && obj._y !== undefined) {
        const d = Math.hypot(clickX - obj._x, clickY - obj._y);
        if (d < minDist) {
          minDist = d;
          closest = obj;
        }
      }
    });

    if (closest) {
      selectedTargetId = closest.id;
      if (onSelectTarget) {
        onSelectTarget(closest);
      }
    }
  });

  // Start radar render loop
  render();

  return {
    element: container,
    selectTarget: (targetId) => {
      selectedTargetId = targetId;
      const target = [...SKY_CATALOG, ...ALIGNMENT_STARS].find(o => o.id === targetId);
      if (target && onSelectTarget) {
        onSelectTarget(target);
      }
    },
    destroy: () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  };
}
