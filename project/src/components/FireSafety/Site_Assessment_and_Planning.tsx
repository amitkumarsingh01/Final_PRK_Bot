import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface SiteAssessmentAndPlanning {
  id?: string;
  report_id?: string;
  Assessment_ID: string;
  Site_Name: string;
  Location: string;
  Assessment_Date: string;
  Assessor: string;
  Risk_Areas: string;
  Fire_Hazards_Identified: string;
  Recommendations: string;
  Compliance_Standards: string;
  Status: string;
  Remarks: string;
}

interface FireSafetyReport {
  id: string;
  property_id: string;
  site_assessments: SiteAssessmentAndPlanning[];
}

const API_URL = 'https://server.prktechindia.in/fire-safety-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySiteAssessment: SiteAssessmentAndPlanning = {
  Assessment_ID: '',
  Site_Name: '',
  Location: '',
  Assessment_Date: '',
  Assessor: '',
  Risk_Areas: '',
  Fire_Hazards_Identified: '',
  Recommendations: '',
  Compliance_Standards: '',
  Status: '',
  Remarks: '',
};

const SiteAssessmentAndPlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<FireSafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: SiteAssessmentAndPlanning | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: SiteAssessmentAndPlanning | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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
      setError('Failed to fetch fire safety reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: SiteAssessmentAndPlanning, reportId: string) => {
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
    if (!window.confirm('Delete this site assessment record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.site_assessments.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        Fire_Safety_Management: { Site_Assessment_and_Planning: newArr }
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: SiteAssessmentAndPlanning) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: SiteAssessmentAndPlanning[];
      if (editModal.isNew) {
        newArr = [...report.site_assessments, editModal.item];
      } else {
        newArr = report.site_assessments.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        Fire_Safety_Management: { Site_Assessment_and_Planning: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Site Assessment and Planning</h2>
      
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
              <th className="px-3 py-2 border">Assessment ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Assessment Date</th>
              <th className="px-3 py-2 border">Assessor</th>
              <th className="px-3 py-2 border">Risk Areas</th>
              <th className="px-3 py-2 border">Fire Hazards</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.site_assessments.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.Assessment_ID}</td>
                      <td className="border px-2 py-1">{item.Site_Name}</td>
                      <td className="border px-2 py-1">{item.Location}</td>
                      <td className="border px-2 py-1">{item.Assessment_Date}</td>
                      <td className="border px-2 py-1">{item.Assessor}</td>
                      <td className="border px-2 py-1">{item.Risk_Areas}</td>
                      <td className="border px-2 py-1">{item.Fire_Hazards_Identified}</td>
                      <td className="border px-2 py-1">{item.Status}</td>
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
          <Plus size={18} className="mr-2" /> Add Site Assessment
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Site Assessment
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
                <input className="border rounded px-3 py-2" placeholder="Assessment ID" value={editModal.item.Assessment_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Assessment_ID: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Site Name" value={editModal.item.Site_Name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Site_Name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Location" value={editModal.item.Location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Assessment Date" type="date" value={editModal.item.Assessment_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Assessment_Date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Assessor" value={editModal.item.Assessor} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Assessor: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Risk Areas" value={editModal.item.Risk_Areas} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Risk_Areas: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Fire Hazards Identified" value={editModal.item.Fire_Hazards_Identified} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Fire_Hazards_Identified: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Recommendations" value={editModal.item.Recommendations} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Recommendations: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Compliance Standards" value={editModal.item.Compliance_Standards} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Compliance_Standards: e.target.value } })} required />
                <select className="border rounded px-3 py-2" value={editModal.item.Status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Review Required">Review Required</option>
                </select>
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
                Site Assessment Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Assessment ID:</b> {viewModal.item.Assessment_ID}</div>
              <div><b>Site Name:</b> {viewModal.item.Site_Name}</div>
              <div><b>Location:</b> {viewModal.item.Location}</div>
              <div><b>Assessment Date:</b> {viewModal.item.Assessment_Date}</div>
              <div><b>Assessor:</b> {viewModal.item.Assessor}</div>
              <div><b>Risk Areas:</b> {viewModal.item.Risk_Areas}</div>
              <div className="col-span-2"><b>Fire Hazards Identified:</b> {viewModal.item.Fire_Hazards_Identified}</div>
              <div className="col-span-2"><b>Recommendations:</b> {viewModal.item.Recommendations}</div>
              <div><b>Compliance Standards:</b> {viewModal.item.Compliance_Standards}</div>
              <div><b>Status:</b> {viewModal.item.Status}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteAssessmentAndPlanningPage;
