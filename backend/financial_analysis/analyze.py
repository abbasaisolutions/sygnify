import pandas as pd
import numpy as np
import json
import tempfile
import os
import sys
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

try:
    import ydata_profiling as yp
    HAS_YDATA_PROFILING = True
except ImportError:
    try:
        import pandas_profiling as pp
        HAS_PANDAS_PROFILING = True
    except ImportError:
        HAS_YDATA_PROFILING = False
        HAS_PANDAS_PROFILING = False

try:
    import sweetviz as sv
    HAS_SWEETVIZ = True
except ImportError:
    HAS_SWEETVIZ = False

class EnhancedFinancialAnalyzer:
    """
    Enhanced financial analysis with multiple profiling libraries
    """
    
    def __init__(self):
        self.profiling_libraries = self._detect_profiling_libraries()
        print(f"[Python] Available profiling libraries: {list(self.profiling_libraries.keys())}")
    
    def _detect_profiling_libraries(self):
        """Detect available profiling libraries"""
        libraries = {}
        
        if HAS_YDATA_PROFILING:
            libraries['ydata_profiling'] = True
        elif HAS_PANDAS_PROFILING:
            libraries['pandas_profiling'] = True
        
        if HAS_SWEETVIZ:
            libraries['sweetviz'] = True
            
        return libraries
    
    def analyze_financial_data(self, columns, data, user_id=1, role='executive'):
        """
        Enhanced financial analysis with multiple profiling approaches
        """
        try:
            # Create DataFrame
            df = pd.DataFrame(data, columns=columns)
            print(f"[Python] Created DataFrame with {len(df)} rows and {len(df.columns)} columns")
            
            # Basic data validation
            if df.empty:
                return self._create_error_response("Empty dataset provided")
            
            # Enhanced analysis results
            analysis_results = {
                'metadata': {
                    'records_analyzed': len(df),
                    'columns_analyzed': len(df.columns),
                    'analysis_timestamp': datetime.now().isoformat(),
                    'profiling_libraries': list(self.profiling_libraries.keys()),
                    'user_id': user_id,
                    'role': role
                },
                'data_quality': self._assess_data_quality(df),
                'profiling_results': self._generate_profiling_report(df),
                'financial_metrics': self._extract_financial_metrics(df),
                'smart_labels': self._generate_smart_labels(df),
                'enhanced_labels': self._generate_enhanced_labels(df),
                'narratives': self._generate_narratives(df),
                'facts': self._extract_facts(df),
                'predictions': self._generate_predictions(df),
                'recommendations': self._generate_recommendations(df),
                'risk_assessment': self._assess_risks(df),
                'correlations': self._analyze_correlations(df),
                'anomalies': self._detect_anomalies(df),
                'trends': self._analyze_trends(df)
            }
            
            print(f"[Python] Analysis completed successfully")
            return analysis_results
            
        except Exception as e:
            error_msg = f"Analysis failed: {str(e)}"
            print(f"[Python] ERROR: {error_msg}")
            return self._create_error_response(error_msg)
    
    def _assess_data_quality(self, df):
        """Comprehensive data quality assessment"""
        try:
            quality_metrics = {
                'completeness': {},
                'accuracy': {},
                'consistency': {},
                'timeliness': {},
                'validity': {},
                'uniqueness': {},
                'overall_score': 0
            }
            
            # Completeness
            for col in df.columns:
                non_null_count = df[col].notna().sum()
                quality_metrics['completeness'][col] = non_null_count / len(df)
            
            # Accuracy (type consistency)
            for col in df.columns:
                if df[col].dtype in ['int64', 'float64']:
                    quality_metrics['accuracy'][col] = 1.0  # Assume numeric columns are accurate
                else:
                    quality_metrics['accuracy'][col] = 0.9  # Default for non-numeric
            
            # Consistency
            for col in df.columns:
                if df[col].dtype in ['int64', 'float64']:
                    # Check for outliers using IQR
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = ((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum()
                    quality_metrics['consistency'][col] = 1 - (outliers / len(df))
                else:
                    quality_metrics['consistency'][col] = 0.95
            
            # Calculate overall score
            completeness_avg = np.mean(list(quality_metrics['completeness'].values()))
            accuracy_avg = np.mean(list(quality_metrics['accuracy'].values()))
            consistency_avg = np.mean(list(quality_metrics['consistency'].values()))
            
            quality_metrics['overall_score'] = (completeness_avg + accuracy_avg + consistency_avg) / 3
            
            return quality_metrics
            
        except Exception as e:
            print(f"[Python] Data quality assessment error: {e}")
            return {'overall_score': 0.8, 'error': str(e)}
    
    def _generate_profiling_report(self, df):
        """Generate comprehensive profiling report using available libraries"""
        profiling_results = {
            'library_used': None,
            'report_generated': False,
            'summary_stats': {},
            'correlations': {},
            'missing_values': {},
            'data_types': {},
            'descriptive_stats': {}
        }
        
        try:
            # Use ydata_profiling if available
            if 'ydata_profiling' in self.profiling_libraries:
                profiling_results['library_used'] = 'ydata_profiling'
                profile = yp.ProfileReport(df, title="Financial Data Profile", explorative=True)
                profiling_results['report_generated'] = True
                
                # Extract key statistics
                profiling_results['summary_stats'] = profile.get_description()
                profiling_results['missing_values'] = df.isnull().sum().to_dict()
                profiling_results['data_types'] = df.dtypes.astype(str).to_dict()
                
            elif 'pandas_profiling' in self.profiling_libraries:
                profiling_results['library_used'] = 'pandas_profiling'
                profile = pp.ProfileReport(df, title="Financial Data Profile")
                profiling_results['report_generated'] = True
                
                # Extract key statistics
                profiling_results['summary_stats'] = profile.get_description()
                profiling_results['missing_values'] = df.isnull().sum().to_dict()
                profiling_results['data_types'] = df.dtypes.astype(str).to_dict()
            
            # Fallback to basic pandas profiling
            if not profiling_results['report_generated']:
                profiling_results['library_used'] = 'pandas_basic'
                profiling_results['descriptive_stats'] = df.describe().to_dict()
                profiling_results['missing_values'] = df.isnull().sum().to_dict()
                profiling_results['data_types'] = df.dtypes.astype(str).to_dict()
                profiling_results['correlations'] = df.corr().to_dict() if df.select_dtypes(include=[np.number]).shape[1] > 1 else {}
                
                except Exception as e:
            print(f"[Python] Profiling error: {e}")
            profiling_results['error'] = str(e)
        
        return profiling_results
    
    def _extract_financial_metrics(self, df):
        """Extract comprehensive financial metrics"""
        try:
            metrics = {}
            
            # Find numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                metrics[col] = {
                    'count': df[col].count(),
                    'sum': df[col].sum(),
                    'mean': df[col].mean(),
                    'median': df[col].median(),
                    'std': df[col].std(),
                    'min': df[col].min(),
                    'max': df[col].max(),
                    'q25': df[col].quantile(0.25),
                    'q75': df[col].quantile(0.75),
                    'skewness': df[col].skew(),
                    'kurtosis': df[col].kurtosis()
                }
            
            return metrics
            
        except Exception as e:
            print(f"[Python] Financial metrics extraction error: {e}")
            return {}
    
    def _generate_smart_labels(self, df):
        """Generate smart column labels based on content analysis"""
        try:
            labels = {}
            
            for col in df.columns:
                # Analyze column content
                sample_values = df[col].dropna().head(10).astype(str)
                
                # Detect common patterns
                if any('amount' in col.lower() or 'price' in col.lower() or 'cost' in col.lower() for col in [col]):
                    labels[col] = 'Financial Amount'
                elif any('date' in col.lower() or 'time' in col.lower() for col in [col]):
                    labels[col] = 'Date/Time'
                elif df[col].dtype in ['int64', 'float64']:
                    labels[col] = 'Numeric Metric'
                else:
                    labels[col] = 'Categorical Data'
            
            return labels
            
        except Exception as e:
            print(f"[Python] Smart labels generation error: {e}")
            return {}
    
    def _generate_enhanced_labels(self, df):
        """Generate enhanced labels with confidence scores"""
        try:
            enhanced_labels = {}
            
            for col in df.columns:
                confidence = 0.8  # Base confidence
                
                # Enhance confidence based on data characteristics
                if df[col].dtype in ['int64', 'float64']:
                    confidence += 0.1
                
                if df[col].notna().sum() / len(df) > 0.9:
                    confidence += 0.1
                
                enhanced_labels[col] = {
                    'label': self._generate_smart_labels(df).get(col, 'Unknown'),
                    'confidence': min(confidence, 1.0),
                    'data_type': str(df[col].dtype),
                    'unique_values': df[col].nunique(),
                    'missing_percentage': (df[col].isna().sum() / len(df)) * 100
                }
            
            return enhanced_labels
            
        except Exception as e:
            print(f"[Python] Enhanced labels generation error: {e}")
            return {}
    
    def _generate_narratives(self, df):
        """Generate natural language narratives about the data"""
        try:
            narratives = []
            
            # Basic data overview
            narratives.append(f"Dataset contains {len(df)} records with {len(df.columns)} columns")
            
            # Missing data narrative
            missing_data = df.isnull().sum().sum()
            if missing_data > 0:
                narratives.append(f"Found {missing_data} missing values across the dataset")
            
            # Numeric columns narrative
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                narratives.append(f"Identified {len(numeric_cols)} numeric columns for analysis")
            
            return narratives
            
        except Exception as e:
            print(f"[Python] Narrative generation error: {e}")
            return ["Unable to generate narratives due to processing error"]
    
    def _extract_facts(self, df):
        """Extract key facts about the data"""
        try:
            facts = {
                'total_records': len(df),
                'total_columns': len(df.columns),
                'numeric_columns': len(df.select_dtypes(include=[np.number]).columns),
                'categorical_columns': len(df.select_dtypes(include=['object']).columns),
                'missing_values_total': df.isnull().sum().sum(),
                'duplicate_rows': df.duplicated().sum()
            }
            
            return {'facts': [f"{k.replace('_', ' ').title()}: {v}" for k, v in facts.items()]}
            
        except Exception as e:
            print(f"[Python] Facts extraction error: {e}")
            return {'facts': []}
    
    def _generate_predictions(self, df):
        """Generate basic predictions based on data patterns"""
        try:
            predictions = {}
            
            # Simple trend predictions for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                if len(df[col].dropna()) > 10:
                    # Simple linear trend
                    x = np.arange(len(df[col].dropna()))
                    y = df[col].dropna().values
                    
                    if len(x) > 1:
                        slope = np.polyfit(x, y, 1)[0]
                        predictions[col] = {
                            'trend_direction': 'increasing' if slope > 0 else 'decreasing',
                            'trend_strength': abs(slope),
                            'prediction_confidence': 0.7
                        }
            
            return predictions
            
        except Exception as e:
            print(f"[Python] Predictions generation error: {e}")
            return {}
    
    def _generate_recommendations(self, df):
        """Generate actionable recommendations"""
        try:
            recommendations = []
            
            # Data quality recommendations
            missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_percentage > 10:
                recommendations.append("Consider data cleaning to address missing values")
            
            # Volume recommendations
            if len(df) > 1000:
                recommendations.append("Large dataset detected - consider sampling for faster analysis")
            
            # Column recommendations
            if len(df.columns) > 20:
                recommendations.append("High-dimensional data - consider feature selection")
            
            return recommendations

    except Exception as e:
            print(f"[Python] Recommendations generation error: {e}")
            return ["Unable to generate recommendations due to processing error"]
    
    def _assess_risks(self, df):
        """Assess data quality and business risks"""
        try:
            risks = {
                'data_quality_risks': [],
                'business_risks': [],
                'overall_risk_score': 0
            }
            
            # Data quality risks
            missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_percentage > 20:
                risks['data_quality_risks'].append("High percentage of missing data")
                risks['overall_risk_score'] += 30
            
            # Duplicate risks
            duplicate_percentage = (df.duplicated().sum() / len(df)) * 100
            if duplicate_percentage > 5:
                risks['data_quality_risks'].append("Significant duplicate records detected")
                risks['overall_risk_score'] += 20
            
            return risks
            
        except Exception as e:
            print(f"[Python] Risk assessment error: {e}")
            return {'overall_risk_score': 50, 'error': str(e)}
    
    def _analyze_correlations(self, df):
        """Analyze correlations between numeric columns"""
        try:
            numeric_df = df.select_dtypes(include=[np.number])
            if numeric_df.shape[1] > 1:
                corr_matrix = numeric_df.corr()
                return corr_matrix.to_dict()
            else:
                return {}
        except Exception as e:
            print(f"[Python] Correlation analysis error: {e}")
            return {}
    
    def _detect_anomalies(self, df):
        """Detect anomalies in numeric columns"""
        try:
            anomalies = {}
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                
                outliers = df[(df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))]
                
                if len(outliers) > 0:
                    anomalies[col] = {
                        'count': len(outliers),
                        'percentage': (len(outliers) / len(df)) * 100,
                        'values': outliers[col].tolist()[:10]  # First 10 outliers
                    }
            
            return anomalies
            
        except Exception as e:
            print(f"[Python] Anomaly detection error: {e}")
            return {}
    
    def _analyze_trends(self, df):
        """Analyze trends in numeric columns"""
        try:
            trends = {}
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                if len(df[col].dropna()) > 10:
                    values = df[col].dropna().values
                    x = np.arange(len(values))
                    
                    if len(x) > 1:
                        slope = np.polyfit(x, values, 1)[0]
                        trends[col] = {
                            'direction': 'increasing' if slope > 0 else 'decreasing',
                            'slope': slope,
                            'strength': abs(slope)
                        }
            
            return trends
            
        except Exception as e:
            print(f"[Python] Trend analysis error: {e}")
            return {}
    
    def _create_error_response(self, error_message):
        """Create standardized error response"""
        return {
            'error': True,
            'error_message': error_message,
            'metadata': {
                'records_analyzed': 0,
                'columns_analyzed': 0,
                'analysis_timestamp': datetime.now().isoformat(),
                'profiling_libraries': list(self.profiling_libraries.keys())
            },
            'data_quality': {'overall_score': 0},
            'profiling_results': {'report_generated': False},
            'financial_metrics': {},
            'smart_labels': {},
            'enhanced_labels': {},
            'narratives': [f"Analysis failed: {error_message}"],
            'facts': {'facts': []},
            'predictions': {},
            'recommendations': ["Please check your data and try again"],
            'risk_assessment': {'overall_risk_score': 100},
            'correlations': {},
            'anomalies': {},
            'trends': {}
        }

# Global analyzer instance
analyzer = EnhancedFinancialAnalyzer()

def run_financial_analysis(columns, data, user_id=1, role='executive'):
    """
    Main entry point for financial analysis
    """
    return analyzer.analyze_financial_data(columns, data, user_id, role)

if __name__ == "__main__":
    # Test the analyzer
    test_data = [
        {'amount': 100, 'date': '2023-01-01', 'category': 'income'},
        {'amount': -50, 'date': '2023-01-02', 'category': 'expense'},
        {'amount': 200, 'date': '2023-01-03', 'category': 'income'}
    ]
    
    result = run_financial_analysis(['amount', 'date', 'category'], test_data)
    print(json.dumps(result, indent=2, default=str)) 