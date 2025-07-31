"""
Anomaly Detection Service v1.1
- Multiple anomaly detection algorithms
- Real-time anomaly detection and alerting
- Configurable alert thresholds
- Statistical and ML-based detection
- Anomaly scoring and classification
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class AnomalyDetectionService:
    def __init__(self):
        self.models = {}
        self.alert_thresholds = {
            "critical": 0.95,  # 95th percentile
            "high": 0.90,      # 90th percentile
            "medium": 0.85,    # 85th percentile
            "low": 0.80        # 80th percentile
        }
        self.detection_methods = {
            "isolation_forest": self._isolation_forest_detection,
            "local_outlier_factor": self._lof_detection,
            "elliptic_envelope": self._elliptic_envelope_detection,
            "statistical": self._statistical_detection,
            "z_score": self._z_score_detection,
            "iqr": self._iqr_detection
        }
        
    def detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect anomalies in all numeric columns"""
        try:
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_columns:
                return {"error": "No numeric columns found for anomaly detection"}
            
            anomalies = {}
            
            for column in numeric_columns:
                try:
                    column_anomalies = self._detect_column_anomalies(df, column)
                    anomalies[column] = column_anomalies
                except Exception as e:
                    logger.warning(f"Anomaly detection failed for column {column}: {str(e)}")
                    anomalies[column] = {"error": f"Anomaly detection unavailable: {str(e)}"}
            
            return {
                "anomalies": anomalies,
                "summary": self._generate_anomaly_summary(anomalies),
                "alerts": self._generate_alerts(anomalies),
                "risk_assessment": self._assess_anomaly_risk(anomalies)
            }
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {str(e)}")
            return {"error": f"Anomaly detection failed: {str(e)}"}
    
    def _detect_column_anomalies(self, df: pd.DataFrame, column: str) -> Dict[str, Any]:
        """Detect anomalies in a single column using multiple methods"""
        try:
            series = df[column].dropna()
            if len(series) < 10:
                return {"error": "Insufficient data for anomaly detection"}
            
            # Apply multiple detection methods
            results = {}
            
            for method_name, method_func in self.detection_methods.items():
                try:
                    method_result = method_func(series)
                    if method_result and "error" not in method_result:
                        results[method_name] = method_result
                except Exception as e:
                    logger.warning(f"Method {method_name} failed for {column}: {str(e)}")
                    continue
            
            if not results:
                return {"error": "All anomaly detection methods failed"}
            
            # Combine results from multiple methods
            combined_result = self._combine_detection_results(series, results)
            
            return {
                "individual_methods": results,
                "combined_result": combined_result,
                "anomaly_score": self._calculate_anomaly_score(series, combined_result),
                "severity_distribution": self._analyze_severity_distribution(combined_result)
            }
            
        except Exception as e:
            logger.error(f"Column anomaly detection failed for {column}: {str(e)}")
            return {"error": str(e)}
    
    def _isolation_forest_detection(self, series: pd.Series) -> Dict[str, Any]:
        """Isolation Forest anomaly detection"""
        try:
            # Reshape data for sklearn
            X = series.values.reshape(-1, 1)
            
            # Fit Isolation Forest
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            predictions = iso_forest.fit_predict(X)
            
            # Convert predictions: -1 for anomalies, 1 for normal
            anomaly_indices = np.where(predictions == -1)[0]
            
            return {
                "anomaly_indices": anomaly_indices.tolist(),
                "anomaly_values": series.iloc[anomaly_indices].tolist(),
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "method": "isolation_forest"
            }
            
        except Exception as e:
            logger.error(f"Isolation Forest detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _lof_detection(self, series: pd.Series) -> Dict[str, Any]:
        """Local Outlier Factor anomaly detection"""
        try:
            # Reshape data for sklearn
            X = series.values.reshape(-1, 1)
            
            # Fit LOF
            lof = LocalOutlierFactor(contamination=0.1, n_neighbors=min(20, len(series)//4))
            predictions = lof.fit_predict(X)
            
            # Convert predictions: -1 for anomalies, 1 for normal
            anomaly_indices = np.where(predictions == -1)[0]
            
            return {
                "anomaly_indices": anomaly_indices.tolist(),
                "anomaly_values": series.iloc[anomaly_indices].tolist(),
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "method": "local_outlier_factor"
            }
            
        except Exception as e:
            logger.error(f"LOF detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _elliptic_envelope_detection(self, series: pd.Series) -> Dict[str, Any]:
        """Elliptic Envelope anomaly detection"""
        try:
            # Reshape data for sklearn
            X = series.values.reshape(-1, 1)
            
            # Fit Elliptic Envelope
            envelope = EllipticEnvelope(contamination=0.1, random_state=42)
            predictions = envelope.fit_predict(X)
            
            # Convert predictions: -1 for anomalies, 1 for normal
            anomaly_indices = np.where(predictions == -1)[0]
            
            return {
                "anomaly_indices": anomaly_indices.tolist(),
                "anomaly_values": series.iloc[anomaly_indices].tolist(),
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "method": "elliptic_envelope"
            }
            
        except Exception as e:
            logger.error(f"Elliptic Envelope detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _statistical_detection(self, series: pd.Series) -> Dict[str, Any]:
        """Statistical anomaly detection using percentiles"""
        try:
            # Calculate percentiles
            p95 = series.quantile(0.95)
            p05 = series.quantile(0.05)
            
            # Find values outside the 5th-95th percentile range
            upper_anomalies = series[series > p95]
            lower_anomalies = series[series < p05]
            
            anomaly_indices = list(upper_anomalies.index) + list(lower_anomalies.index)
            anomaly_values = list(upper_anomalies.values) + list(lower_anomalies.values)
            
            return {
                "anomaly_indices": anomaly_indices,
                "anomaly_values": anomaly_values,
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "upper_threshold": p95,
                "lower_threshold": p05,
                "method": "statistical"
            }
            
        except Exception as e:
            logger.error(f"Statistical detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _z_score_detection(self, series: pd.Series) -> Dict[str, Any]:
        """Z-score based anomaly detection"""
        try:
            # Calculate z-scores
            z_scores = np.abs(stats.zscore(series))
            
            # Find values with z-score > 2 (95% confidence)
            anomaly_mask = z_scores > 2
            anomaly_indices = series[anomaly_mask].index.tolist()
            anomaly_values = series[anomaly_mask].tolist()
            
            return {
                "anomaly_indices": anomaly_indices,
                "anomaly_values": anomaly_values,
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "z_scores": z_scores[anomaly_mask].tolist(),
                "method": "z_score"
            }
            
        except Exception as e:
            logger.error(f"Z-score detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _iqr_detection(self, series: pd.Series) -> Dict[str, Any]:
        """IQR-based anomaly detection"""
        try:
            # Calculate quartiles
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            
            # Define bounds
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Find outliers
            outliers = series[(series < lower_bound) | (series > upper_bound)]
            anomaly_indices = outliers.index.tolist()
            anomaly_values = outliers.tolist()
            
            return {
                "anomaly_indices": anomaly_indices,
                "anomaly_values": anomaly_values,
                "anomaly_count": len(anomaly_indices),
                "anomaly_percentage": len(anomaly_indices) / len(series) * 100,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "method": "iqr"
            }
            
        except Exception as e:
            logger.error(f"IQR detection failed: {str(e)}")
            return {"error": str(e)}
    
    def _combine_detection_results(self, series: pd.Series, results: Dict[str, Any]) -> Dict[str, Any]:
        """Combine results from multiple detection methods"""
        try:
            # Create a voting system
            anomaly_votes = np.zeros(len(series))
            
            for method_name, result in results.items():
                if "anomaly_indices" in result:
                    for idx in result["anomaly_indices"]:
                        if idx < len(anomaly_votes):
                            anomaly_votes[idx] += 1
            
            # Consider an observation anomalous if at least 2 methods flag it
            threshold = max(2, len(results) // 2)
            combined_anomaly_indices = np.where(anomaly_votes >= threshold)[0].tolist()
            combined_anomaly_values = series.iloc[combined_anomaly_indices].tolist()
            
            return {
                "anomaly_indices": combined_anomaly_indices,
                "anomaly_values": combined_anomaly_values,
                "anomaly_count": len(combined_anomaly_indices),
                "anomaly_percentage": len(combined_anomaly_indices) / len(series) * 100,
                "confidence_scores": anomaly_votes[combined_anomaly_indices].tolist(),
                "method": "combined"
            }
            
        except Exception as e:
            logger.error(f"Result combination failed: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_anomaly_score(self, series: pd.Series, result: Dict[str, Any]) -> float:
        """Calculate overall anomaly score for the column"""
        try:
            if "error" in result:
                return 0.0
            
            # Base score on percentage of anomalies
            base_score = result.get("anomaly_percentage", 0) / 100
            
            # Adjust for confidence if available
            if "confidence_scores" in result:
                avg_confidence = np.mean(result["confidence_scores"])
                max_possible_confidence = len(self.detection_methods)
                confidence_factor = avg_confidence / max_possible_confidence
                return base_score * confidence_factor
            
            return base_score
            
        except Exception as e:
            logger.warning(f"Anomaly score calculation failed: {str(e)}")
            return 0.0
    
    def _analyze_severity_distribution(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the severity distribution of anomalies"""
        try:
            if "error" in result or "anomaly_values" not in result:
                return {"error": "No anomaly data available"}
            
            anomaly_values = result["anomaly_values"]
            if not anomaly_values:
                return {"error": "No anomalies detected"}
            
            # Calculate severity metrics
            mean_anomaly = np.mean(anomaly_values)
            std_anomaly = np.std(anomaly_values)
            
            # Categorize by severity
            severity_levels = {
                "critical": len([v for v in anomaly_values if abs(v - mean_anomaly) > 3 * std_anomaly]),
                "high": len([v for v in anomaly_values if 2 * std_anomaly < abs(v - mean_anomaly) <= 3 * std_anomaly]),
                "medium": len([v for v in anomaly_values if 1 * std_anomaly < abs(v - mean_anomaly) <= 2 * std_anomaly]),
                "low": len([v for v in anomaly_values if abs(v - mean_anomaly) <= 1 * std_anomaly])
            }
            
            return {
                "total_anomalies": len(anomaly_values),
                "mean_anomaly_value": mean_anomaly,
                "std_anomaly_value": std_anomaly,
                "severity_distribution": severity_levels,
                "most_common_severity": max(severity_levels, key=severity_levels.get)
            }
            
        except Exception as e:
            logger.warning(f"Severity analysis failed: {str(e)}")
            return {"error": str(e)}
    
    def _generate_anomaly_summary(self, anomalies: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of all anomaly detections"""
        try:
            successful_detections = {k: v for k, v in anomalies.items() if "error" not in v}
            
            if not successful_detections:
                return {"error": "No successful anomaly detections"}
            
            summary = {
                "total_columns": len(anomalies),
                "columns_with_anomalies": len(successful_detections),
                "total_anomalies": 0,
                "high_risk_columns": [],
                "anomaly_distribution": {}
            }
            
            # Calculate totals and identify high-risk columns
            for column, result in successful_detections.items():
                if "combined_result" in result:
                    combined = result["combined_result"]
                    if "anomaly_count" in combined:
                        summary["total_anomalies"] += combined["anomaly_count"]
                        
                        # Check if high risk (more than 10% anomalies)
                        if combined.get("anomaly_percentage", 0) > 10:
                            summary["high_risk_columns"].append({
                                "column": column,
                                "anomaly_percentage": combined.get("anomaly_percentage", 0),
                                "anomaly_count": combined.get("anomaly_count", 0)
                            })
            
            # Sort high-risk columns by anomaly percentage
            summary["high_risk_columns"].sort(key=lambda x: x["anomaly_percentage"], reverse=True)
            
            return summary
            
        except Exception as e:
            logger.error(f"Anomaly summary generation failed: {str(e)}")
            return {"error": f"Summary generation failed: {str(e)}"}
    
    def _generate_alerts(self, anomalies: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate alerts based on anomaly detection results"""
        try:
            alerts = []
            
            for column, result in anomalies.items():
                if "error" in result:
                    continue
                
                if "combined_result" in result:
                    combined = result["combined_result"]
                    anomaly_percentage = combined.get("anomaly_percentage", 0)
                    
                    # Generate alerts based on thresholds
                    if anomaly_percentage > 15:
                        alerts.append({
                            "level": "critical",
                            "column": column,
                            "message": f"Critical anomaly level detected in {column}: {anomaly_percentage:.1f}% anomalies",
                            "anomaly_percentage": anomaly_percentage,
                            "timestamp": datetime.now().isoformat()
                        })
                    elif anomaly_percentage > 10:
                        alerts.append({
                            "level": "high",
                            "column": column,
                            "message": f"High anomaly level detected in {column}: {anomaly_percentage:.1f}% anomalies",
                            "anomaly_percentage": anomaly_percentage,
                            "timestamp": datetime.now().isoformat()
                        })
                    elif anomaly_percentage > 5:
                        alerts.append({
                            "level": "medium",
                            "column": column,
                            "message": f"Medium anomaly level detected in {column}: {anomaly_percentage:.1f}% anomalies",
                            "anomaly_percentage": anomaly_percentage,
                            "timestamp": datetime.now().isoformat()
                        })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Alert generation failed: {str(e)}")
            return []
    
    def _assess_anomaly_risk(self, anomalies: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall anomaly risk for the dataset"""
        try:
            successful_detections = {k: v for k, v in anomalies.items() if "error" not in v}
            
            if not successful_detections:
                return {"risk_level": "low", "risk_score": 0.0, "reason": "No anomalies detected"}
            
            # Calculate overall risk score
            total_anomaly_percentage = 0
            high_risk_columns = 0
            
            for result in successful_detections.values():
                if "combined_result" in result:
                    combined = result["combined_result"]
                    anomaly_percentage = combined.get("anomaly_percentage", 0)
                    total_anomaly_percentage += anomaly_percentage
                    
                    if anomaly_percentage > 10:
                        high_risk_columns += 1
            
            avg_anomaly_percentage = total_anomaly_percentage / len(successful_detections)
            risk_score = avg_anomaly_percentage / 100
            
            # Determine risk level
            if risk_score > 0.15 or high_risk_columns > len(successful_detections) * 0.3:
                risk_level = "critical"
            elif risk_score > 0.10 or high_risk_columns > len(successful_detections) * 0.2:
                risk_level = "high"
            elif risk_score > 0.05 or high_risk_columns > len(successful_detections) * 0.1:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            return {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "average_anomaly_percentage": avg_anomaly_percentage,
                "high_risk_columns": high_risk_columns,
                "total_columns_analyzed": len(successful_detections),
                "recommendation": self._get_risk_recommendation(risk_level, risk_score)
            }
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {str(e)}")
            return {"risk_level": "unknown", "risk_score": 0.0, "error": str(e)}
    
    def _get_risk_recommendation(self, risk_level: str, risk_score: float) -> str:
        """Get recommendation based on risk level"""
        recommendations = {
            "critical": "Immediate investigation required. Consider data quality issues or system problems.",
            "high": "Investigate anomalies and consider data validation procedures.",
            "medium": "Monitor closely and investigate significant anomalies.",
            "low": "Normal data patterns detected. Continue regular monitoring."
        }
        
        return recommendations.get(risk_level, "Monitor data quality and patterns.") 