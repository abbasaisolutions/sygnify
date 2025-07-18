import pandas as pd
import numpy as np
import json
from typing import Dict, List, Any, Tuple
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntelligentVisualization:
    def __init__(self):
        self.chart_types = {
            'temporal_trend': ['line', 'area', 'bar'],
            'distribution': ['histogram', 'box', 'violin', 'density'],
            'comparison': ['bar', 'column', 'grouped_bar', 'stacked_bar'],
            'correlation': ['scatter', 'heatmap', 'bubble'],
            'composition': ['pie', 'donut', 'stacked_area', 'treemap'],
            'geographic': ['choropleth', 'scatter_map', 'bubble_map'],
            'hierarchical': ['treemap', 'sunburst', 'sankey'],
            'anomaly': ['line_with_anomalies', 'box_with_outliers']
        }
        
        self.domain_visualizations = {
            'advertising': {
                'key_metrics': ['ctr', 'cpc', 'roas', 'conversion_rate'],
                'preferred_charts': ['line', 'bar', 'scatter'],
                'insights': ['campaign_performance', 'audience_segmentation', 'channel_efficiency']
            },
            'finance': {
                'key_metrics': ['revenue', 'profit', 'cash_flow', 'roi'],
                'preferred_charts': ['line', 'area', 'waterfall'],
                'insights': ['trend_analysis', 'variance_analysis', 'forecasting']
            },
            'supply_chain': {
                'key_metrics': ['lead_time', 'inventory', 'demand', 'efficiency'],
                'preferred_charts': ['line', 'bar', 'heatmap'],
                'insights': ['supplier_performance', 'demand_forecasting', 'optimization']
            },
            'hr': {
                'key_metrics': ['turnover', 'satisfaction', 'productivity'],
                'preferred_charts': ['bar', 'line', 'scatter'],
                'insights': ['employee_analytics', 'retention_analysis', 'performance_tracking']
            },
            'operations': {
                'key_metrics': ['production', 'downtime', 'quality', 'efficiency'],
                'preferred_charts': ['line', 'bar', 'heatmap'],
                'insights': ['performance_monitoring', 'optimization', 'quality_control']
            }
        }
    
    def generate_visualization_plan(self, data_profile: Dict[str, Any], domain: str) -> Dict[str, Any]:
        """Generate intelligent visualization plan based on data profile and domain"""
        plan = {
            'primary_charts': self._identify_primary_charts(data_profile, domain),
            'secondary_charts': self._identify_secondary_charts(data_profile, domain),
            'insights_visualizations': self._generate_insights_visualizations(data_profile, domain),
            'recommendations': self._generate_visualization_recommendations(data_profile, domain)
        }
        return plan
    
    def _identify_primary_charts(self, data_profile: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Identify the most important charts for the dataset"""
        primary_charts = []
        structure = data_profile['structure']
        
        # Time series analysis
        if structure['temporal_columns']:
            temporal_col = structure['temporal_columns'][0]
            numerical_cols = structure['numerical_columns'][:3]  # Top 3 numerical columns
            
            for num_col in numerical_cols:
                primary_charts.append({
                    'type': 'line',
                    'title': f'{num_col} Over Time',
                    'description': f'Trend analysis of {num_col} across time periods',
                    'x_axis': temporal_col,
                    'y_axis': num_col,
                    'priority': 'high',
                    'insight_type': 'trend_analysis'
                })
        
        # Distribution analysis
        if structure['numerical_columns']:
            for num_col in structure['numerical_columns'][:2]:
                primary_charts.append({
                    'type': 'histogram',
                    'title': f'{num_col} Distribution',
                    'description': f'Distribution analysis of {num_col}',
                    'x_axis': num_col,
                    'y_axis': 'frequency',
                    'priority': 'high',
                    'insight_type': 'distribution_analysis'
                })
        
        # Correlation analysis
        if len(structure['numerical_columns']) >= 2:
            corr_data = structure['correlations']
            if corr_data.get('high_correlations'):
                for corr in corr_data['high_correlations'][:2]:
                    primary_charts.append({
                        'type': 'scatter',
                        'title': f'{corr["col1"]} vs {corr["col2"]}',
                        'description': f'Correlation analysis between {corr["col1"]} and {corr["col2"]}',
                        'x_axis': corr['col1'],
                        'y_axis': corr['col2'],
                        'priority': 'high',
                        'insight_type': 'correlation_analysis'
                    })
        
        return primary_charts
    
    def _identify_secondary_charts(self, data_profile: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Identify secondary charts for deeper analysis"""
        secondary_charts = []
        structure = data_profile['structure']
        
        # Categorical analysis
        if structure['categorical_columns']:
            for cat_col in structure['categorical_columns'][:2]:
                if structure['numerical_columns']:
                    num_col = structure['numerical_columns'][0]
                    secondary_charts.append({
                        'type': 'bar',
                        'title': f'{num_col} by {cat_col}',
                        'description': f'Comparison of {num_col} across {cat_col} categories',
                        'x_axis': cat_col,
                        'y_axis': num_col,
                        'priority': 'medium',
                        'insight_type': 'categorical_analysis'
                    })
        
        # Anomaly visualization
        if structure['anomalies']:
            for col, anomaly_data in structure['anomalies'].items():
                if anomaly_data['outlier_percentage'] > 5:
                    secondary_charts.append({
                        'type': 'box',
                        'title': f'{col} with Outliers',
                        'description': f'Box plot showing outliers in {col}',
                        'x_axis': col,
                        'y_axis': col,
                        'priority': 'medium',
                        'insight_type': 'anomaly_detection'
                    })
        
        # Geographic visualization
        if structure['geographic_columns']:
            geo_col = structure['geographic_columns'][0]
            if structure['numerical_columns']:
                num_col = structure['numerical_columns'][0]
                secondary_charts.append({
                    'type': 'choropleth',
                    'title': f'{num_col} by {geo_col}',
                    'description': f'Geographic distribution of {num_col}',
                    'x_axis': geo_col,
                    'y_axis': num_col,
                    'priority': 'medium',
                    'insight_type': 'geographic_analysis'
                })
        
        return secondary_charts
    
    def _generate_insights_visualizations(self, data_profile: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate visualizations specifically for insights"""
        insights_viz = []
        structure = data_profile['structure']
        
        # Domain-specific insights
        if domain in self.domain_visualizations:
            domain_config = self.domain_visualizations[domain]
            
            # Key metrics dashboard
            key_metrics = [col for col in domain_config['key_metrics'] if col in structure['columns']]
            if key_metrics:
                insights_viz.append({
                    'type': 'metric_cards',
                    'title': f'{domain.title()} Key Metrics',
                    'description': f'Key performance indicators for {domain}',
                    'metrics': key_metrics,
                    'priority': 'high',
                    'insight_type': 'kpi_dashboard'
                })
            
            # Performance comparison
            if len(structure['numerical_columns']) >= 2:
                insights_viz.append({
                    'type': 'radar',
                    'title': f'{domain.title()} Performance Radar',
                    'description': f'Multi-dimensional performance analysis',
                    'metrics': structure['numerical_columns'][:5],
                    'priority': 'medium',
                    'insight_type': 'performance_analysis'
                })
        
        # Trend analysis
        if structure['temporal_columns'] and structure['numerical_columns']:
            insights_viz.append({
                'type': 'area',
                'title': 'Trend Analysis',
                'description': 'Cumulative trend analysis over time',
                'x_axis': structure['temporal_columns'][0],
                'y_axis': structure['numerical_columns'][0],
                'priority': 'high',
                'insight_type': 'trend_analysis'
            })
        
        return insights_viz
    
    def _generate_visualization_recommendations(self, data_profile: Dict[str, Any], domain: str) -> List[str]:
        """Generate recommendations for visualization improvements"""
        recommendations = []
        structure = data_profile['structure']
        
        # Data quality recommendations
        if structure['missing_values']:
            missing_count = sum(1 for v in structure['missing_values'].values() if v > 0)
            if missing_count > 0:
                recommendations.append(f"Consider data imputation for {missing_count} columns with missing values")
        
        # Chart type recommendations
        if len(structure['numerical_columns']) > 5:
            recommendations.append("Consider using faceted charts to show multiple metrics simultaneously")
        
        if len(structure['categorical_columns']) > 3:
            recommendations.append("Use color coding to distinguish between categorical variables")
        
        # Domain-specific recommendations
        if domain == 'advertising':
            recommendations.append("Include conversion funnel visualization for campaign analysis")
        elif domain == 'finance':
            recommendations.append("Add waterfall charts for profit/loss analysis")
        elif domain == 'supply_chain':
            recommendations.append("Include network diagrams for supplier relationships")
        
        return recommendations
    
    def generate_chart_config(self, chart_spec: Dict[str, Any], data: pd.DataFrame) -> Dict[str, Any]:
        """Generate Chart.js configuration for a given chart specification"""
        chart_type = chart_spec['type']
        x_axis = chart_spec['x_axis']
        y_axis = chart_spec['y_axis']
        
        if chart_type == 'line':
            return self._generate_line_chart_config(data, x_axis, y_axis, chart_spec)
        elif chart_type == 'bar':
            return self._generate_bar_chart_config(data, x_axis, y_axis, chart_spec)
        elif chart_type == 'scatter':
            return self._generate_scatter_chart_config(data, x_axis, y_axis, chart_spec)
        elif chart_type == 'histogram':
            return self._generate_histogram_config(data, x_axis, chart_spec)
        elif chart_type == 'box':
            return self._generate_box_chart_config(data, x_axis, chart_spec)
        else:
            return self._generate_default_chart_config(data, x_axis, y_axis, chart_spec)
    
    def _generate_line_chart_config(self, data: pd.DataFrame, x_axis: str, y_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate line chart configuration"""
        # Sort by x_axis if it's temporal
        if data[x_axis].dtype == 'object':
            try:
                data = data.copy()
                data[x_axis] = pd.to_datetime(data[x_axis])
                data = data.sort_values(x_axis)
            except:
                pass
        
        return {
            'type': 'line',
            'data': {
                'labels': data[x_axis].tolist(),
                'datasets': [{
                    'label': y_axis,
                    'data': data[y_axis].tolist(),
                    'borderColor': 'rgb(75, 192, 192)',
                    'backgroundColor': 'rgba(75, 192, 192, 0.2)',
                    'tension': 0.1
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                },
                'scales': {
                    'x': {
                        'title': {
                            'display': True,
                            'text': x_axis
                        }
                    },
                    'y': {
                        'title': {
                            'display': True,
                            'text': y_axis
                        }
                    }
                }
            }
        }
    
    def _generate_bar_chart_config(self, data: pd.DataFrame, x_axis: str, y_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate bar chart configuration"""
        # Group by x_axis if it's categorical
        if data[x_axis].dtype == 'object':
            grouped_data = data.groupby(x_axis)[y_axis].mean().reset_index()
            labels = grouped_data[x_axis].tolist()
            values = grouped_data[y_axis].tolist()
        else:
            labels = data[x_axis].tolist()
            values = data[y_axis].tolist()
        
        return {
            'type': 'bar',
            'data': {
                'labels': labels,
                'datasets': [{
                    'label': y_axis,
                    'data': values,
                    'backgroundColor': 'rgba(54, 162, 235, 0.8)',
                    'borderColor': 'rgb(54, 162, 235)',
                    'borderWidth': 1
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                },
                'scales': {
                    'x': {
                        'title': {
                            'display': True,
                            'text': x_axis
                        }
                    },
                    'y': {
                        'title': {
                            'display': True,
                            'text': y_axis
                        }
                    }
                }
            }
        }
    
    def _generate_scatter_chart_config(self, data: pd.DataFrame, x_axis: str, y_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate scatter chart configuration"""
        return {
            'type': 'scatter',
            'data': {
                'datasets': [{
                    'label': f'{x_axis} vs {y_axis}',
                    'data': data[[x_axis, y_axis]].values.tolist(),
                    'backgroundColor': 'rgba(255, 99, 132, 0.6)',
                    'borderColor': 'rgb(255, 99, 132)',
                    'pointRadius': 6
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                },
                'scales': {
                    'x': {
                        'title': {
                            'display': True,
                            'text': x_axis
                        }
                    },
                    'y': {
                        'title': {
                            'display': True,
                            'text': y_axis
                        }
                    }
                }
            }
        }
    
    def _generate_histogram_config(self, data: pd.DataFrame, x_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate histogram configuration"""
        # Create histogram data
        hist, bins = np.histogram(data[x_axis].dropna(), bins=20)
        labels = [f"{bins[i]:.2f}-{bins[i+1]:.2f}" for i in range(len(bins)-1)]
        
        return {
            'type': 'bar',
            'data': {
                'labels': labels,
                'datasets': [{
                    'label': f'{x_axis} Distribution',
                    'data': hist.tolist(),
                    'backgroundColor': 'rgba(153, 102, 255, 0.8)',
                    'borderColor': 'rgb(153, 102, 255)',
                    'borderWidth': 1
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                },
                'scales': {
                    'x': {
                        'title': {
                            'display': True,
                            'text': x_axis
                        }
                    },
                    'y': {
                        'title': {
                            'display': True,
                            'text': 'Frequency'
                        }
                    }
                }
            }
        }
    
    def _generate_box_chart_config(self, data: pd.DataFrame, x_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate box chart configuration"""
        # Calculate box plot statistics
        q1 = data[x_axis].quantile(0.25)
        q3 = data[x_axis].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = data[(data[x_axis] < lower_bound) | (data[x_axis] > upper_bound)][x_axis].tolist()
        
        return {
            'type': 'boxplot',
            'data': {
                'labels': [x_axis],
                'datasets': [{
                    'label': x_axis,
                    'data': [{
                        'min': float(data[x_axis].min()),
                        'q1': float(q1),
                        'median': float(data[x_axis].median()),
                        'q3': float(q3),
                        'max': float(data[x_axis].max()),
                        'outliers': outliers
                    }],
                    'backgroundColor': 'rgba(255, 159, 64, 0.8)',
                    'borderColor': 'rgb(255, 159, 64)',
                    'borderWidth': 1
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                }
            }
        }
    
    def _generate_default_chart_config(self, data: pd.DataFrame, x_axis: str, y_axis: str, chart_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Generate default chart configuration"""
        return {
            'type': 'line',
            'data': {
                'labels': data[x_axis].tolist() if x_axis in data.columns else [],
                'datasets': [{
                    'label': y_axis,
                    'data': data[y_axis].tolist() if y_axis in data.columns else [],
                    'borderColor': 'rgb(75, 192, 192)',
                    'backgroundColor': 'rgba(75, 192, 192, 0.2)'
                }]
            },
            'options': {
                'responsive': True,
                'plugins': {
                    'title': {
                        'display': True,
                        'text': chart_spec['title']
                    }
                }
            }
        }

def generate_intelligent_visualizations(data_path: str, domain: str = 'general') -> Dict[str, Any]:
    """Main function to generate intelligent visualizations"""
    try:
        # Import the data comprehension module
        from advancedDataComprehension import analyze_data_comprehension
        
        # Get data profile
        data_profile = analyze_data_comprehension(data_path)
        if 'error' in data_profile:
            return data_profile
        
        # Read data for visualization
        df = pd.read_csv(data_path)
        
        # Generate visualization plan
        viz_generator = IntelligentVisualization()
        plan = viz_generator.generate_visualization_plan(data_profile, domain)
        
        # Generate chart configurations
        chart_configs = {}
        for chart in plan['primary_charts'] + plan['secondary_charts']:
            chart_configs[chart['title']] = viz_generator.generate_chart_config(chart, df)
        
        return {
            'visualization_plan': plan,
            'chart_configurations': chart_configs,
            'data_profile': data_profile
        }
        
    except Exception as e:
        logger.error(f"Visualization generation failed: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import sys
    data_path = sys.argv[1]
    domain = sys.argv[2] if len(sys.argv) > 2 else 'general'
    result = generate_intelligent_visualizations(data_path, domain)
    print(json.dumps(result, indent=2)) 