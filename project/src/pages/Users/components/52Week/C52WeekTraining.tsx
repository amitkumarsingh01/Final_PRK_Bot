import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import { Building, Plus, Pencil, Trash2, Eye, Save, X, FileText, Calendar, BookOpen, Users, CheckCircle, Clock } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  title?: string;
  description?: string;
  logo_base64?: string;
}

interface TrainingItem {
  Month: string;
  Week: number;
  type: 'Theory' | 'Practical';
  Topics: string;
  status: 'Yes' | 'No';
}

interface TrainingSchedule {
  id: number;
  property_id: string;
  year: number;
  training_schedule: TrainingItem[];
  created_at: string;
  updated_at: string;
}

const API_URL = 'https://server.prktechindia.in/schedules/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const CWeekTrainingPage: React.FC = () => {
  console.log('🚀 C52WeekTraining: Component initialized');
  const { user } = useAuth();
  console.log('👤 C52WeekTraining: User loaded', { userId: user?.userId });

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewModal, setViewModal] = useState<{ open: boolean; data: any; title?: string }>({ open: false, data: null });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: TrainingSchedule | null;
    isNew: boolean;
  }>({ open: false, data: null, isNew: false });

  // Check if current user is admin or property user
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Load properties based on user type
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (isAdmin) {
          // Admin sees all properties
          const res = await axios.get(PROPERTIES_URL);
          setProperties(res.data);
        } else if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees their assigned property
          const res = await axios.get(`${PROPERTIES_URL}/${currentUserPropertyId}`);
          const property = res.data;
          setProperties([property]);
          // Automatically set the property for property users
          setSelectedPropertyId(currentUserPropertyId);
        }
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, [isAdmin, isPropertyUser, currentUserPropertyId]);

  // For property users, automatically set their property
  useEffect(() => {
    if (user?.userType === 'property_user' && user?.propertyId) {
      setSelectedPropertyId(user.propertyId);
      setIsAdmin(false);
    }
  }, [user]);

  // Load profile to detect default property and role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const profile = await response.json();
        if (profile?.property_id) setSelectedPropertyId(profile.property_id);
        setIsAdmin(profile?.user_role === 'admin');
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch schedules for property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL
  }?property_id=${propertyId}`);
      setSchedules(res.data || []);
    } catch (e) {
      setError('Failed to fetch training schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.propertyId) fetchData();
  }, [user?.propertyId]);

  

  const openView = (schedule: TrainingSchedule) => setViewModal({ open: true, data: schedule, title: 'Training Schedule Details' });

  const getEmptySchedule = (): Omit<TrainingSchedule, 'id' | 'created_at' | 'updated_at'> => ({
    property_id: user?.propertyId,
    year: new Date().getFullYear(),
    training_schedule: [],
  });

  const openAdd = () => {
    if (!isAdmin) return alert('Only admins can add schedules');
    setEditModal({ open: true, data: getEmptySchedule() as TrainingSchedule, isNew: true });
  };

  const openEdit = (schedule: TrainingSchedule) => {
    if (!isAdmin) return alert('Only admins can edit schedules');
    setEditModal({ open: true, data: { ...schedule }, isNew: false });
  };

  const closeModals = () => {
    setViewModal({ open: false, data: null });
    setEditModal({ open: false, data: null, isNew: false });
  };

  const handleDelete = async (scheduleId: number) => {
    if (!isAdmin) return alert('Only admins can delete schedules');
    if (!confirm('Are you sure you want to delete this training schedule?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}${scheduleId}`);
      await fetchData();
    } catch (e) {
      setError('Failed to delete schedule');
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
      await fetchData();
    } catch (e) {
      setError('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const addTrainingItem = () => {
    if (!editModal.data) return;
    
    const newItem: TrainingItem = {
      Month: 'January',
      Week: 1,
      type: 'Theory',
      Topics: '',
      status: 'No',
    };

    const updatedData = { ...editModal.data };
    updatedData.training_schedule = [...updatedData.training_schedule, newItem];
    setEditModal({ ...editModal, data: updatedData });
  };

  const updateTrainingItem = (index: number, field: keyof TrainingItem, value: string | number) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.training_schedule[index] = {
      ...updatedData.training_schedule[index],
      [field]: value,
    };
    setEditModal({ ...editModal, data: updatedData });
  };

  const removeTrainingItem = (index: number) => {
    if (!editModal.data) return;
    
    const updatedData = { ...editModal.data };
    updatedData.training_schedule = updatedData.training_schedule.filter((_, i) => i !== index);
    setEditModal({ ...editModal, data: updatedData });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Yes':
        return 'text-green-600 bg-green-100';
      case 'No':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Theory':
        return 'text-blue-600 bg-blue-100';
      case 'Practical':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentSchedule = schedules.find(s => s.property_id === user?.propertyId);

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
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">52 Week Training Schedule</h1>
                <p className="text-gray-600">View and manage annual training schedules with monthly and weekly breakdowns</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Schedule</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
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
                <p className="text-sm font-medium text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Year</p>
                <p className="text-2xl font-bold text-gray-900">{currentSchedule?.year || new Date().getFullYear()}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{currentSchedule?.training_schedule?.length || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentSchedule?.training_schedule?.filter(item => item.status === 'Yes').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Schedules List */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Training Schedules</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {properties.find(p => p.id === schedule.property_id)?.name || schedule.property_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.training_schedule?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.training_schedule?.filter(item => item.status === 'Yes').length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => openView(schedule)} className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(schedule)} className="text-orange-600 hover:text-orange-900">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(schedule.id)} className="text-red-600 hover:text-red-900">
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

        {/* Current Schedule Details */}
        {currentSchedule && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Training Schedule for {currentSchedule.year}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSchedule.training_schedule?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Week {item.Week}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.Topics}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{viewModal.title || 'Schedule Details'}</h2>
              <button onClick={() => setViewModal({ open: false, data: null })} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div><b>Year:</b> {viewModal.data.year}</div>
                  <div><b>Property ID:</b> {viewModal.data.property_id}</div>
                  <div><b>Total Items:</b> {viewModal.data.training_schedule?.length || 0}</div>
                  <div><b>Created:</b> {new Date(viewModal.data.created_at).toLocaleDateString()}</div>
                  <div><b>Updated:</b> {new Date(viewModal.data.updated_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="space-y-2">
                  <div><b>Theory Sessions:</b> {viewModal.data.training_schedule?.filter((item: TrainingItem) => item.type === 'Theory').length || 0}</div>
                  <div><b>Practical Sessions:</b> {viewModal.data.training_schedule?.filter((item: TrainingItem) => item.type === 'Practical').length || 0}</div>
                  <div><b>Completed:</b> {viewModal.data.training_schedule?.filter((item: TrainingItem) => item.status === 'Yes').length || 0}</div>
                  <div><b>Pending:</b> {viewModal.data.training_schedule?.filter((item: TrainingItem) => item.status === 'No').length || 0}</div>
                </div>
              </div>
            </div>

            {/* Training Items */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Training Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Month</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Week</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Topics</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewModal.data.training_schedule?.map((item: TrainingItem, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.Month}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">Week {item.Week}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs">{item.Topics}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <h2 className="text-xl font-bold text-gray-900">{editModal.isNew ? 'Add New Schedule' : 'Edit Schedule'}</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={editModal.data.year}
                  onChange={(e) => setEditModal(m => m && { ...m, data: { ...m.data!, year: parseInt(e.target.value) || new Date().getFullYear() } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Training Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Training Items</h3>
                <button
                  onClick={addTrainingItem}
                  className="text-orange-600 hover:text-orange-800 text-sm"
                >
                  + Add Training Item
                </button>
              </div>
              {editModal.data.training_schedule?.map((item: TrainingItem, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2 border rounded">
                  <select
                    value={item.Month}
                    onChange={(e) => updateTrainingItem(idx, 'Month', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Week"
                    value={item.Week}
                    onChange={(e) => updateTrainingItem(idx, 'Week', parseInt(e.target.value) || 1)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    min="1"
                    max="52"
                  />
                  <select
                    value={item.type}
                    onChange={(e) => updateTrainingItem(idx, 'type', e.target.value as 'Theory' | 'Practical')}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Topics"
                    value={item.Topics}
                    onChange={(e) => updateTrainingItem(idx, 'Topics', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateTrainingItem(idx, 'status', e.target.value as 'Yes' | 'No')}
                      className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    <button
                      onClick={() => removeTrainingItem(idx)}
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

export default CWeekTrainingPage;
