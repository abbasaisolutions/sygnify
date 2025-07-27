#!/usr/bin/env node

/**
 * Data Worker for Parallel Processing
 * Handles chunk processing in separate processes
 */

const { parentPort } = require('worker_threads');

// Receive data from parent
parentPort.on('message', async (data) => {
  try {
    const { chunk, config } = JSON.parse(data);

    // Process the chunk
    const processedChunk = await processChunk(chunk, config);

    // Send result back to parent
    parentPort.postMessage(JSON.stringify({
      success: true,
      records: processedChunk,
      recordCount: processedChunk.length,
    }));
  } catch (error) {
    parentPort.postMessage(JSON.stringify({
      success: false,
      error: error.message,
    }));
  }
});

async function processChunk(chunk, config) {
  let processed = chunk;

  // Apply transformations
  if (config.transform) {
    processed = applyTransformations(processed, config.transform);
  }

  // Apply filters
  if (config.filter) {
    processed = applyFilters(processed, config.filter);
  }

  // Apply aggregations
  if (config.aggregate) {
    processed = applyAggregations(processed, config.aggregate);
  }

  return processed;
}

function applyTransformations(data, transformations) {
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
            transformed[transform.field] = convertValue(
              transformed[transform.field],
              transform.targetType,
            );
          }
          break;
        case 'calculate':
          if (transform.expression) {
            transformed[transform.targetField] = evaluateExpression(
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

function applyFilters(data, filters) {
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

function applyAggregations(data, aggregations) {
  const results = {};

  aggregations.forEach((agg) => {
    const values = data.map((record) => record[agg.field]).filter((v) => v !== null && v !== undefined);

    switch (agg.type) {
      case 'sum':
        results[agg.targetField] = values.reduce((sum, val) => sum + parseFloat(val), 0);
        break;
      case 'average':
        results[agg.targetField] = values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length;
        break;
      case 'count':
        results[agg.targetField] = values.length;
        break;
      case 'min':
        results[agg.targetField] = Math.min(...values.map((v) => parseFloat(v)));
        break;
      case 'max':
        results[agg.targetField] = Math.max(...values.map((v) => parseFloat(v)));
        break;
    }
  });

  return results;
}

function convertValue(value, targetType) {
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

function evaluateExpression(record, expression) {
  return eval(expression.replace(/\{(\w+)\}/g, (match, field) => record[field] || 0));
}

// Handle process termination
process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});
