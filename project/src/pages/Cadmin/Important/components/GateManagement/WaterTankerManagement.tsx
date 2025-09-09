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

interface WaterTankerManagement {
  id?: string;
  report_id?: string;
  tanker_id: string;
  supplier_name: string;
  supplier_contact: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  gate_no: string;
  vehicle_no: string;
  driver_name: string;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  water_tanker_management: WaterTankerManagement[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyTanker: WaterTankerManagement = {
  tanker_id: '',
  supplier_name: '',
  supplier_contact: '',
  quantity: 1,
  delivery_date: '',
  delivery_time: '',
  gate_no: '',
  vehicle_no: '',
  driver_name: '',
  security_officer: '',
  remarks: '',
};

const CWaterTankerManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: WaterTankerManagement | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: WaterTankerManagement | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    checkAdminStatus();
  }, [user]);

  // Fetch visitor management reports for user's property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch visitor management reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) {
      fetchData();
    }
  }, [user?.propertyId]);

  // CRUD handlers
  const handleEdit = (item: WaterTankerManagement, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyTanker },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      // Find the report
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      // Remove the entry
      const newArr = report.water_tanker_management.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { water_tanker_management: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: WaterTankerManagement) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: WaterTankerManagement[];
      if (editModal.isNew) {
        newArr = [...report.water_tanker_management, editModal.item];
      } else {
        newArr = report.water_tanker_management.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { water_tanker_management: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Water Tanker Management</h2>
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
              <th className="px-3 py-2 border">Tanker ID</th>
              <th className="px-3 py-2 border">Supplier</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Quantity</th>
              <th className="px-3 py-2 border">Delivery Date</th>
              <th className="px-3 py-2 border">Delivery Time</th>
              <th className="px-3 py-2 border">Gate No</th>
              <th className="px-3 py-2 border">Vehicle No</th>
              <th className="px-3 py-2 border">Driver</th>
              <th className="px-3 py-2 border">Security Officer</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.water_tanker_management.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.tanker_id}</td>
                      <td className="border px-2 py-1">{item.supplier_name}</td>
                      <td className="border px-2 py-1">{item.supplier_contact}</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">{item.delivery_date}</td>
                      <td className="border px-2 py-1">{item.delivery_time}</td>
                      <td className="border px-2 py-1">{item.gate_no}</td>
                      <td className="border px-2 py-1">{item.vehicle_no}</td>
                      <td className="border px-2 py-1">{item.driver_name}</td>
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
      {/* Add Button (only if a report exists for the property) */}
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Water Tanker Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Water Tanker Entry
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
                <input className="border rounded px-3 py-2" placeholder="Tanker ID" value={editModal.item.tanker_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, tanker_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Supplier Name" value={editModal.item.supplier_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, supplier_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Supplier Contact" value={editModal.item.supplier_contact} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, supplier_contact: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Quantity" type="number" value={editModal.item.quantity} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, quantity: parseInt(e.target.value) } })} required />
                <input className="border rounded px-3 py-2" placeholder="Delivery Date" type="date" value={editModal.item.delivery_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, delivery_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Delivery Time" type="time" value={editModal.item.delivery_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, delivery_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Gate No" value={editModal.item.gate_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, gate_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vehicle No" value={editModal.item.vehicle_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vehicle_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Driver Name" value={editModal.item.driver_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, driver_name: e.target.value } })} required />
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
                Water Tanker Entry
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Tanker ID:</b> {viewModal.item.tanker_id}</div>
              <div><b>Supplier Name:</b> {viewModal.item.supplier_name}</div>
              <div><b>Supplier Contact:</b> {viewModal.item.supplier_contact}</div>
              <div><b>Quantity:</b> {viewModal.item.quantity}</div>
              <div><b>Delivery Date:</b> {viewModal.item.delivery_date}</div>
              <div><b>Delivery Time:</b> {viewModal.item.delivery_time}</div>
              <div><b>Gate No:</b> {viewModal.item.gate_no}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no}</div>
              <div><b>Driver Name:</b> {viewModal.item.driver_name}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CWaterTankerManagementPage;
