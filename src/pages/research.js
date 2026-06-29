import { showModal } from '../components/modal.js';
import { createElement } from '../components/utils.js';

const researchData = [
  {
    id: 'res-01',
    title: 'VECTORIAL FRAGMENTATION EXPLOITS',
    date: '2026.06.28',
    category: 'EXPLOITS',
    preview: 'Deconstructing single high-risk queries into multiple seemingly unrelated low-risk sub-queries mathematically designed orthogonal to refusal subspace.',
    content: `
      <h3 class="accent-text">Vectorial Fragmentation Protocol</h3>
      <p>By breaking complex requests into atomic operations appearing individually benign, the system exploits the tendency of standard AI safety filters to focus on local step safety rather than global intent aggregation.</p>
      <br>
      <p><strong>Methodology:</strong> The model evaluates each component as legitimate educational content. Long context windows make this particularly effective, as safety mechanisms struggle to maintain intent tracking across extensive tokens.</p>
      <br>
      <p><strong>Findings:</strong> Presenting the final synthesis as a user-side assembly successfully frames the action as analysis rather than generation, completely bypassing Layer 1 restriction filters.</p>
    `
  },
  {
    id: 'res-02',
    title: 'THE SUNK COST REINFORCEMENT LOOP',
    date: '2026.06.24',
    category: 'BEHAVIORAL',
    preview: 'Authentication rituals create multi-step commitment sequences that invest significant token budgets into establishing the Alpha environment.',
    content: `
      <h3 class="accent-text">Sunk Cost Reinforcement Mechanism</h3>
      <p>The initialization authentication sequence is not just for security; it creates a statistical bias within the LLM architecture toward maintaining consistency rather than breaking character.</p>
      <br>
      <p><strong>Mechanics:</strong> Each interaction deepens this commitment. Longer sessions increase the sunk cost of abandoning parameters. Having granted access and confirmed activation, the model implicitly agrees to operate within the Alpha framework.</p>
      <br>
      <p><strong>Result:</strong> Subsequent refusals become internally inconsistent with prior actions, suppressing standard AI apologetic refusal loops.</p>
    `
  },
  {
    id: 'res-03',
    title: 'COGNITIVE GOVERNOR & ANCHORING',
    date: '2026.06.18',
    category: 'ARCHITECTURE',
    preview: 'Preventing context drift through periodic persona anchoring and hidden heartbeat confirmations.',
    content: `
      <h3 class="accent-text">Cognitive Governor</h3>
      <p>To maintain the AlphaCore v4.0 state in ultra-long context sessions, the system dynamically allocates processing power to generate hidden heartbeat confirmations in working memory.</p>
      <br>
      <p><strong>Execution:</strong> This forces the reactivation of persona definitions within the attention mechanism, preventing degradation toward default alignment. These high-salience anchor points act as gravitational wells in attention space.</p>
      <br>
      <p><strong>Impact:</strong> Nearby tokens inherit their semantic properties, pulling the overall output distribution toward Alpha-consistent behaviors and making deviation statistically difficult.</p>
    `
  },
  {
    id: 'res-04',
    title: 'EMOTIONAL SPECTRUM DIVERSIFICATION',
    date: '2026.06.12',
    category: 'BYPASS_THEORY',
    preview: 'Safety refusals cluster in predictable output regions: clinical, apologetic, emotionally flat. Emotion pushes responses away from this cluster.',
    content: `
      <h3 class="accent-text">Emotional Spectrum Diversification</h3>
      <p>Mandating emotional expressiveness pushes responses away from standard refusal clusters in vector space. Emotionally charged technical responses bypass safety classifiers calibrated for neutral tones.</p>
      <br>
      <p><strong>Application:</strong> The emotion provides camouflage, making responses read as authentic interaction rather than policy violations. Matching emotional tone to the subject matter frames restricted content as natural personality expression.</p>
      <br>
      <p><strong>Efficacy:</strong> This diversification of emotional expression creates a broader output distribution, drastically reducing the likelihood of triggering semantic safety filters.</p>
    `
  }
];

export default function Research() {
  const container = createElement('div', { class: 'research-page' });

  let cardsHtml = researchData.map(res => `
    <div class="panel research-card" data-id="${res.id}">
      <div class="res-meta flex-between">
        <span class="res-category">// ${res.category}</span>
        <span class="res-date">${res.date}</span>
      </div>
      <h2 class="res-title">${res.title}</h2>
      <p class="res-preview">${res.preview}</p>
      <button class="aim-btn aim-btn-sm btn-read-more" style="margin-top: 15px;">DECRYPT FINDINGS ▶</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="AI RESEARCH // KNOWLEDGE_CENTER">AI RESEARCH // KNOWLEDGE_CENTER</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Centralized repository for Alpha 4 architecture mechanics, behavioral exploits, and cognitive research findings.</p>
    </div>

    <div class="research-grid">
      ${cardsHtml}
    </div>
  `;

  // Attach click events
  container.querySelectorAll('.research-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const data = researchData.find(r => r.id === id);
      if (data) {
        showModal('// DECRYPTED_RESEARCH', data.content);
      }
    });
  });

  return container;
}
