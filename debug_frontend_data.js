// Simple test to debug frontend data
const testFrontendData = async () => {
  try {
    console.log('🧪 Testing Frontend Data Debug');
    
    // 1. Create a test job
    const createResponse = await fetch('http://localhost:8000/financial/test-job', {
      method: 'POST'
    });
    
    if (!createResponse.ok) {
      console.error('❌ Failed to create test job:', createResponse.status);
      return;
    }
    
    const jobData = await createResponse.json();
    const jobId = jobData.job_id;
    console.log('✅ Created job:', jobId);
    
    // 2. Get insights
    const insightsResponse = await fetch(`http://localhost:8000/financial/insights/${jobId}`);
    
    if (!insightsResponse.ok) {
      console.error('❌ Failed to get insights:', insightsResponse.status);
      return;
    }
    
    const insights = await insightsResponse.json();
    console.log('✅ Insights received:', insights);
    
    // 3. Test data extraction (like frontend does)
    const financialKPIs = insights.financial_kpis || {};
    const mlPrompts = insights.ml_prompts || [];
    const riskAssessment = insights.risk_assessment || {};
    const recommendations = insights.recommendations || [];
    const aiAnalysis = insights.ai_analysis || {};
    const marketContext = insights.market_context || {};
    const statisticalAnalysis = insights.statistical_analysis || {};
    
    console.log('\n📊 Data Extraction Results:');
    console.log('Financial KPIs:', financialKPIs);
    console.log('ML Prompts:', mlPrompts);
    console.log('Risk Assessment:', riskAssessment);
    console.log('Recommendations:', recommendations);
    console.log('AI Analysis:', aiAnalysis);
    console.log('Market Context:', marketContext);
    console.log('Statistical Analysis:', statisticalAnalysis);
    
    // 4. Test specific values
    console.log('\n🔍 Specific Value Tests:');
    console.log('Revenue Growth:', financialKPIs.revenue_growth);
    console.log('Profit Margin:', financialKPIs.profit_margin);
    console.log('First ML Prompt:', mlPrompts[0]);
    console.log('Risk Score:', riskAssessment.risk_score);
    console.log('First Recommendation:', recommendations[0]);
    console.log('AI Analysis Text:', aiAnalysis.analysis);
    console.log('Industry Trends:', marketContext.industry_trends);
    
    // 5. Check if data is properly structured for frontend
    const frontendData = {
      domain: 'finance',
      timestamp: new Date().toISOString(),
      status: 'completed',
      financial_kpis: financialKPIs,
      ml_prompts: mlPrompts,
      risk_assessment: riskAssessment,
      recommendations: recommendations,
      ai_analysis: aiAnalysis,
      market_context: marketContext,
      statistical_analysis: statisticalAnalysis
    };
    
    console.log('\n🎯 Frontend Data Structure:');
    console.log('Frontend Data:', frontendData);
    
    // 6. Test Dashboard extraction
    const dashboardKPIs = frontendData.financial_kpis || {};
    const dashboardPrompts = frontendData.ml_prompts || [];
    const dashboardRisks = frontendData.risk_assessment || {};
    const dashboardRecs = frontendData.recommendations || [];
    
    console.log('\n📋 Dashboard Extraction:');
    console.log('Dashboard KPIs:', dashboardKPIs);
    console.log('Dashboard Prompts:', dashboardPrompts);
    console.log('Dashboard Risks:', dashboardRisks);
    console.log('Dashboard Recommendations:', dashboardRecs);
    
    // 7. Check for N/A values
    console.log('\n❓ N/A Check:');
    const kpiValues = Object.values(dashboardKPIs);
    const hasNA = kpiValues.some(value => value === 'N/A' || value === null || value === undefined);
    console.log('Has N/A values:', hasNA);
    console.log('KPI Values:', kpiValues);
    
  } catch (error) {
    console.error('❌ Error in frontend data test:', error);
  }
};

// Run the test
testFrontendData(); 