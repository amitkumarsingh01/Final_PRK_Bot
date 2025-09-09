import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, TrendingUp, Target, Calendar } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface MonitoringControl {
  id: string;
  monitor_id: string;
  kpi_metric: string;
  target: number;
  actual: number;
  variance: number;
  date_checked: string;
  status: string;
  remarks: string;
}

interface ProjectMaster {
  property_id: string;
  project_initiation: {
    id: string;
    project_id: string;
    project_name: string;
  };
  monitoring_control: MonitoringControl[];
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyMonitoringControl: Omit<MonitoringControl, 'id'> = {
  monitor_id: '',
  kpi_metric: '',
  target: 0,
  actual: 0,
  variance: 0,
  date_checked: '',
  status: '',
  remarks: '',
};

const MonitoringControlPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; monitoring: MonitoringControl | null; projectName: string }>({ open: false, monitoring: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; monitoring: Omit<MonitoringControl, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, monitoring: null, isNew: false, projectId: '' });

  const handleEdit = (monitoring: MonitoringControl, projectId: string) => {
    const { id, ...monitoringData } = monitoring;
    setEditModal({ open: true, monitoring: monitoringData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      monitoring: { ...emptyMonitoringControl },
      projectId,
    });
  };

  const handleDelete = async (monitoringId: string, projectId: string) => {
    if (!window.confirm('Delete this monitoring record?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        const updatedMonitoring = project.monitoring_control.filter(m => m.id !== monitoringId);
        await axios.put(`${API_URL}${projectId}`, {
          monitoring_control: updatedMonitoring
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete monitoring record');
    }
  };

  const handleView = (monitoring: MonitoringControl, projectName: string) => {
    setViewModal({ open: true, monitoring, projectName });
  };

  const handleSave = async () => {
    if (!editModal.monitoring) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project && editModal.monitoring) {
        const monitoring = editModal.monitoring;
        let updatedMonitoring: MonitoringControl[];
        if (editModal.isNew) {
          const newMonitoring: MonitoringControl = { 
            id: `temp_${Date.now()}`,
            monitor_id: monitoring.monitor_id,
            kpi_metric: monitoring.kpi_metric,
            target: monitoring.target,
            actual: monitoring.actual,
            variance: monitoring.variance,
            date_checked: monitoring.date_checked,
            status: monitoring.status,
            remarks: monitoring.remarks
          };
          updatedMonitoring = [...project.monitoring_control, newMonitoring];
        } else {
          updatedMonitoring = project.monitoring_control.map(m =>
            m.monitor_id === monitoring.monitor_id 
              ? { 
                  id: m.id,
                  monitor_id: monitoring.monitor_id,
                  kpi_metric: monitoring.kpi_metric,
                  target: monitoring.target,
                  actual: monitoring.actual,
                  variance: monitoring.variance,
                  date_checked: monitoring.date_checked,
                  status: monitoring.status,
                  remarks: monitoring.remarks
                }
              : m
          );
        }
        
        await axios.put(`${API_URL}${editModal.projectId}`, {
          monitoring_control: updatedMonitoring
        });
        setEditModal({ open: false, monitoring: null, isNew: false, projectId: '' });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save monitoring record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on track': return 'bg-green-100 text-green-800';
      case 'at risk': return 'bg-yellow-100 text-yellow-800';
      case 'off track': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  // Flatten all monitoring records from all projects for display
  const getAllMonitoring = () => {
    const allMonitoring: Array<MonitoringControl & { projectId: string; projectName: string }> = [];
    projects.forEach(project => {
      project.monitoring_control.forEach(monitoring => {
        allMonitoring.push({
          ...monitoring,
          projectId: project.project_initiation.id,
          projectName: project.project_initiation.project_name
        });
      });
    });
    return allMonitoring;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Monitoring & Control</h2>
      
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

      {/* Monitoring Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Monitor ID</th>
              <th className="px-3 py-2 border">KPI Metric</th>
              <th className="px-3 py-2 border">Target</th>
              <th className="px-3 py-2 border">Actual</th>
              <th className="px-3 py-2 border">Variance</th>
              <th className="px-3 py-2 border">Date Checked</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : getAllMonitoring().length === 0 ? (
              <tr><td colSpan={10} className="text-center py-6">No monitoring records found</td></tr>
            ) : (
              getAllMonitoring().map((monitoring, idx) => (
                <tr key={monitoring.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1 font-medium">{monitoring.projectName}</td>
                  <td className="border px-2 py-1">{monitoring.monitor_id}</td>
                  <td className="border px-2 py-1">{monitoring.kpi_metric}</td>
                  <td className="border px-2 py-1">{monitoring.target}</td>
                  <td className="border px-2 py-1">{monitoring.actual}</td>
                  <td className={`border px-2 py-1 font-semibold ${getVarianceColor(monitoring.variance)}`}>
                    {monitoring.variance >= 0 ? '+' : ''}{monitoring.variance}
                  </td>
                  <td className="border px-2 py-1">{monitoring.date_checked}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(monitoring.status)}`}>
                      {monitoring.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(monitoring, monitoring.projectName)} className="text-blue-600 mr-2">
                      <Eye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(monitoring, monitoring.projectId)} className="text-orange-600 mr-2">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(monitoring.id, monitoring.projectId)} className="text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && projects.length > 0 && (
        <div className="mb-6">
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">Add Monitoring Record to Project:</label>
          <div className="flex gap-2">
            
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.monitoring && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Monitoring Record
              </h3>
              <button
                onClick={() => setEditModal({ open: false, monitoring: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Monitor ID" 
                  value={editModal.monitoring.monitor_id} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, monitor_id: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="KPI Metric" 
                  value={editModal.monitoring.kpi_metric} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, kpi_metric: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Target" 
                  type="number" 
                  value={editModal.monitoring.target} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, target: parseInt(e.target.value) || 0 } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Actual" 
                  type="number" 
                  value={editModal.monitoring.actual} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, actual: parseInt(e.target.value) || 0 } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Variance" 
                  type="number" 
                  value={editModal.monitoring.variance} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, variance: parseInt(e.target.value) || 0 } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Date Checked" 
                  type="date" 
                  value={editModal.monitoring.date_checked} 
                  onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, date_checked: e.target.value } })} 
                  required 
                />
                
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.monitoring.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, monitoring: { ...m.monitoring!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, monitoring: null, isNew: false, projectId: '' })} 
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.monitoring && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Monitoring Details: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, monitoring: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Monitor ID:</b> {viewModal.monitoring.monitor_id}</div>
              <div><b>KPI Metric:</b> {viewModal.monitoring.kpi_metric}</div>
              <div><b>Target:</b> {viewModal.monitoring.target}</div>
              <div><b>Actual:</b> {viewModal.monitoring.actual}</div>
              <div><b>Variance:</b> 
                <span className={`ml-2 font-semibold ${getVarianceColor(viewModal.monitoring.variance)}`}>
                  {viewModal.monitoring.variance >= 0 ? '+' : ''}{viewModal.monitoring.variance}
                </span>
              </div>
              <div><b>Date Checked:</b> {viewModal.monitoring.date_checked}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.monitoring.status)}`}>
                  {viewModal.monitoring.status}
                </span>
              </div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.monitoring.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringControlPage;
