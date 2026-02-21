
let marketData = [];
let showAllCards = false;
let currentSymbol = "BTC";
let currentPeriod = "1D";
let chartInstance = null;
let candlestickSeries = null;
let volumeSeries = null;

function getChangeColor(change) {
    return change >= 0 ? '#00FFA3' : '#FF3F3F';
}

function renderTicker(data) {
    const ticker = document.getElementById("ticker");
    if (!ticker) return;
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

function renderIndexCards(data) {
    const indexCards = document.getElementById("indexCards");
    if (!indexCards) return;
    indexCards.innerHTML = "";

    const visibleCards = showAllCards ? data.length : 12;

    data.forEach((c, i) => {
        const color = getChangeColor(c.change);
        const display = i >= visibleCards ? 'none' : 'block';

        indexCards.innerHTML += `
      <div class="col-lg-2 col-md-3 col-6" style="display:${display}">
        <div class="glass-card text-center p-3 h-100 card-hover-effect" onclick="changeChartSymbol('${c.symbol}')" style="cursor:pointer">
          <h6 class="text-secondary" style="font-size:0.8rem">${c.symbol}</h6>
          <h4 class="my-2" style="font-size:1.1rem">$${c.price}</h4>
          <span style="color:${color}; font-size:0.9rem">${c.change.toFixed(2)}%</span>
        </div>
      </div>
    `;
    });

    const btn = document.getElementById("toggleCardsBtn");
    if (btn) {
        btn.textContent = showAllCards ? "Show Less" : "Show More";
        btn.onclick = () => {
            showAllCards = !showAllCards;
            renderIndexCards(data);
        };
    }
}

function changeChartSymbol(symbol) {
    currentSymbol = symbol;
    loadChart(symbol);
}

/*************************************************
 * CHART LOGIC (Lightweight Charts)
 *************************************************/
function setChartPeriod(period) {
    currentPeriod = period;
    document.querySelectorAll(".days .btn").forEach(btn => {
        if (btn.textContent === period) btn.classList.add("active");
        else btn.classList.remove("active");
    });
    loadChart(currentSymbol);
}

function initChart() {
    const container = document.getElementById("marketChart");
    if (!container) return;
    container.innerHTML = "";

    const chartOptions = {
        layout: {
            textColor: '#d1d4dc',
            background: { type: 'solid', color: 'transparent' },
        },
        grid: {
            vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
            horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        rightPriceScale: { borderColor: 'rgba(197, 203, 206, 0.4)' },
        timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.4)',
            timeVisible: true,
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    };

    chartInstance = LightweightCharts.createChart(container, chartOptions);
    candlestickSeries = chartInstance.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#00FFA3', downColor: '#FF3F3F',
        borderVisible: false, wickUpColor: '#00FFA3', wickDownColor: '#FF3F3F',
    });
    volumeSeries = chartInstance.addSeries(LightweightCharts.HistogramSeries, {
        color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
    });

    new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== container) return;
        const newRect = entries[0].contentRect;
        chartInstance.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(container);
}

function loadChart(symbol) {
    if (symbol) currentSymbol = symbol;
    const chartTitle = document.getElementById("chartTitle");
    if (chartTitle) chartTitle.textContent = `${currentSymbol} Price Trend`;

    if (!chartInstance) initChart();

    fetch(`/api/history?symbol=${currentSymbol}&period=${currentPeriod}`)
        .then(res => res.json())
        .then(data => {
            if (!data.candles || data.candles.length === 0) return;
            const candleData = data.candles.map(c => ({
                time: c.time, open: c.open, high: c.high, low: c.low, close: c.close
            }));
            const volumeData = data.candles.map(c => ({
                time: c.time, value: c.volume,
                color: c.close >= c.open ? 'rgba(0, 255, 163, 0.3)' : 'rgba(255, 63, 63, 0.3)'
            }));
            candlestickSeries.setData(candleData);
            volumeSeries.setData(volumeData);
            chartInstance.timeScale().fitContent();
        })
        .catch(err => console.error("Chart load error:", err));
}

/*************************************************
 * SENTIMENT (Dashboard Style)
 *************************************************/
function loadSentiment() {
    fetch("/api/news-sentiment")
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("sentiment");
            if (!box) return;
            box.innerHTML = "";

            let posCount = data.filter(n => n.sentiment === "Positive").length;
            let negCount = data.filter(n => n.sentiment === "Negative").length;
            let total = data.length || 1;
            let score = ((posCount - negCount) / total) * 100;

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

            data.slice(0, 8).forEach(n => {
                let badgeClass = "text-secondary";
                let icon = "•";
                if (n.sentiment === "Positive") { badgeClass = "text-success"; icon = "▲"; }
                if (n.sentiment === "Negative") { badgeClass = "text-danger"; icon = "▼"; }

                const articleUrl = `/view-article?url=${encodeURIComponent(n.url)}&title=${encodeURIComponent(n.title)}&source=Market Sentiment`;

                box.innerHTML += `
                <div class="d-flex gap-2 align-items-start border-bottom border-dark pb-2">
                    <span class="${badgeClass}" style="font-size:1.2rem; line-height:1">${icon}</span>
                    <div>
                        <a href="${articleUrl}" class="small text-truncate d-block text-decoration-none" style="max-width:250px; color:inherit" title="${n.title}">${n.title}</a>
                        <div class="${badgeClass}" style="font-size:0.75rem">${n.sentiment}</div>
                    </div>
                </div>
                `;
            });
        })
        .catch(err => {
            console.error("Sentiment error:", err);
            const box = document.getElementById("sentiment");
            if (box) box.innerHTML = "<div class='text-center text-danger mt-5'>Failed to load sentiment.</div>";
        });
}

/*************************************************
 * INITIALIZATION
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
    // Initial data load
    fetch("/api/market")
        .then(r => r.json())
        .then(data => {
            marketData = data;
            renderTicker(data);
            renderIndexCards(data);
        });

    loadSentiment();
    setChartPeriod("1D");

    // Search and Date filter support
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toUpperCase();
            const filtered = marketData.filter(c => c.symbol.toUpperCase().includes(query));
            renderIndexCards(filtered);
        });
    }

    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) {
        const today = new Date().toISOString().split("T")[0];
        dateFilter.value = today;
        dateFilter.addEventListener("change", () => {
            fetch(`/api/market/day/${dateFilter.value}`)
                .then(res => res.json())
                .then(data => {
                    marketData = data;
                    renderIndexCards(data);
                });
        });
    }
});