
let marketData = [];
let allGainers = [];
let allNews = [];

const coinNames = {
  "BTC": "Bitcoin",
  "ETH": "Ethereum",
  "USDT": "Tether USD",
  "BNB": "Binance Coin",
  "SOL": "Solana Blockchain Coin",
  "XRP": "Ripple XRP Ledger Token",
  "USDC": "USD Coin",
  "ADA": "Cardano Blockchain Coin",
  "AVAX": "Avalanche Network Token",
  "DOGE": "Dogecoin (Meme Cryptocurrency)",
  "DOT": "Polkadot Network Token",
  "TRX": "TRON Network Token",
  "LINK": "Chainlink Oracle Token",
  "MATIC": "Polygon Network Token",
  "SHIB": "Shiba Inu Meme Token",
  "LTC": "Litecoin",
  "DAI": "Dai Stablecoin",
  "BCH": "Bitcoin Cash",
  "UNI": "Uniswap Governance Token",
  "ATOM": "Cosmos Hub Token",
  "LEO": "UNUS SED LEO Token",
  "ETC": "Ethereum Classic",
  "XLM": "Stellar Lumens",
  "XMR": "Monero Privacy Coin",
  "OKB": "OKB Exchange Utility Token",
  "LDO": "Lido Decentralized Autonomous Organization Token",
  "FIL": "Filecoin Decentralized Storage Token",
  "HBAR": "Hedera Hashgraph Token",
  "APT": "Aptos Blockchain Token",
  "VET": "VeChain Supply Chain Token",
  "QNT": "Quant Network Token",
  "NEAR": "NEAR Protocol Token",
  "CRO": "Cronos Blockchain Token",
  "ARB": "Arbitrum Layer-2 Token",
  "AAVE": "Aave DeFi Lending Token",
  "ALGO": "Algorand Blockchain Token",
  "GRT": "The Graph Indexing Protocol Token",
  "FTM": "Fantom Opera Network Token",
  "SAND": "The Sandbox Metaverse Token",
  "EOS": "EOS Blockchain Token",
  "MANA": "Decentraland Metaverse Token",
  "THETA": "Theta Network Streaming Token",
  "EGLD": "MultiversX Network Token",
  "FLOW": "Flow Blockchain Token",
  "AXS": "Axie Infinity Governance Token",
  "XTZ": "Tezos Blockchain Token",
  "CHZ": "Chiliz Fan Engagement Token",
  "RPL": "Rocket Pool Ethereum Staking Token",
  "KLAY": "Klaytn Blockchain Token",
  "CFX": "Conflux Network Token",
  "PEPE": "Pepe Meme Cryptocurrency",
  "SUI": "Sui Layer-1 Blockchain Token",
  "INJ": "Injective Protocol Token",
  "RNDR": "Render Network Token",
  "STX": "Stacks Bitcoin Layer Token",
  "IMX": "Immutable X Scaling Token",
  "OP": "Optimism Layer-2 Token",
  "BONK": "Bonk Solana Meme Token",
  "BTTC": "BitTorrent Chain Token",
  "LUNC": "Terra Luna Classic Token",
  "FLOKI": "Floki Inu Meme Token",
  "1000SATS": "Satoshi (1000 Units of Bitcoin)",
  "NEIRO": "Neiro AI Meme Token",
  "XEC": "eCash Digital Cash Token",
  "DOGS": "Dogs Community Meme Token",
  "EPX": "Ellipsis X Governance Token",
  "WIN": "WINkLink Oracle Token",
  "PUMP": "Pump Meme Token",
  "OOKI": "Ooki Decentralized Finance Token",
  "1MBABYDOGE": "Baby Doge Coin (One Million Units)",
  "1000CHEEMS": "Cheems Meme Token (1000 Units)",
  "HMSTR": "Hamster Kombat Gaming Token",
  "SENT": "Sentinel Decentralized VPN Token",
  "BOME": "Book of Meme Token",
  "LEVER": "LeverFi DeFi Protocol Token",
  "SLP": "Smooth Love Potion Gaming Token",
  "ZK": "zkSync Layer-2 Token",
  "PENGU": "Pudgy Penguins NFT Ecosystem Token",
  "MBL": "MovieBloc Content Platform Token",
  "XRPDOWN": "XRP Down Leveraged Trading Token",
  "NOT": "Notcoin Community Token",
  "ANIME": "Animecoin Community Token",
  "TROY": "TROY Trading Infrastructure Network Token",
  "LINEA": "Linea Ethereum Layer-2 Token",
  "SPELL": "Spell DeFi Governance Token",
  "F": "F Utility Token",
  "TURBO": "Turbo Meme Cryptocurrency",
  "AMB": "AirDAO Blockchain Token",
  "MEME": "Memecoin Ecosystem Token",
  "FUN": "FUNToken Gaming Utility Token",
  "HOT": "Holo Distributed Hosting Token",
  "DENT": "Dent Mobile Data Exchange Token",
  "BEAMX": "Beam Gaming Ecosystem Token",
  "GALA": "Gala Games Ecosystem Token",
  "TLM": "Alien Worlds Trilium Token",
  "RSR": "Reserve Rights Stability Token",
  "QKC": "QuarkChain Blockchain Token",
  "IQ": "IQ Knowledge Ecosystem Token",
  "REEF": "Reef DeFi Operating System Token",
  "VTHO": "VeThor Energy Token",
  "IOST": "Internet of Services Token",
  "LINA": "Linear Finance DeFi Token",
  "ASTR": "Astar Smart Contract Hub Token",
  "ZAMA": "Zama Blockchain Token",
  "BETA": "Beta Finance DeFi Token",
  "C98": "Coin98 Finance DeFi Token",
  "DODO": "DODO Decentralized Exchange Token",
  "GPS" : "GoPlus Security",
  "XVG": "Verge Privacy Coin",
  "ALT": "Altcoin (Generic Term for Non-Bitcoin Cryptocurrencies)",
  "NBS": "New BitShares Token",
  "ADADOWN": "Cardano Down Leveraged Trading Token",
  "WLFI": "World Liberty Financial Token",
  "DATA": "Streamr DATAcoin",
  "USD1": "fiat-backed digital asset",
  "REZ":"Renzo",
  "CKB": "Common Knowledge Base"
};


function getChangeColor(change) {
  return change >= 0 ? '#00FFA3' : '#FF3F3F';
}

function getIcon(symbol) {
  // Simple placeholder icon logic
  return symbol.substring(0, 1);
}



function renderOverview(data) {
  const overview = document.getElementById("overview");
  overview.innerHTML = "";

  if (!data || data.length === 0) {
    overview.innerHTML = "<p class='text-secondary text-center p-4'>No results found</p>";
    return;
  }

  // Header
  const header = `
    <div class="d-flex justify-content-between text-secondary px-3 pb-2 border-bottom border-dark mb-2" style="font-size:0.8rem">
        <div style="width:15%">ASSET</div>
        <div style="width:25%">NAME</div>
        <div style="width:20%" class="text-end">PRICE</div>
        <div style="width:15%" class="text-end">24H</div>
        <div style="width:25%" class="text-end">VOLUME</div>
    </div>
    `;
  overview.innerHTML += header;

  data.forEach(c => {
    const color = getChangeColor(c.change);
    overview.innerHTML += `
      <div class="market-item px-2">
        <div class="coin-info" style="width:15%">
            <div class="coin-icon">${getIcon(c.symbol)}</div>
            <div class="coin-name">${c.symbol}</div>
        </div>
        <div style="width:25%" class="d-flex align-items-center text-secondary small">${coinNames[c.symbol] || '-'}</div>
        <div class="text-end" style="width:20%">$${c.price}</div>
        <div class="text-end" style="width:15%; color:${color}">${c.change.toFixed(2)}%</div>
        <div class="text-end text-secondary" style="width:25%">${parseInt(c.volume).toLocaleString()}</div>
      </div>
    `;
  });
}

let allMarkets = [];

// render market list (Sector/Gainers)
function renderMarkets(data, elementId = "markets") {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  data.forEach(c => {
    const color = getChangeColor(c.change);
    container.innerHTML += `
      <div class="market-item">
        <div class="coin-info">
             <div class="coin-icon" style="width:24px;height:24px;font-size:0.7rem">${getIcon(c.symbol)}</div>
             <span class="coin-name">${c.symbol}</span>
        </div>
        <span style="color:${color}; font-weight:600">${c.change.toFixed(2)}%</span>
      </div>
    `;
  });
}

// Load Gainers
fetch("/api/gainers")
  .then(r => r.json())
  .then(data => {
    allMarkets = data.sort((a, b) => b.change - a.change);

    filterMarkets('top');
  });

function filterMarkets(type, count = 5) {
  let slice = [];
  if (type === "top") slice = allMarkets.slice(0, count);
  else if (type === "mid") {
    const mid = Math.floor(allMarkets.length / 2);
    slice = allMarkets.slice(mid - Math.floor(count / 2), mid + Math.ceil(count / 2));
  }
  renderMarkets(slice, "markets");
}


fetch("/api/market")
  .then(r => r.json())
  .then(data => {
    marketData = data;
    renderTicker(data);
    renderIndexCards(data);
    renderOverview(data);
    renderHeatmap(data);
  });

function renderHeatmap(data) {
  const heatmap = document.getElementById("heatmap");
  if (!heatmap) return;
  heatmap.innerHTML = "";



  let sorted = [...data].sort((a, b) => b.volume - a.volume).slice(0, 14);

  sorted.forEach((c, i) => {
    let sizeClass = "hm-small";
    if (i < 2) sizeClass = "hm-large";
    else if (i < 6) sizeClass = "hm-medium";

    const bgColor = c.change >= 0
      ? `rgba(35, 134, 54, ${0.4 + (Math.abs(c.change) / 20)})` // varies opacity by strength
      : `rgba(218, 54, 51, ${0.4 + (Math.abs(c.change) / 20)})`;

    heatmap.innerHTML += `
            <div class="heatmap-item ${sizeClass}" style="background:${bgColor}" onclick="loadChart('${c.symbol}')" title="${c.symbol}: ${c.change}%">
                <span class="symbol">${c.symbol}</span>
                <span class="change">${c.change.toFixed(2)}%</span>
                <small style="font-size:0.7em; opacity:0.8">$${c.price}</small>
            </div>
        `;
  });
}



function renderTicker(data) {
  const ticker = document.getElementById("ticker");
  ticker.innerHTML = "";
  data.slice(0, 15).forEach(c => {
    const color = getChangeColor(c.change);
    ticker.innerHTML += `
        <span class="ticker-item">
            <b style="color:white">${c.symbol}</b> 
            <span style="margin-left:5px">$${c.price}</span>
            <span style="color:${color}; margin-left:5px">${c.change.toFixed(2)}%</span>
        </span>
        `;
  });
}

/*************************************************
 * LOAD ALL GAINERS 
 *************************************************/
fetch("/api/gainers")
  .then(r => r.json())
  .then(data => {
    allGainers = data.sort((a, b) => b.change - a.change);
    filterGainers("top");
  });

function filterGainers(type, count = 5) {
  let slice = [];
  if (type === "top") slice = allGainers.slice(0, count);
  else if (type === "mid") {
    const mid = Math.floor(allGainers.length / 2);
    slice = allGainers.slice(mid - Math.floor(count / 2), mid + Math.ceil(count / 2));
  }
  renderMarkets(slice, "gainers");
}


// SEARCH (AUTOCOMPLETE)
const searchInput = document.getElementById("searchInput");
const searchContainer = document.querySelector(".search-container");

// Create dropdown
const dropdown = document.createElement("div");
dropdown.className = "dropdown-menu show"; // Bootstrap class for styling
dropdown.style.display = "none";
dropdown.style.marginTop = "5px";
dropdown.style.width = "100%";
dropdown.style.maxHeight = "300px";
dropdown.style.overflowY = "auto";
dropdown.style.background = "#161b22"; // Match our theme
dropdown.style.borderColor = "#30363d";
searchContainer.appendChild(dropdown);

let searchTimeout;

searchInput.addEventListener("input", function () {
  clearTimeout(searchTimeout);
  const query = this.value.trim();

  // Also filter locally for immediate feedback if desired
  const filtered = marketData.filter(c => c.symbol.toUpperCase().includes(query.toUpperCase()));
  renderIndexCards(filtered);
  renderOverview(filtered);

  if (query.length < 2) {
    dropdown.style.display = "none";
    return;
  }

  searchTimeout = setTimeout(() => {
    // Call backend for broader search
    fetch(`/api/search?q=${query}`)
      .then(r => r.json())
      .then(matches => {
        dropdown.innerHTML = "";
        if (matches.length > 0) {
          matches.forEach(m => {
            const item = document.createElement("a");
            item.className = "dropdown-item d-flex justify-content-between align-items-center text-white";
            item.href = "#";
            const color = m.change >= 0 ? "text-success" : "text-danger";

            item.innerHTML = `
                            <div>
                                <b>${m.symbol}</b>
                                <small class="d-block text-secondary">$${m.price}</small>
                            </div>
                            <span class="${color}">${m.change.toFixed(2)}%</span>
                        `;

            item.onclick = (e) => {
              e.preventDefault();
              // Update Chart
              loadChart(m.symbol);

              // Clear Search
              searchInput.value = "";
              dropdown.style.display = "none";

              // Reset local filters
              renderIndexCards(marketData);
              renderOverview(marketData);
            };
            dropdown.appendChild(item);
          });
          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      });
  }, 300);
});

// Close dropdown on click outside
document.addEventListener("click", e => {
  if (!searchContainer.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

/*************************************************
 * DAY FILTER
 *************************************************/
function loadDay(day) {
  fetch(`/api/market/day/${day}`)
    .then(res => res.json())
    .then(data => {
      data.sort((a, b) => b.change - a.change);
      marketData = data;
      renderIndexCards(data);
      renderOverview(data);
    });
}

/*************************************************
 * NEWS
 *************************************************/
fetch("/api/news")
  .then(r => r.json())
  .then(data => {
    allNews = data;
    filterNews("latest");
  });

function filterNews(type) {
  const n = document.getElementById("news");
  if (!n) return;
  n.innerHTML = "";

  // Just show first 3 for layout purposes
  const slice = allNews.slice(0, 4);

  slice.forEach(item => {
    const safeUrl = (item.url && item.url !== "null") ? item.url : "";
    const articleUrl = `/view-article?url=${encodeURIComponent(safeUrl)}&title=${encodeURIComponent(item.title)}&source=${encodeURIComponent(item.source || 'CryptoNews')}`;
    n.innerHTML += `
      <div class="news-item">
        <a href="${articleUrl}" class="news-title">${item.title}</a>
        <div class="news-meta">
            <span>${item.source || 'CryptoNews'}</span>
            <a href="${articleUrl}" class="text-warning small" style="text-decoration:none">Full Story →</a>
        </div>
      </div>
    `;
  });
}

/*************************************************
 * INDEX CARDS
 *************************************************/
let showAllCards = false;

function renderIndexCards(data) {
  const indexCards = document.getElementById("indexCards");
  indexCards.innerHTML = "";

  const cardsPerRow = 6;
  const visibleCards = showAllCards ? data.length : 12; // first 2 rows (6x2)

  data.forEach((c, i) => {
    const color = getChangeColor(c.change);
    const display = i >= visibleCards ? 'none' : 'block';

    indexCards.innerHTML += `
      <div class="col-lg-2 col-md-3 col-6" style="display:${display}">
        <div class="glass-card text-center p-3 h-100 card-hover-effect" onclick="loadChart('${c.symbol}')" style="cursor:pointer">
          <h6 class="text-secondary" style="font-size:0.8rem">${c.symbol}</h6>
          <h4 class="my-2" style="font-size:1.1rem">$${c.price}</h4>
          <span style="color:${color}; font-size:0.9rem">${c.change.toFixed(2)}%</span>
        </div>
      </div>
    `;
  });

  const btn = document.getElementById("toggleCardsBtn");
  btn.textContent = showAllCards ? "Show Less" : "Show More";
  btn.onclick = () => {
    showAllCards = !showAllCards;
    renderIndexCards(data);
  };
}

/*************************************************
 * CHART & SENTIMENT (DASHBOARD)
 *************************************************/
// Chart logic moved to chart_logic.js to allow reloading

fetch("/api/news-sentiment")
  .then(r => r.json())
  .then(data => {
    const box = document.getElementById("sentiment-dashboard");
    if (!box) return;
    box.innerHTML = "";

    // ... same sentiment logic ...
    // Calculate aggregate sentiment for a "Gauge" look (simplified as a bar)
    let posCount = data.filter(n => n.sentiment === "Positive").length;
    let negCount = data.filter(n => n.sentiment === "Negative").length;
    let total = data.length || 1;
    let score = ((posCount - negCount) / total) * 100; // -100 to 100

    // Render a simple visual bar for overall sentiment
    let moodColor = score > 0 ? '#238636' : (score < 0 ? '#da3633' : '#8b949e');
    let moodText = "Neutral";
    if (score >= 50) moodText = "Extreme Greed";
    else if (score > 0) moodText = "Greed";
    else if (score <= -50) moodText = "Extreme Fear";
    else if (score < 0) moodText = "Fear";

    box.innerHTML += `
    <div class="glass-card mb-2 text-center py-3" style="background: rgba(255,255,255,0.03);">
        <h6 class="text-secondary small">MARKET MOOD</h6>
        <h3 style="color:${moodColor}">${moodText}</h3>
        <div class="progress" style="height: 6px; background: #30363d;">
            <div class="progress-bar" role="progressbar" style="width: ${50 + (score / 2)}%; background-color: ${moodColor};" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
    </div>
  `;

    // List items
    data.slice(0, 5).forEach(n => {
      let badgeClass = "text-secondary";
      let icon = "•";
      if (n.sentiment === "Positive") { badgeClass = "text-success"; icon = "▲"; }
      if (n.sentiment === "Negative") { badgeClass = "text-danger"; icon = "▼"; }

      box.innerHTML += `
      <div class="d-flex gap-2 align-items-start border-bottom border-dark pb-2">
        <span class="${badgeClass}" style="font-size:1.2rem; line-height:1">${icon}</span>
        <div>
            <div class="small text-truncate" style="max-width:200px" title="${n.title}">${n.title}</div>
            <div class="${badgeClass}" style="font-size:0.75rem">${n.sentiment}</div>
        </div>
      </div>
    `;
    });
  })
  .catch(err => {
    console.error("Sentiment error:", err);
    const box = document.getElementById("sentiment-dashboard");
    if (box) box.innerHTML = "<div class='text-center text-danger mt-5'>Failed to load sentiment.</div>";
  });

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("dateFilter");
  if (!dateInput) return; // Exit if dateFilter is disabled/commented out

  // default = today
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;

  loadMarketByDate(today);

  dateInput.addEventListener("change", () => {
    loadMarketByDate(dateInput.value);
  });
});

function loadMarketByDate(day) {
  fetch(`/api/market/day/${day}`)
    .then(res => res.json())
    .then(data => {
      renderOverview(data);
      renderHeatmap(data);
      renderIndexCards(data);
    })
    .catch(err => console.error("Date filter error:", err));
}
