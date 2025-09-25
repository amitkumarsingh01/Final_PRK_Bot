import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ExpiryDamageLog {
  id?: string;
  inventory_report_id?: string;
  log_id: string;
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  date_recorded: string;
  expiry_date: string;
  reason: string;
  responsible_person: string;
  remarks: string;
}

interface InventoryReport {
  id: string;
  property_id: string;
  expiry_damage_logs: ExpiryDamageLog[];
}

const API_URL = 'https://server.prktechindia.in/inventory-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyExpiryDamageLog: ExpiryDamageLog = {
  log_id: '',
  item_id: '',
  item_name: '',
  category: '',
  quantity: 0,
  unit: '',
  status: '',
  date_recorded: '',
  expiry_date: '',
  reason: '',
  responsible_person: '',
  remarks: '',
};

const ExpiryDamageLogPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: ExpiryDamageLog | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: ExpiryDamageLog | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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
    } catch (e) {
      setError('Failed to fetch inventory reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: ExpiryDamageLog, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === selectedPropertyId);
      if (existing) return existing.id;
      if (!selectedPropertyId) return null;
      const created = await axios.post(API_URL, { property_id: selectedPropertyId }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });
      const newId = created?.data?.id;
      await fetchData(selectedPropertyId);
      return newId || null;
    } catch (e) {
      setError('Failed to create report');
      return null;
    }
  };

  const handleAdd = async () => {
    const reportId = await ensureReportForProperty();
    if (!reportId) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyExpiryDamageLog }, reportId });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this expiry/damage log?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.expiry_damage_logs.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { expiry_damage_logs: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: ExpiryDamageLog) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: ExpiryDamageLog[];
      if (editModal.isNew) {
        newArr = [...report.expiry_damage_logs, editModal.item];
      } else {
        newArr = report.expiry_damage_logs.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { expiry_damage_logs: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Damaged':
        return 'bg-orange-100 text-orange-800';
      case 'Disposed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Expiry & Damage Log</h2>
      {/* Property Selection Dropdown */}
      <div className="mb-6 max-w-md">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <select
            id="propertySelect"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
          >
            <option value="">Select a property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Log ID</th>
              <th className="px-3 py-2 border">Item ID</th>
              <th className="px-3 py-2 border">Item Name</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Quantity</th>
              <th className="px-3 py-2 border">Unit</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Date Recorded</th>
              <th className="px-3 py-2 border">Expiry Date</th>
              <th className="px-3 py-2 border">Reason</th>
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
                  report.expiry_damage_logs.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.log_id}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_name}</td>
                      <td className="border px-2 py-1">{item.category}</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">{item.unit}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.date_recorded}</td>
                      <td className="border px-2 py-1">{item.expiry_date || 'N/A'}</td>
                      <td className="border px-2 py-1">{item.reason}</td>
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
      {isAdmin && selectedPropertyId && (
        <button
          onClick={handleAdd}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Expiry/Damage Log
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Expiry/Damage Log
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
                <input className="border rounded px-3 py-2" placeholder="Log ID" value={editModal.item.log_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, log_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Item ID" value={editModal.item.item_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Item Name" value={editModal.item.item_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, item_name: e.target.value } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.category} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, category: e.target.value } })} required>
                  <option value="">Select Category</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Tools">Tools</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Quantity" type="number" value={editModal.item.quantity} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, quantity: parseInt(e.target.value) || 0 } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.unit} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, unit: e.target.value } })} required>
                  <option value="">Select Unit</option>
                  <option value="pcs">Pieces</option>
                  <option value="box">Box</option>
                  <option value="ream">Ream</option>
                  <option value="liters">Liters</option>
                  <option value="kg">Kilograms</option>
                  <option value="meters">Meters</option>
                  <option value="sets">Sets</option>
                </select>
                <select className="border rounded px-3 py-2" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="Expired">Expired</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Disposed">Disposed</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Date Recorded" type="date" value={editModal.item.date_recorded} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, date_recorded: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Expiry Date (Optional)" type="date" value={editModal.item.expiry_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, expiry_date: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Reason" value={editModal.item.reason} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, reason: e.target.value } })} required />
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
                Expiry/Damage Log Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Log ID:</b> {viewModal.item.log_id}</div>
              <div><b>Item ID:</b> {viewModal.item.item_id}</div>
              <div><b>Item Name:</b> {viewModal.item.item_name}</div>
              <div><b>Category:</b> {viewModal.item.category}</div>
              <div><b>Quantity:</b> {viewModal.item.quantity}</div>
              <div><b>Unit:</b> {viewModal.item.unit}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.item.status)}`}>
                  {viewModal.item.status}
                </span>
              </div>
              <div><b>Date Recorded:</b> {viewModal.item.date_recorded}</div>
              <div><b>Expiry Date:</b> {viewModal.item.expiry_date || 'N/A'}</div>
              <div><b>Reason:</b> {viewModal.item.reason}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryDamageLogPage; 
