import requests
import json

API_KEY = "f833355d415afb4d8f92b1e6efaf89272d78c890"
url = f"https://cryptopanic.com/api/developer/v2/posts/?auth_token={API_KEY}&public=true"

print(f"DEBUG: Fetching from {url}")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers, timeout=15)
    print(f"DEBUG: Status Code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"DEBUG: Error Response: {response.text}")
    else:
        try:
            data = response.json()
            results = data.get("results", [])
            print(f"DEBUG: Results Found: {len(results)}")
            if results:
                print(f"DEBUG: First Title: {results[0].get('title')}")
            else:
                print("DEBUG: JSON parsed but 'results' is empty.")
                print(f"DEBUG: Full JSON keys: {data.keys()}")
        except json.JSONDecodeError:
            print("DEBUG: Failed to parse JSON. Response text preview:")
            print(response.text[:500])

except Exception as e:
    print(f"DEBUG: Exception occurred: {e}")
