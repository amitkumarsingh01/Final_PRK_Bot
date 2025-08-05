import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, TrendingUp, Target, Users, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface KpiRecord {
  id?: string;
  property_id: string;
  sl_no: number;
  kpi_id: string;
  department: string;
  kpi_name: string;
  description_objective: string;
  unit_of_measure: string;
  target_value: string;
  actual_value: string;
  achievement_percentage: string;
  frequency: string;
  data_source: string;
  responsible_person: string;
  status: string;
  last_updated: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/kpi-records/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyKpiRecord: KpiRecord = {
  property_id: '',
  sl_no: 0,
  kpi_id: '',
  department: '',
  kpi_name: '',
  description_objective: '',
  unit_of_measure: '',
  target_value: '',
  actual_value: '',
  achievement_percentage: '',
  frequency: '',
  data_source: '',
  responsible_person: '',
  status: '',
  last_updated: '',
  remarks: '',
};

const KPIPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<KpiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: KpiRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: KpiRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

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
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch KPI records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (record: KpiRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyKpiRecord, property_id: selectedPropertyId }, isNew: true });
  };

  const handleDelete = async (recordId: string) => {
    if (!isAdmin) {
      alert('Only admins can delete KPI records');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this KPI record?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData(selectedPropertyId);
      } catch (e) {
        setError('Failed to delete KPI record');
      }
    }
  };

  const handleView = (record: KpiRecord) => {
    setViewModal({ open: true, record });
  };

  const handleSave = async () => {
    if (!editModal.record) return;

    try {
      if (editModal.isNew) {
        await axios.post(API_URL, editModal.record);
      } else {
        await axios.put(`${API_URL}${editModal.record.id}`, editModal.record);
      }
      setEditModal({ open: false, record: null, isNew: false });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save KPI record');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'on track':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'overdue':
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAchievementColor = (percentage: string) => {
    const num = parseFloat(percentage);
    if (num >= 90) return 'text-green-600 font-semibold';
    if (num >= 75) return 'text-blue-600 font-semibold';
    if (num >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
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
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Key Performance Indicators (KPI)</h1>
                <p className="text-gray-600">Monitor and track performance metrics across departments</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add KPI Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Select Property</h2>
            </div>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total KPIs</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active KPIs</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.filter(item => item.status.toLowerCase() === 'active').length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(data.map(item => item.department)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Achievement</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.length > 0 
                    ? Math.round(data.reduce((sum, item) => sum + parseFloat(item.achievement_percentage || '0'), 0) / data.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.sl_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.kpi_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.kpi_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.target_value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.actual_value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getAchievementColor(record.achievement_percentage)}`}>
                        {record.achievement_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id!)}
                              className="text-red-600 hover:text-red-900"
                            >
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
          
          {data.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No KPI records</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new KPI record.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">KPI Record Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><b>SL No:</b> {viewModal.record.sl_no}</div>
              <div><b>KPI ID:</b> {viewModal.record.kpi_id}</div>
              <div><b>Department:</b> {viewModal.record.department}</div>
              <div><b>KPI Name:</b> {viewModal.record.kpi_name}</div>
              <div><b>Description/Objective:</b> {viewModal.record.description_objective}</div>
              <div><b>Unit of Measure:</b> {viewModal.record.unit_of_measure}</div>
              <div><b>Target Value:</b> {viewModal.record.target_value}</div>
              <div><b>Actual Value:</b> {viewModal.record.actual_value}</div>
              <div><b>Achievement Percentage:</b> {viewModal.record.achievement_percentage}%</div>
              <div><b>Frequency:</b> {viewModal.record.frequency}</div>
              <div><b>Data Source:</b> {viewModal.record.data_source}</div>
              <div><b>Responsible Person:</b> {viewModal.record.responsible_person}</div>
              <div><b>Status:</b> {viewModal.record.status}</div>
              <div><b>Last Updated:</b> {viewModal.record.last_updated}</div>
              <div className="md:col-span-2"><b>Remarks:</b> {viewModal.record.remarks}</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editModal.isNew ? 'Add New KPI Record' : 'Edit KPI Record'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SL No</label>
                <input
                  type="number"
                  value={editModal.record.sl_no}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, sl_no: parseInt(e.target.value) || 0 } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI ID</label>
                <input
                  type="text"
                  value={editModal.record.kpi_id}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, kpi_id: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editModal.record.department}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, department: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
                <input
                  type="text"
                  value={editModal.record.kpi_name}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, kpi_name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description/Objective</label>
                <textarea
                  value={editModal.record.description_objective}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, description_objective: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={editModal.record.unit_of_measure}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, unit_of_measure: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <input
                  type="text"
                  value={editModal.record.target_value}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, target_value: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Value</label>
                <input
                  type="text"
                  value={editModal.record.actual_value}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, actual_value: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Percentage</label>
                <input
                  type="text"
                  value={editModal.record.achievement_percentage}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, achievement_percentage: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <input
                  type="text"
                  value={editModal.record.frequency}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, frequency: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
                <input
                  type="text"
                  value={editModal.record.data_source}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, data_source: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Person</label>
                <input
                  type="text"
                  value={editModal.record.responsible_person}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, responsible_person: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editModal.record.status}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, status: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Track">On Track</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <input
                  type="text"
                  value={editModal.record.last_updated}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, last_updated: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={editModal.record.remarks}
                  onChange={e => setEditModal(m => m && { ...m, record: { ...m.record!, remarks: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
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

export default KPIPage;
