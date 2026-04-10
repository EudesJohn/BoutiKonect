from PIL import Image
import os

source_path = r'C:\Users\Eudes Johnson\.gemini\antigravity\brain\9d67e9a0-a5b8-4d15-aaa4-cc512442fe8f\pwa_icon_new_1773991000096.png'
public_dir = r'c:\BoutiKonect\frontend\public'

targets = {
    'manifest-icon-192.maskable.png': (192, 192),
    'manifest-icon-512.maskable.png': (512, 512),
    'apple-icon-180.png': (180, 180)
}

try:
    with Image.open(source_path) as img:
        # Convert to RGB if needed (though PNG should be fine)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGBA')
        
        for name, size in targets.items():
            resized = img.resize(size, Image.Resampling.LANCZOS)
            target_path = os.path.join(public_dir, name)
            resized.save(target_path, 'PNG')
            print(f"Saved {target_path} ({size[0]}x{size[1]})")
            
except Exception as e:
    print(f"Error: {e}")
