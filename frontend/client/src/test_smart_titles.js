// Test script for smart recommendation title generation
const sampleRecommendations = [
  "Continue focus on revenue growth initiatives while maintaining quality standards",
  "Implement advanced analytics and reporting systems for enhanced decision-making",
  "Develop comprehensive contingency plans for identified risk factors",
  "Consider strategic partnerships or acquisitions to accelerate growth",
  "Invest in technology infrastructure to support scaling operations",
  "Expand market presence in high-growth segments",
  "Optimize operational efficiency through process improvements",
  "Develop comprehensive risk management strategies"
];

// Smart title generation function (copied from Dashboard.jsx)
const generateRecommendationTitle = (recommendation) => {
  const text = recommendation.toLowerCase();
  
  // Define keyword patterns and their corresponding titles
  const patterns = [
    { keywords: ['revenue', 'growth', 'sales'], title: 'Revenue Growth Strategy' },
    { keywords: ['profit', 'margin', 'profitability'], title: 'Profitability Optimization' },
    { keywords: ['cost', 'expense', 'optimization'], title: 'Cost Optimization' },
    { keywords: ['cash', 'flow', 'liquidity'], title: 'Cash Flow Management' },
    { keywords: ['market', 'expansion', 'diversification'], title: 'Market Expansion' },
    { keywords: ['technology', 'digital', 'automation'], title: 'Technology Investment' },
    { keywords: ['risk', 'management', 'mitigation'], title: 'Risk Management' },
    { keywords: ['operational', 'efficiency', 'process'], title: 'Operational Efficiency' },
    { keywords: ['talent', 'human', 'capital', 'development'], title: 'Talent Development' },
    { keywords: ['partnership', 'acquisition', 'merger'], title: 'Strategic Partnerships' },
    { keywords: ['analytics', 'reporting', 'data'], title: 'Analytics Enhancement' },
    { keywords: ['quality', 'standards', 'maintain'], title: 'Quality Standards' },
    { keywords: ['contingency', 'plan', 'backup'], title: 'Contingency Planning' },
    { keywords: ['infrastructure', 'scaling', 'capacity'], title: 'Infrastructure Scaling' },
    { keywords: ['competitive', 'position', 'advantage'], title: 'Competitive Positioning' },
    { keywords: ['investment', 'capital', 'funding'], title: 'Investment Strategy' },
    { keywords: ['compliance', 'regulatory', 'legal'], title: 'Compliance Management' },
    { keywords: ['supply', 'chain', 'logistics'], title: 'Supply Chain Optimization' },
    { keywords: ['customer', 'service', 'experience'], title: 'Customer Experience' },
    { keywords: ['innovation', 'research', 'development'], title: 'Innovation Strategy' }
  ];
  
  // Find matching pattern
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => text.includes(keyword))) {
      return pattern.title;
    }
  }
  
  // Fallback: extract first meaningful phrase
  const words = recommendation.split(' ').slice(0, 4);
  return words.join(' ').replace(/[^\w\s]/g, '') + ' Strategy';
};

// Test the smart title generation
console.log('Testing Smart Recommendation Title Generation...\n');

sampleRecommendations.forEach((recommendation, index) => {
  const title = generateRecommendationTitle(recommendation);
  console.log(`Recommendation ${index + 1}:`);
  console.log(`Original: "${recommendation}"`);
  console.log(`Smart Title: "${title}"`);
  console.log('');
});

console.log('Smart title generation test completed!'); 