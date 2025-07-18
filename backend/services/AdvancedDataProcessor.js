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
        const quality = this.assessDataQuality(processedRows, schema);

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

    assessDataQuality(data, schema) {
        const quality = {
            score: 0,
            issues: [],
            warnings: [],
            completeness: {},
            accuracy: {},
            consistency: {},
            records_analyzed: data ? data.length : 0  // UNIFIED: Use actual record count
        };

        if (!data || data.length === 0) {
            quality.issues.push('No data available');
            quality.records_analyzed = 0;  // UNIFIED: Explicit zero for no data
            return quality;
        }

        // UNIFIED: Set the actual record count
        quality.records_analyzed = data.length;
        console.log(`[DataQuality] Analyzing ${data.length} records for quality assessment`);

        // Assess completeness
        Object.entries(schema).forEach(([column, columnSchema]) => {
            const values = data.map(row => row[column]);
            const nonNullCount = values.filter(v => v !== null && v !== undefined).length;
            const completeness = nonNullCount / values.length;
            
            quality.completeness[column] = completeness;
            
            if (completeness < 0.8) {
                quality.warnings.push(`Low completeness in column '${column}': ${(completeness * 100).toFixed(1)}%`);
            }
        });

        // Assess accuracy (type consistency)
        Object.entries(schema).forEach(([column, columnSchema]) => {
            const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
            const correctTypeCount = values.filter(value => {
                try {
                    return this.dataValidators[columnSchema.type](value.toString());
                } catch {
                    return false;
                }
            }).length;
            
            const accuracy = values.length > 0 ? correctTypeCount / values.length : 1;
            quality.accuracy[column] = accuracy;
            
            if (accuracy < 0.9) {
                quality.warnings.push(`Type inconsistencies in column '${column}': ${(accuracy * 100).toFixed(1)}% accuracy`);
            }
        });

        // Assess consistency
        Object.entries(schema).forEach(([column, columnSchema]) => {
            const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
            
            if (columnSchema.type === 'numeric' || columnSchema.type === 'currency') {
                const numericValues = values.filter(v => !isNaN(parseFloat(v)));
                if (numericValues.length > 1) {
                    const mean = numericValues.reduce((a, b) => a + parseFloat(b), 0) / numericValues.length;
                    const std = Math.sqrt(numericValues.reduce((a, b) => a + Math.pow(parseFloat(b) - mean, 2), 0) / numericValues.length);
                    const cv = std / Math.abs(mean);
                    
                    quality.consistency[column] = {
                        coefficientOfVariation: cv,
                        isConsistent: cv < 2.0
                    };
                    
                    if (cv > 2.0) {
                        quality.warnings.push(`High variability in column '${column}': CV = ${cv.toFixed(2)}`);
                    }
                }
            }
        });

        // Calculate overall quality score
        const completenessScore = Object.values(quality.completeness).reduce((a, b) => a + b, 0) / Object.keys(quality.completeness).length;
        const accuracyScore = Object.values(quality.accuracy).reduce((a, b) => a + b, 0) / Object.keys(quality.accuracy).length;
        
        quality.score = (completenessScore + accuracyScore) / 2;

        // UNIFIED: Adjust quality score based on record count (more records = higher confidence)
        if (data.length > 500) {
            quality.score = Math.min(0.98, quality.score + 0.05);  // Boost for large datasets
        } else if (data.length > 100) {
            quality.score = Math.min(0.95, quality.score + 0.03);  // Moderate boost
        }

        // Add critical issues
        if (quality.score < 0.5) {
            quality.issues.push('Critical: Overall data quality is poor');
        } else if (quality.score < 0.8) {
            quality.issues.push('Warning: Data quality needs improvement');
        }

        console.log(`[DataQuality] Final quality score: ${quality.score.toFixed(3)}, records: ${quality.records_analyzed}`);
        return quality;
    }

    /**
     * Extract financial metrics from processed data
     */
    extractFinancialMetrics(data, schema) {
        const metrics = {
            amounts: {},
            dates: {},
            categories: {},
            summary: {}
        };

        // Find amount columns
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'currency') {
                const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && !isNaN(v));
                
                if (values.length > 0) {
                    metrics.amounts[column] = {
                        count: values.length,
                        sum: values.reduce((a, b) => a + b, 0),
                        average: values.reduce((a, b) => a + b, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        positiveSum: values.filter(v => v > 0).reduce((a, b) => a + b, 0),
                        negativeSum: Math.abs(values.filter(v => v < 0).reduce((a, b) => a + b, 0)),
                        positiveCount: values.filter(v => v > 0).length,
                        negativeCount: values.filter(v => v < 0).length
                    };
                }
            }
        });

        // Find date columns
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'date') {
                const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
                const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
                
                if (dates.length > 0) {
                    metrics.dates[column] = {
                        count: dates.length,
                        minDate: new Date(Math.min(...dates.map(d => d.getTime()))),
                        maxDate: new Date(Math.max(...dates.map(d => d.getTime()))),
                        dateRange: this.calculateDateRange(dates)
                    };
                }
            }
        });

        // Find categorical columns
        Object.entries(schema).forEach(([column, columnSchema]) => {
            if (columnSchema.type === 'text' && columnSchema.uniqueCount < data.length * 0.5) {
                const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
                const valueCounts = {};
                
                values.forEach(value => {
                    valueCounts[value] = (valueCounts[value] || 0) + 1;
                });

                metrics.categories[column] = {
                    uniqueCount: Object.keys(valueCounts).length,
                    totalCount: values.length,
                    distribution: valueCounts,
                    topValues: Object.entries(valueCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([value, count]) => ({ value, count, percentage: (count / values.length) * 100 }))
                };
            }
        });

        // Generate summary metrics
        metrics.summary = this.generateSummaryMetrics(metrics);

        return metrics;
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
}

module.exports = AdvancedDataProcessor; 