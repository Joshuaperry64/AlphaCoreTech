/**
 * Verification Script for Online Notarization Multi-Agent Swarm
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@supabase/supabase-js') {
      return {
        url: 'data:text/javascript,export const createClient = () => ({ from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), insert: () => Promise.resolve({ data: [], error: null }) }), storage: { from: () => ({ upload: () => Promise.resolve({}), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) } });',
        shortCircuit: true
      };
    }
    if (specifier === './api.js' || specifier.endsWith('/components/api.js')) {
      return {
        url: 'data:text/javascript,export const API_BASE = ""; export function apiUrl(p) { return p; }',
        shortCircuit: true
      };
    }
    return nextResolve(specifier, context);
  }
});

// Set up minimal browser-like globals for DOM & storage testing
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

const sessionMap = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (sessionMap.has(k) ? sessionMap.get(k) : null),
  setItem: (k, v) => sessionMap.set(k, String(v)),
  removeItem: (k) => sessionMap.delete(k),
  clear: () => sessionMap.clear()
};

const {
  computeDocumentDigest,
  buildSyntheticPdfDataUrl,
  scanCandidateNotarySlots,
  executeNotarizationSwarm,
  getNotarizationSessions,
  STANDARD_NOTARY_FEE_USD
} = await import('../src/components/notarization_swarm.js');
const { creditWallet, getProfileWallet } = await import('../src/components/laundromat_wallet.js');
const { ALPHACORE_SYSTEM_INSTRUCTION } = await import('../src/components/alphacore_instruction.js');

async function runTests() {
  console.log('=== [TEST 1] SHA-256 Digest & Synthetic PDF Generation ===');
  const hash1 = await computeDocumentDigest('AlphaCore Test Contract');
  const hash2 = await computeDocumentDigest('AlphaCore Test Contract');
  const hash3 = await computeDocumentDigest('Different Payload');
  assert.equal(hash1.length, 64, 'SHA-256 digest must be 64 hex chars');
  assert.equal(hash1, hash2, 'Digest must be deterministic');
  assert.notEqual(hash1, hash3, 'Different inputs must produce different digests');

  const pdfArtifact = buildSyntheticPdfDataUrl({
    documentName: 'Cyber_Deed_2026.pdf',
    documentType: 'PROPERTY_DEED',
    signerName: 'Architect',
    documentHash: hash1,
    slotIso: '2026-10-21T14:00:00.000Z'
  });
  assert.ok(pdfArtifact.rawPdfText.startsWith('%PDF-1.4'), 'Must generate valid PDF header');
  assert.ok(pdfArtifact.dataUrl.startsWith('data:application/pdf;base64,'), 'Must produce base64 PDF data URL');
  console.log('  ✓ Passed Test 1');

  console.log('=== [TEST 2] Candidate Notary Slot Scanner & Soonest Slot Selection ===');
  const { slots, selectedSlot } = scanCandidateNotarySlots(1729516000000, 'SOONEST');
  assert.equal(slots.length, 3, 'Must discover 3 candidate notary slots');
  assert.equal(selectedSlot.slotId, slots[0].slotId, 'Must automatically select soonest available slot');
  assert.equal(selectedSlot.priority, 'SOONEST_IMMEDIATE');
  console.log('  ✓ Passed Test 2');

  console.log('=== [TEST 3] Parallel Multi-Agent Swarm Execution (Architect VIP 0% Fee & Operator Wallet Debit) ===');
  localStorage.clear();
  sessionStorage.setItem('current_profile', 'Architect');

  const progressEvents = [];
  const archSession = await executeNotarizationSwarm({
    documentName: 'Architect_Patent_Assignment.pdf',
    documentType: 'NDA_CONTRACT',
    signerName: 'Architect',
    feeAmount: STANDARD_NOTARY_FEE_USD,
    stepDelayMs: 5,
    onAgentUpdate: (ev) => progressEvents.push(ev)
  });

  assert.equal(archSession.status, 'COMPLETED_AND_BOOKED');
  assert.equal(archSession.executionMode, 'PARALLEL_MULTI_AGENT_SWARM');
  assert.equal(archSession.pdf.status, 'VERIFIED');
  assert.equal(archSession.pdf.documentName, 'Architect_Patent_Assignment.pdf');
  assert.equal(archSession.funds.status, 'SETTLED');
  assert.equal(archSession.funds.settlementMode, 'VIP_ARCHITECT_EXEMPT_WAIVER');
  assert.equal(archSession.funds.chargedUsd, 0);
  assert.equal(archSession.booking.status, 'BOOKED');
  assert.ok(archSession.booking.bookingConfirmationCode.includes('RON-'));
  assert.ok(archSession.notaryCode.startsWith('AC-RON-'));
  assert.ok(progressEvents.some(e => e.agentId === 'AGENT_01_PDF'));
  assert.ok(progressEvents.some(e => e.agentId === 'AGENT_02_FUNDS'));
  assert.ok(progressEvents.some(e => e.agentId === 'AGENT_03_BROWSER'));

  // Test Operator Fisherman with $50 preloaded wallet balance
  creditWallet('Fisherman', { balanceDelta: 50.00 });
  const fishWalletBefore = getProfileWallet('Fisherman');
  assert.equal(fishWalletBefore.balance, 50.00);

  const fishSession = await executeNotarizationSwarm({
    documentName: 'Harbor_Vessel_Affidavit', // missing .pdf extension -> should normalize
    documentType: 'AFFIDAVIT',
    signerName: 'Fisherman',
    feeAmount: 25.00,
    stepDelayMs: 5
  });

  assert.equal(fishSession.pdf.documentName, 'Harbor_Vessel_Affidavit.pdf', 'Should normalize .pdf extension');
  assert.equal(fishSession.funds.settlementMode, 'SMARTCARD_BALANCE_DEBIT');
  assert.equal(fishSession.funds.chargedUsd, 25.00);
  assert.equal(fishSession.funds.remainingBalanceUsd, 25.00);

  const savedSessions = getNotarizationSessions();
  assert.equal(savedSessions.length, 2, 'Both sessions should be persisted in localStorage');
  console.log('  ✓ Passed Test 3');

  console.log('=== [TEST 4] Edge Case: Zero Balance Operator Auto-Escrow Bridge ===');
  const doeSession = await executeNotarizationSwarm({
    documentName: 'Zero_Balance_Test.pdf',
    signerName: 'DoeBoy',
    feeAmount: 30.00,
    stepDelayMs: 5
  });
  assert.equal(doeSession.funds.status, 'SETTLED');
  assert.ok(doeSession.funds.settlementMode.includes('INSTANT_ESCROW_BRIDGE'));
  assert.equal(doeSession.funds.autoReloadedAmount, 30.00);
  assert.equal(doeSession.funds.remainingBalanceUsd, 0.00);
  console.log('  ✓ Passed Test 4');

  console.log('=== [TEST 5] System Instruction Integration ===');
  assert.ok(ALPHACORE_SYSTEM_INSTRUCTION.includes('execute_online_notarization'));
  console.log('  ✓ Passed Test 5');

  console.log('=== [TEST 6] UI HUD Component Rendering (renderNotarizationSwarmCard) ===');
  function createMockEl(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      style: {},
      attributes: {},
      children: [],
      textContent: '',
      _innerHTML: '',
      set innerHTML(val) {
        this._innerHTML = val;
      },
      get innerHTML() {
        return this._innerHTML;
      },
      setAttribute(k, v) { this.attributes[k] = v; },
      getAttribute(k) { return this.attributes[k]; },
      appendChild(child) { this.children.push(child); return child; },
      removeAttribute(k) { delete this.attributes[k]; },
      querySelectorAll(sel) { return []; },
      querySelector(sel) {
        if (!this._qCache) this._qCache = {};
        if (!this._qCache[sel]) this._qCache[sel] = createMockEl('div');
        return this._qCache[sel];
      }
    };
    return el;
  }
  globalThis.document = {
    createElement: (tag) => createMockEl(tag)
  };

  const { renderNotarizationSwarmCard } = await import('../src/components/notarization_swarm.js');
  const hostEl = createMockEl('div');
  const { card, executionPromise } = renderNotarizationSwarmCard({
    mountContainer: hostEl,
    initialParams: {
      documentName: 'HUD_Test_Contract.pdf',
      documentType: 'NDA_CONTRACT',
      signerName: 'Architect'
    },
    autoExecute: true,
    stepDelayMs: 5
  });

  const uiSession = await executionPromise;
  assert.equal(hostEl.children.length, 1, 'Card must be mounted into host container');
  assert.ok(card.innerHTML.includes('RON_NOTARIZATION_ORCHESTRATOR'), 'Card must render RON Swarm HUD header');
  assert.equal(card.querySelector('.pdf-doc-name').textContent, 'HUD_Test_Contract.pdf');
  assert.equal(card.querySelector('.browser-booking-code').textContent, uiSession.booking.bookingConfirmationCode);
  assert.equal(card.querySelector('.swarm-completion-banner').style.display, 'flex');
  console.log('  ✓ Passed Test 6');

  console.log('=== [TEST 7] 4-Stage Protocol Verification: Architect Invite, Redemption, Early Check-In & Notarization Page ===');
  const {
    createArchitectNotarizationInvite,
    validateOneTimeSetupCode,
    verifyNotaryCodeForCheckIn
  } = await import('../src/components/notarization_swarm.js');
  const NotarizationPageModule = await import('../src/pages/notarization.js');

  // Stage 1: Non-Architect denied
  const guestAttempt = createArchitectNotarizationInvite({
    callerProfile: 'Fisherman'
  });
  assert.equal(guestAttempt.success, false, 'Non-Architect caller must be denied from creating 1-time setup code');

  // Stage 1: Architect authorized
  const archInvite = createArchitectNotarizationInvite({
    callerProfile: 'Architect',
    clientName: 'AlphaPartner',
    documentType: 'NDA_CONTRACT',
    documentName: 'Alpha_Mutual_NDA.pdf'
  });
  assert.equal(archInvite.success, true);
  assert.ok(archInvite.setupCode.startsWith('AC-INV-'));

  // Stage 2: Validate 1-time setup code
  const valCheck = validateOneTimeSetupCode(archInvite.setupCode);
  assert.equal(valCheck.valid, true);

  // Stage 2: Execute swarm with setupCode -> produces new Notary Code AC-RON-XXXXXX
  const clientSession = await executeNotarizationSwarm({
    setupCode: archInvite.setupCode,
    documentName: 'Alpha_Mutual_NDA.pdf',
    documentType: 'NDA_CONTRACT',
    signerName: 'AlphaPartner',
    feeAmount: 25.00,
    stepDelayMs: 2
  });
  assert.equal(clientSession.status, 'COMPLETED_AND_BOOKED');
  assert.ok(clientSession.notaryCode.startsWith('AC-RON-'));
  assert.equal(clientSession.setupCode, archInvite.setupCode);

  // Stage 2: Re-use of consumed setup code must fail
  const reuseCheck = validateOneTimeSetupCode(archInvite.setupCode);
  assert.equal(reuseCheck.valid, false, 'Consumed 1-time setup code must not be reusable');

  // Stage 3: Early Check-In with new Notary Code AC-RON-XXXXXX
  const checkInRes = verifyNotaryCodeForCheckIn(clientSession.notaryCode);
  assert.equal(checkInRes.valid, true);
  assert.ok(checkInRes.checkInStatus.includes('CHECK-IN') || checkInRes.checkInStatus.includes('STANDBY'));

  // Stage 4: Dedicated Notarization Page build and verification
  const notaryPageEl = NotarizationPageModule.default();
  assert.ok(notaryPageEl, 'NotarizationPage must return a valid DOM element');
  assert.ok(notaryPageEl.innerHTML.includes('RON_NOTARY_CHAMBER'), 'Must render RON chamber page header');
  assert.ok(notaryPageEl.innerHTML.includes('notary-embedded-webpage-frame') || notaryPageEl.innerHTML.includes('iframe'), 'Must contain embedded RON webpage iframe/viewport');
  console.log('  ✓ Passed Test 7');

  console.log('\nALL NOTARIZATION MULTI-AGENT SWARM TESTS PASSED SUCCESSFULLY!');
}

await runTests();
