import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface VendorDocumentation {
  id: string;
  vendor_master_id: string;
  document_id: string;
  document_type: string;
  document_name: string;
  upload_date: string;
  expiry_date: string;
  document_status: string;
  file_reference: string;
  responsible_person: string;
  remarks: string;
}

const Vendor_Documentation: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<VendorDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VendorDocumentation | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<VendorDocumentation>>({});

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get('https://server.prktechindia.in/properties');
        setProperties(response.data);
        if (response.data.length > 0) {
          setSelectedProperty(response.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  // Fetch vendor documentation data
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        
        // Filter vendors that have documentation data and map it
        const documentationData = response.data
          .filter((vendor: any) => vendor.vendor_documentation)
          .map((vendor: any) => ({
            id: vendor.vendor_documentation.id,
            vendor_master_id: vendor.id,
            document_id: vendor.vendor_documentation.document_id,
            document_type: vendor.vendor_documentation.document_type,
            document_name: vendor.vendor_documentation.document_name,
            upload_date: vendor.vendor_documentation.upload_date,
            expiry_date: vendor.vendor_documentation.expiry_date,
            document_status: vendor.vendor_documentation.document_status,
            file_reference: vendor.vendor_documentation.file_reference,
            responsible_person: vendor.vendor_documentation.responsible_person,
            remarks: vendor.vendor_documentation.remarks,
          }));

        setData(documentationData);
      } catch (err) {
        console.error('Error fetching documentation data:', err);
        setError('Failed to fetch documentation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty]);

  const handleView = (item: VendorDocumentation) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: VendorDocumentation) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      document_id: '',
      document_type: '',
      document_name: '',
      upload_date: '',
      expiry_date: '',
      document_status: '',
      file_reference: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: VendorDocumentation) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this documentation record?')) {
      return;
    }

    try {
      // Find the vendor that has this documentation
      const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const vendor = response.data.find((v: any) => v.vendor_documentation?.id === item.id);
      
      if (vendor) {
        // Update the vendor with documentation set to null
        await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
          ...vendor,
          vendor_documentation: null
        });
        
        setData(data.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error('Error deleting documentation:', err);
      setError('Failed to delete documentation');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (editingItem.id) {
        // Update existing documentation
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendor = response.data.find((v: any) => v.vendor_documentation?.id === editingItem.id);
        
        if (vendor) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
            ...vendor,
            vendor_documentation: {
              document_id: editingItem.document_id,
              document_type: editingItem.document_type,
              document_name: editingItem.document_name,
              upload_date: editingItem.upload_date,
              expiry_date: editingItem.expiry_date,
              document_status: editingItem.document_status,
              file_reference: editingItem.file_reference,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      } else {
        // Create new documentation - we need to select a vendor first
        // For now, we'll use the first vendor without documentation
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendorWithoutDocumentation = response.data.find((v: any) => !v.vendor_documentation);
        
        if (vendorWithoutDocumentation) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendorWithoutDocumentation.id}`, {
            ...vendorWithoutDocumentation,
            vendor_documentation: {
              document_id: editingItem.document_id,
              document_type: editingItem.document_type,
              document_name: editingItem.document_name,
              upload_date: editingItem.upload_date,
              expiry_date: editingItem.expiry_date,
              document_status: editingItem.document_status,
              file_reference: editingItem.file_reference,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      }

      // Refresh data
      const refreshResponse = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const documentationData = refreshResponse.data
        .filter((vendor: any) => vendor.vendor_documentation)
        .map((vendor: any) => ({
          id: vendor.vendor_documentation.id,
          vendor_master_id: vendor.id,
          document_id: vendor.vendor_documentation.document_id,
          document_type: vendor.vendor_documentation.document_type,
          document_name: vendor.vendor_documentation.document_name,
          upload_date: vendor.vendor_documentation.upload_date,
          expiry_date: vendor.vendor_documentation.expiry_date,
          document_status: vendor.vendor_documentation.document_status,
          file_reference: vendor.vendor_documentation.file_reference,
          responsible_person: vendor.vendor_documentation.responsible_person,
          remarks: vendor.vendor_documentation.remarks,
        }));

      setData(documentationData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving documentation:', err);
      setError('Failed to save documentation');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'license':
        return 'bg-blue-100 text-blue-800';
      case 'certificate':
        return 'bg-green-100 text-green-800';
      case 'insurance':
        return 'bg-indigo-100 text-indigo-800';
      case 'tax':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiringDocuments = () => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return data.filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return expiryDate >= today && expiryDate <= nextMonth;
    });
  };

  const getExpiredDocuments = () => {
    const today = new Date();
    return data.filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return expiryDate < today;
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Documentation</h1>
        <p className="text-gray-600">Manage vendor documents and certificates</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
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
                {data.filter(item => item.document_status.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900">{getExpiringDocuments().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-semibold text-gray-900">{getExpiredDocuments().length}</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Documentation Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Document
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.document_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.document_id} • Expires: {item.expiry_date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusColor(item.document_status)}`}>
                    {item.document_status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(item.document_type)}`}>
                    {item.document_type}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new document record.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.document_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.document_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.document_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.upload_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.expiry_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.document_status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Reference</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.file_reference}</p>
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
                {editingItem.id ? 'Edit Document' : 'Add Document'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document ID</label>
                  <input
                    type="text"
                    value={editingItem.document_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, document_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Name</label>
                  <input
                    type="text"
                    value={editingItem.document_name || ''}
                    onChange={(e) => setEditingItem({...editingItem, document_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    value={editingItem.document_type || ''}
                    onChange={(e) => setEditingItem({...editingItem, document_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Contract">Contract</option>
                    <option value="License">License</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Tax">Tax</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                  <input
                    type="date"
                    value={editingItem.upload_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, upload_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    value={editingItem.expiry_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, expiry_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Status</label>
                  <select
                    value={editingItem.document_status || ''}
                    onChange={(e) => setEditingItem({...editingItem, document_status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending">Pending</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Reference</label>
                  <input
                    type="text"
                    value={editingItem.file_reference || ''}
                    onChange={(e) => setEditingItem({...editingItem, file_reference: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

export default Vendor_Documentation;
