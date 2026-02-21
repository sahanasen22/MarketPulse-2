import requests
url = "https://cryptopanic.com/api/developer/v2/posts/?auth_token=f833355d415afb4d8f92b1e6efaf89272d78c890"
try:
    res = requests.get(url, timeout=10).json()
    if 'results' in res and len(res['results']) > 0:
        print("Keys:", list(res['results'][0].keys()))
        print("Item:", res['results'][0])
    else:
        print("No results or error:", res)
except Exception as e:
    print("Error:", e)
