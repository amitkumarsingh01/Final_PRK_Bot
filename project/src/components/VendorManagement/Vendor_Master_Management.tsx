import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property { id: string; name: string; }

interface VendorMaster {
  id?: string;
  property_id?: string;
  vendor_id: string;
  vendor_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  registration_date: string;
  status: string;
  responsible_person: string;
  remarks: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/vendor-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendorMaster: VendorMaster = {
  vendor_id: '', vendor_name: '', contact_person: '', contact_phone: '', contact_email: '', address: '', registration_date: '', status: '', responsible_person: '', remarks: '',
};

const VendorMasterManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VendorMaster[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; vendor: VendorMaster | null }>({ open: false, vendor: null });
  const [editModal, setEditModal] = useState<{ open: boolean; vendor: VendorMaster | null; isNew: boolean }>({ open: false, vendor: null, isNew: false });

  const isCadminRoute = useMemo(() => typeof window !== 'undefined' && window.location.pathname.startsWith('/cadmin'), []);
  const effectivePropertyId = isCadminRoute ? (user?.propertyId || '') : selectedPropertyId;

  useEffect(() => { setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin'); }, [user?.userType]);

  // Load properties for admin (non-cadmin routes)
  useEffect(() => {
    if (isCadminRoute) return;
    (async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        const list = res.data || [];
        setProperties(list);
        if (!selectedPropertyId && list.length > 0) setSelectedPropertyId(list[0].id);
      } catch { /* ignore */ }
    })();
  }, [isCadminRoute]);

  const fetchData = async () => {
    if (!user?.token) { setLoading(false); return; }
    if (!isCadminRoute && !effectivePropertyId) { setData([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const mapped: VendorMaster[] = arr.map((vendor: any) => ({
        id: vendor.id,
        property_id: vendor.property_id,
        vendor_id: vendor.vendor_master_management?.vendor_id ?? vendor.vendor_id,
        vendor_name: vendor.vendor_master_management?.vendor_name ?? vendor.vendor_name,
        contact_person: vendor.vendor_master_management?.contact_person ?? vendor.contact_person,
        contact_phone: vendor.vendor_master_management?.contact_details?.phone ?? vendor.contact_phone,
        contact_email: vendor.vendor_master_management?.contact_details?.email ?? vendor.contact_email,
        address: vendor.vendor_master_management?.address ?? vendor.address,
        registration_date: vendor.vendor_master_management?.registration_date ?? vendor.registration_date,
        status: vendor.vendor_master_management?.status ?? vendor.status,
        responsible_person: vendor.vendor_master_management?.responsible_person ?? vendor.responsible_person,
        remarks: vendor.vendor_master_management?.remarks ?? vendor.remarks,
        created_at: vendor.created_at,
        updated_at: vendor.updated_at,
      }));
      const filtered = effectivePropertyId ? mapped.filter(v => v.property_id === effectivePropertyId) : mapped;
      setData(filtered);
    } catch (e) { setError('Failed to fetch vendor masters'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.token, effectivePropertyId]);

  const handleEdit = (vendor: VendorMaster) => setEditModal({ open: true, vendor: { ...vendor }, isNew: false });
  const handleAdd = () => setEditModal({ open: true, vendor: { ...emptyVendorMaster }, isNew: true });

  const handleDelete = async (id?: string) => {
    if (!id) return; if (!window.confirm('Delete this vendor?')) return;
    try { await axios.delete(`${API_URL}${id}`, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined); fetchData(); }
    catch { setError('Failed to delete vendor'); }
  };

  const handleView = (vendor: VendorMaster) => setViewModal({ open: true, vendor });

  const handleSave = async () => {
    if (!editModal.vendor) return;
    try {
      if (editModal.isNew) {
        await axios.post(API_URL, { property_id: isCadminRoute ? user?.propertyId : effectivePropertyId, vendor_master_management: { vendor_id: editModal.vendor.vendor_id, vendor_name: editModal.vendor.vendor_name, contact_person: editModal.vendor.contact_person, contact_details: { phone: editModal.vendor.contact_phone, email: editModal.vendor.contact_email }, address: editModal.vendor.address, registration_date: editModal.vendor.registration_date, status: editModal.vendor.status, responsible_person: editModal.vendor.responsible_person, remarks: editModal.vendor.remarks } }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      } else {
        await axios.put(`${API_URL}${editModal.vendor.id}`, { property_id: editModal.vendor.property_id, vendor_master_management: { vendor_id: editModal.vendor.vendor_id, vendor_name: editModal.vendor.vendor_name, contact_person: editModal.vendor.contact_person, contact_details: { phone: editModal.vendor.contact_phone, email: editModal.vendor.contact_email }, address: editModal.vendor.address, registration_date: editModal.vendor.registration_date, status: editModal.vendor.status, responsible_person: editModal.vendor.responsible_person, remarks: editModal.vendor.remarks } }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      }
      setEditModal({ open: false, vendor: null, isNew: false }); fetchData();
    } catch { setError('Failed to save vendor'); }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: orangeDark }}>Vendor Master Management</h2>
          <div className="flex items-center space-x-3">
            {!isCadminRoute && (
              <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2">
                <option value="">Select Property</option>
                {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            )}
            {isAdmin && effectivePropertyId && (
              <button onClick={handleAdd} className="flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]">
                <Plus size={18} className="mr-2" /> Add Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Vendor ID</th>
              <th className="px-3 py-2 border">Vendor Name</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Address</th>
              <th className="px-3 py-2 border">Registration Date</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8">No vendor records found</td></tr>
            ) : (
              data.map((vendor, idx) => (
                <tr key={vendor.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{vendor.vendor_id}</td>
                  <td className="border px-2 py-1">{vendor.vendor_name}</td>
                  <td className="border px-2 py-1">
                    <div>{vendor.contact_person}</div>
                    <div className="text-gray-500 text-xs">{vendor.contact_phone} | {vendor.contact_email}</div>
                  </td>
                  <td className="border px-2 py-1">{vendor.address}</td>
                  <td className="border px-2 py-1">{vendor.registration_date}</td>
                  <td className="border px-2 py-1">{vendor.status}</td>
                  <td className="border px-2 py-1">{vendor.responsible_person}</td>
                  <td className="border px-2 py-1">{vendor.remarks}</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(vendor)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                    {isAdmin && (<>
                      <button onClick={() => handleEdit(vendor)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(vendor.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </>)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editModal.open && editModal.vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editModal.isNew ? 'Add Vendor' : 'Edit Vendor'}</h3>
              <button onClick={() => setEditModal({ open: false, vendor: null, isNew: false })} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Vendor ID" value={editModal.vendor.vendor_id} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, vendor_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vendor Name" value={editModal.vendor.vendor_name} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, vendor_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Person" value={editModal.vendor.contact_person} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, contact_person: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Phone" value={editModal.vendor.contact_phone} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, contact_phone: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Email" value={editModal.vendor.contact_email} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, contact_email: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Registration Date" type="date" value={editModal.vendor.registration_date} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, registration_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.vendor.status} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, status: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.vendor.responsible_person} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, responsible_person: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Address" value={editModal.vendor.address} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, address: e.target.value } })} />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.vendor.remarks} onChange={e => setEditModal(m => m && { ...m, vendor: { ...m.vendor!, remarks: e.target.value } })} />
              </div>
              <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setEditModal({ open: false, vendor: null, isNew: false })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button><button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.vendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Vendor ID:</b> {viewModal.vendor.vendor_id}</div>
              <div><b>Vendor Name:</b> {viewModal.vendor.vendor_name}</div>
              <div><b>Contact Person:</b> {viewModal.vendor.contact_person}</div>
              <div><b>Phone:</b> {viewModal.vendor.contact_phone}</div>
              <div><b>Email:</b> {viewModal.vendor.contact_email}</div>
              <div className="col-span-2"><b>Address:</b> {viewModal.vendor.address}</div>
              <div><b>Status:</b> {viewModal.vendor.status}</div>
              <div><b>Responsible Person:</b> {viewModal.vendor.responsible_person}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.vendor.remarks}</div>
            </div>
            <div className="flex justify-end mt-4"><button onClick={() => setViewModal({ open: false, vendor: null })} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMasterManagementPage;
