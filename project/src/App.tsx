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
import UserTasks from './pages/Users/UserTasks';
import DailyTaskManagementAllDepartment from './components/DailyTaskManagement/DailyTaskManagementAllDepartment';
import DailyManagementReport from './components/DailyTaskManagement/DailyManagementReport';
import MonthlyTask from './components/MonthlyTaskManagement/MonthlyTask';
import WeekCalendar from './components/52Week/52WeekCalender';
import IncidentReportPage from './components/IncidentReport/IncidentReport';
import NightIncidentPage from './components/Patrolling/NightIncident';
import SiteSecurityPage from './components/Patrolling/SiteSecurity';
import TechnicalTeamPatrollingPage from './components/Patrolling/TechnicalTeamPatrolling';
import VisitorManagement from './components/GateManagement/VisitorManagement';
import InwardNonReturnable from './components/GateManagement/InwardNonReturnable';
import InwardReturnable from './components/GateManagement/InwardReturnable';
import MoveOut from './components/GateManagement/MoveOut';
import GatePassManagement from './components/GateManagement/GatePassManagement';
import InteriorWorkTracking from './components/GateManagement/InteriorWorkTracking';
import OutwardReturnable from './components/GateManagement/OutwardReturnable';
import OutwardNonReturnable from './components/GateManagement/OutwardNonReturnable';
import WorkPermitIssuance from './components/GateManagement/WorkPermitIssuance';
import MoveIn from './components/GateManagement/MoveIn';
import BlocklistManagement from './components/GateManagement/BlocklistManagement';
import DailyEntryDetails from './components/GateManagement/DailyEntryDetails';
import WaterTankerManagement from './components/GateManagement/WaterTankerManagement';
import VendorEntryManagement from './components/GateManagement/VendorEntryManagement';
import StaEntryManagement from './components/GateManagement/StaEntryManagement';
import EmergencyContactDetails from './components/GateManagement/EmergencyContactDetails';
import InteriorWorkApprovals from './components/CommunityManagement/InteriorWorkApprovals';
import WorkPermitTracking from './components/CommunityManagement/WorkPermitTracking';
import TicketsManagement from './components/CommunityManagement/TicketsManagement';
import TicketAssignment from './components/CommunityManagement/TicketAssignment';
import NoticeManagement from './components/CommunityManagement/NoticeManagement';
import ParkingStickerManagement from './components/CommunityManagement/ParkingStickerManagement';
import CommunicationAnnouncements from './components/CommunityManagement/CommunicationAnnouncements';                                                                                                                                                                                                                                                                           
import MoveInCoordination from './components/CommunityManagement/MoveInCoordination';
import MoveOutCoordination from './components/CommunityManagement/MoveOutCoordination';
import AssetTaggingManagement from './components/AssetsManagement/AssetTaggingManagement';
import AssetMovementLog from './components/AssetsManagement/AssetMovementLog';
import AMCWarrantyTracker from './components/AssetsManagement/AMCWarrantyTracker';
import MaintenanceSchedule from './components/AssetsManagement/MaintenanceSchedule';
import AssetAudit from './components/AssetsManagement/AssetAudit';
import DepreciationReplacement from './components/AssetsManagement/DepreciationReplacement';

// import UserTasks from './pages/Users/usertasks';


// Creating problems

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
          <Navigate to={user?.status === 'active' ? "/profile" : "/verify"} replace />
        )
      } />
      <Route path="/signup" element={
        !isAuthenticated ? (
          <Signup />
        ) : (
          <Navigate to={user?.status === 'active' ? "/profile" : "/verify"} replace />
        )
      } />
      <Route path="/verify" element={
        isAuthenticated && user?.status !== 'active' ? (
          <Verification />
        ) : (
          <Navigate to={isAuthenticated ? "/profile" : "/login"} replace />
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
        <Route index element={<Navigate to="/profile" replace />} />
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
        <Route path="daily-task-management-all-department" element={<DailyTaskManagementAllDepartment />} />
        <Route path="monthly-task-management" element={<MonthlyTask />} />
        <Route path="52-week-work-calendar" element={<WeekCalendar />} />
        <Route path="incident-report" element={<IncidentReportPage />} />
        <Route path="night-patrolling-report" element={<NightIncidentPage />} />
        <Route path="site-security-patrolling-report" element={<SiteSecurityPage />} />
        <Route path="technical-team-patrolling-report" element={<TechnicalTeamPatrollingPage />} />
        <Route path="daily-management-report" element={<DailyManagementReport />} />
        <Route path="profile" element={<Profile />} />
        <Route path="activity" element={<div className="p-4">Activity Log Page</div>} />
        <Route path="reports" element={<div className="p-4">Reports Page</div>} />
        <Route path="notifications" element={<div className="p-4">Notifications Page</div>} />
        <Route path="settings" element={<div className="p-4">Settings Page</div>} />
        <Route path="*" element={<Navigate to="/profile" replace />} />
        <Route path="assets-management" element={<AssetManagement />} />
        <Route path="inventory-management" element={<InventoryManagement />} />
        <Route path="visitor-management" element={<VisitorManagement />} />
        <Route path="inward-non-returnable" element={<InwardNonReturnable />} />
        <Route path="inward-returnable" element={<InwardReturnable />} />
        <Route path="outward-non-returnable" element={<OutwardNonReturnable />} />
        <Route path="outward-returnable" element={<OutwardReturnable />} />
        <Route path="move-in" element={<MoveIn />} />
        <Route path="move-out" element={<MoveOut />} />
        <Route path="interior-work-tracking" element={<InteriorWorkTracking />} />
        <Route path="work-permit-issuance" element={<WorkPermitIssuance />} />
        <Route path="gate-pass-management" element={<GatePassManagement />} />  
        <Route path="blocklist-management" element={<BlocklistManagement />} />
        <Route path="daily-entry-details" element={<DailyEntryDetails />} />
        <Route path="water-tanker-management" element={<WaterTankerManagement />} />
        <Route path="vendor-entry-management" element={<VendorEntryManagement />} />
        <Route path="sta-entry-management" element={<StaEntryManagement />} />
        <Route path="emergency-contact-details" element={<EmergencyContactDetails />} />  
        <Route path="tickets-management" element={<TicketsManagement />} />
        <Route path="ticket-assignment" element={<TicketAssignment />} />
        <Route path="notice-management" element={<NoticeManagement />} />
        <Route path="parking-sticker-management" element={<ParkingStickerManagement />} />
        <Route path="communication-announcements" element={<CommunicationAnnouncements />} />
        <Route path="move-in-coordination" element={<MoveInCoordination />} />
        <Route path="move-out-coordination" element={<MoveOutCoordination />} />
        <Route path="interior-work-approvals" element={<InteriorWorkApprovals />} />
        <Route path="work-permit-tracking" element={<WorkPermitTracking />} />  
        
        {/* Asset Management Routes */}
        <Route path="asset-tagging-management" element={<AssetTaggingManagement />} />
        <Route path="asset-movement-log" element={<AssetMovementLog />} />
        <Route path="amc-warranty-tracker" element={<AMCWarrantyTracker />} />
        <Route path="maintenance-schedule" element={<MaintenanceSchedule />} />
        <Route path="asset-audit" element={<AssetAudit />} />
        <Route path="depreciation-replacement" element={<DepreciationReplacement />} />

        <Route path="cadmin/users" element={<CadminUserProfile />} />
        <Route path="cadmin/tasks" element={<CadminTasks />} />
        <Route path="cadmin/staff-categories" element={<CadminStaff />} />
        <Route path="cadmin/properties" element={<CadminPropertiesProfiles />} />
        <Route path="cadmin/properties/:propertyId/users" element={<CadminPropertyUsers />} />
        <Route path="cadmin/daily-logs">
          <Route index element={<Navigate to="/cadmin/daily-logs/fresh-water" replace />} />
          <Route path="fresh-water" element={<CadminFreshWater />} />
          <Route path="generator" element={<CadminDieselGeneratorDashboard />} />
          <Route path="stp" element={<CadminSTPDashboard />} />
          <Route path="wtp" element={<CadminWTPDashboard />} />
          <Route path="swimming-pool" element={<CadminSwimmingPoolManager />} />
          <Route path="diesel-generator" element={<CadminDieselGeneratorDashboard/>} />
        </Route>
        <Route path="cadmin/profile" element={<Profile />} />
        <Route path="cadmin/activity" element={<div className="p-4">Activity Log Page</div>} />
        <Route path="cadmin/reports" element={<div className="p-4">Reports Page</div>} />
        <Route path="cadmin/notifications" element={<div className="p-4">Notifications Page</div>} />
        <Route path="cadmin/settings" element={<div className="p-4">Settings Page</div>} />
        <Route path="*" element={<Navigate to="/cadmin/users" replace />} />
        <Route path="cadmin/assets-management" element={<CadminAssetManagement />} />
        <Route path="cadmin/inventory-management" element={<CadminInventoryManagement />} />

        <Route path="user/tasks" element={<UserTasks />} />
        
      </Route>

      {/* Catch all unmatched routes */}
      <Route path="*" element={
        <Navigate to={
          !isAuthenticated ? "/login" : 
          user?.status === 'active' ? "/profile" : "/verify"
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