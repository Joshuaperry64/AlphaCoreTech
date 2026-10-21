import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDocumentDigest,
  buildSyntheticPdfDataUrl,
  scanCandidateNotarySlots,
  executeNotarizationSwarm,
  renderNotarizationSwarmCard,
  getNotarizationSessions
} from '../components/notarization_swarm.js';
import { creditWallet, getProfileWallet } from '../components/laundromat_wallet.js';

describe('Online Notarization Multi-Agent Swarm Engine & UI', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('computes deterministic SHA-256 digests and generates sealed PDF packets', async () => {
    const d1 = await computeDocumentDigest('AlphaCore Affidavit Payload');
    const d2 = await computeDocumentDigest('AlphaCore Affidavit Payload');
    expect(d1).toHaveLength(64);
    expect(d1).toBe(d2);

    const pdf = buildSyntheticPdfDataUrl({
      documentName: 'Test_Affidavit.pdf',
      signerName: 'Architect',
      documentHash: d1
    });
    expect(pdf.rawPdfText).toContain('%PDF-1.4');
    expect(pdf.dataUrl).toContain('data:application/pdf;base64,');
  });

  it('executes all 3 agents in parallel (PDF Ingest, Funds Escrow, Headless Browser Slot Booking)', async () => {
    creditWallet('Fisherman', { balanceDelta: 40 });
    const session = await executeNotarizationSwarm({
      documentName: 'Marine_Charter_Contract',
      documentType: 'NDA_CONTRACT',
      signerName: 'Fisherman',
      feeAmount: 25,
      stepDelayMs: 5
    });

    expect(session.status).toBe('COMPLETED_AND_BOOKED');
    expect(session.executionMode).toBe('PARALLEL_MULTI_AGENT_SWARM');
    expect(session.pdf.documentName).toBe('Marine_Charter_Contract.pdf');
    expect(session.funds.chargedUsd).toBe(25);
    expect(session.funds.remainingBalanceUsd).toBe(15);
    expect(session.booking.status).toBe('BOOKED');
    expect(session.booking.selectedSlot.priority).toBe('SOONEST_IMMEDIATE');
    expect(getNotarizationSessions().length).toBe(1);
  });

  it('renders interactive live multi-agent notarization HUD card in the DOM', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const { card, executionPromise } = renderNotarizationSwarmCard({
      mountContainer: host,
      initialParams: {
        documentName: 'UI_Render_Deed.pdf',
        documentType: 'PROPERTY_DEED',
        signerName: 'Architect'
      },
      autoExecute: true,
      stepDelayMs: 5
    });

    expect(card).toBeTruthy();
    const session = await executionPromise;
    expect(session.sealCertificateId).toContain('AC-SEAL-');
    expect(card.querySelector('.pdf-doc-name').textContent).toBe('UI_Render_Deed.pdf');
    expect(card.querySelector('.browser-booking-code').textContent).toBe(session.booking.bookingConfirmationCode);
  });
});
