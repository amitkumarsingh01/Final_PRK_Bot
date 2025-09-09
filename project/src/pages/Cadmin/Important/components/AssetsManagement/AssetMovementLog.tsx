import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface AssetMovementLog {
  id?: string;
  asset_report_id?: string;
  movement_id: string;
  asset_id: string;
  asset_name: string;
  from_location: string;
  to_location: string;
  movement_date: string;
  movement_time: string;
  purpose: string;
  transported_by: string;
  vehicle_no?: string;
  responsible_person: string;
  remarks: string;
}

interface AssetReport {
  id: string;
  property_id: string;
  movement_logs: AssetMovementLog[];
}

const API_URL = 'https://server.prktechindia.in/asset-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyMovementLog: AssetMovementLog = {
  movement_id: '',
  asset_id: '',
  asset_name: '',
  from_location: '',
  to_location: '',
  movement_date: '',
  movement_time: '',
  purpose: '',
  transported_by: '',
  vehicle_no: '',
  responsible_person: '',
  remarks: '',
};

const AssetMovementLogPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AssetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: AssetMovementLog | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: AssetMovementLog | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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
      setError('Failed to fetch asset reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: AssetMovementLog, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyMovementLog },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this movement log?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.movement_logs.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { movement_logs: newArr });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: AssetMovementLog) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: AssetMovementLog[];
      if (editModal.isNew) {
        newArr = [...report.movement_logs, editModal.item];
      } else {
        newArr = report.movement_logs.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { movement_logs: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Asset Movement Log</h2>
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
              <th className="px-3 py-2 border">Movement ID</th>
              <th className="px-3 py-2 border">Asset ID</th>
              <th className="px-3 py-2 border">Asset Name</th>
              <th className="px-3 py-2 border">From Location</th>
              <th className="px-3 py-2 border">To Location</th>
              <th className="px-3 py-2 border">Movement Date</th>
              <th className="px-3 py-2 border">Movement Time</th>
              <th className="px-3 py-2 border">Purpose</th>
              <th className="px-3 py-2 border">Transported By</th>
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
                  report.movement_logs.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.movement_id}</td>
                      <td className="border px-2 py-1">{item.asset_id}</td>
                      <td className="border px-2 py-1">{item.asset_name}</td>
                      <td className="border px-2 py-1">{item.from_location}</td>
                      <td className="border px-2 py-1">{item.to_location}</td>
                      <td className="border px-2 py-1">{item.movement_date}</td>
                      <td className="border px-2 py-1">{item.movement_time}</td>
                      <td className="border px-2 py-1">{item.purpose}</td>
                      <td className="border px-2 py-1">{item.transported_by}</td>
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
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Movement Log
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Movement Log
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
                <input className="border rounded px-3 py-2" placeholder="Movement ID" value={editModal.item.movement_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, movement_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset ID" value={editModal.item.asset_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset Name" value={editModal.item.asset_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="From Location" value={editModal.item.from_location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, from_location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="To Location" value={editModal.item.to_location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, to_location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Movement Date" type="date" value={editModal.item.movement_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, movement_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Movement Time" type="time" value={editModal.item.movement_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, movement_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Purpose" value={editModal.item.purpose} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, purpose: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Transported By" value={editModal.item.transported_by} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, transported_by: e.target.value } })} required />
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Movement Log Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Movement ID:</b> {viewModal.item.movement_id}</div>
              <div><b>Asset ID:</b> {viewModal.item.asset_id}</div>
              <div><b>Asset Name:</b> {viewModal.item.asset_name}</div>
              <div><b>From Location:</b> {viewModal.item.from_location}</div>
              <div><b>To Location:</b> {viewModal.item.to_location}</div>
              <div><b>Movement Date:</b> {viewModal.item.movement_date}</div>
              <div><b>Movement Time:</b> {viewModal.item.movement_time}</div>
              <div><b>Purpose:</b> {viewModal.item.purpose}</div>
              <div><b>Transported By:</b> {viewModal.item.transported_by}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no || '-'}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetMovementLogPage; 
