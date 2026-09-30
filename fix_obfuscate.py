import re

with open('src/ports/alphaobfuscate/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
export function processCoreLogic(inputData) {
  const cleanInput = (inputData || '').trim();
  if (!cleanInput) {
    return {
      success: true,
      output: '[AlphaObfuscate] Ready. Enter text to obfuscate using multi-layer encryption algorithms.',
      records: ['STATUS: ONLINE', 'AVAILABLE_LAYERS: BASE64, HEX, ROT13, LEET']
    };
  }

  // Obfuscation Layers
  const b64 = btoa(unescape(encodeURIComponent(cleanInput)));
  const hex = cleanInput.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  const rot13 = cleanInput.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
  const leet = cleanInput.replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5').replace(/t/gi, '7');

  return {
    success: true,
    output: '[AlphaObfuscate] Payload successfully wrapped in multiple obfuscation layers.',
    records: [
      '[BASE64_LAYER]: ' + b64,
      '[HEX_LAYER]: ' + hex,
      '[ROT13_LAYER]: ' + rot13,
      '[LEET_LAYER]: ' + leet
    ]
  };
}
'''

content = re.sub(r'export function processCoreLogic.*?return \{.*?records: processed.*?\}\n\}', new_logic, content, flags=re.DOTALL)

with open('src/ports/alphaobfuscate/index.js', 'w', encoding='utf-8') as f:
    f.write(content)
