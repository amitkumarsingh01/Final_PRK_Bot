import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Star } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VendorEvaluation {
  id?: string;
  vendor_master_id?: string;
  evaluation_id: string;
  vendor_id: string;
  vendor_name: string;
  evaluation_date: string;
  criteria: string[];
  score_quality: number;
  score_delivery_time: number;
  outcome: string;
  evaluator: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorEvaluation: VendorEvaluation = {
  evaluation_id: '',
  vendor_id: '',
  vendor_name: '',
  evaluation_date: '',
  criteria: [],
  score_quality: 0,
  score_delivery_time: 0,
  outcome: '',
  evaluator: '',
  remarks: '',
};

const VendorEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VendorEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; evaluation: VendorEvaluation | null }>({ open: false, evaluation: null });
  const [editModal, setEditModal] = useState<{ open: boolean; evaluation: VendorEvaluation | null; isNew: boolean; vendorMasterId: string | null }>({ open: false, evaluation: null, isNew: false, vendorMasterId: null });

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
      const evaluations = res.data
        .filter((vendor: any) => vendor.evaluation)
        .map((vendor: any) => ({
          id: vendor.evaluation.id,
          vendor_master_id: vendor.id,
          evaluation_id: vendor.evaluation.evaluation_id,
          vendor_id: vendor.vendor_master_management.vendor_id,
          vendor_name: vendor.vendor_master_management.vendor_name,
          evaluation_date: vendor.evaluation.evaluation_date,
          criteria: vendor.evaluation.criteria || [],
          score_quality: vendor.evaluation.score_quality,
          score_delivery_time: vendor.evaluation.score_delivery_time,
          outcome: vendor.evaluation.outcome,
          evaluator: vendor.evaluation.evaluator,
          remarks: vendor.evaluation.remarks,
        }));
      setData(evaluations);
    } catch (e) {
      setError('Failed to fetch vendor evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (evaluation: VendorEvaluation, vendorMasterId: string) => {
    setEditModal({ open: true, evaluation: { ...evaluation }, isNew: false, vendorMasterId });
  };

  const handleAdd = (vendorMasterId: string) => {
    setEditModal({ open: true, evaluation: { ...emptyVendorEvaluation }, isNew: true, vendorMasterId });
  };

  const handleDelete = async (evaluationId: string, vendorMasterId: string) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) return;

    try {
      const vendorRes = await axios.get(`${API_URL}${vendorMasterId}`);
      const vendor = vendorRes.data;
      
      await axios.put(`${API_URL}${vendorMasterId}`, {
        property_id: vendor.property_id,
        vendor_master_management: vendor.vendor_master_management,
        vendor_evaluation: null
      });

      setData(data.filter(e => e.id !== evaluationId));
    } catch (e) {
      setError('Failed to delete evaluation');
    }
  };

  const handleView = (evaluation: VendorEvaluation) => {
    setViewModal({ open: true, evaluation });
  };

  const handleSave = async () => {
    if (!editModal.vendorMasterId || !editModal.evaluation) return;

    try {
      const vendorRes = await axios.get(`${API_URL}${editModal.vendorMasterId}`);
      const vendor = vendorRes.data;

      const evaluationData = {
        property_id: vendor.property_id,
        vendor_master_management: vendor.vendor_master_management,
        vendor_evaluation: {
          evaluation_id: editModal.evaluation.evaluation_id,
          vendor_id: editModal.evaluation.vendor_id,
          vendor_name: editModal.evaluation.vendor_name,
          evaluation_date: editModal.evaluation.evaluation_date,
          criteria: editModal.evaluation.criteria,
          score: {
            quality: editModal.evaluation.score_quality,
            delivery_time: editModal.evaluation.score_delivery_time
          },
          outcome: editModal.evaluation.outcome,
          evaluator: editModal.evaluation.evaluator,
          remarks: editModal.evaluation.remarks
        }
      };

      const res = await axios.put(`${API_URL}${editModal.vendorMasterId}`, evaluationData);

      if (editModal.isNew) {
        setData([...data, {
          id: res.data.evaluation.id,
          vendor_master_id: editModal.vendorMasterId,
          evaluation_id: res.data.evaluation.evaluation_id,
          vendor_id: res.data.evaluation.vendor_id,
          vendor_name: res.data.evaluation.vendor_name,
          evaluation_date: res.data.evaluation.evaluation_date,
          criteria: res.data.evaluation.criteria,
          score_quality: res.data.evaluation.score.quality,
          score_delivery_time: res.data.evaluation.score.delivery_time,
          outcome: res.data.evaluation.outcome,
          evaluator: res.data.evaluation.evaluator,
          remarks: res.data.evaluation.remarks,
        }]);
      }
      setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null });
    } catch (e) {
      setError('Failed to save evaluation');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const getAverageScore = (evaluation: VendorEvaluation) => {
    return Math.round((evaluation.score_quality + evaluation.score_delivery_time) / 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Star size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Vendor Evaluation</h1>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Select Property:</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-sm">Total Evaluations</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(e => getAverageScore(e) >= 8).length}
              </div>
              <div className="text-sm">Excellent (8+)</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(e => getAverageScore(e) >= 6 && getAverageScore(e) < 8).length}
              </div>
              <div className="text-sm">Good (6-7)</div>
            </div>
            <div className="bg-gradient-to-r from-red-400 to-red-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(e => getAverageScore(e) < 6).length}
              </div>
              <div className="text-sm">Poor (6-0)</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Vendor Evaluations</h2>
              {isAdmin && selectedPropertyId && (
                <button
                  onClick={() => {
                    alert('Please select a vendor to add evaluation');
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Evaluation</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{evaluation.evaluation_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{evaluation.vendor_name}</div>
                        <div className="text-xs text-gray-400">{evaluation.vendor_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{evaluation.evaluation_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        evaluation.score_quality >= 8 ? 'bg-green-100 text-green-800' :
                        evaluation.score_quality >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {evaluation.score_quality}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        evaluation.score_delivery_time >= 8 ? 'bg-green-100 text-green-800' :
                        evaluation.score_delivery_time >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {evaluation.score_delivery_time}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getAverageScore(evaluation) >= 8 ? 'bg-green-100 text-green-800' :
                        getAverageScore(evaluation) >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getAverageScore(evaluation)}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{evaluation.outcome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(evaluation)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(evaluation, evaluation.vendor_master_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(evaluation.id!, evaluation.vendor_master_id!)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
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
      {viewModal.open && viewModal.evaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Vendor Evaluation</h3>
                <button
                  onClick={() => setViewModal({ open: false, evaluation: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluation ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.evaluation_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.vendor_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.vendor_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluation Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.evaluation_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quality Score</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.score_quality}/10</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Score</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.score_delivery_time}/10</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Average Score</label>
                  <p className="mt-1 text-sm text-gray-900">{getAverageScore(viewModal.evaluation)}/10</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outcome</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.outcome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluator</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.evaluator}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Criteria</label>
                  <div className="mt-1">
                    {viewModal.evaluation.criteria.map((criterion, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                        {criterion}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.evaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Vendor Evaluation' : 'Edit Vendor Evaluation'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluation ID</label>
                  <input
                    type="text"
                    value={editModal.evaluation.evaluation_id}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, evaluation_id: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <input
                    type="text"
                    value={editModal.evaluation.vendor_id}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, vendor_id: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <input
                    type="text"
                    value={editModal.evaluation.vendor_name}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, vendor_name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluation Date</label>
                  <input
                    type="date"
                    value={editModal.evaluation.evaluation_date}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, evaluation_date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quality Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editModal.evaluation.score_quality}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, score_quality: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editModal.evaluation.score_delivery_time}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, score_delivery_time: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outcome</label>
                  <select
                    value={editModal.evaluation.outcome}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, outcome: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Outcome</option>
                    <option value="Approved">Approved</option>
                    <option value="Conditional Approval">Conditional Approval</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluator</label>
                  <input
                    type="text"
                    value={editModal.evaluation.evaluator}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, evaluator: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Criteria (comma-separated)</label>
                  <input
                    type="text"
                    value={editModal.evaluation.criteria.join(', ')}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, criteria: e.target.value.split(',').map(c => c.trim()).filter(c => c) } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Quality, Delivery, Communication, etc."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.evaluation.remarks}
                    onChange={(e) => setEditModal({ ...editModal, evaluation: { ...editModal.evaluation!, remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorEvaluationPage;
