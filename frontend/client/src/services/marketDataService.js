import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class MarketDataService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/market`;
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get comprehensive market data
     */
    async getComprehensiveMarketData() {
        try {
            const response = await axios.get(`${this.baseURL}/comprehensive`);
            return response.data;
        } catch (error) {
            console.error('Error fetching comprehensive market data:', error);
            throw error;
        }
    }

    /**
     * Get major market indices
     */
    async getMajorIndices() {
        try {
            const response = await axios.get(`${this.baseURL}/indices`);
            return response.data;
        } catch (error) {
            console.error('Error fetching major indices:', error);
            throw error;
        }
    }

    /**
     * Get interest rates
     */
    async getInterestRates() {
        try {
            const response = await axios.get(`${this.baseURL}/interest-rates`);
            return response.data;
        } catch (error) {
            console.error('Error fetching interest rates:', error);
            throw error;
        }
    }

    /**
     * Get currency exchange rates
     */
    async getCurrencyRates(baseCurrency = 'USD') {
        try {
            const response = await axios.get(`${this.baseURL}/currencies?base_currency=${baseCurrency}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching currency rates:', error);
            throw error;
        }
    }

    /**
     * Get commodity prices
     */
    async getCommodityPrices() {
        try {
            const response = await axios.get(`${this.baseURL}/commodities`);
            return response.data;
        } catch (error) {
            console.error('Error fetching commodity prices:', error);
            throw error;
        }
    }

    /**
     * Get economic indicators
     */
    async getEconomicIndicators() {
        try {
            const response = await axios.get(`${this.baseURL}/economic-indicators`);
            return response.data;
        } catch (error) {
            console.error('Error fetching economic indicators:', error);
            throw error;
        }
    }

    /**
     * Get market sentiment
     */
    async getMarketSentiment() {
        try {
            const response = await axios.get(`${this.baseURL}/sentiment`);
            return response.data;
        } catch (error) {
            console.error('Error fetching market sentiment:', error);
            throw error;
        }
    }

    /**
     * Get market analysis
     */
    async getMarketAnalysis() {
        try {
            const response = await axios.get(`${this.baseURL}/analysis`);
            return response.data;
        } catch (error) {
            console.error('Error fetching market analysis:', error);
            throw error;
        }
    }

    /**
     * Get sector performance
     */
    async getSectorPerformance() {
        try {
            const response = await axios.get(`${this.baseURL}/sectors`);
            return response.data;
        } catch (error) {
            console.error('Error fetching sector performance:', error);
            throw error;
        }
    }

    /**
     * Get stock price for a specific symbol
     */
    async getStockPrice(symbol) {
        try {
            const response = await axios.get(`${this.baseURL}/stock/${symbol}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching stock price for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Get watchlist data for multiple symbols
     */
    async getWatchlistData(symbols) {
        try {
            const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
            const response = await axios.get(`${this.baseURL}/watchlist?symbols=${symbolsParam}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching watchlist data:', error);
            throw error;
        }
    }

    /**
     * Get cached data or fetch new data
     */
    async getCachedData(key, fetchFunction) {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }

        try {
            const data = await fetchFunction();
            this.cache.set(key, {
                data,
                timestamp: now
            });
            return data;
        } catch (error) {
            // Return cached data even if expired if fetch fails
            if (cached) {
                console.warn(`Using expired cache for ${key} due to fetch error:`, error);
                return cached.data;
            }
            throw error;
        }
    }

    /**
     * Get all market data with caching
     */
    async getAllMarketData() {
        try {
            const [
                comprehensive,
                indices,
                rates,
                currencies,
                commodities,
                indicators,
                sentiment,
                analysis,
                sectors
            ] = await Promise.allSettled([
                this.getComprehensiveMarketData(),
                this.getMajorIndices(),
                this.getInterestRates(),
                this.getCurrencyRates(),
                this.getCommodityPrices(),
                this.getEconomicIndicators(),
                this.getMarketSentiment(),
                this.getMarketAnalysis(),
                this.getSectorPerformance()
            ]);

            return {
                comprehensive: comprehensive.status === 'fulfilled' ? comprehensive.value : null,
                indices: indices.status === 'fulfilled' ? indices.value : null,
                rates: rates.status === 'fulfilled' ? rates.value : null,
                currencies: currencies.status === 'fulfilled' ? currencies.value : null,
                commodities: commodities.status === 'fulfilled' ? commodities.value : null,
                indicators: indicators.status === 'fulfilled' ? indicators.value : null,
                sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
                analysis: analysis.status === 'fulfilled' ? analysis.value : null,
                sectors: sectors.status === 'fulfilled' ? sectors.value : null,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching all market data:', error);
            throw error;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Market data cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const validEntries = entries.filter(([key, value]) => 
            (now - value.timestamp) < this.cacheTTL
        );

        return {
            totalEntries: entries.length,
            validEntries: validEntries.length,
            expiredEntries: entries.length - validEntries.length,
            cacheSize: this.cache.size
        };
    }

    /**
     * Format market data for dashboard display
     */
    formatMarketDataForDashboard(marketData) {
        if (!marketData) return null;

        const formatted = {
            overview: {},
            indices: [],
            rates: [],
            commodities: [],
            sentiment: {},
            analysis: {}
        };

        // Format indices
        if (marketData.indices?.indices) {
            formatted.indices = Object.entries(marketData.indices.indices).map(([symbol, data]) => ({
                symbol,
                price: data.price,
                change: data.change,
                changePercent: data.change_percent,
                volume: data.volume,
                marketCap: data.market_cap
            }));
        }

        // Format interest rates
        if (marketData.rates?.interest_rates) {
            formatted.rates = Object.entries(marketData.rates.interest_rates).map(([term, rate]) => ({
                term,
                rate: parseFloat(rate)
            }));
        }

        // Format commodities
        if (marketData.commodities?.commodities) {
            formatted.commodities = Object.entries(marketData.commodities.commodities).map(([symbol, price]) => ({
                symbol,
                price: parseFloat(price)
            }));
        }

        // Format sentiment
        if (marketData.sentiment?.sentiment) {
            formatted.sentiment = {
                vixLevel: marketData.sentiment.sentiment.vix_level,
                sentiment: marketData.sentiment.sentiment.sentiment,
                sentimentScore: marketData.sentiment.sentiment.sentiment_score,
                fearGreedIndex: marketData.sentiment.sentiment.fear_greed_index
            };
        }

        // Format analysis
        if (marketData.analysis?.analysis) {
            formatted.analysis = marketData.analysis.analysis;
        }

        return formatted;
    }

    /**
     * Get market overview summary
     */
    getMarketOverview(marketData) {
        if (!marketData) return null;

        const overview = {
            marketTrend: 'neutral',
            volatility: 'normal',
            sentiment: 'neutral',
            keyIndicators: []
        };

        // Determine market trend from indices
        if (marketData.indices?.indices) {
            const sp500 = marketData.indices.indices.SPY;
            if (sp500) {
                overview.marketTrend = sp500.change_percent > 0 ? 'bullish' : 'bearish';
                overview.keyIndicators.push({
                    name: 'S&P 500',
                    value: sp500.price,
                    change: sp500.change_percent,
                    trend: sp500.change_percent > 0 ? 'up' : 'down'
                });
            }
        }

        // Determine volatility from sentiment
        if (marketData.sentiment?.sentiment) {
            const vixLevel = marketData.sentiment.sentiment.vix_level;
            overview.volatility = vixLevel > 25 ? 'high' : vixLevel > 15 ? 'normal' : 'low';
            overview.sentiment = marketData.sentiment.sentiment.sentiment;
        }

        // Add interest rate environment
        if (marketData.rates?.interest_rates) {
            const tenYear = marketData.rates.interest_rates['10_year'];
            if (tenYear) {
                overview.keyIndicators.push({
                    name: '10-Year Treasury',
                    value: tenYear,
                    change: 0, // Would need historical data for change
                    trend: 'neutral'
                });
            }
        }

        return overview;
    }
}

// Create and export singleton instance
const marketDataService = new MarketDataService();
export default marketDataService; 