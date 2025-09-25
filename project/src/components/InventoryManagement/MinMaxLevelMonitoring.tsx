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

interface MinMaxLevel {
  id?: string;
  inventory_report_id?: string;
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_level: number;
  maximum_level: number;
  status: string;
  last_checked: string;
  responsible_person: string;
  remarks: string;
}

interface InventoryReport {
  id: string;
  property_id: string;
  min_max_levels: MinMaxLevel[];
}

const API_URL = 'https://server.prktechindia.in/inventory-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyMinMaxLevel: MinMaxLevel = {
  item_id: '',
  item_name: '',
  category: '',
  current_stock: 0,
  minimum_level: 0,
  maximum_level: 0,
  status: '',
  last_checked: '',
  responsible_person: '',
  remarks: '',
};

const MinMaxLevelMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<InventoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: MinMaxLevel | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: MinMaxLevel | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: MinMaxLevel, reportId: string) => {
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
    setEditModal({ open: true, isNew: true, item: { ...emptyMinMaxLevel }, reportId });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this min-max level record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.min_max_levels.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { min_max_levels: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : undefined,
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: MinMaxLevel) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: MinMaxLevel[];
      if (editModal.isNew) {
        newArr = [...report.min_max_levels, editModal.item];
      } else {
        newArr = report.min_max_levels.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { min_max_levels: newArr }, {
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
      case 'OK':
        return 'bg-green-100 text-green-800';
      case 'Below Min':
        return 'bg-red-100 text-red-800';
      case 'Above Max':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Minimum & Maximum Level Monitoring</h2>
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
              <th className="px-3 py-2 border">Item ID</th>
              <th className="px-3 py-2 border">Item Name</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Current Stock</th>
              <th className="px-3 py-2 border">Min Level</th>
              <th className="px-3 py-2 border">Max Level</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Last Checked</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.min_max_levels.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.item_id}</td>
                      <td className="border px-2 py-1">{item.item_name}</td>
                      <td className="border px-2 py-1">{item.category}</td>
                      <td className="border px-2 py-1">{item.current_stock}</td>
                      <td className="border px-2 py-1">{item.minimum_level}</td>
                      <td className="border px-2 py-1">{item.maximum_level}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.last_checked}</td>
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
          <Plus size={18} className="mr-2" /> Add Min-Max Level Record
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Min-Max Level Record
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
                <select className="border rounded px-3 py-2" value={editModal.item.category} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, category: e.target.value } })} required>
                  <option value="">Select Category</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Tools">Tools</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Current Stock" type="number" value={editModal.item.current_stock} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, current_stock: parseInt(e.target.value) || 0 } })} required />
                <input className="border rounded px-3 py-2" placeholder="Minimum Level" type="number" value={editModal.item.minimum_level} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, minimum_level: parseInt(e.target.value) || 0 } })} required />
                <input className="border rounded px-3 py-2" placeholder="Maximum Level" type="number" value={editModal.item.maximum_level} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, maximum_level: parseInt(e.target.value) || 0 } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="OK">OK</option>
                  <option value="Below Min">Below Min</option>
                  <option value="Above Max">Above Max</option>
                </select>
                <input className="border rounded px-3 py-2" placeholder="Last Checked" value={editModal.item.last_checked} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, last_checked: e.target.value } })} required />
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
                Min-Max Level Record Details
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
              <div><b>Minimum Level:</b> {viewModal.item.minimum_level}</div>
              <div><b>Maximum Level:</b> {viewModal.item.maximum_level}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.item.status)}`}>
                  {viewModal.item.status}
                </span>
              </div>
              <div><b>Last Checked:</b> {viewModal.item.last_checked}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinMaxLevelMonitoringPage; 
