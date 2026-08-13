import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import alphaRequirementsPort, {
  id, name, category, version, description, pythonSourcePath, render, execute, destroy
} from './index.js';
import {
  normalizeLine,
  parseRequirementsText,
  dedupeSpecs,
  canonicalizePackageName,
  detectModernization,
  scanRequirementsText
} from './requirements-core.js';
import { validatePortContract } from '../port-contract.js';

describe('AlphaRequirements Core Parser & Modernization Engine', () => {
  it('should normalize lines correctly and strip comments', () => {
    expect(normalizeLine('  requests==2.31.0  ')).toBe('requests==2.31.0');
    expect(normalizeLine('# comment')).toBeNull();
    expect(normalizeLine('flask>=3.0 # inline comment')).toBe('flask>=3.0');
    expect(normalizeLine('numpy\t# tab comment')).toBe('numpy');
    expect(normalizeLine('   ')).toBeNull();
  });

  it('should parse requirement lines while ignoring inclusions/constraints', () => {
    const raw = `
# Header Comment
requests>=2.28.0
-r base.txt
--constraint constraints.txt
flask==3.0.0 # web server
`;
    const specs = parseRequirementsText(raw);
    expect(specs).toEqual(['requests>=2.28.0', 'flask==3.0.0']);
  });

  it('should canonicalize package names according to PEP 503', () => {
    expect(canonicalizePackageName('Pkg_Resources')).toBe('pkg-resources');
    expect(canonicalizePackageName('Setuptools.Foo')).toBe('setuptools-foo');
    expect(canonicalizePackageName('FOO--BAR..BAZ')).toBe('foo-bar-baz');
  });

  it('should deduplicate specifications preserving original order of appearance', () => {
    const input = ['requests==2.31.0', 'flask>=3.0.0', 'requests==2.31.0', 'numpy>=1.24.0', 'flask>=3.0.0'];
    const deduped = dedupeSpecs(input);
    expect(deduped).toEqual(['requests==2.31.0', 'flask>=3.0.0', 'numpy>=1.24.0']);
  });

  it('should detect modernization package and import warnings', () => {
    const specs = ['pkg-resources==0.0.0', 'setuptools<70.0.0', 'requests>=2.31.0'];
    const sourceMap = {
      'app/utils.py': 'import pkg_resources\nprint("legacy")'
    };

    const warnings = detectModernization(specs, sourceMap);
    expect(warnings.some(w => w.includes('importlib.metadata'))).toBe(true);
    expect(warnings.some(w => w.includes('Setuptools pinned below supported threshold'))).toBe(true);
    expect(warnings.some(w => w.includes('found in app/utils.py'))).toBe(true);
  });

  it('should run full scanRequirementsText pipeline', () => {
    const text = 'flask>=3.0.0\nflask>=3.0.0\npkg-resources';
    const scan = scanRequirementsText(text);

    expect(scan.specCount).toBe(3);
    expect(scan.dedupedCount).toBe(2);
    expect(scan.dedupedSpecs).toEqual(['flask>=3.0.0', 'pkg-resources']);
    expect(scan.warningCount).toBe(1);
  });
});

describe('AlphaRequirements Port Contract & Execution', () => {
  it('should satisfy PortComponentContract validation', () => {
    const result = validatePortContract(alphaRequirementsPort);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should execute headlessly and return scan summary', async () => {
    const res = await execute({
      text: 'fastapi>=0.110.0\npydantic>=2.6.0\nfastapi>=0.110.0'
    });

    expect(res.success).toBe(true);
    expect(res.output).toContain('[AlphaRequirements] Parsed 3 spec(s)');
    expect(res.details.dedupedCount).toBe(2);
  });
});

describe('AlphaRequirements DOM UI Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    destroy();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('should render dual-pane UI, metrics, and deduplicated output', () => {
    render(container);
    expect(container.querySelector('.alpharequirements-ui')).not.toBeNull();

    const rawInput = container.querySelector('#ar-raw-input');
    const dedupedOutput = container.querySelector('#ar-deduped-output');
    expect(rawInput).not.toBeNull();
    expect(dedupedOutput).not.toBeNull();

    const uniqueMetric = container.querySelector('#ar-metric-unique');
    expect(parseInt(uniqueMetric.textContent, 10)).toBeGreaterThan(0);
  });

  it('should update output when preset buttons are clicked', () => {
    render(container);
    const legacyBtn = container.querySelector('#ar-preset-legacy');
    expect(legacyBtn).not.toBeNull();

    legacyBtn.click();

    const rawInput = container.querySelector('#ar-raw-input');
    expect(rawInput.value).toContain('pkg-resources');

    const warningsMetric = container.querySelector('#ar-metric-warnings');
    expect(parseInt(warningsMetric.textContent, 10)).toBeGreaterThan(0);
  });
});
