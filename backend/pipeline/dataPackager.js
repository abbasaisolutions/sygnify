const Ajv = require('ajv');

/**
 * Data Packager
 * Prepares and validates data for ML engine consumption
 */
class DataPackager {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.inputSchema = this.createInputSchema();
    this.validate = this.ajv.compile(this.inputSchema);
    this.transformers = this.initializeTransformers();
  }

  /**
     * Create input schema for ML engine
     * @returns {Object} - JSON schema for input validation
     */
  createInputSchema() {
    return {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: 'Transaction amount (positive or negative)',
              },
              date: {
                type: 'string',
                format: 'date-time',
                description: 'Transaction date in ISO format',
              },
              merchant: {
                type: 'string',
                description: 'Merchant name or identifier',
              },
              category: {
                type: 'string',
                description: 'Transaction category',
              },
              transaction_id: {
                type: 'string',
                description: 'Unique transaction identifier',
              },
              description: {
                type: 'string',
                description: 'Transaction description',
              },
              location: {
                type: 'string',
                description: 'Transaction location',
              },
              payment_method: {
                type: 'string',
                description: 'Payment method used',
              },
              status: {
                type: 'string',
                enum: ['completed', 'pending', 'failed', 'cancelled'],
                description: 'Transaction status',
              },
            },
            required: ['amount', 'date', 'merchant', 'category'],
          },
          minItems: 1,
          description: 'Array of transaction records',
        },
        metadata: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'Data source identifier',
            },
            format: {
              type: 'string',
              description: 'Original data format',
            },
            recordCount: {
              type: 'number',
              description: 'Total number of records',
            },
            dateRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  format: 'date-time',
                },
                end: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Currency code',
            },
          },
        },
      },
      required: ['transactions'],
    };
  }

  /**
     * Initialize data transformers
     * @returns {Object} - Transformers for different data formats
     */
  initializeTransformers() {
    return {
      csv: this.createCSVTransformer(),
      excel: this.createExcelTransformer(),
      json: this.createJSONTransformer(),
      xml: this.createXMLTransformer(),
      parquet: this.createParquetTransformer(),
      googleSheets: this.createGoogleSheetsTransformer(),
    };
  }

  /**
     * Package data for ML engine consumption
     * @param {Object} rawData - Raw input data
     * @param {Object} options - Packaging options
     * @returns {Promise<Object>} - Packaged data ready for ML engine
     */
  async packageData(rawData, options = {}) {
    const startTime = Date.now();

    try {
      console.log('📦 Packaging data for ML engine...');

      // Determine data format and apply appropriate transformer
      const format = options.format || this.detectFormat(rawData);
      const transformer = this.transformers[format];

      if (!transformer) {
        throw new Error(`Unsupported data format: ${format}`);
      }

      // Transform raw data to standard format
      const transformedData = await transformer.transform(rawData, options);

      // Validate transformed data
      const isValid = this.validate(transformedData);

      if (!isValid) {
        const errors = this.validate.errors.map((err) => `${err.instancePath} ${err.message}`).join(', ');

        throw new Error(`Data validation failed: ${errors}`);
      }

      // Apply data quality checks
      const qualityReport = this.checkDataQuality(transformedData);

      // Apply data enrichment if requested
      let enrichedData = transformedData;
      if (options.enrich) {
        enrichedData = await this.enrichData(transformedData, options);
      }

      // Apply data filtering if requested
      if (options.filter) {
        enrichedData = this.filterData(enrichedData, options.filter);
      }

      // Apply data aggregation if requested
      if (options.aggregate) {
        enrichedData = this.aggregateData(enrichedData, options.aggregate);
      }

      const packagingTime = Date.now() - startTime;

      console.log(`✅ Data packaged in ${packagingTime}ms`);

      return {
        success: true,
        data: enrichedData,
        metadata: {
          format,
          originalRecordCount: rawData.length || rawData.transactions?.length || 0,
          packagedRecordCount: enrichedData.transactions.length,
          packagingTime,
          qualityReport,
          options,
        },
      };
    } catch (error) {
      console.error('❌ Data packaging failed:', error.message);
      throw error;
    }
  }

  /**
     * Create CSV transformer
     * @returns {Object} - CSV transformer
     */
  createCSVTransformer() {
    return {
      transform: async (rawData, options) => {
        // CSV data is typically already parsed as array of objects
        const transactions = rawData.map((row, index) => ({
          amount: this.parseAmount(row.amount || row.Amount || row.AMOUNT),
          date: this.parseDate(row.date || row.Date || row.DATE),
          merchant: row.merchant || row.Merchant || row.MERCHANT || row.vendor || row.Vendor,
          category: row.category || row.Category || row.CATEGORY || row.type || row.Type,
          transaction_id: row.transaction_id || row.id || row.ID || `TXN_${index}`,
          description: row.description || row.Description || row.DESC || '',
          location: row.location || row.Location || row.LOC || '',
          payment_method: row.payment_method || row.payment || row.Payment || '',
          status: row.status || row.Status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'csv',
            format: 'csv',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Create Excel transformer
     * @returns {Object} - Excel transformer
     */
  createExcelTransformer() {
    return {
      transform: async (rawData, options) => {
        // Excel data is typically already parsed as array of objects
        const transactions = rawData.map((row, index) => ({
          amount: this.parseAmount(row.amount || row.Amount || row.AMOUNT),
          date: this.parseDate(row.date || row.Date || row.DATE),
          merchant: row.merchant || row.Merchant || row.MERCHANT || row.vendor || row.Vendor,
          category: row.category || row.Category || row.CATEGORY || row.type || row.Type,
          transaction_id: row.transaction_id || row.id || row.ID || `TXN_${index}`,
          description: row.description || row.Description || row.DESC || '',
          location: row.location || row.Location || row.LOC || '',
          payment_method: row.payment_method || row.payment || row.Payment || '',
          status: row.status || row.Status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'excel',
            format: 'excel',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Create JSON transformer
     * @returns {Object} - JSON transformer
     */
  createJSONTransformer() {
    return {
      transform: async (rawData, options) => {
        // JSON data might already be in the correct format
        if (rawData.transactions) {
          return {
            transactions: rawData.transactions.map((txn, index) => ({
              ...txn,
              transaction_id: txn.transaction_id || txn.id || `TXN_${index}`,
              amount: this.parseAmount(txn.amount),
              date: this.parseDate(txn.date),
            })),
            metadata: {
              source: options.source || 'json',
              format: 'json',
              recordCount: rawData.transactions.length,
              currency: options.currency || 'USD',
            },
          };
        }

        // If rawData is an array, treat as transactions
        const transactions = rawData.map((txn, index) => ({
          amount: this.parseAmount(txn.amount),
          date: this.parseDate(txn.date),
          merchant: txn.merchant || txn.vendor || '',
          category: txn.category || txn.type || '',
          transaction_id: txn.transaction_id || txn.id || `TXN_${index}`,
          description: txn.description || '',
          location: txn.location || '',
          payment_method: txn.payment_method || txn.payment || '',
          status: txn.status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'json',
            format: 'json',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Create XML transformer
     * @returns {Object} - XML transformer
     */
  createXMLTransformer() {
    return {
      transform: async (rawData, options) => {
        // XML data is typically already parsed as array of objects
        const transactions = rawData.map((row, index) => ({
          amount: this.parseAmount(row.amount || row.Amount || row.AMOUNT),
          date: this.parseDate(row.date || row.Date || row.DATE),
          merchant: row.merchant || row.Merchant || row.MERCHANT || row.vendor || row.Vendor,
          category: row.category || row.Category || row.CATEGORY || row.type || row.Type,
          transaction_id: row.transaction_id || row.id || row.ID || `TXN_${index}`,
          description: row.description || row.Description || row.DESC || '',
          location: row.location || row.Location || row.LOC || '',
          payment_method: row.payment_method || row.payment || row.Payment || '',
          status: row.status || row.Status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'xml',
            format: 'xml',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Create Parquet transformer
     * @returns {Object} - Parquet transformer
     */
  createParquetTransformer() {
    return {
      transform: async (rawData, options) => {
        // Parquet data is typically already parsed as array of objects
        const transactions = rawData.map((row, index) => ({
          amount: this.parseAmount(row.amount || row.Amount || row.AMOUNT),
          date: this.parseDate(row.date || row.Date || row.DATE),
          merchant: row.merchant || row.Merchant || row.MERCHANT || row.vendor || row.Vendor,
          category: row.category || row.Category || row.CATEGORY || row.type || row.Type,
          transaction_id: row.transaction_id || row.id || row.ID || `TXN_${index}`,
          description: row.description || row.Description || row.DESC || '',
          location: row.location || row.Location || row.LOC || '',
          payment_method: row.payment_method || row.payment || row.Payment || '',
          status: row.status || row.Status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'parquet',
            format: 'parquet',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Create Google Sheets transformer
     * @returns {Object} - Google Sheets transformer
     */
  createGoogleSheetsTransformer() {
    return {
      transform: async (rawData, options) => {
        // Google Sheets data is typically already parsed as array of objects
        const transactions = rawData.map((row, index) => ({
          amount: this.parseAmount(row.amount || row.Amount || row.AMOUNT),
          date: this.parseDate(row.date || row.Date || row.DATE),
          merchant: row.merchant || row.Merchant || row.MERCHANT || row.vendor || row.Vendor,
          category: row.category || row.Category || row.CATEGORY || row.type || row.Type,
          transaction_id: row.transaction_id || row.id || row.ID || `TXN_${index}`,
          description: row.description || row.Description || row.DESC || '',
          location: row.location || row.Location || row.LOC || '',
          payment_method: row.payment_method || row.payment || row.Payment || '',
          status: row.status || row.Status || 'completed',
        }));

        return {
          transactions,
          metadata: {
            source: options.source || 'google_sheets',
            format: 'google_sheets',
            recordCount: transactions.length,
            currency: options.currency || 'USD',
          },
        };
      },
    };
  }

  /**
     * Detect data format
     * @param {Object} rawData - Raw data
     * @returns {string} - Detected format
     */
  detectFormat(rawData) {
    if (Array.isArray(rawData)) {
      if (rawData.length === 0) return 'json';

      const firstItem = rawData[0];
      if (typeof firstItem === 'object') {
        // Check for common CSV/Excel headers
        const keys = Object.keys(firstItem);
        if (keys.some((key) => key.toLowerCase().includes('amount'))) {
          return 'csv';
        }
        return 'json';
      }
    }

    if (rawData.transactions) {
      return 'json';
    }

    return 'json'; // Default fallback
  }

  /**
     * Parse amount value
     * @param {any} amount - Amount value
     * @returns {number} - Parsed amount
     */
  parseAmount(amount) {
    if (amount === null || amount === undefined) return 0;

    if (typeof amount === 'number') return amount;

    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      const cleaned = amount.replace(/[$,€£¥]/g, '').replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  /**
     * Parse date value
     * @param {any} date - Date value
     * @returns {string} - ISO date string
     */
  parseDate(date) {
    if (!date) return new Date().toISOString();

    if (typeof date === 'string') {
      // Try to parse various date formats
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    if (date instanceof Date) {
      return date.toISOString();
    }

    return new Date().toISOString();
  }

  /**
     * Check data quality
     * @param {Object} data - Packaged data
     * @returns {Object} - Quality report
     */
  checkDataQuality(data) {
    const { transactions } = data;

    const totalRecords = transactions.length;
    let validRecords = 0;
    let missingAmounts = 0;
    let missingDates = 0;
    let missingMerchants = 0;
    let missingCategories = 0;
    let zeroAmounts = 0;
    let futureDates = 0;
    let pastDates = 0;

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    transactions.forEach((txn) => {
      let isValid = true;

      if (!txn.amount || txn.amount === 0) {
        missingAmounts++;
        isValid = false;
      }

      if (txn.amount === 0) {
        zeroAmounts++;
      }

      if (!txn.date) {
        missingDates++;
        isValid = false;
      } else {
        const txnDate = new Date(txn.date);
        if (txnDate > now) {
          futureDates++;
        } else if (txnDate < oneYearAgo) {
          pastDates++;
        }
      }

      if (!txn.merchant) {
        missingMerchants++;
        isValid = false;
      }

      if (!txn.category) {
        missingCategories++;
        isValid = false;
      }

      if (isValid) {
        validRecords++;
      }
    });

    return {
      totalRecords,
      validRecords,
      completeness: validRecords / totalRecords,
      missingFields: {
        amounts: missingAmounts,
        dates: missingDates,
        merchants: missingMerchants,
        categories: missingCategories,
      },
      dataIssues: {
        zeroAmounts,
        futureDates,
        pastDates,
      },
      qualityScore: (validRecords / totalRecords) * 100,
    };
  }

  /**
     * Enrich data with additional information
     * @param {Object} data - Packaged data
     * @param {Object} options - Enrichment options
     * @returns {Promise<Object>} - Enriched data
     */
  async enrichData(data, options) {
    const { transactions } = data;
    const enrichedTransactions = transactions.map((txn) => ({
      ...txn,
      // Add derived fields
      isPositive: txn.amount > 0,
      isNegative: txn.amount < 0,
      absoluteAmount: Math.abs(txn.amount),
      dayOfWeek: new Date(txn.date).getDay(),
      month: new Date(txn.date).getMonth(),
      year: new Date(txn.date).getFullYear(),
      // Add risk indicators
      isLargeAmount: Math.abs(txn.amount) > 10000,
      isSmallAmount: Math.abs(txn.amount) < 10,
    }));

    return {
      ...data,
      transactions: enrichedTransactions,
    };
  }

  /**
     * Filter data based on criteria
     * @param {Object} data - Packaged data
     * @param {Object} filterCriteria - Filter criteria
     * @returns {Object} - Filtered data
     */
  filterData(data, filterCriteria) {
    let { transactions } = data;

    if (filterCriteria.amountRange) {
      const { min, max } = filterCriteria.amountRange;
      transactions = transactions.filter((txn) => txn.amount >= (min || -Infinity) && txn.amount <= (max || Infinity));
    }

    if (filterCriteria.dateRange) {
      const { start, end } = filterCriteria.dateRange;
      transactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        return txnDate >= (start ? new Date(start) : new Date(0))
                       && txnDate <= (end ? new Date(end) : new Date());
      });
    }

    if (filterCriteria.categories) {
      transactions = transactions.filter((txn) => filterCriteria.categories.includes(txn.category));
    }

    if (filterCriteria.merchants) {
      transactions = transactions.filter((txn) => filterCriteria.merchants.includes(txn.merchant));
    }

    return {
      ...data,
      transactions,
    };
  }

  /**
     * Aggregate data based on criteria
     * @param {Object} data - Packaged data
     * @param {Object} aggregationCriteria - Aggregation criteria
     * @returns {Object} - Aggregated data
     */
  aggregateData(data, aggregationCriteria) {
    const { transactions } = data;

    if (aggregationCriteria.groupBy === 'category') {
      const grouped = {};

      transactions.forEach((txn) => {
        if (!grouped[txn.category]) {
          grouped[txn.category] = [];
        }
        grouped[txn.category].push(txn);
      });

      const aggregatedTransactions = Object.entries(grouped).map(([category, txns]) => ({
        amount: txns.reduce((sum, txn) => sum + txn.amount, 0),
        date: txns[0].date, // Use first transaction date
        merchant: `Aggregated - ${category}`,
        category,
        transaction_id: `AGG_${category}_${Date.now()}`,
        description: `Aggregated transactions for ${category}`,
        count: txns.length,
      }));

      return {
        ...data,
        transactions: aggregatedTransactions,
      };
    }

    if (aggregationCriteria.groupBy === 'merchant') {
      const grouped = {};

      transactions.forEach((txn) => {
        if (!grouped[txn.merchant]) {
          grouped[txn.merchant] = [];
        }
        grouped[txn.merchant].push(txn);
      });

      const aggregatedTransactions = Object.entries(grouped).map(([merchant, txns]) => ({
        amount: txns.reduce((sum, txn) => sum + txn.amount, 0),
        date: txns[0].date,
        merchant,
        category: txns[0].category,
        transaction_id: `AGG_${merchant}_${Date.now()}`,
        description: `Aggregated transactions for ${merchant}`,
        count: txns.length,
      }));

      return {
        ...data,
        transactions: aggregatedTransactions,
      };
    }

    return data; // No aggregation applied
  }
}

// Create singleton instance
const dataPackager = new DataPackager();

// Export both the class and singleton instance
module.exports = { DataPackager, dataPackager };
module.exports.packageData = (rawData, options) => dataPackager.packageData(rawData, options);
