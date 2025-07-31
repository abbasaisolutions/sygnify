"""
Predictive Analytics Service
Provides forecasting capabilities with confidence intervals
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from prophet import Prophet
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class PredictiveAnalytics:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.anomaly_detectors = {}
        
    def prepare_time_series_data(self, df: pd.DataFrame, date_column: str, value_column: str) -> pd.DataFrame:
        """Prepare data for time series analysis"""
        try:
            # Ensure date column is datetime
            df[date_column] = pd.to_datetime(df[date_column])
            
            # Sort by date
            df = df.sort_values(date_column)
            
            # Prophet requires specific column names
            prophet_df = df[[date_column, value_column]].copy()
            prophet_df.columns = ['ds', 'y']
            
            # Remove any NaN values
            prophet_df = prophet_df.dropna()
            
            return prophet_df
        except Exception as e:
            logger.error(f"Error preparing time series data: {str(e)}")
            raise
    
    def forecast_with_prophet(self, df: pd.DataFrame, periods: int = 30, 
                            confidence_interval: float = 0.95) -> Dict[str, Any]:
        """Forecast using Facebook Prophet with confidence intervals"""
        try:
            # Initialize Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=confidence_interval
            )
            
            # Fit the model
            model.fit(df)
            
            # Make future predictions
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)
            
            # Extract forecast data
            forecast_data = {
                'dates': forecast['ds'].tail(periods).dt.strftime('%Y-%m-%d').tolist(),
                'forecast_values': forecast['yhat'].tail(periods).tolist(),
                'confidence_lower': forecast['yhat_lower'].tail(periods).tolist(),
                'confidence_upper': forecast['yhat_upper'].tail(periods).tolist(),
                'trend': forecast['trend'].tail(periods).tolist(),
                'seasonal': forecast['yearly'].tail(periods).tolist() if 'yearly' in forecast.columns else None
            }
            
            # Calculate metrics
            actual = df['y'].values
            predicted = forecast['yhat'].head(len(actual)).values
            
            metrics = {
                'mae': mean_absolute_error(actual, predicted),
                'rmse': np.sqrt(mean_squared_error(actual, predicted)),
                'r2': r2_score(actual, predicted),
                'mape': np.mean(np.abs((actual - predicted) / actual)) * 100
            }
            
            return {
                'success': True,
                'forecast': forecast_data,
                'metrics': metrics,
                'model_info': {
                    'type': 'prophet',
                    'periods': periods,
                    'confidence_interval': confidence_interval
                }
            }
            
        except Exception as e:
            logger.error(f"Error in Prophet forecasting: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def forecast_with_ml(self, df: pd.DataFrame, target_column: str, 
                        feature_columns: List[str], periods: int = 30) -> Dict[str, Any]:
        """Forecast using machine learning models"""
        try:
            # Prepare features
            X = df[feature_columns].values
            y = df[target_column].values
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
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
                'r2': r2_score(y_test, y_pred)
            }
            
            # Generate future predictions (simplified)
            last_features = X[-1:]
            future_predictions = []
            
            for i in range(periods):
                # Simple extrapolation for demonstration
                prediction = rf_model.predict(scaler.transform(last_features))[0]
                future_predictions.append(prediction)
                
                # Update features for next prediction (simplified)
                last_features = last_features * 1.01  # Simple trend assumption
            
            forecast_data = {
                'forecast_values': future_predictions,
                'confidence_lower': [p * 0.9 for p in future_predictions],  # Simplified confidence
                'confidence_upper': [p * 1.1 for p in future_predictions],
                'trend': 'increasing' if future_predictions[-1] > future_predictions[0] else 'decreasing'
            }
            
            return {
                'success': True,
                'forecast': forecast_data,
                'metrics': metrics,
                'model_info': {
                    'type': 'random_forest',
                    'periods': periods,
                    'features': feature_columns
                }
            }
            
        except Exception as e:
            logger.error(f"Error in ML forecasting: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def detect_anomalies(self, df: pd.DataFrame, columns: List[str], 
                        contamination: float = 0.1) -> Dict[str, Any]:
        """Detect anomalies in data using Isolation Forest"""
        try:
            anomalies = {}
            
            for column in columns:
                if column in df.columns:
                    # Prepare data
                    data = df[column].dropna().values.reshape(-1, 1)
                    
                    # Fit isolation forest
                    iso_forest = IsolationForest(contamination=contamination, random_state=42)
                    predictions = iso_forest.fit_predict(data)
                    
                    # Find anomalies (predictions == -1)
                    anomaly_indices = np.where(predictions == -1)[0]
                    anomaly_values = data[anomaly_indices].flatten()
                    
                    anomalies[column] = {
                        'indices': anomaly_indices.tolist(),
                        'values': anomaly_values.tolist(),
                        'count': len(anomaly_indices),
                        'percentage': (len(anomaly_indices) / len(data)) * 100
                    }
            
            return {
                'success': True,
                'anomalies': anomalies,
                'total_anomalies': sum(anom['count'] for anom in anomalies.values())
            }
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def calculate_trends(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Calculate trends and growth rates"""
        try:
            trends = {}
            
            for column in columns:
                if column in df.columns:
                    values = df[column].dropna().values
                    
                    if len(values) > 1:
                        # Calculate linear trend
                        x = np.arange(len(values))
                        slope, intercept = np.polyfit(x, values, 1)
                        
                        # Calculate growth rate
                        if values[0] != 0:
                            growth_rate = ((values[-1] - values[0]) / values[0]) * 100
                        else:
                            growth_rate = 0
                        
                        # Determine trend direction
                        if slope > 0:
                            trend_direction = 'increasing'
                        elif slope < 0:
                            trend_direction = 'decreasing'
                        else:
                            trend_direction = 'stable'
                        
                        trends[column] = {
                            'slope': float(slope),
                            'intercept': float(intercept),
                            'growth_rate': float(growth_rate),
                            'trend_direction': trend_direction,
                            'current_value': float(values[-1]),
                            'initial_value': float(values[0]),
                            'data_points': len(values)
                        }
            
            return {
                'success': True,
                'trends': trends
            }
            
        except Exception as e:
            logger.error(f"Error in trend calculation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def generate_forecast_report(self, df: pd.DataFrame, date_column: str, 
                               value_column: str, periods: int = 30) -> Dict[str, Any]:
        """Generate comprehensive forecast report"""
        try:
            # Prepare data
            prophet_df = self.prepare_time_series_data(df, date_column, value_column)
            
            # Get forecasts
            prophet_result = self.forecast_with_prophet(prophet_df, periods)
            
            # Get trends
            trends_result = self.calculate_trends(df, [value_column])
            
            # Get anomalies
            anomalies_result = self.detect_anomalies(df, [value_column])
            
            # Combine results
            report = {
                'success': True,
                'forecast': prophet_result.get('forecast', {}),
                'metrics': prophet_result.get('metrics', {}),
                'trends': trends_result.get('trends', {}),
                'anomalies': anomalies_result.get('anomalies', {}),
                'summary': {
                    'total_periods': periods,
                    'forecast_horizon': f"{periods} periods",
                    'model_accuracy': prophet_result.get('metrics', {}).get('r2', 0),
                    'trend_direction': trends_result.get('trends', {}).get(value_column, {}).get('trend_direction', 'unknown'),
                    'anomaly_count': anomalies_result.get('total_anomalies', 0)
                }
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating forecast report: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_forecast_insights(self, forecast_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate insights from forecast data"""
        insights = []
        
        try:
            forecast_values = forecast_data.get('forecast_values', [])
            confidence_lower = forecast_data.get('confidence_lower', [])
            confidence_upper = forecast_data.get('confidence_upper', [])
            
            if len(forecast_values) > 0:
                # Trend insight
                if forecast_values[-1] > forecast_values[0]:
                    trend_insight = {
                        'type': 'trend',
                        'title': 'Positive Growth Forecast',
                        'description': f"Forecast shows {((forecast_values[-1] - forecast_values[0]) / forecast_values[0] * 100):.1f}% growth over the forecast period",
                        'confidence': 'high' if len(forecast_values) > 10 else 'medium',
                        'impact': 'positive'
                    }
                    insights.append(trend_insight)
                
                # Volatility insight
                volatility = np.std(forecast_values)
                if volatility > np.mean(forecast_values) * 0.1:
                    volatility_insight = {
                        'type': 'volatility',
                        'title': 'High Forecast Volatility',
                        'description': f"Forecast shows significant volatility with {volatility:.2f} standard deviation",
                        'confidence': 'medium',
                        'impact': 'neutral'
                    }
                    insights.append(volatility_insight)
                
                # Confidence interval insight
                avg_confidence_width = np.mean([u - l for u, l in zip(confidence_upper, confidence_lower)])
                if avg_confidence_width > np.mean(forecast_values) * 0.2:
                    confidence_insight = {
                        'type': 'uncertainty',
                        'title': 'High Forecast Uncertainty',
                        'description': f"Wide confidence intervals indicate high uncertainty in predictions",
                        'confidence': 'low',
                        'impact': 'caution'
                    }
                    insights.append(confidence_insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating forecast insights: {str(e)}")
            return []

# Global instance
predictive_analytics = PredictiveAnalytics() 