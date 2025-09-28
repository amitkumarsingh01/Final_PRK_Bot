import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Tag } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProcurementCategory {
  id?: string;
  report_id?: string;
  Category_ID: string;
  Category_Name: string;
  Description: string;
  Budget_Allocation: number;
  Items_Services: string;
  Responsible_Person: string;
  Status: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  procurement_categories: ProcurementCategory[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProcurementCategory: ProcurementCategory = {
  Category_ID: '',
  Category_Name: '',
  Description: '',
  Budget_Allocation: 0,
  Items_Services: '',
  Responsible_Person: '',
  Status: '',
  Remarks: '',
};

const ProcurementCategoriesPage: React.FC = () => {
  console.log('🚀 ProcurementCategories: Component initialized');
  const { user } = useAuth();
  console.log('👤 ProcurementCategories: User loaded', { userId: user?.userId });
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; category: ProcurementCategory | null }>({ open: false, category: null });
  const [editModal, setEditModal] = useState<{ open: boolean; category: ProcurementCategory | null; isNew: boolean; reportId: string | null }>({ open: false, category: null, isNew: false, reportId: null });

  const getAllCategories = (): ProcurementCategory[] => {
    return data.flatMap(report => 
      report.procurement_categories.map(category => ({
        ...category,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (category: ProcurementCategory, reportId: string) => {
    setEditModal({ open: true, category: { ...category }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, category: { ...emptyProcurementCategory }, isNew: true, reportId });
  };

  const handleDelete = async (categoryId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;

      const updatedCategories = report.procurement_categories.filter(c => c.id !== categoryId);
      const updatedReport = { ...report, procurement_categories: updatedCategories };

      await axios.put(`${API_URL}${reportId}`, {
        property_id: report.property_id,
        Procurement_Management: {
          Procurement_Categories: updatedCategories
        }
      });

      setData(data.map(r => r.id === reportId ? updatedReport : r));
    } catch (e) {
      setError('Failed to delete category');
    }
  };

  const handleView = (category: ProcurementCategory) => {
    setViewModal({ open: true, category });
  };

  const handleSave = async () => {
    if (!editModal.reportId || !editModal.category) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;

      let updatedCategories;
      if (editModal.isNew) {
        updatedCategories = [...report.procurement_categories, editModal.category];
      } else {
        updatedCategories = report.procurement_categories.map(c => 
          c.id === editModal.category!.id ? editModal.category! : c
        );
      }

      const updatedReport = { ...report, procurement_categories: updatedCategories };

      await axios.put(`${API_URL}${editModal.reportId}`, {
        property_id: report.property_id,
        Procurement_Management: {
          Procurement_Categories: updatedCategories
        }
      });

      setData(data.map(r => r.id === editModal.reportId ? updatedReport : r));
      setEditModal({ open: false, category: null, isNew: false, reportId: null });
    } catch (e) {
      setError('Failed to save category');
    }
  };

  
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading procurement categories...</p>
        </div>
      </div>
    );
  }

  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Tag size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Procurement Categories</h1>
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
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm">Total Categories</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {categories.filter(c => c.Status === 'Active').length}
              </div>
              <div className="text-sm">Active</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {categories.filter(c => c.Status === 'Inactive').length}
              </div>
              <div className="text-sm">Inactive</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                ₹{categories.reduce((sum, c) => sum + c.Budget_Allocation, 0).toLocaleString()}
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
              <h2 className="text-xl font-semibold text-gray-900">Procurement Categories</h2>
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
                  <span>Add Category</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Allocation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.Category_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.Category_Name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{category.Description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{category.Budget_Allocation.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.Responsible_Person}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.Status === 'Active' ? 'bg-green-100 text-green-800' :
                        category.Status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {category.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(category)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(category, category.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id!, category.report_id!)}
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
      {viewModal.open && viewModal.category && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Procurement Category</h3>
                <button
                  onClick={() => setViewModal({ open: false, category: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Category_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Category_Name}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Allocation</label>
                  <p className="mt-1 text-sm text-gray-900">₹{viewModal.category.Budget_Allocation.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Responsible_Person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Status}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Items/Services</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Items_Services}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.category.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.category && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Procurement Category' : 'Edit Procurement Category'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, category: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category ID</label>
                  <input
                    type="text"
                    value={editModal.category.Category_ID}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Category_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    value={editModal.category.Category_Name}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Category_Name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editModal.category.Description}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Description: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Allocation</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editModal.category.Budget_Allocation}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Budget_Allocation: parseFloat(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.category.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.category.Status}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Items/Services</label>
                  <textarea
                    value={editModal.category.Items_Services}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Items_Services: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.category.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, category: { ...editModal.category!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, category: null, isNew: false, reportId: null })}
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

export default ProcurementCategoriesPage;
