import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  // Changed default to false so users start at login page
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          !isAuthenticated ? (
            <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
        <Route path="/signup" element={
          !isAuthenticated ? (
            <Signup />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />

        {/* Protected routes */}
        <Route path="/" element={
          isAuthenticated ? (
            <Layout />
          ) : (
            <Navigate to="/login" replace />
          )
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<div className="p-4">User Management Page</div>} />
          <Route path="properties" element={<div className="p-4">Properties Management Page</div>} />
          <Route path="tasks/categories" element={<div className="p-4">Task Categories Page</div>} />
          <Route path="tasks/all" element={<div className="p-4">All Tasks Page</div>} />
          <Route path="tasks/assigned" element={<div className="p-4">Tasks Assigned To Me Page</div>} />
          <Route path="tasks" element={<Navigate to="/tasks/all" replace />} />
          <Route path="activity" element={<div className="p-4">Activity Log Page</div>} />
          <Route path="reports" element={<div className="p-4">Reports Page</div>} />
          <Route path="notifications" element={<div className="p-4">Notifications Page</div>} />
          <Route path="settings" element={<div className="p-4">Settings Page</div>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch all unmatched routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;