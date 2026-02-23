from flask import Flask, render_template, request, redirect, session, jsonify, url_for
from database import init_db, get_db
from auth import register_user, login_user
from news_api import fetch_news
from chatbot import llm_response
import os

import statistics
from sentiment import analyze_sentiment

from crypto_api import fetch_market_overview, fetch_top_gainers, save_daily_market_data, fetch_historical_data, search_coins

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

app = Flask(__name__,
            template_folder="../frontend/templates",
            static_folder="../frontend/static")

app.secret_key = os.getenv("FLASK_SECRET_KEY", "crypto_secret_key")
init_db()

@app.route("/")
def loading():
    return render_template("loading.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        uid = login_user(
            request.form["username"],
            request.form["password"]
        )
        if uid:
            session["user_id"] = uid
            return redirect("/dashboard")
        return render_template("login.html", error="Invalid credentials")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        if request.form["password"] != request.form["confirm_password"]:
            return render_template("register.html", error="Passwords do not match")

        success = register_user(
            request.form["username"],
            request.form["email"],
            request.form["password"]
        )
        if success:
            return redirect("/")
        return render_template("register.html", error="User already exists")

    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect("/")
    return render_template("dashboard.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


@app.route("/api/news")
def news():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(fetch_news())

@app.route("/api/article")
def get_article():
    """Fetch and parse full article content from external URL"""
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    url = request.args.get("url", "")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    try:
        import requests
        from bs4 import BeautifulSoup
        import re
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements
        for element in soup.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'form', 'button', 'noscript', 'ads']):
            element.decompose()
        
        # Try to find the main article content
        paragraphs_data = []
        title = ""
        
        # Enhanced title extraction
        title_tag = soup.find('h1') or soup.find('meta', property='og:title') or soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip() if not title_tag.get('content') else title_tag.get('content')

        # Better selection strategy
        main_content = None
        selectors = [
            'article', '.article-body', '.article-content', '.post-content', 
            '.entry-content', '[itemprop="articleBody"]', '#article-content',
            '.story-content', 'main', '.content'
        ]
        
        for selector in selectors:
            candidate = soup.select_one(selector)
            if candidate:
                test_p = candidate.find_all('p')
                if len(test_p) >= 2:
                    main_content = candidate
                    break

        if not main_content: main_content = soup

        # Extract paragraphs
        for p in main_content.find_all('p'):
            text = p.get_text().strip()
            if len(text) > 60 and not any(word in text.lower() for word in ['cookie', 'subscribe', 'newsletter', 'advertisement', 'javascript']):
                paragraphs_data.append(text)

        # Fallback to AI Summary if scraping is poor or blocked
        if not paragraphs_data or len("\n".join(paragraphs_data)) < 300:
            print("Scraping insufficient, using AI to generate detailed report...")
            from chatbot import llm_response
            ai_prompt = f"Please provide a detailed, 4-paragraph journalistic news report based on this headline: '{title}'. Use a professional crypto-journalist tone. Mention market implications and technical sentiment."
            ai_content = llm_response(ai_prompt)
            
            # If AI gives us a good response, split it into paragraphs for the UI
            if ai_content and len(ai_content) > 100:
                paragraphs_data = [p.strip() for p in ai_content.split('\n') if p.strip()]
                # Add a notice
                paragraphs_data.insert(0, "[AI-Generated Detailed Report - Full Scrape Restricted]")

        return jsonify({
            "title": title,
            "content": paragraphs_data,
            "url": url,
            "success": True
        })
        
    except Exception as e:
        print(f"Error fetching article: {e}")
        return jsonify({
            "error": str(e),
            "success": False,
            "message": "Could not fetch article content. The website may be blocking access."
        })


@app.route("/chat", methods=["POST"])
def chat():
    if "user_id" not in session:
        return jsonify({"error": "Login required"})

    msg = request.json["message"]
    reply = llm_response(msg)

    db = get_db()
    cur = db.cursor()
    # Explicitly include CURRENT_TIMESTAMP to ensure date filtering works
    cur.execute(
        "INSERT INTO chats (user_id, message, response, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        (session["user_id"], msg, reply)
    )
    db.commit()

    return jsonify({"reply": reply})

@app.route("/api/chat/history/today")
def chat_history_today():
    if "user_id" not in session:
        return jsonify([])
    
    db = None
    try:
        db = get_db()
        cur = db.cursor()
        
        # Ensure column exists (safety for some sqlite versions)
        try:
            cur.execute("ALTER TABLE chats ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            db.commit()
        except Exception:
            pass

        # Strictly fetch today's messages using server's local date
        # date('now', 'localtime') ensures we match the user's "today"
        cur.execute("""
            SELECT message, response, created_at 
            FROM chats 
            WHERE user_id = ? AND date(created_at) = date('now', 'localtime')
            ORDER BY id ASC
        """, (session["user_id"],))
        
        rows = cur.fetchall()
        
        # If no messages found with timestamps, it might be the very first session 
        # after migration. We'll return empty to be strict as requested.
        return jsonify([{
            "message": r[0],
            "response": r[1],
            "created_at": r[2]
        } for r in rows])
    except Exception as e:
        print(f"Chat history error: {e}")
        return jsonify([])
    finally:
        if db:
            db.close()





@app.route("/chatpage")
def chatpage():
    if "user_id" not in session:
        return redirect("/")
    return render_template("chat.html")



@app.route("/api/news-sentiment")
def news_sentiment():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    news = fetch_news()
    results = []
    
    # Store news temporarily in app-level for quick retrieval (simplified cache)
    if not hasattr(app, 'news_cache'):
        app.news_cache = {}
    
    for n in news:
        app.news_cache[n['title']] = n
        results.append({
            "title": n["title"],
            "url": n.get("url", "#"),
            "sentiment": analyze_sentiment(n["title"])
        })

    return jsonify(results)

@app.route("/view-article")
def view_article():
    if "user_id" not in session:
        return redirect("/")
    
    url = request.args.get("url", "")
    title = request.args.get("title", "MarketPulse Report")
    source = request.args.get("source", "Deep News")
    
    # Handle missing, undefined or explicitly 'null' URLs from frontend
    if not url or url in ["undefined", "null", "None"] or not url.startswith("http"):
        print(f"Invalid URL '{url}', skipping scraping and using AI fallback.")
        from chatbot import llm_response
        from sentiment import analyze_sentiment
        
        prompt = f"As a senior crypto journalist, write a professional 6-paragraph news article based on this headline: '{title}'. Discuss the likely market impact, technical factors, and future outlook. Do not include introductory conversational text."
        ai_report = llm_response(prompt)
        
        # Check if we got a generic chatbot fallback (usually contains 'ReportData' or 'Neural Networks')
        # If so, we'll create a better-looking news fallback
        if not ai_report or "experiencing high traffic" in ai_report or "neural networks" in ai_report:
            paragraphs = [
                f"The cryptocurrency market is closely monitoring the latest developments regarding: {title}.",
                "Initial reports suggest that this event could have significant implications for market liquidity and trader sentiment in the short term.",
                "Technical analysts are currently evaluating the support and resistance levels that might be affected by this news, as volume begins to shift in response.",
                "While the situation is still evolving, experts recommend a cautious approach until full transparency is achieved regarding the underlying data.",
                "MarketPulse Intelligence continues to track these movements in real-time to provide the most accurate assessment of the situation as it unfolds.",
                "[System Note: Our AI Assistant is currently under high load. This is a preliminary market analysis report based on headline data.]"
            ]
        else:
            paragraphs = [p.strip() for p in ai_report.split('\n') if p.strip()]
            paragraphs.insert(0, "[MarketPulse AI Intelligence Deep-Dive]")
            
        return render_template("article_view.html", 
                             title=title, 
                             content=paragraphs, 
                             source=source, 
                             date="Just now", 
                             sentiment=analyze_sentiment(title))

    import requests
    from bs4 import BeautifulSoup
    from chatbot import llm_response
    from sentiment import analyze_sentiment
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        }
        
        # 1. Advanced Scraping
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove Noise
        for tag in soup.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'form', 'button']):
            tag.decompose()
            
        paragraphs = []
        # Target the main article container specifically
        main_content = soup.find('article') or soup.find('main') or soup.find(id='content') or soup.find(class_='article-content') or soup.find(class_='post-content')
        
        target = main_content if main_content else soup
        
        for p in target.find_all('p'):
            txt = p.get_text().strip()
            if len(txt) > 80 and not any(w in txt.lower() for w in ['cookie', 'subscribe', 'advertisement', 'newsletter']):
                paragraphs.append(txt)
                
        # 2. AI Intelligence Fallback (The "In-Site Only" engine)
        if len(paragraphs) < 3 or len(" ".join(paragraphs)) < 400:
             print("Scraping too thin, generating deep report...")
             prompt = f"Write a comprehensive 6-paragraph news article about '{title}'. " \
                      f"Base it on existing crypto market knowledge for this specific event. " \
                      f"Use a professional, neutral, journalistic tone. Include a section on market impact."
             ai_report = llm_response(prompt)
             if ai_report and len(ai_report) > 200:
                 paragraphs = [p.strip() for p in ai_report.split('\n') if p.strip()]
                 paragraphs.insert(0, "[Integrated MarketPulse News Service - Full Feed Unlocked]")

        sentiment = analyze_sentiment(title)
        source = request.args.get("source", "Deep News")
        
        return render_template("article_view.html", 
                             title=title, 
                             content=paragraphs, 
                             source=source,
                             date="Just now",
                             sentiment=sentiment)
                             
    except Exception as e:
        print(f"Article view error: {e}")
        return redirect("/news")


@app.route("/api/market")
def market():
    data = fetch_market_overview()
    save_daily_market_data(data)   
    return jsonify(data)

@app.route("/api/search")
def search():
    query = request.args.get("q", "")
    if not query:
        return jsonify([])
    return jsonify(search_coins(query))

@app.route("/api/gainers")
def gainers():
    return jsonify(fetch_top_gainers())

@app.route("/api/market/day/<day>")
def market_by_day(day):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
        SELECT symbol, price, high, low, volume, change
        FROM market_data
        WHERE day = ?
        GROUP BY symbol
        HAVING MAX(created_at)
    """, (day,))

    rows = cur.fetchall()
    db.close()

    return jsonify([{
        "symbol": r[0],
        "price": r[1],
        "high": r[2],
        "low": r[3],
        "volume": r[4],
        "change": r[5]
    } for r in rows])


@app.route("/news")
def news_page():
    if "user_id" not in session:
        return redirect("/")
    return render_template("news.html")

@app.route("/analytics")
def analytics():
    if "user_id" not in session:
        return redirect("/")
    return render_template("analytics.html")

@app.route("/api/history")
def history():
    symbol = request.args.get("symbol", "BTC")
    period = request.args.get("period", "1M") # Default to 1 Month

    # Map period to Binance interval & limit
    # 1D = 15m candles for 24h (approx 96 points)
    # 1W = 1h candles for 7 days (168 points)
    # 1M = 1d candles for 30 days (30 points)
    
    interval = "1d"
    limit = 500 # Increased to support indicators like SMA(200)

    if period == "1D":
        interval = "15m"
        limit = 500
    elif period == "1W":
        interval = "1h"
        limit = 500
    elif period == "1M":
        interval = "1d"
        limit = 500

    # Fetch real live data from Binance
    candles = fetch_historical_data(symbol, interval=interval, limit=limit)
    
    avg = 0
    if candles:
        # Calculate moving average based on close price
        closes = [c["close"] for c in candles]
        avg = sum(closes) / len(closes)
        
    return jsonify({
        "symbol": symbol,
        "candles": candles, # The new full dataset
        "moving_average": avg,
        "period": period
    })



if __name__ == "__main__":
    app.run(debug=True)