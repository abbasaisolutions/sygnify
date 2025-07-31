import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import Login from './components/Login';
import Subscription from './components/Subscription';
import LandingPage from './components/LandingPage';
import ProcessingPage from './components/ProcessingPage';
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
        return <LandingPage onNavigateToProcessing={handleNavigateToProcessing} />;
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
          <div className="min-h-screen bg-white font-sans">
            <header className="bg-white shadow-sm border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h1 className={textStyles.h2}>Sygnify Analytics Hub</h1>
                <Button 
                  variant="secondary"
                  onClick={handleBackToLanding}
                >
                  ← Back to Landing
                </Button>
              </div>
            </header>
            <main className="p-6 max-w-7xl mx-auto">
              <Dashboard 
                analysisResults={analysisResults}
                onBackToLanding={handleBackToLanding}
              />
            </main>
          </div>
        );
      default:
        return <LandingPage onNavigateToProcessing={handleNavigateToProcessing} />;
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