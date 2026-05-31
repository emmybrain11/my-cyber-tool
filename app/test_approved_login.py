#!/usr/bin/env python3
import urllib.request, urllib.error, json

# Test login with the approved test user
login_url = 'http://127.0.0.1:8002/auth/login'
test_email = 'testuser1780177920@example.com'
test_pwd = 'TestPassword123!'

print(f"Testing login for: {test_email}")
try:
    req = urllib.request.Request(
        login_url, 
        method='POST', 
        data=json.dumps({'email': test_email, 'password': test_pwd}).encode('utf-8')
    )
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    body = json.loads(resp.read().decode('utf-8'))
    print(f"✓ Login successful!")
    print(f"  - Email: {body['user'].get('email')}")
    print(f"  - Approved: {body['user'].get('approved')}")
    print(f"  - Role: {body['user'].get('role')}")
    
except urllib.error.HTTPError as e:
    error_detail = json.loads(e.read().decode('utf-8')).get('detail', 'Unknown error')
    print(f"✗ Login failed: {error_detail}")
except Exception as ex:
    print(f"✗ Exception: {type(ex).__name__}: {ex}")
