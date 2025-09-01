import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface PerformanceMonitor {
  id?: string;
  quality_report_id?: string;
  monitor_id: string;
  project_process_id: string;
  metric: string;
  target: string;
  actual: string;
  variance: string;
  date_checked: string;
  status: string;
  responsible_person: string;
  remarks: string;
}

interface QualityReport {
  id: string;
  property_id: string;
  performance_monitors: PerformanceMonitor[];
}

const API_URL = 'https://server.prktechindia.in/quality-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyPerformanceMonitor: PerformanceMonitor = {
  monitor_id: '',
  project_process_id: '',
  metric: '',
  target: '',
  actual: '',
  variance: '',
  date_checked: '',
  status: '',
  responsible_person: '',
  remarks: '',
};

const PerformanceMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: PerformanceMonitor | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: PerformanceMonitor | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        setProperties(res.data);
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUserProperty = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser && matchedUser.property_id) {
          setSelectedPropertyId(matchedUser.property_id);
        }
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch quality reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: PerformanceMonitor, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyPerformanceMonitor },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this performance monitor?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.performance_monitors.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { performance_monitors: newArr });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: PerformanceMonitor) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: PerformanceMonitor[];
      if (editModal.isNew) {
        newArr = [...report.performance_monitors, editModal.item];
      } else {
        newArr = report.performance_monitors.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { performance_monitors: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-green-100 text-green-800';
      case 'Behind Schedule':
        return 'bg-red-100 text-red-800';
      case 'At Risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Performance Monitoring</h2>
      {/* Property Selection Dropdown */}
      <div className="mb-6 max-w-md">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <select
            id="propertySelect"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
          >
            <option value="">Select a property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Monitor ID</th>
              <th className="px-3 py-2 border">Project/Process ID</th>
              <th className="px-3 py-2 border">Metric</th>
              <th className="px-3 py-2 border">Target</th>
              <th className="px-3 py-2 border">Actual</th>
              <th className="px-3 py-2 border">Variance</th>
              <th className="px-3 py-2 border">Date Checked</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.performance_monitors.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.monitor_id}</td>
                      <td className="border px-2 py-1">{item.project_process_id}</td>
                      <td className="border px-2 py-1">{item.metric}</td>
                      <td className="border px-2 py-1">{item.target}</td>
                      <td className="border px-2 py-1">{item.actual}</td>
                      <td className="border px-2 py-1">{item.variance}</td>
                      <td className="border px-2 py-1">{item.date_checked}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Performance Monitor
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Performance Monitor
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Monitor ID" value={editModal.item.monitor_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, monitor_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Project/Process ID" value={editModal.item.project_process_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, project_process_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Metric" value={editModal.item.metric} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, metric: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Target" value={editModal.item.target} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, target: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Actual" value={editModal.item.actual} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, actual: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Variance" value={editModal.item.variance} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, variance: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Date Checked" type="date" value={editModal.item.date_checked} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, date_checked: e.target.value } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="On Track">On Track</option>
                  <option value="Behind Schedule">Behind Schedule</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Completed">Completed</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} rows={3} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Monitor Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Monitor ID:</b> {viewModal.item.monitor_id}</div>
              <div><b>Project/Process ID:</b> {viewModal.item.project_process_id}</div>
              <div><b>Metric:</b> {viewModal.item.metric}</div>
              <div><b>Target:</b> {viewModal.item.target}</div>
              <div><b>Actual:</b> {viewModal.item.actual}</div>
              <div><b>Variance:</b> {viewModal.item.variance}</div>
              <div><b>Date Checked:</b> {viewModal.item.date_checked}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.item.status)}`}>
                  {viewModal.item.status}
                </span>
              </div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitoringPage; 
