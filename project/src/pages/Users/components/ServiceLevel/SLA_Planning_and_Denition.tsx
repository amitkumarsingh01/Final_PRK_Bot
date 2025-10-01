import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface SlaPlanningAndDefinition {
  id?: string;
  report_id?: string;
  sla_id: string;
  service_name: string;
  client_department: string;
  objective: string;
  start_date: string;
  end_date: string;
  responsible_person: string;
  status: string;
  remarks: string;
}

interface SlaReport {
  id: string;
  property_id: string;
  sla_planning_and_definition: SlaPlanningAndDefinition[];
}

const API_URL = 'https://server.prktechindia.in/sla-reports/';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySlaPlanningAndDefinition: SlaPlanningAndDefinition = {
  sla_id: '',
  service_name: '',
  client_department: '',
  objective: '',
  start_date: '',
  end_date: '',
  responsible_person: '',
  status: '',
  remarks: '',
};

const SlaPlanningAndDefinitionPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SlaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: SlaPlanningAndDefinition | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: SlaPlanningAndDefinition | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: SlaPlanningAndDefinition, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, isNew: true, item: { ...emptySlaPlanningAndDefinition }, reportId: id });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this SLA planning entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = (report.sla_planning_and_definition || []).filter((i: SlaPlanningAndDefinition) => i.id !== itemId);
      await axios.put(
        `${API_URL}${reportId}`,
        { sla_planning_and_definition: newArr },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: SlaPlanningAndDefinition) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: SlaPlanningAndDefinition[];
      if (editModal.isNew) {
        newArr = [...(report.sla_planning_and_definition || []), editModal.item];
      } else {
        newArr = (report.sla_planning_and_definition || []).map((i: SlaPlanningAndDefinition) =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(
        `${API_URL}${editModal.reportId}`,
        { sla_planning_and_definition: newArr },
        user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined
      );
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>SLA Planning and Definition</h2>

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
              <th className="px-3 py-2 border">SLA ID</th>
              <th className="px-3 py-2 border">Service Name</th>
              <th className="px-3 py-2 border">Client Department</th>
              <th className="px-3 py-2 border">Objective</th>
              <th className="px-3 py-2 border">Start Date</th>
              <th className="px-3 py-2 border">End Date</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8">
                  <div className="text-gray-500 mb-3">No entries found</div>
                  {isAdmin && user?.propertyId && (
                    <button
                      onClick={() => handleAdd()}
                      className="inline-flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
                    >
                      <Plus size={18} className="mr-2" /> Add SLA Planning Entry
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              data.flatMap((report, rIdx) =>
                (report.sla_planning_and_definition || []).map((item, idx) => (
                  <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{item.sla_id}</td>
                    <td className="border px-2 py-1">{item.service_name}</td>
                    <td className="border px-2 py-1">{item.client_department}</td>
                    <td className="border px-2 py-1">{item.objective}</td>
                    <td className="border px-2 py-1">{item.start_date}</td>
                    <td className="border px-2 py-1">{item.end_date}</td>
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
              )
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add SLA Planning Entry
        </button>
      )}

      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} SLA Planning Entry
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
                <input className="border rounded px-3 py-2" placeholder="SLA ID" value={editModal.item.sla_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sla_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Service Name" value={editModal.item.service_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, service_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Client Department" value={editModal.item.client_department} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, client_department: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Objective" value={editModal.item.objective} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, objective: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Start Date" type="date" value={editModal.item.start_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, start_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="End Date" type="date" value={editModal.item.end_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, end_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
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
              <h3 className="text-lg font-semibold text-gray-900">
                SLA Planning Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>SLA ID:</b> {viewModal.item.sla_id}</div>
              <div><b>Service Name:</b> {viewModal.item.service_name}</div>
              <div><b>Client Department:</b> {viewModal.item.client_department}</div>
              <div><b>Objective:</b> {viewModal.item.objective}</div>
              <div><b>Start Date:</b> {viewModal.item.start_date}</div>
              <div><b>End Date:</b> {viewModal.item.end_date}</div>
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

export default SlaPlanningAndDefinitionPage;
