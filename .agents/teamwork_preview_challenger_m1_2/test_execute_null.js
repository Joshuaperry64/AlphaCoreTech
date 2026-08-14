import { REGISTERED_PORTS } from '../../src/ports/index.js';

console.log('=== TESTING execute(null) AND execute() ACROSS ALL 57 PORTS ===\n');

let failures = [];
let passes = 0;

for (const port of REGISTERED_PORTS) {
  try {
    // Test 1: execute()
    await port.execute();
  } catch (err) {
    failures.push({ portId: port.id, call: 'execute()', error: err.message });
  }

  try {
    // Test 2: execute(null)
    await port.execute(null);
    passes++;
  } catch (err) {
    failures.push({ portId: port.id, call: 'execute(null)', error: err.message });
  }

  try {
    // Test 3: execute(undefined)
    await port.execute(undefined);
  } catch (err) {
    failures.push({ portId: port.id, call: 'execute(undefined)', error: err.message });
  }

  try {
    // Test 4: render(null)
    const res = port.render(null);
    if (!res || typeof res.destroy !== 'function') {
      failures.push({ portId: port.id, call: 'render(null)', error: 'Returned object missing destroy function' });
    }
  } catch (err) {
    failures.push({ portId: port.id, call: 'render(null)', error: err.message });
  }

  try {
    // Test 5: destroy() double call
    port.destroy();
    port.destroy();
  } catch (err) {
    failures.push({ portId: port.id, call: 'destroy()', error: err.message });
  }
}

console.log(`Summary: Passed tests for ${passes}/${REGISTERED_PORTS.length} ports.`);
if (failures.length > 0) {
  console.log(`\nFAILURES (${failures.length}):`);
  failures.forEach(f => console.log(` - Port [${f.portId}] ${f.call}: ${f.error}`));
} else {
  console.log('\nALL EDGE CASE TESTS PASSED CLEANLY!');
}
