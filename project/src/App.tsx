import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Verification from './pages/Verify';
import UserProfile from './pages/Admin/UserProfile';
import PropertiesProfiles from './pages/Admin/PropertiesProfiles';
import PropertyUsers from './pages/Admin/PropertyUsers';
import Tasks from './pages/Admin/Tasks';
import Staff from './pages/Admin/Staff';
import FreshWater from './pages/Admin/DailyLogs/FreshWater';
import Profile from './pages/Profile';
import DieselGeneratorManager from './pages/Admin/DailyLogs/Generator';
import StpWtp from './pages/Admin/DailyLogs/StpWtp';
import AssetManagement from './pages/Admin/Products/AssetsManagement';
import InventoryManagement from './pages/Admin/Products/InventoryManagement';
import STPDashboard from './pages/Admin/DailyLogs/STPDashboard';
import WTPDashboard from './pages/Admin/DailyLogs/WTPDashboard';
import SwimmingPoolManager from './pages/Admin/DailyLogs/SwimmingPool';
import DieselGeneratorDashboard from './pages/Admin/DailyLogs/DieselGenerator';
import CadminSTPDashboard from './pages/Cadmin/DailyLogs/CadminSTPDashboard';
import CadminWTPDashboard from './pages/Cadmin/DailyLogs/CadminWTPDashboard';
import CadminSwimmingPoolManager from './pages/Cadmin/DailyLogs/CadminSwimmingPool';
import CadminDieselGeneratorDashboard from './pages/Cadmin/DailyLogs/CadminDieselGenerator';
import CadminFreshWater from './pages/Cadmin/DailyLogs/CadminFreshWater';
import CadminAssetManagement from './pages/Cadmin/Products/CadminAssetsManagement';
import CadminInventoryManagement from './pages/Cadmin/Products/CadminInventoryManagement';
import CadminStaff from './pages/Cadmin/CadminStaff';
import CadminPropertyUsers from './pages/Cadmin/CadminPropertyUsers';
import CadminTasks from './pages/Cadmin/CadminTasks';
import CadminPropertiesProfiles from './pages/Cadmin/CadminPropertiesProfiles';
import CadminUserProfile from './pages/Cadmin/CadminUserProfile';

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
          <Navigate to={user?.status === 'active' ? "/users" : "/verify"} replace />
        )
      } />
      <Route path="/signup" element={
        !isAuthenticated ? (
          <Signup />
        ) : (
          <Navigate to={user?.status === 'active' ? "/users" : "/verify"} replace />
        )
      } />
      <Route path="/verify" element={
        isAuthenticated && user?.status !== 'active' ? (
          <Verification />
        ) : (
          <Navigate to={isAuthenticated ? "/users" : "/login"} replace />
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
        <Route index element={<Navigate to="/users" replace />} />
        {/* <Route path="dashboard" element={<Dashboard />} /> */}
        <Route path="dashboard" element={<Dashboard />} />
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
        <Route path="daily-logs">
          <Route index element={<Navigate to="/daily-logs/fresh-water" replace />} />
          <Route path="fresh-water" element={<FreshWater />} />
          <Route path="generator" element={<DieselGeneratorManager />} />
          {/* <Route path="stp-wtp" element={<StpWtp />} /> */}
          <Route path="stp" element={<STPDashboard />} />
          <Route path="wtp" element={<WTPDashboard />} />
          <Route path="swimming-pool" element={<SwimmingPoolManager />} />
          <Route path="diesel-generator" element={<DieselGeneratorDashboard/>} />
        </Route>
        <Route path="profile" element={<Profile />} />
        <Route path="activity" element={<div className="p-4">Activity Log Page</div>} />
        <Route path="reports" element={<div className="p-4">Reports Page</div>} />
        <Route path="notifications" element={<div className="p-4">Notifications Page</div>} />
        <Route path="settings" element={<div className="p-4">Settings Page</div>} />
        <Route path="*" element={<Navigate to="/users" replace />} />
        <Route path="assets-management" element={<AssetManagement />} />
        <Route path="inventory-management" element={<InventoryManagement />} />


        <Route path="cadmin/users" element={<CadminUserProfile />} />
        <Route path="cadmin/tasks" element={<CadminTasks />} />
        <Route path="cadmin/staff-categories" element={<CadminStaff />} />
        <Route path="cadmin/properties" element={<CadminPropertiesProfiles />} />
        <Route path="cadmin/properties/:propertyId/users" element={<CadminPropertyUsers />} />
        <Route path="cadmin/daily-logs">
          <Route index element={<Navigate to="/cadmin/daily-logs/fresh-water" replace />} />
          <Route path="cadmin/fresh-water" element={<CadminFreshWater />} />
          <Route path="cadmin/generator" element={<CadminDieselGeneratorDashboard />} />
          <Route path="cadmin/stp" element={<CadminSTPDashboard />} />
          <Route path="cadmin/wtp" element={<CadminWTPDashboard />} />
          <Route path="cadmin/swimming-pool" element={<CadminSwimmingPoolManager />} />
          <Route path="cadmin/diesel-generator" element={<CadminDieselGeneratorDashboard/>} />
        </Route>
        <Route path="cadmin/profile" element={<Profile />} />
        <Route path="cadmin/activity" element={<div className="p-4">Activity Log Page</div>} />
        <Route path="cadmin/reports" element={<div className="p-4">Reports Page</div>} />
        <Route path="cadmin/notifications" element={<div className="p-4">Notifications Page</div>} />
        <Route path="cadmin/settings" element={<div className="p-4">Settings Page</div>} />
        <Route path="*" element={<Navigate to="/cadmin/users" replace />} />
        <Route path="cadmin/assets-management" element={<CadminAssetManagement />} />
        <Route path="cadmin/inventory-management" element={<CadminInventoryManagement />} />
        
        
      </Route>

      {/* Catch all unmatched routes */}
      <Route path="*" element={
        <Navigate to={
          !isAuthenticated ? "/login" : 
          user?.status === 'active' ? "/users" : "/verify"
        } replace />
      } />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <AppRoutes />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;