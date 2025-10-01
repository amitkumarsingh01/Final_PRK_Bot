import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface EmergencyPreparednessPlan {
  id?: string;
  report_id?: string;
  Plan_ID: string;
  Site_Name: string;
  Plan_Type: string;
  Created_Date: string;
  Last_Updated: string;
  Responsible_Person: string;
  Key_Components: string;
  Status: string;
  Next_Review_Date: string;
  Remarks: string;
}

interface FireSafetyReport {
  id: string;
  property_id: string;
  emergency_plans: EmergencyPreparednessPlan[];
}

const API_URL = 'https://server.prktechindia.in/fire-safety-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyEmergencyPlan: EmergencyPreparednessPlan = {
  Plan_ID: '',
  Site_Name: '',
  Plan_Type: '',
  Created_Date: '',
  Last_Updated: '',
  Responsible_Person: '',
  Key_Components: '',
  Status: '',
  Next_Review_Date: '',
  Remarks: '',
};

const EmergencyPreparednessPlanPage: React.FC = () => {
  console.log('🚀 EmergencyPreparednessPlan: Component initialized');
  const { user } = useAuth();
  console.log('👤 EmergencyPreparednessPlan: User loaded', { userId: user?.userId });
  const [data, setData] = useState<FireSafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: EmergencyPreparednessPlan | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: EmergencyPreparednessPlan | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const handleEdit = (item: EmergencyPreparednessPlan, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyEmergencyPlan },
      reportId: id,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this emergency preparedness plan?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.emergency_plans.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        Fire_Safety_Management: { Emergency_Preparedness_Plan: newArr }
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: EmergencyPreparednessPlan) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: EmergencyPreparednessPlan[];
      if (editModal.isNew) {
        newArr = [...report.emergency_plans, editModal.item];
      } else {
        newArr = report.emergency_plans.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        Fire_Safety_Management: { Emergency_Preparedness_Plan: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Emergency Preparedness Plan</h2>
      
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
              <th className="px-3 py-2 border">Plan ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Plan Type</th>
              <th className="px-3 py-2 border">Created Date</th>
              <th className="px-3 py-2 border">Last Updated</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Next Review Date</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : (() => {
              const rows = data.flatMap((report, rIdx) =>
                report.emergency_plans.map((item, idx) => (
                  <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.Plan_ID}</td>
                    <td className="border px-2 py-1">{item.Site_Name}</td>
                    <td className="border px-2 py-1">{item.Plan_Type}</td>
                    <td className="border px-2 py-1">{item.Created_Date}</td>
                    <td className="border px-2 py-1">{item.Last_Updated}</td>
                    <td className="border px-2 py-1">{item.Responsible_Person}</td>
                    <td className="border px-2 py-1">{item.Status}</td>
                    <td className="border px-2 py-1">{item.Next_Review_Date}</td>
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
              );
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={10} className="text-center py-6">
                      <div className="flex items-center justify-center gap-3">
                        <span>No emergency preparedness plans found</span>
                        {isAdmin && (
                          <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Emergency Plan</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <button
          onClick={() => handleAdd(data[0]?.id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Emergency Plan
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Emergency Preparedness Plan
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
                <input className="border rounded px-3 py-2" placeholder="Plan ID" value={editModal.item.Plan_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Plan_ID: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Site Name" value={editModal.item.Site_Name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Site_Name: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Created Date" type="date" value={editModal.item.Created_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Created_Date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Last Updated" type="date" value={editModal.item.Last_Updated} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Last_Updated: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.Responsible_Person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Responsible_Person: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Next Review Date" type="date" value={editModal.item.Next_Review_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Next_Review_Date: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Key Components" value={editModal.item.Key_Components} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Key_Components: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.Remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Remarks: e.target.value } })} />
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
                Emergency Preparedness Plan Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Plan ID:</b> {viewModal.item.Plan_ID}</div>
              <div><b>Site Name:</b> {viewModal.item.Site_Name}</div>
              <div><b>Plan Type:</b> {viewModal.item.Plan_Type}</div>
              <div><b>Created Date:</b> {viewModal.item.Created_Date}</div>
              <div><b>Last Updated:</b> {viewModal.item.Last_Updated}</div>
              <div><b>Responsible Person:</b> {viewModal.item.Responsible_Person}</div>
              <div><b>Status:</b> {viewModal.item.Status}</div>
              <div><b>Next Review Date:</b> {viewModal.item.Next_Review_Date}</div>
              <div className="col-span-2"><b>Key Components:</b> {viewModal.item.Key_Components}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPreparednessPlanPage;
