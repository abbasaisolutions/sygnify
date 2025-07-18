const fs = require('fs');
const path = require('path');

/**
 * Enhanced Smart Labeling Engine
 * Handles semantic labeling, data types, and importance scoring
 * Supports multiple domains with configurable field semantics
 */
class LabelService {
    constructor(domain = 'finance') {
        this.domain = domain;
        this.glossary = this.loadGlossary();
        this.domainConfig = this.loadDomainConfig();
        this.financialPatterns = {
            // Revenue patterns
            revenue: /revenue|sales|income|earnings/i,
            profit: /profit|margin|ebitda|ebit/i,
            cost: /cost|expense|expenditure/i,
            asset: /asset|capital|equity/i,
            debt: /debt|liability|loan/i,
            cash: /cash|flow|liquidity/i,
            ratio: /ratio|percentage|pct/i,
            date: /date|time|period/i,
            id: /id|identifier|code/i,
            category: /category|type|class/i
        };
    }

    loadGlossary() {
        try {
            const glossaryPath = path.join(__dirname, '../glossary.json');
            return JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
        } catch (error) {
            console.warn('Could not load glossary, using fallback:', error.message);
            return this.getFallbackGlossary();
        }
    }

    loadDomainConfig() {
        const configPath = path.join(__dirname, `../config/domains/${this.domain}.yaml`);
        try {
            // For now, return domain-specific configs as objects
            // TODO: Add YAML parsing when implementing
            return this.getDomainConfig(this.domain);
        } catch (error) {
            console.warn(`Could not load domain config for ${this.domain}:`, error.message);
            return this.getDefaultDomainConfig();
        }
    }

    getFallbackGlossary() {
        return {
            "transaction_id": "Transaction ID",
            "account_id": "Account ID", 
            "customer_name": "Customer Name",
            "transaction_date": "Transaction Date",
            "transaction_type": "Transaction Type",
            "amount": "Transaction Amount (Revenue/Expense)",
            "currency": "Currency",
            "description": "Description",
            "category": "Transaction Category",
            "current_balance": "Account Balance",
            "account_type": "Account Type",
            "merchant_name": "Merchant Name",
            "merchant_city": "Merchant City",
            "merchant_state": "Merchant State",
            "fraud_score": "Fraud Score",
            "is_fraud": "Fraud Indicator"
        };
    }

    getDomainConfig(domain) {
        const configs = {
            finance: {
                expectedFields: ['amount', 'balance', 'fraud_score', 'transaction_type'],
                importanceWeights: {
                    amount: 95,
                    balance: 90,
                    fraud_score: 85,
                    transaction_type: 80
                },
                dataTypes: {
                    amount: 'numeric',
                    balance: 'numeric',
                    fraud_score: 'numeric',
                    transaction_type: 'categorical'
                }
            },
            healthcare: {
                expectedFields: ['patient_id', 'diagnosis', 'treatment_cost', 'outcome'],
                importanceWeights: {
                    patient_id: 50,
                    diagnosis: 90,
                    treatment_cost: 85,
                    outcome: 95
                }
            },
            retail: {
                expectedFields: ['product_id', 'sales_amount', 'inventory', 'customer_id'],
                importanceWeights: {
                    product_id: 50,
                    sales_amount: 95,
                    inventory: 85,
                    customer_id: 70
                }
            }
        };
        return configs[domain] || configs.finance;
    }

    getDefaultDomainConfig() {
        return this.getDomainConfig('finance');
    }

    /**
     * Detect data type with robust validation
     * @param {Array} values - Array of values to analyze
     * @returns {string} - Data type: 'numeric', 'categorical', 'date', 'text'
     */
    detectDataType(values) {
        if (!values || values.length === 0) return 'unknown';

        // Check for dates (YYYY-MM-DD pattern)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (values.every(v => typeof v === 'string' && datePattern.test(v))) {
            return 'date';
        }

        // Check for numeric with robust conversion
        let numericCount = 0;
        for (const v of values) {
            if (typeof v === 'number') {
                numericCount++;
            } else if (typeof v === 'string') {
                try {
                    const num = parseFloat(v);
                    if (!isNaN(num)) {
                        numericCount++;
                    }
                } catch (e) {
                    // Not numeric
                }
            }
        }

        // If more than 80% of values are numeric, consider it numeric
        if (numericCount >= values.length * 0.8) {
            return 'numeric';
        }

        // Check for categorical (limited unique values)
        const uniqueCount = new Set(values.map(v => String(v))).size;
        if (uniqueCount <= Math.min(10, values.length / 2)) {
            return 'categorical';
        }

        return 'text';
    }

    /**
     * Extract semantic labels with prioritized glossary lookup
     * @param {Array} data - Array of data objects
     * @param {number} userId - Optional user ID for custom labels
     * @returns {Object} - Enhanced labels with semantic, category, importance, type
     */
    async extractLabels(data, userId = null) {
        if (!data || data.length === 0) {
            throw new Error('No data provided for labeling');
        }

        const labels = {};
        const columns = Object.keys(data[0]);
        
        // Identify categorical columns for cross-referencing
        const categoricalCols = {};
        for (const col of columns) {
            const values = data.map(row => row[col]).filter(v => v != null);
            const uniqueValues = new Set(values.map(v => String(v)));
            if (uniqueValues.size < 10) {
                categoricalCols[col] = Array.from(uniqueValues);
            }
        }

        for (const column of columns) {
            const values = data.map(row => row[column]).filter(v => v != null);
            const dataType = this.detectDataType(values);
            
            // 1. User feedback (highest priority)
            let semantic = await this.getUserLabel(userId, column);

            // 2. Glossary lookup (prioritized over cross-column inference)
            if (!semantic) {
                semantic = this.glossary[column];
            }

            // 3. Cross-column inference only if glossary lookup failed
            if (!semantic) {
                semantic = this.inferSemantic(column, values, dataType, categoricalCols, data);
            }

            // 4. Granular category assignment
            const category = this.assignCategory(semantic);

            // 5. Importance calculation with normalized [0-100] scale
            const importance = this.calculateImportance(column, data, values, dataType, semantic);

            labels[column] = {
                semantic: semantic,
                category: category,
                importance: importance, // Normalized 0-100 scale
                type: dataType,
                description: `Represents ${semantic} (${category}).`,
                confidence: this.calculateLabelConfidence(column, values, dataType, semantic)
            };
        }

        return labels;
    }

    /**
     * Calculate importance with normalized [0-100] scale and improved validation
     */
    calculateImportance(column, data, values, dataType, semantic) {
        // Base importance from domain config
        let importance = this.domainConfig.importanceWeights?.[column] || 70;

        // Adjust based on semantic label with improved accuracy
        const semanticWeights = {
            // Financial metrics
            'Transaction Amount (Revenue/Expense)': 95,
            'Revenue': 95,
            'Expense': 95,
            'Account Balance': 90,
            'Fraud Score': 85,
            'Fraud Indicator': 85,
            'Transaction Type': 80,
            'Transaction Category': 75,
            
            // Identifiers (lower importance)
            'Transaction ID': 30,
            'Account ID': 30,
            'Customer ID': 40,
            'Merchant ID': 35,
            
            // Temporal and metadata
            'Transaction Date': 60,
            'Currency': 70,
            'Merchant Name': 70,
            'Merchant City': 60,
            'Merchant State': 60,
            'Customer Name': 70,
            'Description': 65,
            'Account Type': 80,
            
            // Risk and compliance
            'Risk Score': 90,
            'Compliance Flag': 85,
            'Suspicious Activity': 90
        };

        if (semanticWeights[semantic]) {
            importance = semanticWeights[semantic];
        }

        // Adjust based on data variance (for numeric columns)
        if (dataType === 'numeric' && values.length > 0) {
            try {
                const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
                if (numericValues.length > 1) {
                    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
                    const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);
                    
                    // Higher variance = more interesting patterns = higher importance
                    const varianceBonus = Math.min(15, coefficientOfVariation * 8);
                    importance = Math.min(100, importance + varianceBonus);
                }
            } catch (e) {
                // Keep base importance
            }
        }

        // Adjust based on data completeness
        const completeness = values.length / data.length;
        importance = Math.round(importance * completeness);

        // Validate binary fields
        if (this.isBinaryField(column, values, dataType)) {
            // Binary fields like fraud indicators get moderate importance
            importance = Math.min(85, Math.max(60, importance));
        }

        return Math.max(0, Math.min(100, importance)); // Ensure 0-100 range
    }

    /**
     * Detect if a field is binary (0/1, true/false, yes/no)
     */
    isBinaryField(column, values, dataType) {
        // Check column name patterns
        const binaryPatterns = /^(is_|has_|flag_|binary_|bool_)/i;
        if (binaryPatterns.test(column)) {
            return true;
        }

        // Check value patterns
        const uniqueValues = new Set(values.map(v => String(v).toLowerCase()));
        const binaryValues = new Set(['0', '1', 'true', 'false', 'yes', 'no', 'y', 'n']);
        
        if (uniqueValues.size <= 2 && 
            Array.from(uniqueValues).every(v => binaryValues.has(v))) {
            return true;
        }

        return false;
    }

    /**
     * Improved semantic inference with better accuracy
     */
    inferSemantic(column, values, dataType, categoricalCols, data) {
        const columnLower = column.toLowerCase();
        
        // Check for binary fields first
        if (this.isBinaryField(column, values, dataType)) {
            if (columnLower.includes('fraud')) return 'Fraud Indicator';
            if (columnLower.includes('risk')) return 'Risk Indicator';
            if (columnLower.includes('flag')) return 'Compliance Flag';
            if (columnLower.includes('suspicious')) return 'Suspicious Activity';
            return 'Binary Indicator';
        }

        // Check for amount/transaction fields
        if (columnLower.includes('amount') || columnLower.includes('value') || columnLower.includes('sum')) {
            return this.inferAmountSemantic(values, categoricalCols, data);
        }

        // Check for balance fields
        if (columnLower.includes('balance') || columnLower.includes('current_balance')) {
            return 'Account Balance';
        }

        // Check for ID fields
        if (columnLower.includes('id') || columnLower.includes('identifier')) {
            if (columnLower.includes('transaction')) return 'Transaction ID';
            if (columnLower.includes('account')) return 'Account ID';
            if (columnLower.includes('customer')) return 'Customer ID';
            if (columnLower.includes('merchant')) return 'Merchant ID';
            return 'Identifier';
        }

        // Check for date/time fields
        if (columnLower.includes('date') || columnLower.includes('time') || columnLower.includes('created')) {
            return 'Transaction Date';
        }

        // Check for type/category fields
        if (columnLower.includes('type') || columnLower.includes('category')) {
            if (columnLower.includes('transaction')) return 'Transaction Type';
            if (columnLower.includes('account')) return 'Account Type';
            return 'Category';
        }

        // Check for location fields
        if (columnLower.includes('city') || columnLower.includes('state') || columnLower.includes('location')) {
            if (columnLower.includes('merchant')) {
                return columnLower.includes('city') ? 'Merchant City' : 'Merchant State';
            }
            return 'Location';
        }

        // Check for name fields
        if (columnLower.includes('name')) {
            if (columnLower.includes('merchant')) return 'Merchant Name';
            if (columnLower.includes('customer')) return 'Customer Name';
            return 'Name';
        }

        // Check for currency fields
        if (columnLower.includes('currency') || columnLower.includes('curr')) {
            return 'Currency';
        }

        // Check for description fields
        if (columnLower.includes('description') || columnLower.includes('desc') || columnLower.includes('note')) {
            return 'Description';
        }

        // Numeric inference
        if (dataType === 'numeric') {
            return this.inferNumericSemantic(values, categoricalCols);
        }

        // Default fallback
        return column.charAt(0).toUpperCase() + column.slice(1);
    }

    /**
     * Infer semantic for amount column based on transaction types
     */
    inferAmountSemantic(values, categoricalCols, data) {
        if ('transaction_type' in categoricalCols) {
            const transactionTypes = categoricalCols['transaction_type'];
            const revenueTypes = ['Deposit', 'Transfer', 'Credit'];
            const expenseTypes = ['Withdrawal', 'Purchase', 'Bill Pay', 'Debit'];
            
            const hasRevenue = revenueTypes.some(type => transactionTypes.includes(type));
            const hasExpense = expenseTypes.some(type => transactionTypes.includes(type));
            
            if (hasRevenue && hasExpense) {
                return 'Transaction Amount (Revenue/Expense)';
            } else if (hasRevenue) {
                return 'Revenue';
            } else if (hasExpense) {
                return 'Expense';
            }
        }

        // Value analysis
        if (values.length > 0) {
            try {
                const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
                if (numericValues.length > 0) {
                    const positiveCount = numericValues.filter(v => v > 0).length;
                    const negativeCount = numericValues.filter(v => v < 0).length;
                    
                    if (positiveCount > negativeCount) {
                        return 'Revenue';
                    } else if (negativeCount > positiveCount) {
                        return 'Expense';
                    }
                }
            } catch (e) {
                // Fallback
            }
        }

        return 'Transaction Amount';
    }

    /**
     * Infer semantic for numeric columns
     */
    inferNumericSemantic(values, categoricalCols) {
        try {
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (numericValues.length === 0) return 'Numeric Metric';

            const maxVal = Math.max(...numericValues);
            const meanVal = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

            // Check for ratios/percentages
            if (meanVal >= 0 && meanVal <= 1 && maxVal <= 1) {
                return 'Percentage/Ratio Metric';
            }

            // Cross-reference with categorical columns
            for (const [catCol, catValues] of Object.entries(categoricalCols)) {
                const catValuesLower = catValues.map(v => String(v).toLowerCase());
                
                if (catValuesLower.some(v => ['revenue', 'sales', 'income', 'deposit', 'transfer'].includes(v))) {
                    if (maxVal > 500) return 'Revenue';
                } else if (catValuesLower.some(v => ['expense', 'cost', 'expenditure', 'withdrawal', 'purchase'].includes(v))) {
                    if (maxVal > 500) return 'Expense';
                }
            }

            // Value-based heuristics
            if (maxVal > 1000) return 'Large Amount Metric';
            if (maxVal >= 100 && maxVal <= 500) return 'Medium Amount Metric';
            if (maxVal < 100) return 'Small Amount Metric';

            return 'Numeric Metric';
        } catch (e) {
            return 'Numeric Metric';
        }
    }

    /**
     * Assign granular categories
     */
    assignCategory(semantic) {
        const categories = {
            'Transaction ID': 'Identifier Metric',
            'Account ID': 'Identifier Metric',
            'Revenue': 'Revenue Metric',
            'Transaction Amount (Revenue/Expense)': 'Revenue Metric',
            'Expense': 'Expense Metric',
            'Account Balance': 'Liquidity Metric',
            'Transaction Date': 'Temporal Metric',
            'Transaction Type': 'Transaction Type',
            'Currency': 'Currency Metric',
            'Transaction Category': 'Transaction Category',
            'Fraud Score': 'Risk Metric',
            'Fraud Indicator': 'Risk Metric',
            'Merchant Name': 'Merchant Metric',
            'Merchant City': 'Merchant Metric',
            'Merchant State': 'Merchant Metric',
            'Customer Name': 'Customer Metric',
            'Description': 'Description Metric',
            'Account Type': 'Account Type'
        };

        return categories[semantic] || 'General Metric';
    }

    /**
     * Calculate confidence in the label assignment
     */
    calculateLabelConfidence(column, values, dataType, semantic) {
        let confidence = 70; // Base confidence

        // Higher confidence for exact glossary matches
        if (this.glossary[column]) {
            confidence = 95;
        }

        // Higher confidence for clear data types
        if (dataType === 'numeric' && values.length > 0) {
            const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (numericValues.length / values.length > 0.9) {
                confidence += 10;
            }
        }

        // Lower confidence for generic labels
        if (semantic === column.charAt(0).toUpperCase() + column.slice(1)) {
            confidence -= 20;
        }

        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * Get user-specific label (placeholder for future implementation)
     */
    async getUserLabel(userId, column) {
        // TODO: Implement user feedback system
        return null;
    }

    /**
     * Validate labels for consistency
     */
    validateLabels(labels) {
        const issues = [];
        
        for (const [column, label] of Object.entries(labels)) {
            // Check for missing required fields
            if (!label.semantic || !label.type || label.importance === undefined) {
                issues.push(`Missing required fields for column: ${column}`);
            }

            // Check for invalid importance values
            if (label.importance < 0 || label.importance > 100) {
                issues.push(`Invalid importance value for ${column}: ${label.importance}`);
            }

            // Check for type inconsistencies
            if (label.type === 'numeric' && label.semantic.includes('ID')) {
                issues.push(`Potential type mismatch: ${column} marked as numeric but labeled as ID`);
            }
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
}

module.exports = LabelService; 