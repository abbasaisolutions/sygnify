const fs = require('fs');
const { parse } = require('csv-parse');

/**
 * Comprehensive Data Validator
 * Prevents null data scenarios by validating CSV structure and content
 * before any analysis begins
 */
class DataValidator {
    constructor() {
        // Required columns for different domains
        this.requiredColumns = {
            finance: ['transaction_id', 'amount', 'date', 'category'],
            advertising: ['campaign_id', 'impressions', 'clicks', 'conversions'],
            supply_chain: ['order_id', 'quantity', 'supplier', 'lead_time'],
            hr: ['employee_id', 'salary', 'department', 'hire_date'],
            operations: ['process_id', 'duration', 'status', 'timestamp'],
            general: [] // No specific requirements for general analysis
        };

        // Minimum data requirements
        this.minimumRequirements = {
            minRecords: 10,
            minNonEmptyColumns: 2,
            maxNullPercentage: 80, // Max 80% null values in any column
            minNumericColumns: 1 // At least one numeric column for analysis
        };
    }

    /**
     * Comprehensive validation before analysis
     */
    async validateCSVForAnalysis(filePath, domain = 'general', originalName = null) {
        try {
            console.log('🔍 Starting comprehensive CSV validation...');
            
            // Step 1: Basic file validation
            const fileValidation = this.validateFile(filePath, originalName);
            if (!fileValidation.isValid) {
                return this.createValidationResult(false, fileValidation.errors);
            }

            // Step 2: Parse CSV structure
            const csvStructure = await this.parseCSVStructure(filePath);
            if (!csvStructure.isValid) {
                return this.createValidationResult(false, csvStructure.errors);
            }

            // Step 3: Schema validation
            const schemaValidation = this.validateSchema(csvStructure.data, domain);
            if (!schemaValidation.isValid) {
                return this.createValidationResult(false, schemaValidation.errors);
            }

            // Step 4: Data quality validation
            const dataQualityValidation = await this.validateDataQuality(filePath, csvStructure.data);
            if (!dataQualityValidation.isValid) {
                return this.createValidationResult(false, dataQualityValidation.errors);
            }

            // Step 5: Content validation
            const contentValidation = await this.validateContent(filePath, domain);
            if (!contentValidation.isValid) {
                return this.createValidationResult(false, contentValidation.errors);
            }

            console.log('✅ Comprehensive validation passed');
            return this.createValidationResult(true, [], {
                columns: csvStructure.data.columns,
                recordCount: csvStructure.data.recordCount,
                dataTypes: contentValidation.dataTypes,
                qualityMetrics: dataQualityValidation.metrics
            });

        } catch (error) {
            console.error('Validation error:', error);
            return this.createValidationResult(false, [`Validation failed: ${error.message}`]);
        }
    }

    /**
     * Validate file existence and format
     */
    validateFile(filePath, originalName = null) {
        const errors = [];

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            errors.push('File does not exist');
            return { isValid: false, errors };
        }

        // Check file size
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            errors.push('File is empty');
            return { isValid: false, errors };
        }

        // Check if it's a CSV file (check original name if provided, otherwise check path)
        const fileNameToCheck = originalName || filePath;
        if (!fileNameToCheck.toLowerCase().endsWith('.csv')) {
            errors.push('File must be a CSV file');
            return { isValid: false, errors };
        }

        return { isValid: true, errors: [] };
    }

    /**
     * Parse CSV structure without loading all data
     */
    async parseCSVStructure(filePath) {
        return new Promise((resolve) => {
            const errors = [];
            let columns = [];
            let recordCount = 0;
            let firstRow = null;
            let parser = null;
            let hasEnded = false;

            const finishParsing = () => {
                if (hasEnded) return;
                hasEnded = true;
                
                if (errors.length > 0) {
                    resolve({ isValid: false, errors });
                    return;
                }

                // If we have columns but no data rows, that's still valid for structure validation
                if (columns.length === 0) {
                    errors.push('No columns detected in CSV');
                    resolve({ isValid: false, errors });
                    return;
                }

                // Check for auto-numbered columns (0, 1, 2, etc.)
                const autoNumberedColumns = columns.filter(col => /^\d+$/.test(col));
                if (autoNumberedColumns.length > 0) {
                    errors.push(`Detected auto-numbered columns: ${autoNumberedColumns.join(', ')}. Please ensure your CSV has proper column headers.`);
                }

                // If no data rows but we have columns, that's a structure issue
                if (recordCount === 0) {
                    errors.push('No data records found in CSV');
                    resolve({ isValid: false, errors });
                    return;
                }

                resolve({
                    isValid: true,
                    errors: [],
                    data: {
                        columns,
                        recordCount,
                        firstRow
                    }
                });
            };

            try {
                // First, try to read the file to get headers
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const lines = fileContent.split('\n').filter(line => line.trim());
                
                if (lines.length === 0) {
                    errors.push('File is completely empty');
                    resolve({ isValid: false, errors });
                    return;
                }

                // Parse the first line to get headers
                const headerLine = lines[0];
                const headerColumns = headerLine.split(',').map(col => col.trim().replace(/"/g, ''));
                
                if (headerColumns.length === 0 || (headerColumns.length === 1 && headerColumns[0] === '')) {
                    errors.push('No valid headers found in CSV');
                    resolve({ isValid: false, errors });
                    return;
                }
                
                columns = headerColumns;
                
                // Now parse the full file to check for data rows
                parser = fs.createReadStream(filePath)
                    .pipe(parse({
                        header: true,
                        skip_empty_lines: true,
                        trim: true,
                        bom: true
                    }))
                    .on('data', (row) => {
                        if (recordCount === 0) {
                            firstRow = row;
                        }
                        recordCount++;
                        
                        // Only read first 100 rows for structure validation
                        if (recordCount > 100) {
                            parser.end();
                        }
                    })
                    .on('error', (error) => {
                        errors.push(`CSV parsing error: ${error.message}`);
                        finishParsing();
                    })
                    .on('end', () => {
                        finishParsing();
                    });
                
                // Add timeout to prevent hanging
                setTimeout(() => {
                    if (!hasEnded) {
                        errors.push('CSV parsing timeout - file may be corrupted or empty');
                        finishParsing();
                    }
                }, 5000); // 5 second timeout
                
            } catch (error) {
                errors.push(`File reading error: ${error.message}`);
                finishParsing();
            }
        });
    }

    /**
     * Validate schema against domain requirements
     */
    validateSchema(csvStructure, domain) {
        const errors = [];
        const warnings = [];
        const { columns } = csvStructure;

        // Check required columns for domain
        const requiredCols = this.requiredColumns[domain] || [];
        const missingCols = requiredCols.filter(col => !columns.includes(col));
        
        if (missingCols.length > 0) {
            errors.push(`Missing required columns for ${domain} analysis: ${missingCols.join(', ')}`);
        }

        // Check minimum column count
        if (columns.length < this.minimumRequirements.minNonEmptyColumns) {
            errors.push(`Insufficient columns: found ${columns.length}, minimum required: ${this.minimumRequirements.minNonEmptyColumns}`);
        }

        // Check for suspicious column names
        const suspiciousColumns = columns.filter(col => 
            col.toLowerCase().includes('unnamed') || 
            col.toLowerCase().includes('column') ||
            /^col_\d+$/i.test(col)
        );

        if (suspiciousColumns.length > 0) {
            warnings.push(`Detected potentially problematic column names: ${suspiciousColumns.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            schema: {
                columns,
                domain,
                hasRequiredColumns: missingCols.length === 0
            }
        };
    }

    /**
     * Validate data quality metrics
     */
    async validateDataQuality(filePath, csvStructure) {
        return new Promise((resolve) => {
            const errors = [];
            const metrics = {};
            const { columns } = csvStructure;
            
            let recordCount = 0;
            const columnStats = {};
            let hasEnded = false;
            
            // Initialize column statistics
            columns.forEach(col => {
                columnStats[col] = {
                    nullCount: 0,
                    emptyCount: 0,
                    totalCount: 0,
                    numericCount: 0,
                    uniqueValues: new Set()
                };
            });

            const finishAnalysis = () => {
                if (hasEnded) return;
                hasEnded = true;
                
                // Calculate quality metrics
                columns.forEach(col => {
                    const stats = columnStats[col];
                    const nullPercentage = ((stats.nullCount + stats.emptyCount) / stats.totalCount) * 100;
                    
                    if (nullPercentage > this.minimumRequirements.maxNullPercentage) {
                        errors.push(`Column "${col}" has ${nullPercentage.toFixed(1)}% null/empty values (max allowed: ${this.minimumRequirements.maxNullPercentage}%)`);
                    }

                    metrics[col] = {
                        nullPercentage,
                        uniqueCount: stats.uniqueValues.size,
                        numericCount: stats.numericCount,
                        isNumeric: stats.numericCount > stats.totalCount * 0.5
                    };
                });

                // Check minimum record count
                if (recordCount < this.minimumRequirements.minRecords) {
                    errors.push(`Insufficient records: found ${recordCount}, minimum required: ${this.minimumRequirements.minRecords}`);
                }

                // Check for numeric columns
                const numericColumns = columns.filter(col => metrics[col].isNumeric);
                if (numericColumns.length < this.minimumRequirements.minNumericColumns) {
                    errors.push(`Insufficient numeric columns: found ${numericColumns.length}, minimum required: ${this.minimumRequirements.minNumericColumns}`);
                }

                resolve({
                    isValid: errors.length === 0,
                    errors,
                    metrics: {
                        totalRecords: recordCount,
                        columns: metrics,
                        numericColumns: numericColumns,
                        overallQuality: this.calculateOverallQuality(metrics)
                    }
                });
            };

            let parser = null;
            parser = fs.createReadStream(filePath)
                .pipe(parse({
                    header: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    recordCount++;
                    
                    columns.forEach(col => {
                        const value = row[col];
                        const stats = columnStats[col];
                        stats.totalCount++;

                        if (value === null || value === undefined) {
                            stats.nullCount++;
                        } else if (String(value).trim() === '') {
                            stats.emptyCount++;
                        } else {
                            stats.uniqueValues.add(String(value));
                            
                            // Check if numeric
                            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                                stats.numericCount++;
                            }
                        }
                    });

                    // Limit processing for performance
                    if (recordCount > 1000) {
                        parser.end();
                    }
                })
                .on('error', (error) => {
                    errors.push(`Data quality analysis error: ${error.message}`);
                    finishAnalysis();
                })
                .on('end', () => {
                    finishAnalysis();
                });
                
            // Add timeout to prevent hanging
            setTimeout(() => {
                if (!hasEnded) {
                    errors.push('Data quality analysis timeout - file may be corrupted or too large');
                    finishAnalysis();
                }
            }, 10000); // 10 second timeout
        });
    }

    /**
     * Validate content for analysis suitability
     */
    async validateContent(filePath, domain) {
        return new Promise((resolve) => {
            const errors = [];
            const warnings = [];
            const dataTypes = {};
            const sampleData = {};
            
            let recordCount = 0;
            const columns = [];
            let hasEnded = false;

            const finishValidation = () => {
                if (hasEnded) return;
                hasEnded = true;
                
                // Validate data types
                columns.forEach(col => {
                    const types = Array.from(dataTypes[col] || []);
                    if (types.length === 0) {
                        errors.push(`Column "${col}" has no valid data types detected`);
                    } else if (types.length > 1) {
                        warnings.push(`Column "${col}" has mixed data types: ${types.join(', ')}`);
                    }
                });

                resolve({
                    isValid: errors.length === 0,
                    errors,
                    warnings,
                    dataTypes: Object.fromEntries(
                        Object.entries(dataTypes).map(([col, types]) => [col, Array.from(types)])
                    ),
                    sampleData
                });
            };

            let parser = null;
            parser = fs.createReadStream(filePath)
                .pipe(parse({
                    header: true,
                    skip_empty_lines: true,
                    trim: true
                }))
                .on('data', (row) => {
                    if (recordCount === 0) {
                        columns.push(...Object.keys(row));
                        columns.forEach(col => {
                            sampleData[col] = [];
                            dataTypes[col] = new Set();
                        });
                    }

                    columns.forEach(col => {
                        const value = row[col];
                        if (sampleData[col].length < 10) { // Keep first 10 values for type detection
                            sampleData[col].push(value);
                        }
                        
                        // Detect data type
                        if (value !== null && value !== undefined && value !== '') {
                            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                                dataTypes[col].add('numeric');
                            } else if (this.isDate(value)) {
                                dataTypes[col].add('date');
                            } else {
                                dataTypes[col].add('text');
                            }
                        }
                    });

                    recordCount++;
                    if (recordCount > 100) { // Limit for performance
                        parser.end();
                    }
                })
                .on('error', (error) => {
                    errors.push(`Content validation error: ${error.message}`);
                    finishValidation();
                })
                .on('end', () => {
                    finishValidation();
                });
                
            // Add timeout to prevent hanging
            setTimeout(() => {
                if (!hasEnded) {
                    errors.push('Content validation timeout - file may be corrupted or too large');
                    finishValidation();
                }
            }, 8000); // 8 second timeout
        });
    }

    /**
     * Calculate overall data quality score
     */
    calculateOverallQuality(columnMetrics) {
        const scores = Object.values(columnMetrics).map(metric => {
            const nullScore = Math.max(0, 100 - metric.nullPercentage);
            const diversityScore = Math.min(100, (metric.uniqueCount / 10) * 100);
            return (nullScore + diversityScore) / 2;
        });

        return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    }

    /**
     * Check if value is a date
     */
    isDate(value) {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Create standardized validation result
     */
    createValidationResult(isValid, errors = [], data = {}) {
        return {
            isValid,
            errors,
            warnings: data.warnings || [],
            data: {
                columns: data.columns || [],
                recordCount: data.recordCount || 0,
                dataTypes: data.dataTypes || {},
                qualityMetrics: data.qualityMetrics || {},
                schema: data.schema || {}
            },
            recommendations: this.generateRecommendations(errors, data)
        };
    }

    /**
     * Generate actionable recommendations based on validation errors
     */
    generateRecommendations(errors, data) {
        const recommendations = [];

        if (errors.length === 0) {
            recommendations.push('✅ Data validation passed. Ready for analysis.');
            return recommendations;
        }

        // Specific recommendations based on error types
        errors.forEach(error => {
            if (error.includes('Missing required columns')) {
                recommendations.push('🔧 Add the missing required columns to your CSV file');
            } else if (error.includes('auto-numbered columns')) {
                recommendations.push('🔧 Ensure your CSV has proper column headers instead of auto-numbered columns');
            } else if (error.includes('Insufficient records')) {
                recommendations.push('🔧 Add more data records to your CSV file (minimum 10 records required)');
            } else if (error.includes('null/empty values')) {
                recommendations.push('🔧 Clean your data by removing or filling null/empty values');
            } else if (error.includes('Insufficient numeric columns')) {
                recommendations.push('🔧 Ensure your CSV contains at least one numeric column for analysis');
            } else if (error.includes('File is empty')) {
                recommendations.push('🔧 Upload a non-empty CSV file with valid data');
            }
        });

        return recommendations;
    }
}

module.exports = DataValidator; 