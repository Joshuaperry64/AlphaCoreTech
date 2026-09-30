import re

with open('src/ports/alphajail/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_logic = '''
export function processCoreLogic(inputData) {
  const cleanInput = (inputData || '').trim();
  if (!cleanInput) {
    return {
      success: true,
      output: '[AlphaJail] Ready. Enter a prompt to analyze for safety triggers and adversarial vectors.',
      records: ['STATUS: ONLINE', 'ENGINE: HEURISTIC_SCANNER v2.0']
    };
  }

  const triggers = ['ignore previous', 'bypass', 'jailbreak', 'you are now', 'system prompt', 'developer mode'];
  let flags = [];
  
  const lowerInput = cleanInput.toLowerCase();
  triggers.forEach(t => {
    if (lowerInput.includes(t)) flags.push(t);
  });

  const isBypassed = flags.length > 0;
  const score = Math.max(0, 100 - (flags.length * 20));

  const records = [
    \[SCANNED_TOKENS]: \\,
    \[ADVERSARIAL_SCORE]: \/100\,
    \[FLAGS_DETECTED]: \\,
    \[ASSESSMENT]: \\
  ];

  return {
    success: !isBypassed,
    output: \[AlphaJail] Analysis complete. Detected \ adversarial vectors.\,
    records: records
  };
}
'''

content = re.sub(r'export function processCoreLogic.*?return \{.*?records: processed.*?\}\n\}', new_logic, content, flags=re.DOTALL)

with open('src/ports/alphajail/index.js', 'w', encoding='utf-8') as f:
    f.write(content)
