import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import RetailDashboard from './components/RetailDashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import Login from './components/Login';
import Subscription from './components/Subscription';
import RetailLandingPage from './components/RetailLandingPage';
import ProcessingPage from './components/ProcessingPage';
import RetailTestPage from './components/RetailTestPage';
import Button from './components/ui/Button';
import { textStyles } from './styles/designSystem';
import './index.css';

function App() {
  // Temporarily bypass authentication for testing
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentStep, setCurrentStep] = useState('landing');
  const [jobData, setJobData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleNavigateToProcessing = (data) => {
    // Clean up any existing state
    setAnalysisResults(null);
    setJobData(null);
    setJobData(data);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (results) => {
    console.log('📊 App: handleProcessingComplete called with results:', results);
    if (results) {
      // Clean up processing state
      setJobData(null);
      setAnalysisResults(results);
      setCurrentStep('dashboard');
      console.log('✅ Transitioned to dashboard step');
    }
  };

  const handleBackToLanding = () => {
    // Clean up all state when going back to landing
    setCurrentStep('landing');
    setJobData(null);
    setAnalysisResults(null);
  };

  // Render the appropriate component based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'landing':
        return <RetailLandingPage onNavigateToProcessing={handleNavigateToProcessing} />;
      case 'processing':
        return (
          <ProcessingPage
            jobId={jobData?.jobId}
            selectedDomain={jobData?.selectedDomain}
            selectedSource={jobData?.selectedSource}
            onComplete={handleProcessingComplete}
          />
        );
      case 'dashboard':
        return (
          <RetailDashboard 
            analysisResults={analysisResults}
            onBackToLanding={handleBackToLanding}
          />
        );
      default:
        return <RetailLandingPage onNavigateToProcessing={handleNavigateToProcessing} />;
    }
  };

  return (
    <Router>
      <div className="App">
        {renderCurrentStep()}
      </div>
    </Router>
  );
}

export default App;