"""Turn dist/index.html into a body-only page for claude.ai Artifact publishing
(the host adds its own doctype/head/body skeleton).
Usage: python3 scripts/to-artifact.py dist/index.html out.html"""
import re, sys
html = open(sys.argv[1], encoding='utf-8').read()
# only touch the document wrapper, never the inlined JS/CSS
start = html.index('<head>')
head_end = html.index('<script')  # wrapper tags all come before the first inlined script
wrapper = html[:head_end]
wrapper = re.sub(r'<!doctype html>|<html[^>]*>|<head>|<meta charset="UTF-8" />|<meta name="viewport"[^>]*>|<link rel="icon"[^>]*>', '', wrapper, flags=re.I)
rest = html[head_end:]
rest = rest[: rest.rindex('</html>')]
rest = rest.replace('</head>', '', 1)
rest = re.sub(r'<body>\s*', '', rest, count=1)
rest = rest[: rest.rindex('</body>')]
open(sys.argv[2], 'w', encoding='utf-8').write(wrapper.strip() + '\n' + rest.strip() + '\n')
