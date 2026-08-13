/**
 * AlphaRequirements UI Component.
 * Interactive dual-pane requirements scanner, deduplicator & modernization analyzer.
 */

import { scanRequirementsText } from './requirements-core.js';

export const SAMPLE_PRESETS = {
  standard: `flask>=3.0.0
requests==2.31.0
numpy>=1.24.0
requests==2.31.0 # Duplicate requirement line
pillow>=10.0.0
pytest>=8.0.0`,
  legacy: `pkg-resources==0.0.0
setuptools<70.0.0
requests==2.28.0 # legacy pin
-r base.txt
pkg_resources>=0.1`,
  modern: `fastapi>=0.110.0
pydantic>=2.6.0
httpx>=0.27.0
uvicorn>=0.28.0
structlog>=24.1.0`
};

/**
 * Renders the AlphaRequirements interactive UI into the specified container.
 * 
 * @param {HTMLElement} container 
 * @param {Object} [options] 
 * @returns {{ destroy: Function, scan: Function }}
 */
export function renderRequirementsUI(container, options = {}) {
  if (!container) return { destroy: () => {}, scan: () => {} };

  const initialText = options.initialText || SAMPLE_PRESETS.standard;

  container.innerHTML = `
    <div class="alpharequirements-ui" style="font-family: system-ui, -apple-system, sans-serif; color: #2d3748; background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
        <div>
          <h2 style="margin: 0; font-size: 1.5rem; color: #1a202c; display: flex; align-items: center; gap: 8px;">
            <span>📦 AlphaRequirements</span>
            <span style="font-size: 0.8rem; background: #edf2f7; color: #4a5568; padding: 2px 8px; border-radius: 12px; font-weight: normal;">Requirements Scanner</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.875rem; color: #718096;">Python requirements.txt Parser, Deduplicator & Modernization Detector</p>
        </div>
        <!-- Sample Presets -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 0.85rem; font-weight: 600; color: #4a5568;">Sample Presets:</span>
          <button id="ar-preset-standard" style="background: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">Standard</button>
          <button id="ar-preset-legacy" style="background: #fffaf0; color: #dd6b20; border: 1px solid #feebc8; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">Legacy</button>
          <button id="ar-preset-modern" style="background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">Modern</button>
          <button id="ar-clear-btn" style="background: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; margin-left: 8px;">Clear</button>
        </div>
      </div>

      <!-- Metrics Cards Bar -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
        <div style="background: white; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase;">Total Lines</div>
          <div id="ar-metric-lines" style="font-size: 1.5rem; font-weight: bold; color: #2d3748;">0</div>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase;">Parsed Specs</div>
          <div id="ar-metric-total" style="font-size: 1.5rem; font-weight: bold; color: #3182ce;">0</div>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase;">Deduplicated Unique</div>
          <div id="ar-metric-unique" style="font-size: 1.5rem; font-weight: bold; color: #38a169;">0</div>
        </div>
        <div style="background: white; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size: 0.75rem; color: #718096; font-weight: 600; text-transform: uppercase;">Modernization Warnings</div>
          <div id="ar-metric-warnings" style="font-size: 1.5rem; font-weight: bold; color: #dd6b20;">0</div>
        </div>
      </div>

      <!-- Modernization Warning Alerts -->
      <div id="ar-warnings-container" style="margin-bottom: 20px;"></div>

      <!-- Dual Pane Layout -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Left Pane: Raw Input -->
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #2d3748;">Raw requirements.txt Input:</label>
            <span style="font-size: 0.75rem; color: #718096;">Paste or edit requirements below</span>
          </div>
          <textarea id="ar-raw-input" rows="14" style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-family: monospace; font-size: 0.9rem; background: white; resize: vertical; outline: none;">${initialText}</textarea>
        </div>

        <!-- Right Pane: Output & Export -->
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #2d3748;">Cleaned & Deduplicated Output:</label>
            <div style="display: flex; gap: 8px;">
              <button id="ar-copy-btn" style="background: #3182ce; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">📋 Copy</button>
              <button id="ar-download-btn" style="background: #2b6cb0; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; font-weight: 500;">💾 Download</button>
            </div>
          </div>
          <textarea id="ar-deduped-output" readonly rows="14" style="width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-family: monospace; font-size: 0.9rem; background: #edf2f7; resize: vertical; outline: none;"></textarea>
          <div id="ar-toast" style="font-size: 0.8rem; color: #276749; margin-top: 6px; height: 18px;"></div>
        </div>
      </div>
    </div>
  `;

  const rawInput = container.querySelector('#ar-raw-input');
  const dedupedOutput = container.querySelector('#ar-deduped-output');
  const linesMetric = container.querySelector('#ar-metric-lines');
  const totalMetric = container.querySelector('#ar-metric-total');
  const uniqueMetric = container.querySelector('#ar-metric-unique');
  const warningsMetric = container.querySelector('#ar-metric-warnings');
  const warningsContainer = container.querySelector('#ar-warnings-container');
  const toastEl = container.querySelector('#ar-toast');

  function updateAnalysis() {
    const rawText = rawInput.value;
    const sampleCodeMap = {
      'app/main.py': rawText
    };
    const results = scanRequirementsText(rawText, sampleCodeMap);

    linesMetric.textContent = String(results.lineCount);
    totalMetric.textContent = String(results.specCount);
    uniqueMetric.textContent = String(results.dedupedCount);
    warningsMetric.textContent = String(results.warningCount);

    dedupedOutput.value = results.dedupedSpecs.join('\n');

    if (results.modernizationNotes.length === 0) {
      warningsContainer.innerHTML = `
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; color: #276749; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
          <span>✅</span>
          <span><strong>No modernization warnings found.</strong> Dependencies appear up-to-date.</span>
        </div>
      `;
    } else {
      const items = results.modernizationNotes.map(note => `<li style="margin-bottom: 4px;">${note}</li>`).join('');
      warningsContainer.innerHTML = `
        <div style="background: #fffaf0; border: 1px solid #feebc8; color: #c05621; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
          <div style="font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span>
            <span>Modernization Notice (${results.warningCount}):</span>
          </div>
          <ul style="margin: 0; padding-left: 20px;">${items}</ul>
        </div>
      `;
    }
  }

  // Event Listeners
  rawInput.addEventListener('input', updateAnalysis);

  container.querySelector('#ar-preset-standard').addEventListener('click', () => {
    rawInput.value = SAMPLE_PRESETS.standard;
    updateAnalysis();
  });
  container.querySelector('#ar-preset-legacy').addEventListener('click', () => {
    rawInput.value = SAMPLE_PRESETS.legacy;
    updateAnalysis();
  });
  container.querySelector('#ar-preset-modern').addEventListener('click', () => {
    rawInput.value = SAMPLE_PRESETS.modern;
    updateAnalysis();
  });
  container.querySelector('#ar-clear-btn').addEventListener('click', () => {
    rawInput.value = '';
    updateAnalysis();
  });

  // Export handlers
  container.querySelector('#ar-copy-btn').addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(dedupedOutput.value);
      } else {
        dedupedOutput.select();
        document.execCommand('copy');
      }
      toastEl.textContent = '✓ Copied deduplicated requirements to clipboard!';
      setTimeout(() => { toastEl.textContent = ''; }, 3000);
    } catch (e) {
      toastEl.textContent = 'Failed to copy to clipboard.';
    }
  });

  container.querySelector('#ar-download-btn').addEventListener('click', () => {
    try {
      const blob = new Blob([dedupedOutput.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'requirements.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toastEl.textContent = '✓ Download started: requirements.txt';
      setTimeout(() => { toastEl.textContent = ''; }, 3000);
    } catch (e) {
      toastEl.textContent = 'Failed to download file.';
    }
  });

  // Initial update
  updateAnalysis();

  return {
    destroy: () => {
      container.innerHTML = '';
    },
    scan: () => {
      updateAnalysis();
    }
  };
}
