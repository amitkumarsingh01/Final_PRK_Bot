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

interface ProcessSetup {
  id?: string;
  quality_report_id?: string;
  process_id: string;
  process_name: string;
  description: string;
  inputs: string;
  outputs: string;
  owner: string;
  tools_methods: string;
  status: string;
  last_updated: string;
  remarks: string;
}

interface QualityReport {
  id: string;
  property_id: string;
  process_setups: ProcessSetup[];
}

const API_URL = 'https://server.prktechindia.in/quality-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProcessSetup: ProcessSetup = {
  process_id: '',
  process_name: '',
  description: '',
  inputs: '',
  outputs: '',
  owner: '',
  tools_methods: '',
  status: '',
  last_updated: '',
  remarks: '',
};

const ProcessManagementSetupPage: React.FC = () => {
  console.log('🚀 ProcessManagementSetup: Component initialized');
  const { user } = useAuth();
  console.log('👤 ProcessManagementSetup: User loaded', { userId: user?.userId });
  const [data, setData] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: ProcessSetup | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: ProcessSetup | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: ProcessSetup, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, isNew: true, item: { ...emptyProcessSetup }, reportId: id });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this process setup?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.process_setups.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { process_setups: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: ProcessSetup) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: ProcessSetup[];
      if (editModal.isNew) {
        newArr = [...report.process_setups, editModal.item];
      } else {
        newArr = report.process_setups.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { process_setups: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Process Management Setup</h2>
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
              <th className="px-3 py-2 border">Process ID</th>
              <th className="px-3 py-2 border">Process Name</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Inputs</th>
              <th className="px-3 py-2 border">Outputs</th>
              <th className="px-3 py-2 border">Owner</th>
              <th className="px-3 py-2 border">Tools/Methods</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Last Updated</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-6">
                  <div className="flex items-center justify-center gap-3">
                    <span>No records found</span>
                    {isAdmin && (
                      <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Process Setup</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.process_setups.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.process_id}</td>
                      <td className="border px-2 py-1">{item.process_name}</td>
                      <td className="border px-2 py-1">{item.description}</td>
                      <td className="border px-2 py-1">{item.inputs}</td>
                      <td className="border px-2 py-1">{item.outputs}</td>
                      <td className="border px-2 py-1">{item.owner}</td>
                      <td className="border px-2 py-1">{item.tools_methods}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.last_updated}</td>
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
          <Plus size={18} className="mr-2" /> Add Process Setup
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Process Setup
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
                <input className="border rounded px-3 py-2" placeholder="Process ID" value={editModal.item.process_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, process_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Process Name" value={editModal.item.process_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, process_name: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Description" value={editModal.item.description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, description: e.target.value } })} required rows={3} />
                <textarea className="border rounded px-3 py-2" placeholder="Inputs" value={editModal.item.inputs} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, inputs: e.target.value } })} required rows={3} />
                <textarea className="border rounded px-3 py-2" placeholder="Outputs" value={editModal.item.outputs} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, outputs: e.target.value } })} required rows={3} />
                <input className="border rounded px-3 py-2" placeholder="Owner" value={editModal.item.owner} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, owner: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Tools/Methods" value={editModal.item.tools_methods} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, tools_methods: e.target.value } })} required rows={3} />
                
                <input className="border rounded px-3 py-2" placeholder="Last Updated" value={editModal.item.last_updated} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, last_updated: e.target.value } })} required />
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
                Process Setup Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Process ID:</b> {viewModal.item.process_id}</div>
              <div><b>Process Name:</b> {viewModal.item.process_name}</div>
              <div className="col-span-2"><b>Description:</b> {viewModal.item.description}</div>
              <div className="col-span-2"><b>Inputs:</b> {viewModal.item.inputs}</div>
              <div className="col-span-2"><b>Outputs:</b> {viewModal.item.outputs}</div>
              <div><b>Owner:</b> {viewModal.item.owner}</div>
              <div className="col-span-2"><b>Tools/Methods:</b> {viewModal.item.tools_methods}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.item.status)}`}>
                  {viewModal.item.status}
                </span>
              </div>
              <div><b>Last Updated:</b> {viewModal.item.last_updated}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessManagementSetupPage; 
