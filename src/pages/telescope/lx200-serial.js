/**
 * AlphaCore Meade DS Observatory — LX200 Serial Protocol & Mount Physics Engine
 * Implements WebSerial (navigator.serial 9600 baud 8N1) for Meade Autostar (#494, #495, #497, LX200)
 * Includes high-fidelity Mount Physics & Sidereal Drift Simulator when operating unplugged.
 */

import { calculateLST, raDecToAltAz } from './sky-catalog.js';

export class LX200SerialEngine {
  constructor(options = {}) {
    this.options = options;
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.readLoopActive = false;
    this.rxBuffer = '';

    // Mount State
    this.state = {
      isConnected: false,
      isSimulated: true,
      portName: 'DISCONNECTED',
      baudRate: 9600,
      handboxModel: 'Autostar #497', // '#494', '#495', '#497', 'LX200 Classic'
      firmwareVersion: '43Eg',
      slewRate: 5, // 1 to 9 (1=Guide, 5=Find, 9=Max)
      isSlewing: false,
      slewDirection: null, // 'N', 'S', 'E', 'W', null
      isTracking: true,
      isGoToActive: false,
      
      // Coordinates in Degrees & Hours
      // Default initial park position: Polaris region (Alt ~40°, Az ~0° / North)
      raHours: 2.53, // 02h 31m 49s (Polaris)
      decDeg: 89.26, // +89° 15'
      altDeg: 40.0,
      azDeg: 0.0,

      // Target Coordinates
      targetRaHours: 2.53,
      targetDecDeg: 89.26,

      // Alignment status
      alignmentState: 'UNALIGNED', // 'UNALIGNED', '1_STAR', 'ALIGNED'
      alignedStars: [],
      
      // Site & Time
      latitudeDeg: 34.05, // e.g. Los Angeles default, customizable
      longitudeDeg: -118.25,
      utcOffsetHours: -8,
      localSiderealTimeHours: 2.53
    };

    // Listeners
    this.listeners = {
      telemetry: [],
      status: [],
      log: [],
      handboxDetected: []
    };

    // Internal simulation loop
    this.simInterval = null;
    this._startSimLoop();
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (err) { console.error(`[LX200] Listener error for ${event}:`, err); }
      });
    }
  }

  _log(message, type = 'info') {
    this._emit('log', { message, type, timestamp: new Date().toLocaleTimeString() });
  }

  // -------------------------------------------------------------
  // WebSerial Connection Management
  // -------------------------------------------------------------
  async connectSerial() {
    if (typeof navigator === 'undefined' || !navigator.serial) {
      this._log('WebSerial API not supported in this browser. Switching to Mount Physics Simulator.', 'warn');
      this.state.isSimulated = true;
      this.state.isConnected = true;
      this.state.portName = 'SIMULATOR-COM';
      this._emit('status', { isConnected: true, isSimulated: true });
      return false;
    }

    try {
      this.port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0403 }, // FTDI (common for #505 & #506 USB adapters)
          { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
          { usbVendorId: 0x1a86 }, // CH340 / CH341
          { usbVendorId: 0x067b }  // Prolific PL2303
        ]
      });

      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.state.isConnected = true;
      this.state.isSimulated = false;
      this.state.portName = 'SERIAL-COM';
      this._log('WebSerial link established at 9600 baud 8N1.', 'success');
      this._emit('status', { isConnected: true, isSimulated: false });

      this._startReadLoop();
      // Auto-query handbox version
      setTimeout(() => this.autoDetectHandbox(), 400);
      return true;
    } catch (err) {
      this._log(`Serial connection cancelled or failed: ${err.message}. Operating in Mount Physics Simulator mode.`, 'warn');
      this.state.isSimulated = true;
      this.state.isConnected = true;
      this.state.portName = 'SIMULATOR-COM';
      this._emit('status', { isConnected: true, isSimulated: true });
      return false;
    }
  }

  async disconnectSerial() {
    this.readLoopActive = false;
    if (this.reader) {
      try { await this.reader.cancel(); } catch (_) {}
      this.reader = null;
    }
    if (this.writer) {
      try { await this.writer.close(); } catch (_) {}
      this.writer = null;
    }
    if (this.port) {
      try { await this.port.close(); } catch (_) {}
      this.port = null;
    }
    this.state.isConnected = false;
    this.state.portName = 'DISCONNECTED';
    this._log('Serial port disconnected.', 'info');
    this._emit('status', { isConnected: false, isSimulated: this.state.isSimulated });
  }

  async _startReadLoop() {
    this.readLoopActive = true;
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable).catch(() => {});
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.readLoopActive) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.rxBuffer += value;
          this._processRxBuffer();
        }
      }
    } catch (err) {
      if (this.readLoopActive) {
        this._log(`Serial read stream error: ${err.message}`, 'error');
      }
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  _processRxBuffer() {
    // Meade LX200 responses are often '#' delimited, or single-character ('0', '1', '2')
    while (this.rxBuffer.length > 0) {
      const hashIndex = this.rxBuffer.indexOf('#');
      if (hashIndex !== -1) {
        const response = this.rxBuffer.slice(0, hashIndex).trim();
        this.rxBuffer = this.rxBuffer.slice(hashIndex + 1);
        this._handleSerialResponse(response);
      } else if (this.rxBuffer.length === 1 && (this.rxBuffer === '0' || this.rxBuffer === '1' || this.rxBuffer === '2')) {
        const response = this.rxBuffer;
        this.rxBuffer = '';
        this._handleSerialResponse(response);
      } else {
        break;
      }
    }
  }

  _handleSerialResponse(response) {
    this._log(`RX < ${response}#`, 'rx');
    // Parse Product Name
    if (response.includes('Autostar') || response.includes('494') || response.includes('497') || response.includes('LX')) {
      if (response.includes('494')) {
        this.state.handboxModel = 'Autostar #494';
      } else if (response.includes('495')) {
        this.state.handboxModel = 'Autostar #495';
      } else if (response.includes('497')) {
        this.state.handboxModel = 'Autostar #497';
      } else {
        this.state.handboxModel = 'Meade LX200';
      }
      this._emit('handboxDetected', this.state.handboxModel);
    }
    // Parse RA format HH:MM:SS
    if (/^\d{2}:\d{2}:\d{2}$/.test(response)) {
      const parts = response.split(':').map(Number);
      this.state.raHours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    }
    // Parse Dec format +sDD*MM:SS or sDD*MM
    if (/^[+-]\d{2}[*:]\d{2}/.test(response)) {
      const sign = response[0] === '-' ? -1 : 1;
      const clean = response.slice(1).replace('*', ':');
      const parts = clean.split(':').map(Number);
      this.state.decDeg = sign * (parts[0] + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600);
    }
  }

  async sendCommand(cmd) {
    if (!cmd) return;
    let raw = String(cmd).trim();
    if (raw.startsWith('#:')) {
      raw = raw.slice(1);
    } else if (raw.startsWith('#')) {
      raw = raw.replace(/^#+/, '');
    }
    const formatted = raw.startsWith(':') ? raw : `:${raw}`;
    const fullCmd = formatted.endsWith('#') ? formatted : `${formatted}#`;

    this._log(`TX > ${fullCmd}`, 'tx');

    if (!this.state.isSimulated && this.port && this.port.writable) {
      try {
        const encoder = new TextEncoder();
        const writer = this.port.writable.getWriter();
        await writer.write(encoder.encode(fullCmd));
        writer.releaseLock();
      } catch (err) {
        this._log(`Write failed: ${err.message}`, 'error');
      }
    } else {
      // Execute in internal simulator
      this._simulateCommandResponse(fullCmd);
    }
  }

  // -------------------------------------------------------------
  // High-Level Meade LX200 Operations
  // -------------------------------------------------------------
  slew(direction) {
    const dir = direction.toUpperCase();
    if (!['N', 'S', 'E', 'W'].includes(dir)) return;
    this.state.isSlewing = true;
    this.state.slewDirection = dir;
    this.sendCommand(`:M${dir.toLowerCase()}#`);
  }

  halt() {
    this.state.isSlewing = false;
    this.state.slewDirection = null;
    this.state.isGoToActive = false;
    this.sendCommand(':Q#');
  }

  setSlewRate(rateNum) {
    const r = Math.max(1, Math.min(9, parseInt(rateNum, 10) || 5));
    this.state.slewRate = r;
    // Map rate to standard LX200 rate or Autostar rate command
    if (r <= 2) {
      this.sendCommand(':RG#'); // Guide
    } else if (r <= 4) {
      this.sendCommand(':RC#'); // Center
    } else if (r <= 7) {
      this.sendCommand(':RM#'); // Find
    } else {
      this.sendCommand(':RS#'); // Slew / Max
    }
    this.sendCommand(`:Sw${r}#`);
  }

  setTargetCoordinates(raHours, decDeg) {
    this.state.targetRaHours = raHours;
    this.state.targetDecDeg = decDeg;

    // Format RA HH:MM:SS
    const h = Math.floor(raHours);
    const m = Math.floor((raHours - h) * 60);
    const s = Math.floor(((raHours - h) * 60 - m) * 60);
    const raStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Format Dec sDD*MM:SS
    const sign = decDeg >= 0 ? '+' : '-';
    const absDec = Math.abs(decDeg);
    const d = Math.floor(absDec);
    const dm = Math.floor((absDec - d) * 60);
    const ds = Math.floor(((absDec - d) * 60 - dm) * 60);
    const decStr = `${sign}${String(d).padStart(2, '0')}*${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`;

    this.sendCommand(`:Sr${raStr}#`);
    this.sendCommand(`:Sd${decStr}#`);
  }

  gotoTarget(raHours = null, decDeg = null) {
    if (raHours !== null && decDeg !== null) {
      this.setTargetCoordinates(raHours, decDeg);
    }
    this.state.isGoToActive = true;
    this.sendCommand(':MS#');
    this._log(`GoTo slew initiated toward target (RA ${this.state.targetRaHours.toFixed(2)}h, Dec ${this.state.targetDecDeg.toFixed(2)}°).`, 'info');
  }

  syncAlignment() {
    // Meade :CM# command synchronizes internal mount model with current target object
    this.sendCommand(':CM#');
    this.state.raHours = this.state.targetRaHours;
    this.state.decDeg = this.state.targetDecDeg;
    this.state.alignmentState = 'ALIGNED';
    this._log('Mount 2-Star Alignment Synchronized (:CM#). Coordinate model locked.', 'success');
  }

  async autoDetectHandbox() {
    this._log('Probing connected Autostar Handbox over WebSerial (:GVP# & :GVN#)...', 'info');
    await this.sendCommand(':GVP#');
    await this.sendCommand(':GVN#');
  }

  injectPcTimeAndSite(lat = null, lon = null) {
    const now = new Date();
    const curLat = lat !== null ? lat : this.state.latitudeDeg;
    const curLon = lon !== null ? lon : this.state.longitudeDeg;

    this.state.latitudeDeg = curLat;
    this.state.longitudeDeg = curLon;

    // Time HH:MM:SS
    const tStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    // Date MM/DD/YY
    const dStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
    // Lat sDD*MM
    const latSign = curLat >= 0 ? '+' : '-';
    const latD = Math.floor(Math.abs(curLat));
    const latM = Math.floor((Math.abs(curLat) - latD) * 60);
    const latStr = `${latSign}${String(latD).padStart(2, '0')}*${String(latM).padStart(2, '0')}`;
    // Lon sDDD*MM (Meade expects positive West longitude or standard signs)
    const lonSign = curLon >= 0 ? '+' : '-';
    const lonD = Math.floor(Math.abs(curLon));
    const lonM = Math.floor((Math.abs(curLon) - lonD) * 60);
    const lonStr = `${lonSign}${String(lonD).padStart(3, '0')}*${String(lonM).padStart(2, '0')}`;

    this.sendCommand(`:SL${tStr}#`);
    this.sendCommand(`:SC${dStr}#`);
    this.sendCommand(`:St${latStr}#`);
    this.sendCommand(`:Sg${lonStr}#`);

    this._log(`Injected PC Time (${tStr} ${dStr}) and Site Coordinates (${latStr}, ${lonStr}) into Autostar.`, 'success');
  }

  // -------------------------------------------------------------
  // Internal Simulator Physics Engine
  // -------------------------------------------------------------
  _startSimLoop() {
    if (this.simInterval) clearInterval(this.simInterval);
    const dt = 0.1; // 100ms tick

    this.simInterval = setInterval(() => {
      // 1. Local Sidereal Time Calculation
      const lst = calculateLST(new Date(), this.state.longitudeDeg);
      this.state.localSiderealTimeHours = lst;

      // 2. Manual Slewing Rates in Degrees per second:
      // Rate 1 = 1x sidereal (0.004°/s) -> Rate 9 = Max (4.0°/s)
      const rateDegPerSec = [0.004, 0.016, 0.064, 0.25, 0.5, 1.0, 2.0, 3.0, 4.0][this.state.slewRate - 1] || 1.0;
      const stepDeg = rateDegPerSec * dt;
      const stepRaHours = (rateDegPerSec / 15.0) * dt;

      if (this.state.isSlewing && this.state.slewDirection) {
        switch (this.state.slewDirection) {
          case 'N':
            this.state.decDeg = Math.min(90.0, this.state.decDeg + stepDeg);
            break;
          case 'S':
            this.state.decDeg = Math.max(-90.0, this.state.decDeg - stepDeg);
            break;
          case 'E':
            this.state.raHours = (this.state.raHours + stepRaHours + 24.0) % 24.0;
            break;
          case 'W':
            this.state.raHours = (this.state.raHours - stepRaHours + 24.0) % 24.0;
            break;
        }
      }

      // 3. GoTo Slew Physics (Interpolation with smooth deceleration)
      if (this.state.isGoToActive) {
        const gotoSpeedDeg = 3.5 * dt;
        const gotoSpeedRa = (3.5 / 15.0) * dt;

        let deltaDec = this.state.targetDecDeg - this.state.decDeg;
        let deltaRa = this.state.targetRaHours - this.state.raHours;
        // Wrap RA shortest path
        if (deltaRa > 12.0) deltaRa -= 24.0;
        if (deltaRa < -12.0) deltaRa += 24.0;

        const dist = Math.hypot(deltaRa * 15.0, deltaDec);

        if (dist < 0.1) {
          // Arrived at target
          this.state.decDeg = this.state.targetDecDeg;
          this.state.raHours = this.state.targetRaHours;
          this.state.isGoToActive = false;
          this._log('GoTo slew complete. Tracking locked on target.', 'success');
        } else {
          const moveDec = Math.sign(deltaDec) * Math.min(Math.abs(deltaDec), gotoSpeedDeg);
          const moveRa = Math.sign(deltaRa) * Math.min(Math.abs(deltaRa), gotoSpeedRa);
          this.state.decDeg += moveDec;
          this.state.raHours = (this.state.raHours + moveRa + 24.0) % 24.0;
        }
      }

      // 4. Update Alt/Az coordinates from RA/Dec and Sidereal Time
      const skyPos = raDecToAltAz(this.state.raHours, this.state.decDeg, this.state.latitudeDeg, lst);
      this.state.altDeg = skyPos.altDeg;
      this.state.azDeg = skyPos.azDeg;

      // Emit telemetry state to subscribers
      this._emit('telemetry', this.getTelemetry());
    }, 100);
  }

  _simulateCommandResponse(cmd) {
    if (cmd.includes(':GVP#')) {
      this._handleSerialResponse(this.state.handboxModel + '#');
    } else if (cmd.includes(':GVN#')) {
      this._handleSerialResponse(this.state.firmwareVersion + '#');
    } else if (cmd.includes(':GR#')) {
      const h = Math.floor(this.state.raHours);
      const m = Math.floor((this.state.raHours - h) * 60);
      const s = Math.floor(((this.state.raHours - h) * 60 - m) * 60);
      this._handleSerialResponse(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}#`);
    } else if (cmd.includes(':GD#')) {
      const sign = this.state.decDeg >= 0 ? '+' : '-';
      const absDec = Math.abs(this.state.decDeg);
      const d = Math.floor(absDec);
      const dm = Math.floor((absDec - d) * 60);
      const ds = Math.floor(((absDec - d) * 60 - dm) * 60);
      this._handleSerialResponse(`${sign}${String(d).padStart(2, '0')}*${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}#`);
    } else if (cmd.includes(':MS#')) {
      this._handleSerialResponse('0'); // 0 = Slew possible, started
    } else if (cmd.includes(':Sr') || cmd.includes(':Sd') || cmd.includes(':SL') || cmd.includes(':SC') || cmd.includes(':St') || cmd.includes(':Sg')) {
      this._handleSerialResponse('1'); // 1 = Valid input accepted
    } else if (cmd.includes(':CM#')) {
      this._handleSerialResponse('Coordinates matched#');
    }
  }

  getTelemetry() {
    return {
      isConnected: this.state.isConnected,
      isSimulated: this.state.isSimulated,
      portName: this.state.portName,
      handboxModel: this.state.handboxModel,
      firmwareVersion: this.state.firmwareVersion,
      slewRate: this.state.slewRate,
      isSlewing: this.state.isSlewing,
      slewDirection: this.state.slewDirection,
      isTracking: this.state.isTracking,
      isGoToActive: this.state.isGoToActive,
      raHours: this.state.raHours,
      decDeg: this.state.decDeg,
      altDeg: this.state.altDeg,
      azDeg: this.state.azDeg,
      targetRaHours: this.state.targetRaHours,
      targetDecDeg: this.state.targetDecDeg,
      alignmentState: this.state.alignmentState,
      latitudeDeg: this.state.latitudeDeg,
      longitudeDeg: this.state.longitudeDeg
    };
  }

  destroy() {
    if (this.simInterval) clearInterval(this.simInterval);
    this.disconnectSerial();
    this.listeners = { telemetry: [], status: [], log: [], handboxDetected: [] };
  }
}
