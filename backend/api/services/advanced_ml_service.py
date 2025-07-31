"""
Advanced ML Service for Sygnify Financial Analytics
Implements Feature #3: Advanced AI/ML Capabilities
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import asyncio
import json
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, IsolationForest
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, classification_report
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class AdvancedMLService:
    """
    Advanced ML Service implementing:
    - Predictive Analytics & Machine Learning
    - Natural Language Processing (NLP)
    - Advanced Risk Assessment
    - Automated Trading Signals
    - Portfolio Optimization
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.anomaly_detectors = {}
        self.portfolio_optimizer = None
        self.trading_signals = {}
        
    def prepare_financial_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create comprehensive financial features for ML models"""
        try:
            features_df = df.copy()
            
            # Technical indicators
            if 'close' in features_df.columns:
                # Moving averages
                features_df['sma_5'] = features_df['close'].rolling(window=5).mean()
                features_df['sma_20'] = features_df['close'].rolling(window=20).mean()
                features_df['ema_12'] = features_df['close'].ewm(span=12).mean()
                features_df['ema_26'] = features_df['close'].ewm(span=26).mean()
                
                # RSI
                delta = features_df['close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                features_df['rsi'] = 100 - (100 / (1 + rs))
                
                # MACD
                features_df['macd'] = features_df['ema_12'] - features_df['ema_26']
                features_df['macd_signal'] = features_df['macd'].ewm(span=9).mean()
                features_df['macd_histogram'] = features_df['macd'] - features_df['macd_signal']
                
                # Bollinger Bands
                features_df['bb_middle'] = features_df['close'].rolling(window=20).mean()
                bb_std = features_df['close'].rolling(window=20).std()
                features_df['bb_upper'] = features_df['bb_middle'] + (bb_std * 2)
                features_df['bb_lower'] = features_df['bb_middle'] - (bb_std * 2)
                features_df['bb_width'] = features_df['bb_upper'] - features_df['bb_lower']
                features_df['bb_position'] = (features_df['close'] - features_df['bb_lower']) / features_df['bb_width']
                
                # Price momentum
                features_df['price_momentum'] = features_df['close'].pct_change()
                features_df['price_momentum_5'] = features_df['close'].pct_change(periods=5)
                features_df['price_momentum_20'] = features_df['close'].pct_change(periods=20)
                
                # Volatility
                features_df['volatility'] = features_df['close'].rolling(window=20).std()
                features_df['volatility_ratio'] = features_df['volatility'] / features_df['close']
            
            # Volume indicators
            if 'volume' in features_df.columns:
                features_df['volume_sma'] = features_df['volume'].rolling(window=20).mean()
                features_df['volume_ratio'] = features_df['volume'] / features_df['volume_sma']
                features_df['volume_momentum'] = features_df['volume'].pct_change()
            
            # Market sentiment features
            if 'close' in features_df.columns and 'volume' in features_df.columns:
                features_df['price_volume_trend'] = features_df['close'] * features_df['volume']
                features_df['money_flow_index'] = self._calculate_mfi(features_df)
            
            # Time-based features
            if 'date' in features_df.columns:
                features_df['date'] = pd.to_datetime(features_df['date'])
                features_df['day_of_week'] = features_df['date'].dt.dayofweek
                features_df['month'] = features_df['date'].dt.month
                features_df['quarter'] = features_df['date'].dt.quarter
                features_df['year'] = features_df['date'].dt.year
            
            # Remove NaN values
            features_df = features_df.dropna()
            
            return features_df
            
        except Exception as e:
            logger.error(f"Error preparing financial features: {str(e)}")
            raise
    
    def _calculate_mfi(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Money Flow Index"""
        try:
            typical_price = (df['high'] + df['low'] + df['close']) / 3
            money_flow = typical_price * df['volume']
            
            positive_flow = money_flow.where(typical_price > typical_price.shift(1), 0).rolling(window=period).sum()
            negative_flow = money_flow.where(typical_price < typical_price.shift(1), 0).rolling(window=period).sum()
            
            money_ratio = positive_flow / negative_flow
            mfi = 100 - (100 / (1 + money_ratio))
            
            return mfi
        except:
            return pd.Series([np.nan] * len(df))
    
    def train_price_prediction_model(self, df: pd.DataFrame, target_column: str = 'close', 
                                   test_size: float = 0.2) -> Dict[str, Any]:
        """Train a price prediction model using ensemble methods"""
        try:
            # Prepare features
            features_df = self.prepare_financial_features(df)
            
            # Select feature columns (exclude target and date)
            feature_columns = [col for col in features_df.columns 
                             if col not in [target_column, 'date', 'high', 'low', 'open']]
            
            X = features_df[feature_columns]
            y = features_df[target_column]
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train Random Forest model
            rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
            rf_model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = rf_model.predict(X_test_scaled)
            
            # Calculate metrics
            metrics = {
                'mae': mean_absolute_error(y_test, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'r2': r2_score(y_test, y_pred),
                'mape': np.mean(np.abs((y_test - y_pred) / y_test)) * 100
            }
            
            # Feature importance
            feature_importance = dict(zip(feature_columns, rf_model.feature_importances_))
            feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
            
            # Store model and scaler
            model_id = f"price_prediction_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.models[model_id] = rf_model
            self.scalers[model_id] = scaler
            
            return {
                'success': True,
                'model_id': model_id,
                'metrics': metrics,
                'feature_importance': feature_importance,
                'test_predictions': y_pred.tolist(),
                'actual_values': y_test.tolist(),
                'feature_columns': feature_columns
            }
            
        except Exception as e:
            logger.error(f"Error training price prediction model: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_price(self, model_id: str, features: Dict[str, float]) -> Dict[str, Any]:
        """Make price predictions using trained model"""
        try:
            if model_id not in self.models:
                return {'success': False, 'error': 'Model not found'}
            
            model = self.models[model_id]
            scaler = self.scalers[model_id]
            
            # Prepare features
            feature_values = []
            for col in model.feature_names_in_:
                feature_values.append(features.get(col, 0.0))
            
            # Scale features
            features_scaled = scaler.transform([feature_values])
            
            # Make prediction
            prediction = model.predict(features_scaled)[0]
            
            # Calculate confidence interval (using model's feature importance)
            confidence = 0.8  # Base confidence
            if hasattr(model, 'feature_importances_'):
                # Adjust confidence based on feature availability
                available_features = sum(1 for f in feature_values if f != 0.0)
                total_features = len(feature_values)
                confidence *= (available_features / total_features)
            
            return {
                'success': True,
                'prediction': float(prediction),
                'confidence': confidence,
                'model_id': model_id,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error making price prediction: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def assess_risk(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Advanced risk assessment using multiple ML models"""
        try:
            features_df = self.prepare_financial_features(df)
            
            # Calculate risk metrics
            risk_metrics = {}
            
            if 'close' in features_df.columns:
                returns = features_df['close'].pct_change().dropna()
                
                # Volatility risk
                risk_metrics['volatility'] = returns.std() * np.sqrt(252)  # Annualized
                
                # Value at Risk (VaR)
                risk_metrics['var_95'] = np.percentile(returns, 5)
                risk_metrics['var_99'] = np.percentile(returns, 1)
                
                # Maximum drawdown
                cumulative_returns = (1 + returns).cumprod()
                rolling_max = cumulative_returns.expanding().max()
                drawdown = (cumulative_returns - rolling_max) / rolling_max
                risk_metrics['max_drawdown'] = drawdown.min()
                
                # Sharpe ratio (assuming risk-free rate of 2%)
                risk_free_rate = 0.02
                excess_returns = returns - risk_free_rate/252
                risk_metrics['sharpe_ratio'] = excess_returns.mean() / returns.std() * np.sqrt(252)
                
                # Beta calculation (if market data available)
                if 'market_return' in features_df.columns:
                    market_returns = features_df['market_return'].pct_change().dropna()
                    covariance = np.cov(returns, market_returns)[0, 1]
                    market_variance = np.var(market_returns)
                    risk_metrics['beta'] = covariance / market_variance
                
                # Anomaly detection
                anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
                anomaly_scores = anomaly_detector.fit_predict(returns.values.reshape(-1, 1))
                risk_metrics['anomaly_count'] = np.sum(anomaly_scores == -1)
                risk_metrics['anomaly_ratio'] = risk_metrics['anomaly_count'] / len(returns)
            
            # Risk classification
            risk_level = 'LOW'
            if risk_metrics.get('volatility', 0) > 0.3:
                risk_level = 'HIGH'
            elif risk_metrics.get('volatility', 0) > 0.15:
                risk_level = 'MEDIUM'
            
            return {
                'success': True,
                'risk_metrics': risk_metrics,
                'risk_level': risk_level,
                'recommendations': self._generate_risk_recommendations(risk_metrics, risk_level)
            }
            
        except Exception as e:
            logger.error(f"Error in risk assessment: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _generate_risk_recommendations(self, risk_metrics: Dict[str, Any], risk_level: str) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.extend([
                "Consider reducing position size",
                "Implement strict stop-loss orders",
                "Diversify portfolio across different asset classes",
                "Monitor positions more frequently",
                "Consider hedging strategies"
            ])
        elif risk_level == 'MEDIUM':
            recommendations.extend([
                "Maintain current position sizes",
                "Set moderate stop-loss levels",
                "Regular portfolio rebalancing",
                "Monitor key risk indicators"
            ])
        else:
            recommendations.extend([
                "Current risk level is acceptable",
                "Consider increasing position sizes gradually",
                "Continue regular monitoring"
            ])
        
        return recommendations
    
    def generate_trading_signals(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate automated trading signals using technical analysis and ML"""
        try:
            features_df = self.prepare_financial_features(df)
            
            signals = []
            
            if 'close' in features_df.columns:
                current_price = features_df['close'].iloc[-1]
                
                # RSI signals
                if 'rsi' in features_df.columns:
                    current_rsi = features_df['rsi'].iloc[-1]
                    if current_rsi < 30:
                        signals.append({
                            'type': 'BUY',
                            'strength': 'STRONG',
                            'indicator': 'RSI',
                            'value': current_rsi,
                            'reason': 'Oversold condition'
                        })
                    elif current_rsi > 70:
                        signals.append({
                            'type': 'SELL',
                            'strength': 'STRONG',
                            'indicator': 'RSI',
                            'value': current_rsi,
                            'reason': 'Overbought condition'
                        })
                
                # MACD signals
                if 'macd' in features_df.columns and 'macd_signal' in features_df.columns:
                    current_macd = features_df['macd'].iloc[-1]
                    current_signal = features_df['macd_signal'].iloc[-1]
                    prev_macd = features_df['macd'].iloc[-2]
                    prev_signal = features_df['macd_signal'].iloc[-2]
                    
                    # MACD crossover
                    if current_macd > current_signal and prev_macd <= prev_signal:
                        signals.append({
                            'type': 'BUY',
                            'strength': 'MEDIUM',
                            'indicator': 'MACD',
                            'value': current_macd,
                            'reason': 'MACD bullish crossover'
                        })
                    elif current_macd < current_signal and prev_macd >= prev_signal:
                        signals.append({
                            'type': 'SELL',
                            'strength': 'MEDIUM',
                            'indicator': 'MACD',
                            'value': current_macd,
                            'reason': 'MACD bearish crossover'
                        })
                
                # Moving average signals
                if 'sma_5' in features_df.columns and 'sma_20' in features_df.columns:
                    current_sma5 = features_df['sma_5'].iloc[-1]
                    current_sma20 = features_df['sma_20'].iloc[-1]
                    prev_sma5 = features_df['sma_5'].iloc[-2]
                    prev_sma20 = features_df['sma_20'].iloc[-2]
                    
                    if current_sma5 > current_sma20 and prev_sma5 <= prev_sma20:
                        signals.append({
                            'type': 'BUY',
                            'strength': 'WEAK',
                            'indicator': 'SMA',
                            'value': current_sma5,
                            'reason': 'Golden cross (5-day SMA above 20-day SMA)'
                        })
                    elif current_sma5 < current_sma20 and prev_sma5 >= prev_sma20:
                        signals.append({
                            'type': 'SELL',
                            'strength': 'WEAK',
                            'indicator': 'SMA',
                            'value': current_sma5,
                            'reason': 'Death cross (5-day SMA below 20-day SMA)'
                        })
                
                # Bollinger Bands signals
                if 'bb_position' in features_df.columns:
                    bb_position = features_df['bb_position'].iloc[-1]
                    if bb_position < 0.1:
                        signals.append({
                            'type': 'BUY',
                            'strength': 'MEDIUM',
                            'indicator': 'Bollinger Bands',
                            'value': bb_position,
                            'reason': 'Price near lower Bollinger Band'
                        })
                    elif bb_position > 0.9:
                        signals.append({
                            'type': 'SELL',
                            'strength': 'MEDIUM',
                            'indicator': 'Bollinger Bands',
                            'value': bb_position,
                            'reason': 'Price near upper Bollinger Band'
                        })
            
            # Calculate signal strength
            buy_signals = [s for s in signals if s['type'] == 'BUY']
            sell_signals = [s for s in signals if s['type'] == 'SELL']
            
            overall_signal = 'HOLD'
            if len(buy_signals) > len(sell_signals):
                overall_signal = 'BUY'
            elif len(sell_signals) > len(buy_signals):
                overall_signal = 'SELL'
            
            return {
                'success': True,
                'signals': signals,
                'overall_signal': overall_signal,
                'buy_count': len(buy_signals),
                'sell_count': len(sell_signals),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating trading signals: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def optimize_portfolio(self, assets_data: Dict[str, pd.DataFrame], 
                         target_return: float = 0.1, risk_free_rate: float = 0.02) -> Dict[str, Any]:
        """Portfolio optimization using Modern Portfolio Theory"""
        try:
            # Calculate returns for each asset
            returns_data = {}
            for asset, df in assets_data.items():
                if 'close' in df.columns:
                    returns = df['close'].pct_change().dropna()
                    returns_data[asset] = returns
            
            if not returns_data:
                return {'success': False, 'error': 'No valid price data found'}
            
            # Create returns matrix
            returns_df = pd.DataFrame(returns_data)
            returns_df = returns_df.dropna()
            
            # Calculate expected returns and covariance matrix
            expected_returns = returns_df.mean() * 252  # Annualized
            cov_matrix = returns_df.cov() * 252  # Annualized
            
            # Portfolio optimization using Monte Carlo simulation
            num_portfolios = 10000
            results = np.zeros((num_portfolios, len(returns_df.columns) + 2))
            
            for i in range(num_portfolios):
                # Generate random weights
                weights = np.random.random(len(returns_df.columns))
                weights = weights / np.sum(weights)
                
                # Calculate portfolio metrics
                portfolio_return = np.sum(expected_returns * weights)
                portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
                sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility
                
                # Store results
                results[i, 0] = portfolio_volatility
                results[i, 1] = portfolio_return
                results[i, 2:] = weights
            
            # Find optimal portfolio
            optimal_idx = np.argmax(results[:, 2])  # Max Sharpe ratio
            optimal_weights = results[optimal_idx, 2:]
            optimal_return = results[optimal_idx, 1]
            optimal_volatility = results[optimal_idx, 0]
            
            # Create portfolio allocation
            allocation = {}
            for i, asset in enumerate(returns_df.columns):
                allocation[asset] = float(optimal_weights[i])
            
            return {
                'success': True,
                'optimal_allocation': allocation,
                'expected_return': float(optimal_return),
                'expected_volatility': float(optimal_volatility),
                'sharpe_ratio': float((optimal_return - risk_free_rate) / optimal_volatility),
                'risk_free_rate': risk_free_rate,
                'num_assets': len(returns_df.columns),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in portfolio optimization: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def analyze_sentiment(self, text_data: List[str]) -> Dict[str, Any]:
        """Basic sentiment analysis for financial text"""
        try:
            # Simple keyword-based sentiment analysis
            positive_words = ['bullish', 'growth', 'profit', 'gain', 'positive', 'strong', 'up', 'rise']
            negative_words = ['bearish', 'decline', 'loss', 'drop', 'negative', 'weak', 'down', 'fall']
            
            sentiment_scores = []
            for text in text_data:
                text_lower = text.lower()
                positive_count = sum(1 for word in positive_words if word in text_lower)
                negative_count = sum(1 for word in negative_words if word in text_lower)
                
                if positive_count > negative_count:
                    sentiment_scores.append(1)  # Positive
                elif negative_count > positive_count:
                    sentiment_scores.append(-1)  # Negative
                else:
                    sentiment_scores.append(0)  # Neutral
            
            avg_sentiment = np.mean(sentiment_scores)
            
            # Determine overall sentiment
            if avg_sentiment > 0.1:
                overall_sentiment = 'POSITIVE'
            elif avg_sentiment < -0.1:
                overall_sentiment = 'NEGATIVE'
            else:
                overall_sentiment = 'NEUTRAL'
            
            return {
                'success': True,
                'sentiment_scores': sentiment_scores,
                'average_sentiment': float(avg_sentiment),
                'overall_sentiment': overall_sentiment,
                'positive_count': sum(1 for s in sentiment_scores if s > 0),
                'negative_count': sum(1 for s in sentiment_scores if s < 0),
                'neutral_count': sum(1 for s in sentiment_scores if s == 0),
                'total_texts': len(text_data)
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {'success': False, 'error': str(e)} 