import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SlaEvaluation {
  id?: string;
  report_id?: string;
  evaluation_id: string;
  sla_id: string;
  service_name: string;
  evaluation_date: string;
  criteria: string;
  outcome: string;
  evaluator: string;
  corrective_actions: string;
  remarks: string;
}

interface SlaReport {
  id: string;
  property_id: string;
  sla_evaluation: SlaEvaluation[];
}

const API_URL = 'https://server.prktechindia.in/sla-reports/';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySlaEvaluation: SlaEvaluation = {
  evaluation_id: '',
  sla_id: '',
  service_name: '',
  evaluation_date: '',
  criteria: '',
  outcome: '',
  evaluator: '',
  corrective_actions: '',
  remarks: '',
};

const SlaEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SlaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: SlaEvaluation | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: SlaEvaluation | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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
      const normalized = arr.map((r: any) => ({
        ...r,
        sla_planning_and_definition: r.sla_planning_and_definition || r.planning_definitions || [],
        key_sla_components: r.key_sla_components || r.key_components || [],
        sla_implementation: r.sla_implementation || r.implementations || [],
        sla_monitoring: r.sla_monitoring || r.monitorings || [],
        sla_evaluation: r.sla_evaluation || r.evaluations || [],
        sla_renewal_and_exit_process: r.sla_renewal_and_exit_process || r.renewal_exits || [],
      }));
      const filtered = user?.propertyId ? normalized.filter((r: any) => r.property_id === user.propertyId) : normalized;
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch SLA reports');
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
      const res = await axios.post(API_URL, { property_id: user?.propertyId }, { headers: { Authorization: `Bearer ${user?.token}` } });
      const newId = res.data?.id || res.data?.report?.id || null;
      await fetchData();
      return newId;
    } catch (e) {
      setError('Failed to prepare report for adding');
      return null;
    }
  };

  const handleEdit = (item: SlaEvaluation, reportId: string) => setEditModal({ open: true, item: { ...item }, isNew: false, reportId });

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, item: { ...emptySlaEvaluation }, isNew: true, reportId: id });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this SLA evaluation entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = (report.sla_evaluation || []).filter((i: SlaEvaluation) => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { sla_evaluation: newArr }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: SlaEvaluation) => setViewModal({ open: true, item });

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: SlaEvaluation[];
      if (editModal.isNew) newArr = [...(report.sla_evaluation || []), editModal.item];
      else newArr = (report.sla_evaluation || []).map((i: SlaEvaluation) => (i.id === editModal.item!.id ? editModal.item! : i));
      await axios.put(`${API_URL}${editModal.reportId}`, { sla_evaluation: newArr }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const items = data.flatMap(r => (r.sla_evaluation || []).map(i => ({ ...i, report_id: r.id })));

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>SLA Evaluation</h2>

      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">{user?.propertyId ? 'Current Property' : 'No Property Assigned'}</div>
        </div>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Evaluation ID</th>
              <th className="px-3 py-2 border">SLA ID</th>
              <th className="px-3 py-2 border">Service Name</th>
              <th className="px-3 py-2 border">Evaluation Date</th>
              <th className="px-3 py-2 border">Criteria</th>
              <th className="px-3 py-2 border">Outcome</th>
              <th className="px-3 py-2 border">Evaluator</th>
              <th className="px-3 py-2 border">Corrective Actions</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8">
                  <div className="text-gray-500 mb-3">No entries found</div>
                  {isAdmin && user?.propertyId && (
                    <button onClick={() => handleAdd()} className="inline-flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]">
                      <Plus size={18} className="mr-2" /> Add SLA Evaluation Entry
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{item.evaluation_id}</td>
                  <td className="border px-2 py-1">{item.sla_id}</td>
                  <td className="border px-2 py-1">{item.service_name}</td>
                  <td className="border px-2 py-1">{item.evaluation_date}</td>
                  <td className="border px-2 py-1">{item.criteria}</td>
                  <td className="border px-2 py-1">{item.outcome}</td>
                  <td className="border px-2 py-1">{item.evaluator}</td>
                  <td className="border px-2 py-1">{item.corrective_actions}</td>
                  <td className="border px-2 py-1">{item.remarks}</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(item, item.report_id!)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(item.id!, item.report_id!)} className="text-red-600"><Trash2 size={18} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && items.length > 0 && (
        <button onClick={() => handleAdd(items[0].report_id)} className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]">
          <Plus size={18} className="mr-2" /> Add SLA Evaluation Entry
        </button>
      )}

      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editModal.isNew ? 'Add' : 'Edit'} SLA Evaluation Entry</h3>
              <button onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Evaluation ID" value={editModal.item.evaluation_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, evaluation_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="SLA ID" value={editModal.item.sla_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sla_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Service Name" value={editModal.item.service_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, service_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Evaluation Date" type="date" value={editModal.item.evaluation_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, evaluation_date: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Criteria" value={editModal.item.criteria} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, criteria: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Evaluator" value={editModal.item.evaluator} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, evaluator: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Corrective Actions" value={editModal.item.corrective_actions} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, corrective_actions: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} />
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
              <h3 className="text-lg font-semibold text-gray-900">SLA Evaluation Details</h3>
              <button onClick={() => setViewModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Evaluation ID:</b> {viewModal.item.evaluation_id}</div>
              <div><b>SLA ID:</b> {viewModal.item.sla_id}</div>
              <div><b>Service Name:</b> {viewModal.item.service_name}</div>
              <div><b>Evaluation Date:</b> {viewModal.item.evaluation_date}</div>
              <div><b>Criteria:</b> {viewModal.item.criteria}</div>
              <div><b>Outcome:</b> {viewModal.item.outcome}</div>
              <div><b>Evaluator:</b> {viewModal.item.evaluator}</div>
              <div><b>Corrective Actions:</b> {viewModal.item.corrective_actions}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlaEvaluationPage;
