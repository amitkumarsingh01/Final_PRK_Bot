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

interface InteriorWorkTracking {
  id?: string;
  report_id?: string;
  work_id: string;
  resident_name: string;
  contact_number: string;
  address: string;
  work_description: string;
  start_date: string;
  end_date: string;
  contractor_name: string;
  contractor_contact: string;
  no_of_workers: number;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  interior_work_tracking: InteriorWorkTracking[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyWork: InteriorWorkTracking = {
  work_id: '',
  resident_name: '',
  contact_number: '',
  address: '',
  work_description: '',
  start_date: '',
  end_date: '',
  contractor_name: '',
  contractor_contact: '',
  no_of_workers: 1,
  security_officer: '',
  remarks: '',
};

const CInteriorWorkTrackingPage: React.FC = () => {
  console.log('🚀 InteriorWorkTracking: Component initialized');
  const { user } = useAuth();
  console.log('👤 InteriorWorkTracking: User loaded', { userId: user?.userId });
  const [isAdmin, setIsAdmin] = useState(false);
  // Treat admin and cadmin as having action permissions
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  // Fetch data for user's property
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
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: InteriorWorkTracking | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: InteriorWorkTracking | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

    // CRUD handlers
  const handleEdit = (item: InteriorWorkTracking, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyWork },
      reportId,
    });
  };
  // Create an empty report for the property if none exists
  const ensureReportForProperty = async (): Promise<string | null> => {
    if (data.length > 0) return data[0].id;
    if (!user?.propertyId) return null;
    try {
      const res = await axios.post(API_URL, {
        property_id: user.propertyId,
        interior_work_tracking: [],
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
      const newArr = report.interior_work_tracking.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { interior_work_tracking: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: InteriorWorkTracking) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: InteriorWorkTracking[];
      if (editModal.isNew) {
        newArr = [...report.interior_work_tracking, editModal.item];
      } else {
        newArr = report.interior_work_tracking.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { interior_work_tracking: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Interior Work Tracking Management</h2>
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
              <th className="px-3 py-2 border">Work ID</th>
              <th className="px-3 py-2 border">Resident Name</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Work Description</th>
              <th className="px-3 py-2 border">Start Date</th>
              <th className="px-3 py-2 border">End Date</th>
              <th className="px-3 py-2 border">Contractor</th>
              <th className="px-3 py-2 border">No. of Workers</th>
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
                  report.interior_work_tracking.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.work_id}</td>
                      <td className="border px-2 py-1">{item.resident_name}</td>
                      <td className="border px-2 py-1">{item.contact_number}</td>
                      <td className="border px-2 py-1">{item.address}</td>
                      <td className="border px-2 py-1">{item.work_description}</td>
                      <td className="border px-2 py-1">{item.start_date}</td>
                      <td className="border px-2 py-1">{item.end_date}</td>
                      <td className="border px-2 py-1">{item.contractor_name}</td>
                      <td className="border px-2 py-1">{item.no_of_workers}</td>
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
          <Plus size={18} className="mr-2" /> Add Interior Work Tracking Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Interior Work Tracking Entry
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
                <input className="border rounded px-3 py-2" placeholder="Work ID" value={editModal.item.work_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, work_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Resident Name" value={editModal.item.resident_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, resident_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Number" value={editModal.item.contact_number} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contact_number: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={editModal.item.address} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, address: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Work Description" value={editModal.item.work_description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, work_description: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Start Date" type="date" value={editModal.item.start_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, start_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="End Date" type="date" value={editModal.item.end_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, end_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contractor Name" value={editModal.item.contractor_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contractor_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contractor Contact" value={editModal.item.contractor_contact} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contractor_contact: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="No. of Workers" type="number" value={editModal.item.no_of_workers} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, no_of_workers: parseInt(e.target.value) } })} required />
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
                Interior Work Tracking Entry
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Work ID:</b> {viewModal.item.work_id}</div>
              <div><b>Resident Name:</b> {viewModal.item.resident_name}</div>
              <div><b>Contact Number:</b> {viewModal.item.contact_number}</div>
              <div><b>Address:</b> {viewModal.item.address}</div>
              <div><b>Work Description:</b> {viewModal.item.work_description}</div>
              <div><b>Start Date:</b> {viewModal.item.start_date}</div>
              <div><b>End Date:</b> {viewModal.item.end_date}</div>
              <div><b>Contractor Name:</b> {viewModal.item.contractor_name}</div>
              <div><b>Contractor Contact:</b> {viewModal.item.contractor_contact}</div>
              <div><b>No. of Workers:</b> {viewModal.item.no_of_workers}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CInteriorWorkTrackingPage;
