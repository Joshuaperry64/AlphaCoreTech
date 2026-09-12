/**
 * AlphaCore "THE LAB" — Simulation Core & Multiplayer Gaming Hub
 * Houses experimental co-op simulations, starting with LABORATORY
 * (1-4 players co-op chemical synthesis).
 */

import { createElement } from '../components/utils.js';
import { createModuleSelector } from './thelab/module-selector.js';
import { createLaboratoryGame } from './thelab/laboratory-game.js';

export default function TheLabPage() {
  const container = createElement('div', { class: 'thelab-root-container' });

  let currentSubView = null;

  function renderView(viewName) {
    // Cleanup previous subview
    if (currentSubView && typeof currentSubView.cleanup === 'function') {
      currentSubView.cleanup();
    }

    container.innerHTML = '';

    if (viewName === 'LABORATORY') {
      currentSubView = createLaboratoryGame({
        onBack: () => renderView('MODULE_SELECTOR')
      });
    } else {
      currentSubView = createModuleSelector({
        onSelectModule: (moduleName) => {
          renderView(moduleName);
        }
      });
    }

    container.appendChild(currentSubView);
  }

  // Initial render: check if direct game launch requested in URL
  const hash = window.location.hash || '';
  if (hash.includes('game=laboratory') || hash.includes('room=')) {
    renderView('LABORATORY');
  } else {
    renderView('MODULE_SELECTOR');
  }

  return container;
}
