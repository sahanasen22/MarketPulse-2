import requests

API_KEY = "f833355d415afb4d8f92b1e6efaf89272d78c890"
url = f"https://cryptopanic.com/api/developer/v2/posts/?auth_token={API_KEY}&public=true"

print(f"Testing URL: {url}")

try:
    # Add a user agent just in case
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    
    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"Successfully fetched {len(results)} items")
        if results:
            print("First item title:", results[0].get("title"))
    else:
        print(f"Error Content: {response.text}")

except Exception as e:
    print(f"Exception: {e}")
