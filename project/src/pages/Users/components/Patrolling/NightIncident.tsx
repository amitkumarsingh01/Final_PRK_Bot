import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../AuthContext';
import 'react-datepicker/dist/react-datepicker.css';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface NightPatrollingGeneralReportDetails {
  id?: string;
  night_patrolling_report_id?: string;
  date: string;
  patrolling_officer: string;
  site_name: string;
  shift: string;
  total_guards_on_duty: number;
  vehicle_used: string;
  weather_condition: string;
}

interface NightPatrollingObservation {
  id?: string;
  night_patrolling_report_id?: string;
  sl_no: number;
  time_of_visit: string;
  location_visited: string;
  guard_on_duty: string;
  photo_of_staff?: string;
  uniform_and_alertness: string;
  logbook_entry: string;
  issues_observed: string;
  action_taken: string;
  patrolling_officer_sign?: string;
}

interface NightPatrollingOfficerSignature {
  id?: string;
  night_patrolling_report_id?: string;
  signature?: string;
}

interface NightPatrollingReport {
  id?: string;
  property_id: string;
  general_report_details: NightPatrollingGeneralReportDetails;
  observations: NightPatrollingObservation[];
  officer_signature: NightPatrollingOfficerSignature;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/night-patrolling-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyGeneralDetails: NightPatrollingGeneralReportDetails = {
  date: '',
  patrolling_officer: '',
  site_name: '',
  shift: '',
  total_guards_on_duty: 0,
  vehicle_used: '',
  weather_condition: '',
};

const emptyObservation: NightPatrollingObservation = {
  sl_no: 1,
  time_of_visit: '',
  location_visited: '',
  guard_on_duty: '',
  photo_of_staff: '',
  uniform_and_alertness: '',
  logbook_entry: '',
  issues_observed: '',
  action_taken: '',
  patrolling_officer_sign: '',
};

const emptyOfficerSignature: NightPatrollingOfficerSignature = {
  signature: '',
};

const CNightIncidentPage: React.FC = () => {
  console.log('🚀 NightIncident: Component initialized');
  const { user } = useAuth();
  console.log('👤 NightIncident: User loaded', { userId: user?.userId });
  const [data, setData] = useState<NightPatrollingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: NightPatrollingReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: NightPatrollingReport | null; isNew: boolean }>({ open: false, item: null, isNew: false });

  // Allow actions for admin and cadmin users
  useEffect(() => {
    if (!user) return;
    setIsAdmin(user.userType === 'admin' || user.userType === 'cadmin');
  }, [user]);

  // Fetch night patrolling reports for user's property
  const fetchData = async () => {
    if (!user?.propertyId) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${user.propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const items: NightPatrollingReport[] = res.data || [];
      const filtered = Array.isArray(items)
        ? items.filter(r => r.property_id === (user?.propertyId || ''))
        : [];
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch night patrolling reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.propertyId) {
      fetchData();
    }
  }, [user?.propertyId]);

  // CRUD handlers
  const handleEdit = (item: NightPatrollingReport) => {
    setEditModal({ open: true, item: { ...item }, isNew: false });
  };
  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      item: {
        property_id: user?.propertyId || '',
        general_report_details: { ...emptyGeneralDetails },
        observations: [{ ...emptyObservation }],
        officer_signature: { ...emptyOfficerSignature },
      },
    });
  };
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this night patrolling report?')) return;
    try {
      await axios.delete(`${API_URL}${id}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: NightPatrollingReport) => {
    setViewModal({ open: true, item });
  };

  // Form state handlers for edit/add modal
  const updateEditField = (field: keyof NightPatrollingReport, value: any) => {
    setEditModal((prev) => prev.item ? { ...prev, item: { ...prev.item, [field]: value } } : prev);
  };
  // For nested objects
  const updateNestedField = (section: keyof NightPatrollingReport, field: string, value: any) => {
    setEditModal((prev) => prev.item ? {
      ...prev,
      item: {
        ...prev.item,
        [section]: {
          ...(prev.item[section] as any),
          [field]: value,
        },
      },
    } : prev);
  };
  // For array fields
  const updateArrayField = <T,>(section: keyof NightPatrollingReport, arr: T[]) => {
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
      const payload: NightPatrollingReport = {
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

  // Render helpers for observations array
  const renderObservations = (arr: NightPatrollingObservation[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Observations</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('observations', [...arr, { ...emptyObservation, sl_no: arr.length + 1 }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No observations added.</div>}
      {arr.map((obs, idx) => (
        <div key={idx} className="border rounded p-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            {editable ? (
              <>
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="SL No" 
                  type="number"
                  value={obs.sl_no} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].sl_no = parseInt(e.target.value); 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Time of Visit" 
                  value={obs.time_of_visit} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].time_of_visit = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Location Visited" 
                  value={obs.location_visited} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].location_visited = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Guard on Duty" 
                  value={obs.guard_on_duty} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].guard_on_duty = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Photo of Staff" 
                  value={obs.photo_of_staff} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].photo_of_staff = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Uniform and Alertness" 
                  value={obs.uniform_and_alertness} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].uniform_and_alertness = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Logbook Entry" 
                  value={obs.logbook_entry} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].logbook_entry = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Issues Observed" 
                  value={obs.issues_observed} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].issues_observed = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Action Taken" 
                  value={obs.action_taken} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].action_taken = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Patrolling Officer Sign" 
                  value={obs.patrolling_officer_sign} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].patrolling_officer_sign = e.target.value; 
                    updateArrayField('observations', newArr);
                  }} 
                />
                <button 
                  type="button" 
                  className="text-red-500" 
                  onClick={() => { 
                    const newArr = arr.filter((_, i) => i !== idx); 
                    updateArrayField('observations', newArr); 
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs"><b>SL No:</b> {obs.sl_no}</span>
                <span className="text-xs"><b>Time:</b> {obs.time_of_visit}</span>
                <span className="text-xs"><b>Location:</b> {obs.location_visited}</span>
                <span className="text-xs"><b>Guard:</b> {obs.guard_on_duty}</span>
                <span className="text-xs"><b>Uniform & Alertness:</b> {obs.uniform_and_alertness}</span>
                <span className="text-xs"><b>Logbook:</b> {obs.logbook_entry}</span>
                <span className="text-xs"><b>Issues:</b> {obs.issues_observed}</span>
                <span className="text-xs"><b>Action:</b> {obs.action_taken}</span>
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
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Night Patrolling Report Management</h2>
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
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Patrolling Officer</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Shift</th>
              <th className="px-3 py-2 border">Total Guards</th>
              <th className="px-3 py-2 border">Vehicle Used</th>
              <th className="px-3 py-2 border">Weather</th>
              <th className="px-3 py-2 border">Observations</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.date}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.patrolling_officer}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.site_name}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.shift}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.total_guards_on_duty}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.vehicle_used}</td>
                    <td className="border px-2 py-1">{item.general_report_details?.weather_condition}</td>
                    <td className="border px-2 py-1">{item.observations?.length || 0}</td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEdit(item)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600"><Trash2 size={18} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button
          onClick={handleAdd}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Night Patrolling Report
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Night Patrolling Report
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* General Report Details */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-3">General Report Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Date" 
                    type="date"
                    value={editModal.item.general_report_details.date} 
                    onChange={e => updateNestedField('general_report_details', 'date', e.target.value)} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Patrolling Officer" 
                    value={editModal.item.general_report_details.patrolling_officer} 
                    onChange={e => updateNestedField('general_report_details', 'patrolling_officer', e.target.value)} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Site Name" 
                    value={editModal.item.general_report_details.site_name} 
                    onChange={e => updateNestedField('general_report_details', 'site_name', e.target.value)} 
                    required 
                  />
                  <select 
                    className="border rounded px-3 py-2" 
                    value={editModal.item.general_report_details.shift} 
                    onChange={e => updateNestedField('general_report_details', 'shift', e.target.value)} 
                    required
                  >
                    <option value="">Select Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Total Guards on Duty" 
                    type="number"
                    value={editModal.item.general_report_details.total_guards_on_duty} 
                    onChange={e => updateNestedField('general_report_details', 'total_guards_on_duty', parseInt(e.target.value))} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Vehicle Used" 
                    value={editModal.item.general_report_details.vehicle_used} 
                    onChange={e => updateNestedField('general_report_details', 'vehicle_used', e.target.value)} 
                    required 
                  />
                  <select 
                    className="border rounded px-3 py-2" 
                    value={editModal.item.general_report_details.weather_condition} 
                    onChange={e => updateNestedField('general_report_details', 'weather_condition', e.target.value)} 
                    required
                  >
                    <option value="">Select Weather</option>
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Windy">Windy</option>
                    <option value="Foggy">Foggy</option>
                  </select>
                </div>
              </div>

              {/* Observations */}
              {renderObservations(editModal.item.observations, true)}

              {/* Officer Signature */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-2">Officer Signature</div>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  placeholder="Officer Signature" 
                  value={editModal.item.officer_signature.signature} 
                  onChange={e => updateNestedField('officer_signature', 'signature', e.target.value)} 
                />
              </div>

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
                Night Patrolling Report: {viewModal.item.general_report_details?.site_name}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* General Report Details */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">General Report Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>Date:</b> {viewModal.item.general_report_details?.date}</div>
                <div><b>Patrolling Officer:</b> {viewModal.item.general_report_details?.patrolling_officer}</div>
                <div><b>Site Name:</b> {viewModal.item.general_report_details?.site_name}</div>
                <div><b>Shift:</b> {viewModal.item.general_report_details?.shift}</div>
                <div><b>Total Guards on Duty:</b> {viewModal.item.general_report_details?.total_guards_on_duty}</div>
                <div><b>Vehicle Used:</b> {viewModal.item.general_report_details?.vehicle_used}</div>
                <div><b>Weather Condition:</b> {viewModal.item.general_report_details?.weather_condition}</div>
              </div>
            </div>

            {/* Observations */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Observations</h4>
              {viewModal.item.observations?.map((obs, idx) => (
                <div key={idx} className="border rounded p-2 mb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><b>SL No:</b> {obs.sl_no}</div>
                    <div><b>Time of Visit:</b> {obs.time_of_visit}</div>
                    <div><b>Location Visited:</b> {obs.location_visited}</div>
                    <div><b>Guard on Duty:</b> {obs.guard_on_duty}</div>
                    <div><b>Uniform & Alertness:</b> {obs.uniform_and_alertness}</div>
                    <div><b>Logbook Entry:</b> {obs.logbook_entry}</div>
                    <div><b>Issues Observed:</b> {obs.issues_observed}</div>
                    <div><b>Action Taken:</b> {obs.action_taken}</div>
                    {obs.photo_of_staff && <div><b>Photo of Staff:</b> {obs.photo_of_staff}</div>}
                    {obs.patrolling_officer_sign && <div><b>Patrolling Officer Sign:</b> {obs.patrolling_officer_sign}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Officer Signature */}
            {viewModal.item.officer_signature?.signature && (
              <div className="mb-4 border rounded p-4">
                <h4 className="font-semibold mb-2">Officer Signature</h4>
                <div className="text-sm">{viewModal.item.officer_signature.signature}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CNightIncidentPage;
