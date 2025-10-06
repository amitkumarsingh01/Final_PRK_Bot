import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Tag } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VendorClassification {
  id?: string;
  vendor_master_id?: string;
  classification_id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  sub_category: string;
  rating: string;
  classification_date: string;
  responsible_person: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorClassification: VendorClassification = {
  classification_id: '',
  vendor_id: '',
  vendor_name: '',
  category: '',
  sub_category: '',
  rating: '',
  classification_date: '',
  responsible_person: '',
  remarks: '',
};

const VendorClassificationPage: React.FC = () => {
  console.log('🚀 VendorClassificationPage: Component initialized');
  console.log('📊 VendorClassificationPage: Starting component render');
  
  const { user } = useAuth();
  console.log('👤 VendorClassificationPage: User context loaded', { userId: user?.userId, propertyId: user?.propertyId });
  
  const [data, setData] = useState<VendorClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; classification: VendorClassification | null }>({ open: false, classification: null });
  const [editModal, setEditModal] = useState<{ open: boolean; classification: VendorClassification | null; isNew: boolean; vendorMasterId: string | null }>({ open: false, classification: null, isNew: false, vendorMasterId: null });
  
  console.log('🔧 VendorClassificationPage: State initialized', { 
    dataLength: data.length, 
    loading, 
    error, 
    isAdmin,
    viewModalOpen: viewModal.open,
    editModalOpen: editModal.open
  });

  useEffect(() => {
    console.log('🏢 VendorClassificationPage: Fetching properties...');
    const fetchProperties = async () => {
      try {
        console.log('📡 VendorClassificationPage: Making API call to fetch properties');
        const res = await axios.get(PROPERTIES_URL);
        console.log('✅ VendorClassificationPage: Properties fetched successfully', { count: res.data?.length });
        setProperties(res.data);
      } catch (e) {
        console.error('❌ VendorClassificationPage: Failed to fetch properties', e);
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

  const fetchData = async () => {
    console.log('📊 VendorClassificationPage: fetchData called', { propertyId: user?.propertyId });
    if (!user?.propertyId) {
      console.log('⚠️ VendorClassificationPage: No property ID, skipping data fetch');
      return;
    }
    
    try {
      console.log('🔄 VendorClassificationPage: Starting data fetch...');
      setLoading(true);
      const res = await axios.get(`${API_URL
  }?property_id=${propertyId}`);
      console.log('📡 VendorClassificationPage: API response received', { dataLength: res.data?.length });
      
      const classifications = res.data
        .filter((vendor: any) => vendor.classification)
        .map((vendor: any) => ({
          id: vendor.classification.id,
          vendor_master_id: vendor.id,
          classification_id: vendor.classification.classification_id,
          vendor_id: vendor.vendor_master_management.vendor_id,
          vendor_name: vendor.vendor_master_management.vendor_name,
          category: vendor.classification.category,
          sub_category: vendor.classification.sub_category,
          rating: vendor.classification.rating,
          classification_date: vendor.classification.classification_date,
          responsible_person: vendor.classification.responsible_person,
          remarks: vendor.classification.remarks,
        }));
      
      console.log('✅ VendorClassificationPage: Classifications processed', { count: classifications.length });
      setData(classifications);
    } catch (e) {
      console.error('❌ VendorClassificationPage: Failed to fetch vendor classifications', e);
      setError('Failed to fetch vendor classifications');
    } finally {
      console.log('🏁 VendorClassificationPage: Data fetch completed');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.propertyId) {
      fetchData();
    }
  }, [user?.propertyId]);

  const handleEdit = (classification: VendorClassification, vendorMasterId: string) => {
    console.log('✏️ VendorClassificationPage: Edit button clicked', { 
      classificationId: classification.id, 
      vendorMasterId 
    });
    setEditModal({ open: true, classification: { ...classification }, isNew: false, vendorMasterId });
  };

  const handleAdd = (vendorMasterId: string) => {
    console.log('➕ VendorClassificationPage: Add button clicked', { vendorMasterId });
    setEditModal({ open: true, classification: { ...emptyVendorClassification }, isNew: true, vendorMasterId });
  };

  const handleDelete = async (classificationId: string, vendorMasterId: string) => {
    if (!window.confirm('Are you sure you want to delete this classification?')) return;

    try {
      // Get current vendor data
      const vendorRes = await axios.get(`${API_URL}${vendorMasterId}`);
      const vendor = vendorRes.data;
      
      // Update vendor without classification
      await axios.put(`${API_URL}${vendorMasterId}`, {
        property_id: vendor.property_id,
        vendor_master_management: vendor.vendor_master_management,
        vendor_classification: null
      });

      setData(data.filter(c => c.id !== classificationId));
    } catch (e) {
      setError('Failed to delete classification');
    }
  };

  const handleView = (classification: VendorClassification) => {
    setViewModal({ open: true, classification });
  };

  const handleSave = async () => {
    if (!editModal.vendorMasterId || !editModal.classification) return;

    try {
      // Get current vendor data
      const vendorRes = await axios.get(`${API_URL}${editModal.vendorMasterId}`);
      const vendor = vendorRes.data;

      const classificationData = {
        property_id: vendor.property_id,
        vendor_master_management: vendor.vendor_master_management,
        vendor_classification: {
          classification_id: editModal.classification.classification_id,
          vendor_id: editModal.classification.vendor_id,
          vendor_name: editModal.classification.vendor_name,
          category: editModal.classification.category,
          sub_category: editModal.classification.sub_category,
          rating: editModal.classification.rating,
          classification_date: editModal.classification.classification_date,
          responsible_person: editModal.classification.responsible_person,
          remarks: editModal.classification.remarks
        }
      };

      const res = await axios.put(`${API_URL}${editModal.vendorMasterId}`, classificationData);

      if (editModal.isNew) {
        setData([...data, {
          id: res.data.classification.id,
          vendor_master_id: editModal.vendorMasterId,
          classification_id: res.data.classification.classification_id,
          vendor_id: res.data.classification.vendor_id,
          vendor_name: res.data.classification.vendor_name,
          category: res.data.classification.category,
          sub_category: res.data.classification.sub_category,
          rating: res.data.classification.rating,
          classification_date: res.data.classification.classification_date,
          responsible_person: res.data.classification.responsible_person,
          remarks: res.data.classification.remarks,
        }]);
      }
      setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null });
    } catch (e) {
      setError('Failed to save classification');
    }
  };

  
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor classifications...</p>
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
              <Tag size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Vendor Classification</h1>
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
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-sm">Total Classifications</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(c => c.rating === 'A').length}
              </div>
              <div className="text-sm">A Rated</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(c => c.rating === 'B').length}
              </div>
              <div className="text-sm">B Rated</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(c => c.rating === 'C').length}
              </div>
              <div className="text-sm">C Rated</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Vendor Classifications</h2>
              {isAdmin && user?.propertyId && (
                <button
                  onClick={() => {
                    // For now, we'll need to select a vendor first
                    alert('Please select a vendor to add classification');
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Classification</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((classification) => (
                  <tr key={classification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{classification.classification_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{classification.vendor_name}</div>
                        <div className="text-xs text-gray-400">{classification.vendor_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classification.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classification.sub_category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        classification.rating === 'A' ? 'bg-green-100 text-green-800' :
                        classification.rating === 'B' ? 'bg-yellow-100 text-yellow-800' :
                        classification.rating === 'C' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {classification.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classification.classification_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(classification)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(classification, classification.vendor_master_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(classification.id!, classification.vendor_master_id!)}
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
      {viewModal.open && viewModal.classification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Vendor Classification</h3>
                <button
                  onClick={() => setViewModal({ open: false, classification: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Classification ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.classification_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.vendor_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.vendor_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.sub_category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.rating}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Classification Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.classification_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.responsible_person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.classification.remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.classification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Vendor Classification' : 'Edit Vendor Classification'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Classification ID</label>
                  <input
                    type="text"
                    value={editModal.classification.classification_id}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, classification_id: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <input
                    type="text"
                    value={editModal.classification.vendor_id}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, vendor_id: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <input
                    type="text"
                    value={editModal.classification.vendor_name}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, vendor_name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={editModal.classification.category}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, category: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Construction">Construction</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                  <input
                    type="text"
                    value={editModal.classification.sub_category}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, sub_category: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <select
                    value={editModal.classification.rating}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, rating: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Rating</option>
                    <option value="A">A - Excellent</option>
                    <option value="B">B - Good</option>
                    <option value="C">C - Average</option>
                    <option value="D">D - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Classification Date</label>
                  <input
                    type="date"
                    value={editModal.classification.classification_date}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, classification_date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.classification.responsible_person}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, responsible_person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.classification.remarks}
                    onChange={(e) => setEditModal({ ...editModal, classification: { ...editModal.classification!, remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null })}
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

export default VendorClassificationPage;
