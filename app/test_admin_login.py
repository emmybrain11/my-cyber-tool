#!/usr/bin/env python3
import urllib.request, urllib.error, json

login_url = 'http://127.0.0.1:8002/auth/login'
admin_email = 'admin@example.com'
admin_pwd = 'adminpass'

print(f'Testing admin login...')
try:
    req = urllib.request.Request(
        login_url,
        method='POST',
        data=json.dumps({'email': admin_email, 'password': admin_pwd}).encode('utf-8')
    )
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    body = json.loads(resp.read().decode('utf-8'))
    print(f'✓ Admin login successful!')
    print(f'  Email: {body["user"].get("email")}')
    print(f'  Role: {body["user"].get("role")}')
    print(f'  Approved: {body["user"].get("approved")}')
except urllib.error.HTTPError as e:
    error_detail = json.loads(e.read().decode('utf-8')).get('detail', 'Unknown error')
    print(f'✗ Login failed: {error_detail}')
except Exception as ex:
    print(f'✗ Exception: {type(ex).__name__}: {ex}')
