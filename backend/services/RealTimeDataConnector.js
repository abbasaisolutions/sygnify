const axios = require('axios');
const WebSocket = require('ws');
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const { BigQuery } = require('@google-cloud/bigquery');
const { spawn } = require('child_process');

/**
 * Real-Time Data Connector Service
 * Supports REST APIs, GraphQL, databases, and streaming data
 */
class RealTimeDataConnector {
  constructor() {
    this.connections = new Map();
    this.streams = new Map();
    this.authenticators = this.initializeAuthenticators();
    this.connectors = this.initializeConnectors();
    this.processors = this.initializeProcessors();
  }

  initializeAuthenticators() {
    return {
      // OAuth 2.0 authentication
      oauth2: {
        authenticate: async (config) => {
          const {
            clientId, clientSecret, tokenUrl, scope,
          } = config;

          try {
            const response = await axios.post(tokenUrl, {
              grant_type: 'client_credentials',
              client_id: clientId,
              client_secret: clientSecret,
              scope,
            }, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            return {
              access_token: response.data.access_token,
              token_type: response.data.token_type,
              expires_in: response.data.expires_in,
            };
          } catch (error) {
            throw new Error(`OAuth authentication failed: ${error.message}`);
          }
        },
      },

      // API Key authentication
      apiKey: {
        authenticate: async (config) => ({
          api_key: config.apiKey,
          header_name: config.headerName || 'X-API-Key',
        }),
      },

      // Basic authentication
      basic: {
        authenticate: async (config) => {
          const { username, password } = config;
          const credentials = Buffer.from(`${username}:${password}`).toString('base64');

          return {
            authorization: `Basic ${credentials}`,
          };
        },
      },

      // Bearer token authentication
      bearer: {
        authenticate: async (config) => ({
          authorization: `Bearer ${config.token}`,
        }),
      },
    };
  }

  initializeConnectors() {
    return {
      // REST API connector
      rest: this.createRESTConnector(),

      // GraphQL connector
      graphql: this.createGraphQLConnector(),

      // PostgreSQL connector
      postgresql: this.createPostgreSQLConnector(),

      // MongoDB connector
      mongodb: this.createMongoDBConnector(),

      // Google BigQuery connector
      bigquery: this.createBigQueryConnector(),

      // WebSocket connector
      websocket: this.createWebSocketConnector(),

      // Kafka connector (via Python)
      kafka: this.createKafkaConnector(),
    };
  }

  initializeProcessors() {
    return {
      // Real-time data processor
      realtime: this.createRealtimeProcessor(),

      // Batch data processor
      batch: this.createBatchProcessor(),

      // Stream processor
      stream: this.createStreamProcessor(),
    };
  }

  // Main connection method
  async connectToDataSource(config) {
    const { type, name, connectionConfig } = config;

    console.log(`🔌 Connecting to ${type} data source: ${name}`);

    try {
      // Authenticate if required
      let auth = null;
      if (connectionConfig.authentication) {
        const authenticator = this.authenticators[connectionConfig.authentication.type];
        if (!authenticator) {
          throw new Error(`Unsupported authentication type: ${connectionConfig.authentication.type}`);
        }
        auth = await authenticator.authenticate(connectionConfig.authentication);
      }

      // Create connection
      const connector = this.connectors[type];
      if (!connector) {
        throw new Error(`Unsupported connector type: ${type}`);
      }

      const connection = await connector.connect({
        ...connectionConfig,
        authentication: auth,
      });

      // Store connection
      this.connections.set(name, {
        type,
        connection,
        config: connectionConfig,
        status: 'connected',
        connectedAt: new Date(),
      });

      console.log(`✅ Connected to ${type} data source: ${name}`);

      return {
        success: true,
        connectionId: name,
        type,
        status: 'connected',
      };
    } catch (error) {
      console.error(`❌ Failed to connect to ${type} data source: ${error.message}`);
      throw error;
    }
  }

  // REST API Connector
  createRESTConnector() {
    return {
      connect: async (config) => {
        const { baseURL, headers = {}, timeout = 30000 } = config;

        const client = axios.create({
          baseURL,
          timeout,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });

        // Add authentication headers
        if (config.authentication) {
          if (config.authentication.authorization) {
            client.defaults.headers.common.Authorization = config.authentication.authorization;
          } else if (config.authentication.api_key) {
            client.defaults.headers.common[config.authentication.header_name] = config.authentication.api_key;
          }
        }

        return {
          type: 'rest',
          client,
          config,
          fetch: async (endpoint, options = {}) => {
            try {
              const response = await client.get(endpoint, options);
              return response.data;
            } catch (error) {
              throw new Error(`REST API request failed: ${error.message}`);
            }
          },
          post: async (endpoint, data, options = {}) => {
            try {
              const response = await client.post(endpoint, data, options);
              return response.data;
            } catch (error) {
              throw new Error(`REST API POST failed: ${error.message}`);
            }
          },
        };
      },
    };
  }

  // GraphQL Connector
  createGraphQLConnector() {
    return {
      connect: async (config) => {
        const { endpoint, headers = {} } = config;

        const client = axios.create({
          baseURL: endpoint,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });

        // Add authentication headers
        if (config.authentication) {
          if (config.authentication.authorization) {
            client.defaults.headers.common.Authorization = config.authentication.authorization;
          }
        }

        return {
          type: 'graphql',
          client,
          config,
          query: async (query, variables = {}) => {
            try {
              const response = await client.post('', {
                query,
                variables,
              });

              if (response.data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
              }

              return response.data.data;
            } catch (error) {
              throw new Error(`GraphQL query failed: ${error.message}`);
            }
          },
          mutation: async (mutation, variables = {}) => {
            try {
              const response = await client.post('', {
                query: mutation,
                variables,
              });

              if (response.data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
              }

              return response.data.data;
            } catch (error) {
              throw new Error(`GraphQL mutation failed: ${error.message}`);
            }
          },
        };
      },
    };
  }

  // PostgreSQL Connector
  createPostgreSQLConnector() {
    return {
      connect: async (config) => {
        const {
          host, port, database, user, password, ssl = false,
        } = config;

        const client = new Client({
          host,
          port,
          database,
          user,
          password,
          ssl,
        });

        await client.connect();

        return {
          type: 'postgresql',
          client,
          config,
          query: async (sql, params = []) => {
            try {
              const result = await client.query(sql, params);
              return result.rows;
            } catch (error) {
              throw new Error(`PostgreSQL query failed: ${error.message}`);
            }
          },
          close: async () => {
            await client.end();
          },
        };
      },
    };
  }

  // MongoDB Connector
  createMongoDBConnector() {
    return {
      connect: async (config) => {
        const { uri, database, options = {} } = config;

        const client = new MongoClient(uri, options);
        await client.connect();

        const db = client.db(database);

        return {
          type: 'mongodb',
          client,
          db,
          config,
          collection: (name) => db.collection(name),
          query: async (collectionName, query = {}, options = {}) => {
            try {
              const collection = db.collection(collectionName);
              const cursor = collection.find(query, options);
              return await cursor.toArray();
            } catch (error) {
              throw new Error(`MongoDB query failed: ${error.message}`);
            }
          },
          close: async () => {
            await client.close();
          },
        };
      },
    };
  }

  // Google BigQuery Connector
  createBigQueryConnector() {
    return {
      connect: async (config) => {
        const { projectId, keyFilename } = config;

        const bigquery = new BigQuery({
          projectId,
          keyFilename,
        });

        return {
          type: 'bigquery',
          client: bigquery,
          config,
          query: async (sql, options = {}) => {
            try {
              const [rows] = await bigquery.query({
                query: sql,
                ...options,
              });
              return rows;
            } catch (error) {
              throw new Error(`BigQuery query failed: ${error.message}`);
            }
          },
          dataset: (datasetId) => bigquery.dataset(datasetId),
          table: (datasetId, tableId) => bigquery.dataset(datasetId).table(tableId),
        };
      },
    };
  }

  // WebSocket Connector
  createWebSocketConnector() {
    return {
      connect: async (config) => {
        const { url, protocols = [], options = {} } = config;

        const ws = new WebSocket(url, protocols, options);

        return new Promise((resolve, reject) => {
          ws.on('open', () => {
            console.log(`🔌 WebSocket connected to: ${url}`);
            resolve({
              type: 'websocket',
              client: ws,
              config,
              send: (data) => {
                ws.send(JSON.stringify(data));
              },
              onMessage: (callback) => {
                ws.on('message', (data) => {
                  try {
                    const parsed = JSON.parse(data);
                    callback(parsed);
                  } catch (error) {
                    callback(data.toString());
                  }
                });
              },
              close: () => {
                ws.close();
              },
            });
          });

          ws.on('error', (error) => {
            reject(new Error(`WebSocket connection failed: ${error.message}`));
          });
        });
      },
    };
  }

  // Kafka Connector (via Python)
  createKafkaConnector() {
    return {
      connect: async (config) => {
        const { bootstrapServers, topic, groupId } = config;

        return new Promise((resolve, reject) => {
          const pythonScript = path.join(__dirname, '../utils/kafka_connector.py');
          const pythonProcess = spawn('python', [
            pythonScript,
            '--bootstrap-servers', bootstrapServers,
            '--topic', topic,
            '--group-id', groupId,
          ]);

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
                const connectionInfo = JSON.parse(stdout);
                resolve({
                  type: 'kafka',
                  process: pythonProcess,
                  config,
                  connectionInfo,
                  close: () => {
                    pythonProcess.kill();
                  },
                });
              } catch (error) {
                reject(new Error(`Failed to parse Kafka connection info: ${error.message}`));
              }
            } else {
              reject(new Error(`Kafka connection failed: ${stderr}`));
            }
          });
        });
      },
    };
  }

  // Real-time Data Processor
  createRealtimeProcessor() {
    return {
      process: async (data, config = {}) => {
        const { transform, filter, aggregate } = config;

        let processedData = data;

        // Apply transformations
        if (transform) {
          processedData = this.applyTransformations(processedData, transform);
        }

        // Apply filters
        if (filter) {
          processedData = this.applyFilters(processedData, filter);
        }

        // Apply aggregations
        if (aggregate) {
          processedData = this.applyAggregations(processedData, aggregate);
        }

        return processedData;
      },
    };
  }

  // Batch Data Processor
  createBatchProcessor() {
    return {
      process: async (data, config = {}) => {
        const { batchSize = 1000, transform, validate } = config;

        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
          let batch = data.slice(i, i + batchSize);

          // Apply transformations
          if (transform) {
            batch = this.applyTransformations(batch, transform);
          }

          // Apply validation
          if (validate) {
            batch = this.applyValidation(batch, validate);
          }

          batches.push(batch);
        }

        return batches;
      },
    };
  }

  // Stream Processor
  createStreamProcessor() {
    return {
      process: async (stream, config = {}) => {
        const { bufferSize = 100, windowSize = 1000, transform } = config;

        const buffer = [];
        const window = [];

        return new Promise((resolve, reject) => {
          stream.on('data', (data) => {
            // Add to buffer
            buffer.push(data);

            // Add to sliding window
            window.push(data);
            if (window.length > windowSize) {
              window.shift();
            }

            // Process buffer when full
            if (buffer.length >= bufferSize) {
              const batch = buffer.splice(0, bufferSize);
              const processed = transform ? this.applyTransformations(batch, transform) : batch;

              // Emit processed batch
              stream.emit('processed', processed);
            }
          });

          stream.on('end', () => {
            // Process remaining data
            if (buffer.length > 0) {
              const processed = transform ? this.applyTransformations(buffer, transform) : buffer;
              stream.emit('processed', processed);
            }
            resolve();
          });

          stream.on('error', reject);
        });
      },
    };
  }

  // Data transformation utilities
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

  applyAggregations(data, aggregations) {
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

  applyValidation(data, validation) {
    return data.filter((record) => validation.rules.every((rule) => {
      const value = record[rule.field];

      switch (rule.type) {
        case 'required':
          return value !== null && value !== undefined && value !== '';
        case 'type':
          return typeof value === rule.expectedType;
        case 'range':
          const num = parseFloat(value);
          return num >= rule.min && num <= rule.max;
        case 'pattern':
          return new RegExp(rule.pattern).test(String(value));
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
    // Simple expression evaluator
    // Supports basic arithmetic and field references
    return eval(expression.replace(/\{(\w+)\}/g, (match, field) => record[field] || 0));
  }

  // Connection management
  getConnection(name) {
    return this.connections.get(name);
  }

  listConnections() {
    return Array.from(this.connections.entries()).map(([name, conn]) => ({
      name,
      type: conn.type,
      status: conn.status,
      connectedAt: conn.connectedAt,
    }));
  }

  disconnect(name) {
    const connection = this.connections.get(name);
    if (connection) {
      if (connection.connection.close) {
        connection.connection.close();
      }
      this.connections.delete(name);
      console.log(`🔌 Disconnected from: ${name}`);
    }
  }

  disconnectAll() {
    this.connections.forEach((connection, name) => {
      this.disconnect(name);
    });
  }
}

module.exports = RealTimeDataConnector;
