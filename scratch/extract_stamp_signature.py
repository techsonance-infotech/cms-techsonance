import os
from PIL import Image

src_path = r'C:\Users\saiki\.gemini\antigravity\brain\c1bdfa67-4712-4394-95f1-47961ff72807\.user_uploaded\media_1794556472907_a2a4f88a.png'
im = Image.open(src_path)
print("Source image size:", im.size)

# The image is (698, 247)
# Let's crop:
# Stamp is roughly on the left side, above the bottom text
# Signature is roughly on the right side, above the bottom text
# Let's inspect coordinates
# Bottom text starts around y=180
# Stamp is around x=200 to 320, y=30 to 150
# Signature is around x=310 to 510, y=25 to 160

os.makedirs('cms-techsonance/public/branding', exist_ok=True)

# Let's find bounding boxes of the stamp and signature:
# Stamp is circular mark on the left:
stamp_crop = im.crop((210, 30, 335, 155))
stamp_crop.save('cms-techsonance/public/branding/tenant-stamp.png')

# Signature is on the right:
sig_crop = im.crop((315, 25, 520, 160))
sig_crop.save('cms-techsonance/public/branding/tenant-signature.png')

# Full combined stamp + signature block:
combo_crop = im.crop((200, 25, 520, 160))
combo_crop.save('cms-techsonance/public/branding/tenant-stamp-signature-combined.png')

print("Saved stamp and signature to cms-techsonance/public/branding/")

