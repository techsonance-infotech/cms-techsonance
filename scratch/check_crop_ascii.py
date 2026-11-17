from PIL import Image

src_path = r'C:\Users\saiki\.gemini\antigravity\brain\c1bdfa67-4712-4394-95f1-47961ff72807\.user_uploaded\media_1794556472907_a2a4f88a.png'
im = Image.open(src_path).convert('RGBA')
width, height = im.size

# Let's find black/dark pixels
# Stamp center is around x=265, y=90
# Signature is from x=315 to 500, y=30 to 150

# Scan the image to find the stamp and signature components
pixels = im.load()
for y in range(0, 175, 10):
    row_chars = []
    for x in range(180, 530, 8):
        r, g, b, a = pixels[x, y]
        # if dark:
        if r < 150 and g < 150 and b < 150:
            row_chars.append('#')
        else:
            row_chars.append(' ')
    print(f'{y:3d}: ' + ''.join(row_chars))

