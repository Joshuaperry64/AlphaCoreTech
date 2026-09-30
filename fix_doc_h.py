with open('src/pages/transfer.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const el = document.h(tag);', 'const el = document.createElement(tag);')

with open('src/pages/transfer.js', 'w', encoding='utf-8') as f:
    f.write(content)
