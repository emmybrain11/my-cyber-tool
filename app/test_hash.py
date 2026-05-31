#!/usr/bin/env python3
from passlib.hash import sha256_crypt
import json

# Load users from JSON
with open("python-service/users.json") as f:
    users = json.load(f)

# Find the bemm7753@gmail.com user
user = next((u for u in users if u["email"] == "bemm7753@gmail.com"), None)
if not user:
    print("User not found")
else:
    hash_str = user["passwordHash"]
    print(f"User: {user['email']}")
    print(f"Hash: {hash_str}")
    print(f"Hash type marker: {hash_str[:2]}")
    
    # Try to verify with various test passwords
    test_passwords = [
        "password123",
        "Test@1234", 
        "testpass",
        "emmanuel123",
        "bello",
        "123456"
    ]
    
    print("\nTesting passwords:")
    for pwd in test_passwords:
        try:
            result = sha256_crypt.verify(pwd, hash_str)
            print(f"  {pwd}: {result}")
        except Exception as e:
            print(f"  {pwd}: ERROR - {e}")
