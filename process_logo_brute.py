from PIL import Image
import os

def brute_force_transparent(file_path):
    if not os.path.exists(file_path): return
    
    img = Image.open(file_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If the pixel is anything other than very dark gray/black, make it transparent
        # We only keep pixels where R, G, B are all < 100 (dark lines)
        if item[0] < 100 and item[1] < 100 and item[2] < 100:
            # Keep the dark pixel, but ensure it's fully opaque
            newData.append((item[0], item[1], item[2], 255))
        else:
            # Everything else becomes 100% transparent
            newData.append((255, 255, 255, 0))

    img.putdata(newData)
    img.save(file_path, "PNG")
    print(f"🔥 Brute-force processed {file_path}")

paths = [
    "apps/web/public/images/logo.png",
    "apps/web/public/images/logo-transparent.png",
    "apps/admin/public/logo.png",
    "apps/admin/public/logo-transparent.png"
]

for p in paths:
    brute_force_transparent(p)
