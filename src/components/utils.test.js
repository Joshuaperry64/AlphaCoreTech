import { describe, it, expect } from 'vitest';
import { escapeHTML, createElement } from './utils';

describe('escapeHTML', () => {
  it('returns empty string for falsy values', () => {
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
    expect(escapeHTML(0)).toBe('');
    expect(escapeHTML(false)).toBe('');
  });

  it('handles normal strings without modification', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
    expect(escapeHTML('1234567890')).toBe('1234567890');
    expect(escapeHTML('abc xyz')).toBe('abc xyz');
  });

  it('escapes special characters', () => {
    expect(escapeHTML('&')).toBe('&amp;');
    expect(escapeHTML('<')).toBe('&lt;');
    expect(escapeHTML('>')).toBe('&gt;');
    expect(escapeHTML('"')).toBe('&quot;');
    expect(escapeHTML("'")).toBe('&#39;');
  });

  it('escapes multiple occurrences of special characters', () => {
    expect(escapeHTML('&&<<>>""\'\'')).toBe('&amp;&amp;&lt;&lt;&gt;&gt;&quot;&quot;&#39;&#39;');
    expect(escapeHTML('<script>alert("XSS & SQLi \'test\'")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS &amp; SQLi &#39;test&#39;&quot;)&lt;/script&gt;');
  });

  it("escapes mixed special characters", () => {
    // using backticks to avoid escaping single quote within a single-quoted string
    expect(escapeHTML(`<a href="?a=1&b='2'">Link</a>`)).toBe(
      '&lt;a href=&quot;?a=1&amp;b=&#39;2&#39;&quot;&gt;Link&lt;/a&gt;'
    );
  });

  it('casts truthy non-string values to string and escapes if necessary', () => {
    expect(escapeHTML(123)).toBe('123');
    expect(escapeHTML(true)).toBe('true');
    expect(escapeHTML({ toString: () => '<obj>' })).toBe('&lt;obj&gt;');
  });

  it('handles numbers as strings if they are truthy', () => {
    expect(escapeHTML(42)).toBe('42');
  });
});

describe('createElement', () => {
  it('creates an element with just a tag', () => {
    const el = createElement('div');
    expect(el.tagName).toBe('DIV');
    expect(el.attributes.length).toBe(0);
    expect(el.childNodes.length).toBe(0);
  });

  it('creates an element with attributes', () => {
    const el = createElement('span', { id: 'test-id', class: 'test-class', 'data-custom': 'value' });
    expect(el.tagName).toBe('SPAN');
    expect(el.id).toBe('test-id');
    expect(el.className).toBe('test-class');
    expect(el.getAttribute('data-custom')).toBe('value');
  });

  it('creates an element with string children', () => {
    const el = createElement('p', {}, 'Hello ', 'World');
    expect(el.tagName).toBe('P');
    expect(el.childNodes.length).toBe(2);
    expect(el.textContent).toBe('Hello World');
    expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(el.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
  });

  it('creates an element with child elements', () => {
    const child1 = createElement('span', {}, 'Child 1');
    const child2 = createElement('strong', {}, 'Child 2');
    const el = createElement('div', {}, child1, child2);

    expect(el.tagName).toBe('DIV');
    expect(el.childNodes.length).toBe(2);
    expect(el.children[0]).toBe(child1);
    expect(el.children[1]).toBe(child2);
    expect(el.innerHTML).toBe('<span>Child 1</span><strong>Child 2</strong>');
  });

  it('handles mixed string and element children', () => {
    const span = createElement('span', {}, 'world');
    const el = createElement('div', {}, 'Hello ', span, '!');

    expect(el.tagName).toBe('DIV');
    expect(el.childNodes.length).toBe(3);
    expect(el.innerHTML).toBe('Hello <span>world</span>!');
  });

  it('ignores null, undefined and false children but includes empty strings', () => {
    const el = createElement('div', {}, 'Hello', null, undefined, false, '', 'World');
    // 'Hello' -> added
    // null -> ignored
    // undefined -> ignored
    // false -> ignored
    // '' -> added (since typeof '' === 'string')
    // 'World' -> added
    expect(el.childNodes.length).toBe(3);
    expect(el.textContent).toBe('HelloWorld');
  });
});
