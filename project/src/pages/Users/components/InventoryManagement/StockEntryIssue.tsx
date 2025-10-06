import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface StockTransaction {
  id?: string;
  inventory_report_id?: string;
  transaction_id: string;
  item_id: string;
  item_name: string;
  transaction_type: string;
  quantity: number;
  unit: string;
  date: string;
  time: string;
  supplier_recipient: string;
  vehicle_no: string;
  responsible_person: string;
  remarks: string;
}

interface InventoryReport {
  id: string;
  property_id: string;
  stock_transactions: StockTransaction[];
}

const API_URL = 'https://server.prktechindia.in/inventory-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyStockTransaction: StockTransaction = {
  transaction_id: '',
  item_id: '',
  item_name: '',
  transaction_type: '',
  quantity: 0,
  unit: '',
  date: '',
  time: '',
  supplier_recipient: '',
  vehicle_no: '',
  responsible_person: '',
  remarks: '',
};

const StockEntryIssuePage: React.FC = () => {
  console.log('🚀 StockEntryIssue: Component initialized');
  const { user } = useAuth();
  console.log('👤 StockEntryIssue: User loaded', { userId: user?.userId });
  const [data, setData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: StockTransaction | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: StockTransaction | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const arr = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? arr.filter((r: InventoryReport) => r.property_id === user.propertyId) : arr;
      setData(filtered);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.propertyId]);

  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === user?.propertyId);
      if (existing) return existing.id;
      if (!user?.propertyId || !user?.token) return null;
      const created = await axios.post(API_URL, { property_id: user.propertyId }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const newId = created?.data?.id;
      await fetchData();
      return newId || null;
    } catch (e) {
      setError('Failed to create report');
      return null;
    }
  };

  const handleEdit = (item: StockTransaction, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = async () => {
    const reportId = await ensureReportForProperty();
    if (!reportId) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyStockTransaction }, reportId });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this stock transaction?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.stock_transactions.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { stock_transactions: newArr }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: StockTransaction) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: StockTransaction[];
      if (editModal.isNew) {
        newArr = [...report.stock_transactions, editModal.item];
      } else {
        newArr = report.stock_transactions.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { stock_transactions: newArr }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Stock Entry & Issue</h2>
      {/* Property Display */}
      <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
            </div>
          </div>
        </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Transaction ID</th>
              <th className="px-3 py-2 border">Item ID</th>
              <th className="px-3 py-2 border">Item Name</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Quantity</th>
              <th className="px-3 py-2 border">Unit</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Time</th>
              <th className="px-3 py-2 border">Supplier/Recipient</th>
              <th className="px-3 py-2 border">Vehicle No</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.stock_transactions.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.transaction_id}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_name}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.transaction_type === 'Entry' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">{item.unit}</td>
                      <td className="border px-2 py-1">{item.date}</td>
                      <td className="border px-2 py-1">{item.time}</td>
                      <td className="border px-2 py-1">{item.supplier_recipient}</td>
                      <td className="border px-2 py-1">{item.vehicle_no || '-'}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button
          onClick={handleAdd}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Stock Transaction
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Stock Transaction
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-3 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Transaction ID" value={editModal.item.transaction_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, transaction_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Item ID" value={editModal.item.item_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Item Name" value={editModal.item.item_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_name: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Quantity" type="number" value={editModal.item.quantity} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, quantity: parseInt(e.target.value) || 0 } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Date" type="date" value={editModal.item.date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Time" type="time" value={editModal.item.time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Supplier/Recipient" value={editModal.item.supplier_recipient} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, supplier_recipient: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vehicle No (Optional)" value={editModal.item.vehicle_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vehicle_no: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Stock Transaction Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Transaction ID:</b> {viewModal.item.transaction_id}</div>
              <div><b>Item ID:</b> {viewModal.item.item_id}</div>
              <div><b>Item Name:</b> {viewModal.item.item_name}</div>
              <div><b>Transaction Type:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  viewModal.item.transaction_type === 'Entry' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {viewModal.item.transaction_type}
                </span>
              </div>
              <div><b>Quantity:</b> {viewModal.item.quantity}</div>
              <div><b>Unit:</b> {viewModal.item.unit}</div>
              <div><b>Date:</b> {viewModal.item.date}</div>
              <div><b>Time:</b> {viewModal.item.time}</div>
              <div><b>Supplier/Recipient:</b> {viewModal.item.supplier_recipient}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no || 'N/A'}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockEntryIssuePage; 
