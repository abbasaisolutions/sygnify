import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Sygnify Analytics Hub</h2>
        <p className="text-gray-600 mb-6">
          Your advanced AI-powered analytics platform for intelligent data comprehension, visualization, and narrative generation.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Data Analysis</h3>
            <p className="text-blue-700 mb-4">Upload your CSV files and get intelligent insights powered by AI.</p>
            <Link 
              to="/upload" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Upload Files
            </Link>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">📈 Analytics Dashboard</h3>
            <p className="text-green-700 mb-4">View comprehensive analytics and visualizations of your data.</p>
            <div className="text-green-600 font-medium">Coming Soon</div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">💎 Premium Features</h3>
            <p className="text-purple-700 mb-4">Unlock advanced analytics and unlimited uploads.</p>
            <Link 
              to="/subscription" 
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-700">No recent uploads. Start by uploading your first CSV file!</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            to="/upload" 
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            📁 Upload New File
          </Link>
          <Link 
            to="/subscription" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            💎 Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;