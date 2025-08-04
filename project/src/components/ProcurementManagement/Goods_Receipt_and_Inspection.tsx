import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Package, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface GoodsReceipt {
  id?: string;
  report_id?: string;
  Receipt_ID: string;
  PO_ID: string;
  Item_Service: string;
  Quantity_Received: number;
  Receipt_Date: string;
  Inspection_Date: string;
  Inspection_Result: string;
  Inspector: string;
  Storage_Location: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  goods_receipts: GoodsReceipt[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyGoodsReceipt: GoodsReceipt = {
  Receipt_ID: '',
  PO_ID: '',
  Item_Service: '',
  Quantity_Received: 0,
  Receipt_Date: '',
  Inspection_Date: '',
  Inspection_Result: '',
  Inspector: '',
  Storage_Location: '',
  Responsible_Person: '',
  Remarks: '',
};

const GoodsReceiptAndInspectionPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; receipt: GoodsReceipt | null }>({ open: false, receipt: null });
  const [editModal, setEditModal] = useState<{ open: boolean; receipt: GoodsReceipt | null; isNew: boolean; reportId: string | null }>({ open: false, receipt: null, isNew: false, reportId: null });

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
      setError('Failed to fetch goods receipt data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const getAllReceipts = (): GoodsReceipt[] => {
    return data.flatMap(report => 
      report.goods_receipts.map(receipt => ({
        ...receipt,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (receipt: GoodsReceipt, reportId: string) => {
    setEditModal({ open: true, receipt: { ...receipt }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, receipt: { ...emptyGoodsReceipt }, isNew: true, reportId });
  };

  const handleDelete = async (receiptId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this goods receipt?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedReceipts = report.goods_receipts.filter(r => r.id !== receiptId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Goods_Receipt_and_Inspection: updatedReceipts
          }
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete goods receipt');
    }
  };

  const handleView = (receipt: GoodsReceipt) => {
    setViewModal({ open: true, receipt });
  };

  const handleSave = async () => {
    if (!editModal.receipt || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedReceipts: GoodsReceipt[];
        if (editModal.isNew) {
          const newReceipt = { ...editModal.receipt, id: `temp_${Date.now()}` };
          updatedReceipts = [...report.goods_receipts, newReceipt];
        } else {
          updatedReceipts = report.goods_receipts.map(r =>
            r.id === editModal.receipt!.id ? editModal.receipt! : r
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Goods_Receipt_and_Inspection: updatedReceipts
          }
        });
        setEditModal({ open: false, receipt: null, isNew: false, reportId: null });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save goods receipt');
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

  const receipts = getAllReceipts();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Goods Receipt and Inspection</h1>
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
              <div className="text-2xl font-bold">{receipts.length}</div>
              <div className="text-sm">Total Receipts</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {receipts.filter(r => r.Inspection_Result === 'Passed').length}
              </div>
              <div className="text-sm">Passed Inspection</div>
            </div>
            <div className="bg-gradient-to-r from-red-400 to-red-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {receipts.filter(r => r.Inspection_Result === 'Failed').length}
              </div>
              <div className="text-sm">Failed Inspection</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {receipts.filter(r => r.Inspection_Result === 'Pending').length}
              </div>
              <div className="text-sm">Pending Inspection</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Goods Receipts</h2>
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
                  <span>Add Receipt</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item/Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Received</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.Receipt_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.PO_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.Item_Service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.Quantity_Received}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.Receipt_Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        receipt.Inspection_Result === 'Passed' ? 'bg-green-100 text-green-800' :
                        receipt.Inspection_Result === 'Failed' ? 'bg-red-100 text-red-800' :
                        receipt.Inspection_Result === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {receipt.Inspection_Result}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.Inspector}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(receipt)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(receipt, receipt.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(receipt.id!, receipt.report_id!)}
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
      {viewModal.open && viewModal.receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Goods Receipt</h3>
                <button
                  onClick={() => setViewModal({ open: false, receipt: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Receipt_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.PO_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Item_Service}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity Received</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Quantity_Received}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Receipt_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Inspection_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspection Result</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Inspection_Result}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspector</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Inspector}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Storage_Location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Responsible_Person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.receipt.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Goods Receipt' : 'Edit Goods Receipt'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, receipt: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt ID</label>
                  <input
                    type="text"
                    value={editModal.receipt.Receipt_ID}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Receipt_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO ID</label>
                  <input
                    type="text"
                    value={editModal.receipt.PO_ID}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, PO_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item/Service</label>
                  <input
                    type="text"
                    value={editModal.receipt.Item_Service}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Item_Service: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity Received</label>
                  <input
                    type="number"
                    value={editModal.receipt.Quantity_Received}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Quantity_Received: parseInt(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                  <input
                    type="date"
                    value={editModal.receipt.Receipt_Date}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Receipt_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
                  <input
                    type="date"
                    value={editModal.receipt.Inspection_Date}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Inspection_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspection Result</label>
                  <select
                    value={editModal.receipt.Inspection_Result}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Inspection_Result: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Result</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                    <option value="Conditional">Conditional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inspector</label>
                  <input
                    type="text"
                    value={editModal.receipt.Inspector}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Inspector: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                  <input
                    type="text"
                    value={editModal.receipt.Storage_Location}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Storage_Location: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.receipt.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.receipt.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, receipt: { ...editModal.receipt!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, receipt: null, isNew: false, reportId: null })}
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

export default GoodsReceiptAndInspectionPage;
