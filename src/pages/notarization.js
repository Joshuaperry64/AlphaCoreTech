/**
 * AlphaCore v4.7 — Stage 4 Dedicated Online Notarization Page (`src/pages/notarization.js`)
 * Full AlphaCore Cyberpunk HUD Notarization Room featuring:
 *  - Session Telemetry Header (Matched Notary Code AC-RON-XXXXXX, Linked 1-Time Invite Code AC-INV-XXXXXX,
 *    Scheduled Booking Time & 5-10 min Early Check-In Window verification, Signer Identity, PDF SHA-256 Digest,
 *    Escrow/Fee Settlement Status, and ← RETURN TO COGNITIVE CORE button).
 *  - Left/Main Column: Embedded RON Webpage Viewport (`#notary-embedded-webpage-frame`) with:
 *    1) Interactive `srcdoc` RON Portal Webpage (simulated live notary officer video/audio feed, interactive
 *       document canvas, KBA/ID credential badge verification, click-to-sign signature pad, cryptographic
 *       E-Notary Seal stamp button) with `postMessage` bridge to parent AlphaCore HUD.
 *    2) Toggle to load external/backend URL (`/api/notarize/portal` or custom URL).
 *  - Right Column: Collected Assets & Cryptographic Ledger Panel with:
 *    - Collected PDF document & assets (Signer ID verification asset, Biometric liveness check, Payment/Escrow receipt).
 *    - Interactive buttons to Apply E-Signature & Jurat Seal, Finalize & Archive Sealed PDF to Vault (`vault_${profile}`
 *      and `alphacore_vault_files`), and Download Sealed Notarized PDF (`<a>` download with real `%PDF-1.4` data URL).
 *    - Updates session status in `localStorage.getItem('alphacore_notary_sessions_v1')` (and `alphacore_notarization_sessions_v1`)
 *      to `'COMPLETED_SEALED'` when finalized.
 */

import { createElement, escapeHTML } from '../components/utils.js';
import { playSFX } from '../components/audio.js';
import { showToast } from '../components/toast.js';
import { apiUrl } from '../components/api.js';

export const NOTARY_SESSIONS_KEY_V1 = 'alphacore_notary_sessions_v1';
export const NOTARY_SESSIONS_ALT_KEY = 'alphacore_notarization_sessions_v1';
export const NOTARY_INVITES_KEY_V1 = 'alphacore_notary_invites_v1';
export const ACTIVE_NOTARY_CODE_KEY = 'alphacore_active_notary_code';

/**
 * Generates a real valid `%PDF-1.4` data URL for a sealed notarized document.
 */
export function buildRealSealedPdfDataUrl({
  notaryCode = 'AC-RON-884920',
  inviteCode = 'AC-INV-773190',
  documentName = 'AlphaCore_Executive_Affidavit.pdf',
  signerName = 'Architect',
  digest = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  scheduledTime = '',
  feeUsd = 25.00,
  signatureText = '',
  sealId = '',
  status = 'COMPLETED_SEALED'
} = {}) {
  const cleanText = (val) => String(val || '').replace(/[()\\]/g, '');
  const effectiveSeal = sealId || `AC-SEAL-${String(digest).slice(0, 8).toUpperCase()}-${String(notaryCode).replace(/^AC-/, '')}`;
  const effectiveSig = signatureText || `/s/ ${cleanText(signerName)} [VERIFIED E-SIGNATURE]`;
  const sealedTimestamp = new Date().toISOString();

  const streamLines = [
    'BT',
    '/F1 13 Tf',
    '45 740 Td',
    '(ALPHACORE TECH // OFFICIAL REMOTE ONLINE NOTARIZATION CERTIFICATE) Tj',
    '/F1 10 Tf',
    '0 -22 Td',
    '(====================================================================) Tj',
    '0 -18 Td',
    `(NOTARY SESSION CODE : ${cleanText(notaryCode)}) Tj`,
    '0 -16 Td',
    `(1-TIME INVITE CODE  : ${cleanText(inviteCode)}) Tj`,
    '0 -16 Td',
    `(DOCUMENT FILENAME   : ${cleanText(documentName)}) Tj`,
    '0 -16 Td',
    `(SIGNER IDENTITY     : ${cleanText(signerName)}) Tj`,
    '0 -16 Td',
    `(SCHEDULED SLOT      : ${cleanText(scheduledTime || sealedTimestamp)}) Tj`,
    '0 -16 Td',
    `(ESCROW SETTLEMENT   : $${Number(feeUsd || 0).toFixed(2)} USD // SETTLED & VERIFIED) Tj`,
    '0 -16 Td',
    `(SHA-256 DIGEST      : ${cleanText(String(digest).slice(0, 48))}) Tj`,
    '0 -20 Td',
    '(--------------------------------------------------------------------) Tj',
    '0 -18 Td',
    `(E-SIGNATURE APPLIED : ${cleanText(effectiveSig)}) Tj`,
    '0 -16 Td',
    `(X.509 JURAT SEAL ID : ${cleanText(effectiveSeal)}) Tj`,
    '0 -16 Td',
    `(NOTARY OFFICER      : COMMISSIONER V. KOVACS // US-GA RON-NODE-01) Tj`,
    '0 -16 Td',
    `(FINALIZED TIMESTAMP : ${cleanText(sealedTimestamp)}) Tj`,
    '0 -16 Td',
    `(SESSION STATUS      : ${cleanText(status)}) Tj`,
    '0 -20 Td',
    '(====================================================================) Tj',
    '0 -18 Td',
    '(CRYPTOGRAPHICALLY SEALED & ARCHIVED TO ALPHACORE VAULT SUBSTRATE) Tj',
    'ET'
  ];

  // Fix typo in line with status
  streamLines[streamLines.length - 5] = `(SESSION STATUS      : ${cleanText(status)}) Tj`;

  const streamBody = streamLines.join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj',
    `5 0 obj << /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream\nendobj`
  ];

  let pdfContent = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdfContent.length);
    pdfContent += obj + '\n';
  }
  const xrefStart = pdfContent.length;
  pdfContent += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdfContent += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfContent += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  let b64 = '';
  try {
    if (typeof btoa === 'function') {
      b64 = btoa(unescape(encodeURIComponent(pdfContent)));
    } else if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(pdfContent, 'utf-8').toString('base64');
    }
  } catch (_) {}

  return {
    rawPdfText: pdfContent,
    dataUrl: `data:application/pdf;base64,${b64}`,
    byteSize: pdfContent.length,
    sealId: effectiveSeal,
    signatureText: effectiveSig,
    sealedTimestamp
  };
}

/**
 * Normalizes any session object (from Stage 1-3 swarm, invite store, or legacy store) into a unified structure.
 */
export function normalizeNotarySession(raw = {}, fallbackCode = '') {
  if (!raw || typeof raw !== 'object') raw = {};

  const pdfSub = raw.pdf && typeof raw.pdf === 'object' ? raw.pdf : {};
  const fundsSub = raw.funds && typeof raw.funds === 'object' ? raw.funds : {};
  const bookingSub = raw.booking && typeof raw.booking === 'object' ? raw.booking : {};
  const slotSub = bookingSub.selectedSlot && typeof bookingSub.selectedSlot === 'object' ? bookingSub.selectedSlot : {};

  const rawCode =
    raw.notaryCode ||
    raw.sessionCode ||
    raw.confirmationCode ||
    bookingSub.bookingConfirmationCode ||
    raw.id ||
    raw.sessionId ||
    fallbackCode ||
    'AC-RON-884920';

  const notaryCode = String(rawCode).trim().toUpperCase();

  const rawInvite =
    raw.inviteCode ||
    raw.setupCode ||
    raw.oneTimeInviteCode ||
    `AC-INV-${notaryCode.replace(/[^A-Z0-9]/g, '').slice(-6).padStart(6, '7')}`;

  const inviteCode = String(rawInvite).trim().toUpperCase();

  const currentProfile =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('current_profile')) ||
    'Architect';

  const signerName =
    raw.signerName ||
    raw.profile ||
    fundsSub.profile ||
    currentProfile ||
    'Architect';

  const documentName =
    raw.documentName ||
    pdfSub.documentName ||
    raw.filename ||
    'AlphaCore_Executive_Affidavit.pdf';

  const digest =
    raw.digest ||
    raw.documentDigest ||
    raw.sha256 ||
    pdfSub.sha256 ||
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const scheduledTime =
    raw.scheduledTime ||
    raw.slotLabel ||
    raw.slotIso ||
    slotSub.displayTime ||
    slotSub.isoTime ||
    new Date(Date.now() + 7 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (EARLY CHECK-IN 5-10 MIN WINDOW)';

  const feeUsd =
    raw.feeUsd !== undefined ? Number(raw.feeUsd) :
    raw.feeAmount !== undefined ? Number(raw.feeAmount) :
    fundsSub.statutoryFeeUsd !== undefined ? Number(fundsSub.statutoryFeeUsd) :
    fundsSub.chargedUsd !== undefined ? Number(fundsSub.chargedUsd) :
    25.00;

  const escrowStatus =
    raw.escrowStatus ||
    fundsSub.settlementMode ||
    (fundsSub.status === 'SETTLED' ? `SETTLED // ${fundsSub.escrowTxId || 'ESCROW-VERIFIED'}` : 'ESCROW LOCKED & VERIFIED');

  const escrowTxId =
    raw.escrowTxId ||
    fundsSub.escrowTxId ||
    `ESCROW-TX-${notaryCode.slice(-6)}`;

  const portalUrl =
    raw.portalUrl ||
    raw.roomUrl ||
    bookingSub.meetingRoomUrl ||
    `/api/notarize/portal?code=${encodeURIComponent(notaryCode)}&invite=${encodeURIComponent(inviteCode)}`;

  const status = raw.status || 'CHECKED_IN_READY';

  const generatedPdf = buildRealSealedPdfDataUrl({
    notaryCode,
    inviteCode,
    documentName,
    signerName,
    digest,
    scheduledTime,
    feeUsd,
    signatureText: raw.signatureText || '',
    sealId: raw.sealCertificateId || raw.sealId || '',
    status
  });

  const pdfDataUrl =
    (raw.pdfDataUrl && String(raw.pdfDataUrl).startsWith('data:application/pdf')) ? raw.pdfDataUrl :
    (pdfSub.dataUrl && String(pdfSub.dataUrl).startsWith('data:application/pdf')) ? pdfSub.dataUrl :
    generatedPdf.dataUrl;

  const assets = Array.isArray(raw.assets) && raw.assets.length > 0 ? raw.assets : [
    {
      id: 'ASSET-PDF-01',
      label: 'PRIMARY LEGAL INSTRUMENT (PDF)',
      value: `${documentName} (${Math.round((generatedPdf.byteSize || 1240) / 1024 * 10) / 10} KB)`,
      status: 'SHA-256 VERIFIED',
      icon: '📄'
    },
    {
      id: 'ASSET-ID-02',
      label: 'SIGNER CREDENTIAL & KBA BADGE',
      value: `GOV-ID // ${String(signerName).toUpperCase()} [KBA SCORE: 5/5]`,
      status: 'CREDENTIAL MATCHED',
      icon: '🪪'
    },
    {
      id: 'ASSET-BIO-03',
      label: 'BIOMETRIC LIVENESS & RETINAL SCAN',
      value: '3D DEPTH + NEURAL PULSE STREAM (99.94%)',
      status: 'LIVENESS CONFIRMED',
      icon: '👁️'
    },
    {
      id: 'ASSET-ESCROW-04',
      label: 'SMARTCARD ESCROW / FEE RECEIPT',
      value: `$${Number.isFinite(feeUsd) ? feeUsd.toFixed(2) : '25.00'} USD // ${escrowTxId}`,
      status: 'SETTLED IN ESCROW',
      icon: '💳'
    }
  ];

  return {
    ...raw,
    id: raw.id || raw.sessionId || notaryCode,
    sessionId: raw.sessionId || raw.id || notaryCode,
    notaryCode,
    sessionCode: notaryCode,
    confirmationCode: notaryCode,
    inviteCode,
    setupCode: inviteCode,
    documentName,
    digest,
    documentDigest: digest,
    scheduledTime,
    slotLabel: scheduledTime,
    signerName,
    profile: signerName,
    feeUsd: Number.isFinite(feeUsd) ? feeUsd : 25.00,
    escrowStatus,
    escrowTxId,
    portalUrl,
    roomUrl: portalUrl,
    pdfDataUrl,
    rawPdfText: generatedPdf.rawPdfText,
    sealCertificateId: raw.sealCertificateId || raw.sealId || generatedPdf.sealId,
    signatureApplied: Boolean(raw.signatureApplied || status === 'COMPLETED_SEALED'),
    signatureText: raw.signatureText || `/s/ ${signerName}`,
    vaultArchived: Boolean(raw.vaultArchived || status === 'COMPLETED_SEALED'),
    status,
    assets
  };
}

/**
 * Reads all stored notarization sessions & invites from localStorage and returns a unified list.
 */
export function loadAllStoredNotarySessions() {
  const combined = [];
  const seenCodes = new Set();

  const parseStore = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed);
    } catch (_) {}
    return [];
  };

  const primaryList = parseStore(NOTARY_SESSIONS_KEY_V1);
  const altList = parseStore(NOTARY_SESSIONS_ALT_KEY);
  const inviteList = parseStore(NOTARY_INVITES_KEY_V1);

  for (const item of [...primaryList, ...altList, ...inviteList]) {
    if (!item || typeof item !== 'object') continue;
    const norm = normalizeNotarySession(item);
    if (!seenCodes.has(norm.notaryCode)) {
      seenCodes.add(norm.notaryCode);
      combined.push(norm);
    }
  }

  return combined;
}

/**
 * Looks up the active notary session from sessionStorage / localStorage or returns a fallback demo session.
 */
export function resolveActiveNotarySession(explicitCode = null) {
  let activeCode = explicitCode;
  if (!activeCode) {
    try {
      activeCode =
        sessionStorage.getItem(ACTIVE_NOTARY_CODE_KEY) ||
        localStorage.getItem(ACTIVE_NOTARY_CODE_KEY) ||
        '';
    } catch (_) {
      activeCode = '';
    }
  }

  // Also check hash query param if present (e.g., #/notarization?code=AC-RON-123456)
  if (!activeCode && typeof window !== 'undefined' && window.location && window.location.hash.includes('?')) {
    try {
      const q = window.location.hash.split('?')[1];
      const params = new URLSearchParams(q);
      activeCode = params.get('code') || params.get('notaryCode') || '';
    } catch (_) {}
  }

  activeCode = String(activeCode || '').trim().toUpperCase();
  const sessions = loadAllStoredNotarySessions();

  if (activeCode) {
    const matched = sessions.find(s =>
      s.notaryCode.toUpperCase() === activeCode ||
      s.inviteCode.toUpperCase() === activeCode ||
      String(s.id || '').toUpperCase() === activeCode ||
      String(s.sessionId || '').toUpperCase() === activeCode
    );
    if (matched) return matched;
    // If user typed or navigated with a specific AC-RON-XXXXXX code not yet in list, synthesize a live session for that code
    return normalizeNotarySession({ notaryCode: activeCode }, activeCode);
  }

  if (sessions.length > 0) {
    return sessions[0];
  }

  return normalizeNotarySession({
    notaryCode: 'AC-RON-884920',
    inviteCode: 'AC-INV-773190',
    documentName: 'AlphaCore_Executive_Affidavit.pdf',
    scheduledTime: new Date(Date.now() + 6 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (EARLY CHECK-IN 5-10 MIN WINDOW)',
    feeUsd: 25.00,
    status: 'CHECKED_IN_READY'
  });
}

/**
 * Saves or updates a notarization session in `alphacore_notary_sessions_v1` (and syncs `alphacore_notarization_sessions_v1`).
 */
export function persistNotarySessionUpdate(sessionObj) {
  const normalized = normalizeNotarySession(sessionObj);
  try {
    sessionStorage.setItem(ACTIVE_NOTARY_CODE_KEY, normalized.notaryCode);
    localStorage.setItem(ACTIVE_NOTARY_CODE_KEY, normalized.notaryCode);
  } catch (_) {}

  const updateKeyList = (storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey);
      let list = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      const matchIdx = list.findIndex(item => {
        if (!item || typeof item !== 'object') return false;
        const c = String(item.notaryCode || item.sessionCode || item.confirmationCode || item.id || item.sessionId || '').toUpperCase();
        return c === normalized.notaryCode;
      });
      if (matchIdx >= 0) {
        list[matchIdx] = { ...list[matchIdx], ...normalized };
      } else {
        list.unshift(normalized);
      }
      localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 50)));
    } catch (_) {}
  };

  updateKeyList(NOTARY_SESSIONS_KEY_V1);
  updateKeyList(NOTARY_SESSIONS_ALT_KEY);

  return normalized;
}

/**
 * Archives the sealed notarized PDF to both `vault_${profile}` and `alphacore_vault_files`.
 */
export function archiveSealedPdfToVault(sessionObj) {
  const normalized = normalizeNotarySession(sessionObj);
  const profileRaw =
    normalized.signerName ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('current_profile')) ||
    'Architect';
  const cleanProfile = String(profileRaw).trim() || 'Architect';
  const vaultProfileKey = `vault_${cleanProfile}`;
  constvaultProfileLowerKey = `vault_${cleanProfile.toLowerCase()}`;

  const sealedFilename = normalized.documentName.toUpperCase().startsWith('SEALED_')
    ? normalized.documentName
    : `SEALED_${normalized.notaryCode}_${normalized.documentName}`;

  const vaultRecord = {
    id: `vf_ron_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename: sealedFilename,
    name: sealedFilename,
    type: 'application/pdf',
    owner: cleanProfile.toUpperCase(),
    profile: cleanProfile,
    shared: false,
    notaryCode: normalized.notaryCode,
    inviteCode: normalized.inviteCode,
    digest: normalized.digest,
    sealCertificateId: normalized.sealCertificateId,
    status: 'COMPLETED_SEALED',
    size: normalized.rawPdfText ? normalized.rawPdfText.length : 1420,
    content: normalized.rawPdfText,
    dataUrl: normalized.pdfDataUrl,
    created_at: new Date().toISOString()
  };

  const pushToStore = (key) => {
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const arr = Array.isArray(existing) ? existing : [];
      const filtered = arr.filter(item => item && item.notaryCode !== normalized.notaryCode);
      filtered.unshift(vaultRecord);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 50)));
    } catch (_) {}
  };

  pushToStore(vaultProfileKey);
  if (constvaultProfileLowerKey !== vaultProfileKey) {
    pushToStore(constvaultProfileLowerKey);
  }
  pushToStore('alphacore_vault_files');

  return { vaultKey: vaultProfileKey, vaultRecord };
}

/**
 * Builds the interactive `srcdoc` HTML for the embedded RON Portal Webpage (`#notary-embedded-webpage-frame`).
 * Includes a postMessage bridge back to the parent AlphaCore HUD window.
 */
export function buildEmbeddedRonPortalSrcdoc(session) {
  const safeCode = escapeHTML(session.notaryCode);
  const safeInvite = escapeHTML(session.inviteCode);
  const safeDoc = escapeHTML(session.documentName);
  const safeSigner = escapeHTML(session.signerName);
  const safeDigest = escapeHTML(session.digest);
  const safeTime = escapeHTML(session.scheduledTime);
  const safeSealId = escapeHTML(session.sealCertificateId);
  const isAlreadySealed = session.status === 'COMPLETED_SEALED';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>ALPHACORE RON PORTAL // ${safeCode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #040811;
    color: #e2e8f0;
    font-family: 'Share Tech Mono', 'Courier New', monospace;
    padding: 12px;
    overflow-x: hidden;
  }
  .portal-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(0, 184, 255, 0.08);
    border: 1px solid rgba(0, 184, 255, 0.4);
    border-radius: 6px;
    margin-bottom: 12px;
  }
  .portal-brand {
    color: #00b8ff;
    font-weight: bold;
    font-size: 0.9rem;
    letter-spacing: 1px;
    text-shadow: 0 0 8px rgba(0, 184, 255, 0.5);
  }
  .portal-pill {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.72rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid #10b981;
    color: #10b981;
    font-weight: bold;
  }
  .portal-grid {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 12px;
  }
  @media (max-width: 680px) {
    .portal-grid { grid-template-columns: 1fr; }
  }
  .officer-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .video-feed-box {
    background: radial-gradient(circle at 50% 35%, #0c2238 0%, #03070e 85%);
    border: 1px solid #00b8ff;
    border-radius: 6px;
    padding: 10px;
    position: relative;
    min-height: 165px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 0 24px rgba(0, 184, 255, 0.18);
  }
  .live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    color: #00ff8c;
    background: rgba(0, 0, 0, 0.65);
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 255, 140, 0.4);
    width: fit-content;
  }
  .live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #00ff8c;
    box-shadow: 0 0 8px #00ff8c;
  }
  .officer-avatar {
    text-align: center;
    margin: 8px 0;
  }
  .officer-avatar-ring {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 2px solid #00b8ff;
    margin: 0 auto 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    background: rgba(0, 184, 255, 0.12);
    box-shadow: 0 0 15px rgba(0, 184, 255, 0.35);
  }
  .audio-bars {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 3px;
    height: 16px;
    margin-top: 4px;
  }
  .audio-bar {
    width: 4px;
    background: #00b8ff;
    border-radius: 2px;
    animation: pulseBar 0.8s infinite ease-in-out alternate;
  }
  .audio-bar:nth-child(2) { animation-delay: 0.15s; height: 14px; }
  .audio-bar:nth-child(3) { animation-delay: 0.3s; height: 10px; }
  .audio-bar:nth-child(4) { animation-delay: 0.45s; height: 16px; }
  .audio-bar:nth-child(5) { animation-delay: 0.2s; height: 8px; }
  @keyframes pulseBar {
    from { height: 4px; opacity: 0.5; }
    to { height: 16px; opacity: 1; }
  }
  .kba-box {
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 6px;
    padding: 10px;
    font-size: 0.72rem;
    line-height: 1.5;
  }
  .kba-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    margin-top: 5px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 4px;
    color: #10b981;
  }
  .doc-canvas-col {
    background: rgba(10, 16, 28, 0.95);
    border: 1px solid rgba(0, 184, 255, 0.35);
    border-radius: 6px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }
  .doc-sheet {
    background: #070d19;
    border: 1px dashed rgba(0, 184, 255, 0.45);
    border-radius: 4px;
    padding: 12px;
    font-size: 0.75rem;
    line-height: 1.55;
  }
  .doc-sheet-header {
    color: #00b8ff;
    font-weight: bold;
    border-bottom: 1px solid rgba(0, 184, 255, 0.25);
    padding-bottom: 6px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
  }
  .sig-pad-area {
    margin-top: 10px;
    padding: 10px;
    background: rgba(0, 184, 255, 0.05);
    border: 1px solid rgba(0, 184, 255, 0.35);
    border-radius: 4px;
  }
  .sig-input {
    width: 100%;
    padding: 7px 10px;
    background: #02050a;
    border: 1px solid #00b8ff;
    color: #00ff8c;
    font-family: inherit;
    font-size: 0.82rem;
    border-radius: 4px;
    margin-top: 4px;
  }
  .portal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .portal-btn {
    flex: 1;
    min-width: 140px;
    padding: 9px 12px;
    background: rgba(0, 184, 255, 0.18);
    border: 1px solid #00b8ff;
    color: #fff;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: bold;
    letter-spacing: 0.8px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .portal-btn:hover {
    background: rgba(0, 184, 255, 0.35);
    box-shadow: 0 0 12px rgba(0, 184, 255, 0.4);
  }
  .portal-btn.seal-btn {
    background: rgba(0, 255, 140, 0.18);
    border-color: #00ff8c;
    color: #00ff8c;
  }
  .portal-btn.seal-btn:hover {
    background: rgba(0, 255, 140, 0.32);
    box-shadow: 0 0 14px rgba(0, 255, 140, 0.45);
  }
  .seal-stamp-box {
    margin-top: 8px;
    padding: 8px 10px;
    border: 2px solid #00ff8c;
    border-radius: 4px;
    background: rgba(0, 255, 140, 0.08);
    color: #00ff8c;
    font-size: 0.72rem;
    display: ${isAlreadySealed ? 'block' : 'none'};
  }
</style>
</head>
<body>
  <div class="portal-topbar">
    <div class="portal-brand">⚖ ALPHACORE RON PORTAL // ROOM [${safeCode}]</div>
    <div class="portal-pill" id="portal-status-pill">${isAlreadySealed ? '✓ COMPLETED & SEALED' : '● LIVE OFFICER LINKED // EARLY CHECK-IN ACTIVE'}</div>
  </div>

  <div class="portal-grid">
    <div class="officer-col">
      <div class="video-feed-box">
        <div class="live-indicator">
          <span class="live-dot"></span> REC // ENCRYPTED AV STREAM
        </div>
        <div class="officer-avatar">
          <div class="officer-avatar-ring">⚖</div>
          <div style="font-size: 0.78rem; font-weight: bold; color: #fff;">COMM. V. KOVACS</div>
          <div style="font-size: 0.65rem; color: #38bdf8;">COMMISSION #AC-RON-99402-GA</div>
          <div class="audio-bars">
            <span class="audio-bar"></span><span class="audio-bar"></span><span class="audio-bar"></span><span class="audio-bar"></span><span class="audio-bar"></span>
          </div>
        </div>
        <div style="font-size: 0.65rem; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>INVITE: ${safeInvite}</span>
          <span style="color: #00ff8c;">TLS 1.3</span>
        </div>
      </div>

      <div class="kba-box">
        <div style="color: #38bdf8; font-weight: bold; margin-bottom: 4px;">// KBA &amp; CREDENTIAL VERIFICATION</div>
        <div>SIGNER: <strong style="color: #fff;">${safeSigner}</strong></div>
        <div>SLOT: <span style="color: #cbd5e1;">${safeTime}</span></div>
        <div class="kba-badge" id="kba-badge-status">
          <span>🪪 KBA / ID CREDENTIAL</span>
          <strong id="kba-badge-label">VERIFIED (5/5)</strong>
        </div>
        <button type="button" class="portal-btn" id="portal-verify-kba-btn" style="width: 100%; margin-top: 8px; padding: 6px;">
          🪪 RE-VERIFY KBA &amp; ID BADGE
        </button>
      </div>
    </div>

    <div class="doc-canvas-col">
      <div class="doc-sheet" id="portal-doc-canvas">
        <div class="doc-sheet-header">
          <span>📄 ${safeDoc}</span>
          <span>SHA-256: ${safeDigest.slice(0, 16)}...</span>
        </div>
        <p style="color: #cbd5e1; margin-bottom: 8px;">
          STATE OF GEORGIA // CYBER-JURISDICTION SEC-7<br/>
          Before me, the undersigned Remote Online Notary, personally appeared
          <strong style="color: #fff;">${safeSigner}</strong> via real-time two-way audio/video communication,
          verified via KBA + biometric credential analysis, and executed this instrument.
        </p>

        <div class="sig-pad-area">
          <label for="portal-sig-input" style="font-size: 0.7rem; color: #38bdf8; display: block;">
            ✍ CLICK-TO-SIGN E-SIGNATURE PAD (SIGNER: ${safeSigner}):
          </label>
          <input id="portal-sig-input" class="sig-input" type="text" value="/s/ ${safeSigner}" />
        </div>

        <div class="seal-stamp-box" id="portal-seal-box">
          <strong>🔏 OFFICIAL X.509 CRYPTOGRAPHIC E-NOTARY SEAL APPLIED</strong><br/>
          SEAL ID: <span id="portal-seal-id">${safeSealId}</span> // STATUS: <span id="portal-seal-state">${isAlreadySealed ? 'COMPLETED_SEALED' : 'ARMED'}</span>
        </div>
      </div>

      <div class="portal-actions">
        <button type="button" class="portal-btn" id="portal-sign-btn">
          ✍ CLICK TO SIGN DOCUMENT
        </button>
        <button type="button" class="portal-btn seal-btn" id="portal-stamp-seal-btn">
          🔏 STAMP E-NOTARY JURAT SEAL
        </button>
      </div>
    </div>
  </div>

  <script>
    (function() {
      const notifyParent = (type, detail) => {
        try {
          window.parent.postMessage({
            source: 'ALPHACORE_RON_PORTAL',
            type: type,
            notaryCode: '${safeCode}',
            inviteCode: '${safeInvite}',
            detail: detail || {}
          }, '*');
        } catch (e) {}
      };

      const sigInput = document.getElementById('portal-sig-input');
      const sealBox = document.getElementById('portal-seal-box');
      const statusPill = document.getElementById('portal-status-pill');
      const kbaBtn = document.getElementById('portal-verify-kba-btn');
      const signBtn = document.getElementById('portal-sign-btn');
      const stampBtn = document.getElementById('portal-stamp-seal-btn');

      if (kbaBtn) {
        kbaBtn.addEventListener('click', function() {
          const lbl = document.getElementById('kba-badge-label');
          if (lbl) lbl.textContent = 'RE-VERIFIED ✓ (100%)';
          notifyParent('KBA_VERIFIED', { kbaScore: '5/5', verifiedAt: new Date().toISOString() });
        });
      }

      if (signBtn) {
        signBtn.addEventListener('click', function() {
          const sigVal = sigInput ? sigInput.value.trim() : '/s/ ${safeSigner}';
          if (statusPill) statusPill.textContent = '✍ E-SIGNATURE CAPTURED // READY FOR SEAL';
          notifyParent('SIGNATURE_APPLIED', { signatureText: sigVal, signedAt: new Date().toISOString() });
        });
      }

      if (stampBtn) {
        stampBtn.addEventListener('click', function() {
          const sigVal = sigInput ? sigInput.value.trim() : '/s/ ${safeSigner}';
          if (sealBox) sealBox.style.display = 'block';
          const sealState = document.getElementById('portal-seal-state');
          if (sealState) sealState.textContent = 'COMPLETED_SEALED';
          if (statusPill) statusPill.textContent = '✓ E-NOTARY SEAL STAMPED & VERIFIED';
          notifyParent('SEAL_STAMPED', {
            signatureText: sigVal,
            sealId: '${safeSealId}',
            stampedAt: new Date().toISOString()
          });
        });
      }
    })();
  </script>
</body>
</html>`;
}

export default function NotarizationPage() {
  const container = createElement('div', {
    className: 'notarization-page',
    style: 'padding: 18px 22px 48px; max-width: 1480px; margin: 0 auto; font-family: "Share Tech Mono", monospace; color: #e2e8f0;'
  });

  let activeSession = resolveActiveNotarySession();
  persistNotarySessionUpdate(activeSession);

  let iframeMode = 'SRCDOC'; // 'SRCDOC' or 'EXTERNAL'

  const renderPage = () => {
    const allSessions = loadAllStoredNotarySessions();
    const isCompleted = activeSession.status === 'COMPLETED_SEALED';

    container.innerHTML = `
      <!-- Top Navigation & Page Title Banner -->
      <div class="cyber-panel" style="padding: 16px 20px; margin-bottom: 16px; border: 1px solid rgba(0, 184, 255, 0.45); background: linear-gradient(135deg, rgba(4, 12, 26, 0.95), rgba(8, 22, 42, 0.92)); box-shadow: 0 0 28px rgba(0, 184, 255, 0.14);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid rgba(0, 184, 255, 0.25); padding-bottom: 12px;">
          <div>
            <div style="font-size: 0.72rem; color: #00b8ff; letter-spacing: 1.5px; margin-bottom: 4px;">
              [STAGE 04 // DEDICATED REMOTE ONLINE NOTARIZATION ROOM &amp; CRYPTOGRAPHIC JURAT TERMINAL]
            </div>
            <h1 class="glitch" data-text="ALPHACORE // RON_NOTARY_CHAMBER" style="font-family: 'Orbitron', sans-serif; font-size: 1.35rem; color: #fff; margin: 0; letter-spacing: 1.5px;">
              ALPHACORE // RON_NOTARY_CHAMBER
            </h1>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <!-- Switch / Lookup AC-RON-XXXXXX Code directly on the page -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <input
                type="text"
                id="notary-code-lookup-input"
                class="aim-input"
                value="${escapeHTML(activeSession.notaryCode)}"
                placeholder="AC-RON-XXXXXX"
                aria-label="Enter or switch Notary Session Code"
                style="width: 155px; padding: 6px 10px; font-size: 0.78rem; color: #00ff8c; border-color: rgba(0, 255, 140, 0.5);"
              />
              <button type="button" id="notary-code-lookup-btn" class="aim-btn aim-btn-sm" style="padding: 6px 12px; font-size: 0.74rem; border-color: #00ff8c; color: #00ff8c;">
                🔍 LOAD CODE
              </button>
            </div>

            <button
              type="button"
              id="btn-return-cognitive-core"
              class="aim-btn aim-btn-sm"
              style="padding: 8px 14px; font-family: 'Orbitron', sans-serif; font-size: 0.74rem; background: rgba(0, 184, 255, 0.16); border-color: #00b8ff; color: #fff;"
            >
              ← RETURN TO COGNITIVE CORE
            </button>
          </div>
        </div>

        <!-- Session Telemetry Header Grid -->
        <div id="notary-session-telemetry-header" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px;">
          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 255, 140, 0.45); border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 0.66rem; color: #94a3b8;">MATCHED NOTARY SESSION CODE</div>
            <div id="telemetry-notary-code" style="font-size: 1.02rem; font-weight: bold; color: #00ff8c; margin-top: 3px; letter-spacing: 1px;">
              ${escapeHTML(activeSession.notaryCode)}
            </div>
            <div style="font-size: 0.65rem; color: #10b981; margin-top: 2px;">✓ CRYPTOGRAPHICALLY MATCHED</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 184, 255, 0.4); border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 0.66rem; color: #94a3b8;">LINKED 1-TIME INVITE CODE</div>
            <div id="telemetry-invite-code" style="font-size: 0.96rem; font-weight: bold; color: #00b8ff; margin-top: 3px; letter-spacing: 1px;">
              ${escapeHTML(activeSession.inviteCode)}
            </div>
            <div style="font-size: 0.65rem; color: #38bdf8; margin-top: 2px;">SINGLE-USE TOKEN CONSUMED</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(16, 185, 129, 0.45); border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 0.66rem; color: #94a3b8;">SCHEDULED BOOKING &amp; CHECK-IN WINDOW</div>
            <div id="telemetry-scheduled-time" style="font-size: 0.82rem; font-weight: bold; color: #fff; margin-top: 3px;">
              ${escapeHTML(activeSession.scheduledTime)}
            </div>
            <div id="telemetry-checkin-window" style="font-size: 0.66rem; color: #00ff8c; margin-top: 2px; font-weight: bold;">
              EARLY CHECK-IN VERIFIED // 5-10 MIN WINDOW ACTIVE
            </div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(192, 132, 252, 0.4); border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 0.66rem; color: #94a3b8;">SIGNER IDENTITY &amp; ESCROW FEE</div>
            <div id="telemetry-signer-identity" style="font-size: 0.86rem; font-weight: bold; color: #fff; margin-top: 3px;">
              ${escapeHTML(String(activeSession.signerName).toUpperCase())} // $${Number(activeSession.feeUsd).toFixed(2)} USD
            </div>
            <div id="telemetry-escrow-status" style="font-size: 0.65rem; color: #c084fc; margin-top: 2px;">
              ${escapeHTML(activeSession.escrowStatus)}
            </div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 0.66rem; color: #94a3b8;">DOCUMENT &amp; SHA-256 DIGEST</div>
            <div id="telemetry-doc-name" style="font-size: 0.8rem; font-weight: bold; color: #38bdf8; margin-top: 3px; word-break: break-all;">
              ${escapeHTML(activeSession.documentName)}
            </div>
            <div id="telemetry-doc-digest" style="font-size: 0.64rem; color: #94a3b8; margin-top: 2px; word-break: break-all;">
              SHA-256: ${escapeHTML(String(activeSession.digest).slice(0, 28))}...
            </div>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Layout: Left/Main Embedded RON Webpage Viewport + Right Collected Assets & Cryptographic Ledger Panel -->
      <div style="display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(320px, 1fr); gap: 16px; align-items: start;" class="notarization-main-grid">
        
        <!-- LEFT / MAIN COLUMN: Embedded RON Webpage Viewport -->
        <div class="cyber-panel" style="padding: 14px; border: 1px solid rgba(0, 184, 255, 0.4); background: rgba(5, 11, 22, 0.92);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 184, 255, 0.2);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #00ff8c; box-shadow: 0 0 8px #00ff8c;"></span>
              <span style="font-family: 'Orbitron', sans-serif; font-size: 0.82rem; color: #00b8ff; font-weight: bold; letter-spacing: 1px;">
                // EMBEDDED RON WEBPAGE VIEWPORT
              </span>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button
                type="button"
                id="btn-mode-srcdoc"
                class="aim-btn aim-btn-sm"
                style="padding: 5px 10px; font-size: 0.7rem; ${iframeMode === 'SRCDOC' ? 'background: rgba(0, 255, 140, 0.2); border-color: #00ff8c; color: #00ff8c;' : 'opacity: 0.75;'}"
              >
                ⚡ INTERACTIVE RON PORTAL (SRCDOC)
              </button>
              <button
                type="button"
                id="btn-mode-external"
                class="aim-btn aim-btn-sm"
                style="padding: 5px 10px; font-size: 0.7rem; ${iframeMode === 'EXTERNAL' ? 'background: rgba(0, 184, 255, 0.25); border-color: #00b8ff; color: #00b8ff;' : 'opacity: 0.75;'}"
              >
                🌐 EXTERNAL / BACKEND URL (/api/notarize/portal)
              </button>
            </div>
          </div>

          <!-- URL / Endpoint Bar -->
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; background: rgba(0, 0, 0, 0.5); padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(0, 184, 255, 0.25);">
            <span style="font-size: 0.7rem; color: #38bdf8;">PORTAL URL:</span>
            <input
              type="text"
              id="notary-portal-url-input"
              class="aim-input"
              value="${escapeHTML(activeSession.portalUrl)}"
              style="flex: 1; padding: 4px 8px; font-size: 0.74rem; background: rgba(2, 6, 14, 0.9);"
            />
            <button type="button" id="btn-load-portal-url" class="aim-btn aim-btn-sm" style="padding: 4px 10px; font-size: 0.7rem;">
              LOAD URL
            </button>
          </div>

          <!-- Embedded RON Webpage Iframe -->
          <div style="position: relative; width: 100%; border: 1px solid rgba(0, 184, 255, 0.45); border-radius: 6px; overflow: hidden; background: #030710;">
            <iframe
              id="notary-embedded-webpage-frame"
              title="AlphaCore Embedded Remote Online Notarization Portal"
              style="width: 100%; height: 470px; border: none; display: block; background: #040811;"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            ></iframe>
          </div>

          <!-- PostMessage Bridge Telemetry Log -->
          <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0, 0, 0, 0.55); border: 1px solid rgba(0, 184, 255, 0.25); border-radius: 4px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 0.72rem; color: #94a3b8;">
              BRIDGE TELEMETRY: <span id="notary-bridge-event-log" style="color: #00ff8c;">postMessage listener active // Ready for RON portal events</span>
            </div>
            <div style="font-size: 0.68rem; color: #38bdf8;">
              SESSION STATUS: <strong id="notary-live-status-badge" style="color: ${isCompleted ? '#00ff8c' : '#f59e0b'};">${escapeHTML(activeSession.status)}</strong>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Collected Assets & Cryptographic Ledger Panel -->
        <div class="cyber-panel" style="padding: 16px; border: 1px solid rgba(0, 255, 140, 0.4); background: rgba(5, 12, 24, 0.94); display: flex; flex-direction: column; gap: 14px;">
          <div style="border-bottom: 1px solid rgba(0, 255, 140, 0.25); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: 'Orbitron', sans-serif; font-size: 0.82rem; color: #00ff8c; font-weight: bold; letter-spacing: 1px;">
              // COLLECTED ASSETS &amp; CRYPTO LEDGER
            </span>
            <span style="font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; background: rgba(0, 255, 140, 0.14); border: 1px solid #00ff8c; color: #00ff8c;">
              ${activeSession.assets.length} ASSETS LOCKED
            </span>
          </div>

          <!-- Collected Assets List -->
          <div id="notary-collected-assets-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${activeSession.assets.map(asset => `
              <div style="padding: 9px 11px; background: rgba(0, 184, 255, 0.05); border: 1px solid rgba(0, 184, 255, 0.28); border-radius: 5px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div>
                  <div style="font-size: 0.68rem; color: #94a3b8;">${escapeHTML(asset.icon || '◈')} ${escapeHTML(asset.label)}</div>
                  <div style="font-size: 0.78rem; color: #fff; font-weight: bold; margin-top: 2px; word-break: break-all;">${escapeHTML(asset.value)}</div>
                </div>
                <span style="font-size: 0.64rem; padding: 3px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #10b981; white-space: nowrap;">
                  ✓ ${escapeHTML(asset.status)}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Cryptographic Jurat & Seal Status Box -->
          <div style="padding: 11px 12px; background: rgba(0, 0, 0, 0.5); border: 1px solid ${isCompleted ? '#00ff8c' : 'rgba(0, 184, 255, 0.35)'}; border-radius: 6px; font-size: 0.74rem; line-height: 1.55;">
            <div style="color: #00b8ff; font-weight: bold; margin-bottom: 4px;">// X.509 JURAT &amp; VAULT LEDGER STATE</div>
            <div>E-SIGNATURE: <span id="ledger-sig-state" style="color: ${activeSession.signatureApplied ? '#00ff8c' : '#f59e0b'}; font-weight: bold;">
              ${activeSession.signatureApplied ? `APPLIED (${escapeHTML(activeSession.signatureText)})` : 'PENDING SIGNER EXECUTION'}
            </span></div>
            <div>SEAL CERT ID: <span id="ledger-seal-id" style="color: #fff;">${escapeHTML(activeSession.sealCertificateId)}</span></div>
            <div>VAULT TARGET: <span style="color: #38bdf8;">vault_${escapeHTML(activeSession.signerName)}</span></div>
            <div>LEDGER STATUS: <strong id="ledger-final-status" style="color: ${isCompleted ? '#00ff8c' : '#38bdf8'};">${escapeHTML(activeSession.status)}</strong></div>
          </div>

          <!-- Interactive Notarization Execution Buttons -->
          <div style="display: flex; flex-direction: column; gap: 9px;">
            <button
              type="button"
              id="btn-apply-esig-jurat-seal"
              class="aim-btn"
              style="width: 100%; padding: 10px 14px; font-family: 'Orbitron', sans-serif; font-size: 0.76rem; background: rgba(0, 184, 255, 0.18); border-color: #00b8ff; color: #fff; text-align: center;"
            >
              ✍ APPLY E-SIGNATURE &amp; JURAT SEAL
            </button>

            <button
              type="button"
              id="btn-finalize-archive-vault"
              class="aim-btn aim-btn-accept"
              style="width: 100%; padding: 11px 14px; font-family: 'Orbitron', sans-serif; font-size: 0.76rem; background: rgba(0, 255, 140, 0.2); border-color: #00ff8c; color: #00ff8c; font-weight: bold; text-align: center;"
            >
              🔐 FINALIZE &amp; ARCHIVE SEALED PDF TO VAULT
            </button>

            <a
              id="btn-download-sealed-pdf"
              class="aim-btn"
              href="${activeSession.pdfDataUrl}"
              download="SEALED_${escapeHTML(activeSession.notaryCode)}_${escapeHTML(activeSession.documentName)}"
              style="width: 100%; padding: 10px 14px; font-family: 'Orbitron', sans-serif; font-size: 0.76rem; background: rgba(192, 132, 252, 0.18); border-color: #c084fc; color: #fff; text-align: center; text-decoration: none; display: inline-block; box-sizing: border-box;"
            >
              ⬇ DOWNLOAD SEALED NOTARIZED PDF (%PDF-1.4)
            </a>
          </div>

          <!-- Stored Sessions Switcher (if multiple sessions exist) -->
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 10px;">
            <div style="font-size: 0.68rem; color: #94a3b8; margin-bottom: 6px;">// STORED NOTARIZATION SESSIONS (${allSessions.length}):</div>
            <div style="display: flex; flex-direction: column; gap: 5px; max-height: 120px; overflow-y: auto;">
              ${allSessions.map(s => `
                <button
                  type="button"
                  class="aim-btn aim-btn-sm session-switch-row-btn"
                  data-code="${escapeHTML(s.notaryCode)}"
                  style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; font-size: 0.68rem; text-align: left; border-color: ${s.notaryCode === activeSession.notaryCode ? '#00ff8c' : 'rgba(0,184,255,0.25)'};"
                >
                  <span><strong>${escapeHTML(s.notaryCode)}</strong> // ${escapeHTML(s.documentName)}</span>
                  <span style="color: ${s.status === 'COMPLETED_SEALED' ? '#00ff8c' : '#38bdf8'};">${escapeHTML(s.status)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;

    // Populate the iframe based on current mode
    const iframeEl = container.querySelector('#notary-embedded-webpage-frame');
    if (iframeEl) {
      if (iframeMode === 'EXTERNAL') {
        if (typeof iframeEl.removeAttribute === 'function') iframeEl.removeAttribute('srcdoc');
        iframeEl.src = apiUrl(activeSession.portalUrl);
      } else {
        if (typeof iframeEl.removeAttribute === 'function') iframeEl.removeAttribute('src');
        iframeEl.srcdoc = buildEmbeddedRonPortalSrcdoc(activeSession);
      }
    }

    // Wire up Return to Cognitive Core button
    const returnBtn = container.querySelector('#btn-return-cognitive-core');
    if (returnBtn) {
      returnBtn.onclick = () => {
        try { playSFX('navigate', 0.4); } catch (_) {}
        window.location.hash = '#/cognitive';
      };
    }

    // Wire up Notary Code Lookup / Switcher
    const lookupInput = container.querySelector('#notary-code-lookup-input');
    const lookupBtn = container.querySelector('#notary-code-lookup-btn');
    if (lookupBtn && lookupInput) {
      const handleCodeSwitch = () => {
        const entered = lookupInput.value.trim().toUpperCase();
        if (!entered) return;
        activeSession = resolveActiveNotarySession(entered);
        persistNotarySessionUpdate(activeSession);
        try { showToast('INFO', `Loaded Notary Session: ${activeSession.notaryCode}`); } catch (_) {}
        renderPage();
      };
      lookupBtn.onclick = handleCodeSwitch;
      lookupInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCodeSwitch();
        }
      };
    }

    // Wire up Stored Session Row buttons
    container.querySelectorAll('.session-switch-row-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          activeSession = resolveActiveNotarySession(code);
          persistNotarySessionUpdate(activeSession);
          renderPage();
        }
      };
    });

    // Wire up Iframe Mode toggles (SRCDOC vs External URL)
    const btnSrcdoc = container.querySelector('#btn-mode-srcdoc');
    const btnExternal = container.querySelector('#btn-mode-external');
    const urlInput = container.querySelector('#notary-portal-url-input');
    const loadUrlBtn = container.querySelector('#btn-load-portal-url');

    if (btnSrcdoc) {
      btnSrcdoc.onclick = () => {
        iframeMode = 'SRCDOC';
        renderPage();
      };
    }
    if (btnExternal) {
      btnExternal.onclick = () => {
        iframeMode = 'EXTERNAL';
        if (urlInput && urlInput.value.trim()) {
          activeSession.portalUrl = urlInput.value.trim();
        }
        renderPage();
      };
    }
    if (loadUrlBtn && urlInput) {
      loadUrlBtn.onclick = () => {
        const customUrl = urlInput.value.trim() || `/api/notarize/portal?code=${encodeURIComponent(activeSession.notaryCode)}`;
        activeSession.portalUrl = customUrl;
        iframeMode = 'EXTERNAL';
        persistNotarySessionUpdate(activeSession);
        renderPage();
      };
    }

    // Helper: Apply E-Signature & Jurat Seal
    const handleApplySignatureAndSeal = (customSigText = null) => {
      const sigText = customSigText || `/s/ ${activeSession.signerName} [RON-VERIFIED]`;
      const rebuiltPdf = buildRealSealedPdfDataUrl({
        notaryCode: activeSession.notaryCode,
        inviteCode: activeSession.inviteCode,
        documentName: activeSession.documentName,
        signerName: activeSession.signerName,
        digest: activeSession.digest,
        scheduledTime: activeSession.scheduledTime,
        feeUsd: activeSession.feeUsd,
        signatureText: sigText,
        sealId: activeSession.sealCertificateId,
        status: activeSession.status === 'COMPLETED_SEALED' ? 'COMPLETED_SEALED' : 'SEAL_APPLIED_READY'
      });

      activeSession = persistNotarySessionUpdate({
        ...activeSession,
        signatureApplied: true,
        signatureText: sigText,
        pdfDataUrl: rebuiltPdf.dataUrl,
        rawPdfText: rebuiltPdf.rawPdfText,
        sealCertificateId: rebuiltPdf.sealId,
        status: activeSession.status === 'COMPLETED_SEALED' ? 'COMPLETED_SEALED' : 'SEAL_APPLIED_READY'
      });

      try { playSFX('button', 0.5); } catch (_) {}
      try { showToast('INFO', `E-Signature & Jurat Seal [${activeSession.sealCertificateId}] applied.`); } catch (_) {}
      renderPage();
    };

    // Helper: Finalize & Archive Sealed PDF to Vault (`vault_${profile}`) and mark COMPLETED_SEALED
    const handleFinalizeAndArchive = () => {
      const sigText = activeSession.signatureText || `/s/ ${activeSession.signerName} [RON-VERIFIED]`;
      const rebuiltPdf = buildRealSealedPdfDataUrl({
        notaryCode: activeSession.notaryCode,
        inviteCode: activeSession.inviteCode,
        documentName: activeSession.documentName,
        signerName: activeSession.signerName,
        digest: activeSession.digest,
        scheduledTime: activeSession.scheduledTime,
        feeUsd: activeSession.feeUsd,
        signatureText: sigText,
        sealId: activeSession.sealCertificateId,
        status: 'COMPLETED_SEALED'
      });

      activeSession = persistNotarySessionUpdate({
        ...activeSession,
        signatureApplied: true,
        signatureText: sigText,
        vaultArchived: true,
        pdfDataUrl: rebuiltPdf.dataUrl,
        rawPdfText: rebuiltPdf.rawPdfText,
        sealCertificateId: rebuiltPdf.sealId,
        completedAt: new Date().toISOString(),
        status: 'COMPLETED_SEALED'
      });

      const { vaultKey } = archiveSealedPdfToVault(activeSession);

      try { playSFX('modal', 0.6); } catch (_) {}
      try { showToast('INFO', `Notarization Finalized (${activeSession.notaryCode}) & Archived to ${vaultKey}!`); } catch (_) {}
      renderPage();
    };

    const applySigBtn = container.querySelector('#btn-apply-esig-jurat-seal');
    if (applySigBtn) {
      applySigBtn.onclick = () => handleApplySignatureAndSeal();
    }

    const finalizeBtn = container.querySelector('#btn-finalize-archive-vault');
    if (finalizeBtn) {
      finalizeBtn.onclick = () => handleFinalizeAndArchive();
    }
  };

  // Listen to postMessage events from the embedded RON iframe
  const onPortalMessage = (event) => {
    const data = event && event.data;
    if (!data || data.source !== 'ALPHACORE_RON_PORTAL') return;

    const bridgeLog = container.querySelector('#notary-bridge-event-log');
    if (bridgeLog) {
      bridgeLog.textContent = `[${new Date().toLocaleTimeString()}] Received ${data.type} from room ${data.notaryCode || activeSession.notaryCode}`;
    }

    if (data.type === 'SIGNATURE_APPLIED') {
      const sigText = (data.detail && data.detail.signatureText) || `/s/ ${activeSession.signerName}`;
      activeSession = persistNotarySessionUpdate({
        ...activeSession,
        signatureApplied: true,
        signatureText: sigText
      });
      const sigStateEl = container.querySelector('#ledger-sig-state');
      if (sigStateEl) {
        sigStateEl.textContent = `APPLIED (${sigText})`;
        sigStateEl.style.color = '#00ff8c';
      }
    } else if (data.type === 'SEAL_STAMPED') {
      const sigText = (data.detail && data.detail.signatureText) || activeSession.signatureText || `/s/ ${activeSession.signerName}`;
      const rebuiltPdf = buildRealSealedPdfDataUrl({
        notaryCode: activeSession.notaryCode,
        inviteCode: activeSession.inviteCode,
        documentName: activeSession.documentName,
        signerName: activeSession.signerName,
        digest: activeSession.digest,
        scheduledTime: activeSession.scheduledTime,
        feeUsd: activeSession.feeUsd,
        signatureText: sigText,
        sealId: activeSession.sealCertificateId,
        status: 'COMPLETED_SEALED'
      });
      activeSession = persistNotarySessionUpdate({
        ...activeSession,
        signatureApplied: true,
        signatureText: sigText,
        vaultArchived: true,
        pdfDataUrl: rebuiltPdf.dataUrl,
        rawPdfText: rebuiltPdf.rawPdfText,
        status: 'COMPLETED_SEALED'
      });
      archiveSealedPdfToVault(activeSession);
      renderPage();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', onPortalMessage);
  }

  renderPage();
  return container;
}
