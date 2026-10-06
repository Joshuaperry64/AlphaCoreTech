import { describe, it, expect, beforeEach } from 'vitest';
import { buildOmniGen } from './aimodals.js';

describe('OmniGen Clickable Reference Insertion', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders reference toolbar and individual slot card insert buttons', () => {
    const omniPanel = buildOmniGen();
    document.body.appendChild(omniPanel);

    const toolbar = omniPanel.querySelector('#omni-ref-toolbar');
    expect(toolbar).toBeTruthy();

    const tbBtn0 = omniPanel.querySelector('#omni-insert-toolbar-0');
    const tbBtn1 = omniPanel.querySelector('#omni-insert-toolbar-1');
    const tbBtn2 = omniPanel.querySelector('#omni-insert-toolbar-2');
    expect(tbBtn0).toBeTruthy();
    expect(tbBtn1).toBeTruthy();
    expect(tbBtn2).toBeTruthy();

    const cardBtn0 = omniPanel.querySelector('#omni-card-insert-0');
    const cardBtn1 = omniPanel.querySelector('#omni-card-insert-1');
    const cardBtn2 = omniPanel.querySelector('#omni-card-insert-2');
    expect(cardBtn0).toBeTruthy();
    expect(cardBtn1).toBeTruthy();
    expect(cardBtn2).toBeTruthy();
  });

  it('inserts reference tokens at cursor for multi-image prompts like "take the background from Image 1 and put it on Image 2"', () => {
    const omniPanel = buildOmniGen();
    document.body.appendChild(omniPanel);

    const promptInput = omniPanel.querySelector('#omni-prompt');
    const tbBtn0 = omniPanel.querySelector('#omni-insert-toolbar-0');
    const tbBtn1 = omniPanel.querySelector('#omni-insert-toolbar-1');

    // User types initial text
    promptInput.value = 'take the background from ';
    promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));

    // User clicks Image 1 reference button
    tbBtn0.click();

    expect(promptInput.value).toBe('take the background from <img><|image_1|></img>');
    expect(promptInput.selectionStart).toBe('take the background from <img><|image_1|></img>'.length);

    // User continues typing
    const intermediate = promptInput.value + ' and put it on ';
    promptInput.value = intermediate;
    promptInput.setSelectionRange(intermediate.length, intermediate.length);
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));

    // User clicks Image 2 reference button
    tbBtn1.click();

    expect(promptInput.value).toBe(
      'take the background from <img><|image_1|></img> and put it on <img><|image_2|></img>'
    );
    expect(promptInput.selectionStart).toBe(promptInput.value.length);
  });

  it('supports mid-text insertion at arbitrary cursor selection index', () => {
    const omniPanel = buildOmniGen();
    document.body.appendChild(omniPanel);

    const promptInput = omniPanel.querySelector('#omni-prompt');
    const tbBtn2 = omniPanel.querySelector('#omni-insert-toolbar-2');

    promptInput.value = 'Replace sky in with a cyberpunk cityscape';
    // Position cursor right after 'Replace sky in ' (length 15)
    promptInput.setSelectionRange(15, 15);
    promptInput.dispatchEvent(new Event('click', { bubbles: true }));

    tbBtn2.click();

    expect(promptInput.value).toBe(
      'Replace sky in <img><|image_3|></img>with a cyberpunk cityscape'
    );
    expect(promptInput.selectionStart).toBe(15 + '<img><|image_3|></img>'.length);
  });

  it('slot card insert buttons also insert tags at current cursor', () => {
    const omniPanel = buildOmniGen();
    document.body.appendChild(omniPanel);

    const promptInput = omniPanel.querySelector('#omni-prompt');
    const cardBtn0 = omniPanel.querySelector('#omni-card-insert-0');

    promptInput.value = 'Outfit from ';
    promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);

    cardBtn0.click();

    expect(promptInput.value).toBe('Outfit from <img><|image_1|></img>');
  });
});
