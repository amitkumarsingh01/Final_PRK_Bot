import React, { useState } from 'react';
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
// import StpWtp from './pages/Admin/DailyLogs/StpWtp';
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
import PropertyUserManagement from './pages/PropertyUserManagement';
import UserRoleManagement from './pages/UserRoleManagement';
import DailyTaskManagementAllDepartment from './components/DailyTaskManagement/DailyTaskManagementAllDepartment';
import DailyManagementReport from './components/DailyTaskManagement/DailyManagementReport';
import DailyReports from './components/DailyTaskManagement/DailyReports';
import MonthlyTask from './components/MonthlyTaskManagement/MonthlyTask';
import WeekCalendar from './components/52Week/52WeekCalender';
import WeekTraining from './components/52Week/52WeekTraining.tsx';
import IncidentReportPage from './components/IncidentReport/IncidentReport';
import CIncidentReportPage from './pages/Cadmin/Important/components/IncidentReport/IncidentReport';
import NightIncidentPage from './components/Patrolling/NightIncident';
import SiteSecurityPage from './components/Patrolling/SiteSecurity';
import TechnicalTeamPatrollingPage from './components/Patrolling/TechnicalTeamPatrolling';
// UserProperty pages
import UserPropertyDashboard from './pages/UserProperty/UserPropertyDashboard';
import UserPropertyDailyReports from './pages/UserProperty/UserPropertyDailyReports';
import UserPropertyMonthlyTask from './pages/UserProperty/UserPropertyMonthlyTask';
import UserProperty52WeekCalender from './pages/UserProperty/UserProperty52WeekCalender';
import UserProperty52WeekTraining from './pages/UserProperty/UserProperty52WeekTraining';
import UserPropertyIncidentReport from './pages/UserProperty/UserPropertyIncidentReport';
import UserPropertySiteSecurity from './pages/UserProperty/UserPropertySiteSecurity';
import UserPropertyTechnicalPatrolling from './pages/UserProperty/UserPropertyTechnicalPatrolling';
import UserPropertyNightIncident from './pages/UserProperty/UserPropertyNightIncident';
import UserPropertyAuditReport from './pages/UserProperty/UserPropertyAuditReport';
import UserPropertySitePreTransition from './pages/UserProperty/UserPropertySitePreTransition';
import UserPropertyPostTransition from './pages/UserProperty/UserPropertyPostTransition';
import UserPropertyLayout from './pages/UserProperty/Important/components/userpropertylayout/UserPropertyLayout';
import CNightIncidentPage from './pages/Cadmin/Important/components/Patrolling/NightIncident';
import CSiteSecurityPage from './pages/Cadmin/Important/components/Patrolling/SiteSecurity';
import CTechnicalTeamPatrollingPage from './pages/Cadmin/Important/components/Patrolling/TechnicalTeamPatrolling';
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
// Cadmin Gate Management versions (fixed property display)
import CVisitorManagement from './pages/Cadmin/Important/components/GateManagement/VisitorManagement';
import CInwardNonReturnable from './pages/Cadmin/Important/components/GateManagement/InwardNonReturnable';
import CInwardReturnable from './pages/Cadmin/Important/components/GateManagement/InwardReturnable';
import CMoveOut from './pages/Cadmin/Important/components/GateManagement/MoveOut';
import CGatePassManagement from './pages/Cadmin/Important/components/GateManagement/GatePassManagement';
import CInteriorWorkTracking from './pages/Cadmin/Important/components/GateManagement/InteriorWorkTracking';
import COutwardReturnable from './pages/Cadmin/Important/components/GateManagement/OutwardReturnable';
import COutwardNonReturnable from './pages/Cadmin/Important/components/GateManagement/OutwardNonReturnable';
import CWorkPermitIssuance from './pages/Cadmin/Important/components/GateManagement/WorkPermitIssuance';
import CMoveIn from './pages/Cadmin/Important/components/GateManagement/MoveIn';
import CBlocklistManagement from './pages/Cadmin/Important/components/GateManagement/BlocklistManagement';
import CDailyEntryDetails from './pages/Cadmin/Important/components/GateManagement/DailyEntryDetails';
import CWaterTankerManagement from './pages/Cadmin/Important/components/GateManagement/WaterTankerManagement';
import CVendorEntryManagement from './pages/Cadmin/Important/components/GateManagement/VendorEntryManagement';
import CStaEntryManagement from './pages/Cadmin/Important/components/GateManagement/StaEntryManagement';
import CEmergencyContactDetails from './pages/Cadmin/Important/components/GateManagement/EmergencyContactDetails';
import InteriorWorkApprovals from './components/CommunityManagement/InteriorWorkApprovals';
import WorkPermitTracking from './components/CommunityManagement/WorkPermitTracking';
import TicketsManagement from './components/CommunityManagement/TicketsManagement';
import TicketAssignment from './components/CommunityManagement/TicketAssignment';
import NoticeManagement from './components/CommunityManagement/NoticeManagement';
import ParkingStickerManagement from './components/CommunityManagement/ParkingStickerManagement';
import CommunicationAnnouncements from './components/CommunityManagement/CommunicationAnnouncements';                                                                                                                                                                                                                                                                           
import MoveInCoordination from './components/CommunityManagement/MoveInCoordination';
import MoveOutCoordination from './components/CommunityManagement/MoveOutCoordination';
// Cadmin Community Management versions (fixed property display)
import CTicketsManagement from './pages/Cadmin/Important/components/CommunityManagement/TicketsManagement';
import CTicketAssignment from './pages/Cadmin/Important/components/CommunityManagement/TicketAssignment';
import CNoticeManagement from './pages/Cadmin/Important/components/CommunityManagement/NoticeManagement';
import CParkingStickerManagement from './pages/Cadmin/Important/components/CommunityManagement/ParkingStickerManagement';
import CCommunicationAnnouncements from './pages/Cadmin/Important/components/CommunityManagement/CommunicationAnnouncements';
import CMoveInCoordination from './pages/Cadmin/Important/components/CommunityManagement/MoveInCoordination';
import CMoveOutCoordination from './pages/Cadmin/Important/components/CommunityManagement/MoveOutCoordination';
import CWorkPermitTracking from './pages/Cadmin/Important/components/CommunityManagement/WorkPermitTracking';
import AssetTaggingManagement from './components/AssetsManagement/AssetTaggingManagement';
import AssetMovementLog from './components/AssetsManagement/AssetMovementLog';
import AMCWarrantyTracker from './components/AssetsManagement/AMCWarrantyTracker';
import MaintenanceSchedule from './components/AssetsManagement/MaintenanceSchedule';
import AssetAudit from './components/AssetsManagement/AssetAudit';
import DepreciationReplacement from './components/AssetsManagement/DepreciationReplacement';
// Cadmin Assets Management versions (fixed property display, full actions)
import CAssetTaggingManagement from './pages/Cadmin/Important/components/AssetsManagement/AssetTaggingManagement';
import CAssetMovementLog from './pages/Cadmin/Important/components/AssetsManagement/AssetMovementLog';
import CAMCWarrantyTracker from './pages/Cadmin/Important/components/AssetsManagement/AMCWarrantyTracker';
import CMaintenanceSchedule from './pages/Cadmin/Important/components/AssetsManagement/MaintenanceSchedule';
import CAssetAudit from './pages/Cadmin/Important/components/AssetsManagement/AssetAudit';
import CDepreciationReplacement from './pages/Cadmin/Important/components/AssetsManagement/DepreciationReplacement';
import InventoryTracking from './components/InventoryManagement/InventoryTracking';
import StockEntryIssue from './components/InventoryManagement/StockEntryIssue';
import MinMaxLevelMonitoring from './components/InventoryManagement/MinMaxLevelMonitoring';
import ConsumptionReports from './components/InventoryManagement/ConsumptionReports';
import ExpiryDamageLog from './components/InventoryManagement/ExpiryDamageLog';
// Cadmin Inventory Management versions (fixed property display, full actions)
import CInventoryTracking from './pages/Cadmin/Important/components/InventoryManagement/InventoryTracking';
import CStockEntryIssue from './pages/Cadmin/Important/components/InventoryManagement/StockEntryIssue';
import CMinMaxLevelMonitoring from './pages/Cadmin/Important/components/InventoryManagement/MinMaxLevelMonitoring';
import CConsumptionReports from './pages/Cadmin/Important/components/InventoryManagement/ConsumptionReports';
import CExpiryDamageLog from './pages/Cadmin/Important/components/InventoryManagement/ExpiryDamageLog';
import QualityPlanning from './components/QualityAndProcess.tsx/QualityPlanning';
import ProcessManagementSetup from './components/QualityAndProcess.tsx/ProcessManagementSetup';
import QualityAssurance from './components/QualityAndProcess.tsx/QualityAssurance';
import QualityControl from './components/QualityAndProcess.tsx/QualityControl';
import PerformanceMonitoring from './components/QualityAndProcess.tsx/PerformanceMonitoring';
import DocumentationReporting from './components/QualityAndProcess.tsx/DocumentationReporting';

// Cadmin Quality & Process versions (no dropdown)
import CQualityPlanning from './pages/Cadmin/Important/components/QualityAndProcess.tsx/QualityPlanning';
import CProcessManagementSetup from './pages/Cadmin/Important/components/QualityAndProcess.tsx/ProcessManagementSetup';
import CQualityAssurance from './pages/Cadmin/Important/components/QualityAndProcess.tsx/QualityAssurance';
import CQualityControl from './pages/Cadmin/Important/components/QualityAndProcess.tsx/QualityControl';
import CPerformanceMonitoring from './pages/Cadmin/Important/components/QualityAndProcess.tsx/PerformanceMonitoring';
import CDocumentationReporting from './pages/Cadmin/Important/components/QualityAndProcess.tsx/DocumentationReporting';
import SiteAssessmentAndPlanning from './components/FireSafety/Site_Assessment_and_Planning';
import InstallationAndEquipmentSetup from './components/FireSafety/Installation_and_Equipment_Setup';
import FireSafetyDocuments from './components/FireSafety/Fire_Safety_Documents';
import ComplianceReports from './components/FireSafety/Compliance_Reports';
import FireAndSafetyTraining from './components/FireSafety/Fire_and_Safety_Training';
import DailyChecklist from './components/FireSafety/Daily_Checklist';
import WeeklyChecklist from './components/FireSafety/Weekly_Checklist';
import MonthlyChecklist from './components/FireSafety/Monthly_Checklist';
import QuarterlyChecklist from './components/FireSafety/Quarterly_Checklist';
import EmergencyPreparednessPlan from './components/FireSafety/Emergency_Preparedness_Plan';
import RecordKeeping from './components/FireSafety/Record_Keeping';
import SystemDesignPlanningPage from './components/CCTVAudit/System_Design__Planning';
import InstallationChecklist from './components/CCTVAudit/Installation_Checklist';
import ConfigurationTestingPage from './components/CCTVAudit/Conguration_and_Testing';
import DailyOperationsMonitoringPage from './components/CCTVAudit/Daily_Operations__Monitoring';
import MaintenanceSchedulePage from './components/CCTVAudit/Maintenance_Schedule.tsx';
import Documentation from './components/CCTVAudit/Documentation';
import AmcAndCompliance from './components/CCTVAudit/AMC_and_Compliance';
import SiteAssessment from './components/CCTVAudit/Site_Assessment';

// Cadmin CCTV Department components (no dropdown, full actions)
import CSiteAssessment from './pages/Cadmin/Important/components/CCTVAudit/Site_Assessment';
import CSystemDesignPlanning from './pages/Cadmin/Important/components/CCTVAudit/System_Design__Planning';
import CInstallationChecklist from './pages/Cadmin/Important/components/CCTVAudit/Installation_Checklist';
import CConfigurationTesting from './pages/Cadmin/Important/components/CCTVAudit/Conguration_and_Testing';
import CDailyOperationsMonitoring from './pages/Cadmin/Important/components/CCTVAudit/Daily_Operations__Monitoring';
// Note: Avoid duplicate naming with imported MaintenanceSchedulePage above
import CCTVMaintenanceSchedule from './pages/Cadmin/Important/components/CCTVAudit/Maintenance_Schedule';
import CDocumentation from './pages/Cadmin/Important/components/CCTVAudit/Documentation';
import CAMCAndCompliance from './pages/Cadmin/Important/components/CCTVAudit/AMC_and_Compliance';
import AuditReportPage from './components/AuditReport/AuditReport';
import CAuditReportPage from './pages/Cadmin/Important/components/AuditReport/AuditReport';
import ProjectManagement from './components/ProjectManagement/All_Project_Management_Dashboard';
import ProjectInitiation from './components/ProjectManagement/Project_Initiation';
import ProjectPlanning from './components/ProjectManagement/Project_Planning';
import TeamResourceAllocation from './components/ProjectManagement/Team_Resource_Allocation';
import ExecutionAndImplementation from './components/ProjectManagement/Execution_and_Implementation';
import MonitoringAndControl from './components/ProjectManagement/Monitoring_and_Control';
import DocumentationAndReporting from './components/ProjectManagement/Documentation_and_Reporting';
import ProjectClosure from './components/ProjectManagement/Project_Closure';
// Cadmin Project Management versions (fixed property display)
import CProjectManagement from './pages/Cadmin/Important/components/ProjectManagement/All_Project_Management_Dashboard';
import CProjectInitiation from './pages/Cadmin/Important/components/ProjectManagement/Project_Initiation';
import CProjectPlanning from './pages/Cadmin/Important/components/ProjectManagement/Project_Planning';
import CTeamResourceAllocation from './pages/Cadmin/Important/components/ProjectManagement/Team_Resource_Allocation';
import CExecutionAndImplementation from './pages/Cadmin/Important/components/ProjectManagement/Execution_and_Implementation';
import CMonitoringAndControl from './pages/Cadmin/Important/components/ProjectManagement/Monitoring_and_Control';
import CDocumentationAndReporting from './pages/Cadmin/Important/components/ProjectManagement/Documentation_and_Reporting';
import CProjectClosure from './pages/Cadmin/Important/components/ProjectManagement/Project_Closure';
import ProcurementPlanning from './components/ProcurementManagement/Procurement_Planning';
import VendorManagement from './components/ProcurementManagement/Vendor_Management';
import PurchaseRequisitionToOrder from './components/ProcurementManagement/Purchase_Requisition_to_Order';
import GoodsReceiptAndInspection from './components/ProcurementManagement/Goods_Receipt_and_Inspection';
import InventoryAndStockManagement from './components/ProcurementManagement/Inventory_and_Stock_Management';
import PaymentTracking from './components/ProcurementManagement/Payment_Tracking';  
import ProcurementDocumentation from './components/ProcurementManagement/Procurement_Documentation';
import ComplianceAndPolicy from './components/ProcurementManagement/Compliance_and_Policy';
import ReportingAndAnalysis from './components/ProcurementManagement/Reporting_and_Analysis';
import ProcurementCategories from './components/ProcurementManagement/Procurement_Categories';
import VendorMasterManagement from './components/VendorManagement/Vendor_Master_Management';
import VendorClassication from './components/VendorManagement/Vendor_Classication';
import VendorEvaluation from './components/VendorManagement/Vendor_Evaluation';
import IntegrationWithPurchaseProcess from './components/VendorManagement/Integration_with_Purchase_Process';
import VendorRelationshipManagement from './components/VendorManagement/Vendor_Relationship_Management';
import ComplianceAndLegalCheck from './components/VendorManagement/Compliance_and_Legal_Check';
import VendorDocumentation from './components/VendorManagement/Vendor_Documentation';
import SLA_Planning_and_Denition from './components/ServiceLevel/SLA_Planning_and_Denition';
import Key_SLA_Components from './components/ServiceLevel/Key_SLA_Components';
import SLA_Implementation from './components/ServiceLevel/SLA_Implementation';
import SLA_Monitoring from './components/ServiceLevel/SLA_Monitoring';
import SLA_Evaluation from './components/ServiceLevel/SLA_Evaluation';
import SLA_Renewal_and_Exit_Process from './components/ServiceLevel/SLA_Renewal_and_Exit_Process';
// import ReportingAndAnalysis_Vendor from './components/VendorManagement/Reporting_and_Analysis';
import Vendor_Reporting_and_Analysis from './components/VendorManagement/Reporting_and_Analysis';
import KPIPage from './components/KPI/KPI';
import ComplaintPage from './components/Complaint/Complaint';
import TransitionChecklistsPage from './components/TransitionChecklist/TransitionChecklists';
import PostTransitionChecklistsPage from './components/TransitionChecklist/PostTransitionChecklists';
import DailyReportsPage from './components/DailyTaskManagement/DailyReports.tsx';
import TrainingReportPage from './components/BackOffice/TrainingReport.tsx';
import SiteVisitPage from './components/BackOffice/SiteVisit.tsx';
import EscalationMatrix from './components/BackOffice/EscalationMatrix.tsx';
import MinutesOfMeetingPage from './components/BackOffice/MinutesofMeeting.tsx';
import NightPatrollingPage from './components/BackOffice/NightPatrolling.tsx';
import InteriorWorkPermitPage from './components/Workpermit/Interior.tsx';
import VehicleEntryPermitPage from './components/Workpermit/Vehicle.tsx';
import HotWorkPermitPage from './components/Workpermit/HotWork.tsx';
import ColdWorkPermitPage from './components/Workpermit/ColdWork.tsx';
import ElectricalWorkPermitPage from './components/Workpermit/ElectricalWork.tsx';
import HeightWorkPermitPage from './components/Workpermit/HeightWork.tsx';
import ConfinedSpaceWorkPage from './components/Workpermit/ConfinedSpacework.tsx';
import ExcavationPermitPage from './components/Workpermit/ExcavationPermit.tsx';
import LockoutTagoutPermitPage from './components/Workpermit/LockoutTagout.tsx';
import ChemicalWorkPermitPage from './components/Workpermit/Chemical.tsx'; 
import Preloader from './components/Preloader';
import Unauthorized from './pages/Unauthorized';
import LiftingPage from './components/Workpermit/Lifting.tsx';
import DemolitionPage from './components/Workpermit/Demolition.tsx';
import TemporaryStructurePage from './components/Workpermit/TemporaryStrucure.tsx';
import GeneralMaintenancePage from './components/Workpermit/GeneralMaintainence.tsx';
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
        <Route index element={
          user?.userType === 'property_user' ? 
            <Navigate to="/user-property" replace /> : 
            <Navigate to="/profile" replace />
        } />
        {/* <Route path="dashboard" element={<Dashboard />} /> */}
        <Route path="dashboard" element={<Dashboard />} />
        {/* <Route path="users" element={<div className="p-4">User Management Page</div>} /> */}
        <Route path="users" element={<UserProfile />} />
        {/* <Route path="properties" element={<div className="p-4">Properties Management Page</div>} /> */}
        <Route path="tasks" element={<Tasks />} />
        <Route path="staff-categories" element={<Staff />} />
        <Route path="properties" element={<PropertiesProfiles />} />
        <Route path="properties/:propertyId/users" element={<PropertyUsers />} />
        <Route path="property-user-management" element={<PropertyUserManagement />} />
        <Route path="user-role-management" element={<UserRoleManagement />} />
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
        <Route path="daily-management-report" element={<DailyManagementReport />} />
        <Route path="daily-reports" element={<DailyReports />} />
        <Route path="monthly-task-management" element={<MonthlyTask />} />
        <Route path="52-week-work-calendar" element={<WeekCalendar />} />
        <Route path="52-week-training" element={<WeekTraining />} />
        <Route path="incident-report" element={<IncidentReportPage />} />
        <Route path="night-patrolling-report" element={<NightIncidentPage />} />
        <Route path="site-security-patrolling-report" element={<SiteSecurityPage />} />
        <Route path="technical-team-patrolling-report" element={<TechnicalTeamPatrollingPage />} />
        <Route path="audit-reports" element={<AuditReportPage />} />
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
        
        {/* Inventory Management Routes */}
        <Route path="inventory-tracking" element={<InventoryTracking />} />
        <Route path="stock-entry-issue" element={<StockEntryIssue />} />
        <Route path="min-max-level-monitoring" element={<MinMaxLevelMonitoring />} />
        <Route path="consumption-reports" element={<ConsumptionReports />} />
        <Route path="expiry-damage-log" element={<ExpiryDamageLog />} />

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
        {/* Cadmin - Property User Management */}
        <Route path="cadmin/property-user-management" element={<PropertyUserManagement />} />
        <Route path="cadmin/user-role-management" element={<UserRoleManagement />} />
        <Route path="cadmin/assets-management" element={<CadminAssetManagement />} />
        <Route path="cadmin/inventory-management" element={<CadminInventoryManagement />} />

        {/* Cadmin - Daily Task Management */}
        <Route path="cadmin/daily-task-management-all-department" element={<DailyTaskManagementAllDepartment />} />
        <Route path="cadmin/daily-management-report" element={<DailyManagementReport />} />
        <Route path="cadmin/daily-reports" element={<DailyReports />} />

        {/* Cadmin - Monthly Task Management */}
        <Route path="cadmin/monthly-task-management" element={<MonthlyTask />} />

        {/* Cadmin - 52 Week */}
        <Route path="cadmin/52-week-work-calendar" element={<WeekCalendar />} />
        <Route path="cadmin/52-week-training" element={<WeekTraining />} />
        <Route path="cadmin/52-week-training-calendar" element={<WeekTraining />} />

        {/* Cadmin - Incident & Patrolling */}
        <Route path="cadmin/incident-report" element={<CIncidentReportPage />} />
        <Route path="cadmin/night-patrolling-report" element={<CNightIncidentPage />} />
        <Route path="cadmin/site-security-patrolling-report" element={<CSiteSecurityPage />} />
        <Route path="cadmin/technical-team-patrolling-report" element={<CTechnicalTeamPatrollingPage />} />

        {/* Cadmin - Reports and Audit */}
        <Route path="cadmin/audit-reports" element={<CAuditReportPage />} />

        {/* Cadmin - Transition Management */}
        <Route path="cadmin/transition-checklists" element={<TransitionChecklistsPage />} />
        <Route path="cadmin/post-transition-checklist" element={<PostTransitionChecklistsPage />} />

        {/* Cadmin - Gate Management */}
        <Route path="cadmin/visitor-management" element={<CVisitorManagement />} />
        <Route path="cadmin/inward-non-returnable" element={<CInwardNonReturnable />} />
        <Route path="cadmin/inward-returnable" element={<CInwardReturnable />} />
        <Route path="cadmin/outward-non-returnable" element={<COutwardNonReturnable />} />
        <Route path="cadmin/outward-returnable" element={<COutwardReturnable />} />
        <Route path="cadmin/move-in" element={<CMoveIn />} />
        <Route path="cadmin/move-out" element={<CMoveOut />} />
        <Route path="cadmin/interior-work-tracking" element={<CInteriorWorkTracking />} />
        <Route path="cadmin/work-permit-issuance" element={<CWorkPermitIssuance />} />
        <Route path="cadmin/gate-pass-management" element={<CGatePassManagement />} />  
        <Route path="cadmin/blocklist-management" element={<CBlocklistManagement />} />
        <Route path="cadmin/daily-entry-details" element={<CDailyEntryDetails />} />
        <Route path="cadmin/water-tanker-management" element={<CWaterTankerManagement />} />
        <Route path="cadmin/vendor-entry-management" element={<CVendorEntryManagement />} />
        <Route path="cadmin/sta-entry-management" element={<CStaEntryManagement />} />
        <Route path="cadmin/emergency-contact-details" element={<CEmergencyContactDetails />} />

        {/* Cadmin - Community Management */}
        <Route path="cadmin/tickets-management" element={<CTicketsManagement />} />
        <Route path="cadmin/ticket-assignment" element={<CTicketAssignment />} />
        <Route path="cadmin/notice-management" element={<CNoticeManagement />} />
        <Route path="cadmin/parking-sticker-management" element={<CParkingStickerManagement />} />
        <Route path="cadmin/communication-announcements" element={<CCommunicationAnnouncements />} />
        <Route path="cadmin/move-in-coordination" element={<CMoveInCoordination />} />
        <Route path="cadmin/move-out-coordination" element={<CMoveOutCoordination />} />
        <Route path="cadmin/interior-work-approvals" element={<InteriorWorkApprovals />} />
        <Route path="cadmin/work-permit-tracking" element={<CWorkPermitTracking />} />  

        {/* Cadmin - Asset Management */}
        <Route path="cadmin/asset-tagging-management" element={<CAssetTaggingManagement />} />
        <Route path="cadmin/asset-movement-log" element={<CAssetMovementLog />} />
        <Route path="cadmin/amc-warranty-tracker" element={<CAMCWarrantyTracker />} />
        <Route path="cadmin/maintenance-schedule" element={<CMaintenanceSchedule />} />
        <Route path="cadmin/asset-audit" element={<CAssetAudit />} />
        <Route path="cadmin/depreciation-replacement" element={<CDepreciationReplacement />} />

        {/* Cadmin - Inventory Management */}
        <Route path="cadmin/inventory-tracking" element={<CInventoryTracking />} />
        <Route path="cadmin/stock-entry-issue" element={<CStockEntryIssue />} />
        <Route path="cadmin/min-max-level-monitoring" element={<CMinMaxLevelMonitoring />} />
        <Route path="cadmin/consumption-reports" element={<CConsumptionReports />} />
        <Route path="cadmin/expiry-damage-log" element={<CExpiryDamageLog />} />

        {/* Cadmin - Quality and Process Management */}
        <Route path="cadmin/quality-planning" element={<CQualityPlanning />} />
        <Route path="cadmin/process-management-setup" element={<CProcessManagementSetup />} />
        <Route path="cadmin/quality-assurance" element={<CQualityAssurance />} />
        <Route path="cadmin/quality-control" element={<CQualityControl />} />
        <Route path="cadmin/performance-monitoring" element={<CPerformanceMonitoring />} />
        <Route path="cadmin/documentation-and-reporting" element={<CDocumentationReporting />} />

        {/* Cadmin - Fire and Safety */}
        <Route path="cadmin/site-assessment-and-planning" element={<SiteAssessmentAndPlanning />} />
        <Route path="cadmin/installation-and-equipment-setup" element={<InstallationAndEquipmentSetup />} />
        <Route path="cadmin/fire-safety-documents" element={<FireSafetyDocuments />} />
        <Route path="cadmin/compliance-reports" element={<ComplianceReports />} />
        <Route path="cadmin/fire-and-safety-training" element={<FireAndSafetyTraining />} />
        <Route path="cadmin/daily-checklist" element={<DailyChecklist />} />
        <Route path="cadmin/weekly-checklist" element={<WeeklyChecklist />} />
        <Route path="cadmin/monthly-checklist" element={<MonthlyChecklist />} />
        <Route path="cadmin/quarterly-checklist" element={<QuarterlyChecklist />} />
        <Route path="cadmin/emergency-preparedness-plan" element={<EmergencyPreparednessPlan />} />
        <Route path="cadmin/record-keeping" element={<RecordKeeping />} />

        {/* Cadmin - CCTV Department */}
        <Route path="cadmin/site-assessment" element={<CSiteAssessment />} />
        <Route path="cadmin/system-design-and-planning" element={<CSystemDesignPlanning />} />
        <Route path="cadmin/installation-checklist" element={<CInstallationChecklist />} />
        <Route path="cadmin/configuration-and-testing" element={<CConfigurationTesting />} />
        <Route path="cadmin/daily-operations-and-monitoring" element={<CDailyOperationsMonitoring />} />
        <Route path="cadmin/maintenance-schedule" element={<MaintenanceSchedulePage />} />
        <Route path="cadmin/documentation" element={<CDocumentation />} />
        <Route path="cadmin/amc-and-compliance" element={<CAMCAndCompliance />} />
        <Route path="cadmin/maintenance-schedule-cctv" element={<CCTVMaintenanceSchedule />} />

        {/* Cadmin - Project Management */}
        <Route path="cadmin/project-management" element={<CProjectManagement />} />
        <Route path="cadmin/project-initiation" element={<CProjectInitiation />} />
        <Route path="cadmin/project-planning" element={<CProjectPlanning />} />
        <Route path="cadmin/team-resource-allocation" element={<CTeamResourceAllocation />} />
        <Route path="cadmin/execution-and-implementation" element={<CExecutionAndImplementation />} />
        <Route path="cadmin/monitoring-and-control" element={<CMonitoringAndControl />} />
        <Route path="cadmin/documentation-and-reporting" element={<CDocumentationAndReporting />} />
        <Route path="cadmin/project-closure" element={<CProjectClosure />} />

        {/* Cadmin - Procurement Management */}
        <Route path="cadmin/procurement-planning" element={<ProcurementPlanning />} />
        <Route path="cadmin/vendor-management" element={<VendorManagement />} />
        <Route path="cadmin/purchase-requisition-to-order" element={<PurchaseRequisitionToOrder />} />
        <Route path="cadmin/goods-receipt-and-inspection" element={<GoodsReceiptAndInspection />} /> 
        <Route path="cadmin/inventory-and-stock-management" element={<InventoryAndStockManagement />} />
        <Route path="cadmin/payment-tracking" element={<PaymentTracking />} />
        <Route path="cadmin/procurement-documentation" element={<ProcurementDocumentation />} />
        <Route path="cadmin/compliance-and-policy" element={<ComplianceAndPolicy />} />
        <Route path="cadmin/reporting-and-analysis" element={<ReportingAndAnalysis />} />
        <Route path="cadmin/procurement-categories" element={<ProcurementCategories />} />

        {/* Cadmin - Vendor Management */}
        <Route path="cadmin/vendor-master-management" element={<VendorMasterManagement />} />
        <Route path="cadmin/vendor-classification" element={<VendorClassication />} />
        <Route path="cadmin/vendor-evaluation" element={<VendorEvaluation />} />
        <Route path="cadmin/integration-with-purchase-process" element={<IntegrationWithPurchaseProcess />} />
        <Route path="cadmin/vendor-relationship-management" element={<VendorRelationshipManagement />} />
        <Route path="cadmin/compliance-and-legal-check" element={<ComplianceAndLegalCheck />} />
        <Route path="cadmin/vendor-documentation" element={<VendorDocumentation />} />
        <Route path="cadmin/vendor-reporting-and-analysis" element={<Vendor_Reporting_and_Analysis />} />

        {/* Cadmin - SLA Management */}
        <Route path="cadmin/sla-planning-and-definition" element={<SLA_Planning_and_Denition />} />
        <Route path="cadmin/key-sla-components" element={<Key_SLA_Components />} />
        <Route path="cadmin/sla-implementation" element={<SLA_Implementation />} />
        <Route path="cadmin/sla-monitoring" element={<SLA_Monitoring />} />
        <Route path="cadmin/sla-evaluation" element={<SLA_Evaluation />} />
        <Route path="cadmin/sla-renewal-and-exit-process" element={<SLA_Renewal_and_Exit_Process />} />

        {/* Cadmin - KPI */}
        <Route path="cadmin/kpi" element={<KPIPage />} />

        {/* Cadmin - Complaint */}
        <Route path="cadmin/complaint-management" element={<ComplaintPage />} />

        {/* Cadmin - Back Office */}
        <Route path="cadmin/site-visit-reports" element={<SiteVisitPage />} />
        <Route path="cadmin/training-reports" element={<TrainingReportPage />} />
        <Route path="cadmin/night-patrolling-reports" element={<NightPatrollingPage />} />
        <Route path="cadmin/minutes-of-meetings" element={<MinutesOfMeetingPage />} />
        <Route path="cadmin/escalation-matrix" element={<EscalationMatrix />} />

        {/* Cadmin - Work Permit */}
        <Route path="cadmin/interior-work-permit" element={<InteriorWorkPermitPage />} />
        <Route path="cadmin/vehicle-entry-permit" element={<VehicleEntryPermitPage />} />
        <Route path="cadmin/hot-work-permit" element={<HotWorkPermitPage />} />
        <Route path="cadmin/cold-work-permit" element={<ColdWorkPermitPage />} />
        <Route path="cadmin/electrical-work-permit" element={<ElectricalWorkPermitPage />} />
        <Route path="cadmin/height-work-permit" element={<HeightWorkPermitPage />} />
        <Route path="cadmin/confined-space-work-permit" element={<ConfinedSpaceWorkPage />} />
        <Route path="cadmin/excavation-permit" element={<ExcavationPermitPage />} />
        <Route path="cadmin/lockout-tagout-permit" element={<LockoutTagoutPermitPage />} />
        <Route path="cadmin/chemical-work-permit" element={<ChemicalWorkPermitPage />} />
        <Route path="cadmin/lift-work-permit" element={<LiftingPage />} />
        <Route path="cadmin/demolition-work-permit" element={<DemolitionPage />} />
        <Route path="cadmin/general-maintainence-work-permit" element={<GeneralMaintenancePage />} />
        <Route path="cadmin/temporary-structure-work-permit" element={<TemporaryStructurePage />} />
        <Route path="cadmin/vehicle-work-permit" element={<VehicleEntryPermitPage />} />
        <Route path="cadmin/working-alone-work-permit" element={<VehicleEntryPermitPage />} />

        <Route path="user/tasks" element={<UserTasks />} />
        
        {/* User Routes - Property User Specific */}
        <Route path="user/daily-task-management-all-department" element={<DailyTaskManagementAllDepartment />} />
        <Route path="user/daily-management-report" element={<DailyManagementReport />} />
        <Route path="user/daily-reports" element={<DailyReports />} />
        <Route path="user/monthly-task-management" element={<MonthlyTask />} />
        <Route path="user/52-week-work-calendar" element={<WeekCalendar />} />
        <Route path="user/52-week-training" element={<WeekTraining />} />
        <Route path="user/incident-report" element={<IncidentReportPage />} />
        <Route path="user/night-patrolling-report" element={<NightIncidentPage />} />
        <Route path="user/site-security-patrolling-report" element={<SiteSecurityPage />} />
        <Route path="user/technical-team-patrolling-report" element={<TechnicalTeamPatrollingPage />} />
        <Route path="user/audit-reports" element={<AuditReportPage />} />
        <Route path="user/transition-checklists" element={<TransitionChecklistsPage />} />
        <Route path="user/post-transition-checklist" element={<PostTransitionChecklistsPage />} />
        
        {/* User Gate Management Routes */}
        <Route path="user/visitor-management" element={<VisitorManagement />} />
        <Route path="user/inward-non-returnable" element={<InwardNonReturnable />} />
        <Route path="user/inward-returnable" element={<InwardReturnable />} />
        <Route path="user/outward-non-returnable" element={<OutwardNonReturnable />} />
        <Route path="user/outward-returnable" element={<OutwardReturnable />} />
        <Route path="user/move-in" element={<MoveIn />} />
        <Route path="user/move-out" element={<MoveOut />} />
        <Route path="user/interior-work-tracking" element={<InteriorWorkTracking />} />
        <Route path="user/work-permit-issuance" element={<WorkPermitIssuance />} />
        <Route path="user/gate-pass-management" element={<GatePassManagement />} />  
        <Route path="user/blocklist-management" element={<BlocklistManagement />} />
        <Route path="user/daily-entry-details" element={<DailyEntryDetails />} />
        <Route path="user/water-tanker-management" element={<WaterTankerManagement />} />
        <Route path="user/vendor-entry-management" element={<VendorEntryManagement />} />
        <Route path="user/sta-entry-management" element={<StaEntryManagement />} />
        <Route path="user/emergency-contact-details" element={<EmergencyContactDetails />} />
        
        {/* User Community Management Routes */}
        <Route path="user/tickets-management" element={<TicketsManagement />} />
        <Route path="user/ticket-assignment" element={<TicketAssignment />} />
        <Route path="user/notice-management" element={<NoticeManagement />} />
        <Route path="user/parking-sticker-management" element={<ParkingStickerManagement />} />
        <Route path="user/communication-announcements" element={<CommunicationAnnouncements />} />
        <Route path="user/move-in-coordination" element={<MoveInCoordination />} />
        <Route path="user/move-out-coordination" element={<MoveOutCoordination />} />
        <Route path="user/interior-work-approvals" element={<InteriorWorkApprovals />} />
        <Route path="user/work-permit-tracking" element={<WorkPermitTracking />} />
        
        {/* User Asset Management Routes */}
        <Route path="user/asset-tagging-management" element={<AssetTaggingManagement />} />
        <Route path="user/asset-movement-log" element={<AssetMovementLog />} />
        <Route path="user/amc-warranty-tracker" element={<AMCWarrantyTracker />} />
        <Route path="user/maintenance-schedule" element={<MaintenanceSchedule />} />
        <Route path="user/asset-audit" element={<AssetAudit />} />
        <Route path="user/depreciation-replacement" element={<DepreciationReplacement />} />
        
        {/* User Inventory Management Routes */}
        <Route path="user/inventory-tracking" element={<InventoryTracking />} />
        <Route path="user/stock-entry-issue" element={<StockEntryIssue />} />
        <Route path="user/min-max-level-monitoring" element={<MinMaxLevelMonitoring />} />
        <Route path="user/consumption-reports" element={<ConsumptionReports />} />
        <Route path="user/expiry-damage-log" element={<ExpiryDamageLog />} />
        
        {/* User Quality and Process Management Routes */}
        <Route path="user/quality-planning" element={<QualityPlanning />} />
        <Route path="user/process-management-setup" element={<ProcessManagementSetup />} />
        <Route path="user/quality-assurance" element={<QualityAssurance />} />
        <Route path="user/quality-control" element={<QualityControl />} />
        <Route path="user/performance-monitoring" element={<PerformanceMonitoring />} />
        <Route path="user/documentation-and-reporting" element={<DocumentationReporting />} />
        
        {/* User Fire and Safety Routes */}
        <Route path="user/site-assessment-and-planning" element={<SiteAssessmentAndPlanning />} />
        <Route path="user/installation-and-equipment-setup" element={<InstallationAndEquipmentSetup />} />
        <Route path="user/fire-safety-documents" element={<FireSafetyDocuments />} />
        <Route path="user/compliance-reports" element={<ComplianceReports />} />
        <Route path="user/fire-and-safety-training" element={<FireAndSafetyTraining />} />
        <Route path="user/daily-checklist" element={<DailyChecklist />} />
        <Route path="user/weekly-checklist" element={<WeeklyChecklist />} />
        <Route path="user/monthly-checklist" element={<MonthlyChecklist />} />
        <Route path="user/quarterly-checklist" element={<QuarterlyChecklist />} />
        <Route path="user/emergency-preparedness-plan" element={<EmergencyPreparednessPlan />} />
        <Route path="user/record-keeping" element={<RecordKeeping />} />
        
        {/* User CCTV Department Routes */}
        <Route path="user/site-assessment" element={<SiteAssessment />} />
        <Route path="user/system-design-and-planning" element={<SystemDesignPlanningPage />} />
        <Route path="user/installation-checklist" element={<InstallationChecklist />} />
        <Route path="user/configuration-and-testing" element={<ConfigurationTestingPage />} />
        <Route path="user/daily-operations-and-monitoring" element={<DailyOperationsMonitoringPage />} />
        <Route path="user/maintenance-schedule" element={<MaintenanceSchedulePage />} />
        <Route path="user/documentation" element={<Documentation />} />
        <Route path="user/amc-and-compliance" element={<AmcAndCompliance />} />
        
        {/* User Project Management Routes */}
        <Route path="user/project-management" element={<ProjectManagement />} />
        <Route path="user/project-initiation" element={<ProjectInitiation />} />
        <Route path="user/project-planning" element={<ProjectPlanning />} />
        <Route path="user/team-resource-allocation" element={<TeamResourceAllocation />} />
        <Route path="user/execution-and-implementation" element={<ExecutionAndImplementation />} />
        <Route path="user/monitoring-and-control" element={<MonitoringAndControl />} />
        <Route path="user/documentation-and-reporting" element={<DocumentationAndReporting />} />
        <Route path="user/project-closure" element={<ProjectClosure />} />
        
        {/* User Procurement Management Routes */}
        <Route path="user/procurement-planning" element={<ProcurementPlanning />} />
        <Route path="user/vendor-management" element={<VendorManagement />} />
        <Route path="user/purchase-requisition-to-order" element={<PurchaseRequisitionToOrder />} />
        <Route path="user/goods-receipt-and-inspection" element={<GoodsReceiptAndInspection />} /> 
        <Route path="user/inventory-and-stock-management" element={<InventoryAndStockManagement />} />
        <Route path="user/payment-tracking" element={<PaymentTracking />} />
        <Route path="user/procurement-documentation" element={<ProcurementDocumentation />} />
        <Route path="user/compliance-and-policy" element={<ComplianceAndPolicy />} />
        <Route path="user/reporting-and-analysis" element={<ReportingAndAnalysis />} />
        <Route path="user/procurement-categories" element={<ProcurementCategories />} />
        
        {/* User Vendor Management Routes */}
        <Route path="user/vendor-master-management" element={<VendorMasterManagement />} />
        <Route path="user/vendor-classification" element={<VendorClassication />} />
        <Route path="user/vendor-evaluation" element={<VendorEvaluation />} />
        <Route path="user/integration-with-purchase-process" element={<IntegrationWithPurchaseProcess />} />
        <Route path="user/vendor-relationship-management" element={<VendorRelationshipManagement />} />
        <Route path="user/compliance-and-legal-check" element={<ComplianceAndLegalCheck />} />
        <Route path="user/vendor-documentation" element={<VendorDocumentation />} />
        <Route path="user/reporting-and-analysis" element={<Vendor_Reporting_and_Analysis />} />
        
        {/* User SLA Management Routes */}
        <Route path="user/sla-planning-and-definition" element={<SLA_Planning_and_Denition />} />
        <Route path="user/key-sla-components" element={<Key_SLA_Components />} />
        <Route path="user/sla-implementation" element={<SLA_Implementation />} />
        <Route path="user/sla-monitoring" element={<SLA_Monitoring />} />
        <Route path="user/sla-evaluation" element={<SLA_Evaluation />} />
        <Route path="user/sla-renewal-and-exit-process" element={<SLA_Renewal_and_Exit_Process />} />
        
        {/* User KPI Management Routes */}
        <Route path="user/kpi" element={<KPIPage />} />
        
        {/* User Complaint Management Routes */}
        <Route path="user/complaint-management" element={<ComplaintPage />} />
        
        {/* User Back-End Office Management Routes */}
        <Route path="user/site-visit-reports" element={<SiteVisitPage />} />
        <Route path="user/training-reports" element={<TrainingReportPage />} />
        <Route path="user/night-patrolling-reports" element={<NightPatrollingPage />} />
        <Route path="user/minutes-of-meetings" element={<MinutesOfMeetingPage />} />
        <Route path="user/escalation-matrix" element={<EscalationMatrix />} />
        
        {/* User Work Permit Routes */}
        <Route path="user/interior-work-permit" element={<InteriorWorkPermitPage />} />
        <Route path="user/vehicle-entry-permit" element={<VehicleEntryPermitPage />} />
        <Route path="user/hot-work-permit" element={<HotWorkPermitPage />} />
        <Route path="user/cold-work-permit" element={<ColdWorkPermitPage />} />
        <Route path="user/electrical-work-permit" element={<ElectricalWorkPermitPage />} />
        <Route path="user/height-work-permit" element={<HeightWorkPermitPage />} />
        <Route path="user/confined-space-work-permit" element={<ConfinedSpaceWorkPage />} />
        <Route path="user/excavation-permit" element={<ExcavationPermitPage />} />
        <Route path="user/lockout-tagout-permit" element={<LockoutTagoutPermitPage />} />
        <Route path="user/chemical-work-permit" element={<ChemicalWorkPermitPage />} />
        <Route path="user/lift-work-permit" element={<LiftingPage />} />
        <Route path="user/demolition-work-permit" element={<DemolitionPage />} />
        <Route path="user/general-maintenance-work-permit" element={<GeneralMaintenancePage />} />
        <Route path="user/temporary-structure-work-permit" element={<TemporaryStructurePage />} />
        <Route path="user/working-alone-work-permit" element={<VehicleEntryPermitPage />} />

        {/* UserProperty Routes - Edit-only access for property users */}
        <Route path="user-property" element={<UserPropertyLayout />}>
          <Route index element={<UserPropertyDashboard />} />
          <Route path="dashboard" element={<UserPropertyDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="daily-reports" element={<UserPropertyDailyReports />} />
          <Route path="monthly-task-management" element={<UserPropertyMonthlyTask />} />
          <Route path="52-week-work-calendar" element={<UserProperty52WeekCalender />} />
          <Route path="52-week-training-calendar" element={<UserProperty52WeekTraining />} />
          <Route path="incident-report" element={<UserPropertyIncidentReport />} />
          <Route path="site-security-patrolling" element={<UserPropertySiteSecurity />} />
          <Route path="technical-team-patrolling" element={<UserPropertyTechnicalPatrolling />} />
          <Route path="night-incident-patrolling" element={<UserPropertyNightIncident />} />
          <Route path="audit-reports" element={<UserPropertyAuditReport />} />
          <Route path="site-pre-transition" element={<UserPropertySitePreTransition />} />
          <Route path="post-transition" element={<UserPropertyPostTransition />} />
        </Route>

        {/* Quality and Process Management Routes */}
        <Route path="quality-planning" element={<QualityPlanning />} />
        <Route path="process-management-setup" element={<ProcessManagementSetup />} />
        <Route path="quality-assurance" element={<QualityAssurance />} />
        <Route path="quality-control" element={<QualityControl />} />
        <Route path="performance-monitoring" element={<PerformanceMonitoring />} />
        <Route path="documentation-and-reporting" element={<DocumentationReporting />} />

        {/* Fire and Safety Routes */}
        <Route path="site-assessment-and-planning" element={<SiteAssessmentAndPlanning />} />
        <Route path="installation-and-equipment-setup" element={<InstallationAndEquipmentSetup />} />
        <Route path="fire-safety-documents" element={<FireSafetyDocuments />} />
        <Route path="compliance-reports" element={<ComplianceReports />} />
        <Route path="fire-and-safety-training" element={<FireAndSafetyTraining />} />
        <Route path="daily-checklist" element={<DailyChecklist />} />
        <Route path="weekly-checklist" element={<WeeklyChecklist />} />
        <Route path="monthly-checklist" element={<MonthlyChecklist />} />
        <Route path="quarterly-checklist" element={<QuarterlyChecklist />} />
        <Route path="emergency-preparedness-plan" element={<EmergencyPreparednessPlan />} />
        <Route path="record-keeping" element={<RecordKeeping />} />

        {/* CCTV Department Routes */}
        <Route path="site-assessment" element={<SiteAssessment />} />
        <Route path="system-design-and-planning" element={<SystemDesignPlanningPage />} />
        <Route path="installation-checklist" element={<InstallationChecklist />} />
        <Route path="configuration-and-testing" element={<ConfigurationTestingPage />} />
        <Route path="daily-operations-and-monitoring" element={<DailyOperationsMonitoringPage />} />
        <Route path="maintenance-schedule" element={<MaintenanceSchedulePage />} />
        <Route path="documentation" element={<Documentation />} />
        <Route path="amc-and-compliance" element={<AmcAndCompliance />} />

        {/* Project Management Routes */}
        <Route path="project-management" element={<ProjectManagement />} />
        <Route path="project-initiation" element={<ProjectInitiation />} />
        <Route path="project-planning" element={<ProjectPlanning />} />
        <Route path="team-resource-allocation" element={<TeamResourceAllocation />} />
        <Route path="execution-and-implementation" element={<ExecutionAndImplementation />} />
        <Route path="monitoring-and-control" element={<MonitoringAndControl />} />
        <Route path="documentation-and-reporting" element={<DocumentationAndReporting />} />
        <Route path="project-closure" element={<ProjectClosure />} />

        {/* Procurement Management Routes */}
        <Route path="procurement-planning" element={<ProcurementPlanning />} />
        <Route path="vendor-management" element={<VendorManagement />} />
        <Route path="purchase-requisition-to-order" element={<PurchaseRequisitionToOrder />} />
        <Route path="goods-receipt-and-inspection" element={<GoodsReceiptAndInspection />} /> 
        <Route path="inventory-and-stock-management" element={<InventoryAndStockManagement />} />
        <Route path="payment-tracking" element={<PaymentTracking />} />
        <Route path="procurement-documentation" element={<ProcurementDocumentation />} />
        <Route path="compliance-and-policy" element={<ComplianceAndPolicy />} />
        <Route path="reporting-and-analysis" element={<ReportingAndAnalysis />} />
        <Route path="procurement-categories" element={<ProcurementCategories />} />

        {/* Vendor Management Routes */}
        <Route path="vendor-master-management" element={<VendorMasterManagement />} />
        <Route path="vendor-classication" element={<VendorClassication />} />
        {/* Alias for correct spelling to avoid redirect issues */}
        <Route path="vendor-classification" element={<VendorClassication />} />
        <Route path="vendor-evaluation" element={<VendorEvaluation />} />
        <Route path="integration-with-purchase-process" element={<IntegrationWithPurchaseProcess />} />
        <Route path="vendor-relationship-management" element={<VendorRelationshipManagement />} />
        <Route path="compliance-and-legal-check" element={<ComplianceAndLegalCheck />} />
        <Route path="vendor-documentation" element={<VendorDocumentation />} />
        <Route path="reporting-and-analysis" element={<Vendor_Reporting_and_Analysis />} />

        {/* SLA Management Routes */}
        <Route path="sla-planning-and-denition" element={<SLA_Planning_and_Denition />} />
        <Route path="key-sla-components" element={<Key_SLA_Components />} />
        <Route path="sla-implementation" element={<SLA_Implementation />} />
        <Route path="sla-monitoring" element={<SLA_Monitoring />} />
        <Route path="sla-evaluation" element={<SLA_Evaluation />} />
        <Route path="sla-renewal-and-exit-process" element={<SLA_Renewal_and_Exit_Process />} />

        {/* KPI Management Routes */}
        <Route path="kpi" element={<KPIPage />} />

        {/* Complaint Management Routes */}
        <Route path="complaint-management" element={<ComplaintPage />} />

        {/* Transition Checklists Routes */}
        <Route path="transition-checklists" element={<TransitionChecklistsPage />} />
        <Route path="post-transition-checklist" element={<PostTransitionChecklistsPage />} />

        {/* Daily Task Management Routes */}
        <Route path="daily-reports" element={<DailyReportsPage />} />

        {/* 52 Week Training Routes */}
        <Route path="52-week-training-calendar" element={<WeekTraining />} />

        {/* Training Reports Routes */}
        <Route path="training-reports" element={<TrainingReportPage />} />

        {/* Site Visit Reports Routes */}
        <Route path="site-visit-reports" element={<SiteVisitPage />} />

        {/* Night Patrolling Reports Routes */}
        <Route path="night-patrolling-reports" element={<NightPatrollingPage />} />

        {/* Minutes of Meetings Routes */}
        <Route path="minutes-of-meetings" element={<MinutesOfMeetingPage />} />

        {/* Escalation Matrix Routes */}
        <Route path="escalation-matrix" element={<EscalationMatrix />} />

        {/* Interior Work Permit Routes */}
        <Route path="interior-work-permit" element={<InteriorWorkPermitPage />} />

        {/* Vehicle Entry Permit Routes */}
        <Route path="vehicle-entry-permit" element={<VehicleEntryPermitPage />} />

        {/* Hot Work Permit Routes */}
        <Route path="hot-work-permit" element={<HotWorkPermitPage />} />

        {/* Cold Work Permit Routes */}
        <Route path="cold-work-permit" element={<ColdWorkPermitPage />} />

        {/* Electrical Work Permit Routes */}
        <Route path="electrical-work-permit" element={<ElectricalWorkPermitPage />} />

        {/* Height Work Permit Routes */}
        <Route path="height-work-permit" element={<HeightWorkPermitPage />} />
        
        {/* Confined Space Work Permit Routes */}
        <Route path="confined-space-work-permit" element={<ConfinedSpaceWorkPage />} />

        {/* Excavation Permit Routes */}
        <Route path="excavation-permit" element={<ExcavationPermitPage />} />
        
        {/* Lockout Tagout Permit Routes */}
        <Route path="lockout-tagout-permit" element={<LockoutTagoutPermitPage />} />

        {/* Chemical Work Permit Routes */}
        <Route path="chemical-work-permit" element={<ChemicalWorkPermitPage />} />

        {/* Lift Work Permit Routes */}
        <Route path="lift-work-permit" element={<LiftingPage />} />

        {/* Demolition Work Permit Routes */}
        <Route path="demolition-work-permit" element={<DemolitionPage />} />
        
        {/* General Maintainence Work Permit Routes */}
        <Route path="general-maintainence-work-permit" element={<GeneralMaintenancePage />} />

        {/* Temporary Structure Work Permit Routes */}
        <Route path="temporary-structure-work-permit" element={<TemporaryStructurePage />} />
        
        {/* Vehicle Work Permit Routes */}
        <Route path="vehicle-work-permit" element={<VehicleEntryPermitPage />} />

        {/* Interior Work Permit Routes */}
        <Route path="interior-work-permit" element={<InteriorWorkPermitPage />} />

        {/* Working Alone Work Permit Routes */}
        <Route path="working-alone-work-permit" element={<VehicleEntryPermitPage />} />
        

      </Route>

      {/* Catch all unmatched routes */}
      <Route path="*" element={
        <Navigate to={
          !isAuthenticated ? "/login" : 
          user?.status === 'active' ? 
            (user?.userType === 'property_user' ? "/daily-task-management-all-department" : "/profile") : 
            "/verify"
        } replace />  
      } />
      {/* Unauthorized route */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
};

function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return (
    <>
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <AppRoutes />
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;