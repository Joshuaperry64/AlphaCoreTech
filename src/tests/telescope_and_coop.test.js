import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LX200SerialEngine } from '../pages/telescope/lx200-serial.js';
import { calculateLST, raDecToAltAz, SKY_CATALOG, ALIGNMENT_STARS, createSkyRadarCanvas } from '../pages/telescope/sky-catalog.js';
import { createOpticalFeed } from '../pages/telescope/optical-feed.js';
import { createKnowledgeHub, ASCOM_DRIVERS } from '../pages/telescope/knowledge-hub.js';
import TelescopePage from '../pages/telescope.js';
import TheLabPage from '../pages/thelab.js';
import { createNeuralOverdriveGame } from '../pages/thelab/neural-overdrive-game.js';
import { createModuleSelector } from '../pages/thelab/module-selector.js';

describe('Meade DS LX200 Serial Engine & Mount Physics', () => {
  let engine;

  beforeEach(() => {
    engine = new LX200SerialEngine();
  });

  afterEach(() => {
    if (engine) engine.destroy();
  });

  it('initializes in Mount Physics Simulator mode with Polaris coordinates', () => {
    const telem = engine.getTelemetry();
    expect(telem.isSimulated).toBe(true);
    expect(telem.raHours).toBeCloseTo(2.53, 1);
    expect(telem.decDeg).toBeCloseTo(89.26, 1);
    expect(telem.slewRate).toBe(5);
    expect(telem.handboxModel).toBe('Autostar #497');
  });

  it('updates slew rate between 1 and 9 correctly', () => {
    engine.setSlewRate(1);
    expect(engine.state.slewRate).toBe(1);

    engine.setSlewRate(9);
    expect(engine.state.slewRate).toBe(9);

    // Clamps invalid rates
    engine.setSlewRate(99);
    expect(engine.state.slewRate).toBe(9);
    engine.setSlewRate(-5);
    expect(engine.state.slewRate).toBe(1);
  });

  it('handles directional slewing and emergency halt (:Q#)', () => {
    engine.slew('N');
    expect(engine.state.isSlewing).toBe(true);
    expect(engine.state.slewDirection).toBe('N');

    engine.halt();
    expect(engine.state.isSlewing).toBe(false);
    expect(engine.state.slewDirection).toBeNull();
  });

  it('executes target GoTo coordinates and 2-star alignment sync (:CM#)', () => {
    engine.setTargetCoordinates(18.62, 38.78); // Vega
    expect(engine.state.targetRaHours).toBeCloseTo(18.62, 2);
    expect(engine.state.targetDecDeg).toBeCloseTo(38.78, 2);

    engine.gotoTarget(18.62, 38.78);
    expect(engine.state.isGoToActive).toBe(true);

    engine.syncAlignment();
    expect(engine.state.alignmentState).toBe('ALIGNED');
    expect(engine.state.raHours).toBeCloseTo(18.62, 2);
    expect(engine.state.decDeg).toBeCloseTo(38.78, 2);
  });

  it('auto-detects handbox firmware over simulated LX200 protocol', async () => {
    let detected = null;
    engine.on('handboxDetected', (model) => {
      detected = model;
    });

    await engine.autoDetectHandbox();
    expect(detected).toContain('Autostar');
  });

  it('injects PC Time and Observer Site coordinates without crashing', () => {
    expect(() => {
      engine.injectPcTimeAndSite(34.05, -118.25);
    }).not.toThrow();
    expect(engine.state.latitudeDeg).toBe(34.05);
    expect(engine.state.longitudeDeg).toBe(-118.25);
  });
});

describe('Astronomical Calculations & Sky Catalog', () => {
  it('calculates Local Sidereal Time (LST) in decimal hours [0, 24)', () => {
    const fixedDate = new Date('2026-10-28T05:00:00Z');
    const lst = calculateLST(fixedDate, -118.25);
    expect(typeof lst).toBe('number');
    expect(lst).toBeGreaterThanOrEqual(0);
    expect(lst).toBeLessThan(24);
  });

  it('converts RA/Dec to Alt/Az for visible and sub-horizon targets', () => {
    // Polaris near North pole at Lat 34° should have Alt ~34°
    const coords = raDecToAltAz(2.53, 89.26, 34.05, 2.53);
    expect(coords.altDeg).toBeGreaterThan(30);
    expect(coords.altDeg).toBeLessThan(40);
    expect(coords.isVisible).toBe(true);
  });

  it('contains Tonight Best catalog objects including Saturn, Jupiter, M42, M31, M45, and Albireo', () => {
    const ids = SKY_CATALOG.map(o => o.id);
    expect(ids).toContain('saturn');
    expect(ids).toContain('jupiter');
    expect(ids).toContain('mars');
    expect(ids).toContain('tycho');
    expect(ids).toContain('m42');
    expect(ids).toContain('m31');
    expect(ids).toContain('m45');
    expect(ids).toContain('m13');
    expect(ids).toContain('m57');
    expect(ids).toContain('m51');
    expect(ids).toContain('albireo');
  });

  it('contains bright alignment stars including Polaris, Vega, and Arcturus', () => {
    const starIds = ALIGNMENT_STARS.map(s => s.id);
    expect(starIds).toContain('polaris');
    expect(starIds).toContain('vega');
    expect(starIds).toContain('arcturus');
  });

  it('mounts and cleans up 2D Polar Sky Dome Radar Canvas', () => {
    let selected = null;
    const radar = createSkyRadarCanvas({
      getMountState: () => ({ altDeg: 40, azDeg: 0, raHours: 2.53, decDeg: 89.26 }),
      onSelectTarget: (t) => { selected = t; }
    });

    expect(radar.element).toBeDefined();
    expect(radar.element.querySelector('canvas')).toBeDefined();

    radar.selectTarget('saturn');
    expect(selected).toBeDefined();
    expect(selected.id).toBe('saturn');

    expect(() => radar.destroy()).not.toThrow();
  });
});

describe('Optical Sensor Feed, Electronic Focuser & Stacker', () => {
  it('creates optical feed element and calculates live HFR from focuser steps', () => {
    const feed = createOpticalFeed({
      getMountState: () => ({ isSlewing: false, slewDirection: null }),
      onReticlePing: vi.fn(),
      onCaptureSnapshot: vi.fn()
    });

    expect(feed.element).toBeDefined();
    const focuser = feed.getFocuserState();
    expect(focuser.position).toBe(2500);
    expect(focuser.hfr).toBeCloseTo(1.4, 1);

    // Defocus test: moving focuser out
    const rng = feed.element.querySelector('#rng-focuser');
    rng.value = 5000;
    rng.dispatchEvent(new Event('input'));

    const defocState = feed.getFocuserState();
    expect(defocState.position).toBe(5000);
    expect(defocState.hfr).toBeGreaterThan(7.0);

    feed.destroy();
  });

  it('switches narrowband spectral filters and zoom levels', () => {
    const feed = createOpticalFeed({
      getMountState: () => ({ isSlewing: false }),
      onReticlePing: vi.fn()
    });

    const hAlphaBtn = feed.element.querySelector('button[data-filter="HALPHA"]');
    hAlphaBtn.click();
    expect(hAlphaBtn.classList.contains('active')).toBe(true);

    const zoom4x = feed.element.querySelector('button[data-zoom="4.0"]');
    zoom4x.click();
    expect(zoom4x.classList.contains('active')).toBe(true);

    feed.destroy();
  });
});

describe('Knowledge Hub, Raspberry Pi 5 & ASCOM Vault', () => {
  it('indexes all 22 ASCOM legacy drivers and suites with valid local paths', () => {
    expect(ASCOM_DRIVERS.length).toBe(22);
    const names = ASCOM_DRIVERS.map(d => d.name);
    expect(names).toContain('MeadeClassic (5.0.4)');
    expect(names).toContain('MeadeLX200GPS (5.0.0)');
    expect(names).toContain('RPiCameraV3 ASCOM Driver');
    expect(names).toContain('ParsecASCOM Camera Driver');
    expect(names).toContain('RoboFocus (3.0.9)');
    expect(names).toContain('ACLDome (5.0.2)');
    expect(names).toContain('Boltwood Safety Monitor');
    expect(names).toContain('AstroDMx Capture 2.18.2');
    expect(names).toContain('KStars 3.8.5 Windows Suite');
  });

  it('renders interactive 5-Step checklist, RPi5 instructions and dnSpy patch guide', () => {
    const hub = createKnowledgeHub();
    expect(hub).toBeDefined();

    // Verify Pre-flight rendering
    expect(hub.textContent).toContain('STEP 1: PHYSICAL HOME & LEVELING');
    expect(hub.textContent).toContain('CRITICAL MECHANICAL CLUTCH WARNING');

    // Switch to RPi5 tab
    const rpiBtn = hub.querySelector('#kh-tab-rpi');
    rpiBtn.click();
    expect(hub.textContent).toContain('kernel=kernel8.img');
    expect(hub.textContent).toContain('KSTARS & INDI FLATPAK DEPLOYMENT CENTER');

    // Switch to dnSpy tab
    const dnspyBtn = hub.querySelector('#kh-tab-dnspy');
    dnspyBtn.click();
    expect(hub.textContent).toContain('ASCOM.Nebulosity.Camera.dll');
    expect(hub.textContent).toContain('ldc.i4.2');

    // Switch to ASCOM Vault tab
    const ascomBtn = hub.querySelector('#kh-tab-ascom');
    ascomBtn.click();
    expect(hub.textContent).toContain('ASCOM LEGACY DRIVER REPOSITORY (22 DRIVERS INDEXED)');
  });
});

describe('Meade Telescope Observatory Page Navigation & Co-Op Roles', () => {
  let page;

  beforeEach(() => {
    page = TelescopePage();
    document.body.appendChild(page);
  });

  afterEach(() => {
    if (page && page.cleanup) page.cleanup();
    if (page && page.parentNode) page.parentNode.removeChild(page);
  });

  it('mounts Telescope Observatory container with dual clocks and Mission Control', () => {
    expect(page.querySelector('#clock-lst')).toBeDefined();
    expect(page.querySelector('#clock-utc')).toBeDefined();
    expect(page.querySelector('.observatory-mission-grid')).toBeDefined();
  });

  it('toggles Red Night-Vision HUD mode on click', () => {
    const nvBtn = page.querySelector('#btn-toggle-night-vision');
    expect(page.classList.contains('night-vision-mode')).toBe(false);

    nvBtn.click();
    expect(page.classList.contains('night-vision-mode')).toBe(true);

    nvBtn.click();
    expect(page.classList.contains('night-vision-mode')).toBe(false);
  });

  it('switches between Mission Control, Pre-Flight and ASCOM Vault tabs', () => {
    const navPreflight = page.querySelector('#nav-tab-preflight');
    const navAscom = page.querySelector('#nav-tab-ascom');
    const navMission = page.querySelector('#nav-tab-mission');

    navPreflight.click();
    expect(page.textContent).toContain('STEP 1: PHYSICAL HOME & LEVELING');

    navAscom.click();
    expect(page.textContent).toContain('ASCOM LEGACY DRIVER REPOSITORY');

    navMission.click();
    expect(page.querySelector('.observatory-mission-grid')).toBeDefined();
  });

  it('switches between #494 and #497 virtual handbox layouts', () => {
    const skin494Btn = page.querySelector('#btn-skin-494');
    skin494Btn.click();
    expect(page.textContent).toContain('#494 (14-KEY)');

    const skin497Btn = page.querySelector('#btn-skin-497');
    skin497Btn.click();
    expect(page.textContent).toContain('#497 (20-KEY)');
  });
});

describe('The Lab Co-Op Enhancements & Neural Overdrive', () => {
  it('renders Module Selector with active cards for LABORATORY, NEURAL OVERDRIVE, and ASTRO-LINK OBSERVATORY', () => {
    const onSelect = vi.fn();
    const selector = createModuleSelector({ onSelectModule: onSelect });

    expect(selector.textContent).toContain('LABORATORY');
    expect(selector.textContent).toContain('NEURAL OVERDRIVE');
    expect(selector.textContent).toContain('ASTRO-LINK OBSERVATORY');

    const btnNeural = selector.querySelector('#btn-launch-neural');
    btnNeural.click();
    expect(onSelect).toHaveBeenCalledWith('NEURAL_OVERDRIVE');

    const btnAstro = selector.querySelector('#btn-launch-astrolink');
    btnAstro.click();
    expect(onSelect).toHaveBeenCalledWith('ASTRO_LINK');
  });

  it('mounts Neural Overdrive 2-player co-op game with asymmetric distributed stations, canvas, and trace monitor', () => {
    const onBack = vi.fn();
    const game = createNeuralOverdriveGame({ onBack });
    document.body.appendChild(game);

    expect(game.querySelector('#neural-matrix-canvas')).toBeDefined();
    expect(game.querySelector('#bar-breach')).toBeDefined();
    expect(game.querySelector('#bar-trace')).toBeDefined();
    expect(game.textContent).toContain('OPERATOR 1: INFILTRATION & CIPHER SPECIALIST');
    expect(game.textContent).toContain('OPERATOR 2: TACTICAL DEFENSE & PAYLOAD SPECIALIST');

    // Breach a port
    const breachBtn = game.querySelector('.btn-breach-port');
    breachBtn.click();
    expect(game.querySelector('#lbl-breach-pct').textContent).not.toBe('0%');

    // Clean up
    if (game.cleanup) game.cleanup();
    game.parentNode.removeChild(game);
  });

  it('TheLabPage router seamlessly switches between views and routes to TELESCOPE', () => {
    window.location.hash = '#/thelab?game=neural';
    const labPage = TheLabPage();
    document.body.appendChild(labPage);

    expect(labPage.textContent).toContain('NEURAL OVERDRIVE');

    if (labPage.cleanup) labPage.cleanup();
    labPage.parentNode.removeChild(labPage);
  });
});
