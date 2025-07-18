-- Migration: Create advanced analysis tables
-- Date: 2024-01-15
-- Description: Create tables for advanced data analysis, visualizations, and narratives

-- Create advanced_analysis_results table
CREATE TABLE IF NOT EXISTS advanced_analysis_results (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,
    data_profile JSONB,
    analysis_results JSONB,
    visualizations JSONB,
    narrative JSONB,
    analysis_depth VARCHAR(20) DEFAULT 'comprehensive',
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    processing_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analysis_jobs table for tracking job status
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    domain VARCHAR(50),
    analysis_depth VARCHAR(20),
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_sources table for tracking data connections
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'file', 'database', 'api'
    connection_config JSONB,
    last_analyzed TIMESTAMP,
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create insights table for storing individual insights
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES advanced_analysis_results(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    insight_text TEXT NOT NULL,
    confidence DECIMAL(3,2),
    impact VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recommendations table for storing actionable recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES advanced_analysis_results(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    recommendation_text TEXT NOT NULL,
    priority VARCHAR(20),
    effort VARCHAR(20),
    expected_impact VARCHAR(20),
    timeline VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create risks table for storing risk assessments
CREATE TABLE IF NOT EXISTS risks (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES advanced_analysis_results(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    risk_text TEXT NOT NULL,
    severity VARCHAR(20),
    probability VARCHAR(20),
    mitigation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create visualizations table for storing chart configurations
CREATE TABLE IF NOT EXISTS visualizations (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES advanced_analysis_results(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    chart_config JSONB NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    insight_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create external_insights table for storing market context
CREATE TABLE IF NOT EXISTS external_insights (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES advanced_analysis_results(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    summary TEXT,
    impact_description TEXT,
    relevance_score DECIMAL(3,2),
    url TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advanced_analysis_results_tenant_id ON advanced_analysis_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_advanced_analysis_results_user_id ON advanced_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_analysis_results_domain ON advanced_analysis_results(domain);
CREATE INDEX IF NOT EXISTS idx_advanced_analysis_results_created_at ON advanced_analysis_results(created_at);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_tenant_id ON analysis_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_job_id ON analysis_jobs(job_id);

CREATE INDEX IF NOT EXISTS idx_data_sources_tenant_id ON data_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);

CREATE INDEX IF NOT EXISTS idx_insights_analysis_id ON insights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_insights_category ON insights(category);

CREATE INDEX IF NOT EXISTS idx_recommendations_analysis_id ON recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);

CREATE INDEX IF NOT EXISTS idx_risks_analysis_id ON risks(analysis_id);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);

CREATE INDEX IF NOT EXISTS idx_visualizations_analysis_id ON visualizations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_chart_type ON visualizations(chart_type);

CREATE INDEX IF NOT EXISTS idx_external_insights_analysis_id ON external_insights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_external_insights_source ON external_insights(source);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_advanced_analysis_results_updated_at 
    BEFORE UPDATE ON advanced_analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON data_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE advanced_analysis_results IS 'Stores comprehensive analysis results including data profiles, visualizations, and narratives';
COMMENT ON TABLE analysis_jobs IS 'Tracks the status and progress of analysis jobs';
COMMENT ON TABLE data_sources IS 'Stores information about connected data sources';
COMMENT ON TABLE insights IS 'Individual insights extracted from analysis';
COMMENT ON TABLE recommendations IS 'Actionable recommendations based on analysis';
COMMENT ON TABLE risks IS 'Risk assessments identified during analysis';
COMMENT ON TABLE visualizations IS 'Chart configurations and metadata';
COMMENT ON TABLE external_insights IS 'External market context and insights'; 