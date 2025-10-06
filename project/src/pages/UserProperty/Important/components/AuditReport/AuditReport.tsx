import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';

// --- Types matching backend API ---

interface AuditReport {
  id?: string;
  property_id: string;
  audit_id: string;
  audit_date: string;
  site_name: string;
  location: string;
  auditor_name: string;
  audit_type: string;
  department: string;
  checklist_item: string;
  compliance: string;
  score: number;
  observation_remarks: string;
  photo_evidence: string;
  status: string;
  assigned_to: string;
  target_closure_date: string;
  actual_closure_date?: string;
  verification_by?: string;
  verified_date?: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/audit-reports/';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyAuditReport: Omit<AuditReport, 'id' | 'property_id' | 'created_at' | 'updated_at'> = {
  audit_id: '',
  audit_date: '',
  site_name: '',
  location: '',
  auditor_name: '',
  audit_type: '',
  department: '',
  checklist_item: '',
  compliance: '',
  score: 0,
  observation_remarks: '',
  photo_evidence: '',
  status: '',
  assigned_to: '',
  target_closure_date: '',
  actual_closure_date: '',
  verification_by: '',
  verified_date: '',
};

const UserPropertyAuditReportPage: React.FC = () => {
  console.log('🚀 AuditReport: Component initialized');
  const { user } = useAuth();
  console.log('👤 AuditReport: User loaded', { userId: user?.userId });
  const [data, setData] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: AuditReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: AuditReport | null; isNew: boolean }>({ open: false, item: null, isNew: false });

  // Allow actions for admin and cadmin users
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  // Fetch audit reports for user's property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const items: AuditReport[] = res.data || [];
      const filtered = Array.isArray(items)
        ? items.filter(r => r.property_id === (user?.propertyId || ''))
        : [];
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch audit reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) {
      fetchData();
    }
  }, [user?.propertyId]);

  // CRUD handlers
  const handleEdit = (item: AuditReport) => {
    setEditModal({ open: true, item: { ...item }, isNew: false });
  };
  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      item: {
        property_id: user?.propertyId || '',
        ...emptyAuditReport,
      },
    });
  };
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this audit report?')) return;
    try {
      await axios.delete(`${API_URL}${id}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: AuditReport) => {
    setViewModal({ open: true, item });
  };

  // Form state handlers for edit/add modal
  const updateEditField = (field: keyof AuditReport, value: any) => {
    setEditModal((prev) => prev.item ? { ...prev, item: { ...prev.item, [field]: value } } : prev);
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item) return;
    try {
      const payload: AuditReport = {
        ...editModal.item,
        property_id: user?.propertyId || editModal.item.property_id,
      };
      if (editModal.isNew) {
        await axios.post(API_URL, payload, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
      } else {
        await axios.put(`${API_URL}${payload.id}`, payload, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
      }
      setEditModal({ open: false, item: null, isNew: false });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Audit Report Management</h2>
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
              <th className="px-3 py-2 border">Audit ID</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Auditor</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Department</th>
              <th className="px-3 py-2 border">Compliance</th>
              <th className="px-3 py-2 border">Score</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Assigned To</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.audit_id}</td>
                    <td className="border px-2 py-1">{item.audit_date}</td>
                    <td className="border px-2 py-1">{item.site_name}</td>
                    <td className="border px-2 py-1">{item.auditor_name}</td>
                    <td className="border px-2 py-1">{item.audit_type}</td>
                    <td className="border px-2 py-1">{item.department}</td>
                    <td className="border px-2 py-1">{item.compliance}</td>
                    <td className="border px-2 py-1">{item.score}</td>
                    <td className="border px-2 py-1">{item.status}</td>
                    <td className="border px-2 py-1">{item.assigned_to}</td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      {/* Edit button available for UserProperty users - Delete removed */}
                      <button onClick={() => handleEdit(item)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Add button removed for UserProperty - edit-only access */}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Audit Report
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* Basic Information */}
              <div className="mb-4 border rounded p-3">
                <div className="font-semibold mb-2">Basic Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Audit ID" value={editModal.item.audit_id} onChange={e => updateEditField('audit_id', e.target.value)} required />
                  <input className="border rounded px-2 py-1" type="date" placeholder="Audit Date" value={editModal.item.audit_date} onChange={e => updateEditField('audit_date', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Site Name" value={editModal.item.site_name} onChange={e => updateEditField('site_name', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Location" value={editModal.item.location} onChange={e => updateEditField('location', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Auditor Name" value={editModal.item.auditor_name} onChange={e => updateEditField('auditor_name', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Audit Type" value={editModal.item.audit_type} onChange={e => updateEditField('audit_type', e.target.value)} required />
                </div>
              </div>

              {/* Department & Checklist */}
              <div className="mb-4 border rounded p-3">
                <div className="font-semibold mb-2">Department & Checklist</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Department" value={editModal.item.department} onChange={e => updateEditField('department', e.target.value)} required />
                  <textarea className="border rounded px-2 py-1 col-span-2" placeholder="Checklist Item" value={editModal.item.checklist_item} onChange={e => updateEditField('checklist_item', e.target.value)} required />
                </div>
              </div>

              {/* Compliance & Scoring */}
              <div className="mb-4 border rounded p-3">
                <div className="font-semibold mb-2">Compliance & Scoring</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Compliance" value={editModal.item.compliance} onChange={e => updateEditField('compliance', e.target.value)} required />
                  <input className="border rounded px-2 py-1" type="number" placeholder="Score" value={editModal.item.score} onChange={e => updateEditField('score', parseInt(e.target.value) || 0)} required />
                </div>
                <textarea className="border rounded px-2 py-1 w-full mt-2" placeholder="Observation Remarks" value={editModal.item.observation_remarks} onChange={e => updateEditField('observation_remarks', e.target.value)} required />
              </div>

              {/* Evidence & Status */}
              <div className="mb-4 border rounded p-3">
                <div className="font-semibold mb-2">Evidence & Status</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Photo Evidence" value={editModal.item.photo_evidence} onChange={e => updateEditField('photo_evidence', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Status" value={editModal.item.status} onChange={e => updateEditField('status', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Assigned To" value={editModal.item.assigned_to} onChange={e => updateEditField('assigned_to', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Target Closure Date" value={editModal.item.target_closure_date} onChange={e => updateEditField('target_closure_date', e.target.value)} required />
                </div>
              </div>

              {/* Closure & Verification */}
              <div className="mb-4 border rounded p-3">
                <div className="font-semibold mb-2">Closure & Verification</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Actual Closure Date" value={editModal.item.actual_closure_date || ''} onChange={e => updateEditField('actual_closure_date', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Verification By" value={editModal.item.verification_by || ''} onChange={e => updateEditField('verification_by', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Verified Date" value={editModal.item.verified_date || ''} onChange={e => updateEditField('verified_date', e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Report: {viewModal.item.audit_id}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2"><b>Audit ID:</b> {viewModal.item.audit_id}</div>
                <div className="mb-2"><b>Audit Date:</b> {viewModal.item.audit_date}</div>
                <div className="mb-2"><b>Site Name:</b> {viewModal.item.site_name}</div>
                <div className="mb-2"><b>Location:</b> {viewModal.item.location}</div>
                <div className="mb-2"><b>Auditor Name:</b> {viewModal.item.auditor_name}</div>
                <div className="mb-2"><b>Audit Type:</b> {viewModal.item.audit_type}</div>
                <div className="mb-2"><b>Department:</b> {viewModal.item.department}</div>
                <div className="mb-2"><b>Compliance:</b> {viewModal.item.compliance}</div>
                <div className="mb-2"><b>Score:</b> {viewModal.item.score}</div>
              </div>
              <div>
                <div className="mb-2"><b>Status:</b> {viewModal.item.status}</div>
                <div className="mb-2"><b>Assigned To:</b> {viewModal.item.assigned_to}</div>
                <div className="mb-2"><b>Target Closure Date:</b> {viewModal.item.target_closure_date}</div>
                <div className="mb-2"><b>Actual Closure Date:</b> {viewModal.item.actual_closure_date || 'Not closed'}</div>
                <div className="mb-2"><b>Verification By:</b> {viewModal.item.verification_by || 'Not verified'}</div>
                <div className="mb-2"><b>Verified Date:</b> {viewModal.item.verified_date || 'Not verified'}</div>
                <div className="mb-2"><b>Photo Evidence:</b> {viewModal.item.photo_evidence || 'No evidence'}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2"><b>Checklist Item:</b></div>
              <div className="border rounded p-2 bg-gray-50">{viewModal.item.checklist_item}</div>
            </div>
            <div className="mt-4">
              <div className="mb-2"><b>Observation Remarks:</b></div>
              <div className="border rounded p-2 bg-gray-50">{viewModal.item.observation_remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPropertyAuditReportPage;
