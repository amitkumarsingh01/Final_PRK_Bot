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

interface ProcurementPlan {
  id?: string;
  report_id?: string;
  Plan_ID: string;
  Project_Department: string;
  Item_Service: string;
  Quantity: number;
  Estimated_Cost: number;
  Timeline_Start: string;
  Timeline_End: string;
  Priority: string;
  Responsible_Person: string;
  Status: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  procurement_plans: ProcurementPlan[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProcurementPlan: ProcurementPlan = {
  Plan_ID: '',
  Project_Department: '',
  Item_Service: '',
  Quantity: 0,
  Estimated_Cost: 0,
  Timeline_Start: '',
  Timeline_End: '',
  Priority: '',
  Responsible_Person: '',
  Status: '',
  Remarks: '',
};

const ProcurementPlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; plan: ProcurementPlan | null }>({ open: false, plan: null });
  const [editModal, setEditModal] = useState<{ open: boolean; plan: ProcurementPlan | null; isNew: boolean; reportId: string | null }>({ open: false, plan: null, isNew: false, reportId: null });

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
      setError(null);
    } catch (e) {
      setError('Failed to fetch procurement planning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const getAllPlans = (): ProcurementPlan[] => {
    return data.flatMap(report => 
      report.procurement_plans.map(plan => ({
        ...plan,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (plan: ProcurementPlan, reportId: string) => {
    setEditModal({ open: true, plan: { ...plan }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, plan: { ...emptyProcurementPlan }, isNew: true, reportId });
  };

  const handleDelete = async (planId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this procurement plan?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedPlans = report.procurement_plans.filter(p => p.id !== planId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Procurement_Planning: updatedPlans
          }
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete procurement plan');
    }
  };

  const handleView = (plan: ProcurementPlan) => {
    setViewModal({ open: true, plan });
  };

  const handleSave = async () => {
    if (!editModal.plan || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedPlans: ProcurementPlan[];
        if (editModal.isNew) {
          const newPlan = { ...editModal.plan, id: `temp_${Date.now()}` };
          updatedPlans = [...report.procurement_plans, newPlan];
        } else {
          updatedPlans = report.procurement_plans.map(p =>
            p.id === editModal.plan!.id ? editModal.plan! : p
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Procurement_Planning: updatedPlans
          }
        });
        setEditModal({ open: false, plan: null, isNew: false, reportId: null });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save procurement plan');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: orange }}></div>
      </div>
    );
  }

  const plans = getAllPlans();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Procurement Planning</h1>
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
              <div className="text-2xl font-bold">{plans.length}</div>
              <div className="text-sm">Total Plans</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {plans.filter(p => p.Status === 'Completed').length}
              </div>
              <div className="text-sm">Completed</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {plans.filter(p => p.Status === 'In Progress').length}
              </div>
              <div className="text-sm">In Progress</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                ₹{plans.reduce((sum, p) => sum + p.Estimated_Cost, 0).toLocaleString()}
              </div>
              <div className="text-sm">Total Budget</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Procurement Plans</h2>
              {isAdmin && selectedPropertyId && (
                <button
                  onClick={() => {
                    const report = data[0];
                    if (report) {
                      handleAdd(report.id);
                    }
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Plan</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item/Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.Plan_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.Project_Department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.Item_Service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.Quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{plan.Estimated_Cost.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.Priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                        plan.Status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(plan)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(plan, plan.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(plan.id!, plan.report_id!)}
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
      {viewModal.open && viewModal.plan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Procurement Plan</h3>
                <button
                  onClick={() => setViewModal({ open: false, plan: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Plan_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Project_Department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Item_Service}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                  <p className="mt-1 text-sm text-gray-900">₹{viewModal.plan.Estimated_Cost.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Priority}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline Start</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Timeline_Start}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline End</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Timeline_End}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Responsible_Person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Status}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.plan.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.plan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Procurement Plan' : 'Edit Procurement Plan'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, plan: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan ID</label>
                  <input
                    type="text"
                    value={editModal.plan.Plan_ID}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Plan_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    value={editModal.plan.Project_Department}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Project_Department: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <input
                    type="text"
                    value={editModal.plan.Item_Service}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Item_Service: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={editModal.plan.Quantity}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Quantity: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editModal.plan.Estimated_Cost}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Estimated_Cost: parseFloat(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={editModal.plan.Priority}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Priority: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline Start</label>
                  <input
                    type="date"
                    value={editModal.plan.Timeline_Start}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Timeline_Start: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline End</label>
                  <input
                    type="date"
                    value={editModal.plan.Timeline_End}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Timeline_End: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.plan.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.plan.Status}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.plan.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, plan: { ...editModal.plan!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, plan: null, isNew: false, reportId: null })}
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

export default ProcurementPlanningPage;
