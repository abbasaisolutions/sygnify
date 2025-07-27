const fs = require('fs');
const { Transform, Readable } = require('stream');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Large Data Handler Service
 * Handles datasets of any size with streaming, chunking, and memory optimization
 */
class LargeDataHandler {
  constructor() {
    this.chunkSize = 10000; // Default chunk size
    this.maxMemoryUsage = 1024 * 1024 * 1024; // 1GB default
    this.processors = this.initializeProcessors();
    this.optimizers = this.initializeOptimizers();
    this.monitors = this.initializeMonitors();
  }

  initializeProcessors() {
    return {
      streaming: this.createStreamingProcessor(),
      chunking: this.createChunkingProcessor(),
      parallel: this.createParallelProcessor(),
      incremental: this.createIncrementalProcessor(),
    };
  }

  initializeOptimizers() {
    return {
      memory: this.createMemoryOptimizer(),
      performance: this.createPerformanceOptimizer(),
      storage: this.createStorageOptimizer(),
    };
  }

  initializeMonitors() {
    return {
      memory: this.createMemoryMonitor(),
      performance: this.createPerformanceMonitor(),
      progress: this.createProgressMonitor(),
    };
  }

  // Main method for handling large datasets
  async processLargeDataset(input, config = {}) {
    const startTime = Date.now();
    const datasetId = this.generateDatasetId();

    console.log(`📊 Processing large dataset: ${datasetId}`);

    try {
      const { size, type, processingMode = 'streaming' } = config;

      // Initialize monitoring
      const monitor = this.monitors.progress.create(datasetId);

      // Select appropriate processor based on dataset size and type
      const processor = this.selectProcessor(size, type, processingMode);

      // Initialize memory optimization
      const memoryOptimizer = this.optimizers.memory.create(config);

      // Process the dataset
      const result = await processor.process(input, {
        ...config,
        monitor,
        memoryOptimizer,
        datasetId,
      });

      const duration = Date.now() - startTime;

      console.log(`✅ Large dataset processed in ${duration}ms`);

      return {
        success: true,
        datasetId,
        result,
        metadata: {
          processingTime: duration,
          memoryUsage: memoryOptimizer.getMemoryUsage(),
          recordsProcessed: result.recordCount,
          chunksProcessed: result.chunkCount,
        },
      };
    } catch (error) {
      console.error(`❌ Failed to process large dataset: ${error.message}`);
      throw error;
    }
  }

  // Streaming Processor for very large datasets
  createStreamingProcessor() {
    return {
      process: async (input, config) => {
        const { monitor, memoryOptimizer, datasetId } = config;

        return new Promise((resolve, reject) => {
          const records = [];
          let recordCount = 0;
          let chunkCount = 0;

          // Create readable stream from input
          const inputStream = this.createInputStream(input);

          // Create processing pipeline
          const processingPipeline = inputStream
            .pipe(this.createDataTransform())
            .pipe(this.createChunkTransform(config.chunkSize || this.chunkSize))
            .pipe(this.createProcessingTransform(config));

          processingPipeline.on('data', (chunk) => {
            // Process chunk
            const processedChunk = this.processChunk(chunk, config);
            records.push(...processedChunk);
            recordCount += processedChunk.length;
            chunkCount++;

            // Update progress
            monitor.updateProgress(recordCount, chunkCount);

            // Memory optimization
            memoryOptimizer.checkMemoryUsage();

            // Emit chunk for real-time processing
            processingPipeline.emit('chunkProcessed', {
              chunk: processedChunk,
              chunkIndex: chunkCount,
              recordCount,
            });
          });

          processingPipeline.on('end', () => {
            resolve({
              records,
              recordCount,
              chunkCount,
              processingMode: 'streaming',
            });
          });

          processingPipeline.on('error', reject);
        });
      },
    };
  }

  // Chunking Processor for large datasets that fit in memory
  createChunkingProcessor() {
    return {
      process: async (input, config) => {
        const { monitor, memoryOptimizer, datasetId } = config;

        const records = [];
        let recordCount = 0;
        let chunkCount = 0;
        const chunkSize = config.chunkSize || this.chunkSize;

        // Process data in chunks
        for (let i = 0; i < input.length; i += chunkSize) {
          const chunk = input.slice(i, i + chunkSize);

          // Process chunk
          const processedChunk = await this.processChunkAsync(chunk, config);
          records.push(...processedChunk);
          recordCount += processedChunk.length;
          chunkCount++;

          // Update progress
          monitor.updateProgress(recordCount, chunkCount);

          // Memory optimization
          memoryOptimizer.checkMemoryUsage();

          // Yield control to prevent blocking
          if (chunkCount % 10 === 0) {
            await new Promise((resolve) => setImmediate(resolve));
          }
        }

        return {
          records,
          recordCount,
          chunkCount,
          processingMode: 'chunking',
        };
      },
    };
  }

  // Parallel Processor for CPU-intensive operations
  createParallelProcessor() {
    return {
      process: async (input, config) => {
        const {
          monitor, memoryOptimizer, datasetId, maxWorkers = 4,
        } = config;

        const chunkSize = Math.ceil(input.length / maxWorkers);
        const chunks = [];

        // Split data into chunks for parallel processing
        for (let i = 0; i < input.length; i += chunkSize) {
          chunks.push(input.slice(i, i + chunkSize));
        }

        // Process chunks in parallel
        const workerPromises = chunks.map((chunk, index) => this.processChunkInWorker(chunk, { ...config, workerId: index }));

        const results = await Promise.all(workerPromises);

        // Combine results
        const records = results.flatMap((result) => result.records);
        const recordCount = records.length;
        const chunkCount = chunks.length;

        return {
          records,
          recordCount,
          chunkCount,
          processingMode: 'parallel',
          workerCount: maxWorkers,
        };
      },
    };
  }

  // Incremental Processor for datasets that grow over time
  createIncrementalProcessor() {
    return {
      process: async (input, config) => {
        const {
          monitor, memoryOptimizer, datasetId, incrementalKey = 'id',
        } = config;

        // Sort data by incremental key
        const sortedData = input.sort((a, b) => a[incrementalKey] - b[incrementalKey]);

        // Process incrementally
        const records = [];
        let recordCount = 0;
        let chunkCount = 0;
        const chunkSize = config.chunkSize || this.chunkSize;

        for (let i = 0; i < sortedData.length; i += chunkSize) {
          const chunk = sortedData.slice(i, i + chunkSize);

          // Process chunk
          const processedChunk = await this.processChunkAsync(chunk, config);
          records.push(...processedChunk);
          recordCount += processedChunk.length;
          chunkCount++;

          // Update progress
          monitor.updateProgress(recordCount, chunkCount);

          // Memory optimization
          memoryOptimizer.checkMemoryUsage();

          // Store checkpoint for incremental processing
          const lastProcessedKey = chunk[chunk.length - 1]?.[incrementalKey];
          if (lastProcessedKey) {
            this.saveCheckpoint(datasetId, lastProcessedKey);
          }
        }

        return {
          records,
          recordCount,
          chunkCount,
          processingMode: 'incremental',
          lastProcessedKey: records[records.length - 1]?.[incrementalKey],
        };
      },
    };
  }

  // Memory Optimizer
  createMemoryOptimizer() {
    return {
      create: (config) => {
        const maxMemoryUsage = config.maxMemoryUsage || this.maxMemoryUsage;
        let currentMemoryUsage = 0;

        return {
          checkMemoryUsage: () => {
            const usage = process.memoryUsage();
            currentMemoryUsage = usage.heapUsed;

            if (currentMemoryUsage > maxMemoryUsage) {
              // Force garbage collection if available
              if (global.gc) {
                global.gc();
              }

              // Log memory warning
              console.warn(`⚠️ High memory usage: ${(currentMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
            }
          },

          getMemoryUsage: () => {
            const usage = process.memoryUsage();
            return {
              heapUsed: usage.heapUsed,
              heapTotal: usage.heapTotal,
              external: usage.external,
              rss: usage.rss,
            };
          },

          optimize: (data) =>
          // Remove unnecessary properties to reduce memory usage
            data.map((record) => {
              const optimized = {};
              Object.keys(record).forEach((key) => {
                if (record[key] !== null && record[key] !== undefined) {
                  optimized[key] = record[key];
                }
              });
              return optimized;
            }),

        };
      },
    };
  }

  // Performance Optimizer
  createPerformanceOptimizer() {
    return {
      create: (config) => {
        const metrics = {
          startTime: Date.now(),
          operations: 0,
          averageOperationTime: 0,
        };

        return {
          startOperation: () => {
            metrics.operations++;
            return Date.now();
          },

          endOperation: (startTime) => {
            const duration = Date.now() - startTime;
            metrics.averageOperationTime = (metrics.averageOperationTime * (metrics.operations - 1) + duration) / metrics.operations;
          },

          getMetrics: () => ({
            ...metrics,
            totalTime: Date.now() - metrics.startTime,
            operationsPerSecond: metrics.operations / ((Date.now() - metrics.startTime) / 1000),
          }),

          optimize: (config) => {
            // Adjust chunk size based on performance
            if (metrics.averageOperationTime > 1000) {
              config.chunkSize = Math.max(1000, config.chunkSize / 2);
            } else if (metrics.averageOperationTime < 100) {
              config.chunkSize = Math.min(50000, config.chunkSize * 2);
            }
            return config;
          },
        };
      },
    };
  }

  // Storage Optimizer
  createStorageOptimizer() {
    return {
      create: (config) => ({
        compressData: (data) =>
        // Simple compression by removing null/undefined values
          data.map((record) => {
            const compressed = {};
            Object.keys(record).forEach((key) => {
              if (record[key] !== null && record[key] !== undefined) {
                compressed[key] = record[key];
              }
            });
            return compressed;
          }),

        optimizeStorage: (data, format = 'json') => {
          switch (format) {
            case 'json':
              return JSON.stringify(data);
            case 'csv':
              return this.convertToCSV(data);
            case 'parquet':
              return this.convertToParquet(data);
            default:
              return data;
          }
        },
      }),
    };
  }

  // Memory Monitor
  createMemoryMonitor() {
    return {
      create: (config) => {
        const interval = setInterval(() => {
          const usage = process.memoryUsage();
          console.log(`Memory Usage: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }, 5000);

        return {
          stop: () => clearInterval(interval),
          getUsage: () => process.memoryUsage(),
        };
      },
    };
  }

  // Performance Monitor
  createPerformanceMonitor() {
    return {
      create: (config) => {
        const startTime = Date.now();
        const metrics = {
          operations: 0,
          totalTime: 0,
          averageTime: 0,
        };

        return {
          recordOperation: (duration) => {
            metrics.operations++;
            metrics.totalTime += duration;
            metrics.averageTime = metrics.totalTime / metrics.operations;
          },

          getMetrics: () => ({
            ...metrics,
            elapsedTime: Date.now() - startTime,
            operationsPerSecond: metrics.operations / ((Date.now() - startTime) / 1000),
          }),
        };
      },
    };
  }

  // Progress Monitor
  createProgressMonitor() {
    return {
      create: (datasetId) => {
        let recordCount = 0;
        let chunkCount = 0;
        const startTime = Date.now();

        return {
          updateProgress: (records, chunks) => {
            recordCount = records;
            chunkCount = chunks;

            const elapsed = Date.now() - startTime;
            const rate = recordCount / (elapsed / 1000);

            console.log(`📊 Progress: ${recordCount} records, ${chunkCount} chunks, ${rate.toFixed(2)} records/sec`);
          },

          getProgress: () => ({
            recordCount,
            chunkCount,
            elapsedTime: Date.now() - startTime,
            rate: recordCount / ((Date.now() - startTime) / 1000),
          }),
        };
      },
    };
  }

  // Utility methods
  selectProcessor(size, type, mode) {
    if (mode === 'streaming' || size > 1000000) {
      return this.processors.streaming;
    } if (mode === 'parallel' || type === 'cpu_intensive') {
      return this.processors.parallel;
    } if (mode === 'incremental' || type === 'growing') {
      return this.processors.incremental;
    }
    return this.processors.chunking;
  }

  createInputStream(input) {
    if (typeof input === 'string') {
      // File path
      return fs.createReadStream(input);
    } if (Array.isArray(input)) {
      // Array data
      return Readable.from(input);
    } if (input.pipe) {
      // Already a stream
      return input;
    }
    throw new Error('Unsupported input type for streaming');
  }

  createDataTransform() {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Transform chunk if needed
        callback(null, chunk);
      },
    });
  }

  createChunkTransform(chunkSize) {
    let buffer = [];

    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        buffer.push(chunk);

        if (buffer.length >= chunkSize) {
          this.push(buffer);
          buffer = [];
        }

        callback();
      },

      flush(callback) {
        if (buffer.length > 0) {
          this.push(buffer);
        }
        callback();
      },
    });
  }

  createProcessingTransform(config) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Process chunk based on config
        const processed = this.processChunk(chunk, config);
        callback(null, processed);
      },
    });
  }

  processChunk(chunk, config) {
    // Apply transformations to chunk
    let processed = chunk;

    if (config.transform) {
      processed = this.applyTransformations(processed, config.transform);
    }

    if (config.filter) {
      processed = this.applyFilters(processed, config.filter);
    }

    return processed;
  }

  async processChunkAsync(chunk, config) {
    // Async version of chunk processing
    return new Promise((resolve) => {
      setImmediate(() => {
        resolve(this.processChunk(chunk, config));
      });
    });
  }

  async processChunkInWorker(chunk, config) {
    // Process chunk in a separate worker process
    return new Promise((resolve, reject) => {
      const worker = spawn('node', [
        path.join(__dirname, '../utils/data_worker.js'),
        JSON.stringify({ chunk, config }),
      ]);

      let stdout = '';
      let stderr = '';

      worker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      worker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      worker.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse worker output: ${error.message}`));
          }
        } else {
          reject(new Error(`Worker failed: ${stderr}`));
        }
      });
    });
  }

  applyTransformations(data, transformations) {
    return data.map((record) => {
      const transformed = { ...record };

      transformations.forEach((transform) => {
        switch (transform.type) {
          case 'rename':
            if (transformed[transform.from]) {
              transformed[transform.to] = transformed[transform.from];
              delete transformed[transform.from];
            }
            break;
          case 'convert':
            if (transformed[transform.field]) {
              transformed[transform.field] = this.convertValue(
                transformed[transform.field],
                transform.targetType,
              );
            }
            break;
          case 'calculate':
            if (transform.expression) {
              transformed[transform.targetField] = this.evaluateExpression(
                transformed,
                transform.expression,
              );
            }
            break;
        }
      });

      return transformed;
    });
  }

  applyFilters(data, filters) {
    return data.filter((record) => filters.every((filter) => {
      const value = record[filter.field];

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'not_equals':
          return value !== filter.value;
        case 'greater_than':
          return value > filter.value;
        case 'less_than':
          return value < filter.value;
        case 'contains':
          return String(value).includes(filter.value);
        case 'regex':
          return new RegExp(filter.value).test(String(value));
        default:
          return true;
      }
    }));
  }

  convertValue(value, targetType) {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value).toISOString();
      default:
        return value;
    }
  }

  evaluateExpression(record, expression) {
    return eval(expression.replace(/\{(\w+)\}/g, (match, field) => record[field] || 0));
  }

  saveCheckpoint(datasetId, lastProcessedKey) {
    const checkpointPath = path.join(__dirname, '../checkpoints', `${datasetId}.json`);
    const checkpoint = {
      datasetId,
      lastProcessedKey,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint));
  }

  loadCheckpoint(datasetId) {
    const checkpointPath = path.join(__dirname, '../checkpoints', `${datasetId}.json`);

    if (fs.existsSync(checkpointPath)) {
      const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
      return checkpoint.lastProcessedKey;
    }

    return null;
  }

  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  convertToParquet(data) {
    // This would use Python with pandas/pyarrow
    // For now, return JSON as placeholder
    return JSON.stringify(data);
  }

  generateDatasetId() {
    return `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = LargeDataHandler;
