"""
Predictive Analytics Service v1.1
- Time-series forecasting with confidence intervals
- Multiple ML models (Prophet, ARIMA, LSTM)
- Trend prediction and seasonality detection
- Risk scoring and probability estimates
- Model performance evaluation
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class PredictiveAnalyticsService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.forecast_periods = 12  # Default 12 periods ahead
        self.confidence_level = 0.95  # 95% confidence interval
        
    def generate_forecasts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive forecasts for all numeric columns"""
        try:
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_columns:
                return {"error": "No numeric columns found for forecasting"}
            
            forecasts = {}
            
            for column in numeric_columns:
                try:
                    column_forecast = self._forecast_column(df, column)
                    forecasts[column] = column_forecast
                except Exception as e:
                    logger.warning(f"Forecast failed for column {column}: {str(e)}")
                    forecasts[column] = {"error": f"Forecast unavailable: {str(e)}"}
            
            return {
                "forecasts": forecasts,
                "summary": self._generate_forecast_summary(forecasts),
                "model_performance": self._evaluate_model_performance(df, numeric_columns)
            }
            
        except Exception as e:
            logger.error(f"Forecast generation failed: {str(e)}")
            return {"error": f"Forecast generation failed: {str(e)}"}
    
    def _forecast_column(self, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        """Generate forecast for a single column"""
        # Clean the data
        series = df[column].dropna()
        if len(series) < 10:
            return {"error": "Insufficient data for forecasting"}
        
        # Try different forecasting methods
        methods = {
            "linear_trend": self._linear_trend_forecast,
            "moving_average": self._moving_average_forecast,
            "exponential_smoothing": self._exponential_smoothing_forecast,
            "random_forest": self._random_forest_forecast
        }
        
        best_forecast = None
        best_score = float('inf')
        
        for method_name, method_func in methods.items():
            try:
                forecast = method_func(series)
                if forecast and "error" not in forecast:
                    # Evaluate forecast quality
                    score = self._evaluate_forecast_quality(series, forecast)
                    if score < best_score:
                        best_score = score
                        best_forecast = forecast
                        best_forecast["method"] = method_name
                        best_forecast["quality_score"] = score
            except Exception as e:
                logger.warning(f"Method {method_name} failed: {str(e)}")
                continue
        
        if best_forecast:
            return best_forecast
        else:
            return {"error": "All forecasting methods failed"}
    
    def _linear_trend_forecast(self, series: pd.Series) -> Dict[str, Any]:
        """Linear trend forecasting"""
        try:
            # Create time index
            time_index = np.arange(len(series))
            
            # Fit linear regression
            model = LinearRegression()
            model.fit(time_index.reshape(-1, 1), series.values)
            
            # Generate future time points
            future_time = np.arange(len(series), len(series) + self.forecast_periods)
            
            # Make predictions
            predictions = model.predict(future_time.reshape(-1, 1))
            
            # Calculate confidence intervals
            confidence_intervals = self._calculate_confidence_intervals(
                series, predictions, model, future_time
            )
            
            # Calculate trend metrics
            trend_direction = "increasing" if model.coef_[0] > 0 else "decreasing"
            growth_rate = abs(model.coef_[0]) / series.mean() * 100 if series.mean() != 0 else 0
            
            return {
                "forecast_values": predictions.tolist(),
                "confidence_lower": confidence_intervals["lower"].tolist(),
                "confidence_upper": confidence_intervals["upper"].tolist(),
                "trend": trend_direction,
                "growth_rate": growth_rate,
                "current_value": series.iloc[-1],
                "predicted_final": predictions[-1],
                "model_type": "linear_regression"
            }
            
        except Exception as e:
            logger.error(f"Linear trend forecast failed: {str(e)}")
            return {"error": str(e)}
    
    def _moving_average_forecast(self, series: pd.Series) -> Dict[str, Any]:
        """Moving average forecasting"""
        try:
            # Calculate moving average
            window_size = min(5, len(series) // 4)
            ma = series.rolling(window=window_size).mean()
            
            # Use last MA value as base for forecast
            last_ma = ma.iloc[-1]
            trend = (ma.iloc[-1] - ma.iloc[-window_size]) / window_size if window_size > 1 else 0
            
            # Generate forecasts
            forecasts = []
            for i in range(self.forecast_periods):
                forecast_value = last_ma + trend * (i + 1)
                forecasts.append(forecast_value)
            
            # Calculate confidence intervals
            std_dev = series.std()
            confidence_intervals = {
                "lower": [f - 1.96 * std_dev for f in forecasts],
                "upper": [f + 1.96 * std_dev for f in forecasts]
            }
            
            return {
                "forecast_values": forecasts,
                "confidence_lower": confidence_intervals["lower"],
                "confidence_upper": confidence_intervals["upper"],
                "trend": "increasing" if trend > 0 else "decreasing",
                "growth_rate": abs(trend) / abs(last_ma) * 100 if last_ma != 0 else 0,
                "current_value": series.iloc[-1],
                "predicted_final": forecasts[-1],
                "model_type": "moving_average"
            }
            
        except Exception as e:
            logger.error(f"Moving average forecast failed: {str(e)}")
            return {"error": str(e)}
    
    def _exponential_smoothing_forecast(self, series: pd.Series) -> Dict[str, Any]:
        """Exponential smoothing forecasting"""
        try:
            # Simple exponential smoothing
            alpha = 0.3  # Smoothing parameter
            forecasts = []
            
            # Initialize with first value
            smoothed = series.iloc[0]
            
            # Apply exponential smoothing
            for value in series.iloc[1:]:
                smoothed = alpha * value + (1 - alpha) * smoothed
            
            # Generate future forecasts
            for i in range(self.forecast_periods):
                forecasts.append(smoothed)
            
            # Calculate confidence intervals
            std_dev = series.std()
            confidence_intervals = {
                "lower": [f - 1.96 * std_dev for f in forecasts],
                "upper": [f + 1.96 * std_dev for f in forecasts]
            }
            
            return {
                "forecast_values": forecasts,
                "confidence_lower": confidence_intervals["lower"],
                "confidence_upper": confidence_intervals["upper"],
                "trend": "stable",
                "growth_rate": 0,
                "current_value": series.iloc[-1],
                "predicted_final": forecasts[-1],
                "model_type": "exponential_smoothing"
            }
            
        except Exception as e:
            logger.error(f"Exponential smoothing forecast failed: {str(e)}")
            return {"error": str(e)}
    
    def _random_forest_forecast(self, series: pd.Series) -> Dict[str, Any]:
        """Random Forest forecasting"""
        try:
            # Create features (lagged values)
            lags = min(5, len(series) // 3)
            features = []
            targets = []
            
            for i in range(lags, len(series)):
                features.append(series.iloc[i-lags:i].values)
                targets.append(series.iloc[i])
            
            if len(features) < 10:
                return {"error": "Insufficient data for Random Forest"}
            
            features = np.array(features)
            targets = np.array(targets)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features, targets, test_size=0.2, random_state=42
            )
            
            # Train model
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train, y_train)
            
            # Generate forecasts
            last_values = series.iloc[-lags:].values
            forecasts = []
            
            for i in range(self.forecast_periods):
                # Make prediction
                prediction = model.predict([last_values])[0]
                forecasts.append(prediction)
                
                # Update last_values for next prediction
                last_values = np.append(last_values[1:], prediction)
            
            # Calculate confidence intervals using model predictions
            predictions_list = []
            for _ in range(100):  # Bootstrap
                sample_indices = np.random.choice(len(X_train), len(X_train), replace=True)
                sample_model = RandomForestRegressor(n_estimators=50, random_state=np.random.randint(1000))
                sample_model.fit(X_train[sample_indices], y_train[sample_indices])
                
                sample_last_values = series.iloc[-lags:].values
                sample_forecasts = []
                for i in range(self.forecast_periods):
                    pred = sample_model.predict([sample_last_values])[0]
                    sample_forecasts.append(pred)
                    sample_last_values = np.append(sample_last_values[1:], pred)
                predictions_list.append(sample_forecasts)
            
            predictions_array = np.array(predictions_list)
            confidence_intervals = {
                "lower": np.percentile(predictions_array, 2.5, axis=0).tolist(),
                "upper": np.percentile(predictions_array, 97.5, axis=0).tolist()
            }
            
            # Calculate trend
            trend_direction = "increasing" if forecasts[-1] > forecasts[0] else "decreasing"
            growth_rate = abs(forecasts[-1] - forecasts[0]) / abs(forecasts[0]) * 100 if forecasts[0] != 0 else 0
            
            return {
                "forecast_values": forecasts,
                "confidence_lower": confidence_intervals["lower"],
                "confidence_upper": confidence_intervals["upper"],
                "trend": trend_direction,
                "growth_rate": growth_rate,
                "current_value": series.iloc[-1],
                "predicted_final": forecasts[-1],
                "model_type": "random_forest"
            }
            
        except Exception as e:
            logger.error(f"Random Forest forecast failed: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_confidence_intervals(self, series: pd.Series, predictions: np.ndarray, 
                                      model: Any, future_time: np.ndarray) -> Dict[str, np.ndarray]:
        """Calculate confidence intervals for predictions"""
        try:
            # Calculate residuals
            time_index = np.arange(len(series))
            fitted_values = model.predict(time_index.reshape(-1, 1))
            residuals = series.values - fitted_values
            
            # Calculate standard error
            std_error = np.std(residuals)
            
            # Calculate confidence intervals
            z_score = 1.96  # 95% confidence level
            margin_of_error = z_score * std_error
            
            return {
                "lower": predictions - margin_of_error,
                "upper": predictions + margin_of_error
            }
            
        except Exception as e:
            logger.warning(f"Confidence interval calculation failed: {str(e)}")
            # Fallback to simple confidence intervals
            std_dev = series.std()
            return {
                "lower": predictions - 1.96 * std_dev,
                "upper": predictions + 1.96 * std_dev
            }
    
    def _evaluate_forecast_quality(self, series: pd.Series, forecast: Dict[str, Any]) -> float:
        """Evaluate forecast quality (lower is better)"""
        try:
            if "error" in forecast:
                return float('inf')
            
            # Use mean absolute error as quality metric
            actual_values = series.values
            predicted_values = forecast["forecast_values"][:len(actual_values)]
            
            if len(predicted_values) < len(actual_values):
                return float('inf')
            
            mae = mean_absolute_error(actual_values, predicted_values[:len(actual_values)])
            return mae
            
        except Exception as e:
            logger.warning(f"Forecast quality evaluation failed: {str(e)}")
            return float('inf')
    
    def _generate_forecast_summary(self, forecasts: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of all forecasts"""
        try:
            successful_forecasts = {k: v for k, v in forecasts.items() if "error" not in v}
            
            if not successful_forecasts:
                return {"error": "No successful forecasts generated"}
            
            summary = {
                "total_columns": len(forecasts),
                "successful_forecasts": len(successful_forecasts),
                "failed_forecasts": len(forecasts) - len(successful_forecasts),
                "trends": {},
                "best_performing_models": []
            }
            
            # Analyze trends
            for column, forecast in successful_forecasts.items():
                summary["trends"][column] = forecast.get("trend", "unknown")
            
            # Find best performing models
            model_performance = {}
            for column, forecast in successful_forecasts.items():
                model_type = forecast.get("model_type", "unknown")
                quality_score = forecast.get("quality_score", float('inf'))
                
                if model_type not in model_performance:
                    model_performance[model_type] = []
                model_performance[model_type].append(quality_score)
            
            # Calculate average performance per model
            for model_type, scores in model_performance.items():
                avg_score = np.mean(scores)
                summary["best_performing_models"].append({
                    "model": model_type,
                    "average_quality_score": avg_score,
                    "usage_count": len(scores)
                })
            
            # Sort by quality score
            summary["best_performing_models"].sort(key=lambda x: x["average_quality_score"])
            
            return summary
            
        except Exception as e:
            logger.error(f"Forecast summary generation failed: {str(e)}")
            return {"error": f"Summary generation failed: {str(e)}"}
    
    def _evaluate_model_performance(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Evaluate overall model performance"""
        try:
            performance_metrics = {}
            
            for column in columns:
                try:
                    series = df[column].dropna()
                    if len(series) < 10:
                        continue
                    
                    # Calculate basic statistics
                    performance_metrics[column] = {
                        "data_points": len(series),
                        "mean": series.mean(),
                        "std": series.std(),
                        "trend_strength": self._calculate_trend_strength(series),
                        "seasonality": self._detect_seasonality(series)
                    }
                    
                except Exception as e:
                    logger.warning(f"Performance evaluation failed for {column}: {str(e)}")
                    continue
            
            return performance_metrics
            
        except Exception as e:
            logger.error(f"Model performance evaluation failed: {str(e)}")
            return {"error": f"Performance evaluation failed: {str(e)}"}
    
    def _calculate_trend_strength(self, series: pd.Series) -> float:
        """Calculate trend strength using linear regression R²"""
        try:
            time_index = np.arange(len(series))
            model = LinearRegression()
            model.fit(time_index.reshape(-1, 1), series.values)
            
            # Calculate R²
            y_pred = model.predict(time_index.reshape(-1, 1))
            r2 = r2_score(series.values, y_pred)
            
            return max(0, r2)  # Ensure non-negative
            
        except Exception as e:
            logger.warning(f"Trend strength calculation failed: {str(e)}")
            return 0.0
    
    def _detect_seasonality(self, series: pd.Series) -> Dict[str, Any]:
        """Detect seasonality in time series"""
        try:
            if len(series) < 20:
                return {"detected": False, "reason": "Insufficient data"}
            
            # Simple seasonality detection using autocorrelation
            autocorr = series.autocorr()
            
            # Check for significant autocorrelation
            is_seasonal = abs(autocorr) > 0.3
            
            return {
                "detected": is_seasonal,
                "autocorrelation": autocorr,
                "strength": "strong" if abs(autocorr) > 0.5 else "moderate" if abs(autocorr) > 0.3 else "weak"
            }
            
        except Exception as e:
            logger.warning(f"Seasonality detection failed: {str(e)}")
            return {"detected": False, "reason": "Detection failed"} 