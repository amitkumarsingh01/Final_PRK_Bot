import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property { id: string; name: string; }

interface VendorMasterLite { id: string; vendor_id: string; vendor_name: string; }

interface VendorEvaluation {
  id?: string;
  vendor_master_id?: string;
  evaluation_id: string;
  vendor_id: string;
  vendor_name: string;
  evaluation_date: string;
  criteria: string[];
  score_quality: number;
  score_delivery_time: number;
  outcome: string;
  evaluator: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorEvaluation: VendorEvaluation = {
  evaluation_id: '',
  vendor_id: '',
  vendor_name: '',
  evaluation_date: '',
  criteria: [],
  score_quality: 0,
  score_delivery_time: 0,
  outcome: '',
  evaluator: '',
  remarks: '',
};

const VendorEvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<VendorEvaluation[]>([]);
  const [masters, setMasters] = useState<VendorMasterLite[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; evaluation: VendorEvaluation | null }>({ open: false, evaluation: null });
  const [editModal, setEditModal] = useState<{ open: boolean; evaluation: VendorEvaluation | null; isNew: boolean; vendorMasterId: string | null }>({ open: false, evaluation: null, isNew: false, vendorMasterId: null });

  // Dual mode based on route: /cadmin/* uses fixed property, others show dropdown
  const isCadminRoute = useMemo(() => typeof window !== 'undefined' && window.location.pathname.startsWith('/cadmin'), []);
  const effectivePropertyId = isCadminRoute ? user?.propertyId || '' : selectedPropertyId;

  useEffect(() => { setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin'); }, [user?.userType]);

  // Load properties for dropdown in non-cadmin routes
  useEffect(() => {
    if (isCadminRoute) return;
    (async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        const list = res.data || [];
        setProperties(list);
        if (!selectedPropertyId && list.length > 0) setSelectedPropertyId(list[0].id);
      }
      catch { /* ignore */ }
    })();
  }, [isCadminRoute]);

  const normalize = (arr: any[]): { masters: VendorMasterLite[]; evaluations: VendorEvaluation[] } => {
    const masters: VendorMasterLite[] = [];
    const evaluations: VendorEvaluation[] = [];
    (arr || []).forEach((vendor: any) => {
      if (effectivePropertyId && vendor.property_id !== effectivePropertyId) return;
      const vm = vendor.vendor_master_management || {};
      masters.push({ id: vendor.id, vendor_id: vm.vendor_id ?? vendor.vendor_id, vendor_name: vm.vendor_name ?? vendor.vendor_name });
      const ve = vendor.vendor_evaluation;
      if (ve) {
        evaluations.push({
          id: ve.id,
          vendor_master_id: vendor.id,
          evaluation_id: ve.evaluation_id,
          vendor_id: vm.vendor_id ?? ve.vendor_id,
          vendor_name: vm.vendor_name ?? ve.vendor_name,
          evaluation_date: ve.evaluation_date,
          criteria: Array.isArray(ve.criteria) ? ve.criteria : [],
          score_quality: ve.score?.quality ?? ve.score_quality ?? 0,
          score_delivery_time: ve.score?.delivery_time ?? ve.score_delivery_time ?? 0,
          outcome: ve.outcome ?? '',
          evaluator: ve.evaluator ?? '',
          remarks: ve.remarks ?? '',
        });
      }
    });
    return { masters, evaluations };
  };

  const fetchData = async () => {
    if (!user?.token) { setLoading(false); return; }
    if (!isCadminRoute && !effectivePropertyId) { setRows([]); setMasters([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const { masters, evaluations } = normalize(arr);
      setMasters(masters); setRows(evaluations);
    } catch { setError('Failed to fetch vendor evaluations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.token, effectivePropertyId]);

  const handleEdit = (evaluation: VendorEvaluation) => setEditModal({ open: true, evaluation: { ...evaluation }, isNew: false, vendorMasterId: evaluation.vendor_master_id || null });
  const handleAdd = () => setEditModal({ open: true, evaluation: { ...emptyVendorEvaluation }, isNew: true, vendorMasterId: masters[0]?.id || null });
  const handleDelete = async (evaluation: VendorEvaluation) => {
    if (!evaluation.vendor_master_id) return; if (!window.confirm('Delete this vendor evaluation?')) return;
    try { await axios.put(`${API_URL}${evaluation.vendor_master_id}`, { vendor_evaluation: null }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined); fetchData(); }
    catch { setError('Failed to delete evaluation'); }
  };
  const handleView = (evaluation: VendorEvaluation) => setViewModal({ open: true, evaluation });

  const handleSave = async () => {
    if (!editModal.evaluation || !editModal.vendorMasterId) return;
    try {
      const payload = { vendor_evaluation: { evaluation_id: editModal.evaluation.evaluation_id, vendor_id: editModal.evaluation.vendor_id, vendor_name: editModal.evaluation.vendor_name, evaluation_date: editModal.evaluation.evaluation_date, criteria: editModal.evaluation.criteria, score: { quality: editModal.evaluation.score_quality, delivery_time: editModal.evaluation.score_delivery_time }, outcome: editModal.evaluation.outcome, evaluator: editModal.evaluation.evaluator, remarks: editModal.evaluation.remarks } };
      await axios.put(`${API_URL}${editModal.vendorMasterId}`, payload, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null }); fetchData();
    } catch { setError('Failed to save evaluation'); }
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: orange }}></div></div>);

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: orangeDark }}>Vendor Evaluation</h1>
          <div className="flex items-center space-x-3">
            {!isCadminRoute && (
              <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select Property</option>
                {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            )}
            {isAdmin && effectivePropertyId && (
              <button onClick={handleAdd} className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"><Plus size={16} /><span>Add Evaluation</span></button>
            )}
          </div>
        </div>
      </div>

      {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>)}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length === 0 ? (<tr><td className="px-6 py-4 text-center text-gray-500" colSpan={7}>No evaluations found</td></tr>) : rows.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.evaluation_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.evaluation_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.score_quality}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.score_delivery_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.outcome || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center space-x-2"><button onClick={() => handleView(e)} className="text-blue-600 hover:text-blue-900"><Eye size={16} /></button>{isAdmin && (<><button onClick={() => handleEdit(e)} className="text-orange-600 hover:text-orange-900"><Pencil size={16} /></button><button onClick={() => handleDelete(e)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button></>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View and Edit modals remain unchanged below */}
      {viewModal.open && viewModal.evaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">View Vendor Evaluation</h3><button onClick={() => setViewModal({ open: false, evaluation: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">Evaluation ID</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.evaluation_id}</p></div><div><label className="block text-sm font-medium text-gray-700">Vendor</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.vendor_name}</p></div><div><label className="block text-sm font-medium text-gray-700">Evaluation Date</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.evaluation_date}</p></div><div><label className="block text-sm font-medium text-gray-700">Outcome</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.outcome}</p></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Criteria</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.criteria.join(', ')}</p></div><div><label className="block text-sm font-medium text-gray-700">Quality Score</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.score_quality}</p></div><div><label className="block text-sm font-medium text-gray-700">Delivery Score</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.score_delivery_time}</p></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Remarks</label><p className="mt-1 text-sm text-gray-900">{viewModal.evaluation.remarks}</p></div></div></div></div></div>
      )}

      {editModal.open && editModal.evaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">{editModal.isNew ? 'Add Evaluation' : 'Edit Evaluation'}</h3><button onClick={() => setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Vendor</label><select value={editModal.vendorMasterId || ''} onChange={(e) => { const id = e.target.value; const m = masters.find(x => x.id === id); setEditModal(mst => mst && { ...mst, vendorMasterId: id, evaluation: { ...mst.evaluation!, vendor_id: m?.vendor_id || '', vendor_name: m?.vendor_name || '' } }); }} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"><option value="">Select Vendor</option>{masters.map(m => (<option key={m.id} value={m.id}>{m.vendor_name} ({m.vendor_id})</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700">Evaluation ID</label><input type="text" value={editModal.evaluation.evaluation_id} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, evaluation_id: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Evaluation Date</label><input type="date" value={editModal.evaluation.evaluation_date} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, evaluation_date: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Quality Score</label><input type="number" value={editModal.evaluation.score_quality} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, score_quality: parseInt(e.target.value) || 0 } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Delivery Score</label><input type="number" value={editModal.evaluation.score_delivery_time} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, score_delivery_time: parseInt(e.target.value) || 0 } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Criteria (comma separated)</label><input type="text" value={editModal.evaluation.criteria.join(', ')} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, criteria: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Outcome</label><input type="text" value={editModal.evaluation.outcome} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, outcome: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Evaluator</label><input type="text" value={editModal.evaluation.evaluator} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, evaluator: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Remarks</label><textarea value={editModal.evaluation.remarks} onChange={(e) => setEditModal(m => m && { ...m, evaluation: { ...m.evaluation!, remarks: e.target.value } })} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div></div><div className="flex justify-end space-x-3 mt-6"><button onClick={() => setEditModal({ open: false, evaluation: null, isNew: false, vendorMasterId: null })} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"><Save size={16} /><span>Save</span></button></div></div></div></div>
      )}
    </div>
  );
};

export default VendorEvaluationPage;
