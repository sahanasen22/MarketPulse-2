from news_api import fetch_news
print("Starting fetch...")
news = fetch_news()
print(f"Fetched {len(news)} items.")
print("First item:", news[0] if news else "None")
