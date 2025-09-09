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

interface KeySlaComponent {
  id?: string;
  report_id?: string;
  component_id: string;
  sla_id: string;
  service_name: string;
  component_type: string;
  description: string;
  target: string;
  measurement_method: string;
  responsible_person: string;
  status: string;
  remarks: string;
}

interface SlaReport {
  id: string;
  property_id: string;
  key_sla_components: KeySlaComponent[];
}

const API_URL = 'https://server.prktechindia.in/sla-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyKeySlaComponent: KeySlaComponent = {
  component_id: '',
  sla_id: '',
  service_name: '',
  component_type: '',
  description: '',
  target: '',
  measurement_method: '',
  responsible_person: '',
  status: '',
  remarks: '',
};

const KeySlaComponentsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SlaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: KeySlaComponent | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: KeySlaComponent | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: KeySlaComponent, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyKeySlaComponent },
      reportId,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this key SLA component?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = (report.key_sla_components || []).filter((i: KeySlaComponent) => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        key_sla_components: newArr
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: KeySlaComponent) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: KeySlaComponent[];
      if (editModal.isNew) {
        newArr = [...(report.key_sla_components || []), editModal.item];
      } else {
        newArr = (report.key_sla_components || []).map((i: KeySlaComponent) =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        key_sla_components: newArr
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Key SLA Components</h2>
      
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
              <th className="px-3 py-2 border">Component ID</th>
              <th className="px-3 py-2 border">SLA ID</th>
              <th className="px-3 py-2 border">Service Name</th>
              <th className="px-3 py-2 border">Component Type</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Target</th>
              <th className="px-3 py-2 border">Measurement Method</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  (report.key_sla_components || []).map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{item.component_id}</td>
                      <td className="border px-2 py-1">{item.sla_id}</td>
                      <td className="border px-2 py-1">{item.service_name}</td>
                      <td className="border px-2 py-1">{item.component_type}</td>
                      <td className="border px-2 py-1">{item.description}</td>
                      <td className="border px-2 py-1">{item.target}</td>
                      <td className="border px-2 py-1">{item.measurement_method}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">{item.status}</td>
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
          <Plus size={18} className="mr-2" /> Add Key SLA Component
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Key SLA Component
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
                <input className="border rounded px-3 py-2" placeholder="Component ID" value={editModal.item.component_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, component_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="SLA ID" value={editModal.item.sla_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sla_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Service Name" value={editModal.item.service_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, service_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Component Type" value={editModal.item.component_type} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, component_type: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Description" value={editModal.item.description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, description: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Target" value={editModal.item.target} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, target: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Measurement Method" value={editModal.item.measurement_method} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, measurement_method: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                
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

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Key SLA Component Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Component ID:</b> {viewModal.item.component_id}</div>
              <div><b>SLA ID:</b> {viewModal.item.sla_id}</div>
              <div><b>Service Name:</b> {viewModal.item.service_name}</div>
              <div><b>Component Type:</b> {viewModal.item.component_type}</div>
              <div><b>Description:</b> {viewModal.item.description}</div>
              <div><b>Target:</b> {viewModal.item.target}</div>
              <div><b>Measurement Method:</b> {viewModal.item.measurement_method}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeySlaComponentsPage;
