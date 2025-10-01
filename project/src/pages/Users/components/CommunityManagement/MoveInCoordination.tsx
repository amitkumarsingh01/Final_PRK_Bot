import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface MoveInCoordination {
  id?: string;
  community_report_id?: string;
  move_in_id: string;
  name: string;
  contact_number: string;
  address: string;
  move_in_date: string;
  move_in_time: string;
  vehicle_no: string;
  driver_name: string;
  no_of_persons: number;
  security_officer: string;
  remarks: string;
}

interface CommunityReport {
  id: string;
  property_id: string;
  move_in_coordinations: MoveInCoordination[];
}

const API_URL = 'https://server.prktechindia.in/community-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyCoordination: MoveInCoordination = {
  move_in_id: '',
  name: '',
  contact_number: '',
  address: '',
  move_in_date: '',
  move_in_time: '',
  vehicle_no: '',
  driver_name: '',
  no_of_persons: 0,
  security_officer: '',
  remarks: '',
};

const CMoveInCoordinationPage: React.FC = () => {
  console.log('🚀 MoveInCoordination: Component initialized');
  const { user } = useAuth();
  console.log('👤 MoveInCoordination: User loaded', { userId: user?.userId });
  const [isAdmin, setIsAdmin] = useState(false);
  // Allow actions for admin and cadmin
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  // Fetch reports for user's property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const items: CommunityReport[] = res.data || [];
      const filtered = Array.isArray(items)
        ? items.filter(r => r.property_id === (user?.propertyId || ''))
        : [];
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch community reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) fetchData();
  }, [user?.propertyId]);

  // Ensure a report exists for the property
  const ensureReportForProperty = async (): Promise<string | null> => {
    if (data.length > 0) return data[0].id;
    if (!user?.propertyId) return null;
    try {
      const res = await axios.post(API_URL, {
        property_id: user.propertyId,
        move_in_coordinations: [],
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
  const [data, setData] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: MoveInCoordination | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: MoveInCoordination | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: MoveInCoordination, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyCoordination },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.move_in_coordinations.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { move_in_coordinations: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: MoveInCoordination) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: MoveInCoordination[];
      if (editModal.isNew) {
        newArr = [...report.move_in_coordinations, editModal.item];
      } else {
        newArr = report.move_in_coordinations.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { move_in_coordinations: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Move-In Coordination</h2>
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
              <th className="px-3 py-2 border">Move-In ID</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Contact Number</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Move-In Date</th>
              <th className="px-3 py-2 border">Move-In Time</th>
              <th className="px-3 py-2 border">Vehicle No</th>
              <th className="px-3 py-2 border">Driver Name</th>
              <th className="px-3 py-2 border">No of Persons</th>
              <th className="px-3 py-2 border">Security Officer</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={16} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.move_in_coordinations.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.move_in_id}</td>
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{item.contact_number}</td>
                      <td className="border px-2 py-1">{item.address}</td>
                      <td className="border px-2 py-1">{item.move_in_date}</td>
                      <td className="border px-2 py-1">{item.move_in_time}</td>
                      <td className="border px-2 py-1">{item.vehicle_no}</td>
                      <td className="border px-2 py-1">{item.driver_name}</td>
                      <td className="border px-2 py-1">{item.no_of_persons}</td>
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
      {isAdmin && (
        <button
          onClick={async () => { const id = await ensureReportForProperty(); if (id) handleAdd(id); }}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Move-In Coordination
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Move-In Coordination
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
                <input className="border rounded px-3 py-2" placeholder="Move-In ID" value={editModal.item.move_in_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, move_in_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Name" value={editModal.item.name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Number" value={editModal.item.contact_number} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contact_number: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={editModal.item.address} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, address: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Move-In Date" type="date" value={editModal.item.move_in_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, move_in_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Move-In Time" type="time" value={editModal.item.move_in_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, move_in_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vehicle No" value={editModal.item.vehicle_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vehicle_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Driver Name" value={editModal.item.driver_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, driver_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="No of Persons" type="number" value={editModal.item.no_of_persons} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, no_of_persons: parseInt(e.target.value) } })} required />
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
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Move-In Coordination Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Move-In ID:</b> {viewModal.item.move_in_id}</div>
              <div><b>Name:</b> {viewModal.item.name}</div>
              <div><b>Contact Number:</b> {viewModal.item.contact_number}</div>
              <div><b>Address:</b> {viewModal.item.address}</div>
              <div><b>Move-In Date:</b> {viewModal.item.move_in_date}</div>
              <div><b>Move-In Time:</b> {viewModal.item.move_in_time}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no}</div>
              <div><b>Driver Name:</b> {viewModal.item.driver_name}</div>
              <div><b>No of Persons:</b> {viewModal.item.no_of_persons}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMoveInCoordinationPage; 
