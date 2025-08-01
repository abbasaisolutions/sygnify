import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';

class RetailDataService {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/retail';  // Use retail endpoints
        this.cache = new Map();
        
        // Cache TTLs for different data types
        this.cacheTTLs = {
            analytics: 30 * 60 * 1000, // 30 minutes for analytics
            performance: 15 * 60 * 1000, // 15 minutes for performance data
            realtime: 5 * 60 * 1000, // 5 minutes for real-time data
            reports: 60 * 60 * 1000 // 1 hour for reports
        };
    }

    /**
     * Get comprehensive retail analytics
     */
    async getRetailAnalytics() {
        const cacheKey = 'retail_analytics';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            console.log('🛍️ Using cached retail analytics');
            return cached;
        }

        try {
            // Fetch from multiple retail endpoints
            const [performanceResponse, customerResponse, inventoryResponse, supplyChainResponse] = await Promise.allSettled([
                axios.get(`${this.baseURL}/performance-report`),
                axios.get(`${this.baseURL}/customer-analysis`, { data: { source: 'dashboard' } }),
                axios.get(`${this.baseURL}/inventory-analysis`, { data: { source: 'dashboard' } }),
                axios.get(`${this.baseURL}/supply-chain-analysis`, { data: { source: 'dashboard' } })
            ]);

            const analytics = {
                performance: performanceResponse.status === 'fulfilled' ? performanceResponse.value.data : null,
                customer: customerResponse.status === 'fulfilled' ? customerResponse.value.data : null,
                inventory: inventoryResponse.status === 'fulfilled' ? inventoryResponse.value.data : null,
                supply_chain: supplyChainResponse.status === 'fulfilled' ? supplyChainResponse.value.data : null,
                timestamp: new Date().toISOString(),
                source: 'api'
            };

            this.setCache(cacheKey, analytics, this.cacheTTLs.analytics);
            return analytics;

        } catch (error) {
            console.error('❌ Error fetching retail analytics:', error);
            return this.getFallbackRetailData();
        }
    }

    /**
     * Refresh all retail data
     */
    async refreshRetailData() {
        this.clearCache();
        return await this.getRetailAnalytics();
    }

    /**
     * Get customer analytics
     */
    async getCustomerAnalytics(analysisData = null) {
        const cacheKey = 'customer_analytics';
        const cached = this.getFromCache(cacheKey);
        
        if (cached && !analysisData) {
            return cached;
        }

        try {
            const response = await axios.post(`${this.baseURL}/customer-analysis`, {
                records: analysisData || []
            });
            
            const data = response.data;
            this.setCache(cacheKey, data, this.cacheTTLs.analytics);
            return data;

        } catch (error) {
            console.error('❌ Error fetching customer analytics:', error);
            throw error;
        }
    }

    /**
     * Get sales performance data
     */
    async getSalesPerformance(analysisData = null) {
        try {
            const response = await axios.post(`${this.baseURL}/sales-performance`, {
                records: analysisData || []
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching sales performance:', error);
            throw error;
        }
    }

    /**
     * Get inventory analytics
     */
    async getInventoryAnalytics(analysisData = null) {
        try {
            const response = await axios.post(`${this.baseURL}/inventory-analysis`, {
                records: analysisData || []
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching inventory analytics:', error);
            throw error;
        }
    }

    /**
     * Get retail insights using AI
     */
    async getRetailInsights(analysisData) {
        try {
            const response = await axios.post(`${this.baseURL}/retail-insights`, {
                records: analysisData,
                domain: 'retail'
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching retail insights:', error);
            throw error;
        }
    }

    /**
     * Get performance report
     */
    async getPerformanceReport() {
        const cacheKey = 'performance_report';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.baseURL}/performance-report`);
            const data = response.data;
            
            this.setCache(cacheKey, data, this.cacheTTLs.performance);
            return data;
        } catch (error) {
            console.error('❌ Error fetching performance report:', error);
            return { performance_report: {}, timestamp: new Date().toISOString() };
        }
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data, ttl) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    clearCache() {
        this.cache.clear();
    }

    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Fallback data when API is unavailable - retail focused, not dummy data
     */
    getFallbackRetailData() {
        return {
            message: 'Retail analytics will be displayed once your data is uploaded and analyzed',
            data_available: false,
            source: 'no_data',
            timestamp: new Date().toISOString(),
            retail_metrics: {
                note: 'Upload your retail data to see customer analytics, sales performance, inventory insights, and supply chain metrics'
            },
            suggestions: [
                'Upload CSV files with customer transaction data',
                'Include columns: customer_id, product_id, transaction_date, quantity, price',
                'Optional: category, supplier, inventory_on_hand for deeper insights'
            ]
        };
    }

    /**
     * Validate retail data structure
     */
    validateRetailData(data) {
        const requiredFields = ['customer_id', 'product_id', 'transaction_date'];
        const optionalFields = ['quantity_sold', 'unit_price', 'total_revenue', 'category', 'supplier'];
        
        if (!Array.isArray(data) || data.length === 0) {
            return {
                valid: false,
                message: 'Data must be a non-empty array of records'
            };
        }

        const firstRecord = data[0];
        const availableFields = Object.keys(firstRecord);
        const missingRequired = requiredFields.filter(field => 
            !availableFields.some(available => 
                available.toLowerCase().includes(field.toLowerCase())
            )
        );

        if (missingRequired.length > 0) {
            return {
                valid: false,
                message: `Missing required fields: ${missingRequired.join(', ')}`,
                missing_fields: missingRequired,
                available_fields: availableFields
            };
        }

        return {
            valid: true,
            message: 'Data structure is valid for retail analysis',
            available_fields: availableFields,
            record_count: data.length
        };
    }

    /**
     * Get retail KPI benchmarks
     */
    getRetailBenchmarks() {
        return {
            conversion_rates: {
                'e_commerce': 2.5,
                'fashion': 1.8,
                'electronics': 3.2,
                'grocery': 85.0,
                'home_garden': 1.9
            },
            inventory_turnover: {
                'fashion': 4.0,
                'electronics': 8.0,
                'grocery': 12.0,
                'furniture': 2.5
            },
            customer_metrics: {
                'retention_rate': 80.0,
                'avg_order_value': 75.0,
                'customer_lifetime_value': 500.0
            },
            supply_chain: {
                'on_time_delivery': 95.0,
                'lead_time_days': 14,
                'quality_score': 98.0
            }
        };
    }

    /**
     * Generate retail insights summary
     */
    generateInsightsSummary(retailData) {
        if (!retailData || !retailData.retail_analytics) {
            return {
                summary: 'Upload your retail data to generate comprehensive insights',
                insights_available: false
            };
        }

        const analytics = retailData.retail_analytics;
        const insights = [];
        
        // Revenue insights
        if (analytics.total_revenue) {
            insights.push(`Total revenue: ${analytics.total_revenue}`);
        }
        
        // Customer insights
        if (analytics.customer_count) {
            insights.push(`${analytics.customer_count} active customers analyzed`);
        }
        
        // Performance insights
        if (analytics.retail_health_score) {
            const score = analytics.retail_health_score;
            const health = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs improvement';
            insights.push(`Overall retail health: ${health} (${score}/100)`);
        }

        return {
            summary: insights.length > 0 ? insights.join('. ') + '.' : 'Analyzing your retail data...',
            insights_available: insights.length > 0,
            insights_count: insights.length
        };
    }

    /**
     * Export retail report
     */
    async exportRetailReport(format = 'pdf') {
        try {
            const response = await axios.get(`${this.baseURL}/export-report`, {
                params: { format },
                responseType: 'blob'
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Error exporting retail report:', error);
            throw error;
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            total_items: this.cache.size,
            cache_keys: Array.from(this.cache.keys()),
            memory_usage: this.cache.size * 1024 // Rough estimate
        };
    }
}

// Create singleton instance
const retailDataService = new RetailDataService();

export default retailDataService;