/**
 * scripts/audit_subroutines_coverage.js
 * Programmatic Audit Script for AlphaCoreTech Subroutines Coverage & Contract Compliance.
 *
 * Objectives:
 * 1. Traverses C:\Users\josh6\workspace to find all 57 Python project directories.
 * 2. Cross-references directory names against registered components in src/ports/ and src/pages/subroutines.js.
 * 3. Asserts 100% catalog coverage (57/57 projects accounted for as interactive ports or styled Cyberpunk placeholders).
 * 4. Validates that validatePortContract returns valid: true for 100% of registered ports (57/57).
 * 5. Verifies Subroutines UI integration via JSDOM.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const workspacePath = 'C:\\Users\\josh6\\workspace';

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [✓] PASS: ${message}`);
  } else {
    console.error(`  [✕] FAIL: ${message}`);
    throw new Error(`Audit Assertion Failed: ${message}`);
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('    ALPHACORE TECH - SUBROUTINES COVERAGE & CONTRACT AUDIT      ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Step 1: Workspace Traversal & Cataloging
  // --------------------------------------------------------------------------
  console.log('[STEP 1] Traversing workspace directory:', workspacePath);
  assert(fs.existsSync(workspacePath), `Workspace directory exists at ${workspacePath}`);

  const dirEntries = fs.readdirSync(workspacePath, { withFileTypes: true });
  const workspaceProjectDirs = dirEntries
    .filter(entry => entry.isDirectory() && entry.name !== 'AlphaCoreTech')
    .map(entry => entry.name);

  console.log(`  Found ${workspaceProjectDirs.length} project directories in workspace (excluding AlphaCoreTech).`);
  assert(
    workspaceProjectDirs.length === 57,
    `Workspace contains exactly 57 project directories (found ${workspaceProjectDirs.length})`
  );

  // --------------------------------------------------------------------------
  // Step 2: Load Port Registry & Validate Contracts
  // --------------------------------------------------------------------------
  console.log('\n[STEP 2] Loading Port Registry (src/ports/index.js) & Contract Validator...');
  const portsRegistry = await import('../src/ports/index.js');
  const portContract = await import('../src/ports/port-contract.js');

  const registeredPorts = portsRegistry.getAllPorts();
  console.log(`  Loaded ${registeredPorts.length} registered ports from central registry.`);

  assert(
    Array.isArray(registeredPorts) && registeredPorts.length === 57,
    `Port registry contains exactly 57 registered ports (found ${registeredPorts.length})`
  );

  console.log('\n[STEP 3] Validating 100% Contract Compliance (validatePortContract)...');
  let validContractCount = 0;
  for (const port of registeredPorts) {
    const result = portContract.validatePortContract(port);
    assert(
      result.valid === true,
      `Port "${port.name || port.id}" (id: ${port.id}) satisfies PortComponentContract`
    );
    if (result.valid) validContractCount++;
  }

  assert(
    validContractCount === 57,
    `100% of registered ports (57/57) passed contract validation`
  );

  // --------------------------------------------------------------------------
  // Step 3: Cross-Reference Workspace Directories Against Registered Ports
  // --------------------------------------------------------------------------
  console.log('\n[STEP 4] Cross-Referencing 57 Workspace Directories against Registered Ports...');
  
  const matchedProjects = [];
  const unmatchedProjects = [];
  let interactiveCount = 0;
  let placeholderCount = 0;

  const fallbackList = [];

  for (const projectDirName of workspaceProjectDirs) {
    // Search for matching port by name, short ID, or clean name
    const normalizedDir = projectDirName.replace(/\s+/g, '').toLowerCase();
    
    const matchedPort = registeredPorts.find(port => {
      const cleanId = (port.id || '').replace(/^port-/, '').toLowerCase();
      const cleanName = (port.name || '').replace(/\s+/g, '').toLowerCase();
      return (
        cleanId === normalizedDir ||
        cleanName === normalizedDir ||
        port.name === projectDirName
      );
    });

    if (matchedPort) {
      const isPlaceholder = 
        (matchedPort.description || '').includes('Requires Serverless Backend') || 
        (matchedPort.version || '').includes('stub');

      if (isPlaceholder) {
        placeholderCount++;
        fallbackList.push({
          name: matchedPort.name,
          dirName: projectDirName,
          category: matchedPort.category,
          reason: 'Requires Serverless Backend / Heavy Native Dependency'
        });
      } else {
        interactiveCount++;
      }

      matchedProjects.push({
        dir: projectDirName,
        portId: matchedPort.id,
        portName: matchedPort.name,
        type: isPlaceholder ? 'Cyberpunk Fallback Placeholder' : 'Interactive Web Port'
      });
      console.log(`  [✓] MATCH: ${projectDirName.padEnd(22)} -> ${matchedPort.name} (${matchedPort.id}) [${isPlaceholder ? 'PLACEHOLDER' : 'INTERACTIVE'}]`);
    } else {
      unmatchedProjects.push(projectDirName);
      console.error(`  [✕] UNMATCHED: ${projectDirName}`);
    }
  }

  assert(
    unmatchedProjects.length === 0,
    `100% workspace project coverage: 0 unmatched projects (all 57 projects cataloged)`
  );
  assert(
    matchedProjects.length === 57,
    `All 57 workspace project directories successfully mapped to registered web ports`
  );

  console.log(`\n  Coverage Breakdown:`);
  console.log(`    - Total Projects Ingested:    ${matchedProjects.length} / 57 (100%)`);
  console.log(`    - Interactive Web Ports:      ${interactiveCount}`);
  console.log(`    - Cyberpunk Fallback Stubs:   ${placeholderCount}`);

  assert(
    interactiveCount === 22,
    `Exactly 22 projects configured as Interactive Web Ports (found ${interactiveCount})`
  );
  assert(
    placeholderCount === 35,
    `Exactly 35 projects configured as Cyberpunk Fallback Placeholders (found ${placeholderCount})`
  );

  // --------------------------------------------------------------------------
  // Step 4: Verify Subroutines Page Integration via JSDOM
  // --------------------------------------------------------------------------
  console.log('\n[STEP 5] Verifying Subroutines Page UI Integration (src/pages/subroutines.js)...');
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.HTMLElement = dom.window.HTMLElement;

  const subroutinesModule = await import('../src/pages/subroutines.js');
  const SubroutinesPage = subroutinesModule.default;

  const pageContainer = SubroutinesPage();
  document.body.appendChild(pageContainer);

  const sectionBCards = pageContainer.querySelectorAll('#ported-projects-list > div.cyber-port-card');
  assert(
    sectionBCards.length === 57,
    `Subroutines Page Section B renders all 57 ported project cards (found ${sectionBCards.length})`
  );

  const countBadge = pageContainer.querySelector('#ported-count-badge');
  assert(
    countBadge !== null && countBadge.textContent.includes('57 PORTS'),
    'Port count badge displays "57 / 57 PORTS"'
  );

  // Clean JSDOM
  document.body.removeChild(pageContainer);

  // --------------------------------------------------------------------------
  // Step 5: Summary Output & Fallback Log
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('              CYBERPUNK FALLBACK PLACEHOLDERS LOG               ');
  console.log('================================================================');
  fallbackList.forEach((item, index) => {
    console.log(`  ${(index + 1).toString().padStart(2)}. ${item.name.padEnd(20)} [${item.category.padEnd(22)}] - ${item.reason}`);
  });
  console.log('----------------------------------------------------------------');

  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED (100% COVERAGE)`);
  console.log('================================================================\n');
}

runAudit().catch(err => {
  console.error('\n[AUDIT FATAL ERROR]:', err);
  process.exit(1);
});
