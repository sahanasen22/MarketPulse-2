import requests
from datetime import datetime
from database import get_db

BINANCE_24H = "https://api.binance.com/api/v3/ticker/24hr"
BINANCE_KLINES = "https://api.binance.com/api/v3/klines"

SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"]

def fetch_historical_data(symbol, interval="1d", limit=30):
    # Binance requires full symbol e.g., BTCUSDT
    if not symbol.endswith("USDT"):
        symbol += "USDT"
        
    try:
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": limit
        }
        res = requests.get(BINANCE_KLINES, params=params)
        data = res.json()
        
        # Binance kline range: [open_time, open, high, low, close, volume, ...]
        # Map to TradingView format: { time: seconds, open: float, high: float, low: float, close: float }
        candles = []
        for x in data:
            candles.append({
                "time": int(x[0] / 1000), # Unix timestamp in seconds
                "open": float(x[1]),
                "high": float(x[2]),
                "low": float(x[3]),
                "close": float(x[4]),
                "volume": float(x[5])
            })
            
        return candles
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return []

def fetch_market_overview():
    data = requests.get(BINANCE_24H).json()
    today = datetime.now().strftime("%A")

    db = get_db()
    cur = db.cursor()
    result = []

    # include all USDT pairs
    for c in data:
        if c["symbol"].endswith("USDT"): 
            row = {
                "symbol": c["symbol"].replace("USDT", ""),
                "price": float(c["lastPrice"]),
                "high": float(c["highPrice"]),
                "low": float(c["lowPrice"]),
                "volume": float(c["volume"]),
                "change": float(c["priceChangePercent"])
            }

            # optional: store in DB
            cur.execute("""
                INSERT INTO market_data
                (symbol, price, high, low, volume, change, day)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                row["symbol"], row["price"], row["high"], 
                row["low"], row["volume"], row["change"], today
            ))

            result.append(row)

    db.commit()
    db.close()

    # return top 50 by volume or any metric
    result.sort(key=lambda x: x["volume"], reverse=True)
    return result[:50]  # top 50 coins for dashboard list

def search_coins(query):
    query = query.upper()
    data = requests.get(BINANCE_24H).json()
    matches = []
    
    for c in data:
        if c["symbol"].endswith("USDT"):
            s = c["symbol"].replace("USDT", "")
            if query in s:
                matches.append({
                    "symbol": s,
                    "price": float(c["lastPrice"]),
                    "change": float(c["priceChangePercent"]),
                    "volume": float(c["volume"])
                })
    
    # Sort by exact match first, then volume
    matches.sort(key=lambda x: (x["symbol"] != query, -x["volume"]))
    return matches[:10]



def fetch_top_gainers():
    data = requests.get(BINANCE_24H).json()

    coins = [{
        "symbol": c["symbol"].replace("USDT", ""),
        "change": float(c["priceChangePercent"])
    } for c in data if c["symbol"].endswith("USDT")]

    return coins

from database import get_db
from datetime import datetime

def save_daily_market_data(data):
    day = datetime.now().strftime("%a")  # Mon, Tue, Wed

    db = get_db()
    cur = db.cursor()

    for c in data:
        # CHECK if already saved today
        cur.execute("""
            SELECT 1 FROM market_data
            WHERE symbol = ? AND day = ?
        """, (c["symbol"], day))

        if cur.fetchone():
            continue  # already stored for today

        cur.execute("""
            INSERT INTO market_data
            (symbol, price, high, low, volume, change, day)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            c["symbol"],
            c["price"],
            c["high"],
            c["low"],
            c["volume"],
            c["change"],
            day
        ))

    db.commit()
    db.close()

