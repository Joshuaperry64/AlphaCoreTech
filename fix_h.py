import re

with open('src/pages/transfer.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove import of createElement
content = re.sub(r"import { createElement } from '../components/utils\.js';\n", "", content)

# Add our custom h function at the top
h_func = '''
function h(tag, props = {}) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') el.className = v;
    else if (k === 'textContent') el.textContent = v;
    else if (k === 'innerHTML') el.innerHTML = v;
    else if (k === 'type') el.type = v;
    else if (k === 'placeholder') el.placeholder = v;
    else if (k === 'id') el.id = v;
    else el.setAttribute(k, v);
  }
  return el;
}
'''
content = h_func + content

# Replace createElement with h
content = content.replace('createElement(', 'h(')

with open('src/pages/transfer.js', 'w', encoding='utf-8') as f:
    f.write(content)
