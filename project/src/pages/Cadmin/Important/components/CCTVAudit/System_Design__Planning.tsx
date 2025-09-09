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

interface SiteAssessmentFormat {
  id?: string;
  cctv_audit_id?: string;
  SL_No: number;
  Description: string;
  Checklist_Points: string;
  Checked_Status: string;
  Observations: string;
  Suggestions_Actions: string;
  Responsibility: string;
  Target_Date?: string;
  Photo_Insert: string;
  Remarks: string;
}

interface CctvAuditReport {
  id: string;
  property_id: string;
  cctv_audit_data: {
    Site_Assessment_Format: SiteAssessmentFormat[];
  };
}

const API_URL = 'https://server.prktechindia.in/cctv-audit-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySiteAssessment: SiteAssessmentFormat = {
  SL_No: 0,
  Description: '',
  Checklist_Points: '',
  Checked_Status: '',
  Observations: '',
  Suggestions_Actions: '',
  Responsibility: '',
  Target_Date: '',
  Photo_Insert: '',
  Remarks: '',
};

const SystemDesignPlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CctvAuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: SiteAssessmentFormat | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: SiteAssessmentFormat | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        setProperties(res.data);
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUserProperty = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser && matchedUser.property_id) {
          setSelectedPropertyId(matchedUser.property_id);
        }
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch CCTV audit reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: SiteAssessmentFormat, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptySiteAssessment },
      reportId,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this system design entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = (report.cctv_audit_data?.Site_Assessment_Format || []).filter((i: SiteAssessmentFormat) => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        CCTV_Audit: { Site_Assessment_Format: newArr }
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: SiteAssessmentFormat) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: SiteAssessmentFormat[];
      if (editModal.isNew) {
        newArr = [...(report.cctv_audit_data?.Site_Assessment_Format || []), editModal.item];
      } else {
                        newArr = (report.cctv_audit_data?.Site_Assessment_Format || []).map((i: SiteAssessmentFormat) =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        CCTV_Audit: { Site_Assessment_Format: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>System Design & Planning</h2>
      
      {/* Property Selection Dropdown */}
      <div className="mb-6 max-w-md">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <select
            id="propertySelect"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
          >
            <option value="">Select a property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Checklist Points</th>
              <th className="px-3 py-2 border">Checked Status</th>
              <th className="px-3 py-2 border">Observations</th>
              <th className="px-3 py-2 border">Suggestions/Actions</th>
              <th className="px-3 py-2 border">Responsibility</th>
              <th className="px-3 py-2 border">Target Date</th>
              <th className="px-3 py-2 border">Photo Insert</th>
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
                  (report.cctv_audit_data?.Site_Assessment_Format || []).map((item, idx) => (
                    <tr key={item.id || `${rIdx}-${idx}`} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{item.SL_No}</td>
                      <td className="border px-2 py-1">{item.Description}</td>
                      <td className="border px-2 py-1">{item.Checklist_Points}</td>
                      <td className="border px-2 py-1">{item.Checked_Status}</td>
                      <td className="border px-2 py-1">{item.Observations}</td>
                      <td className="border px-2 py-1">{item.Suggestions_Actions}</td>
                      <td className="border px-2 py-1">{item.Responsibility}</td>
                      <td className="border px-2 py-1">{item.Target_Date}</td>
                      <td className="border px-2 py-1">{item.Photo_Insert}</td>
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
          <Plus size={18} className="mr-2" /> Add System Design Entry
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} System Design Entry
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
                <input className="border rounded px-3 py-2" placeholder="Description" value={editModal.item.Description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Description: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Checklist Points" value={editModal.item.Checklist_Points} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Checklist_Points: e.target.value } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.Checked_Status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Checked_Status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                  <option value="Pending">Pending</option>
                </select>
                <textarea className="border rounded px-3 py-2" placeholder="Observations" value={editModal.item.Observations} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Observations: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2" placeholder="Suggestions/Actions" value={editModal.item.Suggestions_Actions} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Suggestions_Actions: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsibility" value={editModal.item.Responsibility} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Responsibility: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Target Date" type="date" value={editModal.item.Target_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Target_Date: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Photo Insert" value={editModal.item.Photo_Insert} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Photo_Insert: e.target.value } })} required />
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
                System Design Details
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
              <div><b>Description:</b> {viewModal.item.Description}</div>
              <div><b>Checklist Points:</b> {viewModal.item.Checklist_Points}</div>
              <div><b>Checked Status:</b> {viewModal.item.Checked_Status}</div>
              <div><b>Observations:</b> {viewModal.item.Observations}</div>
              <div><b>Suggestions/Actions:</b> {viewModal.item.Suggestions_Actions}</div>
              <div><b>Responsibility:</b> {viewModal.item.Responsibility}</div>
              <div><b>Target Date:</b> {viewModal.item.Target_Date}</div>
              <div><b>Photo Insert:</b> {viewModal.item.Photo_Insert}</div>
              <div><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemDesignPlanningPage;
