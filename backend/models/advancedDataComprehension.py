import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
import re
from datetime import datetime
import json
from typing import Dict, List, Tuple, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedDataComprehension:
    def __init__(self):
        self.domain_keywords = {
            'advertising': {
                'metrics': ['ctr', 'cpc', 'cpm', 'roas', 'conversion_rate', 'impressions', 'clicks', 'spend', 'revenue'],
                'entities': ['campaign', 'ad_group', 'audience', 'creative', 'placement', 'channel'],
                'patterns': ['date', 'time', 'geo', 'device', 'browser', 'os']
            },
            'finance': {
                'metrics': ['revenue', 'profit', 'margin', 'roi', 'cash_flow', 'ebitda', 'p&l', 'balance_sheet'],
                'entities': ['account', 'transaction', 'invoice', 'payment', 'budget', 'forecast'],
                'patterns': ['date', 'period', 'currency', 'account_type', 'category']
            },
            'supply_chain': {
                'metrics': ['lead_time', 'inventory', 'demand', 'supply', 'cost', 'efficiency', 'throughput'],
                'entities': ['supplier', 'warehouse', 'product', 'order', 'shipment', 'route'],
                'patterns': ['date', 'location', 'status', 'priority', 'quantity']
            },
            'hr': {
                'metrics': ['turnover', 'satisfaction', 'productivity', 'attendance', 'performance', 'salary'],
                'entities': ['employee', 'department', 'position', 'manager', 'team', 'project'],
                'patterns': ['date', 'tenure', 'level', 'location', 'status']
            },
            'operations': {
                'metrics': ['production', 'downtime', 'quality', 'efficiency', 'capacity', 'utilization'],
                'entities': ['machine', 'process', 'line', 'shift', 'operator', 'maintenance'],
                'patterns': ['date', 'time', 'location', 'status', 'priority']
            }
        }
    
    def analyze_data_structure(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Perform deep analysis of data structure and patterns"""
        analysis = {
            'shape': df.shape,
            'columns': list(df.columns),
            'data_types': df.dtypes.to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'unique_counts': df.nunique().to_dict(),
            'memory_usage': df.memory_usage(deep=True).sum(),
            'temporal_columns': self._identify_temporal_columns(df),
            'categorical_columns': self._identify_categorical_columns(df),
            'numerical_columns': self._identify_numerical_columns(df),
            'text_columns': self._identify_text_columns(df),
            'geographic_columns': self._identify_geographic_columns(df),
            'anomalies': self._detect_anomalies(df),
            'correlations': self._analyze_correlations(df),
            'patterns': self._identify_patterns(df)
        }
        return analysis
    
    def _identify_temporal_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify date/time columns with advanced pattern recognition"""
        temporal_cols = []
        date_patterns = [
            r'date', r'time', r'created', r'updated', r'start', r'end', 
            r'birth', r'hired', r'joined', r'expired', r'due', r'deadline'
        ]
        
        for col in df.columns:
            col_lower = col.lower()
            if any(re.search(pattern, col_lower) for pattern in date_patterns):
                temporal_cols.append(col)
            elif df[col].dtype == 'object':
                # Try to parse as datetime
                try:
                    pd.to_datetime(df[col].dropna().head(100))
                    temporal_cols.append(col)
                except:
                    pass
        
        return temporal_cols
    
    def _identify_categorical_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify categorical columns with smart threshold detection"""
        categorical_cols = []
        for col in df.columns:
            if df[col].dtype == 'object':
                unique_ratio = df[col].nunique() / len(df)
                if unique_ratio < 0.5:  # Less than 50% unique values
                    categorical_cols.append(col)
        return categorical_cols
    
    def _identify_numerical_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify numerical columns with advanced type detection"""
        numerical_cols = []
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                numerical_cols.append(col)
        return numerical_cols
    
    def _identify_text_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify text columns with content analysis"""
        text_cols = []
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check if column contains long text
                avg_length = df[col].astype(str).str.len().mean()
                if avg_length > 50:  # Average length > 50 characters
                    text_cols.append(col)
        return text_cols
    
    def _identify_geographic_columns(self, df: pd.DataFrame) -> List[str]:
        """Identify geographic columns with location pattern recognition"""
        geo_patterns = [r'country', r'state', r'city', r'zip', r'postal', r'address', r'location', r'region']
        geo_cols = []
        for col in df.columns:
            col_lower = col.lower()
            if any(re.search(pattern, col_lower) for pattern in geo_patterns):
                geo_cols.append(col)
        return geo_cols
    
    def _detect_anomalies(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect anomalies using multiple algorithms"""
        anomalies = {}
        numerical_cols = self._identify_numerical_columns(df)
        
        for col in numerical_cols:
            if df[col].notna().sum() > 10:  # Need sufficient data
                # Statistical outliers
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)]
                
                # Isolation Forest
                iso_forest = IsolationForest(contamination=0.1, random_state=42)
                iso_scores = iso_forest.fit_predict(df[[col]].dropna())
                iso_outliers = df[df[col].notna()][iso_scores == -1]
                
                anomalies[col] = {
                    'statistical_outliers': len(outliers),
                    'isolation_forest_outliers': len(iso_outliers),
                    'outlier_percentage': len(outliers) / len(df) * 100
                }
        
        return anomalies
    
    def _analyze_correlations(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze correlations between numerical columns"""
        numerical_cols = self._identify_numerical_columns(df)
        if len(numerical_cols) < 2:
            return {}
        
        corr_matrix = df[numerical_cols].corr()
        high_corr_pairs = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:  # High correlation threshold
                    high_corr_pairs.append({
                        'col1': corr_matrix.columns[i],
                        'col2': corr_matrix.columns[j],
                        'correlation': corr_value
                    })
        
        return {
            'high_correlations': high_corr_pairs,
            'correlation_matrix': corr_matrix.to_dict()
        }
    
    def _identify_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Identify data patterns and trends"""
        patterns = {
            'seasonality': self._detect_seasonality(df),
            'trends': self._detect_trends(df),
            'distributions': self._analyze_distributions(df)
        }
        return patterns
    
    def _detect_seasonality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect seasonal patterns in temporal data"""
        temporal_cols = self._identify_temporal_columns(df)
        seasonality = {}
        
        for col in temporal_cols:
            try:
                df_temp = df.copy()
                df_temp[col] = pd.to_datetime(df_temp[col])
                df_temp['month'] = df_temp[col].dt.month
                df_temp['day_of_week'] = df_temp[col].dt.dayofweek
                
                # Check for monthly patterns
                monthly_counts = df_temp['month'].value_counts()
                if monthly_counts.std() / monthly_counts.mean() > 0.3:
                    seasonality[col] = {'type': 'monthly', 'strength': 'high'}
                
                # Check for weekly patterns
                weekly_counts = df_temp['day_of_week'].value_counts()
                if weekly_counts.std() / weekly_counts.mean() > 0.3:
                    seasonality[col] = {'type': 'weekly', 'strength': 'high'}
                    
            except Exception as e:
                logger.warning(f"Could not analyze seasonality for {col}: {e}")
        
        return seasonality
    
    def _detect_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect trends in numerical data over time"""
        trends = {}
        temporal_cols = self._identify_temporal_columns(df)
        numerical_cols = self._identify_numerical_columns(df)
        
        for temp_col in temporal_cols:
            for num_col in numerical_cols:
                try:
                    df_temp = df[[temp_col, num_col]].dropna()
                    if len(df_temp) > 10:
                        df_temp[temp_col] = pd.to_datetime(df_temp[temp_col])
                        df_temp = df_temp.sort_values(temp_col)
                        
                        # Simple trend detection
                        slope = np.polyfit(range(len(df_temp)), df_temp[num_col], 1)[0]
                        if abs(slope) > df_temp[num_col].std() * 0.1:
                            trend_direction = 'increasing' if slope > 0 else 'decreasing'
                            trends[f"{temp_col}_{num_col}"] = {
                                'direction': trend_direction,
                                'strength': abs(slope)
                            }
                except Exception as e:
                    logger.warning(f"Could not analyze trend for {temp_col}_{num_col}: {e}")
        
        return trends
    
    def _analyze_distributions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze distributions of numerical columns"""
        distributions = {}
        numerical_cols = self._identify_numerical_columns(df)
        
        for col in numerical_cols:
            if df[col].notna().sum() > 10:
                data = df[col].dropna()
                distributions[col] = {
                    'mean': float(data.mean()),
                    'median': float(data.median()),
                    'std': float(data.std()),
                    'skewness': float(data.skew()),
                    'kurtosis': float(data.kurtosis()),
                    'distribution_type': self._classify_distribution(data)
                }
        
        return distributions
    
    def _classify_distribution(self, data: pd.Series) -> str:
        """Classify the type of distribution"""
        skewness = data.skew()
        kurtosis = data.kurtosis()
        
        if abs(skewness) < 0.5 and abs(kurtosis) < 0.5:
            return 'normal'
        elif skewness > 1:
            return 'right_skewed'
        elif skewness < -1:
            return 'left_skewed'
        elif kurtosis > 3:
            return 'heavy_tailed'
        else:
            return 'other'
    
    def detect_domain(self, df: pd.DataFrame) -> Tuple[str, float]:
        """Advanced domain detection with confidence scoring"""
        column_names = [col.lower() for col in df.columns]
        domain_scores = {}
        
        for domain, patterns in self.domain_keywords.items():
            score = 0
            total_patterns = 0
            
            # Check metrics
            for metric in patterns['metrics']:
                if any(metric in col for col in column_names):
                    score += 2
                total_patterns += 1
            
            # Check entities
            for entity in patterns['entities']:
                if any(entity in col for col in column_names):
                    score += 1.5
                total_patterns += 1
            
            # Check patterns
            for pattern in patterns['patterns']:
                if any(pattern in col for col in column_names):
                    score += 1
                total_patterns += 1
            
            # Normalize score
            if total_patterns > 0:
                domain_scores[domain] = score / total_patterns
        
        if not domain_scores:
            return 'general', 0.0
        
        best_domain = max(domain_scores, key=domain_scores.get)
        confidence = domain_scores[best_domain]
        
        return best_domain, confidence
    
    def generate_data_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive data profile"""
        structure_analysis = self.analyze_data_structure(df)
        domain, confidence = self.detect_domain(df)
        
        profile = {
            'domain': domain,
            'confidence': confidence,
            'structure': structure_analysis,
            'summary': self._generate_summary(df, structure_analysis, domain),
            'recommendations': self._generate_recommendations(df, structure_analysis, domain)
        }
        
        return profile
    
    def _generate_summary(self, df: pd.DataFrame, structure: Dict, domain: str) -> str:
        """Generate natural language summary of the data"""
        summary_parts = [
            f"This dataset contains {df.shape[0]} rows and {df.shape[1]} columns.",
            f"Detected domain: {domain} with {structure['domain_confidence']:.1%} confidence.",
            f"Key numerical columns: {', '.join(structure['numerical_columns'][:5])}.",
            f"Temporal columns: {', '.join(structure['temporal_columns'])}.",
            f"Missing data detected in {len([k for k, v in structure['missing_values'].items() if v > 0])} columns."
        ]
        
        if structure['anomalies']:
            anomaly_count = sum(1 for v in structure['anomalies'].values() if v['outlier_percentage'] > 5)
            summary_parts.append(f"Anomalies detected in {anomaly_count} columns.")
        
        return " ".join(summary_parts)
    
    def _generate_recommendations(self, df: pd.DataFrame, structure: Dict, domain: str) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Data quality recommendations
        missing_cols = [k for k, v in structure['missing_values'].items() if v > 0]
        if missing_cols:
            recommendations.append(f"Address missing values in columns: {', '.join(missing_cols[:3])}")
        
        # Anomaly recommendations
        high_anomaly_cols = [k for k, v in structure['anomalies'].items() if v['outlier_percentage'] > 10]
        if high_anomaly_cols:
            recommendations.append(f"Investigate anomalies in columns: {', '.join(high_anomaly_cols[:3])}")
        
        # Domain-specific recommendations
        if domain == 'finance':
            recommendations.append("Consider adding cash flow analysis and risk metrics")
        elif domain == 'advertising':
            recommendations.append("Include campaign performance metrics and audience segmentation")
        elif domain == 'supply_chain':
            recommendations.append("Add supplier performance metrics and demand forecasting")
        
        return recommendations

def analyze_data_comprehension(data_path: str) -> Dict[str, Any]:
    """Main function to perform advanced data comprehension"""
    try:
        df = pd.read_csv(data_path)
        analyzer = AdvancedDataComprehension()
        profile = analyzer.generate_data_profile(df)
        return profile
    except Exception as e:
        logger.error(f"Data comprehension failed: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import sys
    data_path = sys.argv[1]
    result = analyze_data_comprehension(data_path)
    print(json.dumps(result, indent=2)) 