import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Subscription from './components/Subscription';
import LandingPage from './components/LandingPage';
import ProcessingPage from './components/ProcessingPage';
import './index.css';

function App() {
  // Temporarily bypass authentication for testing
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentStep, setCurrentStep] = useState('landing');
  const [jobData, setJobData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleNavigateToProcessing = (data) => {
    setJobData(data);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (results) => {
    setAnalysisResults(results);
    setCurrentStep('dashboard');
  };

  const handleBackToLanding = () => {
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
          <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold text-gray-800">Sygnify Analytics Hub</h1>
                <button
                  onClick={handleBackToLanding}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back to Landing
                </button>
              </div>
            </header>
            <main className="p-6 max-w-7xl mx-auto">
              <Dashboard 
                analysisResults={analysisResults}
                selectedDomain={jobData?.selectedDomain}
                selectedSource={jobData?.selectedSource}
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