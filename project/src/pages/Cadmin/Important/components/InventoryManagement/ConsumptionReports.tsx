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

interface ConsumptionReport {
  id?: string;
  inventory_report_id?: string;
  report_id: string;
  item_id: string;
  item_name: string;
  category: string;
  quantity_consumed: number;
  unit: string;
  period_start: string;
  period_end: string;
  consumed_by: string;
  purpose: string;
  responsible_person: string;
  remarks: string;
}

interface InventoryReport {
  id: string;
  property_id: string;
  consumption_reports: ConsumptionReport[];
}

const API_URL = 'https://server.prktechindia.in/inventory-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyConsumptionReport: ConsumptionReport = {
  report_id: '',
  item_id: '',
  item_name: '',
  category: '',
  quantity_consumed: 0,
  unit: '',
  period_start: '',
  period_end: '',
  consumed_by: '',
  purpose: '',
  responsible_person: '',
  remarks: '',
};

const ConsumptionReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: ConsumptionReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: ConsumptionReport | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: ConsumptionReport, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyConsumptionReport },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this consumption report?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.consumption_reports.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { consumption_reports: newArr });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: ConsumptionReport) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: ConsumptionReport[];
      if (editModal.isNew) {
        newArr = [...report.consumption_reports, editModal.item];
      } else {
        newArr = report.consumption_reports.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { consumption_reports: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Consumption Reports</h2>
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
              <th className="px-3 py-2 border">Report ID</th>
              <th className="px-3 py-2 border">Item ID</th>
              <th className="px-3 py-2 border">Item Name</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Quantity Consumed</th>
              <th className="px-3 py-2 border">Unit</th>
              <th className="px-3 py-2 border">Period Start</th>
              <th className="px-3 py-2 border">Period End</th>
              <th className="px-3 py-2 border">Consumed By</th>
              <th className="px-3 py-2 border">Purpose</th>
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
                  report.consumption_reports.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.report_id}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_name}</td>
                      <td className="border px-2 py-1">{item.category}</td>
                      <td className="border px-2 py-1">{item.quantity_consumed}</td>
                      <td className="border px-2 py-1">{item.unit}</td>
                      <td className="border px-2 py-1">{item.period_start}</td>
                      <td className="border px-2 py-1">{item.period_end}</td>
                      <td className="border px-2 py-1">{item.consumed_by}</td>
                      <td className="border px-2 py-1">{item.purpose}</td>
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
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Consumption Report
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Consumption Report
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
                <input className="border rounded px-3 py-2" placeholder="Report ID" value={editModal.item.report_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, report_id: e.target.value } })} required />
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
                <input className="border rounded px-3 py-2" placeholder="Quantity Consumed" type="number" value={editModal.item.quantity_consumed} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, quantity_consumed: parseInt(e.target.value) || 0 } })} required />
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
                <input className="border rounded px-3 py-2" placeholder="Period Start" type="date" value={editModal.item.period_start} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, period_start: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Period End" type="date" value={editModal.item.period_end} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, period_end: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Consumed By" value={editModal.item.consumed_by} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, consumed_by: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Purpose" value={editModal.item.purpose} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, purpose: e.target.value } })} required />
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
                Consumption Report Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Report ID:</b> {viewModal.item.report_id}</div>
              <div><b>Item ID:</b> {viewModal.item.item_id}</div>
              <div><b>Item Name:</b> {viewModal.item.item_name}</div>
              <div><b>Category:</b> {viewModal.item.category}</div>
              <div><b>Quantity Consumed:</b> {viewModal.item.quantity_consumed}</div>
              <div><b>Unit:</b> {viewModal.item.unit}</div>
              <div><b>Period Start:</b> {viewModal.item.period_start}</div>
              <div><b>Period End:</b> {viewModal.item.period_end}</div>
              <div><b>Consumed By:</b> {viewModal.item.consumed_by}</div>
              <div><b>Purpose:</b> {viewModal.item.purpose}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionReportsPage; 
