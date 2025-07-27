import React, { useEffect, useState } from 'react';
    import { Link } from 'react-router-dom';
    import Chart from 'chart.js/auto';
    import axios from 'axios';
    import { ENDPOINTS } from './config/api';

    function Dashboard() {
      const [results, setResults] = useState([]);
      const [insights, setInsights] = useState([]);

      useEffect(() => {
        const fetchResults = async () => {
          try {
            const res = await axios.get(ENDPOINTS.results, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setResults(res.data.results);
            const insightsRes = await axios.get(ENDPOINTS.insights, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setInsights(insightsRes.data.insights);
          } catch (error) {
            console.error('Fetch failed:', error);
          }
        };
        fetchResults();
        const interval = setInterval(fetchResults, 30000); // 30 seconds instead of 5
        return () => clearInterval(interval);
      }, []);

      useEffect(() => {
        const ctx = document.getElementById('analyticsChart')?.getContext('2d');
        if (ctx && results.length) {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: results.map(r => r.label),
              datasets: [{
                label: 'Analysis',
                data: results.map(r => r.value),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
              }]
            },
            options: {
              responsive: true,
              scales: { y: { beginAtZero: true } }
            }
          });
        }
      }, [results]);

      return (
        <div className="p-4 bg-white rounded-lg shadow">
          <nav className="mb-4">
            <Link to="/upload" className="text-blue-500 mr-4">Upload Data</Link>
            <Link to="/subscription" className="text-blue-500">Subscription</Link>
          </nav>
          <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
          <canvas id="analyticsChart" className="mb-4"></canvas>
          <div>
            <h3 className="text-lg font-medium mb-2">Insights</h3>
            {insights.map((insight, index) => (
              <p key={index} className="mb-2 text-gray-700">{insight.summary} ({insight.impact})</p>
            ))}
          </div>
        </div>
      );
    }

    export default Dashboard;