import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import Verification from './pages/Verify';
import UserProfile from './pages/Admin/UserProfile';
import PropertiesProfiles from './pages/Admin/PropertiesProfiles';
import PropertyUsers from './pages/Admin/PropertyUsers';
import Tasks from './pages/Admin/Tasks';
import Staff from './pages/Admin/Staff';

// Create a wrapper component to use useAuth hook
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        !isAuthenticated ? (
          <Login />
        ) : (
          <Navigate to={user?.status === 'active' ? "/dashboard" : "/verify"} replace />
        )
      } />
      <Route path="/signup" element={
        !isAuthenticated ? (
          <Signup />
        ) : (
          <Navigate to={user?.status === 'active' ? "/dashboard" : "/verify"} replace />
        )
      } />
      <Route path="/verify" element={
        isAuthenticated && user?.status !== 'active' ? (
          <Verification />
        ) : (
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        )
      } />

      {/* Protected routes */}
      <Route path="/" element={
        isAuthenticated && user?.status === 'active' ? (
          <Layout />
        ) : (
          <Navigate to={isAuthenticated ? "/verify" : "/login"} replace />
        )
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* <Route path="dashboard" element={<Dashboard />} /> */}
        <Route path="dashboard" element={<div className="p-4">Dashboard</div>} />
        {/* <Route path="users" element={<div className="p-4">User Management Page</div>} /> */}
        <Route path="users" element={<UserProfile />} />
        {/* <Route path="properties" element={<div className="p-4">Properties Management Page</div>} /> */}
        <Route path="tasks" element={<Tasks />} />
        <Route path="staff-categories" element={<Staff />} />
        <Route path="properties" element={<PropertiesProfiles />} />
        <Route path="properties/:propertyId/users" element={<PropertyUsers />} />
        {/* <Route path="tasks/categories" element={<div className="p-4">Task Categories Page</div>} />
        <Route path="tasks/all" element={<div className="p-4">All Tasks Page</div>} />
        <Route path="tasks/assigned" element={<div className="p-4">Tasks Assigned To Me Page</div>} />
        <Route path="tasks" element={<Navigate to="/tasks/all" replace />} /> */}
        <Route path="activity" element={<div className="p-4">Activity Log Page</div>} />
        <Route path="reports" element={<div className="p-4">Reports Page</div>} />
        <Route path="notifications" element={<div className="p-4">Notifications Page</div>} />
        <Route path="settings" element={<div className="p-4">Settings Page</div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all unmatched routes */}
      <Route path="*" element={
        <Navigate to={
          !isAuthenticated ? "/login" : 
          user?.status === 'active' ? "/dashboard" : "/verify"
        } replace />
      } />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;