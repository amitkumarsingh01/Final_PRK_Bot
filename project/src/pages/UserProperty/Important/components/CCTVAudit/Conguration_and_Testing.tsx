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

interface ConfigurationTestingChecklist {
  id?: string;
  cctv_audit_id?: string;
  SL_No: number;
  Category: string;
  Checklist_Point: string;
  Checked: string;
  Observations: string;
  Suggestions_Action_Required: string;
  Responsibility: string;
  Target_Completion_Date?: string;
  Photo_Screenshot: string;
  Remarks: string;
}

interface CctvAuditReport {
  id: string;
  property_id: string;
  cctv_audit_data: {
    Configuration_Testing_Checklist: ConfigurationTestingChecklist[];
  };
}

const API_URL = 'https://server.prktechindia.in/cctv-audit-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyConfigurationTesting: ConfigurationTestingChecklist = {
  SL_No: 0,
  Category: '',
  Checklist_Point: '',
  Checked: '',
  Observations: '',
  Suggestions_Action_Required: '',
  Responsibility: '',
  Target_Completion_Date: '',
  Photo_Screenshot: '',
  Remarks: '',
};

const ConfigurationTestingPage: React.FC = () => {
  console.log('🚀 ConfigurationTesting: Component initialized');
  const { user } = useAuth();
  console.log('👤 ConfigurationTesting: User loaded', { userId: user?.userId });
  const [data, setData] = useState<CctvAuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: ConfigurationTestingChecklist | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: ConfigurationTestingChecklist | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? arr.filter((r: any) => r.property_id === user.propertyId) : arr;
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token, user?.propertyId]);

  const handleEdit = (item: ConfigurationTestingChecklist, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === user?.propertyId);
      if (existing) return existing.id;
      const res = await axios.post(
        API_URL,
        { property_id: user?.propertyId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      const newId = res.data?.id || res.data?.report?.id || null;
      await fetchData();
      return newId;
    } catch (e) {
      setError('Failed to prepare report for adding');
      return null;
    }
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyConfigurationTesting }, reportId: id });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this configuration testing entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = (report.cctv_audit_data?.Configuration_Testing_Checklist || []).filter((i: ConfigurationTestingChecklist) => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        CCTV_Audit: { Configuration_Testing_Checklist: newArr }
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: ConfigurationTestingChecklist) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: ConfigurationTestingChecklist[];
      if (editModal.isNew) {
                newArr = [...(report.cctv_audit_data?.Configuration_Testing_Checklist || []), editModal.item];
      } else {
        newArr = (report.cctv_audit_data?.Configuration_Testing_Checklist || []).map((i: ConfigurationTestingChecklist) =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        CCTV_Audit: { Configuration_Testing_Checklist: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Configuration & Testing</h2>
      
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
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Checklist Point</th>
              <th className="px-3 py-2 border">Checked</th>
              <th className="px-3 py-2 border">Observations</th>
              <th className="px-3 py-2 border">Suggestions/Action Required</th>
              <th className="px-3 py-2 border">Responsibility</th>
              <th className="px-3 py-2 border">Target Completion Date</th>
              <th className="px-3 py-2 border">Photo/Screenshot</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6">
                  <div className="flex items-center justify-center gap-3">
                    <span>No records found</span>
                    {isAdmin && (
                      <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Configuration Testing Entry</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  (report.cctv_audit_data?.Configuration_Testing_Checklist || []).map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{item.SL_No}</td>
                      <td className="border px-2 py-1">{item.Category}</td>
                      <td className="border px-2 py-1">{item.Checklist_Point}</td>
                      <td className="border px-2 py-1">{item.Checked}</td>
                      <td className="border px-2 py-1">{item.Observations}</td>
                      <td className="border px-2 py-1">{item.Suggestions_Action_Required}</td>
                      <td className="border px-2 py-1">{item.Responsibility}</td>
                      <td className="border px-2 py-1">{item.Target_Completion_Date}</td>
                      <td className="border px-2 py-1">{item.Photo_Screenshot}</td>
                      <td className="border px-2 py-1">{item.Remarks}</td>
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
          <Plus size={18} className="mr-2" /> Add Configuration Testing Entry
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Configuration Testing Entry
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
                <input className="border rounded px-3 py-2" placeholder="SL No" type="number" value={editModal.item.SL_No} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, SL_No: parseInt(e.target.value) } })} required />
                <input className="border rounded px-3 py-2" placeholder="Category" value={editModal.item.Category} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Category: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Checklist Point" value={editModal.item.Checklist_Point} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Checklist_Point: e.target.value } })} required />
                
                <textarea className="border rounded px-3 py-2" placeholder="Observations" value={editModal.item.Observations} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Observations: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Suggestions/Action Required" value={editModal.item.Suggestions_Action_Required} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Suggestions_Action_Required: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsibility" value={editModal.item.Responsibility} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Responsibility: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Target Completion Date" type="date" value={editModal.item.Target_Completion_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Target_Completion_Date: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Photo/Screenshot" value={editModal.item.Photo_Screenshot} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Photo_Screenshot: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Remarks" value={editModal.item.Remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Remarks: e.target.value } })} />
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Configuration Testing Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>SL No:</b> {viewModal.item.SL_No}</div>
              <div><b>Category:</b> {viewModal.item.Category}</div>
              <div><b>Checklist Point:</b> {viewModal.item.Checklist_Point}</div>
              <div><b>Checked:</b> {viewModal.item.Checked}</div>
              <div><b>Observations:</b> {viewModal.item.Observations}</div>
              <div><b>Suggestions/Action Required:</b> {viewModal.item.Suggestions_Action_Required}</div>
              <div><b>Responsibility:</b> {viewModal.item.Responsibility}</div>
              <div><b>Target Completion Date:</b> {viewModal.item.Target_Completion_Date}</div>
              <div><b>Photo/Screenshot:</b> {viewModal.item.Photo_Screenshot}</div>
              <div><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationTestingPage;
