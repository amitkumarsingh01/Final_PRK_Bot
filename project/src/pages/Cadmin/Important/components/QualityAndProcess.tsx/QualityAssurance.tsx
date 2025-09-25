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

interface QualityAssurance {
  id?: string;
  quality_report_id?: string;
  qa_id: string;
  project_process_id: string;
  activity: string;
  standard: string;
  execution_date: string;
  responsible_person: string;
  compliance_status: string;
  evidence: string;
  remarks: string;
}

interface QualityReport {
  id: string;
  property_id: string;
  quality_assurance_activities: QualityAssurance[];
}

const API_URL = 'https://server.prktechindia.in/quality-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyQualityAssurance: QualityAssurance = {
  qa_id: '',
  project_process_id: '',
  activity: '',
  standard: '',
  execution_date: '',
  responsible_person: '',
  compliance_status: '',
  evidence: '',
  remarks: '',
};

const QualityAssurancePage: React.FC = () => {
  console.log('🚀 QualityAssurance: Component initialized');
  const { user } = useAuth();
  console.log('👤 QualityAssurance: User loaded', { userId: user?.userId });
  const [data, setData] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: QualityAssurance | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: QualityAssurance | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: QualityAssurance, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyQualityAssurance }, reportId: id });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this quality assurance activity?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.quality_assurance_activities.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { quality_assurance_activities: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: QualityAssurance) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: QualityAssurance[];
      if (editModal.isNew) {
        newArr = [...report.quality_assurance_activities, editModal.item];
      } else {
        newArr = report.quality_assurance_activities.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { quality_assurance_activities: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-green-100 text-green-800';
      case 'Non-Compliant':
        return 'bg-red-100 text-red-800';
      case 'Partially Compliant':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Quality Assurance</h2>
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
              <th className="px-3 py-2 border">QA ID</th>
              <th className="px-3 py-2 border">Project/Process ID</th>
              <th className="px-3 py-2 border">Activity</th>
              <th className="px-3 py-2 border">Standard</th>
              <th className="px-3 py-2 border">Execution Date</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Compliance Status</th>
              <th className="px-3 py-2 border">Evidence</th>
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
                      <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add QA Activity</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.quality_assurance_activities.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.qa_id}</td>
                      <td className="border px-2 py-1">{item.project_process_id}</td>
                      <td className="border px-2 py-1">{item.activity}</td>
                      <td className="border px-2 py-1">{item.standard}</td>
                      <td className="border px-2 py-1">{item.execution_date}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getComplianceColor(item.compliance_status)}`}>
                          {item.compliance_status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.evidence}</td>
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
          <Plus size={18} className="mr-2" /> Add Quality Assurance Activity
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Quality Assurance Activity
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
                <input className="border rounded px-3 py-2" placeholder="QA ID" value={editModal.item.qa_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, qa_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Project/Process ID" value={editModal.item.project_process_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, project_process_id: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Activity" value={editModal.item.activity} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, activity: e.target.value } })} required rows={3} />
                <textarea className="border rounded px-3 py-2" placeholder="Standard" value={editModal.item.standard} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, standard: e.target.value } })} required rows={3} />
                <input className="border rounded px-3 py-2" placeholder="Execution Date" type="date" value={editModal.item.execution_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, execution_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                
                <textarea className="border rounded px-3 py-2" placeholder="Evidence" value={editModal.item.evidence} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, evidence: e.target.value } })} required rows={3} />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} rows={3} />
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
                Quality Assurance Activity Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>QA ID:</b> {viewModal.item.qa_id}</div>
              <div><b>Project/Process ID:</b> {viewModal.item.project_process_id}</div>
              <div className="col-span-2"><b>Activity:</b> {viewModal.item.activity}</div>
              <div className="col-span-2"><b>Standard:</b> {viewModal.item.standard}</div>
              <div><b>Execution Date:</b> {viewModal.item.execution_date}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Compliance Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getComplianceColor(viewModal.item.compliance_status)}`}>
                  {viewModal.item.compliance_status}
                </span>
              </div>
              <div className="col-span-2"><b>Evidence:</b> {viewModal.item.evidence}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityAssurancePage; 
