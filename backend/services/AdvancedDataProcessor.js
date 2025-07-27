const { parse } = require('csv-parse');
const fs = require('fs');

/**
 * Advanced Data Processor
 * Handles intelligent CSV parsing, data validation, and transformation
 */
class AdvancedDataProcessor {
    constructor() {
        this.supportedFormats = ['csv', 'json'];
        this.dataValidators = this.initializeValidators();
        this.transformers = this.initializeTransformers();
    }

    initializeValidators() {
        return {
            numeric: (value) => !isNaN(parseFloat(value)) && isFinite(parseFloat(value)),
            date: (value) => !isNaN(new Date(value).getTime()),
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            url: (value) => /^https?:\/\/.+/.test(value),
            boolean: (value) => ['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase()),
            currency: (value) => /^[\$€£¥]?\s*\d+([.,]\d{1,2})?$/.test(value.replace(/[,\s]/g, '')),
            percentage: (value) => /^\d+([.,]\d+)?%?$/.test(value.replace('%', '')),
            phone: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
            zipcode: (value) => /^\d{5}(-\d{4})?$/.test(value),
            ssn: (value) => /^\d{3}-\d{2}-\d{4}$/.test(value)
        };
    }

    initializeTransformers() {
        return {
            currency: (value) => {
                const cleaned = value.replace(/[,\s\$€£¥]/g, '');
                return parseFloat(cleaned);
            },
            percentage: (value) => {
                const cleaned = value.replace('%', '');
                return parseFloat(cleaned) / 100;
            },
            date: (value) => {
                return new Date(value);
            },
            boolean: (value) => {
                const lower = value.toLowerCase();
                return ['true', '1', 'yes'].includes(lower);
            },
            number: (value) => {
                return parseFloat(value.replace(/[,\s]/g, ''));
            },
            text: (value) => {
                return value.toString().trim();
            }
        };
    }

    /**
     * Intelligent CSV parsing with automatic data type detection
     */
    async parseCSV(filePath, options = {}) {
        try {
            const data = await this.readCSVFile(filePath);
            const processedData = this.processCSVData(data, options);
            
            return {
                success: true,
                data: processedData.rows,
                metadata: processedData.metadata,
                schema: processedData.schema,
                quality: processedData.quality
            };
        } catch (error) {
            console.error('CSV parsing error:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                metadata: {},
                schema: {},
                quality: { score: 0, issues: [error.message] }
            };
        }
    }

    async readCSVFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            let headers = null;
            
            fs.createReadStream(filePath)
                .pipe(parse({
                    columns: true, // <-- FIXED: use columns: true for csv-parse
                    skip_empty_lines: true,
                    trim: true,
                    bom: true,
                    relax_quotes: true,
                    relax_column_count: true
                }))
                .on('data', (row) => {
                    if (!headers) {
                        headers = Object.keys(row);
                        console.log('First parsed row:', row); // <-- DEBUG LOG
                    }
                    results.push(row);
                })
                .on('end', () => resolve(results))
                .on('error', (error) => reject(error));
        });
    }

    processCSVData(data, options) {
        if (!data || data.length === 0) {
            throw new Error('No data found in CSV file');
        }

        const metadata = {
            totalRows: data.length,
            totalColumns: Object.keys(data[0] || {}).length,
            fileType: 'csv',
            processedAt: new Date().toISOString()
        };

        // Detect column types and schema
        const schema = this.detectSchema(data);
        metadata.schema = schema;

        // Process and validate data
        const processedRows = this.processRows(data, schema, options);
        
        // Assess data quality
        const quality = this.calculateDataQuality(processedRows, schema);

        return {
            rows: processedRows,
            metadata,
            schema,
            quality
        };
    }

    detectSchema(data) {
        const schema = {};
        const sampleSize = Math.min(100, data.length);
        const sampleData = data.slice(0, sampleSize);

        if (sampleData.length === 0) return schema;

        const columns = Object.keys(sampleData[0] || {});
        
        columns.forEach(column => {
            const columnData = sampleData.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
            
            if (columnData.length === 0) {
                schema[column] = { type: 'unknown', confidence: 0 };
                return;
            }

            const typeAnalysis = this.analyzeColumnType(column, columnData);
            schema[column] = typeAnalysis;
        });

        return schema;
    }

    analyzeColumnType(columnName, values) {
        const typeScores = {
            numeric: 0,
            date: 0,
            boolean: 0,
            currency: 0,
            percentage: 0,
            email: 0,
            url: 0,
            phone: 0,
            zipcode: 0,
            ssn: 0,
            text: 0
        };

        values.forEach(value => {
            const strValue = value.toString().trim();
            
            // Test each validator
            Object.entries(this.dataValidators).forEach(([type, validator]) => {
                if (validator(strValue)) {
                    typeScores[type]++;
                }
            });
        });

        // Calculate confidence scores
        const totalValues = values.length;
        Object.keys(typeScores).forEach(type => {
            typeScores[type] = typeScores[type] / totalValues;
        });

        // Determine the most likely type
        let bestType = 'text';
        let bestScore = typeScores.text;

        Object.entries(typeScores).forEach(([type, score]) => {
            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        });

        // Apply domain-specific rules
        const domainType = this.applyDomainRules(columnName, bestType, bestScore);
        
        return {
            type: domainType.type,
            confidence: domainType.confidence,
            originalType: bestType,
            originalScore: bestScore,
            sampleValues: values.slice(0, 5),
            uniqueCount: new Set(values).size,
            nullCount: values.filter(v => v === null || v === undefined || v === '').length
        };
    }

    applyDomainRules(columnName, detectedType, confidence) {
        const columnLower = columnName.toLowerCase();
        
        // Financial domain rules
        if (columnLower.includes('amount') || columnLower.includes('price') || 
            columnLower.includes('cost') || columnLower.includes('revenue') || 
            columnLower.includes('sales') || columnLower.includes('profit') ||
            columnLower.includes('expense') || columnLower.includes('income')) {
            return { type: 'currency', confidence: Math.max(confidence, 0.8) };
        }

        if (columnLower.includes('percentage') || columnLower.includes('rate') ||
            columnLower.includes('ratio') || columnLower.includes('margin')) {
            return { type: 'percentage', confidence: Math.max(confidence, 0.8) };
        }

        // Date/time rules
        if (columnLower.includes('date') || columnLower.includes('time') ||
            columnLower.includes('created') || columnLower.includes('updated') ||
            columnLower.includes('timestamp')) {
            return { type: 'date', confidence: Math.max(confidence, 0.8) };
        }

        // ID rules
        if (columnLower.includes('id') || columnLower.includes('code') ||
            columnLower.includes('number')) {
            return { type: 'numeric', confidence: Math.max(confidence, 0.7) };
        }

        // Boolean rules
        if (columnLower.includes('is_') || columnLower.includes('has_') ||
            columnLower.includes('active') || columnLower.includes('enabled') ||
            columnLower.includes('status')) {
            return { type: 'boolean', confidence: Math.max(confidence, 0.7) };
        }

        return { type: detectedType, confidence };
    }

    processRows(data, schema, options) {
        return data.map((row, index) => {
            const processedRow = {};
            
            Object.entries(row).forEach(([column, value]) => {
                const columnSchema = schema[column];
                
                if (!columnSchema) {
                    processedRow[column] = value;
                    return;
                }

                try {
                    processedRow[column] = this.transformValue(value, columnSchema, options);
                } catch (error) {
                    console.warn(`Error processing column ${column} at row ${index}:`, error.message);
                    processedRow[column] = value; // Keep original value on error
                }
            });

            return processedRow;
        });
    }

    transformValue(value, schema, options) {
        if (value === null || value === undefined || value === '') {
            return options.keepNulls ? null : undefined;
        }

        const transformer = this.transformers[schema.type];
        
        if (transformer) {
            try {
                return transformer(value);
            } catch (error) {
                console.warn(`Transform error for type ${schema.type}:`, error.message);
                return value; // Return original value if transformation fails
            }
        }

        return value;
    }

    calculateDataQuality(data, schema) {
        if (!data || data.length === 0) {
            return {
                score: 0,
                completeness: 0,
                accuracy: 0,
                consistency: 0,
                issues: [],
                warnings: []
            };
        }

        const totalRecords = data.length;
        const totalColumns = Object.keys(schema || data[0] || {}).length;
        const totalCells = totalRecords * totalColumns;
        
        let missingCells = 0;
        let invalidCells = 0;
        let typeInconsistencies = 0;
        const columnQuality = {};
        
        // Analyze each column
        Object.keys(schema || data[0] || {}).forEach(column => {
            const values = data.map(row => row[column]);
            const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
            const missingCount = values.length - nonNullValues.length;
            missingCells += missingCount;
            
            // Calculate column-specific quality
            const completeness = nonNullValues.length / values.length;
            let accuracy = 1.0;
            let consistency = 1.0;
            
            // Check for type consistency
            if (nonNullValues.length > 0) {
                const expectedType = this.inferColumnType(nonNullValues);
                const typeConsistent = nonNullValues.every(v => this.isValidType(v, expectedType));
                if (!typeConsistent) {
                    typeInconsistencies += nonNullValues.length;
                    accuracy *= 0.8; // Penalty for type inconsistencies
                }
            }
            
            // Check for value consistency (for numeric columns)
            if (nonNullValues.length > 1 && this.isNumericColumn(nonNullValues)) {
                const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
                if (numericValues.length > 1) {
                    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
                    const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);
                    
                    // High CV indicates inconsistency
                    if (coefficientOfVariation > 2.0) {
                        consistency *= 0.9;
                    }
                }
            }
            
            columnQuality[column] = {
                completeness,
                accuracy,
                consistency,
                missingCount,
                totalCount: values.length
            };
        });
        
        // Calculate overall quality metrics
        const completeness = (totalCells - missingCells) / totalCells;
        const accuracy = Math.max(0, 1 - (typeInconsistencies / totalCells));
        const consistency = Object.values(columnQuality).reduce((sum, col) => sum + col.consistency, 0) / totalColumns;
        
        // Weighted quality score
        const qualityScore = (completeness * 0.4 + accuracy * 0.4 + consistency * 0.2);
        
        // Generate warnings for low-quality columns
        const warnings = [];
        Object.entries(columnQuality).forEach(([column, quality]) => {
            if (quality.accuracy < 0.5) {
                warnings.push(`Type inconsistencies in column '${column}': ${(quality.accuracy * 100).toFixed(1)}% accuracy`);
            }
            if (quality.completeness < 0.8) {
                warnings.push(`Missing data in column '${column}': ${((1 - quality.completeness) * 100).toFixed(1)}% missing`);
            }
        });
        
        return {
            score: qualityScore,
            completeness,
            accuracy,
            consistency,
            issues: [],
            warnings,
            columnQuality,
            records_analyzed: totalRecords
        };
    }

    /**
     * Extract financial metrics from processed data
     * Refactored into smaller, pure functions for better maintainability
     */
    extractFinancialMetrics(data, schema) {
        try {
            // Validate inputs
            const validationResult = this.validateFinancialMetricsInputs(data, schema);
            if (!validationResult.isValid) {
                throw new Error(`Invalid inputs: ${validationResult.error}`);
            }

            // Extract metrics using pure functions
            const amounts = this.extractAmountMetrics(data, schema);
            const dates = this.extractDateMetrics(data, schema);
            const categories = this.extractCategoryMetrics(data, schema);
            const summary = this.generateSummaryMetrics({ amounts, dates, categories });

            return {
                amounts,
                dates,
                categories,
                summary,
                metadata: {
                    extractedAt: new Date().toISOString(),
                    totalRecords: data.length,
                    columnsAnalyzed: Object.keys(schema).length
                }
            };
        } catch (error) {
            console.error('Error extracting financial metrics:', error);
            return {
                amounts: {},
                dates: {},
                categories: {},
                summary: {},
                error: error.message,
                metadata: {
                    extractedAt: new Date().toISOString(),
                    error: true
                }
            };
        }
    }

    /**
     * Validate inputs for financial metrics extraction
     */
    validateFinancialMetricsInputs(data, schema) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return { isValid: false, error: 'Data must be a non-empty array' };
        }

        if (!schema || typeof schema !== 'object') {
            return { isValid: false, error: 'Schema must be a valid object' };
        }

        if (!data[0] || typeof data[0] !== 'object') {
            return { isValid: false, error: 'Data must contain objects' };
        }

        return { isValid: true };
    }

    /**
     * Extract amount-related metrics from currency columns
     */
    extractAmountMetrics(data, schema) {
        const amounts = {};
        
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'currency') {
                const values = this.extractNumericValues(data, column);
                
                if (values.length > 0) {
                    amounts[column] = this.calculateAmountStatistics(values);
                }
            }
        });

        return amounts;
    }

    /**
     * Extract numeric values from a column with validation
     */
    extractNumericValues(data, column) {
        return data
            .map(row => row[column])
            .filter(v => v !== null && v !== undefined && !isNaN(parseFloat(v)))
            .map(v => parseFloat(v));
    }

    /**
     * Calculate comprehensive statistics for amount values
     */
    calculateAmountStatistics(values) {
        const positiveValues = values.filter(v => v > 0);
        const negativeValues = values.filter(v => v < 0);
        
        return {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            positiveSum: positiveValues.reduce((a, b) => a + b, 0),
            negativeSum: Math.abs(negativeValues.reduce((a, b) => a + b, 0)),
            positiveCount: positiveValues.length,
            negativeCount: negativeValues.length,
            positivePercentage: (positiveValues.length / values.length) * 100,
            negativePercentage: (negativeValues.length / values.length) * 100,
            netFlow: positiveValues.reduce((a, b) => a + b, 0) - Math.abs(negativeValues.reduce((a, b) => a + b, 0))
        };
    }

    /**
     * Extract date-related metrics from date columns
     */
    extractDateMetrics(data, schema) {
        const dates = {};
        
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'date') {
                const dateValues = this.extractDateValues(data, column);
                
                if (dateValues.length > 0) {
                    dates[column] = this.calculateDateStatistics(dateValues);
                }
            }
        });

        return dates;
    }

    /**
     * Extract and validate date values from a column
     */
    extractDateValues(data, column) {
        return data
            .map(row => row[column])
            .filter(v => v !== null && v !== undefined)
            .map(v => new Date(v))
            .filter(d => !isNaN(d.getTime()));
    }

    /**
     * Calculate comprehensive statistics for date values
     */
    calculateDateStatistics(dateValues) {
        const timestamps = dateValues.map(d => d.getTime());
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        
        return {
            count: dateValues.length,
            minDate,
            maxDate,
            dateRange: this.calculateDateRange(dateValues),
            averageDate: new Date(timestamps.reduce((a, b) => a + b, 0) / timestamps.length),
            uniqueDates: [...new Set(dateValues.map(d => d.toDateString()))].length
        };
    }

    /**
     * Extract category-related metrics from categorical columns
     */
    extractCategoryMetrics(data, schema) {
        const categories = {};
        
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'text' && columnSchema.uniqueCount < data.length * 0.5) {
                const values = this.extractCategoricalValues(data, column);
                
                if (values.length > 0) {
                    categories[column] = this.calculateCategoryStatistics(values);
                }
            }
        });

        return categories;
    }

    /**
     * Extract categorical values from a column
     */
    extractCategoricalValues(data, column) {
        return data
            .map(row => row[column])
            .filter(v => v !== null && v !== undefined && v !== '')
            .map(v => String(v).trim());
    }

    /**
     * Calculate comprehensive statistics for categorical values
     */
    calculateCategoryStatistics(values) {
        const valueCounts = {};
        
        values.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });

        const sortedEntries = Object.entries(valueCounts)
            .sort(([,a], [,b]) => b - a);

        return {
            uniqueCount: Object.keys(valueCounts).length,
            totalCount: values.length,
            distribution: valueCounts,
            topValues: sortedEntries
                .slice(0, 10)
                .map(([value, count]) => ({ 
                    value, 
                    count, 
                    percentage: (count / values.length) * 100 
                })),
            diversity: this.calculateDiversityIndex(valueCounts, values.length),
            mostCommon: sortedEntries.length > 0 ? sortedEntries[0][0] : null,
            leastCommon: sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1][0] : null
        };
    }

    /**
     * Calculate diversity index (Simpson's Diversity Index)
     */
    calculateDiversityIndex(valueCounts, totalCount) {
        if (totalCount === 0) return 0;
        
        const sum = Object.values(valueCounts).reduce((acc, count) => {
            return acc + (count * (count - 1));
        }, 0);
        
        return 1 - (sum / (totalCount * (totalCount - 1)));
    }

    calculateDateRange(dates) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const diffTime = Math.abs(maxDate - minDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            days: diffDays,
            months: Math.ceil(diffDays / 30),
            years: Math.ceil(diffDays / 365)
        };
    }

    generateSummaryMetrics(metrics) {
        const summary = {
            totalRecords: 0,
            totalAmount: 0,
            netCashFlow: 0,
            averageTransaction: 0,
            dateRange: null,
            topCategories: []
        };

        // Calculate totals from amount columns
        Object.values(metrics.amounts).forEach(amount => {
            summary.totalRecords = Math.max(summary.totalRecords, amount.count);
            summary.totalAmount += amount.sum;
            summary.netCashFlow += (amount.positiveSum - amount.negativeSum);
        });

        // Calculate average transaction
        const totalTransactions = Object.values(metrics.amounts).reduce((sum, amount) => sum + amount.count, 0);
        summary.averageTransaction = totalTransactions > 0 ? summary.totalAmount / totalTransactions : 0;

        // Get date range
        const allDates = Object.values(metrics.dates).flatMap(date => [date.minDate, date.maxDate]);
        if (allDates.length > 0) {
            summary.dateRange = {
                start: new Date(Math.min(...allDates.map(d => d.getTime()))),
                end: new Date(Math.max(...allDates.map(d => d.getTime())))
            };
        }

        // Get top categories
        Object.entries(metrics.categories).forEach(([column, category]) => {
            if (category.topValues.length > 0) {
                summary.topCategories.push({
                    column,
                    topValue: category.topValues[0]
                });
            }
        });

        return summary;
    }

    /**
     * Validate data against business rules
     */
    validateBusinessRules(data, schema, rules = []) {
        const validationResults = {
            passed: true,
            errors: [],
            warnings: [],
            details: {}
        };

        rules.forEach(rule => {
            const result = this.applyBusinessRule(data, schema, rule);
            
            if (!result.passed) {
                validationResults.passed = false;
                validationResults.errors.push(result.error);
            }
            
            if (result.warning) {
                validationResults.warnings.push(result.warning);
            }
            
            validationResults.details[rule.name] = result;
        });

        return validationResults;
    }

    applyBusinessRule(data, schema, rule) {
        const result = {
            passed: true,
            error: null,
            warning: null,
            details: {}
        };

        try {
            switch (rule.type) {
                case 'range':
                    result.details = this.validateRange(data, schema, rule);
                    break;
                case 'required':
                    result.details = this.validateRequired(data, schema, rule);
                    break;
                case 'format':
                    result.details = this.validateFormat(data, schema, rule);
                    break;
                case 'consistency':
                    result.details = this.validateConsistency(data, schema, rule);
                    break;
                default:
                    result.warning = `Unknown rule type: ${rule.type}`;
            }

            // Check if validation failed
            if (result.details.failed) {
                result.passed = false;
                result.error = result.details.message;
            }
        } catch (error) {
            result.passed = false;
            result.error = `Validation error: ${error.message}`;
        }

        return result;
    }

    validateRange(data, schema, rule) {
        const column = rule.column;
        const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
        const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
        
        const min = rule.min !== undefined ? rule.min : -Infinity;
        const max = rule.max !== undefined ? rule.max : Infinity;
        
        const outOfRange = numericValues.filter(v => v < min || v > max);
        
        return {
            failed: outOfRange.length > 0,
            message: `${outOfRange.length} values out of range [${min}, ${max}] in column '${column}'`,
            outOfRange,
            totalChecked: numericValues.length
        };
    }

    validateRequired(data, schema, rule) {
        const column = rule.column;
        const values = data.map(row => row[column]);
        const missing = values.filter(v => v === null || v === undefined || v === '').length;
        
        return {
            failed: missing > 0,
            message: `${missing} missing values in required column '${column}'`,
            missing,
            total: values.length
        };
    }

    validateFormat(data, schema, rule) {
        const column = rule.column;
        const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
        const invalid = values.filter(v => !rule.pattern.test(v.toString()));
        
        return {
            failed: invalid.length > 0,
            message: `${invalid.length} values don't match format in column '${column}'`,
            invalid,
            total: values.length
        };
    }

    validateConsistency(data, schema, rule) {
        const column1 = rule.column1;
        const column2 = rule.column2;
        const values1 = data.map(row => row[column1]);
        const values2 = data.map(row => row[column2]);
        
        const inconsistent = [];
        for (let i = 0; i < data.length; i++) {
            if (rule.condition(values1[i], values2[i])) {
                inconsistent.push({ row: i, value1: values1[i], value2: values2[i] });
            }
        }
        
        return {
            failed: inconsistent.length > 0,
            message: `${inconsistent.length} inconsistent records between '${column1}' and '${column2}'`,
            inconsistent,
            total: data.length
        };
    }

    inferColumnType(values) {
        if (!values || values.length === 0) return 'string';
        
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        if (nonNullValues.length === 0) return 'string';
        
        // Check if all values are numeric
        const numericCount = nonNullValues.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
        if (numericCount === nonNullValues.length) {
            return 'numeric';
        }
        
        // Check if all values are dates
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/,
            /^\d{2}\/\d{2}\/\d{4}/,
            /^\d{2}-\d{2}-\d{4}/,
            /^\d{4}\/\d{2}\/\d{2}/
        ];
        const dateCount = nonNullValues.filter(v => 
            datePatterns.some(pattern => pattern.test(String(v)))
        ).length;
        if (dateCount === nonNullValues.length) {
            return 'date';
        }
        
        // Check if it's boolean
        const booleanValues = ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'];
        const booleanCount = nonNullValues.filter(v => booleanValues.includes(String(v).toLowerCase())).length;
        if (booleanCount === nonNullValues.length) {
            return 'boolean';
        }
        
        return 'string';
    }

    isValidType(value, expectedType) {
        if (value === null || value === undefined || value === '') {
            return true; // Null values are valid for any type
        }
        
        switch (expectedType) {
            case 'numeric':
                return !isNaN(parseFloat(value)) && isFinite(value);
            case 'date':
                const datePatterns = [
                    /^\d{4}-\d{2}-\d{2}/,
                    /^\d{2}\/\d{2}\/\d{4}/,
                    /^\d{2}-\d{2}-\d{4}/,
                    /^\d{4}\/\d{2}\/\d{2}/
                ];
                return datePatterns.some(pattern => pattern.test(String(value)));
            case 'boolean':
                const booleanValues = ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'];
                return booleanValues.includes(String(value).toLowerCase());
            default:
                return true; // String type accepts anything
        }
    }

    isNumericColumn(values) {
        const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
        return numericCount / values.length > 0.8;
    }
}

module.exports = AdvancedDataProcessor; 