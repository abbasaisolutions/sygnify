import React, { useState } from 'react';
    import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
    import FileUpload from './components/FileUpload';
    import Dashboard from './components/Dashboard';
    import Login from './components/Login';
    import Subscription from './components/Subscription';
    import './index.css';

    function App() {
      // Temporarily bypass authentication for testing
      const [isAuthenticated, setIsAuthenticated] = useState(true);

      return (
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow p-4">
              <h1 className="text-3xl font-semibold text-gray-800">Sygnify Analytics Hub</h1>
            </header>
            <main className="p-6 max-w-7xl mx-auto">
              <Routes>
                <Route
                  path="/login"
                  element={<Login setIsAuthenticated={setIsAuthenticated} />}
                />
                <Route
                  path="/dashboard/analytics-hub"
                  element={<Dashboard />}
                />
                <Route
                  path="/upload"
                  element={<FileUpload />}
                />
                <Route
                  path="/subscription"
                  element={<Subscription />}
                />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard/analytics-hub" />}
                />
              </Routes>
            </main>
          </div>
        </Router>
      );
    }

    export default App;