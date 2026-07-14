// AI Chart Analyzer for Quotex Trading
// Advanced technical analysis and trading signal generation

class AIChartAnalyzer {
    constructor() {
        this.chart = null;
        this.priceData = [];
        this.currentAsset = 'EURUSD';
        this.currentTimeframe = '1m';  
        this.candleCount = 50;
        this.initializeEventListeners();
        this.loadMockData();
    }

    initializeEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeChart());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('assetSelect').addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            this.updateAssetInfo();
            this.loadMockData();
        });
        document.getElementById('timeframeSelect').addEventListener('change', (e) => {
            this.currentTimeframe = e.target.value;
            this.updateTimeframeInfo();
            this.loadMockData();
        });
        document.getElementById('candlesInput').addEventListener('change', (e) => {
            this.candleCount = parseInt(e.target.value);
            this.loadMockData();
        });
    }

    // Mock data generation for demonstration
    loadMockData() {
        const basePrice = this.getBasePrice(this.currentAsset);
        this.priceData = [];
        let currentPrice = basePrice;

        for (let i = this.candleCount; i > 0; i--) {
            const change = (Math.random() - 0.5) * (basePrice * 0.005);
            currentPrice += change;
            const open = currentPrice - (Math.random() * basePrice * 0.002);
            const close = currentPrice + (Math.random() * basePrice * 0.002);
            const high = Math.max(open, close) + (Math.random() * basePrice * 0.001);
            const low = Math.min(open, close) - (Math.random() * basePrice * 0.001);
            const volume = Math.random() * 10000;

            this.priceData.push({
                timestamp: new Date(Date.now() - i * 60000),
                open,
                close,
                high,
                low,
                volume
            });
        }

        this.initializeChart();
        this.updateChartInfo();
    }

    getBasePrice(asset) {
        const prices = {
            'EURUSD': 1.0850,
            'GBPUSD': 1.2750,
            'AUDUSD': 0.6850,
            'USDJPY': 145.50,
            'BTCUSD': 43250,
            'ETHUSD': 2350
        };
        return prices[asset] || 1.0850;
    }

    initializeChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        const labels = this.priceData.map(d => d.timestamp.toLocaleTimeString());
        const closePrices = this.priceData.map(d => d.close);
        const sma20 = this.calculateSMA(20);
        const ema12 = this.calculateEMA(12);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Close Price',
                        data: closePrices,
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#00d4ff',
                        pointBorderWidth: 0
                    },
                    {
                        label: 'SMA (20)',
                        data: sma20,
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'EMA (12)',
                        data: ema12,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [3, 3]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    filler: {
                        propagate: true
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#9ca3af',
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(45, 55, 72, 0.3)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af',
                            font: { size: 10 },
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(45, 55, 72, 0.3)',
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    // Technical Indicators
    calculateSMA(period) {
        const sma = [];
        for (let i = 0; i < this.priceData.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                let sum = 0;
                for (let j = i - period + 1; j <= i; j++) {
                    sum += this.priceData[j].close;
                }
                sma.push(sum / period);
            }
        }
        return sma;
    }

    calculateEMA(period) {
        const ema = [];
        const k = 2 / (period + 1);
        
        for (let i = 0; i < this.priceData.length; i++) {
            if (i === 0) {
                ema.push(this.priceData[i].close);
            } else if (i < period) {
                ema.push(null);
            } else {
                const emaPrev = ema[i - 1];
                const emaNew = this.priceData[i].close * k + emaPrev * (1 - k);
                ema.push(emaNew);
            }
        }
        return ema;
    }

    calculateRSI(period = 14) {
        const changes = [];
        for (let i = 1; i < this.priceData.length; i++) {
            changes.push(this.priceData[i].close - this.priceData[i - 1].close);
        }

        let gains = 0, losses = 0;
        for (let i = 0; i < period; i++) {
            if (changes[i] > 0) gains += changes[i];
            else losses += Math.abs(changes[i]);
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return rsi;
    }

    calculateMACD() {
        const ema12 = this.calculateEMA(12);
        const ema26 = this.calculateEMA(26);
        
        const macdLine = [];
        for (let i = 0; i < ema12.length; i++) {
            if (ema12[i] && ema26[i]) {
                macdLine.push(ema12[i] - ema26[i]);
            } else {
                macdLine.push(null);
            }
        }

        const lastMACD = macdLine.filter(v => v !== null).pop() || 0;
        return lastMACD;
    }

    calculateSupportResistance() {
        const highs = this.priceData.map(d => d.high);
        const lows = this.priceData.map(d => d.low);
        
        const maxHigh = Math.max(...highs);
        const minLow = Math.min(...lows);
        const lastPrice = this.priceData[this.priceData.length - 1].close;
        
        const resistance = maxHigh + (maxHigh - minLow) * 0.382;
        const support = minLow - (maxHigh - minLow) * 0.382;
        const pivot = (maxHigh + minLow + lastPrice) / 3;

        return { support, resistance, pivot };
    }

    // Main Analysis Function
    analyzeChart() {
        const rsi = this.calculateRSI();
        const macd = this.calculateMACD();
        const { support, resistance, pivot } = this.calculateSupportResistance();
        const sma20 = this.calculateSMA(20).filter(v => v !== null).pop();
        const lastPrice = this.priceData[this.priceData.length - 1].close;
        const ema12 = this.calculateEMA(12).filter(v => v !== null).pop();

        // Determine Trend
        const trend = lastPrice > sma20 ? 'Uptrend' : 'Downtrend';
        const trendStrength = Math.abs(lastPrice - sma20) / sma20 > 0.02 ? 'Strong' : 'Weak';
        const trendDirection = lastPrice > ema12 ? '⬆️ Bullish' : '⬇️ Bearish';

        // Generate Signal
        let signal = this.generateSignal(rsi, macd, lastPrice, sma20, ema12);
        let confidence = this.calculateConfidence(rsi, macd, signal);
        let recommendation = this.getRecommendation(signal, confidence);

        // Update UI
        this.updateAnalysisUI({
            trend,
            trendStrength,
            trendDirection,
            resistance: resistance.toFixed(4),
            support: support.toFixed(4),
            pivot: pivot.toFixed(4),
            rsi: rsi.toFixed(2),
            macd: macd.toFixed(6),
            sma: sma20.toFixed(4),
            signal,
            confidence,
            recommendation
        });

        this.generateAlerts(rsi, lastPrice, support, resistance);
    }

    generateSignal(rsi, macd, price, sma, ema) {
        const bullishSignals = [];
        const bearishSignals = [];

        // RSI Analysis
        if (rsi < 30) bullishSignals.push('oversold');
        if (rsi > 70) bearishSignals.push('overbought');

        // Price Position
        if (price > sma && price > ema) bullishSignals.push('above_averages');
        if (price < sma && price < ema) bearishSignals.push('below_averages');

        // MACD
        if (macd > 0) bullishSignals.push('positive_macd');
        if (macd < 0) bearishSignals.push('negative_macd');

        if (bullishSignals.length > bearishSignals.length) {
            return 'BUY';
        } else if (bearishSignals.length > bullishSignals.length) {
            return 'SELL';
        } else {
            return 'HOLD';
        }
    }

    calculateConfidence(rsi, macd, signal) {
        let confidence = 50;

        if (signal === 'BUY') {
            if (rsi < 40 && macd > 0) confidence = 75;
            else if (rsi < 50) confidence = 65;
            else confidence = 55;
        } else if (signal === 'SELL') {
            if (rsi > 60 && macd < 0) confidence = 75;
            else if (rsi > 50) confidence = 65;
            else confidence = 55;
        }

        return confidence;
    }

    getRecommendation(signal, confidence) {
        if (signal === 'BUY') {
            return confidence > 70 ? 'Strong Buy' : 'Buy';
        } else if (signal === 'SELL') {
            return confidence > 70 ? 'Strong Sell' : 'Sell';
        } else {
            return 'Wait for Signal';
        }
    }

    updateAnalysisUI(data) {
        // Trend
        document.getElementById('trendValue').textContent = data.trend;
        document.getElementById('trendValue').className = 'badge ' + (data.trend === 'Uptrend' ? 'bullish' : 'bearish');
        document.getElementById('trendStrength').textContent = data.trendStrength;
        document.getElementById('trendStrength').className = 'badge ' + (data.trendStrength === 'Strong' ? 'strong' : 'weak');
        document.getElementById('trendDirection').textContent = data.trendDirection;

        // Support & Resistance
        document.getElementById('resistanceValue').textContent = data.resistance;
        document.getElementById('supportValue').textContent = data.support;
        document.getElementById('pivotValue').textContent = data.pivot;

        // Indicators
        document.getElementById('rsiValue').textContent = data.rsi;
        document.getElementById('macdValue').textContent = data.macd;
        document.getElementById('smaValue').textContent = data.sma;

        // Signal
        document.getElementById('signalValue').textContent = data.signal;
        document.getElementById('signalValue').className = 'badge ' + (data.signal === 'BUY' ? 'bullish' : data.signal === 'SELL' ? 'bearish' : 'weak');
        document.getElementById('confidenceValue').textContent = data.confidence + '%';
        document.getElementById('recommendationValue').textContent = data.recommendation;
    }

    generateAlerts(rsi, price, support, resistance) {
        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = '';

        const alerts = [];

        if (rsi > 70) {
            alerts.push({
                type: 'warning',
                message: '⚠️ RSI indicates overbought condition (RSI > 70)'
            });
        }
        if (rsi < 30) {
            alerts.push({
                type: 'danger',
                message: '🔴 RSI indicates oversold condition (RSI < 30)'
            });
        }
        if (price > resistance) {
            alerts.push({
                type: 'success',
                message: '✅ Price breaking above resistance level'
            });
        }
        if (price < support) {
            alerts.push({
                type: 'danger',
                message: '🔴 Price breaking below support level'
            });
        }
        if (Math.abs(price - support) / support < 0.01) {
            alerts.push({
                type: 'warning',
                message: '⚠️ Price near support level - watch for bounce'
            });
        }

        if (alerts.length === 0) {
            alertsList.innerHTML = '<p class="info-text">✅ No active alerts. Market conditions are stable.</p>';
        } else {
            alerts.forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert-item ${alert.type} fade-in`;
                alertDiv.innerHTML = `
                    <div class="alert-text">${alert.message}</div>
                    <span class="alert-time">${new Date().toLocaleTimeString()}</span>
                `;
                alertsList.appendChild(alertDiv);
            });
        }
    }

    updateChartInfo() {
        document.getElementById('assetInfo').textContent = `Asset: ${this.currentAsset}`;
        document.getElementById('timeframeInfo').textContent = this.getTimeframeLabel();
        document.getElementById('lastUpdateInfo').textContent = `Last Update: ${new Date().toLocaleTimeString()}`;
    }

    updateAssetInfo() {
        document.getElementById('assetInfo').textContent = `Asset: ${this.currentAsset}`;
    }

    updateTimeframeInfo() {
        document.getElementById('timeframeInfo').textContent = this.getTimeframeLabel();
    }

    getTimeframeLabel() {
        const timeframes = {
            '1m': '1 Minute',
            '5m': '5 Minutes',
            '15m': '15 Minutes',
            '30m': '30 Minutes',
            '1h': '1 Hour',
            '4h': '4 Hours',
            '1d': '1 Day'
        };
        return `Timeframe: ${timeframes[this.currentTimeframe]}`;
    }

    refreshData() {
        this.loadMockData();
        this.analyzeChart();
        this.updateMarketOverview();
    }

    updateMarketOverview() {
        const assets = [
            { symbol: 'EUR/USD', price: 1.0850, change: 0.15 },
            { symbol: 'GBP/USD', price: 1.2750, change: -0.08 },
            { symbol: 'AUD/USD', price: 0.6850, change: 0.22 },
            { symbol: 'USD/JPY', price: 145.50, change: -0.35 },
            { symbol: 'BTC/USD', price: 43250, change: 1.25 },
            { symbol: 'ETH/USD', price: 2350, change: 0.85 }
        ];

        const marketGrid = document.getElementById('marketGrid');
        marketGrid.innerHTML = '';

        assets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'market-card fade-in';
            card.innerHTML = `
                <div class="symbol">${asset.symbol}</div>
                <div class="price">${asset.price.toFixed(4)}</div>
                <div class="change ${asset.change >= 0 ? 'positive' : 'negative'}">
                    ${asset.change >= 0 ? '📈' : '📉'} ${Math.abs(asset.change).toFixed(2)}%
                </div>
            `;
            marketGrid.appendChild(card);
        });
    }
}

// Initialize the application
let analyzer;

document.addEventListener('DOMContentLoaded', () => {
    analyzer = new AIChartAnalyzer();
    analyzer.analyzeChart();
    analyzer.updateMarketOverview();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        analyzer.refreshData();
    }, 30000);
});
