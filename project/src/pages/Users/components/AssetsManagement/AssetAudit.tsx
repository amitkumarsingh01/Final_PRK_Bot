import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface AssetAudit {
  id?: string;
  asset_report_id?: string;
  audit_id: string;
  asset_id: string;
  asset_name: string;
  audit_date: string;
  location: string;
  condition: string;
  status: string;
  auditor: string;
  discrepancies: string;
  responsible_person: string;
  remarks: string;
}

interface AssetReport {
  id: string;
  property_id: string;
  audits: AssetAudit[];
}

const API_URL = 'https://server.prktechindia.in/asset-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyAssetAudit: AssetAudit = {
  audit_id: '',
  asset_id: '',
  asset_name: '',
  audit_date: '',
  location: '',
  condition: '',
  status: '',
  auditor: '',
  discrepancies: '',
  responsible_person: '',
  remarks: '',
};

const CAssetAuditPage: React.FC = () => {
  console.log('🚀 AssetAudit: Component initialized');
  const { user } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  const [data, setData] = useState<AssetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: AssetAudit | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: AssetAudit | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    // All users can add/edit, no delete functionality
    setCanEdit(true);
  }, [user]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? arr.filter((r: AssetReport) => r.property_id === user.propertyId) : arr;
      setData(filtered);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.propertyId]);

  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === user?.propertyId);
      if (existing) return existing.id;
      if (!user?.propertyId || !user?.token) return null;
      const created = await axios.post(API_URL, { property_id: user.propertyId }, { headers: { Authorization: `Bearer ${user.token}` } });
      const newId = created?.data?.id;
      await fetchData();
      return newId || null;
    } catch (e) {
      setError('Failed to create report');
      return null;
    }
  };

  const handleEdit = (item: AssetAudit, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = async () => {
    const reportId = await ensureReportForProperty();
    if (!reportId) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyAssetAudit }, reportId });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this audit record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.audits.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { audits: newArr }, { headers: { Authorization: `Bearer ${user?.token}` } });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: AssetAudit) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: AssetAudit[];
      if (editModal.isNew) {
        newArr = [...report.audits, editModal.item];
      } else {
        newArr = report.audits.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { audits: newArr }, { headers: { Authorization: `Bearer ${user?.token}` } });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Asset Audit</h2>
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
              <th className="px-3 py-2 border">Asset ID</th>
              <th className="px-3 py-2 border">Asset Name</th>
              <th className="px-3 py-2 border">Audit Date</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Condition</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Auditor</th>
              <th className="px-3 py-2 border">Discrepancies</th>
              <th className="px-3 py-2 border">Responsible Person</th>
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
                  report.audits.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.audit_id}</td>
                      <td className="border px-2 py-1">{item.asset_id}</td>
                      <td className="border px-2 py-1">{item.asset_name}</td>
                      <td className="border px-2 py-1">{item.audit_date}</td>
                      <td className="border px-2 py-1">{item.location}</td>
                      <td className="border px-2 py-1">{item.condition}</td>
                      <td className="border px-2 py-1">{item.status}</td>
                      <td className="border px-2 py-1">{item.auditor}</td>
                      <td className="border px-2 py-1">{item.discrepancies}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {canEdit && (
                          <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
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
      {canEdit && (
        <button
          onClick={handleAdd}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Audit Record
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Audit Record
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
                <input className="border rounded px-3 py-2" placeholder="Audit ID" value={editModal.item.audit_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, audit_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset ID" value={editModal.item.asset_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset Name" value={editModal.item.asset_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Audit Date" type="date" value={editModal.item.audit_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, audit_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Location" value={editModal.item.location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Condition" value={editModal.item.condition} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, condition: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Auditor" value={editModal.item.auditor} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, auditor: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Discrepancies" value={editModal.item.discrepancies} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, discrepancies: e.target.value } })} required />
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
                Audit Record Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Audit ID:</b> {viewModal.item.audit_id}</div>
              <div><b>Asset ID:</b> {viewModal.item.asset_id}</div>
              <div><b>Asset Name:</b> {viewModal.item.asset_name}</div>
              <div><b>Audit Date:</b> {viewModal.item.audit_date}</div>
              <div><b>Location:</b> {viewModal.item.location}</div>
              <div><b>Condition:</b> {viewModal.item.condition}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Auditor:</b> {viewModal.item.auditor}</div>
              <div><b>Discrepancies:</b> {viewModal.item.discrepancies}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CAssetAuditPage; 
