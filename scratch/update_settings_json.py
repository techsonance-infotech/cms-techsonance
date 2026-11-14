import json

settings_path = 'cms-techsonance/src/app/api/workspace-settings/settings.json'
with open(settings_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

tenant_id = '4bb9f8db-2854-4d2f-884e-50a3cb9cf6e7'
if tenant_id not in data:
    data[tenant_id] = {}

t = data[tenant_id]
t['stampUrl'] = '/branding/tenant-stamp.png'
t['digitalSignatureUrl'] = '/branding/tenant-signature.png'
t['digitalSignatureEnabled'] = True
t['signatoryName'] = 'Sajeshkumar Adeya'
t['signatoryTitle'] = 'Co-Founder & CTO · Authorized Signatory'
t['tagline'] = 'Where Innovation Finds Its Resonance'
if not t.get('logoUrl'):
    t['logoUrl'] = '/branding/tenant-logo.png'

with open(settings_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("Updated settings.json with stamp, signature, and signatory details!")

