import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../../context/AuthContext';
import { Building, Pencil, Eye, Save, X, FileText, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  title?: string;
  description?: string;
  logo_base64?: string;
}

interface TrainingSession {
  id: number;
  property_id: string;
  week_number: number;
  year: number;
  training_name: string;
  description: string;
  trainer: string;
  participants: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_date?: string;
  remarks?: string;
}

const API_URL = 'https://server.prktechindia.in/training-sessions/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const UserProperty52WeekTrainingPage: React.FC = () => {
  console.log('🚀 UserProperty 52WeekTraining: Component initialized');
  const { user } = useAuth();
  console.log('👤 UserProperty 52WeekTraining: User loaded', { userId: user?.userId });

  const [isUserProperty, setIsUserProperty] = useState<boolean>(false);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewModal, setViewModal] = useState<{ open: boolean; data: any; title?: string }>({ open: false, data: null });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: TrainingSession | null;
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
        setIsUserProperty(profile?.user_type === 'property_user');
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch sessions for user's property
  const fetchSessions = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`);
      setSessions(res.data || []);
    } catch (e) {
      setError('Failed to fetch training sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.propertyId]);

  const handleView = (session: TrainingSession) => {
    setViewModal({ open: true, data: session, title: `Week ${session.week_number} Training - ${session.training_name}` });
  };

  const handleEdit = (session: TrainingSession) => {
    setEditModal({ open: true, data: { ...session }, isNew: false });
  };

  const handleSave = async (sessionData: TrainingSession) => {
    try {
      if (editModal.isNew) {
        await axios.post(API_URL, sessionData);
      } else {
        await axios.put(`${API_URL}${sessionData.id}/`, sessionData);
      }
      setEditModal({ open: false, data: null, isNew: false });
      fetchSessions();
    } catch (e) {
      setError('Failed to save training session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">52 Week Training Calendar</h1>
              <p className="text-gray-600 mt-1">View and edit training sessions for your property</p>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Building size={24} />
              <span className="text-sm font-medium">Property User Panel</span>
            </div>
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

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Training Sessions ({sessions.length})</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No training sessions</h3>
              <p className="mt-1 text-sm text-gray-500">No training sessions have been scheduled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Training Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Week {session.week_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.training_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.trainer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {session.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(session)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isUserProperty && (
                            <button
                              onClick={() => handleEdit(session)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{viewModal.title}</h3>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Week Number</label>
                  <p className="mt-1 text-sm text-gray-900">Week {viewModal.data.week_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.data.status}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Training Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewModal.data.training_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{viewModal.data.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trainer</label>
                <p className="mt-1 text-sm text-gray-900">{viewModal.data.trainer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Participants</label>
                <p className="mt-1 text-sm text-gray-900">{viewModal.data.participants?.join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editModal.isNew ? 'Create New Training Session' : 'Edit Training Session'}
              </h3>
              <button
                onClick={() => setEditModal({ open: false, data: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={editModal.data.week_number}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, week_number: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    value={editModal.data.year}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, year: parseInt(e.target.value) }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Training Name</label>
                <input
                  type="text"
                  value={editModal.data.training_name}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    data: { ...editModal.data, training_name: e.target.value }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editModal.data.description}
                  onChange={(e) => setEditModal({
                    ...editModal,
                    data: { ...editModal.data, description: e.target.value }
                  })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trainer</label>
                  <input
                    type="text"
                    value={editModal.data.trainer}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, trainer: e.target.value }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.data.status}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditModal({ open: false, data: null, isNew: false })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editModal.data)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProperty52WeekTrainingPage;
