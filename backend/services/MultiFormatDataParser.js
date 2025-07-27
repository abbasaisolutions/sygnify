const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const xml2js = require('xml2js');
const { spawn } = require('child_process');

/**
 * Multi-Format Data Parser Service
 * Supports CSV, Excel, JSON, XML, Parquet, and Google Sheets
 */
class MultiFormatDataParser {
  constructor() {
    this.parsers = this.initializeParsers();
    this.validators = this.initializeValidators();
    this.normalizers = this.initializeNormalizers();
  }

  initializeParsers() {
    return {
      csv: this.createCSVParser(),
      excel: this.createExcelParser(),
      json: this.createJSONParser(),
      xml: this.createXMLParser(),
      parquet: this.createParquetParser(),
      googleSheets: this.createGoogleSheetsParser(),
    };
  }

  initializeValidators() {
    return {
      schema: this.createSchemaValidator(),
      dataQuality: this.createDataQualityValidator(),
      format: this.createFormatValidator(),
    };
  }

  initializeNormalizers() {
    return {
      schema: this.createSchemaNormalizer(),
      dataTypes: this.createDataTypeNormalizer(),
      values: this.createValueNormalizer(),
    };
  }

  // Main parsing method
  async parseData(filePath, options = {}) {
    const startTime = Date.now();
    const fileExtension = this.detectFileFormat(filePath);

    console.log(`📁 Parsing ${fileExtension.toUpperCase()} file: ${path.basename(filePath)}`);

    try {
      // Parse the file
      const rawData = await this.parsers[fileExtension].parse(filePath, options);

      // Validate the data
      const validation = await this.validators.schema.validate(rawData);
      if (!validation.isValid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }

      // Normalize the data
      const normalizedData = await this.normalizers.schema.normalize(rawData);

      const duration = Date.now() - startTime;
      console.log(`✅ Parsed ${normalizedData.length} records in ${duration}ms`);

      return {
        success: true,
        data: normalizedData,
        metadata: {
          format: fileExtension,
          recordCount: normalizedData.length,
          columns: Object.keys(normalizedData[0] || {}),
          parsingTime: duration,
          validation,
          schema: this.extractSchema(normalizedData),
        },
      };
    } catch (error) {
      console.error(`❌ Failed to parse ${fileExtension} file: ${error.message}`);
      throw error;
    }
  }

  // CSV Parser
  createCSVParser() {
    return {
      parse: async (filePath, options = {}) => {
        const data = [];
        const fileStream = fs.createReadStream(filePath);

        return new Promise((resolve, reject) => {
          fileStream
            .pipe(csv({
              separator: options.separator || ',',
              skipEmptyLines: true,
              trim: true,
            }))
            .on('data', (row) => {
              // Clean and validate row
              const cleanRow = this.cleanRow(row);
              if (Object.keys(cleanRow).length > 0) {
                data.push(cleanRow);
              }
            })
            .on('end', () => resolve(data))
            .on('error', reject);
        });
      },
    };
  }

  // Excel Parser
  createExcelParser() {
    return {
      parse: async (filePath, options = {}) => {
        const workbook = xlsx.readFile(filePath, {
          cellDates: true,
          cellNF: false,
          cellText: false,
        });

        const sheetName = options.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          throw new Error(`Sheet '${sheetName}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
        }

        const data = xlsx.utils.sheet_to_json(worksheet, {
          header: options.header || 1,
          defval: '',
          blankrows: false,
        });

        return data.map((row) => this.cleanRow(row));
      },
    };
  }

  // JSON Parser
  createJSONParser() {
    return {
      parse: async (filePath, options = {}) => {
        const content = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);

        // Handle different JSON structures
        if (Array.isArray(parsed)) {
          return parsed.map((row) => this.cleanRow(row));
        } if (parsed.data && Array.isArray(parsed.data)) {
          return parsed.data.map((row) => this.cleanRow(row));
        } if (parsed.records && Array.isArray(parsed.records)) {
          return parsed.records.map((row) => this.cleanRow(row));
        }
        throw new Error('Unsupported JSON structure. Expected array or object with data/records property.');
      },
    };
  }

  // XML Parser
  createXMLParser() {
    return {
      parse: async (filePath, options = {}) => {
        const content = await fs.readFile(filePath, 'utf8');
        const parser = new xml2js.Parser({
          explicitArray: false,
          mergeAttrs: true,
          normalize: true,
        });

        return new Promise((resolve, reject) => {
          parser.parseString(content, (err, result) => {
            if (err) {
              reject(err);
              return;
            }

            // Extract records from XML structure
            const records = this.extractRecordsFromXML(result, options);
            resolve(records.map((row) => this.cleanRow(row)));
          });
        });
      },
    };
  }

  // Parquet Parser (using Python)
  createParquetParser() {
    return {
      parse: async (filePath, options = {}) => new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../utils/parquet_parser.py');
        const pythonProcess = spawn('python', [pythonScript, filePath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const data = JSON.parse(stdout);
              resolve(data.map((row) => this.cleanRow(row)));
            } catch (error) {
              reject(new Error(`Failed to parse Python output: ${error.message}`));
            }
          } else {
            reject(new Error(`Python parquet parser failed: ${stderr}`));
          }
        });
      }),
    };
  }

  // Google Sheets Parser
  createGoogleSheetsParser() {
    return {
      parse: async (filePath, options = {}) => {
        // For Google Sheets, we expect a downloaded CSV or Excel file
        const fileExtension = this.detectFileFormat(filePath);

        if (fileExtension === 'csv') {
          return this.parsers.csv.parse(filePath, options);
        } if (fileExtension === 'excel') {
          return this.parsers.excel.parse(filePath, options);
        }
        throw new Error('Google Sheets files must be downloaded as CSV or Excel format');
      },
    };
  }

  // Schema Validator
  createSchemaValidator() {
    return {
      validate: async (data) => {
        if (!data || data.length === 0) {
          return {
            isValid: false,
            errors: ['No data found'],
          };
        }

        const errors = [];
        const requiredColumns = ['amount', 'transaction_date'];
        const sampleRow = data[0];

        // Check required columns
        requiredColumns.forEach((column) => {
          if (!sampleRow.hasOwnProperty(column)) {
            errors.push(`Missing required column: ${column}`);
          }
        });

        // Check data consistency
        const columnCount = Object.keys(sampleRow).length;
        data.forEach((row, index) => {
          if (Object.keys(row).length !== columnCount) {
            errors.push(`Row ${index + 1} has inconsistent column count`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          columnCount,
          recordCount: data.length,
        };
      },
    };
  }

  // Data Quality Validator
  createDataQualityValidator() {
    return {
      validate: async (data) => {
        const quality = {
          completeness: 0,
          consistency: 0,
          accuracy: 0,
          issues: [],
        };

        if (!data || data.length === 0) {
          return quality;
        }

        const columns = Object.keys(data[0]);
        let totalCompleteness = 0;
        let totalConsistency = 0;

        columns.forEach((column) => {
          const values = data.map((row) => row[column]);
          const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

          // Completeness
          const completeness = nonNullValues.length / values.length;
          totalCompleteness += completeness;

          if (completeness < 0.8) {
            quality.issues.push(`Low completeness in column ${column}: ${(completeness * 100).toFixed(1)}%`);
          }

          // Consistency (type consistency)
          const types = nonNullValues.map((v) => typeof v);
          const mostCommonType = this.getMostCommon(types);
          const consistency = types.filter((t) => t === mostCommonType).length / types.length;
          totalConsistency += consistency;

          if (consistency < 0.9) {
            quality.issues.push(`Low consistency in column ${column}: ${(consistency * 100).toFixed(1)}%`);
          }
        });

        quality.completeness = totalCompleteness / columns.length;
        quality.consistency = totalConsistency / columns.length;

        return quality;
      },
    };
  }

  // Format Validator
  createFormatValidator() {
    return {
      validate: async (filePath) => {
        const extension = this.detectFileFormat(filePath);
        const stats = await fs.stat(filePath);

        if (stats.size === 0) {
          throw new Error('File is empty');
        }

        if (stats.size > 100 * 1024 * 1024) { // 100MB limit
          throw new Error('File too large (max 100MB)');
        }

        return {
          isValid: true,
          format: extension,
          size: stats.size,
          lastModified: stats.mtime,
        };
      },
    };
  }

  // Schema Normalizer
  createSchemaNormalizer() {
    return {
      normalize: async (data) => {
        if (!data || data.length === 0) {
          return data;
        }

        // Standardize column names
        const columnMapping = {
          'Transaction Amount': 'amount',
          Amount: 'amount',
          'Transaction Date': 'transaction_date',
          Date: 'transaction_date',
          'Transaction ID': 'transaction_id',
          ID: 'transaction_id',
          Merchant: 'merchant_name',
          'Merchant Name': 'merchant_name',
          Category: 'merchant_category',
          'Merchant Category': 'merchant_category',
          Fraud: 'is_fraud',
          'Is Fraud': 'is_fraud',
          'Fraud Score': 'fraud_score',
          'Risk Score': 'fraud_score',
        };

        return data.map((row) => {
          const normalizedRow = {};

          Object.keys(row).forEach((key) => {
            const normalizedKey = columnMapping[key] || key.toLowerCase().replace(/\s+/g, '_');
            normalizedRow[normalizedKey] = row[key];
          });

          return normalizedRow;
        });
      },
    };
  }

  // Data Type Normalizer
  createDataTypeNormalizer() {
    return {
      normalize: async (data) => data.map((row) => {
        const normalizedRow = {};

        Object.keys(row).forEach((key) => {
          const value = row[key];
          normalizedRow[key] = this.normalizeValue(key, value);
        });

        return normalizedRow;
      }),
    };
  }

  // Value Normalizer
  createValueNormalizer() {
    return {
      normalize: async (data) => data.map((row) => {
        const normalizedRow = {};

        Object.keys(row).forEach((key) => {
          let value = row[key];

          // Trim whitespace
          if (typeof value === 'string') {
            value = value.trim();
          }

          // Handle empty values
          if (value === '' || value === null || value === undefined) {
            value = null;
          }

          normalizedRow[key] = value;
        });

        return normalizedRow;
      }),
    };
  }

  // Utility methods
  detectFileFormat(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    const formatMap = {
      '.csv': 'csv',
      '.xlsx': 'excel',
      '.xls': 'excel',
      '.json': 'json',
      '.xml': 'xml',
      '.parquet': 'parquet',
      '.gsheet': 'googleSheets',
    };

    return formatMap[extension] || 'csv';
  }

  cleanRow(row) {
    const cleanRow = {};

    Object.keys(row).forEach((key) => {
      if (key && key.trim()) {
        const cleanKey = key.trim();
        const value = row[key];

        if (value !== null && value !== undefined) {
          cleanRow[cleanKey] = value;
        }
      }
    });

    return cleanRow;
  }

  extractRecordsFromXML(result, options) {
    // Common XML structures for financial data
    const possiblePaths = [
      'records.record',
      'data.record',
      'transactions.transaction',
      'financial_data.transaction',
      'root.record',
      'root.transaction',
    ];

    for (const path of possiblePaths) {
      const records = this.getNestedValue(result, path);
      if (records && Array.isArray(records)) {
        return records;
      }
    }

    // If no standard structure found, try to extract from root level
    const rootKeys = Object.keys(result);
    for (const key of rootKeys) {
      const value = result[key];
      if (Array.isArray(value)) {
        return value;
      }
    }

    throw new Error('Could not extract records from XML structure');
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  getMostCommon(arr) {
    const counts = {};
    arr.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  normalizeValue(key, value) {
    // Normalize based on column name patterns
    if (key.includes('amount') || key.includes('price') || key.includes('value')) {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }

    if (key.includes('date') || key.includes('time')) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }

    if (key.includes('fraud') || key.includes('is_')) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
      }
      if (typeof value === 'number') return value === 1;
      return false;
    }

    return value;
  }

  extractSchema(data) {
    if (!data || data.length === 0) {
      return {};
    }

    const sampleRow = data[0];
    const schema = {};

    Object.keys(sampleRow).forEach((column) => {
      const values = data.map((row) => row[column]).filter((v) => v !== null && v !== undefined);
      const types = values.map((v) => typeof v);
      const mostCommonType = this.getMostCommon(types);

      schema[column] = {
        type: mostCommonType,
        nullable: values.length < data.length,
        uniqueValues: new Set(values).size,
        sampleValues: values.slice(0, 3),
      };
    });

    return schema;
  }
}

module.exports = MultiFormatDataParser;
