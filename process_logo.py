from PIL import Image
import os

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If the pixel is very bright (white or near-white), make it transparent
        # 200 is a safe threshold for near-white
        if item[0] > 200 and item[1] > 200 and item[2] > 200:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"✅ Successfully created transparent logo at {output_path}")

# Source path from the web public folder
source = "apps/web/public/images/logo.png"
target = "apps/admin/public/logo-transparent.png"

if os.path.exists(source):
    make_transparent(source, target)
else:
    print(f"❌ Could not find source image at {source}")
