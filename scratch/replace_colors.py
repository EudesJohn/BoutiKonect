import os
import re

target_dir = 'c:/BoutiKonect/frontend/src'
old_color = '#8fa3bf'
new_color = 'var(--text-light)'

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace case-insensitive hex
    new_content = re.sub(re.escape(old_color), new_color, content, flags=re.IGNORECASE)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.css') or file.endswith('.jsx'):
            replace_in_file(os.path.join(root, file))
