import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { validatePortContract } from '../../src/ports/port-contract.js';

const catalogPath = 'C:\\Users\\josh6\\workspace\\AlphaCoreTech\\catalog_analysis.json';
const portsDir = 'C:\\Users\\josh6\\workspace\\AlphaCoreTech\\src\\ports';

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log('=== AUDITING ALL 57 PORTS ===');
console.log(`Catalog total projects: ${catalog.projects.length}`);

let passed = 0;
let failed = 0;
const errorsList = [];

for (const proj of catalog.projects) {
  const dirName = proj.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const portFile = path.join(portsDir, dirName, 'index.js');

  if (!fs.existsSync(portFile)) {
    console.error(`❌ Missing port file for ${proj.name}: ${portFile}`);
    failed++;
    errorsList.push(`Missing port file for ${proj.name}`);
    continue;
  }

  try {
    const fileUrl = pathToFileURL(portFile).href;
    const mod = await import(fileUrl);
    const portObj = mod.default || mod;

    const validation = validatePortContract(portObj);
    if (!validation.valid) {
      console.error(`❌ Contract validation failed for ${proj.name}:`, validation.errors);
      failed++;
      errorsList.push(`Contract validation failed for ${proj.name}: ${validation.errors.join(', ')}`);
      continue;
    }

    if (!portObj.id || !portObj.id.startsWith('port-')) {
      console.error(`❌ Invalid port id format for ${proj.name}: ${portObj.id}`);
      failed++;
      errorsList.push(`Invalid port id for ${proj.name}`);
      continue;
    }

    passed++;
  } catch (err) {
    console.error(`❌ Error importing ${proj.name}:`, err);
    failed++;
    errorsList.push(`Error importing ${proj.name}: ${err.message}`);
  }
}

console.log(`\nAudit Summary: ${passed}/${catalog.projects.length} ports PASSED contract validation.`);
if (failed > 0) {
  console.error(`FAILED: ${failed} errors detected.`);
  process.exit(1);
} else {
  console.log('SUCCESS: All 57 ports fully validated and ready!');
}
