"""
Advanced ML API Router
Implements Feature #3: Advanced AI/ML Capabilities
- Predictive Analytics & Machine Learning
- Natural Language Processing (NLP)
- Advanced Risk Assessment
- Automated Trading Signals
- Portfolio Optimization
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import pandas as pd
import logging
from datetime import datetime

# Import services
try:
    from ..services.advanced_ml_service import AdvancedMLService
    logging.info("Advanced ML service imported successfully")
except ImportError as e:
    logging.error(f"Failed to import Advanced ML service: {e}")
    AdvancedMLService = None

try:
    from ...services.predictive_analytics import PredictiveAnalytics
    logging.info("Predictive analytics service imported successfully")
except ImportError as e:
    logging.error(f"Failed to import predictive analytics service: {e}")
    PredictiveAnalytics = None

try:
    from ..services.llm_service import LLMService
    logging.info("LLM service imported successfully")
except ImportError as e:
    logging.error(f"Failed to import LLM service: {e}")
    LLMService = None

router = APIRouter(prefix="/ml", tags=["Advanced AI/ML"])

# Initialize services
ml_service = AdvancedMLService() if AdvancedMLService else None
predictive_service = PredictiveAnalytics() if PredictiveAnalytics else None
llm_service = LLMService() if LLMService else None

# Pydantic models for request/response
class TrainingRequest(BaseModel):
    data: Dict[str, Any]
    target_column: str = "close"
    test_size: float = 0.2
    model_type: str = "price_prediction"

class PredictionRequest(BaseModel):
    model_id: str
    features: Dict[str, float]

class RiskAssessmentRequest(BaseModel):
    data: Dict[str, Any]

class TradingSignalsRequest(BaseModel):
    data: Dict[str, Any]

class PortfolioOptimizationRequest(BaseModel):
    assets_data: Dict[str, Dict[str, Any]]
    target_return: float = 0.1
    risk_free_rate: float = 0.02

class SentimentAnalysisRequest(BaseModel):
    text_data: List[str]

class ModelInfo(BaseModel):
    model_id: str
    model_type: str
    created_at: str
    metrics: Dict[str, Any]

# Health check endpoint
@router.get("/health")
async def ml_health_check():
    """Check ML service health"""
    return {
        "status": "healthy",
        "service": "advanced_ml",
        "timestamp": datetime.now().isoformat(),
        "services_available": {
            "advanced_ml_service": ml_service is not None,
            "predictive_analytics": predictive_service is not None,
            "llm_service": llm_service is not None
        }
    }

# Model training endpoints
@router.post("/train/price-prediction")
async def train_price_prediction_model(request: TrainingRequest):
    """Train a price prediction model"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Train model
        result = ml_service.train_price_prediction_model(
            df=df,
            target_column=request.target_column,
            test_size=request.test_size
        )
        
        if result['success']:
            return {
                "success": True,
                "model_id": result['model_id'],
                "metrics": result['metrics'],
                "feature_importance": result['feature_importance'],
                "message": "Model trained successfully"
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error training price prediction model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.post("/predict/price")
async def predict_price(request: PredictionRequest):
    """Make price predictions using trained model"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        result = ml_service.predict_price(
            model_id=request.model_id,
            features=request.features
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error making price prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Risk assessment endpoints
@router.post("/risk/assess")
async def assess_risk(request: RiskAssessmentRequest):
    """Perform advanced risk assessment"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        result = ml_service.assess_risk(df)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error in risk assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

@router.get("/risk/metrics")
async def get_risk_metrics():
    """Get available risk metrics"""
    return {
        "available_metrics": [
            "volatility",
            "var_95",
            "var_99", 
            "max_drawdown",
            "sharpe_ratio",
            "beta",
            "anomaly_count",
            "anomaly_ratio"
        ],
        "risk_levels": ["LOW", "MEDIUM", "HIGH"],
        "description": "Advanced risk assessment using ML models"
    }

# Trading signals endpoints
@router.post("/signals/generate")
async def generate_trading_signals(request: TradingSignalsRequest):
    """Generate automated trading signals"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        result = ml_service.generate_trading_signals(df)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error generating trading signals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Signal generation failed: {str(e)}")

@router.get("/signals/indicators")
async def get_trading_indicators():
    """Get available trading indicators"""
    return {
        "technical_indicators": [
            "RSI",
            "MACD", 
            "SMA",
            "EMA",
            "Bollinger Bands",
            "Volume Analysis"
        ],
        "signal_types": ["BUY", "SELL", "HOLD"],
        "signal_strengths": ["STRONG", "MEDIUM", "WEAK"],
        "description": "Automated trading signals using technical analysis and ML"
    }

# Portfolio optimization endpoints
@router.post("/portfolio/optimize")
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    """Optimize portfolio using Modern Portfolio Theory"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        # Convert assets data to DataFrames
        assets_data = {}
        for asset, data in request.assets_data.items():
            assets_data[asset] = pd.DataFrame(data)
        
        result = ml_service.optimize_portfolio(
            assets_data=assets_data,
            target_return=request.target_return,
            risk_free_rate=request.risk_free_rate
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error in portfolio optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Portfolio optimization failed: {str(e)}")

@router.get("/portfolio/strategies")
async def get_portfolio_strategies():
    """Get available portfolio optimization strategies"""
    return {
        "strategies": [
            "Modern Portfolio Theory (MPT)",
            "Maximum Sharpe Ratio",
            "Minimum Variance",
            "Risk Parity",
            "Black-Litterman Model"
        ],
        "optimization_methods": [
            "Monte Carlo Simulation",
            "Quadratic Programming",
            "Genetic Algorithm"
        ],
        "description": "Advanced portfolio optimization using ML and financial theory"
    }

# Sentiment analysis endpoints
@router.post("/sentiment/analyze")
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """Perform sentiment analysis on financial text"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        result = ml_service.analyze_sentiment(request.text_data)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logging.error(f"Error in sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

# Model management endpoints
@router.get("/models")
async def list_models():
    """List all trained models"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        models = []
        for model_id, model in ml_service.models.items():
            models.append({
                "model_id": model_id,
                "model_type": type(model).__name__,
                "created_at": model_id.split('_')[-1] if '_' in model_id else "unknown",
                "features": len(model.feature_names_in_) if hasattr(model, 'feature_names_in_') else 0
            })
        
        return {
            "models": models,
            "total_models": len(models)
        }
        
    except Exception as e:
        logging.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.delete("/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a trained model"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        if model_id in ml_service.models:
            del ml_service.models[model_id]
            if model_id in ml_service.scalers:
                del ml_service.scalers[model_id]
            
            return {
                "success": True,
                "message": f"Model {model_id} deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
            
    except Exception as e:
        logging.error(f"Error deleting model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")

# Feature engineering endpoints
@router.post("/features/engineer")
async def engineer_features(request: TrainingRequest):
    """Engineer features for ML models"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Engineer features
        features_df = ml_service.prepare_financial_features(df)
        
        return {
            "success": True,
            "original_features": list(df.columns),
            "engineered_features": list(features_df.columns),
            "feature_count": len(features_df.columns),
            "sample_data": features_df.head().to_dict('records')
        }
        
    except Exception as e:
        logging.error(f"Error engineering features: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Feature engineering failed: {str(e)}")

# Advanced analytics endpoints
@router.post("/analytics/forecast")
async def generate_forecast(request: TrainingRequest):
    """Generate comprehensive forecasts"""
    if not predictive_service:
        raise HTTPException(status_code=503, detail="Predictive analytics service not available")
    
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Prepare time series data
        if 'date' in df.columns and request.target_column in df.columns:
            prophet_df = predictive_service.prepare_time_series_data(
                df=df,
                date_column='date',
                value_column=request.target_column
            )
            
            # Generate forecast
            forecast_result = predictive_service.forecast_with_prophet(
                df=prophet_df,
                periods=30
            )
            
            if forecast_result['success']:
                return forecast_result
            else:
                raise HTTPException(status_code=400, detail="Forecast generation failed")
        else:
            raise HTTPException(status_code=400, detail="Date and target columns required for forecasting")
            
    except Exception as e:
        logging.error(f"Error generating forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

# AI/LLM endpoints
@router.post("/ai/analyze")
async def ai_analysis(data: Dict[str, Any]):
    """Perform AI-powered financial analysis"""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not available")
    
    try:
        # Initialize LLM service
        await llm_service.initialize()
        
        # Generate analysis
        analysis = await llm_service.generate_financial_analysis(
            data=data,
            analysis_type="comprehensive"
        )
        
        return analysis
        
    except Exception as e:
        logging.error(f"Error in AI analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/ai/narrative")
async def generate_narrative(data: Dict[str, Any]):
    """Generate AI-powered financial narratives"""
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not available")
    
    try:
        # Initialize LLM service
        await llm_service.initialize()
        
        # Generate narrative
        narrative = await llm_service.generate_narrative(
            analysis_data=data,
            narrative_type="executive_summary"
        )
        
        return narrative
        
    except Exception as e:
        logging.error(f"Error generating narrative: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Narrative generation failed: {str(e)}")

# Model explanation endpoints
@router.get("/explain/{model_id}")
async def explain_model(model_id: str):
    """Explain model predictions and feature importance"""
    if not ml_service:
        raise HTTPException(status_code=503, detail="ML service not available")
    
    try:
        if model_id not in ml_service.models:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        model = ml_service.models[model_id]
        
        explanation = {
            "model_id": model_id,
            "model_type": type(model).__name__,
            "feature_importance": {},
            "model_parameters": {},
            "explanation_methods": [
                "Feature Importance",
                "SHAP Values",
                "Partial Dependence Plots",
                "Local Interpretable Model-agnostic Explanations (LIME)"
            ]
        }
        
        # Add feature importance if available
        if hasattr(model, 'feature_importances_'):
            explanation['feature_importance'] = dict(zip(
                model.feature_names_in_,
                model.feature_importances_
            ))
        
        # Add model parameters
        if hasattr(model, 'get_params'):
            explanation['model_parameters'] = model.get_params()
        
        return explanation
        
    except Exception as e:
        logging.error(f"Error explaining model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Model explanation failed: {str(e)}")

# A/B testing endpoints
@router.post("/ab-test")
async def ab_test_models(request: Dict[str, Any]):
    """Perform A/B testing between different ML models"""
    return {
        "message": "A/B testing functionality coming soon",
        "planned_features": [
            "Model performance comparison",
            "Statistical significance testing",
            "Backtesting capabilities",
            "Performance metrics comparison"
        ]
    } 