import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';

class MarketDataService {
    constructor() {
        this.baseURL = ENDPOINTS.marketComprehensive.replace('/comprehensive', '');
        this.cache = new Map();
        
        // Different cache TTLs for different data types
        this.cacheTTLs = {
            realtime: 5 * 60 * 1000, // 5 minutes for real-time data
            domain: 60 * 60 * 1000, // 1 hour for domain-specific data
            analysis: 30 * 60 * 1000, // 30 minutes for analysis
            fallback: 24 * 60 * 60 * 1000 // 24 hours for fallback data
        };
        
        // Fallback data for when APIs are unavailable
        this.fallbackData = this.initializeFallbackData();
    }

    /**
     * Initialize fallback data for when APIs are unavailable
     */
    initializeFallbackData() {
        return {
            comprehensive: {
                data_available: true,
                data_source: 'fallback',
                apis_connected: 0,
                total_apis: 8,
                success_rate: '0%',
                timestamp: new Date().toISOString(),
                message: 'Using cached data - APIs temporarily unavailable',
                indices: {
                    'SPY': { price: 450.25, change: 2.15, change_percent: 0.48, volume: 45000000 },
                    'QQQ': { price: 380.50, change: -1.20, change_percent: -0.31, volume: 35000000 },
                    'IWM': { price: 185.75, change: 0.85, change_percent: 0.46, volume: 25000000 }
                },
                interest_rates: {
                    '1_month': 5.25,
                    '3_month': 5.30,
                    '6_month': 5.35,
                    '1_year': 5.40,
                    '2_year': 5.45,
                    '5_year': 5.50,
                    '10_year': 5.55,
                    '30_year': 5.60
                },
                sentiment: {
                    vix_level: 18.5,
                    sentiment: 'neutral',
                    sentiment_score: 0.5,
                    fear_greed_index: 0.55
                },
                commodities: {
                    'GC': 1950.50, // Gold
                    'CL': 75.25,   // Crude Oil
                    'SI': 24.80,   // Silver
                    'PL': 950.00,  // Platinum
                    'PA': 1200.00  // Palladium
                },
                analysis: {
                    recommendations: [
                        'Market showing moderate volatility with neutral sentiment',
                        'Consider defensive positioning in high-valuation sectors',
                        'Monitor interest rate environment for portfolio adjustments'
                    ]
                }
            },
            indices: {
                indices: {
                    'SPY': { price: 450.25, change: 2.15, change_percent: 0.48, volume: 45000000 },
                    'QQQ': { price: 380.50, change: -1.20, change_percent: -0.31, volume: 35000000 },
                    'IWM': { price: 185.75, change: 0.85, change_percent: 0.46, volume: 25000000 }
                }
            },
            sentiment: {
                sentiment: {
                    vix_level: 18.5,
                    sentiment: 'neutral',
                    sentiment_score: 0.5,
                    fear_greed_index: 0.55
                }
            },
            rates: {
                interest_rates: {
                    '1_month': 5.25,
                    '3_month': 5.30,
                    '6_month': 5.35,
                    '1_year': 5.40,
                    '2_year': 5.45,
                    '5_year': 5.50,
                    '10_year': 5.55,
                    '30_year': 5.60
                }
            },
            commodities: {
                commodities: {
                    'GC': 1950.50, // Gold
                    'CL': 75.25,   // Crude Oil
                    'SI': 24.80,   // Silver
                    'PL': 950.00,  // Platinum
                    'PA': 1200.00  // Palladium
                }
            },
            analysis: {
                analysis: {
                    recommendations: [
                        'Market showing moderate volatility with neutral sentiment',
                        'Consider defensive positioning in high-valuation sectors',
                        'Monitor interest rate environment for portfolio adjustments'
                    ]
                }
            }
        };
    }

    /**
     * Get cache TTL for specific data type
     */
    getCacheTTL(dataType = 'domain') {
        return this.cacheTTLs[dataType] || this.cacheTTLs.domain;
    }

    /**
     * Get cached data or fetch new data with improved error handling
     */
    async getCachedData(key, fetchFunction, dataType = 'domain') {
        const cached = this.cache.get(key);
        const now = Date.now();
        const ttl = this.getCacheTTL(dataType);

        // Return valid cached data
        if (cached && (now - cached.timestamp) < ttl) {
            console.log(`📦 Using cached ${dataType} data for ${key}`);
            return cached.data;
        }

        try {
            console.log(`🔄 Fetching fresh ${dataType} data for ${key}`);
            const data = await fetchFunction();
            
            // Cache the successful response
            this.cache.set(key, {
                data,
                timestamp: now,
                dataType
            });
            
            return data;
        } catch (error) {
            console.warn(`⚠️ API error for ${key}:`, error.message);
            
            // Return cached data even if expired if fetch fails
            if (cached) {
                console.log(`📦 Using expired cache for ${key} due to API error`);
                return {
                    ...cached.data,
                    _cached: true,
                    _cacheAge: Math.round((now - cached.timestamp) / 1000 / 60) // minutes
                };
            }
            
            // Return fallback data if no cache available
            console.log(`🛡️ Using fallback data for ${key}`);
            return this.getFallbackData(key);
        }
    }

    /**
     * Get fallback data for specific endpoint
     */
    getFallbackData(key) {
        const fallbackMap = {
            'comprehensive': this.fallbackData.comprehensive,
            'indices': this.fallbackData.indices,
            'sentiment': this.fallbackData.sentiment,
            'rates': this.fallbackData.rates,
            'commodities': this.fallbackData.commodities,
            'analysis': this.fallbackData.analysis
        };
        
        return fallbackMap[key] || null;
    }

    /**
     * Get comprehensive market data with enhanced caching
     */
    async getComprehensiveMarketData() {
        return this.getCachedData(
            'comprehensive',
            async () => {
                const response = await axios.get(ENDPOINTS.marketComprehensive);
                // The API returns { market_data: {...}, status: "success" }
                // We need to extract the market_data and add data_available flag
                const data = response.data.market_data || response.data;
                return {
                    data_available: true,
                    data_source: 'real_apis',
                    apis_connected: 1,
                    total_apis: 1,
                    success_rate: '100%',
                    timestamp: new Date().toISOString(),
                    ...data
                };
            },
            'domain'
        );
    }

    /**
     * Get major market indices with caching
     */
    async getMajorIndices() {
        return this.getCachedData(
            'indices',
            async () => {
                const response = await axios.get(ENDPOINTS.marketIndices);
                // Handle the response structure
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get interest rates with caching
     */
    async getInterestRates() {
        return this.getCachedData(
            'rates',
            async () => {
                const response = await axios.get(ENDPOINTS.marketInterestRates);
                // Handle the response structure
                return response.data;
            },
            'domain'
        );
    }

    /**
     * Get currency exchange rates with caching
     */
    async getCurrencyRates(baseCurrency = 'USD') {
        return this.getCachedData(
            `currencies_${baseCurrency}`,
            async () => {
                const response = await axios.get(`${ENDPOINTS.marketCurrencies}?base_currency=${baseCurrency}`);
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get commodity prices with caching
     */
    async getCommodityPrices() {
        return this.getCachedData(
            'commodities',
            async () => {
                const response = await axios.get(ENDPOINTS.marketCommodities);
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get economic indicators with caching
     */
    async getEconomicIndicators() {
        return this.getCachedData(
            'indicators',
            async () => {
                const response = await axios.get(ENDPOINTS.marketEconomicIndicators);
                return response.data;
            },
            'domain'
        );
    }

    /**
     * Get market sentiment with caching
     */
    async getMarketSentiment() {
        return this.getCachedData(
            'sentiment',
            async () => {
                const response = await axios.get(ENDPOINTS.marketSentiment);
                return response.data;
            },
            'domain'
        );
    }

    /**
     * Get market analysis with caching
     */
    async getMarketAnalysis() {
        return this.getCachedData(
            'analysis',
            async () => {
                const response = await axios.get(ENDPOINTS.marketAnalysis);
                return response.data;
            },
            'analysis'
        );
    }

    /**
     * Get sector performance with caching
     */
    async getSectorPerformance() {
        return this.getCachedData(
            'sectors',
            async () => {
                const response = await axios.get(ENDPOINTS.marketSectors);
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get stock price for a specific symbol with caching
     */
    async getStockPrice(symbol) {
        return this.getCachedData(
            `stock_${symbol}`,
            async () => {
                const response = await axios.get(ENDPOINTS.marketStock(symbol));
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get watchlist data for multiple symbols with caching
    */
    async getWatchlistData(symbols) {
        const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
        return this.getCachedData(
            `watchlist_${symbolsParam}`,
            async () => {
                const response = await axios.get(ENDPOINTS.marketWatchlist(symbolsParam));
                return response.data;
            },
            'realtime'
        );
    }

    /**
     * Get all market data with enhanced caching and error handling
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

            const result = {
                comprehensive: comprehensive.status === 'fulfilled' ? comprehensive.value : null,
                indices: indices.status === 'fulfilled' ? indices.value : null,
                rates: rates.status === 'fulfilled' ? rates.value : null,
                currencies: currencies.status === 'fulfilled' ? currencies.value : null,
                commodities: commodities.status === 'fulfilled' ? commodities.value : null,
                indicators: indicators.status === 'fulfilled' ? indicators.value : null,
                sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
                analysis: analysis.status === 'fulfilled' ? analysis.value : null,
                sectors: sectors.status === 'fulfilled' ? sectors.value : null,
                timestamp: new Date().toISOString(),
                cacheInfo: this.getCacheInfo()
            };

            // Add cache status to comprehensive data
            if (result.comprehensive) {
                result.comprehensive.cacheStatus = this.getCacheStatus();
            }

            return result;
        } catch (error) {
            console.error('Error fetching all market data:', error);
            throw error;
        }
    }

    /**
     * Get cache information
     */
    getCacheInfo() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        
        const cacheStats = {
            totalEntries: entries.length,
            byType: {},
            oldestEntry: null,
            newestEntry: null
        };

        entries.forEach(([key, value]) => {
            const age = now - value.timestamp;
            const dataType = value.dataType || 'unknown';
            
            if (!cacheStats.byType[dataType]) {
                cacheStats.byType[dataType] = { count: 0, totalAge: 0 };
            }
            
            cacheStats.byType[dataType].count++;
            cacheStats.byType[dataType].totalAge += age;
            
            if (!cacheStats.oldestEntry || age > (now - cacheStats.oldestEntry.timestamp)) {
                cacheStats.oldestEntry = { key, age: Math.round(age / 1000 / 60) };
            }
            
            if (!cacheStats.newestEntry || age < (now - cacheStats.newestEntry.timestamp)) {
                cacheStats.newestEntry = { key, age: Math.round(age / 1000 / 60) };
            }
        });

        return cacheStats;
    }

    /**
     * Get cache status for display
     */
    getCacheStatus() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const validEntries = entries.filter(([key, value]) => {
            const ttl = this.getCacheTTL(value.dataType || 'domain');
            return (now - value.timestamp) < ttl;
        });

        return {
            totalCached: entries.length,
            validCached: validEntries.length,
            cacheHitRate: entries.length > 0 ? (validEntries.length / entries.length * 100).toFixed(1) : 0,
            lastUpdated: entries.length > 0 ? new Date(Math.max(...entries.map(([key, value]) => value.timestamp))) : null
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Market data cache cleared');
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        let clearedCount = 0;

        entries.forEach(([key, value]) => {
            const ttl = this.getCacheTTL(value.dataType || 'domain');
            if ((now - value.timestamp) >= ttl) {
                this.cache.delete(key);
                clearedCount++;
            }
        });

        if (clearedCount > 0) {
            console.log(`🧹 Cleared ${clearedCount} expired cache entries`);
        }

        return clearedCount;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const validEntries = entries.filter(([key, value]) => {
            const ttl = this.getCacheTTL(value.dataType || 'domain');
            return (now - value.timestamp) < ttl;
        });

        return {
            totalEntries: entries.length,
            validEntries: validEntries.length,
            expiredEntries: entries.length - validEntries.length,
            cacheSize: this.cache.size,
            cacheInfo: this.getCacheInfo()
        };
    }

    /**
     * Manually refresh all cached data
     */
    async refreshAllData() {
        console.log('🔄 Manually refreshing all market data...');
        this.clearCache();
        
        try {
            const data = await this.getAllMarketData();
            console.log('✅ All market data refreshed successfully');
            return data;
        } catch (error) {
            console.error('❌ Error refreshing market data:', error);
            throw error;
        }
    }

    /**
     * Refresh specific data type
     */
    async refreshDataType(dataType) {
        console.log(`🔄 Refreshing ${dataType} data...`);
        
        // Clear specific cache entries
        const entries = Array.from(this.cache.entries());
        entries.forEach(([key, value]) => {
            if (value.dataType === dataType) {
                this.cache.delete(key);
            }
        });
        
        // Fetch fresh data
        try {
            const data = await this.getAllMarketData();
            console.log(`✅ ${dataType} data refreshed successfully`);
            return data;
        } catch (error) {
            console.error(`❌ Error refreshing ${dataType} data:`, error);
            throw error;
        }
    }

    /**
     * Get cache health status
     */
    getCacheHealth() {
        const stats = this.getCacheStats();
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        
        const health = {
            status: 'healthy',
            message: 'Cache is functioning normally',
            recommendations: []
        };
        
        // Check cache hit rate
        if (stats.validEntries > 0 && stats.totalEntries > 0) {
            const hitRate = (stats.validEntries / stats.totalEntries) * 100;
            if (hitRate < 50) {
                health.status = 'warning';
                health.message = 'Low cache hit rate detected';
                health.recommendations.push('Consider adjusting cache TTL settings');
            }
        }
        
        // Check for expired entries
        if (stats.expiredEntries > stats.validEntries) {
            health.status = 'warning';
            health.message = 'High number of expired cache entries';
            health.recommendations.push('Consider running cache cleanup');
        }
        
        // Check cache size
        if (stats.totalEntries > 100) {
            health.status = 'warning';
            health.message = 'Large cache size detected';
            health.recommendations.push('Consider clearing old cache entries');
        }
        
        return health;
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