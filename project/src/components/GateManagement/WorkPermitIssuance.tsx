import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface WorkPermitIssuance {
  id?: string;
  report_id?: string;
  permit_id: string;
  worker_name: string;
  contact_number: string;
  company_name: string;
  work_type: string;
  permit_issue_date: string;
  permit_expiry_date: string;
  address: string;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  work_permit_issuance: WorkPermitIssuance[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyPermit: WorkPermitIssuance = {
  permit_id: '',
  worker_name: '',
  contact_number: '',
  company_name: '',
  work_type: '',
  permit_issue_date: '',
  permit_expiry_date: '',
  address: '',
  security_officer: '',
  remarks: '',
};

const WorkPermitIssuancePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  // Only cadmin can add/delete; property user can edit only
  const isCadmin = user?.userType === 'cadmin';
  const [viewModal, setViewModal] = useState<{ open: boolean; item: WorkPermitIssuance | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: WorkPermitIssuance | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  // Fetch properties and user's default property_id
  useEffect(() => {
    // No dropdown; keep fetch in case some logic relies on properties
    const fetchProperties = async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        setProperties(res.data);
      } catch (e) {
        // Non-blocking
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    // Fetch user's default property_id from profile
    const resolveProperty = async () => {
      if (user?.propertyId) {
        setSelectedPropertyId(user.propertyId);
        return;
      }
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser?.property_id) {
          setSelectedPropertyId(matchedUser.property_id);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    resolveProperty();
  }, [user]);

  // Fetch visitor management reports for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch visitor management reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // CRUD handlers
  const handleEdit = (item: WorkPermitIssuance, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyPermit },
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
      const newArr = report.work_permit_issuance.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { work_permit_issuance: newArr });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: WorkPermitIssuance) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: WorkPermitIssuance[];
      if (editModal.isNew) {
        newArr = [...report.work_permit_issuance, editModal.item];
      } else {
        newArr = report.work_permit_issuance.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { work_permit_issuance: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
    return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Work Permit Issuance Management</h2>
      {/* Property selection dropdown removed for both cadmin and property users */}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Permit ID</th>
              <th className="px-3 py-2 border">Worker Name</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Company</th>
              <th className="px-3 py-2 border">Work Type</th>
              <th className="px-3 py-2 border">Issue Date</th>
              <th className="px-3 py-2 border">Expiry Date</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Security Officer</th>
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
                  report.work_permit_issuance.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.permit_id}</td>
                      <td className="border px-2 py-1">{item.worker_name}</td>
                      <td className="border px-2 py-1">{item.contact_number}</td>
                      <td className="border px-2 py-1">{item.company_name}</td>
                      <td className="border px-2 py-1">{item.work_type}</td>
                      <td className="border px-2 py-1">{item.permit_issue_date}</td>
                      <td className="border px-2 py-1">{item.permit_expiry_date}</td>
                      <td className="border px-2 py-1">{item.address}</td>
                      <td className="border px-2 py-1">{item.security_officer}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {isCadmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                          </>
                        )}
                        {!isCadmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
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
      {isCadmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Work Permit Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Work Permit Entry
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
                <input className="border rounded px-3 py-2" placeholder="Permit ID" value={editModal.item.permit_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, permit_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Worker Name" value={editModal.item.worker_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, worker_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Number" value={editModal.item.contact_number} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contact_number: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Company Name" value={editModal.item.company_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, company_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Work Type" value={editModal.item.work_type} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, work_type: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Permit Issue Date" type="date" value={editModal.item.permit_issue_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, permit_issue_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Permit Expiry Date" type="date" value={editModal.item.permit_expiry_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, permit_expiry_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={editModal.item.address} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, address: e.target.value } })} required />
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
                Work Permit Entry
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Permit ID:</b> {viewModal.item.permit_id}</div>
              <div><b>Worker Name:</b> {viewModal.item.worker_name}</div>
              <div><b>Contact Number:</b> {viewModal.item.contact_number}</div>
              <div><b>Company Name:</b> {viewModal.item.company_name}</div>
              <div><b>Work Type:</b> {viewModal.item.work_type}</div>
              <div><b>Permit Issue Date:</b> {viewModal.item.permit_issue_date}</div>
              <div><b>Permit Expiry Date:</b> {viewModal.item.permit_expiry_date}</div>
              <div><b>Address:</b> {viewModal.item.address}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
        </div>
    );
};

export default WorkPermitIssuancePage;
