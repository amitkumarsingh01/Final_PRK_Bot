import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';  

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface PurchaseOrder {
  id?: string;
  report_id?: string;
  PR_PO_ID: string;
  Requisitioner: string;
  Item_Service: string;
  Quantity: number;
  Requested_Date: string;
  Approved_Date: string;
  Purchase_Order_Date: string;
  Vendor_ID: string;
  Total_Cost: number;
  Status: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  purchase_orders: PurchaseOrder[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyPurchaseOrder: PurchaseOrder = {
  PR_PO_ID: '',
  Requisitioner: '',
  Item_Service: '',
  Quantity: 0,
  Requested_Date: '',
  Approved_Date: '',
  Purchase_Order_Date: '',
  Vendor_ID: '',
  Total_Cost: 0,
  Status: '',
  Responsible_Person: '',
  Remarks: '',
};

const PurchaseRequisitionToOrderPage: React.FC = () => {
  console.log('🚀 PurchaseRequisitionToOrder: Component initialized');
  const { user } = useAuth();
  console.log('👤 PurchaseRequisitionToOrder: User loaded', { userId: user?.userId });
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; order: PurchaseOrder | null }>({ open: false, order: null });
  const [editModal, setEditModal] = useState<{ open: boolean; order: PurchaseOrder | null; isNew: boolean; reportId: string | null }>({ open: false, order: null, isNew: false, reportId: null });

  const getAllOrders = (): PurchaseOrder[] => {
    return data.flatMap(report => 
      report.purchase_orders.map(order => ({
        ...order,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (order: PurchaseOrder, reportId: string) => {
    setEditModal({ open: true, order: { ...order }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, order: { ...emptyPurchaseOrder }, isNew: true, reportId });
  };

  const handleDelete = async (orderId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedOrders = report.purchase_orders.filter(o => o.id !== orderId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Purchase_Requisition_to_Order: updatedOrders
          }
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete purchase order');
    }
  };

  const handleView = (order: PurchaseOrder) => {
    setViewModal({ open: true, order });
  };

  const handleSave = async () => {
    if (!editModal.order || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedOrders: PurchaseOrder[];
        if (editModal.isNew) {
          const newOrder = { ...editModal.order, id: `temp_${Date.now()}` };
          updatedOrders = [...report.purchase_orders, newOrder];
        } else {
          updatedOrders = report.purchase_orders.map(o =>
            o.id === editModal.order!.id ? editModal.order! : o
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Purchase_Requisition_to_Order: updatedOrders
          }
        });
        setEditModal({ open: false, order: null, isNew: false, reportId: null });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save purchase order');
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

  const orders = getAllOrders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Purchase Requisition to Order</h1>
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
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm">Total Orders</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {orders.filter(o => o.Status === 'Approved').length}
              </div>
              <div className="text-sm">Approved</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {orders.filter(o => o.Status === 'Pending').length}
              </div>
              <div className="text-sm">Pending</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                ₹{orders.reduce((sum, o) => sum + o.Total_Cost, 0).toLocaleString()}
              </div>
              <div className="text-sm">Total Value</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Purchase Orders</h2>
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
                  <span>Add Order</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR/PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisitioner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item/Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.PR_PO_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Requisitioner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Item_Service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.Total_Cost.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Vendor_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.Status === 'Approved' ? 'bg-green-100 text-green-800' :
                        order.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.Status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        order.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(order, order.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id!, order.report_id!)}
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
      {viewModal.open && viewModal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Purchase Order</h3>
                <button
                  onClick={() => setViewModal({ open: false, order: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PR/PO ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.PR_PO_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requisitioner</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Requisitioner}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Item_Service}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                  <p className="mt-1 text-sm text-gray-900">₹{viewModal.order.Total_Cost.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Vendor_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Requested_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approved Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Approved_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Order Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Purchase_Order_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Responsible_Person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Status}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.order.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Purchase Order' : 'Edit Purchase Order'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, order: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PR/PO ID</label>
                  <input
                    type="text"
                    value={editModal.order.PR_PO_ID}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, PR_PO_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requisitioner</label>
                  <input
                    type="text"
                    value={editModal.order.Requisitioner}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Requisitioner: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <input
                    type="text"
                    value={editModal.order.Item_Service}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Item_Service: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={editModal.order.Quantity}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Quantity: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editModal.order.Total_Cost}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Total_Cost: parseFloat(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <input
                    type="text"
                    value={editModal.order.Vendor_ID}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Vendor_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested Date</label>
                  <input
                    type="date"
                    value={editModal.order.Requested_Date}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Requested_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approved Date</label>
                  <input
                    type="date"
                    value={editModal.order.Approved_Date}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Approved_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Order Date</label>
                  <input
                    type="date"
                    value={editModal.order.Purchase_Order_Date}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Purchase_Order_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.order.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.order.Status}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                    
                    
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.order.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, order: { ...editModal.order!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, order: null, isNew: false, reportId: null })}
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

export default PurchaseRequisitionToOrderPage;
