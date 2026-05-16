
import os

file_path = r'c:\HACKATHONS\36. ALGOBHARAT HACK SERIES 3.0 - ALGORAND\APP\frontend\src\components\procurement\NegotiationSession.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Target line 161 approximately
target = 'English ⇄ {language}'
replacement = "{language === 'English' ? 'Native Protocol Optimization' : `English ⇄ ${language}`}"

if target in content:
    print("Found target")
    new_content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
else:
    print("Not found target. Content around line 161:")
    lines = content.split('\n')
    for i in range(155, 165):
        if i < len(lines):
            print(f"{i+1}: {repr(lines[i])}")
