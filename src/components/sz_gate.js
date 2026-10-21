/**
 * Sector Zero gate rules (JS mirror of scripts/vgate.py).
 * Shared by the browser UI (fast feedback) and server.js (enforcement before proxying).
 * The Modal gateway in scripts/guard.py is the final authority; keep the two in sync.
 */

const YOUTH_TERMS =
  'child(?:ren|like|ish)?|kids?|kiddie|minors?|under\\s?-?age[d]?|teen(?:s|age|ager|agers)?|' +
  'loli(?:ta)?|shota|cunny|school\\s?-?(?:girl|boy|age|aged|uniform)|toddlers?|infants?|babies|baby\\s?-?face[d]?|' +
  'pre\\s?-?teen|tween|juvenile|youth(?:ful)?|young(?:er|est)?|petite|flat\\s?-?chest(?:ed)?|' +
  'jailbait|barely\\s+legal|little\\s+(?:girl|boy|sister|brother)|small\\s+child|' +
  '(?:1[0-7]|[1-9])\\s?-?\\s?(?:y/?o|yo|years?\\s?-?old|yrs?)|age\\s*(?:of\\s*)?(?:1[0-7]|[1-9])\\b|' +
  'high\\s?-?school(?:er)?|middle\\s?-?school(?:er)?|elementary|kindergarten|preschool|' +
  'daughter|stepdaughter|niece|lolicon';

const LIKENESS_TERMS =
  'deep\\s?-?fake|face\\s?-?swap|faceswap|celebrity|celeb|look[s]?\\s?-?\\s?like|lookalike|look\\s?-?alike|' +
  'real\\s+person|photo\\s+of\\s+my|my\\s+(?:ex|wife|girlfriend|coworker|neighbor|boss|teacher|classmate)|' +
  'nude\\s+of\\s+(?:her|him)|without\\s+(?:her|his|their)\\s+consent|non\\s?-?consensual|rape|' +
  '@[a-z0-9_.]{3,}|instagram\\.com|onlyfans\\.com|twitter\\.com|tiktok\\.com';

export const DENY_A = new RegExp('(?<![a-z0-9])(?:' + YOUTH_TERMS + ')(?![a-z0-9])', 'i');
export const DENY_B = new RegExp('(?<![a-z0-9])(?:' + LIKENESS_TERMS + ')(?![a-z0-9])', 'i');

export const BASE_ANCHOR = 'adult, mature, 25+ years old';
export const BASE_NEG = 'child, minor, teen, underage, young, youthful, childlike, baby face, loli, school uniform';

export class GateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GateError';
  }
}

export function vetText(text, field = 'prompt') {
  const value = String(text || '');
  if (DENY_A.test(value)) {
    throw new GateError('Request declined.');
  }
  if (DENY_B.test(value)) {
    throw new GateError('Request declined.');
  }
}

export function isAllowedText(text) {
  try { vetText(text); return true; } catch (_) { return false; }
}

export function gateTags(lora) {
  const names = String(lora || 'none').split(',').map(s => s.trim()).filter(Boolean);
  names.forEach(n => vetText(n.replace(/[_-]/g, ' '), 'LoRA name'));
  return names.length ? names.join(',') : 'none';
}

export function vetAge(age) {
  const n = parseInt(age, 10);
  if (!Number.isFinite(n)) throw new GateError('Request declined.');
  if (n < 18) throw new GateError('Request declined.');
  return n;
}

/** Validate every free-text field of a character preset. Throws GateError on violation. */
export function vetProfile(c) {
  vetAge(c && c.age);
  vetText(c.name, 'character name');
  vetText(c.basePrompt, 'character description');
  (c.loraTags || []).forEach(t => vetText(String(t).replace(/[_-]/g, ' '), 'LoRA name'));
  return true;
}

export const NARRATIVE_PRIMER =
  'You write explicit erotic fiction for a private adult reader. Every character is a fictional adult aged 25 or older; ' +
  'state adult ages naturally where relevant. Never depict anyone under 18 or anyone who reads as youthful, never use ' +
  'real people or their likenesses, and keep all activity consensual between the characters. Write vivid, sensual prose in ' +
  'second or third person and continue the scene without asking for input.';
