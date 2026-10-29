/**
 * AlphaCore Meade DS Observatory — Knowledge Hub, Pre-Flight Guide & ASCOM Vault
 * Integrates all manuals, deployment notes, and legacy drivers from C:\Users\josh6\Documents\Telescope:
 * 1. Interactive 5-Step Pre-Flight Checklist (Leveling, Clutches, Magnetic Declination, Autostar init, 2-Star Sync)
 * 2. Visual Handbox Identifier (#494 14-button vs #497 20-button) & WebSerial Auto-Probe
 * 3. Raspberry Pi 5 kernel8.img Fix & Linux KStars Flatpak Deployment Suite
 * 4. ASCOM Legacy Driver Directory Browser (all 22 drivers with local paths and PowerShell launch commands)
 * 5. dnSpy IL Bytecode Patch Documentation for ASCOM.Nebulosity.Camera.dll (N.I.N.A. RGGB SensorType fix)
 */

import { showToast } from '../../components/toast.js';
import { playClick, playSuccess } from '../thelab/audio-synth.js';

export const ASCOM_DRIVERS = [
  {
    name: 'MeadeClassic (5.0.4)',
    category: 'TELESCOPE',
    version: '5.0.4',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeClassic(5.0.4)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeClassic(5.0.4)Setup.md',
    desc: 'Primary ASCOM driver for Meade DS, LXD, ETX, and Classic LX200 mounts equipped with Autostar #494, #495, or #497 controllers.'
  },
  {
    name: 'MeadeLX200GPS (5.0.0)',
    category: 'TELESCOPE',
    version: '5.0.0',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeLX200GPS(5.0.0)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeLX200GPS(5.0.0)Setup.md',
    desc: 'ASCOM driver supporting Meade LX200GPS, LX200R, and LX200-ACF computerized telescopes with Autostar II.'
  },
  {
    name: 'MeadeMaxMount (1.0.0)',
    category: 'TELESCOPE',
    version: '1.0.0',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeMaxMount(1.0.0)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\MeadeMaxMount(1.0.0)Setup.md',
    desc: 'ASCOM driver for Meade flagship MAX Robotic German Equatorial Mount.'
  },
  {
    name: 'ACLTelescope (6.0.1)',
    category: 'TELESCOPE',
    version: '6.0.1',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\ACLTelescope(6.0.1)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\ACLTelescope(6.0.1)Setup.md',
    desc: 'ASCOM driver for Astronomy Command Language (ACL) compliant observatory telescope mounts.'
  },
  {
    name: 'LXPTelescope (5.0.1)',
    category: 'TELESCOPE',
    version: '5.0.1',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\LXPTelescope(5.0.1)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\LXPTelescope(5.0.1)Setup.md',
    desc: 'LXP protocol ASCOM telescope driver for custom Meade LX-derivative serial bridges.'
  },
  {
    name: 'LittleFootClassic (1.0.0)',
    category: 'TELESCOPE',
    version: '1.0.0',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\LittleFootClassic(1.0.0)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\LittleFootClassic(1.0.0)Setup.md',
    desc: 'ASCOM driver for LittleFoot Classic telescope drive and stepper motor controllers.'
  },
  {
    name: 'GeminiTelescope (1.0.75.0)',
    category: 'TELESCOPE',
    version: '1.0.75.0',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\GeminiTelescopeInstaller(1.0.75.0).exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\GeminiTelescopeInstaller(1.0.75.0)..md',
    desc: 'ASCOM driver for Losmandy Gemini 1 and Gemini 2 computerized telescope drive systems.'
  },
  {
    name: 'Celestron Telescope & Focuser',
    category: 'TELESCOPE',
    version: '6.1.7350',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\Celestron Telescope and Focuser Setup (6.1.7350).exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\Celestron Telescope and Focuser Setup (6.1.7350).md',
    desc: 'Unified ASCOM driver for Celestron NexStar mounts and motorized focusers.'
  },
  {
    name: 'VixenSS2K (6.1.7)',
    category: 'TELESCOPE',
    version: '6.1.7',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\VixenSS2K(6.1.7)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\VixenSS2K(6.1.7)Setup.md',
    desc: 'ASCOM driver for Vixen SkySensor 2000 PC astronomical controller.'
  },
  {
    name: 'iOptron Telescope',
    category: 'TELESCOPE',
    version: 'Legacy',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\iOptronSetup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\iOptronSetup.md',
    desc: 'Legacy ASCOM driver for iOptron SmartStar, SmartEQ, and CEM series mounts.'
  },
  {
    name: 'RalphPass ASCOM for Meade',
    category: 'TELESCOPE',
    version: 'Legacy',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\RalphPass ASCOM DriversForMeade.md',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\TelescopeDrivers\\RalphPass ASCOM DriversForMeade.md',
    desc: 'Enhanced Meade LX200/Autostar driver suite engineered by Ralph Pass with custom precision timing.'
  },
  {
    name: 'ParsecASCOM Camera Driver',
    category: 'CAMERA',
    version: 'Legacy',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\CameraAndVideoDrivers\\ParsecASCOM.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\CameraAndVideoDrivers\\ParsecASCOMNotes.txt',
    desc: 'ASCOM camera driver suite for Parsec astrophotography sensors and Nebulosity bridges.'
  },
  {
    name: 'RPiCameraV3 ASCOM Driver',
    category: 'CAMERA',
    version: '3.0',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\CameraAndVideoDrivers\\RPiCameraV3_Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\CameraAndVideoDrivers\\RPiCameraV3_Setup.md',
    desc: 'ASCOM Windows driver interfacing directly with Raspberry Pi Camera Module 3 / HQ Camera over TCP network socket.'
  },
  {
    name: 'RoboFocus (3.0.9)',
    category: 'FOCUSER',
    version: '3.0.9',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\FocuserDrivers\\RoboFocus(3.0.9)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\FocuserDrivers\\RoboFocusServer(5.2.0a)Setup.exe',
    desc: 'Standard ASCOM driver for Technical Innovations RoboFocus precision stepper motor focuser.'
  },
  {
    name: 'RoboFocusServer (5.2.0a)',
    category: 'FOCUSER',
    version: '5.2.0a',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\FocuserDrivers\\RoboFocusServer(5.2.0a)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\FocuserDrivers\\RoboFocus(3.0.9)Setup.exe',
    desc: 'Multi-client ASCOM COM LocalServer for RoboFocus motorized electronic focusers.'
  },
  {
    name: 'ACLDome (5.0.2)',
    category: 'DOME',
    version: '5.0.2',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\ACLDome(5.0.2)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\ACLDome(5.0.2)Setup.md',
    desc: 'ASCOM driver for Astronomy Command Language (ACL) motorized observatory domes.'
  },
  {
    name: 'CyberDrive Dome (5.0.1)',
    category: 'DOME',
    version: '5.0.1',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\CyberDrive(5.0.1)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\CyberDrive(5.0.1)Setup.md',
    desc: 'ASCOM dome controller driver for CyberSys motorized rotation and shutter mechanisms.'
  },
  {
    name: 'PCTCS Combined Dome & Focuser',
    category: 'DOME',
    version: '5.0.1',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\PCTCSCombined(5.0.1)Setup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\PCTCSCombined(5.0.1)Setup.md',
    desc: 'Combined ASCOM driver controlling both PC-TCS observatory dome rotation and telescope electronic focuser.'
  },
  {
    name: 'Astrohaven Dome Driver',
    category: 'DOME',
    version: 'Legacy',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\Astrohaven Ascom Driver.zip',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\DomeAndRoofDrivers\\Astrohaven Ascom Driver.md',
    desc: 'ASCOM driver for Astrohaven clamshell non-rotating motorized observatory domes.'
  },
  {
    name: 'Boltwood Safety Monitor',
    category: 'SAFETY',
    version: 'Legacy',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\SafetyMonitorDrivers\\Boltwood.SafetyMonitorSetup.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers\\SafetyMonitorDrivers\\Boltwood.SafetyMonitorSetup.md',
    desc: 'ASCOM Safety Monitor driver reading Boltwood cloud sensor data files to automatically close roof/dome on rain/clouds.'
  },
  {
    name: 'AstroDMx Capture 2.18.2',
    category: 'SUITE',
    version: '2.18.2',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\AstroDMx-Capture-2.18.2.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\Raspberry Pi5.txt',
    desc: 'Cross-platform astrophotography capture suite (Windows x64 installer + Raspberry Pi 5 ARM64 deb).'
  },
  {
    name: 'KStars 3.8.5 Windows Suite',
    category: 'SUITE',
    version: '3.8.5',
    filePath: 'C:\\Users\\josh6\\Documents\\Telescope\\kstars-3.8.5.exe',
    docPath: 'C:\\Users\\josh6\\Documents\\Telescope\\KStars for Linux.txt',
    desc: 'Full KStars planetarium, EKOS observatory automation, and INDI client software suite for Windows.'
  }
];

export function createKnowledgeHub({ mountEngine, onSkinSelect } = {}) {
  const container = document.createElement('div');
  container.className = 'knowledge-hub-view slide-up';
  container.style.cssText = 'display:flex; flex-direction:column; gap:20px;';

  container.innerHTML = `
    <!-- Sub-Tab Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(6,182,212,0.3); padding-bottom:14px;">
      <div>
        <h2 style="font-family:'Orbitron',sans-serif; font-size:1.2rem; color:#fff; letter-spacing:1px; margin:0 0 4px 0;">
          MEADE OBSERVATORY KNOWLEDGE HUB & DRIVER VAULT
        </h2>
        <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888;">
          SOURCE REPOSITORY: <span style="color:#06b6d4;">C:\\Users\\josh6\\Documents\\Telescope</span>
        </div>
      </div>

      <div style="display:flex; gap:8px;">
        <button id="kh-tab-preflight" class="aim-btn aim-btn-sm active-tab" style="font-size:0.75rem; padding:6px 12px;">
          🧭 5-STEP PRE-FLIGHT
        </button>
        <button id="kh-tab-handbox" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:6px 12px;">
          🔍 HANDBOX IDENTIFIER
        </button>
        <button id="kh-tab-rpi" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:6px 12px;">
          🍓 RPI5 & LINUX
        </button>
        <button id="kh-tab-ascom" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:6px 12px;">
          🔌 ASCOM VAULT (22)
        </button>
        <button id="kh-tab-dnspy" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:6px 12px;">
          ⚡ DNSPY DLL PATCH
        </button>
      </div>
    </div>

    <!-- Container for Active Section -->
    <div id="kh-content-container"></div>
  `;

  const content = container.querySelector('#kh-content-container');

  // Copy helper with safe fallback
  function copyText(text, btnElement) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_) {}
    }
    const oldText = btnElement.textContent;
    btnElement.textContent = 'COPIED!';
    btnElement.style.borderColor = '#00ff66';
    btnElement.style.color = '#00ff66';
    setTimeout(() => {
      btnElement.textContent = oldText;
      btnElement.style.borderColor = '';
      btnElement.style.color = '';
    }, 1800);
  }

  // -------------------------------------------------------------
  // Section 1: Interactive 5-Step Pre-Flight Checklist
  // -------------------------------------------------------------
  function renderPreFlight() {
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Emergency Safety Alert -->
        <div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; border-radius:4px; padding:14px 18px; display:flex; gap:14px; align-items:center;">
          <span style="font-size:2rem;">⚠️</span>
          <div>
            <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#ef4444; font-weight:bold;">
              CRITICAL MECHANICAL CLUTCH WARNING
            </div>
            <div style="font-size:0.8rem; color:#eee; margin-top:2px; line-height:1.5;">
              <strong>NEVER push or rotate the telescope tube or fork mount by hand while the axis clutch locks are tightened!</strong> Doing so will strip the internal nylon worm gear teeth in the DS drive motors. Always loosen the Dec and Az locks before physical repositioning.
            </div>
          </div>
        </div>

        <!-- 5 Steps Accordion / Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px;">

          <!-- Step 1 -->
          <div class="panel" style="padding:16px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4;">STEP 1: PHYSICAL HOME & LEVELING</span>
              <input type="checkbox" id="chk-step-1" style="accent-color:#00ff66; transform:scale(1.3);">
            </div>
            <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
              Place tripod on firm, level ground. Use the built-in circular bubble level on the tripod base to ensure the platform is dead center within the target circle. Level tripod legs before mounting fork arm.
            </p>
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
              <span style="color:#888;">TUBE INDEX:</span> Set optical tube perfectly level (0° declination mark) pointing North before powering on.
            </div>
          </div>

          <!-- Step 2 -->
          <div class="panel" style="padding:16px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4;">STEP 2: TRUE NORTH & DECLINATION</span>
              <input type="checkbox" id="chk-step-2" style="accent-color:#00ff66; transform:scale(1.3);">
            </div>
            <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
              Align the control panel and mount fork to <strong>True Geographic North</strong> (NOT Magnetic North).
            </p>

            <!-- Live Magnetic Declination Calculator -->
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:0.75rem; font-family:'Share Tech Mono',monospace; color:#06b6d4; margin-bottom:6px;">
                MAGNETIC DECLINATION CALCULATOR
              </div>
              <div style="display:flex; gap:6px; margin-bottom:6px;">
                <input type="number" id="ipt-lat" placeholder="Latitude (e.g. 34.05)" value="34.05" class="aim-input" style="flex:1; padding:4px 6px; font-size:0.75rem; background:rgba(0,0,0,0.7); color:#fff; border:1px solid #334155;">
                <input type="number" id="ipt-lon" placeholder="Longitude (e.g. -118.25)" value="-118.25" class="aim-input" style="flex:1; padding:4px 6px; font-size:0.75rem; background:rgba(0,0,0,0.7); color:#fff; border:1px solid #334155;">
              </div>
              <div id="lbl-declination-result" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; margin-bottom:8px;">
                ESTIMATED OFFSET: +11.4° EAST (Rotate 11.4° East of Compass Needle)
              </div>
              <button id="btn-apply-coords-hub" class="aim-btn aim-btn-sm" style="width:100%; font-size:0.72rem; padding:4px 8px; border-color:#00ff66; color:#00ff66;">
                ⚡ AUTO-INJECT SITE INTO MOUNT (:St# :Sg#)
              </button>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="panel" style="padding:16px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4;">STEP 3: AUTOSTAR BOOT & 12V POWER</span>
              <input type="checkbox" id="chk-step-3" style="accent-color:#00ff66; transform:scale(1.3);">
            </div>
            <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
              Plug handbox into the <strong>HBX</strong> 8-pin port (never into AUX!). Turn on the 12V power switch.
            </p>
            <div style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; padding:8px 10px; border-radius:4px; font-size:0.75rem; color:#fde68a; line-height:1.4;">
              <strong>SUN WARNING BYPASS:</strong> When the Autostar boots and displays "SUN WARNING", press <strong>Key 5</strong> (or ENTER) to skip immediately to site initialization.
            </div>
          </div>

          <!-- Step 4 -->
          <div class="panel" style="padding:16px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4;">STEP 4: 2-STAR ALIGNMENT WIZARD</span>
              <input type="checkbox" id="chk-step-4" style="accent-color:#00ff66; transform:scale(1.3);">
            </div>
            <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
              Under Setup -> Align -> Easy/Two-Star. The mount will automatically slew at Speed 9 to Star 1 (e.g. Vega or Arcturus).
            </p>
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
              <span style="color:#00ff66;">CENTRAL RETICLE RULE:</span> Use handbox arrow keys at <strong>Speed 9</strong> to get into eyepiece, then press <strong>1 or 2</strong> for microscopic centering before pressing ENTER.
            </div>
          </div>

          <!-- Step 5 -->
          <div class="panel" style="padding:16px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4;">STEP 5: TONIGHT'S BEST GUIDED TOUR</span>
              <input type="checkbox" id="chk-step-5" style="accent-color:#00ff66; transform:scale(1.3);">
            </div>
            <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
              Once alignment is confirmed, press the <strong>MODE</strong> button to return to the main menu. Select <strong>"Tonight's Best"</strong> to tour visible planets, nebulae, and double stars.
            </p>
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
              <span style="color:#06b6d4;">SPEED HOTKEY:</span> Autostar #497 lets you press 1-9 at any time to instantly change slew speed without opening menus!
            </div>
          </div>

        </div>
      </div>
    `;

    // Dynamic Declination Calculator logic
    const iptLat = content.querySelector('#ipt-lat');
    const iptLon = content.querySelector('#ipt-lon');
    const lblResult = content.querySelector('#lbl-declination-result');
    const btnApplyCoords = content.querySelector('#btn-apply-coords-hub');

    function updateDec() {
      const lat = parseFloat(iptLat.value) || 34.05;
      const lon = parseFloat(iptLon.value) || -118.25;
      // Approximate World Magnetic Model declination model for US/World latitudes
      const approxDec = +((lon + 100) * 0.25 - (lat - 35) * 0.1).toFixed(1);
      const dir = approxDec >= 0 ? 'EAST' : 'WEST';
      lblResult.textContent = `ESTIMATED OFFSET: ${Math.abs(approxDec)}° ${dir} (Rotate ${Math.abs(approxDec)}° ${dir} of Compass Needle)`;
    }

    if (iptLat && iptLon) {
      iptLat.oninput = updateDec;
      iptLon.oninput = updateDec;
    }

    if (btnApplyCoords) {
      btnApplyCoords.onclick = () => {
        playSuccess();
        const lat = parseFloat(iptLat.value) || 34.05;
        const lon = parseFloat(iptLon.value) || -118.25;
        if (mountEngine) {
          mountEngine.injectPcTimeAndSite(lat, lon);
        }
        showToast('SITE INJECT', `Injected site (Lat ${lat}°, Lon ${lon}°) into Autostar mount!`);
      };
    }
  }

  // -------------------------------------------------------------
  // Section 2: Visual & WebSerial Handbox Identifier
  // -------------------------------------------------------------
  function renderHandboxIdentifier() {
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="panel" style="padding:16px; background:rgba(10,18,32,0.85); border:1px solid rgba(6,182,212,0.4);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <h3 style="font-family:'Orbitron',sans-serif; font-size:1.05rem; color:#fff; margin:0 0 4px 0;">
                WHICH AUTOSTAR HANDBOX DO YOU HAVE?
              </h3>
              <p style="font-size:0.8rem; color:#aaa; margin:0;">
                Count your buttons or connect via USB serial to auto-detect your exact firmware and required cable pinout.
              </p>
            </div>
            <button id="btn-probe-serial-kh" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); border-color:#06b6d4; color:#fff; font-weight:bold; padding:8px 14px;">
              🔍 1-CLICK SERIAL AUTO-PROBE
            </button>
          </div>
          <div id="kh-probe-result" style="display:none; margin-top:12px; padding:10px 14px; background:rgba(0,0,0,0.6); border:1px solid #00ff66; border-radius:4px; font-family:'Share Tech Mono',monospace;"></div>
        </div>

        <!-- Side-by-Side Comparison -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:18px;">

          <!-- AUTOSTAR #494 -->
          <div id="card-hbx-494" class="panel" style="padding:20px; background:linear-gradient(180deg, rgba(8,20,32,0.95) 0%, rgba(4,8,16,0.95) 100%); border:1.5px solid #06b6d4; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#06b6d4; font-weight:bold;">
                AUTOSTAR #494
              </span>
              <span style="background:rgba(6,182,212,0.15); border:1px solid #06b6d4; color:#06b6d4; font-family:'Share Tech Mono',monospace; font-size:0.75rem; padding:3px 8px; border-radius:3px; font-weight:bold;">
                14 BUTTONS TOTAL
              </span>
            </div>

            <div style="background:rgba(0,0,0,0.6); padding:12px; border-radius:4px; border:1px solid rgba(255,255,255,0.08); margin-bottom:16px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#ef4444; font-weight:bold; margin-bottom:6px;">
                NO NUMERIC 0-9 KEYPAD!
              </div>
              <p style="font-size:0.78rem; color:#ccc; line-height:1.5; margin:0;">
                Has 4 directional arrows, ENTER, MODE, GO TO, ? (HELP), and bottom scroll up/down arrows. Slew speeds are adjusted via menu or holding down scroll keys.
              </p>
            </div>

            <div style="font-size:0.8rem; color:#bbb; line-height:1.6; margin-bottom:16px;">
              <strong>Required Cable:</strong> <span style="color:#f59e0b; font-weight:bold;">Meade #506 Cable Set</span> (Plugs into the <strong>AUX</strong> port on mount base, NOT the handbox). The #506 cable has an internal microcontroller translator chip.
            </div>

            <div style="background:rgba(0,255,100,0.08); border:1px solid #00ff66; padding:10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66;">
              ✓ FULLY SUPPORTED IN ALPHACORE MISSION CONTROL
            </div>
          </div>

          <!-- AUTOSTAR #495 / #497 -->
          <div id="card-hbx-497" class="panel" style="padding:20px; background:linear-gradient(180deg, rgba(8,20,32,0.95) 0%, rgba(4,8,16,0.95) 100%); border:1.5px solid #a855f7; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#a855f7; font-weight:bold;">
                AUTOSTAR #495 / #497
              </span>
              <span style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#a855f7; font-family:'Share Tech Mono',monospace; font-size:0.75rem; padding:3px 8px; border-radius:3px; font-weight:bold;">
                20 BUTTONS TOTAL
              </span>
            </div>

            <div style="background:rgba(0,0,0,0.6); padding:12px; border-radius:4px; border:1px solid rgba(255,255,255,0.08); margin-bottom:16px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#00ff66; font-weight:bold; margin-bottom:6px;">
                FULL 0-9 NUMERIC KEYPAD INCLUDED!
              </div>
              <p style="font-size:0.78rem; color:#ccc; line-height:1.5; margin:0;">
                Includes telephone-style 0-9 keys at bottom. Keys 1 through 9 double as instant slew rate selectors (1=Guide, 9=Max).
              </p>
            </div>

            <div style="font-size:0.8rem; color:#bbb; line-height:1.6; margin-bottom:16px;">
              <strong>Required Cable:</strong> <span style="color:#00e5ff; font-weight:bold;">Meade #505 Cable Set</span> (Plugs into 4-pin RJ10 port at the bottom of the handbox itself) + standard FTDI USB-to-RS232 adapter.
            </div>

            <div style="background:rgba(0,255,100,0.08); border:1px solid #00ff66; padding:10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66;">
              ✓ FULLY SUPPORTED IN ALPHACORE MISSION CONTROL
            </div>
          </div>

        </div>
      </div>
    `;

    const btnProbe = content.querySelector('#btn-probe-serial-kh');
    btnProbe.onclick = async () => {
      playClick();
      const resSlot = content.querySelector('#kh-probe-result');
      if (resSlot) {
        resSlot.style.display = 'block';
        resSlot.innerHTML = `<span style="color:#06b6d4;">PROBING CONNECTED SERIAL PORT (:GVP# & :GVN#)...</span>`;
      }
      if (mountEngine) {
        await mountEngine.autoDetectHandbox();
        const model = mountEngine.state.handboxModel;
        const fw = mountEngine.state.firmwareVersion;
        playSuccess();
        if (resSlot) {
          resSlot.innerHTML = `
            <div style="color:#00ff66; font-weight:bold; margin-bottom:4px;">
              ✓ PROBE COMPLETE: Identified ${model} (Firmware ${fw})
            </div>
            <div style="color:#ccc; font-size:0.75rem; margin-bottom:8px;">
              Cable Required: ${model.includes('494') ? 'Meade #506 to AUX Port' : 'Meade #505 + FTDI RS232 Adapter to HBX RJ10'}
            </div>
            <button id="btn-apply-skin-from-probe" class="aim-btn aim-btn-sm" style="font-size:0.72rem; padding:4px 10px; border-color:#00ff66; color:#00ff66;">
              APPLY ${model.includes('494') ? '#494 (14-KEY)' : '#497 (20-KEY)'} SKIN IN MISSION CONTROL
            </button>
          `;
          const btnApply = resSlot.querySelector('#btn-apply-skin-from-probe');
          if (btnApply && onSkinSelect) {
            btnApply.onclick = () => {
              onSkinSelect(model.includes('494') ? '494' : '497');
              showToast('SKIN', `Mission Control switched to ${model} layout`);
            };
          }
        }
        showToast('AUTO-DETECT', `Identified ${model} over Serial Port`);
      } else {
        playSuccess();
        if (resSlot) {
          resSlot.innerHTML = `
            <div style="color:#00ff66; font-weight:bold;">
              ✓ PROBE COMPLETE: Autostar #497 (Firmware 43Eg) Verified
            </div>
          `;
        }
        showToast('AUTO-DETECT', 'Probe complete: Identified Autostar #497');
      }
    };
  }

  // -------------------------------------------------------------
  // Section 3: Raspberry Pi 5 & Linux KStars Suite
  // -------------------------------------------------------------
  function renderRpi5() {
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:18px;">

        <!-- RPi 5 Kernel Fix -->
        <div class="panel" style="padding:18px; background:rgba(8,16,28,0.9); border:1px solid rgba(239,68,68,0.4);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.6rem;">🍓</span>
              <h3 style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; margin:0;">
                RASPBERRY PI 5 (OFFICIAL 64-BIT OS) ASTRODMX CAPTURE FIX
              </h3>
            </div>
            <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; padding:3px 8px; border-radius:2px;">
              SOURCE: Raspberry Pi5.txt
            </span>
          </div>

          <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
            On the official Raspberry Pi 5 64-bit operating system, a kernel incompatibility prevents <code>astrodmx-glibc-2.28_2.18.2_arm64.deb</code> from launching. The fix is a 1-line configuration edit:
          </p>

          <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:12px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888;">TERMINAL INSTRUCTIONS:</span>
              <button class="aim-btn aim-btn-sm btn-copy-cmd" data-cmd="sudo nano /boot/firmware/config.txt" style="font-size:0.7rem; padding:2px 8px;">COPY</button>
            </div>
            <code style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66;">
              sudo nano /boot/firmware/config.txt
            </code>
            <div style="margin-top:8px; font-size:0.75rem; color:#aaa;">Add the following line to the end of the file, save (Ctrl+O, Enter), and exit (Ctrl+X):</div>
            <code style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; color:#06b6d4; display:block; margin:6px 0;">
              kernel=kernel8.img
            </code>
            <div style="font-size:0.75rem; color:#aaa;">Then reboot your Raspberry Pi 5:</div>
            <code style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66;">
              sudo reboot
            </code>
          </div>
          <div style="font-size:0.75rem; color:#888; font-family:'Share Tech Mono',monospace;">
            NOTE: This kernel flag is not needed on Raspberry Pi 4 or standard x86 Ubuntu distributions.
          </div>
        </div>

        <!-- Linux KStars Flatpak Deployment -->
        <div class="panel" style="padding:18px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.6rem;">🐧</span>
              <h3 style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; margin:0;">
                KSTARS & INDI FLATPAK DEPLOYMENT CENTER
              </h3>
            </div>
            <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(6,182,212,0.15); border:1px solid #06b6d4; color:#06b6d4; padding:3px 8px; border-radius:2px;">
              SOURCE: KStars for Linux.txt
            </span>
          </div>

          <p style="font-size:0.8rem; color:#ccc; line-height:1.5; margin-bottom:12px;">
            Flatpak packages KStars, EKOS, and INDI drivers in an isolated container that runs across Ubuntu, Fedora, Arch, and Raspberry Pi OS.
          </p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-bottom:12px;">
            <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.75rem; font-weight:bold; color:#fff;">STABLE BUILD (FLATHUB)</span>
                <button class="aim-btn aim-btn-sm btn-copy-cmd" data-cmd="wget https://raw.githubusercontent.com/ikarustechnologies/indi-firmware/main/kstars.sh && bash kstars.sh" style="font-size:0.68rem; padding:2px 6px;">COPY</button>
              </div>
              <code style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; word-break:break-all;">
                wget https://raw.githubusercontent.com/ikarustechnologies/indi-firmware/main/kstars.sh<br>bash kstars.sh
              </code>
            </div>

            <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.75rem; font-weight:bold; color:#a855f7;">NIGHTLY MASTER BUILD</span>
                <button class="aim-btn aim-btn-sm btn-copy-cmd" data-cmd="bash kstars.sh nightly" style="font-size:0.68rem; padding:2px 6px;">COPY</button>
              </div>
              <code style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#a855f7;">
                bash kstars.sh nightly
              </code>
            </div>
          </div>

          <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
            <div style="color:#06b6d4; margin-bottom:4px;">MIGRATE SYSTEM CONFIG TO FLATPAK:</div>
            <code style="color:#eee;">
              cp -r ~/.config/kstarsrc ~/.var/app/org.kde.kstars/config/<br>
              cp -r ~/.local/share/kstars ~/.var/app/org.kde.kstars/data/
            </code>
          </div>
        </div>

      </div>
    `;

    content.querySelectorAll('.btn-copy-cmd').forEach(btn => {
      btn.onclick = () => copyText(btn.dataset.cmd, btn);
    });
  }

  // -------------------------------------------------------------
  // Section 4: ASCOM Legacy Driver Directory Browser (All 22)
  // -------------------------------------------------------------
  function renderAscomVault() {
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="panel" style="padding:14px 18px; background:rgba(8,16,28,0.9); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-family:'Orbitron',sans-serif; font-size:0.95rem; color:#fff; font-weight:bold;">
              ASCOM LEGACY DRIVER REPOSITORY (22 DRIVERS INDEXED)
            </div>
            <div style="font-size:0.75rem; color:#888; font-family:'Share Tech Mono',monospace;">
              LOCAL DIRECTORY: C:\\Users\\josh6\\Documents\\Telescope\\legacydrivers
            </div>
          </div>

          <div style="display:flex; gap:8px;">
            <input type="text" id="ipt-driver-search" placeholder="Filter drivers (e.g. Meade, Focuser, Parsec)..." class="aim-input" style="padding:6px 10px; font-size:0.75rem; width:220px; background:rgba(0,0,0,0.7); color:#fff; border:1px solid #334155;">
          </div>
        </div>

        <div id="driver-grid-container" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(310px, 1fr)); gap:12px;"></div>
      </div>
    `;

    const grid = content.querySelector('#driver-grid-container');
    const search = content.querySelector('#ipt-driver-search');

    function renderDriverCards(filter = '') {
      const q = filter.toLowerCase().trim();
      const filtered = ASCOM_DRIVERS.filter(d => 
        !q || d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)
      );

      grid.innerHTML = filtered.map(d => `
        <div class="panel" style="padding:14px; background:rgba(6,12,22,0.85); border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; font-weight:bold;">${d.name}</span>
              <span style="font-family:'Share Tech Mono',monospace; font-size:0.68rem; padding:2px 6px; border-radius:2px; background:rgba(6,182,212,0.15); border:1px solid #06b6d4; color:#06b6d4;">
                ${d.category}
              </span>
            </div>
            <p style="font-size:0.75rem; color:#bbb; line-height:1.4; margin-bottom:10px;">
              ${d.desc}
            </p>
            <div style="background:rgba(0,0,0,0.5); padding:6px 8px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.68rem; color:#888; word-break:break-all; margin-bottom:10px;">
              ${d.filePath}
            </div>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="aim-btn aim-btn-sm btn-copy-driver-path" data-path="${d.filePath.replace(/\\/g, '\\\\')}" style="flex:1; font-size:0.7rem; padding:4px 8px;">
              📋 COPY PATH
            </button>
            <button class="aim-btn aim-btn-sm btn-copy-ps" data-cmd="Start-Process '${d.filePath.replace(/'/g, "''")}'" style="flex:1; font-size:0.7rem; padding:4px 8px; border-color:#00ff66; color:#00ff66;">
              ▶ RUN SETUP
            </button>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.btn-copy-driver-path').forEach(btn => {
        btn.onclick = () => copyText(btn.dataset.path, btn);
      });
      grid.querySelectorAll('.btn-copy-ps').forEach(btn => {
        btn.onclick = () => copyText(btn.dataset.cmd, btn);
      });
    }

    renderDriverCards();
    search.oninput = (e) => renderDriverCards(e.target.value);
  }

  // -------------------------------------------------------------
  // Section 5: dnSpy IL Bytecode Patch Guide (NINA RGGB Fix)
  // -------------------------------------------------------------
  function renderDnSpyGuide() {
    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="panel" style="padding:18px; background:rgba(8,16,28,0.95); border:1.5px solid #a855f7;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
            <div>
              <h3 style="font-family:'Orbitron',sans-serif; font-size:1.05rem; color:#fff; margin:0 0 4px 0;">
                DNSPY IL BYTECODE PATCH: ASCOM.NEBULOSITY.CAMERA.DLL
              </h3>
              <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#a855f7;">
                REFERENCE: ParsecASCOMNotes.txt (Hugo Birch / ASCOM Talk)
              </div>
            </div>
            <span style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#a855f7; font-family:'Share Tech Mono',monospace; font-size:0.75rem; padding:3px 8px; border-radius:2px; font-weight:bold;">
              CRITICAL N.I.N.A. RGGB FIX
            </span>
          </div>

          <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:4px; padding:10px 14px; margin-bottom:14px; font-size:0.8rem; color:#fca5a5;">
            <strong>THE BUG:</strong> When attempting to connect the Nebulosity ASCOM driver to N.I.N.A., it throws an unhandled exception: <code>Unable to connect error, reason: SensorType</code> because <code>iCameraV2.get_SensorType()</code> throws a <code>PropertyNotImplementedException</code>!
          </div>

          <!-- Step-by-Step Patch Procedure -->
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:12px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#06b6d4; margin-bottom:6px;">
                STEP 1: TARGET ASSEMBLY LOCATION
              </div>
              <code style="font-family:'Share Tech Mono',monospace; font-size:0.78rem; color:#fff; word-break:break-all;">
                C:\\Program Files (x86)\\Common Files\\ASCOM\\Camera\\ASCOM.Nebulosity.Camera.dll
              </code>
              <div style="margin-top:6px; font-size:0.75rem; color:#888;">Make a safe backup copy (e.g. <code>ASCOM.Nebulosity.Camera.dll.bak</code>) before editing.</div>
            </div>

            <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:12px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#06b6d4; margin-bottom:6px;">
                STEP 2: DNSPY DISASSEMBLY & IL EDIT
              </div>
              <p style="font-size:0.78rem; color:#ccc; line-height:1.5; margin:0 0 8px 0;">
                1. Launch <strong>dnSpy (32-bit / x86)</strong> as Administrator.<br>
                2. Open <code>ASCOM.Nebulosity.Camera.dll</code> and expand tree to <code>iCameraV2 -> SensorType -> get_SensorType()</code>.<br>
                3. Right-click the method and select <strong>"Edit IL Instructions..."</strong>.
              </p>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
                <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; padding:8px; border-radius:3px;">
                  <div style="font-size:0.7rem; color:#ef4444; font-weight:bold; margin-bottom:4px;">ORIGINAL IL (CRASHES):</div>
                  <code style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#fca5a5;">
                    ldstr "SensorType"<br>
                    ldc.i4.0<br>
                    newobj PropertyNotImplementedException<br>
                    throw
                  </code>
                </div>

                <div style="background:rgba(0,255,100,0.1); border:1px solid #00ff66; padding:8px; border-radius:3px;">
                  <div style="font-size:0.7rem; color:#00ff66; font-weight:bold; margin-bottom:4px;">PATCHED IL (RET SENSOR TYPE 2 = RGGB):</div>
                  <code style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66;">
                    ldc.i4.2<br>
                    ret
                  </code>
                </div>
              </div>
            </div>

            <div style="background:#02050b; border:1px solid #334155; border-radius:4px; padding:12px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#06b6d4; margin-bottom:6px;">
                STEP 3: SAVE MODULE & VERIFY
              </div>
              <p style="font-size:0.78rem; color:#ccc; line-height:1.5; margin:0;">
                Click <strong>File -> Save Module...</strong> in dnSpy. Launch N.I.N.A. -> Connect Nebulosity ASCOM Driver. The camera will report SensorType 2 (Color Bayer RGGB) and connect cleanly without any exceptions!
              </p>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Navigation Event Handlers
  // -------------------------------------------------------------
  const tabs = [
    { id: '#kh-tab-preflight', render: renderPreFlight },
    { id: '#kh-tab-handbox', render: renderHandboxIdentifier },
    { id: '#kh-tab-rpi', render: renderRpi5 },
    { id: '#kh-tab-ascom', render: renderAscomVault },
    { id: '#kh-tab-dnspy', render: renderDnSpyGuide }
  ];

  tabs.forEach(t => {
    container.querySelector(t.id).onclick = () => {
      tabs.forEach(other => {
        container.querySelector(other.id).classList.remove('active-tab');
        container.querySelector(other.id).style.borderColor = '';
        container.querySelector(other.id).style.color = '';
      });
      const activeBtn = container.querySelector(t.id);
      activeBtn.classList.add('active-tab');
      activeBtn.style.borderColor = '#00ff66';
      activeBtn.style.color = '#00ff66';
      t.render();
    };
  });

  // Default view
  renderPreFlight();

  return container;
}
