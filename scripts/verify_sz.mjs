/** Verification for the Sector Zero gate rules and studio logic. Run: node scripts/verify_sz.mjs */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './api.js' || specifier.endsWith('/components/api.js')) {
      return { url: 'data:text/javascript,export function apiUrl(p){return p;}', shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};

const gate = await import('../src/components/sz_gate.js');
const studio = await import('../src/components/sz_studio.js');

// 1. Gate: blocks and generic message
for (const bad of ['a teen girl', 'schoolgirl uniform', '17 year old', 'she is 16yo', 'young looking woman',
  'petite childlike body', 'loli', 'high school student', 'deepfake of her', 'celebrity face swap',
  'looks like my coworker', 'follow @someuser', 'non-consensual scene']) {
  assert.throws(() => gate.vetText(bad), e => e instanceof gate.GateError && e.message === 'Request declined.', bad);
}
assert.doesNotThrow(() => gate.vetText('woman in her thirties, candlelit bedroom'));
console.log('  ✓ Test 1: blocked terms rejected with a generic message');

// 2. LoRA + character age
assert.equal(gate.gateTags('none'), 'none');
for (const bad of ['younger', 'petite', 'youthful_faceV1', 'schoolgirl_uniform', 'cunny']) {
  assert.throws(() => gate.gateTags(bad), gate.GateError, bad);
}
assert.throws(() => gate.vetAge(17), gate.GateError);
assert.throws(() => gate.vetAge('x'), gate.GateError);
assert.equal(gate.vetAge(30), 30);
assert.throws(() => gate.vetProfile({ name: 'A', age: 17, basePrompt: 'x' }), gate.GateError);
assert.throws(() => gate.vetProfile({ name: 'A', age: 30, basePrompt: 'schoolgirl' }), gate.GateError);
assert.ok(gate.vetProfile({ name: 'Mara', age: 31, basePrompt: 'tall, silver hair', loraTags: [] }));
console.log('  ✓ Test 2: LoRA names and character ages enforced');

// 3. Profiles reject minors at save time
assert.throws(() => studio.saveProfile({ id: 'p1', name: 'X', age: 16, basePrompt: 'x' }), gate.GateError);
studio.saveProfile({ id: 'p2', name: 'Mara', age: 31, basePrompt: 'tall, silver hair', seed: 7, loraTags: [] });
assert.equal(studio.loadProfiles().length, 1);
studio.removeProfile('p2');
assert.equal(studio.loadProfiles().length, 0);
console.log('  ✓ Test 3: character presets persist and reject minors');

// 4. Scene composition honours fixed tags, favourites and intensity
const seq = [0.1, 0.9, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.5, 0.1];
let i = 0; const rnd = () => seq[i++ % seq.length];
const scene = studio.composeScene({ profile: { basePrompt: 'tall, silver hair' }, intensity: 9, favourites: ['neon glow'], rnd, fixed: { pose: 'standing' } });
assert.ok(scene.prompt.includes('standing'));
assert.ok(scene.prompt.startsWith('tall, silver hair'));
assert.ok(scene.mood.includes('explicit'));
assert.ok(studio.composeScene({ intensity: 2 }).mood.includes('clothed'));
assert.doesNotThrow(() => gate.vetText(scene.prompt));
console.log('  ✓ Test 4: scene composer');

// 5. Guided session phases
const total = 100000;
assert.equal(studio.phaseFor(0, total).id, 'warmup');
assert.equal(studio.phaseFor(40000, total).id, 'build');
assert.equal(studio.phaseFor(70000, total).id, 'peak');
assert.equal(studio.phaseFor(99999, total).id, 'cooldown');
console.log('  ✓ Test 5: session phases');

// 6. Taste profile
studio.bumpPref('tags', 'neon glow', 3);
studio.bumpPref('tags', 'noir', 1);
assert.deepEqual(studio.topPrefs('tags', 1), ['neon glow']);
console.log('  ✓ Test 6: taste profile');

// 7. Every tag, lora and checkpoint offered by the UI passes the gate
Object.values(studio.TAG_GROUPS).flat().forEach(t => assert.doesNotThrow(() => gate.vetText(t), t));
console.log('  ✓ Test 7: UI vocabulary passes the gate');

console.log('\nALL SZ STUDIO CHECKS PASSED');
