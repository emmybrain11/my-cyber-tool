#!/usr/bin/env python3
import urllib.request, urllib.error, json, time

# Step 1: Login as admin to get session cookie
login_url = 'http://127.0.0.1:8002/auth/login'
admin_email = 'admin@example.com'
admin_pwd = 'adminpass'

print("Step 1: Admin login")
try:
    req = urllib.request.Request(
        login_url,
        method='POST',
        data=json.dumps({'email': admin_email, 'password': admin_pwd}).encode('utf-8')
    )
    req.add_header('Content-Type', 'application/json')
    resp = urllib.request.urlopen(req, timeout=10)
    
    # Extract session cookie from Set-Cookie header
    cookie_header = resp.headers.get('Set-Cookie', '')
    print(f"✓ Admin login successful")
    print(f"  Cookie: {cookie_header[:50]}...")
    
    # Step 2: Register a new unapproved user
    print("\nStep 2: Register new test user")
    reg_url = 'http://127.0.0.1:8002/auth/register'
    new_email = f'approvaltest{int(time.time())}@example.com'
    test_pwd = 'TestPass123!'
    
    req2 = urllib.request.Request(
        reg_url,
        method='POST',
        data=json.dumps({'email': new_email, 'password': test_pwd, 'name': 'Approval Test'}).encode('utf-8')
    )
    req2.add_header('Content-Type', 'application/json')
    resp2 = urllib.request.urlopen(req2, timeout=10)
    print(f"✓ User registered: {new_email}")
    
    # Step 3: Approve the user via trpc endpoint using correct format
    print("\nStep 3: Approve user via admin endpoint")
    trpc_url = 'http://127.0.0.1:8002/api/trpc'
    
    trpc_payload = {
        "id": 1,
        "params": {
            "path": "admin.approveUser",
            "input": [{"email": new_email}]
        }
    }
    
    req3 = urllib.request.Request(
        trpc_url,
        method='POST',
        data=json.dumps(trpc_payload).encode('utf-8')
    )
    req3.add_header('Content-Type', 'application/json')
    req3.add_header('Cookie', cookie_header.split(';')[0])  # Add session cookie
    resp3 = urllib.request.urlopen(req3, timeout=10)
    body3 = json.loads(resp3.read().decode('utf-8'))
    print(f"✓ Approval response: {body3}")
    
    # Step 4: Login as the newly approved user
    print("\nStep 4: Login as approved user")
    req4 = urllib.request.Request(
        login_url,
        method='POST',
        data=json.dumps({'email': new_email, 'password': test_pwd}).encode('utf-8')
    )
    req4.add_header('Content-Type', 'application/json')
    resp4 = urllib.request.urlopen(req4, timeout=10)
    body4 = json.loads(resp4.read().decode('utf-8'))
    print(f"✓ Login successful after approval!")
    print(f"  Email: {body4['user'].get('email')}")
    print(f"  Approved: {body4['user'].get('approved')}")
    print(f"\n✅ Full auth flow completed successfully!")
    
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    try:
        error_detail = json.loads(error_body).get('detail', 'Unknown error')
    except:
        error_detail = error_body
    print(f"✗ HTTP Error {e.code}: {error_detail}")
except Exception as ex:
    import traceback
    print(f"✗ Exception: {type(ex).__name__}: {ex}")
    traceback.print_exc()
