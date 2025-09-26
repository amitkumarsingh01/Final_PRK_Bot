import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property { id: string; name: string; }
interface VendorMasterLite { id: string; vendor_id: string; vendor_name: string; }

interface VendorClassification {
  id?: string;
  vendor_master_id?: string;
  classification_id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  sub_category: string;
  rating: string;
  classification_date: string;
  responsible_person: string;
  remarks: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorClassification: VendorClassification = {
  classification_id: '', vendor_id: '', vendor_name: '', category: '', sub_category: '', rating: '', classification_date: '', responsible_person: '', remarks: '',
};

const VendorClassificationPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<VendorClassification[]>([]);
  const [masters, setMasters] = useState<VendorMasterLite[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; classification: VendorClassification | null }>({ open: false, classification: null });
  const [editModal, setEditModal] = useState<{ open: boolean; classification: VendorClassification | null; isNew: boolean; vendorMasterId: string | null }>({ open: false, classification: null, isNew: false, vendorMasterId: null });

  const isCadminRoute = useMemo(() => typeof window !== 'undefined' && window.location.pathname.startsWith('/cadmin'), []);
  const effectivePropertyId = isCadminRoute ? user?.propertyId || '' : selectedPropertyId;

  useEffect(() => { setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin'); }, [user?.userType]);

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

  const normalize = (arr: any[]) => {
    const masters: VendorMasterLite[] = [];
    const classifications: VendorClassification[] = [];
    (arr || []).forEach((vendor: any) => {
      if (effectivePropertyId && vendor.property_id !== effectivePropertyId) return;
      const vm = vendor.vendor_master_management || {};
      masters.push({ id: vendor.id, vendor_id: vm.vendor_id ?? vendor.vendor_id, vendor_name: vm.vendor_name ?? vendor.vendor_name });
      const vc = vendor.vendor_classification || vendor.classification;
      if (vc) {
        classifications.push({
          id: vc.id,
          vendor_master_id: vendor.id,
          classification_id: vc.classification_id,
          vendor_id: vm.vendor_id ?? vc.vendor_id,
          vendor_name: vm.vendor_name ?? vc.vendor_name,
          category: vc.category,
          sub_category: vc.sub_category,
          rating: vc.rating,
          classification_date: vc.classification_date,
          responsible_person: vc.responsible_person,
          remarks: vc.remarks,
        });
      }
    });
    return { masters, classifications };
  };

  const fetchData = async () => {
    if (!user?.token) { setLoading(false); return; }
    if (!isCadminRoute && !effectivePropertyId) { setRows([]); setMasters([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const { masters, classifications } = normalize(arr);
      setMasters(masters); setRows(classifications);
    } catch { setError('Failed to fetch vendor classifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.token, effectivePropertyId]);

  const handleEdit = (classification: VendorClassification) => setEditModal({ open: true, classification: { ...classification }, isNew: false, vendorMasterId: classification.vendor_master_id || null });
  const handleAdd = () => setEditModal({ open: true, classification: { ...emptyVendorClassification }, isNew: true, vendorMasterId: masters[0]?.id || null });
  const handleDelete = async (classification: VendorClassification) => {
    if (!classification.vendor_master_id) return; if (!window.confirm('Delete this vendor classification?')) return;
    try { await axios.put(`${API_URL}${classification.vendor_master_id}`, { vendor_classification: null }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined); fetchData(); }
    catch { setError('Failed to delete classification'); }
  };
  const handleView = (classification: VendorClassification) => setViewModal({ open: true, classification });

  const handleSave = async () => {
    if (!editModal.classification || !editModal.vendorMasterId) return;
    try {
      const payload = { vendor_classification: { classification_id: editModal.classification.classification_id, vendor_id: editModal.classification.vendor_id, vendor_name: editModal.classification.vendor_name, category: editModal.classification.category, sub_category: editModal.classification.sub_category, rating: editModal.classification.rating, classification_date: editModal.classification.classification_date, responsible_person: editModal.classification.responsible_person, remarks: editModal.classification.remarks } };
      await axios.put(`${API_URL}${editModal.vendorMasterId}`, payload, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null }); fetchData();
    } catch { setError('Failed to save classification'); }
  };

  if (loading) return (<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: orange }}></div></div>);

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: orangeDark }}>Vendor Classification</h1>
          <div className="flex items-center space-x-3">
            {!isCadminRoute && (
              <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select Property</option>
                {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            )}
            {isAdmin && effectivePropertyId && (
              <button onClick={handleAdd} className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                <Plus size={16} /><span>Add Classification</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr><td className="px-6 py-4 text-center text-gray-500" colSpan={7}>No classifications found</td></tr>
              ) : rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.classification_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.vendor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.sub_category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.rating}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.classification_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center space-x-2"><button onClick={() => handleView(c)} className="text-blue-600 hover:text-blue-900"><Eye size={16} /></button>{isAdmin && (<><button onClick={() => handleEdit(c)} className="text-orange-600 hover:text-orange-900"><Pencil size={16} /></button><button onClick={() => handleDelete(c)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button></>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View and Edit modals remain unchanged below */}
      {viewModal.open && viewModal.classification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">View Vendor Classification</h3><button onClick={() => setViewModal({ open: false, classification: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">Classification ID</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.classification_id}</p></div><div><label className="block text-sm font-medium text-gray-700">Vendor</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.vendor_name}</p></div><div><label className="block text-sm font-medium text-gray-700">Category</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.category}</p></div><div><label className="block text-sm font-medium text-gray-700">Sub Category</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.sub_category}</p></div><div><label className="block text-sm font-medium text-gray-700">Rating</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.rating}</p></div><div><label className="block text-sm font-medium text-gray-700">Classification Date</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.classification_date}</p></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Remarks</label><p className="mt-1 text-sm text-gray-900">{viewModal.classification.remarks}</p></div></div></div></div></div>
      )}

      {editModal.open && editModal.classification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">{editModal.isNew ? 'Add Classification' : 'Edit Classification'}</h3><button onClick={() => setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Vendor</label><select value={editModal.vendorMasterId || ''} onChange={(e) => { const id = e.target.value; const m = masters.find(x => x.id === id); setEditModal(st => st && { ...st, vendorMasterId: id, classification: { ...st.classification!, vendor_id: m?.vendor_id || '', vendor_name: m?.vendor_name || '' } }); }} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"><option value="">Select Vendor</option>{masters.map(m => (<option key={m.id} value={m.id}>{m.vendor_name} ({m.vendor_id})</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700">Classification ID</label><input type="text" value={editModal.classification.classification_id} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, classification_id: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Category</label><input type="text" value={editModal.classification.category} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, category: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Sub Category</label><input type="text" value={editModal.classification.sub_category} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, sub_category: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Rating</label><input type="text" value={editModal.classification.rating} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, rating: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div><label className="block text-sm font-medium text-gray-700">Classification Date</label><input type="date" value={editModal.classification.classification_date} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, classification_date: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div><div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Remarks</label><textarea value={editModal.classification.remarks} onChange={(e) => setEditModal(st => st && { ...st, classification: { ...st.classification!, remarks: e.target.value } })} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" /></div></div><div className="flex justify-end space-x-3 mt-6"><button onClick={() => setEditModal({ open: false, classification: null, isNew: false, vendorMasterId: null })} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"><Save size={16} /><span>Save</span></button></div></div></div></div>
      )}
    </div>
  );
};

export default VendorClassificationPage;
