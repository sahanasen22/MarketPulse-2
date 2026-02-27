import requests
import os

# Try to load dotenv, but handle gracefully if not installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Manual .env loading fallback
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

API_KEY = os.getenv("CRYPTOPANIC_API_KEY")

def fetch_news(limit=50):
    url = f"https://cryptopanic.com/api/developer/v2/posts/?auth_token={API_KEY}"
    all_news = []

    # Add headers to mimic a browser/legitimate client to avoid some blocking
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    # Strategy 1: Try CryptoPanic (User's API Key)
    try:
        # Loop to handle pagination if needed, but let's stick to one page for speed first if limit is satisfied
        while url and len(all_news) < limit:
            try:
                response = requests.get(url, headers=headers, timeout=10)
            except requests.exceptions.Timeout:
                print("CryptoPanic API timed out.")
                break
            except requests.exceptions.RequestException as e:
                print(f"CryptoPanic Connection Error: {e}")
                break

            if response.status_code != 200:
                print(f"CryptoPanic API Error: {response.status_code}")
                break
            
            data = response.json()
            results = data.get("results", [])
            
            if not results:
                break
                
            # Map results to a consistent format
            for item in results:
                all_news.append({
                    "title": item.get("title"),
                    "url": item.get("url") or "",
                    "domain": item.get("domain"),
                    "source": item.get("source", {}).get("title") if isinstance(item.get("source"), dict) else item.get("domain"),
                    "published_at": item.get("published_at"),
                    "votes": item.get("votes") or {"liked": 0, "disliked": 0, "positive": 0, "negative": 0}
                })
            
            url = data.get("next")
            
            if len(all_news) >= limit:
                break
    except Exception as e:
         print(f"Error fetching from CryptoPanic: {e}")

    # Strategy 2: Fallback to CryptoCompare (Free, distinct 'Live' data) 
    # Only if Strategy 1 failed to retrieve anything
    if not all_news:
        print("Falling back to CryptoCompare API...")
        try:
            cc_url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
            cc_res = requests.get(cc_url, headers=headers, timeout=10)
            
            if cc_res.status_code == 200:
                cc_data = cc_res.json().get("Data", [])
                # Map to CryptoPanic format
                for item in cc_data:
                    current_news = {
                        "title": item.get("title"),
                        "url": item.get("url"),
                        "domain": item.get("source"),
                        "source": item.get("source_info", {}).get("name") or item.get("source"),
                        "published_at": _convert_timestamp(item.get("published_on")),
                        "votes": {"liked": 0, "disliked": 0, "positive": 0, "negative": 0} # Default since CC doesn't have same voting
                    }
                    all_news.append(current_news)
                    if len(all_news) >= limit:
                        break
        except Exception as e:
            print(f"Error fetching from CryptoCompare: {e}")

    return all_news[:limit]

from datetime import datetime
def _convert_timestamp(ts):
    try:
        if ts:
            return datetime.fromtimestamp(ts).isoformat()
    except:
        pass
    return datetime.now().isoformat()
