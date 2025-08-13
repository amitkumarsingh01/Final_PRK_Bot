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
import DailyReports from './components/DailyTaskManagement/DailyReports';
import MonthlyTask from './components/MonthlyTaskManagement/MonthlyTask';
import WeekCalendar from './components/52Week/52WeekCalender';
import WeekTraining from './components/52Week/52WeekTraining.tsx';
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
import InventoryTracking from './components/InventoryManagement/InventoryTracking';
import StockEntryIssue from './components/InventoryManagement/StockEntryIssue';
import MinMaxLevelMonitoring from './components/InventoryManagement/MinMaxLevelMonitoring';
import ConsumptionReports from './components/InventoryManagement/ConsumptionReports';
import ExpiryDamageLog from './components/InventoryManagement/ExpiryDamageLog';
import QualityPlanning from './components/QualityAndProcess.tsx/QualityPlanning';
import ProcessManagementSetup from './components/QualityAndProcess.tsx/ProcessManagementSetup';
import QualityAssurance from './components/QualityAndProcess.tsx/QualityAssurance';
import QualityControl from './components/QualityAndProcess.tsx/QualityControl';
import PerformanceMonitoring from './components/QualityAndProcess.tsx/PerformanceMonitoring';
import DocumentationReporting from './components/QualityAndProcess.tsx/DocumentationReporting';
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
import AuditReportPage from './components/AuditReport/AuditReport';
import ProjectManagement from './components/ProjectManagement/All_Project_Management_Dashboard';
import ProjectInitiation from './components/ProjectManagement/Project_Initiation';
import ProjectPlanning from './components/ProjectManagement/Project_Planning';
import TeamResourceAllocation from './components/ProjectManagement/Team_Resource_Allocation';
import ExecutionAndImplementation from './components/ProjectManagement/Execution_and_Implementation';
import MonitoringAndControl from './components/ProjectManagement/Monitoring_and_Control';
import DocumentationAndReporting from './components/ProjectManagement/Documentation_and_Reporting';
import ProjectClosure from './components/ProjectManagement/Project_Closure';
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
        <Route path="cadmin/assets-management" element={<CadminAssetManagement />} />
        <Route path="cadmin/inventory-management" element={<CadminInventoryManagement />} />

        <Route path="user/tasks" element={<UserTasks />} />

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