import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

interface Property {
  id: string;
  name: string;
}

interface IntegrationWithPurchaseProcess {
  id?: string;
  vendor_master_id?: string;
  integration_id: string;
  purchase_system: string;
  integration_type: string;
  status: string;
  last_sync: string;
  responsible_person: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const Integration_with_Purchase_Process: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  const [data, setData] = useState<IntegrationWithPurchaseProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IntegrationWithPurchaseProcess | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<IntegrationWithPurchaseProcess>>({});

  const isCadminRoute = useMemo(() => typeof window !== 'undefined' && window.location.pathname.startsWith('/cadmin'), []);
  const effectivePropertyId = isCadminRoute ? user?.propertyId || '' : selectedProperty;

  useEffect(() => { setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin'); }, [user?.userType]);

  // Fetch properties
  useEffect(() => {
    if (isCadminRoute) return;
    (async () => {
      try {
        const response = await axios.get(PROPERTIES_URL);
        const list = response.data || [];
        setProperties(list);
        if (!selectedProperty && list.length > 0) setSelectedProperty(list[0].id);
      }
      catch { /* ignore */ }
    })();
  }, [isCadminRoute]);

  // Fetch integration data
  useEffect(() => {
    if (!isCadminRoute && !effectivePropertyId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(API_URL, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined });
        const arr = Array.isArray(response.data) ? response.data : [];
        const integrationData = arr
          .filter((vendor: any) => !effectivePropertyId || vendor.property_id === effectivePropertyId)
          .filter((vendor: any) => vendor.integration_with_purchase_process)
          .map((vendor: any) => ({
            id: vendor.integration_with_purchase_process.id,
            vendor_master_id: vendor.id,
            integration_id: vendor.integration_with_purchase_process.integration_id,
            purchase_system: vendor.integration_with_purchase_process.purchase_system,
            integration_type: vendor.integration_with_purchase_process.integration_type,
            status: vendor.integration_with_purchase_process.status,
            last_sync: vendor.integration_with_purchase_process.last_sync,
            responsible_person: vendor.integration_with_purchase_process.responsible_person,
            remarks: vendor.integration_with_purchase_process.remarks,
          }));

        setData(integrationData);
      } catch (err) {
        console.error('Error fetching integration data:', err);
        setError('Failed to fetch integration data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty, user?.token]);

  const handleView = (item: IntegrationWithPurchaseProcess) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: IntegrationWithPurchaseProcess) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      integration_id: '',
      purchase_system: '',
      integration_type: '',
      status: '',
      last_sync: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: IntegrationWithPurchaseProcess) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this integration record?')) {
      return;
    }

    try {
      if (!item.vendor_master_id) return;
      await axios.put(`${API_URL}${item.vendor_master_id}`, { integration_with_purchase_process: null }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setData(data.filter(d => d.id !== item.id));
    } catch (err) {
      console.error('Error deleting integration:', err);
      setError('Failed to delete integration');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (!(editingItem as any).vendor_master_id) return;
      await axios.put(`${API_URL}${(editingItem as any).vendor_master_id}`, {
        integration_with_purchase_process: {
          integration_id: editingItem.integration_id,
          purchase_system: editingItem.purchase_system,
          integration_type: editingItem.integration_type,
          status: editingItem.status,
          last_sync: editingItem.last_sync,
          responsible_person: editingItem.responsible_person,
          remarks: editingItem.remarks,
        }
      }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);

      // Refresh data
      const response = await axios.get(API_URL, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined });
      const arr = Array.isArray(response.data) ? response.data : [];
      const integrationData = arr
        .filter((vendor: any) => !effectivePropertyId || vendor.property_id === effectivePropertyId)
        .filter((vendor: any) => vendor.integration_with_purchase_process)
        .map((vendor: any) => ({
          id: vendor.integration_with_purchase_process.id,
          vendor_master_id: vendor.id,
          integration_id: vendor.integration_with_purchase_process.integration_id,
          purchase_system: vendor.integration_with_purchase_process.purchase_system,
          integration_type: vendor.integration_with_purchase_process.integration_type,
          status: vendor.integration_with_purchase_process.status,
          last_sync: vendor.integration_with_purchase_process.last_sync,
          responsible_person: vendor.integration_with_purchase_process.responsible_person,
          remarks: vendor.integration_with_purchase_process.remarks,
        }));

      setData(integrationData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving integration:', err);
      setError('Failed to save integration');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntegrationTypeColor = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'api':
        return 'bg-blue-100 text-blue-800';
      case 'manual':
        return 'bg-orange-100 text-orange-800';
      case 'automated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration with Purchase Process</h1>
        <p className="text-gray-600">Manage vendor integrations with purchase systems</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Integrations</p>
              <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => (item.status || '').toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => (item.status || '').toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Integrations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => (item.integration_type || '').toLowerCase() === 'api').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
        <select
          value={selectedProperty}
          onChange={(e) => handlePropertyChange(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Integration Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Integration
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.integration_id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.purchase_system}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntegrationTypeColor(item.integration_type)}`}>
                    {item.integration_type}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(item)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {data.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new integration.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Integration ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.integration_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase System</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.purchase_system}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Integration Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.integration_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Sync</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.last_sync}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.responsible_person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.remarks}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem.id ? 'Edit Integration' : 'Add Integration'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Integration ID</label>
                  <input
                    type="text"
                    value={editingItem.integration_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, integration_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase System</label>
                  <input
                    type="text"
                    value={editingItem.purchase_system || ''}
                    onChange={(e) => setEditingItem({...editingItem, purchase_system: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Integration Type</label>
                  <select
                    value={editingItem.integration_type || ''}
                    onChange={(e) => setEditingItem({...editingItem, integration_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="API">API</option>
                    <option value="Manual">Manual</option>
                    <option value="Automated">Automated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editingItem.status || ''}
                    onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Sync</label>
                  <input
                    type="text"
                    value={editingItem.last_sync || ''}
                    onChange={(e) => setEditingItem({...editingItem, last_sync: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="YYYY-MM-DD HH:MM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editingItem.responsible_person || ''}
                    onChange={(e) => setEditingItem({...editingItem, responsible_person: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editingItem.remarks || ''}
                    onChange={(e) => setEditingItem({...editingItem, remarks: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem({});
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
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

export default Integration_with_Purchase_Process;
