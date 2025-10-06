import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

// Property interface not needed here as we show fixed label only

interface InventoryItem {
  id?: string;
  inventory_report_id?: string;
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  unit: string;
  location: string;
  last_updated: string;
  responsible_person: string;
  remarks: string;
}

interface InventoryReport {
  id: string;
  property_id: string;
  inventory_items: InventoryItem[];
}

const API_URL = 'https://server.prktechindia.in/inventory-reports/';
// const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyInventoryItem: InventoryItem = {
  item_id: '',
  item_name: '',
  category: '',
  current_stock: 0,
  unit: '',
  location: '',
  last_updated: '',
  responsible_person: '',
  remarks: '',
};

const InventoryTrackingPage: React.FC = () => {
  console.log('🚀 InventoryTracking: Component initialized');
  const { user } = useAuth();
  console.log('👤 InventoryTracking: User loaded', { userId: user?.userId });
  const [data, setData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: InventoryItem | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: InventoryItem, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = async () => {
    const reportId = await ensureReportForProperty();
    if (!reportId) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyInventoryItem }, reportId });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.inventory_items.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { inventory_items: newArr }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: InventoryItem) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: InventoryItem[];
      if (editModal.isNew) {
        newArr = [...report.inventory_items, editModal.item];
      } else {
        newArr = report.inventory_items.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { inventory_items: newArr }, {
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
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Inventory Tracking</h2>
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
              <th className="px-3 py-2 border">Item ID</th>
              <th className="px-3 py-2 border">Item Name</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Current Stock</th>
              <th className="px-3 py-2 border">Unit</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Last Updated</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report) =>
                  report.inventory_items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_name}</td>
                      <td className="border px-2 py-1">{item.category}</td>
                      <td className="border px-2 py-1">{item.current_stock}</td>
                      <td className="border px-2 py-1">{item.unit}</td>
                      <td className="border px-2 py-1">{item.location}</td>
                      <td className="border px-2 py-1">{item.last_updated}</td>
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
          <Plus size={18} className="mr-2" /> Add Inventory Item
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Inventory Item
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
                <input className="border rounded px-3 py-2" placeholder="Item ID" value={editModal.item.item_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Item Name" value={editModal.item.item_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_name: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Current Stock" type="number" value={editModal.item.current_stock} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, current_stock: parseInt(e.target.value) || 0 } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Location" value={editModal.item.location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Last Updated" value={editModal.item.last_updated} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, last_updated: e.target.value } })} required />
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
                Inventory Item Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Item ID:</b> {viewModal.item.item_id}</div>
              <div><b>Item Name:</b> {viewModal.item.item_name}</div>
              <div><b>Category:</b> {viewModal.item.category}</div>
              <div><b>Current Stock:</b> {viewModal.item.current_stock}</div>
              <div><b>Unit:</b> {viewModal.item.unit}</div>
              <div><b>Location:</b> {viewModal.item.location}</div>
              <div><b>Last Updated:</b> {viewModal.item.last_updated}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTrackingPage; 
