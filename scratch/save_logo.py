from PIL import Image

logo_path = r'C:\Users\saiki\.gemini\antigravity\brain\c1bdfa67-4712-4394-95f1-47961ff72807\.user_uploaded\media_1794556452491_e8555e9f.png'
im = Image.open(logo_path).convert('RGBA')

# Make white background transparent
datas = list(im.getdata())
new_data = []
for item in datas:
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)
im.putdata(new_data)
im.save('cms-techsonance/public/branding/tenant-logo.png')
print("Saved tenant-logo.png")

