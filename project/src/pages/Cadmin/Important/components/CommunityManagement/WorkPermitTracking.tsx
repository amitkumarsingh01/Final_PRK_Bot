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

interface WorkPermitTracking {
  id?: string;
  community_report_id?: string;
  permit_id: string;
  worker_name: string;
  contact_number: string;
  company_name: string;
  work_type: string;
  permit_issue_date: string;
  permit_expiry_date: string;
  address: string;
  status: string;
  security_officer: string;
  remarks: string;
}

interface CommunityReport {
  id: string;
  property_id: string;
  work_permit_trackings: WorkPermitTracking[];
}

const API_URL = 'https://server.prktechindia.in/community-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyPermit: WorkPermitTracking = {
  permit_id: '',
  worker_name: '',
  contact_number: '',
  company_name: '',
  work_type: '',
  permit_issue_date: '',
  permit_expiry_date: '',
  address: '',
  status: '',
  security_officer: '',
  remarks: '',
};

const CWorkPermitTrackingPage: React.FC = () => {
  const { isAdmin, ,  } = useAuth();
  const [data, setData] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: WorkPermitTracking | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: WorkPermitTracking | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: WorkPermitTracking, reportId: string) => {
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
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.work_permit_trackings.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { work_permit_trackings: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: WorkPermitTracking) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: WorkPermitTracking[];
      if (editModal.isNew) {
        newArr = [...report.work_permit_trackings, editModal.item];
      } else {
        newArr = report.work_permit_trackings.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { work_permit_trackings: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Work Permit Tracking</h2>
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
              <th className="px-3 py-2 border">Permit ID</th>
              <th className="px-3 py-2 border">Worker Name</th>
              <th className="px-3 py-2 border">Contact Number</th>
              <th className="px-3 py-2 border">Company Name</th>
              <th className="px-3 py-2 border">Work Type</th>
              <th className="px-3 py-2 border">Issue Date</th>
              <th className="px-3 py-2 border">Expiry Date</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Status</th>
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
                  report.work_permit_trackings.map((item, idx) => (
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
                      <td className="border px-2 py-1">{item.status}</td>
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
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Work Permit
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Work Permit
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
                <input className="border rounded px-3 py-2" placeholder="Issue Date" type="date" value={editModal.item.permit_issue_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, permit_issue_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Expiry Date" type="date" value={editModal.item.permit_expiry_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, permit_expiry_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={editModal.item.address} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, address: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
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
                Work Permit Details
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
              <div><b>Issue Date:</b> {viewModal.item.permit_issue_date}</div>
              <div><b>Expiry Date:</b> {viewModal.item.permit_expiry_date}</div>
              <div><b>Address:</b> {viewModal.item.address}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CWorkPermitTrackingPage; 
