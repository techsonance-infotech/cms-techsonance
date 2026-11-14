with open('cms-techsonance/.env', 'r', encoding='utf-8') as f:
    env = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

import urllib.request
import json

url = env.get('NEXT_PUBLIC_SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')
if url and key:
    req = urllib.request.Request(f'{url}/rest/v1/clients?select=*', headers={
        'apikey': key,
        'Authorization': f'Bearer {key}',
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f'Total clients: {len(data)}')
            for d in data:
                print(json.dumps(d, indent=2))
    except Exception as e:
        print('Error:', e)

