const { mean, std, quantile } = require('simple-statistics');

/**
 * Advanced Anomaly Detection Service
 * Implements sophisticated anomaly detection with contextual analysis and severity prioritization
 */
class AdvancedAnomalyDetectionService {
  constructor() {
    this.detectors = this.initializeDetectors();
    this.contextualAnalyzer = this.initializeContextualAnalyzer();
    this.severityClassifier = this.initializeSeverityClassifier();
  }

  initializeDetectors() {
    return {
      isolationForest: this.createIsolationForest(),
      localOutlierFactor: this.createLocalOutlierFactor(),
      oneClassSVM: this.createOneClassSVM(),
      contextualDetector: this.createContextualDetector(),
      temporalDetector: this.createTemporalDetector(),
      graphBasedDetector: this.createGraphBasedDetector(),
    };
  }

  createIsolationForest() {
    return {
      detect: (data, contamination = 0.1) => {
        const anomalies = [];
        const numTrees = 100;
        const sampleSize = Math.min(256, data.length);

        // Build multiple isolation trees
        const trees = [];
        for (let i = 0; i < numTrees; i++) {
          const sample = this.getRandomSample(data, sampleSize);
          trees.push(this.buildIsolationTree(sample, 0, Math.ceil(Math.log2(sampleSize))));
        }

        // Calculate anomaly scores
        data.forEach((point, index) => {
          const scores = trees.map((tree) => this.getPathLength(point, tree));
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          const anomalyScore = 2 ** (-avgScore / this.getExpectedPathLength(sampleSize));

          if (anomalyScore > 0.5) { // Lower threshold for more sensitive detection
            anomalies.push({
              index,
              score: anomalyScore,
              method: 'isolation_forest',
              severity: this.classifySeverity(anomalyScore),
              context: this.getAnomalyContext(point, data),
            });
          }
        });

        return anomalies;
      },

      buildIsolationTree: (data, depth, maxDepth) => {
        if (depth >= maxDepth || data.length <= 1) {
          return { type: 'leaf', size: data.length };
        }

        const feature = Math.floor(Math.random() * Object.keys(data[0]).length);
        const featureName = Object.keys(data[0])[feature];
        const values = data.map((point) => point[featureName]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const splitValue = min + Math.random() * (max - min);

        const leftData = data.filter((point) => point[featureName] < splitValue);
        const rightData = data.filter((point) => point[featureName] >= splitValue);

        return {
          type: 'node',
          feature: featureName,
          splitValue,
          left: this.buildIsolationTree(leftData, depth + 1, maxDepth),
          right: this.buildIsolationTree(rightData, depth + 1, maxDepth),
        };
      },

      getPathLength: (point, tree) => {
        if (tree.type === 'leaf') {
          return this.getExpectedPathLength(tree.size);
        }

        const value = point[tree.feature];
        const nextTree = value < tree.splitValue ? tree.left : tree.right;
        return 1 + this.getPathLength(point, nextTree);
      },

      getExpectedPathLength: (n) => {
        if (n <= 1) return 0;
        return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
      },
    };
  }

  createLocalOutlierFactor() {
    return {
      detect: (data, k = 10) => {
        const anomalies = [];

        data.forEach((point, index) => {
          const neighbors = this.findKNearestNeighbors(data, point, k, index);
          const lof = this.calculateLOF(data, point, neighbors, k);

          if (lof > 1.5) { // LOF threshold
            anomalies.push({
              index,
              score: lof,
              method: 'local_outlier_factor',
              severity: this.classifySeverity(lof / 3), // Normalize to [0,1]
              context: this.getAnomalyContext(point, data),
              neighbors: neighbors.length,
            });
          }
        });

        return anomalies;
      },

      findKNearestNeighbors: (data, point, k, excludeIndex) => {
        const distances = [];

        data.forEach((otherPoint, index) => {
          if (index !== excludeIndex) {
            const distance = this.calculateDistance(point, otherPoint);
            distances.push({ index, distance });
          }
        });

        return distances
          .sort((a, b) => a.distance - b.distance)
          .slice(0, k)
          .map((item) => item.index);
      },

      calculateLOF: (data, point, neighbors, k) => {
        const reachabilityDistances = neighbors.map((neighborIndex) => this.calculateReachabilityDistance(data, point, data[neighborIndex], k));

        const avgReachability = reachabilityDistances.reduce((sum, dist) => sum + dist, 0) / k;
        const localReachabilityDensity = 1 / avgReachability;

        const neighborLOFs = neighbors.map((neighborIndex) => {
          const neighborNeighbors = this.findKNearestNeighbors(data, data[neighborIndex], k, neighborIndex);
          const neighborReachabilityDistances = neighborNeighbors.map((nnIndex) => this.calculateReachabilityDistance(data, data[neighborIndex], data[nnIndex], k));
          const neighborAvgReachability = neighborReachabilityDistances.reduce((sum, dist) => sum + dist, 0) / k;
          return 1 / neighborAvgReachability;
        });

        const avgNeighborLOF = neighborLOFs.reduce((sum, lof) => sum + lof, 0) / k;
        return avgNeighborLOF / localReachabilityDensity;
      },

      calculateReachabilityDistance: (data, point1, point2, k) => {
        const kDistance = this.calculateKDistance(data, point2, k);
        const actualDistance = this.calculateDistance(point1, point2);
        return Math.max(kDistance, actualDistance);
      },

      calculateKDistance: (data, point, k) => {
        const distances = data.map((otherPoint) => this.calculateDistance(point, otherPoint));
        distances.sort((a, b) => a - b);
        return distances[k];
      },

      calculateDistance: (point1, point2) => {
        // Euclidean distance for numeric features
        const numericFeatures = ['amount', 'fraud_score', 'balance'];
        let sum = 0;

        numericFeatures.forEach((feature) => {
          if (point1[feature] !== undefined && point2[feature] !== undefined) {
            const diff = parseFloat(point1[feature]) - parseFloat(point2[feature]);
            sum += diff * diff;
          }
        });

        return Math.sqrt(sum);
      },
    };
  }

  createOneClassSVM() {
    return {
      detect: (data) => {
        const anomalies = [];
        const nu = 0.1; // Expected fraction of outliers

        // Simplified One-Class SVM using kernel trick
        data.forEach((point, index) => {
          const score = this.calculateSVMScore(point, data, nu);

          if (score < 0) { // Negative score indicates outlier
            anomalies.push({
              index,
              score: Math.abs(score),
              method: 'one_class_svm',
              severity: this.classifySeverity(Math.abs(score)),
              context: this.getAnomalyContext(point, data),
            });
          }
        });

        return anomalies;
      },

      calculateSVMScore: (point, data, nu) => {
        // Simplified kernel calculation
        const kernelValues = data.map((otherPoint) => this.calculateKernel(point, otherPoint));
        const avgKernel = kernelValues.reduce((sum, val) => sum + val, 0) / kernelValues.length;
        return avgKernel - nu;
      },

      calculateKernel: (point1, point2) => {
        // RBF kernel approximation
        const distance = this.calculateDistance(point1, point2);
        return Math.exp(-distance * distance / 2);
      },

      calculateDistance: (point1, point2) => {
        const numericFeatures = ['amount', 'fraud_score', 'balance'];
        let sum = 0;

        numericFeatures.forEach((feature) => {
          if (point1[feature] !== undefined && point2[feature] !== undefined) {
            const diff = parseFloat(point1[feature]) - parseFloat(point2[feature]);
            sum += diff * diff;
          }
        });

        return Math.sqrt(sum);
      },
    };
  }

  createContextualDetector() {
    return {
      detect: (data) => {
        const anomalies = [];

        // Group by merchant category for contextual analysis
        const categoryGroups = this.groupBy(data, 'merchant_category');

        Object.entries(categoryGroups).forEach(([category, transactions]) => {
          const categoryAnomalies = this.detectCategoryAnomalies(transactions, category);
          anomalies.push(...categoryAnomalies);
        });

        // Group by merchant state for geographic analysis
        const stateGroups = this.groupBy(data, 'merchant_state');

        Object.entries(stateGroups).forEach(([state, transactions]) => {
          const stateAnomalies = this.detectStateAnomalies(transactions, state);
          anomalies.push(...stateAnomalies);
        });

        // Group by transaction type
        const typeGroups = this.groupBy(data, 'transaction_type');

        Object.entries(typeGroups).forEach(([type, transactions]) => {
          const typeAnomalies = this.detectTypeAnomalies(transactions, type);
          anomalies.push(...typeAnomalies);
        });

        return this.deduplicateAnomalies(anomalies);
      },

      detectCategoryAnomalies: (transactions, category) => {
        const anomalies = [];
        const amounts = transactions.map((t) => parseFloat(t.amount));
        const fraudScores = transactions.map((t) => parseFloat(t.fraud_score));

        const amountMean = mean(amounts);
        const amountStd = std(amounts);
        const fraudMean = mean(fraudScores);
        const fraudStd = std(fraudScores);

        transactions.forEach((transaction, index) => {
          const amount = parseFloat(transaction.amount);
          const fraudScore = parseFloat(transaction.fraud_score);

          const amountZScore = Math.abs((amount - amountMean) / amountStd);
          const fraudZScore = Math.abs((fraudScore - fraudMean) / fraudStd);

          if (amountZScore > 3 || fraudZScore > 3) {
            anomalies.push({
              index: transactions.indexOf(transaction),
              score: Math.max(amountZScore, fraudZScore) / 5, // Normalize
              method: 'contextual_category',
              severity: this.classifySeverity(Math.max(amountZScore, fraudZScore) / 5),
              context: {
                category,
                expectedAmountRange: [amountMean - 2 * amountStd, amountMean + 2 * amountStd],
                expectedFraudRange: [fraudMean - 2 * fraudStd, fraudMean + 2 * fraudStd],
                actualAmount: amount,
                actualFraudScore: fraudScore,
                amountZScore,
                fraudZScore,
              },
            });
          }
        });

        return anomalies;
      },

      detectStateAnomalies: (transactions, state) => {
        const anomalies = [];
        const amounts = transactions.map((t) => parseFloat(t.amount));
        const amountMean = mean(amounts);
        const amountStd = std(amounts);

        transactions.forEach((transaction, index) => {
          const amount = parseFloat(transaction.amount);
          const zScore = Math.abs((amount - amountMean) / amountStd);

          if (zScore > 3) {
            anomalies.push({
              index: transactions.indexOf(transaction),
              score: zScore / 5,
              method: 'contextual_state',
              severity: this.classifySeverity(zScore / 5),
              context: {
                state,
                expectedRange: [amountMean - 2 * amountStd, amountMean + 2 * amountStd],
                actualAmount: amount,
                zScore,
              },
            });
          }
        });

        return anomalies;
      },

      detectTypeAnomalies: (transactions, type) => {
        const anomalies = [];
        const amounts = transactions.map((t) => parseFloat(t.amount));
        const amountMean = mean(amounts);
        const amountStd = std(amounts);

        transactions.forEach((transaction, index) => {
          const amount = parseFloat(transaction.amount);
          const zScore = Math.abs((amount - amountMean) / amountStd);

          if (zScore > 3) {
            anomalies.push({
              index: transactions.indexOf(transaction),
              score: zScore / 5,
              method: 'contextual_type',
              severity: this.classifySeverity(zScore / 5),
              context: {
                type,
                expectedRange: [amountMean - 2 * amountStd, amountMean + 2 * amountStd],
                actualAmount: amount,
                zScore,
              },
            });
          }
        });

        return anomalies;
      },
    };
  }

  createTemporalDetector() {
    return {
      detect: (data) => {
        const anomalies = [];

        // Sort by transaction date
        const sortedData = data.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        // Detect temporal anomalies
        const temporalAnomalies = this.detectTemporalPatterns(sortedData);
        anomalies.push(...temporalAnomalies);

        // Detect seasonal anomalies
        const seasonalAnomalies = this.detectSeasonalAnomalies(sortedData);
        anomalies.push(...seasonalAnomalies);

        // Detect trend anomalies
        const trendAnomalies = this.detectTrendAnomalies(sortedData);
        anomalies.push(...trendAnomalies);

        return anomalies;
      },

      detectTemporalPatterns: (data) => {
        const anomalies = [];
        const windowSize = 100; // Rolling window

        for (let i = windowSize; i < data.length; i++) {
          const window = data.slice(i - windowSize, i);
          const currentTransaction = data[i];

          const windowAmounts = window.map((t) => parseFloat(t.amount));
          const windowMean = mean(windowAmounts);
          const windowStd = std(windowAmounts);

          const currentAmount = parseFloat(currentTransaction.amount);
          const zScore = Math.abs((currentAmount - windowMean) / windowStd);

          if (zScore > 3) {
            anomalies.push({
              index: i,
              score: zScore / 5,
              method: 'temporal_pattern',
              severity: this.classifySeverity(zScore / 5),
              context: {
                windowSize,
                expectedRange: [windowMean - 2 * windowStd, windowMean + 2 * windowStd],
                actualAmount: currentAmount,
                zScore,
                trend: currentAmount > windowMean ? 'increasing' : 'decreasing',
              },
            });
          }
        }

        return anomalies;
      },

      detectSeasonalAnomalies: (data) => {
        const anomalies = [];

        // Group by month
        const monthlyGroups = this.groupBy(data, 'transaction_date', (date) => new Date(date).getMonth());

        Object.entries(monthlyGroups).forEach(([month, transactions]) => {
          const amounts = transactions.map((t) => parseFloat(t.amount));
          const mean = mean(amounts);
          const std = std(amounts);

          transactions.forEach((transaction, index) => {
            const amount = parseFloat(transaction.amount);
            const zScore = Math.abs((amount - mean) / std);

            if (zScore > 3) {
              anomalies.push({
                index: data.indexOf(transaction),
                score: zScore / 5,
                method: 'seasonal_anomaly',
                severity: this.classifySeverity(zScore / 5),
                context: {
                  month: parseInt(month),
                  expectedRange: [mean - 2 * std, mean + 2 * std],
                  actualAmount: amount,
                  zScore,
                },
              });
            }
          });
        });

        return anomalies;
      },

      detectTrendAnomalies: (data) => {
        const anomalies = [];
        const amounts = data.map((t) => parseFloat(t.amount));

        // Calculate trend using linear regression
        const x = Array.from({ length: amounts.length }, (_, i) => i);
        const trend = this.calculateTrend(x, amounts);

        // Detect deviations from trend
        amounts.forEach((amount, index) => {
          const expectedAmount = trend.slope * index + trend.intercept;
          const deviation = Math.abs(amount - expectedAmount);
          const threshold = std(amounts) * 2;

          if (deviation > threshold) {
            anomalies.push({
              index,
              score: deviation / (std(amounts) * 5),
              method: 'trend_anomaly',
              severity: this.classifySeverity(deviation / (std(amounts) * 5)),
              context: {
                expectedAmount,
                actualAmount: amount,
                deviation,
                trend: trend.slope > 0 ? 'increasing' : 'decreasing',
              },
            });
          }
        });

        return anomalies;
      },

      calculateTrend: (x, y) => {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
      },
    };
  }

  createGraphBasedDetector() {
    return {
      detect: (data) => {
        const anomalies = [];

        // Build transaction graph
        const graph = this.buildTransactionGraph(data);

        // Detect fraud clusters
        const fraudClusters = this.detectFraudClusters(graph);

        // Detect suspicious merchant patterns
        const merchantAnomalies = this.detectMerchantAnomalies(graph);

        // Detect customer behavior anomalies
        const customerAnomalies = this.detectCustomerAnomalies(graph);

        anomalies.push(...fraudClusters, ...merchantAnomalies, ...customerAnomalies);

        return anomalies;
      },

      buildTransactionGraph: (data) => {
        const nodes = new Map();
        const edges = [];

        data.forEach((row) => {
          const customerId = row.customer_id;
          const merchantId = row.merchant_id;
          const transactionId = row.transaction_id;

          if (!nodes.has(customerId)) {
            nodes.set(customerId, { type: 'customer', id: customerId, transactions: [] });
          }
          if (!nodes.has(merchantId)) {
            nodes.set(merchantId, { type: 'merchant', id: merchantId, transactions: [] });
          }

          nodes.get(customerId).transactions.push(transactionId);
          nodes.get(merchantId).transactions.push(transactionId);

          edges.push({
            from: customerId,
            to: merchantId,
            transaction: transactionId,
            amount: parseFloat(row.amount),
            fraud: row.is_fraud === '1',
            fraud_score: parseFloat(row.fraud_score),
          });
        });

        return { nodes, edges };
      },

      detectFraudClusters: (graph) => {
        const anomalies = [];
        const fraudEdges = graph.edges.filter((edge) => edge.fraud);

        // Find connected fraud components
        const fraudNodes = new Set();
        fraudEdges.forEach((edge) => {
          fraudNodes.add(edge.from);
          fraudNodes.add(edge.to);
        });

        const clusters = this.findConnectedComponents(graph, Array.from(fraudNodes));

        clusters.forEach((cluster) => {
          if (cluster.length > 2) { // Significant cluster
            const clusterRisk = this.calculateClusterRisk(cluster, graph);

            cluster.forEach((nodeId) => {
              anomalies.push({
                index: this.findTransactionIndex(nodeId, graph),
                score: clusterRisk,
                method: 'fraud_cluster',
                severity: this.classifySeverity(clusterRisk),
                context: {
                  clusterSize: cluster.length,
                  clusterRisk,
                  nodeType: graph.nodes.get(nodeId).type,
                },
              });
            });
          }
        });

        return anomalies;
      },

      detectMerchantAnomalies: (graph) => {
        const anomalies = [];
        const merchantStats = new Map();

        // Calculate merchant statistics
        graph.edges.forEach((edge) => {
          const merchantId = edge.to;
          if (!merchantStats.has(merchantId)) {
            merchantStats.set(merchantId, {
              totalAmount: 0,
              transactionCount: 0,
              fraudCount: 0,
              avgFraudScore: 0,
            });
          }

          const stats = merchantStats.get(merchantId);
          stats.totalAmount += edge.amount;
          stats.transactionCount++;
          if (edge.fraud) stats.fraudCount++;
          stats.avgFraudScore += edge.fraud_score;
        });

        // Normalize fraud scores
        merchantStats.forEach((stats, merchantId) => {
          stats.avgFraudScore /= stats.transactionCount;
          stats.fraudRate = stats.fraudCount / stats.transactionCount;
          stats.avgAmount = stats.totalAmount / stats.transactionCount;
        });

        // Detect anomalous merchants
        const fraudRates = Array.from(merchantStats.values()).map((stats) => stats.fraudRate);
        const avgFraudRate = mean(fraudRates);
        const fraudRateStd = std(fraudRates);

        merchantStats.forEach((stats, merchantId) => {
          const fraudRateZScore = Math.abs((stats.fraudRate - avgFraudRate) / fraudRateStd);

          if (fraudRateZScore > 2) {
            const merchantTransactions = graph.edges.filter((edge) => edge.to === merchantId);
            merchantTransactions.forEach((edge) => {
              anomalies.push({
                index: this.findTransactionIndex(edge.transaction, graph),
                score: fraudRateZScore / 5,
                method: 'merchant_anomaly',
                severity: this.classifySeverity(fraudRateZScore / 5),
                context: {
                  merchantId,
                  fraudRate: stats.fraudRate,
                  expectedFraudRate: avgFraudRate,
                  zScore: fraudRateZScore,
                },
              });
            });
          }
        });

        return anomalies;
      },

      detectCustomerAnomalies: (graph) => {
        const anomalies = [];
        const customerStats = new Map();

        // Calculate customer statistics
        graph.edges.forEach((edge) => {
          const customerId = edge.from;
          if (!customerStats.has(customerId)) {
            customerStats.set(customerId, {
              totalAmount: 0,
              transactionCount: 0,
              fraudCount: 0,
              merchants: new Set(),
            });
          }

          const stats = customerStats.get(customerId);
          stats.totalAmount += edge.amount;
          stats.transactionCount++;
          if (edge.fraud) stats.fraudCount++;
          stats.merchants.add(edge.to);
        });

        // Detect anomalous customers
        customerStats.forEach((stats, customerId) => {
          const fraudRate = stats.fraudCount / stats.transactionCount;
          const merchantDiversity = stats.merchants.size / stats.transactionCount;

          // High fraud rate or low merchant diversity
          if (fraudRate > 0.1 || merchantDiversity < 0.3) {
            const customerTransactions = graph.edges.filter((edge) => edge.from === customerId);
            customerTransactions.forEach((edge) => {
              anomalies.push({
                index: this.findTransactionIndex(edge.transaction, graph),
                score: Math.max(fraudRate, 1 - merchantDiversity),
                method: 'customer_anomaly',
                severity: this.classifySeverity(Math.max(fraudRate, 1 - merchantDiversity)),
                context: {
                  customerId,
                  fraudRate,
                  merchantDiversity,
                  transactionCount: stats.transactionCount,
                },
              });
            });
          }
        });

        return anomalies;
      },

      findConnectedComponents: (graph, nodes) => {
        const visited = new Set();
        const components = [];

        nodes.forEach((node) => {
          if (!visited.has(node)) {
            const component = [];
            this.dfs(node, graph, visited, component);
            components.push(component);
          }
        });

        return components;
      },

      dfs: (node, graph, visited, component) => {
        visited.add(node);
        component.push(node);

        const neighbors = graph.edges
          .filter((edge) => edge.from === node || edge.to === node)
          .map((edge) => (edge.from === node ? edge.to : edge.from));

        neighbors.forEach((neighbor) => {
          if (!visited.has(neighbor)) {
            this.dfs(neighbor, graph, visited, component);
          }
        });
      },

      calculateClusterRisk: (cluster, graph) => {
        const fraudEdges = graph.edges.filter((edge) => cluster.includes(edge.from) && cluster.includes(edge.to) && edge.fraud);

        return fraudEdges.length / cluster.length;
      },

      findTransactionIndex: (transactionId, graph) => {
        const edge = graph.edges.find((edge) => edge.transaction === transactionId);
        return edge ? graph.edges.indexOf(edge) : -1;
      },
    };
  }

  initializeContextualAnalyzer() {
    return {
      analyzeMerchantPatterns: (data) => {
        const merchantStats = {};

        data.forEach((row) => {
          const merchantId = row.merchant_id;
          if (!merchantStats[merchantId]) {
            merchantStats[merchantId] = {
              totalAmount: 0,
              transactionCount: 0,
              fraudCount: 0,
              categories: new Set(),
              states: new Set(),
            };
          }

          const stats = merchantStats[merchantId];
          stats.totalAmount += parseFloat(row.amount);
          stats.transactionCount++;
          if (row.is_fraud === '1') stats.fraudCount++;
          stats.categories.add(row.merchant_category);
          stats.states.add(row.merchant_state);
        });

        return Object.entries(merchantStats).map(([merchantId, stats]) => ({
          merchantId,
          avgAmount: stats.totalAmount / stats.transactionCount,
          fraudRate: stats.fraudCount / stats.transactionCount,
          categoryDiversity: stats.categories.size,
          geographicDiversity: stats.states.size,
          risk: this.calculateMerchantRisk(stats),
        }));
      },

      analyzeCategoryPatterns: (data) => {
        const categoryStats = {};

        data.forEach((row) => {
          const category = row.merchant_category;
          if (!categoryStats[category]) {
            categoryStats[category] = {
              totalAmount: 0,
              transactionCount: 0,
              fraudCount: 0,
              merchants: new Set(),
              states: new Set(),
            };
          }

          const stats = categoryStats[category];
          stats.totalAmount += parseFloat(row.amount);
          stats.transactionCount++;
          if (row.is_fraud === '1') stats.fraudCount++;
          stats.merchants.add(row.merchant_id);
          stats.states.add(row.merchant_state);
        });

        return Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          avgAmount: stats.totalAmount / stats.transactionCount,
          fraudRate: stats.fraudCount / stats.transactionCount,
          merchantDiversity: stats.merchants.size,
          geographicDiversity: stats.states.size,
          risk: this.calculateCategoryRisk(stats),
        }));
      },
    };
  }

  initializeSeverityClassifier() {
    return {
      classify: (score) => {
        if (score >= 0.8) return 'critical';
        if (score >= 0.6) return 'high';
        if (score >= 0.4) return 'medium';
        if (score >= 0.2) return 'low';
        return 'minimal';
      },

      getPriority: (severity) => {
        const priorities = {
          critical: 1,
          high: 2,
          medium: 3,
          low: 4,
          minimal: 5,
        };
        return priorities[severity] || 5;
      },
    };
  }

  // Main detection method
  async detectAnomalies(data) {
    console.log(`🔍 Starting advanced anomaly detection on ${data.length} records...`);

    const allAnomalies = [];

    // Run all detectors
    const detectors = [
      { name: 'Isolation Forest', detector: this.detectors.isolationForest },
      { name: 'Local Outlier Factor', detector: this.detectors.localOutlierFactor },
      { name: 'One-Class SVM', detector: this.detectors.oneClassSVM },
      { name: 'Contextual Detector', detector: this.detectors.contextualDetector },
      { name: 'Temporal Detector', detector: this.detectors.temporalDetector },
      { name: 'Graph-Based Detector', detector: this.detectors.graphBasedDetector },
    ];

    for (const { name, detector } of detectors) {
      try {
        console.log(`  Running ${name}...`);
        const anomalies = detector.detect(data);
        console.log(`    Found ${anomalies.length} anomalies`);
        allAnomalies.push(...anomalies);
      } catch (error) {
        console.warn(`    Error in ${name}:`, error.message);
      }
    }

    // Deduplicate and prioritize anomalies
    const uniqueAnomalies = this.deduplicateAnomalies(allAnomalies);
    const prioritizedAnomalies = this.prioritizeAnomalies(uniqueAnomalies);

    console.log(`✅ Advanced anomaly detection completed: ${prioritizedAnomalies.length} unique anomalies found`);

    return {
      anomalies: prioritizedAnomalies,
      summary: this.generateAnomalySummary(prioritizedAnomalies, data),
      patterns: this.analyzeAnomalyPatterns(prioritizedAnomalies, data),
    };
  }

  // Helper methods
  classifySeverity(score) {
    return this.severityClassifier.classify(score);
  }

  getRandomSample(data, size) {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  groupBy(data, key, transform = (val) => val) {
    return data.reduce((groups, item) => {
      const group = transform(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  deduplicateAnomalies(anomalies) {
    const seen = new Set();
    return anomalies.filter((anomaly) => {
      const key = `${anomaly.index}-${anomaly.method}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  prioritizeAnomalies(anomalies) {
    return anomalies.sort((a, b) => {
      const priorityA = this.severityClassifier.getPriority(a.severity);
      const priorityB = this.severityClassifier.getPriority(b.severity);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return b.score - a.score;
    });
  }

  getAnomalyContext(point, data) {
    return {
      category: point.merchant_category,
      state: point.merchant_state,
      amount: point.amount,
      fraud_score: point.fraud_score,
      transaction_type: point.transaction_type,
      merchant_id: point.merchant_id,
      customer_id: point.customer_id,
    };
  }

  calculateMerchantRisk(stats) {
    const fraudRate = stats.fraudCount / stats.transactionCount;
    const avgAmount = stats.totalAmount / stats.transactionCount;

    // Risk based on fraud rate and transaction amount
    return fraudRate * 0.7 + (avgAmount > 1000 ? 0.3 : 0);
  }

  calculateCategoryRisk(stats) {
    const fraudRate = stats.fraudCount / stats.transactionCount;
    const avgAmount = stats.totalAmount / stats.transactionCount;

    // Risk based on fraud rate and average amount
    return fraudRate * 0.6 + (avgAmount > 500 ? 0.4 : 0);
  }

  generateAnomalySummary(anomalies, data) {
    const severityCounts = {};
    const methodCounts = {};
    const categoryCounts = {};

    anomalies.forEach((anomaly) => {
      severityCounts[anomaly.severity] = (severityCounts[anomaly.severity] || 0) + 1;
      methodCounts[anomaly.method] = (methodCounts[anomaly.method] || 0) + 1;

      if (anomaly.context && anomaly.context.category) {
        categoryCounts[anomaly.context.category] = (categoryCounts[anomaly.context.category] || 0) + 1;
      }
    });

    return {
      totalAnomalies: anomalies.length,
      severityDistribution: severityCounts,
      methodDistribution: methodCounts,
      categoryDistribution: categoryCounts,
      detectionRate: anomalies.length / data.length,
    };
  }

  analyzeAnomalyPatterns(anomalies, data) {
    const patterns = [];

    // High-value anomaly pattern
    const highValueAnomalies = anomalies.filter((a) => a.context && parseFloat(a.context.amount) > 1000);
    if (highValueAnomalies.length > 0) {
      patterns.push({
        type: 'high_value_anomalies',
        count: highValueAnomalies.length,
        description: 'Anomalies involving high-value transactions',
        risk: 'high',
      });
    }

    // Geographic clustering pattern
    const stateAnomalies = {};
    anomalies.forEach((a) => {
      if (a.context && a.context.state) {
        stateAnomalies[a.context.state] = (stateAnomalies[a.context.state] || 0) + 1;
      }
    });

    const highRiskStates = Object.entries(stateAnomalies)
      .filter(([state, count]) => count > 5)
      .map(([state, count]) => ({ state, count }));

    if (highRiskStates.length > 0) {
      patterns.push({
        type: 'geographic_clustering',
        states: highRiskStates,
        description: 'Geographic clustering of anomalies',
        risk: 'medium',
      });
    }

    // Temporal clustering pattern
    const temporalAnomalies = anomalies.filter((a) => a.method.includes('temporal'));
    if (temporalAnomalies.length > 10) {
      patterns.push({
        type: 'temporal_clustering',
        count: temporalAnomalies.length,
        description: 'Temporal clustering of anomalies',
        risk: 'medium',
      });
    }

    return patterns;
  }
}

module.exports = AdvancedAnomalyDetectionService;
