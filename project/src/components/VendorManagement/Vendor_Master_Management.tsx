import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VendorMaster {
  id?: string;
  property_id?: string;
  vendor_id: string;
  vendor_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  registration_date: string;
  status: string;
  responsible_person: string;
  remarks: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorMaster: VendorMaster = {
  vendor_id: '',
  vendor_name: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  registration_date: '',
  status: '',
  responsible_person: '',
  remarks: '',
};

const VendorMasterManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VendorMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; vendor: VendorMaster | null }>({ open: false, vendor: null });
  const [editModal, setEditModal] = useState<{ open: boolean; vendor: VendorMaster | null; isNew: boolean }>({ open: false, vendor: null, isNew: false });

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
      setData(res.data.map((vendor: any) => ({
        id: vendor.id,
        property_id: vendor.property_id,
        vendor_id: vendor.vendor_master_management.vendor_id,
        vendor_name: vendor.vendor_master_management.vendor_name,
        contact_person: vendor.vendor_master_management.contact_person,
        contact_phone: vendor.vendor_master_management.contact_details.phone,
        contact_email: vendor.vendor_master_management.contact_details.email,
        address: vendor.vendor_master_management.address,
        registration_date: vendor.vendor_master_management.registration_date,
        status: vendor.vendor_master_management.status,
        responsible_person: vendor.vendor_master_management.responsible_person,
        remarks: vendor.vendor_master_management.remarks,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at,
      })));
    } catch (e) {
      setError('Failed to fetch vendor masters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (vendor: VendorMaster) => {
    setEditModal({ open: true, vendor: { ...vendor }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, vendor: { ...emptyVendorMaster }, isNew: true });
  };

  const handleDelete = async (vendorId: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await axios.delete(`${API_URL}${vendorId}`);
      setData(data.filter(v => v.id !== vendorId));
    } catch (e) {
      setError('Failed to delete vendor');
    }
  };

  const handleView = (vendor: VendorMaster) => {
    setViewModal({ open: true, vendor });
  };

  const handleSave = async () => {
    if (!editModal.vendor) return;

    try {
      const vendorData = {
        property_id: selectedPropertyId,
        vendor_master_management: {
          vendor_id: editModal.vendor.vendor_id,
          vendor_name: editModal.vendor.vendor_name,
          contact_person: editModal.vendor.contact_person,
          contact_details: {
            phone: editModal.vendor.contact_phone,
            email: editModal.vendor.contact_email
          },
          address: editModal.vendor.address,
          registration_date: editModal.vendor.registration_date,
          status: editModal.vendor.status,
          responsible_person: editModal.vendor.responsible_person,
          remarks: editModal.vendor.remarks
        }
      };

      if (editModal.isNew) {
        const res = await axios.post(API_URL, vendorData);
        setData([...data, {
          id: res.data.id,
          property_id: res.data.property_id,
          vendor_id: res.data.vendor_master_management.vendor_id,
          vendor_name: res.data.vendor_master_management.vendor_name,
          contact_person: res.data.vendor_master_management.contact_person,
          contact_phone: res.data.vendor_master_management.contact_details.phone,
          contact_email: res.data.vendor_master_management.contact_details.email,
          address: res.data.vendor_master_management.address,
          registration_date: res.data.vendor_master_management.registration_date,
          status: res.data.vendor_master_management.status,
          responsible_person: res.data.vendor_master_management.responsible_person,
          remarks: res.data.vendor_master_management.remarks,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
        }]);
      } else {
        const res = await axios.put(`${API_URL}${editModal.vendor.id}`, vendorData);
        setData(data.map(v => 
          v.id === editModal.vendor!.id ? {
            id: res.data.id,
            property_id: res.data.property_id,
            vendor_id: res.data.vendor_master_management.vendor_id,
            vendor_name: res.data.vendor_master_management.vendor_name,
            contact_person: res.data.vendor_master_management.contact_person,
            contact_phone: res.data.vendor_master_management.contact_details.phone,
            contact_email: res.data.vendor_master_management.contact_details.email,
            address: res.data.vendor_master_management.address,
            registration_date: res.data.vendor_master_management.registration_date,
            status: res.data.vendor_master_management.status,
            responsible_person: res.data.vendor_master_management.responsible_person,
            remarks: res.data.vendor_master_management.remarks,
            created_at: res.data.created_at,
            updated_at: res.data.updated_at,
          } : v
        ));
      }
      setEditModal({ open: false, vendor: null, isNew: false });
    } catch (e) {
      setError('Failed to save vendor');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendor masters...</p>
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
              <Users size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Vendor Master Management</h1>
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
              <div className="text-sm">Total Vendors</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(v => v.status === 'Active').length}
              </div>
              <div className="text-sm">Active</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(v => v.status === 'Inactive').length}
              </div>
              <div className="text-sm">Inactive</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {data.filter(v => v.status === 'Pending').length}
              </div>
              <div className="text-sm">Pending</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Vendor Masters</h2>
              {isAdmin && selectedPropertyId && (
                <button
                  onClick={handleAdd}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Vendor</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.vendor_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.vendor_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contact_person}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{vendor.contact_phone}</div>
                        <div className="text-xs text-gray-400">{vendor.contact_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.registration_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-800' :
                        vendor.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        vendor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(vendor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor.id!)}
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
      {viewModal.open && viewModal.vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Vendor Master</h3>
                <button
                  onClick={() => setViewModal({ open: false, vendor: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.vendor_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.vendor_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.contact_person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.contact_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.contact_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.registration_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.responsible_person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.address}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Vendor Master' : 'Edit Vendor Master'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, vendor: null, isNew: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <input
                    type="text"
                    value={editModal.vendor.vendor_id}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, vendor_id: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <input
                    type="text"
                    value={editModal.vendor.vendor_name}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, vendor_name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={editModal.vendor.contact_person}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, contact_person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    value={editModal.vendor.contact_phone}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, contact_phone: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={editModal.vendor.contact_email}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, contact_email: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                  <input
                    type="date"
                    value={editModal.vendor.registration_date}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, registration_date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.vendor.status}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.vendor.responsible_person}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, responsible_person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={editModal.vendor.address}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, address: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.vendor.remarks}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, vendor: null, isNew: false })}
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

export default VendorMasterManagementPage;
