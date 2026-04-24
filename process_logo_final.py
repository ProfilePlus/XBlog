from PIL import Image
import os

def process_file(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        return
    
    img = Image.open(file_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If the pixel is very bright (RGB all > 240), make it 100% transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    # Overwrite the original file with the transparent version
    img.save(file_path, "PNG")
    print(f"✅ Processed {file_path} into a transparent PNG.")

paths = [
    "apps/web/public/images/logo.png",
    "apps/web/public/images/logo-transparent.png",
    "apps/admin/public/logo.png",
    "apps/admin/public/logo-transparent.png"
]

for p in paths:
    process_file(p)
