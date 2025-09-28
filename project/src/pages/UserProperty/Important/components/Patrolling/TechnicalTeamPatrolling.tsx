import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface FacilityTechnicalPatrollingEntry {
  id?: string;
  facility_technical_patrolling_report_id?: string;
  sl_no: number;
  date: string;
  time: string;
  location_area_covered: string;
  equipment_asset_checked: string;
  observation_issue_found: string;
  action_taken: string;
  remarks?: string;
  checked_by: string;
}

interface FacilityTechnicalPatrollingReport {
  id?: string;
  property_id: string;
  report_date: string;
  entries: FacilityTechnicalPatrollingEntry[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/facility-technical-patrolling-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyEntry: FacilityTechnicalPatrollingEntry = {
  sl_no: 1,
  date: '',
  time: '',
  location_area_covered: '',
  equipment_asset_checked: '',
  observation_issue_found: '',
  action_taken: '',
  remarks: '',
  checked_by: '',
};

const UserPropertyTechnicalTeamPatrollingPage: React.FC = () => {
  console.log('🚀 TechnicalTeamPatrolling: Component initialized');
  const { user } = useAuth();
  console.log('👤 TechnicalTeamPatrolling: User loaded', { userId: user?.userId });
  const [data, setData] = useState<FacilityTechnicalPatrollingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: FacilityTechnicalPatrollingReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: FacilityTechnicalPatrollingReport | null; isNew: boolean }>({ open: false, item: null, isNew: false });

  // Allow actions for admin and cadmin users
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  // Fetch facility technical patrolling reports for user's property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const items: FacilityTechnicalPatrollingReport[] = res.data || [];
      const filtered = Array.isArray(items)
        ? items.filter(r => r.property_id === (user?.propertyId || ''))
        : [];
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch facility technical patrolling reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) {
      fetchData();
    }
  }, [user?.propertyId]);

  // CRUD handlers
  const handleEdit = (item: FacilityTechnicalPatrollingReport) => {
    setEditModal({ open: true, item: { ...item }, isNew: false });
  };
  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      item: {
        property_id: user?.propertyId || '',
        report_date: '',
        entries: [{ ...emptyEntry }],
      },
    });
  };
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this facility technical patrolling report?')) return;
    try {
      await axios.delete(`${API_URL}${id}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: FacilityTechnicalPatrollingReport) => {
    setViewModal({ open: true, item });
  };

  // Form state handlers for edit/add modal
  const updateEditField = (field: keyof FacilityTechnicalPatrollingReport, value: any) => {
    setEditModal((prev) => prev.item ? { ...prev, item: { ...prev.item, [field]: value } } : prev);
  };
  // For array fields
  const updateArrayField = <T,>(section: keyof FacilityTechnicalPatrollingReport, arr: T[]) => {
    setEditModal((prev) => prev.item ? {
      ...prev,
      item: {
        ...prev.item,
        [section]: arr,
      },
    } : prev);
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item) return;
    try {
      const payload: FacilityTechnicalPatrollingReport = {
        ...editModal.item,
        property_id: user?.propertyId || editModal.item.property_id,
      };
      if (editModal.isNew) {
        await axios.post(API_URL, payload, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
      } else {
        await axios.put(`${API_URL}${payload.id}`, payload, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
      }
      setEditModal({ open: false, item: null, isNew: false });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Render helpers for entries array
  const renderEntries = (arr: FacilityTechnicalPatrollingEntry[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Technical Patrolling Entries</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('entries', [...arr, { ...emptyEntry, sl_no: arr.length + 1 }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No entries added.</div>}
      {arr.map((entry, idx) => (
        <div key={idx} className="border rounded p-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            {editable ? (
              <>
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="SL No" 
                  type="number"
                  value={entry.sl_no} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].sl_no = parseInt(e.target.value); 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Date" 
                  type="date"
                  value={entry.date} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].date = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Time" 
                  type="time"
                  value={entry.time} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].time = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Location/Area Covered" 
                  value={entry.location_area_covered} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].location_area_covered = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Equipment/Asset Checked" 
                  value={entry.equipment_asset_checked} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].equipment_asset_checked = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Observation/Issue Found" 
                  value={entry.observation_issue_found} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].observation_issue_found = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Action Taken" 
                  value={entry.action_taken} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].action_taken = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Remarks" 
                  value={entry.remarks} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].remarks = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Checked By" 
                  value={entry.checked_by} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].checked_by = e.target.value; 
                    updateArrayField('entries', newArr);
                  }} 
                />
                <button 
                  type="button" 
                  className="text-red-500" 
                  onClick={() => { 
                    const newArr = arr.filter((_, i) => i !== idx); 
                    updateArrayField('entries', newArr); 
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs"><b>SL No:</b> {entry.sl_no}</span>
                <span className="text-xs"><b>Date:</b> {entry.date}</span>
                <span className="text-xs"><b>Time:</b> {entry.time}</span>
                <span className="text-xs"><b>Location/Area:</b> {entry.location_area_covered}</span>
                <span className="text-xs"><b>Equipment/Asset:</b> {entry.equipment_asset_checked}</span>
                <span className="text-xs"><b>Observation/Issue:</b> {entry.observation_issue_found}</span>
                <span className="text-xs"><b>Action Taken:</b> {entry.action_taken}</span>
                {entry.remarks && <span className="text-xs"><b>Remarks:</b> {entry.remarks}</span>}
                <span className="text-xs"><b>Checked By:</b> {entry.checked_by}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Facility Technical Patrolling Report Management</h2>
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
              <th className="px-3 py-2 border">Report Date</th>
              <th className="px-3 py-2 border">Total Entries</th>
              <th className="px-3 py-2 border">Created At</th>
              <th className="px-3 py-2 border">Updated At</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.report_date}</td>
                    <td className="border px-2 py-1">{item.entries?.length || 0}</td>
                    <td className="border px-2 py-1">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                    <td className="border px-2 py-1">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}</td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      {/* Edit button available for UserProperty users - Delete removed */}
                      <button onClick={() => handleEdit(item)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Add button removed for UserProperty - edit-only access */}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Facility Technical Patrolling Report
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* Report Date */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-3">Report Information</div>
                <div className="grid grid-cols-1 gap-3">
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Report Date" 
                    type="date"
                    value={editModal.item.report_date} 
                    onChange={e => updateEditField('report_date', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* Technical Patrolling Entries */}
              {renderEntries(editModal.item.entries, true)}

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Facility Technical Patrolling Report: {viewModal.item.report_date}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Report Information */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Report Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>Report Date:</b> {viewModal.item.report_date}</div>
                <div><b>Total Entries:</b> {viewModal.item.entries?.length || 0}</div>
                <div><b>Created At:</b> {viewModal.item.created_at ? new Date(viewModal.item.created_at).toLocaleString() : '-'}</div>
                <div><b>Updated At:</b> {viewModal.item.updated_at ? new Date(viewModal.item.updated_at).toLocaleString() : '-'}</div>
              </div>
            </div>

            {/* Technical Patrolling Entries */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Technical Patrolling Entries</h4>
              {viewModal.item.entries?.map((entry, idx) => (
                <div key={idx} className="border rounded p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><b>SL No:</b> {entry.sl_no}</div>
                    <div><b>Date:</b> {entry.date}</div>
                    <div><b>Time:</b> {entry.time}</div>
                    <div><b>Location/Area Covered:</b> {entry.location_area_covered}</div>
                    <div><b>Equipment/Asset Checked:</b> {entry.equipment_asset_checked}</div>
                    <div><b>Observation/Issue Found:</b> {entry.observation_issue_found}</div>
                    <div><b>Action Taken:</b> {entry.action_taken}</div>
                    {entry.remarks && <div><b>Remarks:</b> {entry.remarks}</div>}
                    <div><b>Checked By:</b> {entry.checked_by}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPropertyTechnicalTeamPatrollingPage;
