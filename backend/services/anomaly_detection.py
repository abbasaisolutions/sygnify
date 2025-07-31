"""
Anomaly Detection & Alert System
Provides real-time anomaly detection with configurable alert thresholds
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import logging
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.covariance import EllipticEnvelope
from sklearn.preprocessing import StandardScaler
import asyncio
import json
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    ERROR = "error"

class AlertStatus(Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

@dataclass
class AlertThreshold:
    metric: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    percentage_change: Optional[float] = None
    std_deviation: Optional[float] = None
    alert_level: AlertLevel = AlertLevel.WARNING

@dataclass
class Alert:
    id: str
    timestamp: datetime
    metric: str
    value: float
    threshold: AlertThreshold
    message: str
    level: AlertLevel
    status: AlertStatus = AlertStatus.ACTIVE
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

class AnomalyDetector:
    def __init__(self):
        self.models = {}
        self.thresholds = {}
        self.alerts = []
        self.alert_callbacks = []
        self.scalers = {}
        
    def add_threshold(self, metric: str, threshold: AlertThreshold):
        """Add a threshold for anomaly detection"""
        self.thresholds[metric] = threshold
        logger.info(f"Added threshold for metric: {metric}")
    
    def remove_threshold(self, metric: str):
        """Remove a threshold"""
        if metric in self.thresholds:
            del self.thresholds[metric]
            logger.info(f"Removed threshold for metric: {metric}")
    
    def get_thresholds(self) -> List[Dict[str, Any]]:
        """Get all configured thresholds"""
        return [
            {
                'metric': metric,
                'threshold': asdict(threshold)
            }
            for metric, threshold in self.thresholds.items()
        ]
    
    def detect_statistical_anomalies(self, df: pd.DataFrame, columns: List[str], 
                                   method: str = 'isolation_forest') -> Dict[str, Any]:
        """Detect anomalies using statistical methods"""
        try:
            anomalies = {}
            
            for column in columns:
                if column in df.columns:
                    data = df[column].dropna().values.reshape(-1, 1)
                    
                    if len(data) < 10:
                        continue
                    
                    # Scale the data
                    scaler = StandardScaler()
                    data_scaled = scaler.fit_transform(data)
                    
                    # Choose detection method
                    if method == 'isolation_forest':
                        detector = IsolationForest(contamination=0.1, random_state=42)
                    elif method == 'local_outlier_factor':
                        detector = LocalOutlierFactor(contamination=0.1)
                    elif method == 'elliptic_envelope':
                        detector = EllipticEnvelope(contamination=0.1, random_state=42)
                    else:
                        detector = IsolationForest(contamination=0.1, random_state=42)
                    
                    # Fit and predict
                    if method == 'local_outlier_factor':
                        predictions = detector.fit_predict(data_scaled)
                    else:
                        detector.fit(data_scaled)
                        predictions = detector.predict(data_scaled)
                    
                    # Find anomalies (predictions == -1)
                    anomaly_indices = np.where(predictions == -1)[0]
                    anomaly_values = data[anomaly_indices].flatten()
                    
                    anomalies[column] = {
                        'indices': anomaly_indices.tolist(),
                        'values': anomaly_values.tolist(),
                        'count': len(anomaly_indices),
                        'percentage': (len(anomaly_indices) / len(data)) * 100,
                        'method': method,
                        'mean': float(np.mean(data)),
                        'std': float(np.std(data)),
                        'min': float(np.min(data)),
                        'max': float(np.max(data))
                    }
            
            return {
                'success': True,
                'anomalies': anomalies,
                'total_anomalies': sum(anom['count'] for anom in anomalies.values()),
                'detection_method': method
            }
            
        except Exception as e:
            logger.error(f"Error in statistical anomaly detection: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def detect_threshold_anomalies(self, data: Dict[str, float]) -> List[Alert]:
        """Detect anomalies based on configured thresholds"""
        alerts = []
        
        try:
            for metric, value in data.items():
                if metric in self.thresholds:
                    threshold = self.thresholds[metric]
                    
                    # Check min/max thresholds
                    if threshold.min_value is not None and value < threshold.min_value:
                        alert = Alert(
                            id=f"alert_{len(self.alerts)}_{datetime.now().timestamp()}",
                            timestamp=datetime.now(),
                            metric=metric,
                            value=value,
                            threshold=threshold,
                            message=f"{metric} value {value} is below minimum threshold {threshold.min_value}",
                            level=threshold.alert_level
                        )
                        alerts.append(alert)
                    
                    if threshold.max_value is not None and value > threshold.max_value:
                        alert = Alert(
                            id=f"alert_{len(self.alerts)}_{datetime.now().timestamp()}",
                            timestamp=datetime.now(),
                            metric=metric,
                            value=value,
                            threshold=threshold,
                            message=f"{metric} value {value} is above maximum threshold {threshold.max_value}",
                            level=threshold.alert_level
                        )
                        alerts.append(alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error in threshold anomaly detection: {str(e)}")
            return []
    
    def detect_trend_anomalies(self, df: pd.DataFrame, columns: List[str], 
                             window: int = 10) -> Dict[str, Any]:
        """Detect anomalies based on trend analysis"""
        try:
            trend_anomalies = {}
            
            for column in columns:
                if column in df.columns:
                    values = df[column].dropna().values
                    
                    if len(values) < window * 2:
                        continue
                    
                    # Calculate rolling statistics
                    rolling_mean = pd.Series(values).rolling(window=window).mean()
                    rolling_std = pd.Series(values).rolling(window=window).std()
                    
                    # Calculate z-scores
                    z_scores = np.abs((values - rolling_mean) / rolling_std)
                    
                    # Find points with high z-scores (anomalies)
                    anomaly_indices = np.where(z_scores > 2.0)[0]
                    anomaly_values = values[anomaly_indices]
                    
                    trend_anomalies[column] = {
                        'indices': anomaly_indices.tolist(),
                        'values': anomaly_values.tolist(),
                        'count': len(anomaly_indices),
                        'z_scores': z_scores[anomaly_indices].tolist(),
                        'window': window,
                        'threshold': 2.0
                    }
            
            return {
                'success': True,
                'trend_anomalies': trend_anomalies,
                'total_anomalies': sum(anom['count'] for anom in trend_anomalies.values())
            }
            
        except Exception as e:
            logger.error(f"Error in trend anomaly detection: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def add_alert_callback(self, callback: Callable[[Alert], None]):
        """Add a callback function for alerts"""
        self.alert_callbacks.append(callback)
    
    def trigger_alert(self, alert: Alert):
        """Trigger an alert and notify callbacks"""
        self.alerts.append(alert)
        
        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {str(e)}")
        
        logger.info(f"Alert triggered: {alert.message} (Level: {alert.level.value})")
    
    def get_active_alerts(self, level: Optional[AlertLevel] = None) -> List[Alert]:
        """Get active alerts, optionally filtered by level"""
        if level:
            return [alert for alert in self.alerts if alert.status == AlertStatus.ACTIVE and alert.level == level]
        else:
            return [alert for alert in self.alerts if alert.status == AlertStatus.ACTIVE]
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        for alert in self.alerts:
            if alert.id == alert_id and alert.status == AlertStatus.ACTIVE:
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_by = acknowledged_by
                logger.info(f"Alert {alert_id} acknowledged by {acknowledged_by}")
                return True
        return False
    
    def resolve_alert(self, alert_id: str) -> bool:
        """Resolve an alert"""
        for alert in self.alerts:
            if alert.id == alert_id and alert.status != AlertStatus.RESOLVED:
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.now()
                logger.info(f"Alert {alert_id} resolved")
                return True
        return False
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get summary of all alerts"""
        total_alerts = len(self.alerts)
        active_alerts = len(self.get_active_alerts())
        acknowledged_alerts = len([a for a in self.alerts if a.status == AlertStatus.ACKNOWLEDGED])
        resolved_alerts = len([a for a in self.alerts if a.status == AlertStatus.RESOLVED])
        
        # Count by level
        level_counts = {}
        for level in AlertLevel:
            level_counts[level.value] = len([a for a in self.alerts if a.level == level])
        
        return {
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'acknowledged_alerts': acknowledged_alerts,
            'resolved_alerts': resolved_alerts,
            'by_level': level_counts,
            'recent_alerts': [
                {
                    'id': alert.id,
                    'timestamp': alert.timestamp.isoformat(),
                    'metric': alert.metric,
                    'value': alert.value,
                    'message': alert.message,
                    'level': alert.level.value,
                    'status': alert.status.value
                }
                for alert in sorted(self.alerts, key=lambda x: x.timestamp, reverse=True)[:10]
            ]
        }
    
    def clear_old_alerts(self, days: int = 30):
        """Clear alerts older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        old_alerts = [alert for alert in self.alerts if alert.timestamp < cutoff_date]
        
        for alert in old_alerts:
            self.alerts.remove(alert)
        
        logger.info(f"Cleared {len(old_alerts)} alerts older than {days} days")
    
    def export_alerts(self, format: str = 'json') -> str:
        """Export alerts to specified format"""
        try:
            if format == 'json':
                alert_data = [
                    {
                        'id': alert.id,
                        'timestamp': alert.timestamp.isoformat(),
                        'metric': alert.metric,
                        'value': alert.value,
                        'message': alert.message,
                        'level': alert.level.value,
                        'status': alert.status.value,
                        'acknowledged_by': alert.acknowledged_by,
                        'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
                    }
                    for alert in self.alerts
                ]
                return json.dumps(alert_data, indent=2)
            else:
                raise ValueError(f"Unsupported format: {format}")
        except Exception as e:
            logger.error(f"Error exporting alerts: {str(e)}")
            return ""

# Global instance
anomaly_detector = AnomalyDetector() 