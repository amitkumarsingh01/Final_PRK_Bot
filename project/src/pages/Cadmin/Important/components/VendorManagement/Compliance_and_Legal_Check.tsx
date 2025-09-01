import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface ComplianceAndLegalCheck {
  id: string;
  vendor_master_id: string;
  compliance_id: string;
  compliance_type: string;
  check_date: string;
  expiry_date: string;
  compliance_status: string;
  document_reference: string;
  responsible_person: string;
  remarks: string;
}

const Compliance_and_Legal_Check: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<ComplianceAndLegalCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceAndLegalCheck | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<ComplianceAndLegalCheck>>({});

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

  // Fetch compliance and legal check data
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        
        // Filter vendors that have compliance and legal check data and map it
        const complianceData = response.data
          .filter((vendor: any) => vendor.compliance_and_legal_check)
          .map((vendor: any) => ({
            id: vendor.compliance_and_legal_check.id,
            vendor_master_id: vendor.id,
            compliance_id: vendor.compliance_and_legal_check.compliance_id,
            compliance_type: vendor.compliance_and_legal_check.compliance_type,
            check_date: vendor.compliance_and_legal_check.check_date,
            expiry_date: vendor.compliance_and_legal_check.expiry_date,
            compliance_status: vendor.compliance_and_legal_check.compliance_status,
            document_reference: vendor.compliance_and_legal_check.document_reference,
            responsible_person: vendor.compliance_and_legal_check.responsible_person,
            remarks: vendor.compliance_and_legal_check.remarks,
          }));

        setData(complianceData);
      } catch (err) {
        console.error('Error fetching compliance data:', err);
        setError('Failed to fetch compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty]);

  const handleView = (item: ComplianceAndLegalCheck) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: ComplianceAndLegalCheck) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      compliance_id: '',
      compliance_type: '',
      check_date: '',
      expiry_date: '',
      compliance_status: '',
      document_reference: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: ComplianceAndLegalCheck) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this compliance record?')) {
      return;
    }

    try {
      // Find the vendor that has this compliance check
      const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const vendor = response.data.find((v: any) => v.compliance_and_legal_check?.id === item.id);
      
      if (vendor) {
        // Update the vendor with compliance check set to null
        await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
          ...vendor,
          compliance_and_legal_check: null
        });
        
        setData(data.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error('Error deleting compliance check:', err);
      setError('Failed to delete compliance check');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (editingItem.id) {
        // Update existing compliance check
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendor = response.data.find((v: any) => v.compliance_and_legal_check?.id === editingItem.id);
        
        if (vendor) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
            ...vendor,
            compliance_and_legal_check: {
              compliance_id: editingItem.compliance_id,
              compliance_type: editingItem.compliance_type,
              check_date: editingItem.check_date,
              expiry_date: editingItem.expiry_date,
              compliance_status: editingItem.compliance_status,
              document_reference: editingItem.document_reference,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      } else {
        // Create new compliance check - we need to select a vendor first
        // For now, we'll use the first vendor without compliance check
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendorWithoutCompliance = response.data.find((v: any) => !v.compliance_and_legal_check);
        
        if (vendorWithoutCompliance) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendorWithoutCompliance.id}`, {
            ...vendorWithoutCompliance,
            compliance_and_legal_check: {
              compliance_id: editingItem.compliance_id,
              compliance_type: editingItem.compliance_type,
              check_date: editingItem.check_date,
              expiry_date: editingItem.expiry_date,
              compliance_status: editingItem.compliance_status,
              document_reference: editingItem.document_reference,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      }

      // Refresh data
      const refreshResponse = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const complianceData = refreshResponse.data
        .filter((vendor: any) => vendor.compliance_and_legal_check)
        .map((vendor: any) => ({
          id: vendor.compliance_and_legal_check.id,
          vendor_master_id: vendor.id,
          compliance_id: vendor.compliance_and_legal_check.compliance_id,
          compliance_type: vendor.compliance_and_legal_check.compliance_type,
          check_date: vendor.compliance_and_legal_check.check_date,
          expiry_date: vendor.compliance_and_legal_check.expiry_date,
          compliance_status: vendor.compliance_and_legal_check.compliance_status,
          document_reference: vendor.compliance_and_legal_check.document_reference,
          responsible_person: vendor.compliance_and_legal_check.responsible_person,
          remarks: vendor.compliance_and_legal_check.remarks,
        }));

      setData(complianceData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving compliance check:', err);
      setError('Failed to save compliance check');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'legal':
        return 'bg-purple-100 text-purple-800';
      case 'regulatory':
        return 'bg-blue-100 text-blue-800';
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'operational':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiringCompliance = () => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return data.filter(item => {
      const expiryDate = new Date(item.expiry_date);
      return expiryDate >= today && expiryDate <= nextMonth;
    });
  };

  const getExpiredCompliance = () => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance and Legal Check</h1>
        <p className="text-gray-600">Manage vendor compliance and legal requirements</p>
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
              <p className="text-sm font-medium text-gray-600">Total Checks</p>
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
              <p className="text-sm font-medium text-gray-600">Compliant</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => item.compliance_status.toLowerCase() === 'compliant').length}
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
              <p className="text-2xl font-semibold text-gray-900">{getExpiringCompliance().length}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{getExpiredCompliance().length}</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Compliance Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Compliance Check
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
                        {item.compliance_id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Expires: {item.expiry_date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatusColor(item.compliance_status)}`}>
                    {item.compliance_status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceTypeColor(item.compliance_type)}`}>
                    {item.compliance_type}
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No compliance checks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new compliance check.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.compliance_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.compliance_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.check_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.expiry_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.compliance_status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Reference</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.document_reference}</p>
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
                {editingItem.id ? 'Edit Compliance Check' : 'Add Compliance Check'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance ID</label>
                  <input
                    type="text"
                    value={editingItem.compliance_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, compliance_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Type</label>
                  <select
                    value={editingItem.compliance_type || ''}
                    onChange={(e) => setEditingItem({...editingItem, compliance_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Legal">Legal</option>
                    <option value="Regulatory">Regulatory</option>
                    <option value="Financial">Financial</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check Date</label>
                  <input
                    type="date"
                    value={editingItem.check_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, check_date: e.target.value})}
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
                  <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
                  <select
                    value={editingItem.compliance_status || ''}
                    onChange={(e) => setEditingItem({...editingItem, compliance_status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Compliant">Compliant</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Reference</label>
                  <input
                    type="text"
                    value={editingItem.document_reference || ''}
                    onChange={(e) => setEditingItem({...editingItem, document_reference: e.target.value})}
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

export default Compliance_and_Legal_Check;
