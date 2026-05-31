#!/usr/bin/env python3
import urllib.request, urllib.error, json, time

# Register a new user with a known password
reg_url = 'http://127.0.0.1:8002/auth/register'
new_email = f'testuser{int(time.time())}@example.com'
test_pwd = 'TestPassword123!'

print(f"Attempting to register: {new_email}")
try:
    req = urllib.request.Request(
        reg_url, 
        method='POST', 
        data=json.dumps({'email': new_email, 'password': test_pwd, 'name': 'Test User'}).encode('utf-8')
    )
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    body = json.loads(resp.read().decode('utf-8'))
    print(f"✓ Registration successful")
    
    # Try to login immediately with the same credentials
    print(f"\nAttempting to login with: {new_email}")
    login_url = 'http://127.0.0.1:8002/auth/login'
    req2 = urllib.request.Request(
        login_url, 
        method='POST', 
        data=json.dumps({'email': new_email, 'password': test_pwd}).encode('utf-8')
    )
    req2.add_header('Content-Type', 'application/json')
    resp2 = urllib.request.urlopen(req2, timeout=10)
    body2 = json.loads(resp2.read().decode('utf-8'))
    print(f"✓ Login successful")
    print(f"  - success: {body2.get('success')}")
    print(f"  - approved: {body2['user'].get('approved')}")
    
except urllib.error.HTTPError as e:
    error_detail = json.loads(e.read().decode('utf-8')).get('detail', 'Unknown error')
    print(f"✗ HTTP Error: {error_detail}")
except Exception as ex:
    print(f"✗ Exception: {type(ex).__name__}: {ex}")
