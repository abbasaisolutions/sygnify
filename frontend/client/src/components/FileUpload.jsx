import React, { useState } from 'react';
import axios from 'axios';
import MLSummaryDisplay from './MLSummaryDisplay';
import EnhancedAnalysisDisplay from './EnhancedAnalysisDisplay';
import AdvancedVisualization from './AdvancedVisualization';
import { ENDPOINTS } from '../config/api';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [domain, setDomain] = useState('finance');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [fileHash, setFileHash] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);
    
    try {
      const response = await axios.post(ENDPOINTS.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Accept new LLaMA 3 response format
      if (
        response.data.llama3_narrative ||
        response.data.key_insights ||
        response.data.external_context
      ) {
        setAnalysisResults(response.data);
        setProcessingTime(null);
        setError(null);
      } else if (response.data.executive_summary) {
        setAnalysisResults(response.data);
        setProcessingTime(null);
        setError(null);
      } else if (response.data.success && response.data.data) {
        setAnalysisResults(response.data.data);
        setProcessingTime(response.data.metadata?.processing_time_ms);
        setError(null);
      } else if (response.data.analysis) {
        setAnalysisResults(response.data.analysis);
        setProcessingTime(null);
        setError(null);
      } else {
        throw new Error('Invalid response format from server');
      }
      if (response.data.file_hash) {
        setFileHash(response.data.file_hash);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle structured error responses
      if (error.response?.data?.error) {
        const errorData = error.response.data.error;
        setError(`${errorData.message} (${errorData.type})`);
      } else {
        setError(error.response?.data?.message || error.message || 'Upload failed');
      }
      setAnalysisResults(null);
      setProcessingTime(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!fileHash) return;
    try {
      await axios.post(ENDPOINTS.clearCache, { file_hash: fileHash });
      setFileHash(null);
      setAnalysisResults(null);
      setError(null);
    } catch (err) {
      setError('Failed to clear cache.');
    }
  };

  const resetForm = () => {
    setAnalysisResults(null);
    setFile(null);
    setError(null);
    setProcessingTime(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📁 Upload Data for Analysis</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Analysis Failed</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="finance">Finance</option>
              <option value="advertising">Advertising</option>
              <option value="supply_chain">Supply Chain</option>
              <option value="hr">HR</option>
              <option value="operations">Operations</option>
              <option value="general">General</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum file size: 500MB. Only CSV files are supported.
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '📊 Upload & Analyze'
              )}
            </button>
            
            {analysisResults && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                📁 Upload Another File
              </button>
            )}
          </div>
          {fileHash && (
            <button onClick={handleClearCache} className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors mt-2">
              Clear Previous Result (Force Reprocess)
            </button>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">✅ AI-Powered Analysis Complete!</span>
              </div>
              {processingTime && (
                <span className="text-sm text-green-600">
                  Processed in {processingTime}ms
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Analysis Display */}
          <EnhancedAnalysisDisplay analysis={analysisResults} />

          {/* Legacy ML Summary Display (for backward compatibility) */}
          {analysisResults.mlSummary && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Legacy ML Summary</h3>
              </div>
              <div className="p-6">
                <MLSummaryDisplay mlSummary={analysisResults.mlSummary} />
              </div>
            </div>
          )}
        </div>
      )}
      {/* Show Advanced Insights after upload */}
      {analysisResults && (
        <div className="mt-8">
          <AdvancedVisualization analysisData={analysisResults} />
        </div>
      )}
    </div>
  );
}

export default FileUpload;