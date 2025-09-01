import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Package, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface InventoryItem {
  id?: string;
  report_id?: string;
  Inventory_ID: string;
  Item_ID: string;
  Item_Name: string;
  Category: string;
  Current_Stock: number;
  Unit: string;
  Location: string;
  Last_Updated: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  procurement_inventory_items: InventoryItem[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyInventoryItem: InventoryItem = {
  Inventory_ID: '',
  Item_ID: '',
  Item_Name: '',
  Category: '',
  Current_Stock: 0,
  Unit: '',
  Location: '',
  Last_Updated: '',
  Responsible_Person: '',
  Remarks: '',
};

const InventoryAndStockManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: InventoryItem | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const getAllItems = (): InventoryItem[] => {
    return data.flatMap(report => 
      report.procurement_inventory_items.map(item => ({
        ...item,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (item: InventoryItem, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, item: { ...emptyInventoryItem }, isNew: true, reportId });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedItems = report.procurement_inventory_items.filter(i => i.id !== itemId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Inventory_and_Stock_Management: updatedItems
          }
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete inventory item');
    }
  };

  const handleView = (item: InventoryItem) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedItems: InventoryItem[];
        if (editModal.isNew) {
          const newItem = { ...editModal.item, id: `temp_${Date.now()}` };
          updatedItems = [...report.procurement_inventory_items, newItem];
        } else {
          updatedItems = report.procurement_inventory_items.map(i =>
            i.id === editModal.item!.id ? editModal.item! : i
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Inventory_and_Stock_Management: updatedItems
          }
        });
        setEditModal({ open: false, item: null, isNew: false, reportId: null });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save inventory item');
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

  const items = getAllItems();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Inventory and Stock Management</h1>
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
              <div className="text-2xl font-bold">{items.length}</div>
              <div className="text-sm">Total Items</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {items.filter(i => i.Current_Stock > 0).length}
              </div>
              <div className="text-sm">In Stock</div>
            </div>
            <div className="bg-gradient-to-r from-red-400 to-red-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {items.filter(i => i.Current_Stock === 0).length}
              </div>
              <div className="text-sm">Out of Stock</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {items.reduce((sum, i) => sum + i.Current_Stock, 0).toLocaleString()}
              </div>
              <div className="text-sm">Total Stock</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
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
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Inventory_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Item_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Item_Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.Current_Stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.Current_Stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Last_Updated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(item, item.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id!, item.report_id!)}
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
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Inventory Item</h3>
                <button
                  onClick={() => setViewModal({ open: false, item: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Inventory_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Item_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Item_Name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Current_Stock}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Last_Updated}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Responsible_Person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.item.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Inventory Item' : 'Edit Inventory Item'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inventory ID</label>
                  <input
                    type="text"
                    value={editModal.item.Inventory_ID}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Inventory_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item ID</label>
                  <input
                    type="text"
                    value={editModal.item.Item_ID}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Item_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <input
                    type="text"
                    value={editModal.item.Item_Name}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Item_Name: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={editModal.item.Category}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Category: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <input
                    type="number"
                    value={editModal.item.Current_Stock}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Current_Stock: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    value={editModal.item.Unit}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Unit: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={editModal.item.Location}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Location: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <input
                    type="date"
                    value={editModal.item.Last_Updated}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Last_Updated: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.item.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.item.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
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

export default InventoryAndStockManagementPage;
