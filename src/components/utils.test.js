import { describe, it, expect } from 'vitest';
import { escapeHTML } from './utils.js';

describe('escapeHTML', () => {
  it('returns an empty string for falsy values', () => {
    expect(escapeHTML(undefined)).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(0)).toBe('');
    expect(escapeHTML(false)).toBe('');
  });

  it('returns the same string if no special characters are present', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
    expect(escapeHTML('12345')).toBe('12345');
    expect(escapeHTML('no-special-chars')).toBe('no-special-chars');
  });

  it('escapes & characters', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
    expect(escapeHTML('&&')).toBe('&amp;&amp;');
  });

  it('escapes < and > characters', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it("escapes double and single quote characters", () => {
    expect(escapeHTML('"double quotes"')).toBe('&quot;double quotes&quot;');
    expect(escapeHTML("'single quotes'")).toBe('&#39;single quotes&#39;');
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
});
