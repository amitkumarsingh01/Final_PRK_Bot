import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface Vendor {
  id?: string;
  report_id?: string;
  Vendor_ID: string;
  Vendor_Name: string;
  Contact_Phone: string;
  Contact_Email: string;
  Category: string;
  Contract_Start_Date: string;
  Contract_End_Date: string;
  Performance_Rating: number;
  Status: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  vendors: Vendor[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendor: Vendor = {
  Vendor_ID: '',
  Vendor_Name: '',
  Contact_Phone: '',
  Contact_Email: '',
  Category: '',
  Contract_Start_Date: '',
  Contract_End_Date: '',
  Performance_Rating: 0,
  Status: '',
  Responsible_Person: '',
  Remarks: '',
};

const VendorManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; vendor: Vendor | null }>({ open: false, vendor: null });
  const [editModal, setEditModal] = useState<{ open: boolean; vendor: Vendor | null; isNew: boolean; reportId: string | null }>({ open: false, vendor: null, isNew: false, reportId: null });

  const getAllVendors = (): Vendor[] => {
    return data.flatMap(report => 
      report.vendors.map(vendor => ({
        ...vendor,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (vendor: Vendor, reportId: string) => {
    setEditModal({ open: true, vendor: { ...vendor }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, vendor: { ...emptyVendor }, isNew: true, reportId });
  };

  const handleDelete = async (vendorId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedVendors = report.vendors.filter(v => v.id !== vendorId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Vendor_Management: updatedVendors
          }
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete vendor');
    }
  };

  const handleView = (vendor: Vendor) => {
    setViewModal({ open: true, vendor });
  };

  const handleSave = async () => {
    if (!editModal.vendor || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedVendors: Vendor[];
        if (editModal.isNew) {
          const newVendor = { ...editModal.vendor, id: `temp_${Date.now()}` };
          updatedVendors = [...report.vendors, newVendor];
        } else {
          updatedVendors = report.vendors.map(v =>
            v.id === editModal.vendor!.id ? editModal.vendor! : v
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Vendor_Management: updatedVendors
          }
        });
        setEditModal({ open: false, vendor: null, isNew: false, reportId: null });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save vendor');
    }
  };

  
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: orange }}></div>
      </div>
    );
  }

  const vendors = getAllVendors();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
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
              <div className="text-2xl font-bold">{vendors.length}</div>
              <div className="text-sm">Total Vendors</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.Status === 'Active').length}
              </div>
              <div className="text-sm">Active Vendors</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.Performance_Rating >= 4).length}
              </div>
              <div className="text-sm">High Performance</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.Status === 'Contract Expired').length}
              </div>
              <div className="text-sm">Expired Contracts</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Vendors</h2>
              {isAdmin && user?.propertyId && (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.Vendor_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.Vendor_Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Phone size={14} />
                        <span>{vendor.Contact_Phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail size={14} />
                        <span>{vendor.Contact_Email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.Category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.Contract_Start_Date} - {vendor.Contract_End_Date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{vendor.Performance_Rating}/5</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-3 h-3 rounded-full ${
                                star <= vendor.Performance_Rating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vendor.Status === 'Active' ? 'bg-green-100 text-green-800' :
                        vendor.Status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        vendor.Status === 'Contract Expired' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vendor.Status}
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
                              onClick={() => handleEdit(vendor, vendor.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor.id!, vendor.report_id!)}
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
                <h3 className="text-lg font-semibold text-gray-900">View Vendor</h3>
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
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Vendor_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Vendor_Name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Contact_Phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Contact_Email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Performance_Rating}/5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract Start Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Contract_Start_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract End Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Contract_End_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Responsible_Person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Status}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.vendor.Remarks}</p>
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
                  {editModal.isNew ? 'Add Vendor' : 'Edit Vendor'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, vendor: null, isNew: false, reportId: null })}
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
                    value={editModal.vendor.Vendor_ID}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Vendor_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
                  <input
                    type="text"
                    value={editModal.vendor.Vendor_Name}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Vendor_Name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="tel"
                    value={editModal.vendor.Contact_Phone}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Contact_Phone: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={editModal.vendor.Contact_Email}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Contact_Email: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={editModal.vendor.Category}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Category: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                  <select
                    value={editModal.vendor.Performance_Rating}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Performance_Rating: parseInt(e.target.value) } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={0}>Select Rating</option>
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Fair</option>
                    <option value={3}>3 - Good</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract Start Date</label>
                  <input
                    type="date"
                    value={editModal.vendor.Contract_Start_Date}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Contract_Start_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contract End Date</label>
                  <input
                    type="date"
                    value={editModal.vendor.Contract_End_Date}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Contract_End_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.vendor.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.vendor.Status}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                    
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.vendor.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, vendor: { ...editModal.vendor!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, vendor: null, isNew: false, reportId: null })}
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

export default VendorManagementPage;
