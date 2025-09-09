import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../../context/AuthContext';
import { Building, Plus, Pencil, Trash2, Eye, Save, X, FileText, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  title?: string;
  description?: string;
  logo_base64?: string;
}

interface Task {
  time: string;
  task_description: string;
  person_responsible: string;
  status_remarks: string;
}

interface Departments {
  security: Task[];
  housekeeping: Task[];
  technical_maintenance: Task[];
  facility_soft_services: Task[];
}

interface WorkSummary {
  department: string;
  tasks_planned: number;
  completed: number;
  pending: number;
  remarks: string;
}

interface SiteReport {
  id: number;
  property_id: string;
  date: string;
  site_name: string;
  prepared_by: string;
  shift: 'Morning' | 'Evening' | 'Night';
  departments: Departments;
  summary_of_work_updates: WorkSummary[];
}

const API_URL = 'https://server.prktechindia.in/reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const CDailyReportsPage: React.FC = () => {
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [reports, setReports] = useState<SiteReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewModal, setViewModal] = useState<{ open: boolean; data: any; title?: string }>({ open: false, data: null });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: SiteReport | null;
    isNew: boolean;
  }>({ open: false, data: null, isNew: false });


  // Load profile to detect role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const profile = await response.json();
        setIsAdmin(profile?.user_role === 'admin');
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch reports for user's property
  const fetchReports = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`);
      setReports(res.data || []);
    } catch (e) {
      setError('Failed to fetch daily reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.propertyId) fetchReports();
  }, [user?.propertyId]);


  const openView = (report: SiteReport) => setViewModal({ open: true, data: report, title: 'Daily Report Details' });

  const getEmptyReport = (): Omit<SiteReport, 'id'> => ({
    property_id: user?.propertyId || '',
    date: new Date().toLocaleDateString('en-GB'),
    site_name: '',
    prepared_by: user?.userId || '',
    shift: 'Morning',
    departments: {
      security: [],
      housekeeping: [],
      technical_maintenance: [],
      facility_soft_services: [],
    },
    summary_of_work_updates: [],
  });

  const openAdd = () => {
    if (!isAdmin) return alert('Only admins can add reports');
    setEditModal({ open: true, data: getEmptyReport() as SiteReport, isNew: true });
  };

  const openEdit = (report: SiteReport) => {
    if (!isAdmin) return alert('Only admins can edit reports');
    setEditModal({ open: true, data: { ...report }, isNew: false });
  };

  const closeModals = () => {
    setViewModal({ open: false, data: null });
    setEditModal({ open: false, data: null, isNew: false });
  };

  const handleDelete = async (reportId: number) => {
    if (!isAdmin) return alert('Only admins can delete reports');
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}${reportId}`);
      await fetchReports();
    } catch (e) {
      setError('Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editModal.data) return;

    try {
      setLoading(true);
      if (editModal.isNew) {
        await axios.post(API_URL, editModal.data);
      } else {
        await axios.put(`${API_URL}${editModal.data.id}`, editModal.data);
      }
      closeModals();
      await fetchReports();
    } catch (e) {
      setError('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const addTask = (department: keyof Departments) => {
    if (!editModal.data) return;
    
    const newTask: Task = {
      time: '',
      task_description: '',
      person_responsible: '',
      status_remarks: '',
    };

    const updatedData = { ...editModal.data };
    updatedData.departments[department] = [...updatedData.departments[department], newTask];
    setEditModal({ ...editModal, data: updatedData });
  };

  const updateTask = (department: keyof Departments, index: number, field: keyof Task, value: string) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.departments[department][index] = {
      ...updatedData.departments[department][index],
      [field]: value,
    };
    setEditModal({ ...editModal, data: updatedData });
  };

  const removeTask = (department: keyof Departments, index: number) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.departments[department] = updatedData.departments[department].filter((_, i) => i !== index);
    setEditModal({ ...editModal, data: updatedData });
  };

  const addWorkSummary = () => {
    if (!editModal.data) return;
    
    const newSummary: WorkSummary = {
      department: '',
      tasks_planned: 0,
      completed: 0,
      pending: 0,
      remarks: '',
    };

    const updatedData = { ...editModal.data };
    updatedData.summary_of_work_updates = [...updatedData.summary_of_work_updates, newSummary];
    setEditModal({ ...editModal, data: updatedData });
  };

  const updateWorkSummary = (index: number, field: keyof WorkSummary, value: string | number) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.summary_of_work_updates[index] = {
      ...updatedData.summary_of_work_updates[index],
      [field]: value,
    };
    setEditModal({ ...editModal, data: updatedData });
  };

  const removeWorkSummary = (index: number) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.summary_of_work_updates = updatedData.summary_of_work_updates.filter((_, i) => i !== index);
    setEditModal({ ...editModal, data: updatedData });
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'Morning':
        return 'text-green-600 bg-green-100';
      case 'Evening':
        return 'text-orange-600 bg-orange-100';
      case 'Night':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
                <p className="text-gray-600">View and manage daily site reports with department tasks and work summaries</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Property</h2>
          </div>
          <div className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
            {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.date === new Date().toLocaleDateString('en-GB')).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Morning Shift</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.shift === 'Morning').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Evening/Night</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.shift === 'Evening' || r.shift === 'Night').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daily Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prepared By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.site_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(report.shift)}`}>
                        {report.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.prepared_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(report.departments).map(([dept, tasks]) => (
                          <span key={dept} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {dept.replace(/_/g, ' ')}: {tasks.length}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => openView(report)} className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(report)} className="text-orange-600 hover:text-orange-900">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(report.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{viewModal.title || 'Report Details'}</h2>
              <button onClick={() => setViewModal({ open: false, data: null })} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div><b>Date:</b> {viewModal.data.date}</div>
                  <div><b>Site:</b> {viewModal.data.site_name}</div>
                  <div><b>Shift:</b> {viewModal.data.shift}</div>
                  <div><b>Prepared By:</b> {viewModal.data.prepared_by}</div>
                </div>
              </div>

              {/* Work Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Work Summary</h3>
                <div className="space-y-2">
                  {viewModal.data.summary_of_work_updates?.map((summary: WorkSummary, idx: number) => (
                    <div key={idx} className="border p-3 rounded">
                      <div><b>Department:</b> {summary.department}</div>
                      <div><b>Planned:</b> {summary.tasks_planned}</div>
                      <div><b>Completed:</b> {summary.completed}</div>
                      <div><b>Pending:</b> {summary.pending}</div>
                      <div><b>Remarks:</b> {summary.remarks}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Department Tasks</h3>
                {Object.entries(viewModal.data.departments || {}).map(([dept, tasks]) => (
                  <div key={dept} className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">{dept.replace(/_/g, ' ')}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Task</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Responsible</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(tasks as Task[]).map((task: Task, idx: number) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-sm text-gray-900">{task.time}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{task.task_description}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{task.person_responsible}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{task.status_remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editModal.isNew ? 'Add New Report' : 'Edit Report'}</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={editModal.data.date}
                  onChange={(e) => setEditModal(m => m && { ...m, data: { ...m.data!, date: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={editModal.data.site_name}
                  onChange={(e) => setEditModal(m => m && { ...m, data: { ...m.data!, site_name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                <input
                  type="text"
                  value={editModal.data.prepared_by}
                  onChange={(e) => setEditModal(m => m && { ...m, data: { ...m.data!, prepared_by: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select
                  value={editModal.data.shift}
                  onChange={(e) => setEditModal(m => m && { ...m, data: { ...m.data!, shift: e.target.value as 'Morning' | 'Evening' | 'Night' } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>

            {/* Departments */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Department Tasks</h3>
              {(['security', 'housekeeping', 'technical_maintenance', 'facility_soft_services'] as const).map((dept) => (
                <div key={dept} className="mb-4 border p-4 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">{dept.replace(/_/g, ' ')}</h4>
                    <button
                      onClick={() => addTask(dept)}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                    >
                      + Add Task
                    </button>
                  </div>
                  {editModal.data?.departments[dept]?.map((task, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 border rounded">
                      <input
                        type="text"
                        placeholder="Time"
                        value={task.time}
                        onChange={(e) => updateTask(dept, idx, 'time', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Task Description"
                        value={task.task_description}
                        onChange={(e) => updateTask(dept, idx, 'task_description', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Person Responsible"
                        value={task.person_responsible}
                        onChange={(e) => updateTask(dept, idx, 'person_responsible', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Status Remarks"
                          value={task.status_remarks}
                          onChange={(e) => updateTask(dept, idx, 'status_remarks', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                        />
                        <button
                          onClick={() => removeTask(dept, idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Work Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Work Summary</h3>
                <button
                  onClick={addWorkSummary}
                  className="text-orange-600 hover:text-orange-800 text-sm"
                >
                  + Add Summary
                </button>
              </div>
              {editModal.data?.summary_of_work_updates?.map((summary: WorkSummary, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2 border rounded">
                  <input
                    type="text"
                    placeholder="Department"
                    value={summary.department}
                    onChange={(e) => updateWorkSummary(idx, 'department', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Planned"
                    value={summary.tasks_planned}
                    onChange={(e) => updateWorkSummary(idx, 'tasks_planned', parseInt(e.target.value) || 0)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Completed"
                    value={summary.completed}
                    onChange={(e) => updateWorkSummary(idx, 'completed', parseInt(e.target.value) || 0)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Pending"
                    value={summary.pending}
                    onChange={(e) => updateWorkSummary(idx, 'pending', parseInt(e.target.value) || 0)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={summary.remarks}
                      onChange={(e) => updateWorkSummary(idx, 'remarks', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                    />
                    <button
                      onClick={() => removeWorkSummary(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDailyReportsPage;
    