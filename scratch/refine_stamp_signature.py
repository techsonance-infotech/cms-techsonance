from PIL import Image

src_path = r'C:\Users\saiki\.gemini\antigravity\brain\c1bdfa67-4712-4394-95f1-47961ff72807\.user_uploaded\media_1794556472907_a2a4f88a.png'
im = Image.open(src_path).convert('RGBA')

# Convert white background to transparent for seamless rendering
def make_transparent(crop_img):
    crop_img = crop_img.convert('RGBA')
    datas = crop_img.getdata()
    new_data = []
    for item in datas:
        # If nearly white (background):
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    crop_img.putdata(new_data)
    return crop_img

# Stamp:
stamp = im.crop((225, 30, 340, 150))
stamp = make_transparent(stamp)
stamp.save('cms-techsonance/public/branding/tenant-stamp.png')

# Signature:
sig = im.crop((315, 25, 510, 155))
sig = make_transparent(sig)
sig.save('cms-techsonance/public/branding/tenant-signature.png')

print("Generated clean transparent tenant-stamp.png and tenant-signature.png")

