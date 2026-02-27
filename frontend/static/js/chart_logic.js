// TradingView Lightweight Charts Implementation
let chartInstance = null;
let candlestickSeries = null;
let volumeSeries = null;
let currentSymbol = "BTC";
let currentPeriod = "1D";

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

    // Clear any existing content if we re-init
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
        rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.4)',
        },
        timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.4)',
            timeVisible: true,
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
    };

    chartInstance = LightweightCharts.createChart(container, chartOptions);

    // Create Candlestick Series
    candlestickSeries = chartInstance.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#00FFA3', // Green
        downColor: '#FF3F3F', // Red
        borderVisible: false,
        wickUpColor: '#00FFA3',
        wickDownColor: '#FF3F3F',
    });

    // Create Volume Series (Histogram)
    volumeSeries = chartInstance.addSeries(LightweightCharts.HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', // Set as an overlay on the main chart
    });

    // Configure volume to sit at bottom
    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.85, // Highest point of the series will be 85% away from the top
            bottom: 0,
        },
    });

    // Handle Resize
    new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== container) { return; }
        const newRect = entries[0].contentRect;
        chartInstance.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(container);
}

function loadChart(symbol) {
    if (symbol) currentSymbol = symbol;

    const chartTitle = document.getElementById("chartTitle");
    if (chartTitle) chartTitle.textContent = `Market Trend (${currentSymbol})`;

    // Initialize chart if first time
    if (!chartInstance) initChart();

    fetch(`/api/history?symbol=${currentSymbol}&period=${currentPeriod}`)
        .then(res => res.json())
        .then(data => {
            if (!data.candles || data.candles.length === 0) return;

            // Prepare data for Lightweight Charts
            const candleData = data.candles.map(c => ({
                time: c.time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close
            }));

            const volumeData = data.candles.map(c => ({
                time: c.time,
                value: c.volume,
                color: c.close >= c.open ? 'rgba(0, 255, 163, 0.3)' : 'rgba(255, 63, 63, 0.3)'
            }));

            candlestickSeries.setData(candleData);
            volumeSeries.setData(volumeData);

            // Fit content
            chartInstance.timeScale().fitContent();
        })
        .catch(err => console.error("Chart load error:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    // We defer chart init until first load call or just do it here
    setChartPeriod("1D");
});
