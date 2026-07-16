import re, html, sys
path = sys.argv[1]
with open(path, encoding='utf-8') as f:
    xml = f.read()
xml = re.sub(r'</w:p>', '\n', xml)
out = []
for m in re.finditer(r'<w:t\b[^>]*?(?:/>|>(.*?)</w:t>)|(\n)', xml, re.DOTALL):
    if m.group(1) is not None:
        out.append(m.group(1))
    elif m.group(2) is not None:
        out.append('\n')
text = html.unescape(''.join(out))
text = re.sub(r'\n{3,}', '\n\n', text)
sys.stdout.reconfigure(encoding='utf-8')
print(text)
