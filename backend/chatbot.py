from crypto_api import search_coins, fetch_top_gainers
from news_api import fetch_news
import os
import requests
import json

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

# API Keys - Set these in .env file
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# OpenRouter models to try (currently working free models)
OPENROUTER_MODELS = [
    "openrouter/free", 
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
]


def get_market_context(msg):
    """
    Analyzes the message to find relevant crypto context to feed the LLM.
    """
    # 0. Check if it's just a simple greeting
    greetings = ["hi", "hello", "hey", "hii", "hola", "greetings", "wasup", "yo", "morning", "evening"]
    clean_msg = msg.lower().strip("?.! ")
    if clean_msg in greetings:
        return "" # No context needed for simple greetings, let LLM be friendly

    context_str = ""
    
    # 1. Check for specific coins in the message
    words = msg.upper().split()
    clean_words = [w.strip('?,.!').upper() for w in words]
    potential_symbols = [w for w in clean_words if len(w) >= 2 and w.isalnum()]
    
    # Common mappings
    name_map = {
        "BITCOIN": "BTC", "ETHEREUM": "ETH", "SOLANA": "SOL", 
        "RIPPLE": "XRP", "DOGECOIN": "DOGE", "CARDANO": "ADA", 
        "BINANCE": "BNB", "PEPE": "PEPE", "SHIBA": "SHIB",
        "POLYGON": "MATIC", "AVALANCHE": "AVAX", "POLKADOT": "DOT"
    }
    for name, sym in name_map.items():
        if name in clean_words: potential_symbols.append(sym)
        
    found_data = []
    seen = set()
    
    for sym in potential_symbols:
        if sym in seen: continue
        seen.add(sym)
        matches = search_coins(sym)
        if matches:
            coin = next((m for m in matches if m['symbol'] == sym), matches[0])
            found_data.append(f"- {coin['symbol']}: ${coin['price']:,} ({coin['change']}% 24h) | Volume: ${coin['volume']:,}")
            
    if found_data:
        context_str += "### REAL-TIME MARKET DATA:\n" + "\n".join(found_data) + "\n\n"
        
    # 2. Add Top Gainers if asked about market generally or if asking "how/what" without specific coins
    market_keywords = ["market", "trending", "gainers", "top", "performance", "doing", "how", "what", "status", "price"]
    if any(keyword in clean_msg for keyword in market_keywords):
        gainers = fetch_top_gainers()
        gainers.sort(key=lambda x: x['change'], reverse=True)
        top_5 = gainers[:5]
        g_str = "\n".join([f"- {g['symbol']}: +{g['change']}%" for g in top_5])
        context_str += f"### TOP 24H GAINERS:\n{g_str}\n\n"
        
    # 3. Add News if asked
    news_keywords = ["news", "headline", "why", "happening", "event", "latest", "update"]
    if any(keyword in clean_msg for keyword in news_keywords):
        news = fetch_news(limit=5)
        if news:
            n_str = "\n".join([f"- {n['title']} (Source: {n.get('source','Unknown')})" for n in news])
            context_str += f"### LATEST NEWS HEADLINES:\n{n_str}\n\n"
        
    return context_str


def try_groq_api(system_prompt, user_msg):
    """Try Groq API (free tier available)"""
    if not GROQ_API_KEY:
        return None
        
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",  # Groq's free model
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg}
                ],
                "max_tokens": 500,
                "temperature": 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("Success with Groq API!")
            return data["choices"][0]["message"]["content"]
        else:
            print(f"Groq API failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Groq API error: {e}")
        return None

def try_openrouter_api(system_prompt, user_msg):
    """Try OpenRouter API with multiple free models"""
    if not OPENROUTER_API_KEY:
        return None
    
    for model in OPENROUTER_MODELS:
        try:
            print(f"Trying OpenRouter model: {model}...")
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "CryptoDashboard"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success with OpenRouter model: {model}")
                return data["choices"][0]["message"]["content"]
            else:
                print(f"OpenRouter {model} failed: {response.status_code}")
                continue
        except Exception as e:
            print(f"OpenRouter {model} error: {e}")
            continue
    
    return None

def try_free_fallback_service(system_prompt, user_msg):
    """Fallback logic if major APIs fail"""
    # Previously used DialoGPT, now just return None to trigger structured fallback
    return None


def llm_response(msg):
    try:
        # 1. Gather Context
        context = get_market_context(msg)
        
        # 2. System Prompt
        system_prompt = (
            "You are 'MarketPulse AI', a high-end, professional cryptocurrency market analyst and assistant. "
            "You provide insightful, accurate, and data-driven responses using the real-time context provided below. "
            "\n\nGUIDELINES:\n"
            "1. Accuracy: Use the provided REAL-TIME MARKET DATA. If a price is provided, use it. Do not guess.\n"
            "2. Tone: Professional, authoritative, yet engaging. Think 'Bloomberg meets Silicon Valley'.\n"
            "3. Formatting: Use Markdown (bolding, bullet points, headers) to make your response easy to read and premium. "
            "Always use double newlines between paragraphs and list items. Markdown requires this spacing to render correctly.\n"
            "4. Content: Explain 'why' certain movements might be happening if relevant news is provided.\n"
            "5. NO THINKING: Do not include any internal thoughts, planning, or self-dialogue. Start your response directly with the analysis.\n"
            "6. Greetings: If the user just says 'hi' or greets you without a specific question, respond with a friendly, professional greeting and ask how you can help with their crypto research. Keep it brief.\n"
            "7. Conciseness: Be thorough but avoid fluff. Get straight to the value.\n"
            "\n\nCONTEXT DATA:\n" + context
        )


        
        # 3. Try APIs in order of reliability
        
        # First try Groq (most reliable free tier)
        print("Attempting Groq API...")
        result = try_groq_api(system_prompt, msg)
        if result:
            return result
        
        # Then try OpenRouter
        print("Attempting OpenRouter API...")
        result = try_openrouter_api(system_prompt, msg)
        if result:
            return result
        
        # Finally try Fallback
        print("Attempting Fallback...")
        result = try_free_fallback_service(system_prompt, msg)
        if result:
            return result

        
        # All APIs failed - provide helpful fallback with context
        print("All APIs failed. Providing fallback response with market context.")
        return generate_fallback_response(msg, context)
        
    except Exception as e:
        print(f"LLM Error: {e}")
        return generate_fallback_response(msg, "")

def generate_fallback_response(msg, context):
    """Generate a clean, structured report when LLM is unavailable"""
    if context:
        response = "### 📊 MarketPulse Intelligence Report\n\n"
        response += "I'm currently optimizing my neural links, but I've gathered the following live data for you:\n\n"
        
        # Clean up the context for display
        clean_context = context.replace("### REAL-TIME MARKET DATA:", "**Current Market Prices:**")
        clean_context = clean_context.replace("### TOP 24H GAINERS:", "**Trending Gainers (24h):**")
        clean_context = clean_context.replace("### LATEST NEWS HEADLINES:", "**Recent Headlines:**")
        
        response += clean_context
        response += "\n\n*Note: AI conversational analysis is temporarily limited. Please check the charts for detailed technicals.*"
        return response
    else:
        return (
            "### 🚀 MarketPulse: System Update in Progress\n\n"
            "I'm currently fine-tuning my analysis engines to provide better crypto insights.\n\n"
            "**In the meantime, you can explore:**\n"
            "- **Dashboard**: Real-time price tracking and volume analysis.\n"
            "- **Heatmap**: Visual overview of market dominance.\n"
            "- **News**: The latest break-throughs in the blockchain space.\n\n"
            "*Your data remains live and accurate on the main dashboard.*"
        )

