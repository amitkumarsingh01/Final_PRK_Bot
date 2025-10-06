import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Calendar, Users, Target, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProjectMaster {
  property_id: string;
  project_initiation: {
    id: string;
    project_id: string;
    project_name: string;
    sponsor: string;
    objective: string;
    start_date: string;
    budget: number;
    status: string;
    project_manager: string;
    stakeholders: string[];
    remarks: string;
    created_at: string;
    updated_at: string;
  };
  project_planning?: {
    id: string;
    plan_id: string;
    scope: string;
    milestones: string[];
    start_date: string;
    end_date: string;
    resources_required: string[];
    risk_assessment: string;
    status: string;
    remarks: string;
  };
  project_closure?: {
    id: string;
    closure_id: string;
    completion_date: string;
    final_budget: number;
    deliverables: string[];
    lessons_learned: string;
    status: string;
    remarks: string;
  };
  team_resource_allocation: Array<{
    id: string;
    allocation_id: string;
    team_member: string;
    role: string;
    allocation_start_date: string;
    allocation_end_date: string;
    hours_allocated: number;
    department: string;
    status: string;
    remarks: string;
  }>;
  execution_implementation: Array<{
    id: string;
    task_id: string;
    task_description: string;
    assigned_to: string;
    start_date: string;
    due_date: string;
    progress: number;
    status: string;
    priority: string;
    remarks: string;
  }>;
  monitoring_control: Array<{
    id: string;
    monitor_id: string;
    kpi_metric: string;
    target: number;
    actual: number;
    variance: number;
    date_checked: string;
    status: string;
    remarks: string;
  }>;
  documentation_reporting: Array<{
    id: string;
    document_id: string;
    document_type: string;
    title: string;
    created_date: string;
    author: string;
    status: string;
    storage_location: string;
    remarks: string;
  }>;
  depreciation_replacement: Array<{
    id: string;
    depreciation_id: string;
    asset_id: string;
    asset_name: string;
    purchase_date: string;
    purchase_cost: number;
    depreciation_method: string;
    annual_depreciation: number;
    current_value: number;
    replacement_date: string;
    status: string;
    remarks: string;
  }>;
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const ProjectManagementDashboard: React.FC = () => {
  console.log('🚀 ProjectManagementDashboard: Component initialized');
  const { user } = useAuth();
  console.log('👤 ProjectManagementDashboard: User loaded', { userId: user?.userId });
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      setError(null);
      setLoading(true);
      try {
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
        const arr = Array.isArray(res.data) ? res.data : [];
        const filtered = user?.propertyId ? arr.filter((p: ProjectMaster) => p.property_id === user.propertyId) : arr;
        setProjects(filtered);
      } catch (e) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.token, user?.propertyId]);
  const [viewModal, setViewModal] = useState<{ open: boolean; project: ProjectMaster | null }>({ open: false, project: null });
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const handleView = (project: ProjectMaster) => {
    setViewModal({ open: true, project });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (tasks: any[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Project Management Dashboard</h2>
      
      {/* Property Display */}
      <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
            </div>
          </div>
        </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {isAdmin && (
        <button
          onClick={() => window.location.assign('/cadmin/project-initiation')}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add New Project
        </button>
      )}

      {/* Statistics Cards */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.project_initiation.status === 'Completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.project_initiation.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((total, p) => total + p.team_resource_allocation.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project ID</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Manager</th>
              <th className="px-3 py-2 border">Start Date</th>
              <th className="px-3 py-2 border">Budget</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Progress</th>
              <th className="px-3 py-2 border">Team Size</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6">
                  <div className="flex items-center justify-center gap-3">
                    <span>No projects found</span>
                    {isAdmin && (
                      <button onClick={() => window.location.assign('/cadmin/project-initiation')} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Project</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project, idx) => (
                <tr key={project.project_initiation.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">{project.project_initiation.project_id}</td>
                  <td className="border px-2 py-1 font-medium">{project.project_initiation.project_name}</td>
                  <td className="border px-2 py-1">{project.project_initiation.project_manager}</td>
                  <td className="border px-2 py-1">{project.project_initiation.start_date}</td>
                  <td className="border px-2 py-1">₹{project.project_initiation.budget.toLocaleString()}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.project_initiation.status)}`}>
                      {project.project_initiation.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${calculateProgress(project.execution_implementation)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{calculateProgress(project.execution_implementation)}%</span>
                  </td>
                  <td className="border px-2 py-1">{project.team_resource_allocation.length}</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(project)} className="text-blue-600">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Project Modal */}
      {viewModal.open && viewModal.project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Details: {viewModal.project.project_initiation.project_name}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, project: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                {['overview', 'planning', 'team', 'tasks', 'monitoring', 'documents', 'assets'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      selectedTab === tab
                        ? 'border-[#FB7E03] text-[#FB7E03]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {selectedTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><b>Project ID:</b> {viewModal.project.project_initiation.project_id}</div>
                  <div><b>Project Name:</b> {viewModal.project.project_initiation.project_name}</div>
                  <div><b>Sponsor:</b> {viewModal.project.project_initiation.sponsor}</div>
                  <div><b>Project Manager:</b> {viewModal.project.project_initiation.project_manager}</div>
                  <div><b>Start Date:</b> {viewModal.project.project_initiation.start_date}</div>
                  <div><b>Budget:</b> ₹{viewModal.project.project_initiation.budget.toLocaleString()}</div>
                  <div><b>Status:</b> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.project.project_initiation.status)}`}>
                      {viewModal.project.project_initiation.status}
                    </span>
                  </div>
                  <div><b>Stakeholders:</b> {viewModal.project.project_initiation.stakeholders.join(', ')}</div>
                  <div className="col-span-2"><b>Objective:</b> {viewModal.project.project_initiation.objective}</div>
                  <div className="col-span-2"><b>Remarks:</b> {viewModal.project.project_initiation.remarks}</div>
                </div>
              )}

              {selectedTab === 'planning' && viewModal.project.project_planning && (
                <div className="grid grid-cols-2 gap-4">
                  <div><b>Plan ID:</b> {viewModal.project.project_planning.plan_id}</div>
                  <div><b>Status:</b> {viewModal.project.project_planning.status}</div>
                  <div><b>Start Date:</b> {viewModal.project.project_planning.start_date}</div>
                  <div><b>End Date:</b> {viewModal.project.project_planning.end_date}</div>
                  <div className="col-span-2"><b>Scope:</b> {viewModal.project.project_planning.scope}</div>
                  <div className="col-span-2"><b>Milestones:</b> {viewModal.project.project_planning.milestones.join(', ')}</div>
                  <div className="col-span-2"><b>Resources Required:</b> {viewModal.project.project_planning.resources_required.join(', ')}</div>
                  <div className="col-span-2"><b>Risk Assessment:</b> {viewModal.project.project_planning.risk_assessment}</div>
                  <div className="col-span-2"><b>Remarks:</b> {viewModal.project.project_planning.remarks}</div>
                </div>
              )}

              {selectedTab === 'team' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border">Member</th>
                        <th className="px-3 py-2 border">Role</th>
                        <th className="px-3 py-2 border">Department</th>
                        <th className="px-3 py-2 border">Allocation Period</th>
                        <th className="px-3 py-2 border">Hours</th>
                        <th className="px-3 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.project.team_resource_allocation.map((member, idx) => (
                        <tr key={member.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{member.team_member}</td>
                          <td className="border px-2 py-1">{member.role}</td>
                          <td className="border px-2 py-1">{member.department}</td>
                          <td className="border px-2 py-1">{member.allocation_start_date} - {member.allocation_end_date}</td>
                          <td className="border px-2 py-1">{member.hours_allocated}</td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(member.status)}`}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTab === 'tasks' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border">Task ID</th>
                        <th className="px-3 py-2 border">Description</th>
                        <th className="px-3 py-2 border">Assigned To</th>
                        <th className="px-3 py-2 border">Due Date</th>
                        <th className="px-3 py-2 border">Progress</th>
                        <th className="px-3 py-2 border">Priority</th>
                        <th className="px-3 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.project.execution_implementation.map((task, idx) => (
                        <tr key={task.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{task.task_id}</td>
                          <td className="border px-2 py-1">{task.task_description}</td>
                          <td className="border px-2 py-1">{task.assigned_to}</td>
                          <td className="border px-2 py-1">{task.due_date}</td>
                          <td className="border px-2 py-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{task.progress}%</span>
                          </td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTab === 'monitoring' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border">KPI Metric</th>
                        <th className="px-3 py-2 border">Target</th>
                        <th className="px-3 py-2 border">Actual</th>
                        <th className="px-3 py-2 border">Variance</th>
                        <th className="px-3 py-2 border">Date Checked</th>
                        <th className="px-3 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.project.monitoring_control.map((monitor, idx) => (
                        <tr key={monitor.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{monitor.kpi_metric}</td>
                          <td className="border px-2 py-1">{monitor.target}</td>
                          <td className="border px-2 py-1">{monitor.actual}</td>
                          <td className="border px-2 py-1">{monitor.variance}</td>
                          <td className="border px-2 py-1">{monitor.date_checked}</td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(monitor.status)}`}>
                              {monitor.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTab === 'documents' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border">Document ID</th>
                        <th className="px-3 py-2 border">Type</th>
                        <th className="px-3 py-2 border">Title</th>
                        <th className="px-3 py-2 border">Author</th>
                        <th className="px-3 py-2 border">Created Date</th>
                        <th className="px-3 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.project.documentation_reporting.map((doc, idx) => (
                        <tr key={doc.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{doc.document_id}</td>
                          <td className="border px-2 py-1">{doc.document_type}</td>
                          <td className="border px-2 py-1">{doc.title}</td>
                          <td className="border px-2 py-1">{doc.author}</td>
                          <td className="border px-2 py-1">{doc.created_date}</td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTab === 'assets' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 border">Asset ID</th>
                        <th className="px-3 py-2 border">Asset Name</th>
                        <th className="px-3 py-2 border">Purchase Cost</th>
                        <th className="px-3 py-2 border">Current Value</th>
                        <th className="px-3 py-2 border">Depreciation Method</th>
                        <th className="px-3 py-2 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.project.depreciation_replacement.map((asset, idx) => (
                        <tr key={asset.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{asset.asset_id}</td>
                          <td className="border px-2 py-1">{asset.asset_name}</td>
                          <td className="border px-2 py-1">₹{asset.purchase_cost.toLocaleString()}</td>
                          <td className="border px-2 py-1">₹{asset.current_value.toLocaleString()}</td>
                          <td className="border px-2 py-1">{asset.depreciation_method}</td>
                          <td className="border px-2 py-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementDashboard;
