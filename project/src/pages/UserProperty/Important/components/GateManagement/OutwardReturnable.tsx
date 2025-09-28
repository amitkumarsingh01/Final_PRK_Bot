import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface OutwardReturnable {
  id?: string;
  report_id?: string;
  item_id: string;
  item_description: string;
  quantity: number;
  recipient_name: string;
  recipient_contact: string;
  outward_date: string;
  outward_time: string;
  gate_no: string;
  vehicle_no: string;
  driver_name: string;
  expected_return_date: string;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  outward_returnable: OutwardReturnable[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyOutward: OutwardReturnable = {
  item_id: '',
  item_description: '',
  quantity: 1,
  recipient_name: '',
  recipient_contact: '',
  outward_date: '',
  outward_time: '',
  gate_no: '',
  vehicle_no: '',
  driver_name: '',
  expected_return_date: '',
  security_officer: '',
  remarks: '',
};

const COutwardReturnablePage: React.FC = () => {
  console.log('🚀 OutwardReturnable: Component initialized');
  const { user } = useAuth();
  console.log('👤 OutwardReturnable: User loaded', { userId: user?.userId });
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: OutwardReturnable | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: OutwardReturnable | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });




  // Fetch visitor management reports for user's property
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  const fetchData = async () => {
    if (!user?.propertyId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const items: VisitorManagementReport[] = res.data || [];
      const filtered = Array.isArray(items)
        ? items.filter(r => r.property_id === (user?.propertyId || ''))
        : [];
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch visitor management reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) fetchData();
  }, [user?.propertyId]);

  // CRUD handlers
  const handleEdit = (item: OutwardReturnable, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyOutward },
      reportId,
    });
  };
  const ensureReportForProperty = async (): Promise<string | null> => {
    if (data.length > 0) return data[0].id;
    if (!user?.propertyId) return null;
    try {
      const res = await axios.post(API_URL, {
        property_id: user.propertyId,
        outward_returnable: [],
      }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const created = res.data;
      setData([created, ...data]);
      return created.id as string;
    } catch (e) {
      setError('Failed to initialize report for this property');
      return null;
    }
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      // Find the report
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      // Remove the entry
      const newArr = report.outward_returnable.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { outward_returnable: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: OutwardReturnable) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: OutwardReturnable[];
      if (editModal.isNew) {
        newArr = [...report.outward_returnable, editModal.item];
      } else {
        newArr = report.outward_returnable.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { outward_returnable: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
    return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Outward Returnable Management</h2>
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
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Quantity</th>
              <th className="px-3 py-2 border">Recipient</th>
              <th className="px-3 py-2 border">Outward Date</th>
              <th className="px-3 py-2 border">Outward Time</th>
              <th className="px-3 py-2 border">Gate No</th>
              <th className="px-3 py-2 border">Vehicle No</th>
              <th className="px-3 py-2 border">Driver</th>
              <th className="px-3 py-2 border">Expected Return Date</th>
              <th className="px-3 py-2 border">Security Officer</th>
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
                  report.outward_returnable.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_description}</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">{item.recipient_name}</td>
                      <td className="border px-2 py-1">{item.outward_date}</td>
                      <td className="border px-2 py-1">{item.outward_time}</td>
                      <td className="border px-2 py-1">{item.gate_no}</td>
                      <td className="border px-2 py-1">{item.vehicle_no}</td>
                      <td className="border px-2 py-1">{item.driver_name}</td>
                      <td className="border px-2 py-1">{item.expected_return_date}</td>
                      <td className="border px-2 py-1">{item.security_officer}</td>
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
      {/* Add Button */}
      {isAdmin && (
        <button
          onClick={async () => { const id = await ensureReportForProperty(); if (id) handleAdd(id); }}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Outward Returnable Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Outward Returnable Entry
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Item ID" value={editModal.item.item_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Description" value={editModal.item.item_description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_description: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Quantity" type="number" value={editModal.item.quantity} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, quantity: parseInt(e.target.value) } })} required />
                <input className="border rounded px-3 py-2" placeholder="Recipient Name" value={editModal.item.recipient_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, recipient_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Recipient Contact" value={editModal.item.recipient_contact} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, recipient_contact: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Outward Date" type="date" value={editModal.item.outward_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, outward_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Outward Time" type="time" value={editModal.item.outward_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, outward_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Gate No" value={editModal.item.gate_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, gate_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vehicle No" value={editModal.item.vehicle_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vehicle_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Driver Name" value={editModal.item.driver_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, driver_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Expected Return Date" type="date" value={editModal.item.expected_return_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, expected_return_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Security Officer" value={editModal.item.security_officer} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, security_officer: e.target.value } })} required />
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

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Outward Returnable Entry
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
              <div><b>Description:</b> {viewModal.item.item_description}</div>
              <div><b>Quantity:</b> {viewModal.item.quantity}</div>
              <div><b>Recipient Name:</b> {viewModal.item.recipient_name}</div>
              <div><b>Recipient Contact:</b> {viewModal.item.recipient_contact}</div>
              <div><b>Outward Date:</b> {viewModal.item.outward_date}</div>
              <div><b>Outward Time:</b> {viewModal.item.outward_time}</div>
              <div><b>Gate No:</b> {viewModal.item.gate_no}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no}</div>
              <div><b>Driver Name:</b> {viewModal.item.driver_name}</div>
              <div><b>Expected Return Date:</b> {viewModal.item.expected_return_date}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
        </div>
    );
};

export default COutwardReturnablePage;
