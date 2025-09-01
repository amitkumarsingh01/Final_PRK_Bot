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

interface SecuritySiteInfo {
  id?: string;
  security_patrolling_report_id?: string;
  site_name: string;
  location: string;
  date: string;
  shift: string;
  prepared_by: string;
  report_id: string;
}

interface SecurityPatrollingScheduleSummary {
  id?: string;
  security_patrolling_report_id?: string;
  total_rounds_planned: number;
  completed: number;
  missed: number;
  reason_for_missed_rounds?: string;
}

interface SecurityAreaWisePatrollingLog {
  id?: string;
  security_patrolling_report_id?: string;
  time: string;
  location_checkpoint: string;
  observation: string;
  status: string;
  remarks?: string;
}

interface SecurityKeyObservationViolation {
  id?: string;
  security_patrolling_report_id?: string;
  observation_violation: string;
}

interface SecurityImmediateAction {
  id?: string;
  security_patrolling_report_id?: string;
  action: string;
  by_whom: string;
  time: string;
}

interface SecuritySupervisorComment {
  id?: string;
  security_patrolling_report_id?: string;
  comment: string;
}

interface SecurityPhotoEvidence {
  id?: string;
  security_patrolling_report_id?: string;
  photo_description: string;
}

interface SecuritySignOff {
  id?: string;
  security_patrolling_report_id?: string;
  patrolling_guard_signature?: string;
  security_supervisor_signature?: string;
  client_acknowledgment_signature?: string;
}

interface SecurityPatrollingReport {
  id?: string;
  property_id: string;
  site_info: SecuritySiteInfo;
  patrolling_schedule_summary: SecurityPatrollingScheduleSummary;
  area_wise_patrolling_log: SecurityAreaWisePatrollingLog[];
  key_observations_or_violations: SecurityKeyObservationViolation[];
  immediate_actions_taken: SecurityImmediateAction[];
  supervisor_comments: SecuritySupervisorComment;
  photo_evidence: SecurityPhotoEvidence[];
  sign_off: SecuritySignOff;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/security-patrolling-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySiteInfo: SecuritySiteInfo = {
  site_name: '',
  location: '',
  date: '',
  shift: '',
  prepared_by: '',
  report_id: '',
};

const emptyScheduleSummary: SecurityPatrollingScheduleSummary = {
  total_rounds_planned: 0,
  completed: 0,
  missed: 0,
  reason_for_missed_rounds: '',
};

const emptyPatrollingLog: SecurityAreaWisePatrollingLog = {
  time: '',
  location_checkpoint: '',
  observation: '',
  status: '',
  remarks: '',
};

const emptyObservationViolation: SecurityKeyObservationViolation = {
  observation_violation: '',
};

const emptyImmediateAction: SecurityImmediateAction = {
  action: '',
  by_whom: '',
  time: '',
};

const emptySupervisorComment: SecuritySupervisorComment = {
  comment: '',
};

const emptyPhotoEvidence: SecurityPhotoEvidence = {
  photo_description: '',
};

const emptySignOff: SecuritySignOff = {
  patrolling_guard_signature: '',
  security_supervisor_signature: '',
  client_acknowledgment_signature: '',
};

const CSiteSecurityPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SecurityPatrollingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: SecurityPatrollingReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: SecurityPatrollingReport | null; isNew: boolean }>({ open: false, item: null, isNew: false });

  // Check if current user is admin or property user
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Fetch properties based on user type
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (isAdmin) {
          // Admin sees all properties
          const res = await axios.get(PROPERTIES_URL);
          setProperties(res.data);
        } else if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees their assigned property
          const res = await axios.get(`${PROPERTIES_URL}/${currentUserPropertyId}`);
          const property = res.data;
          setProperties([property]);
          // Automatically set the property for property users
          setSelectedPropertyId(currentUserPropertyId);
        }
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, [isAdmin, isPropertyUser, currentUserPropertyId]);

  // For property users, automatically set their property
  useEffect(() => {
    if (user?.userType === 'property_user' && user?.propertyId) {
      setSelectedPropertyId(user.propertyId);
      setIsAdmin(false);
    }
  }, [user]);

  // Fetch security patrolling reports for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch security patrolling reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // CRUD handlers
  const handleEdit = (item: SecurityPatrollingReport) => {
    setEditModal({ open: true, item: { ...item }, isNew: false });
  };
  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      item: {
        property_id: selectedPropertyId,
        site_info: { ...emptySiteInfo },
        patrolling_schedule_summary: { ...emptyScheduleSummary },
        area_wise_patrolling_log: [{ ...emptyPatrollingLog }],
        key_observations_or_violations: [{ ...emptyObservationViolation }],
        immediate_actions_taken: [{ ...emptyImmediateAction }],
        supervisor_comments: { ...emptySupervisorComment },
        photo_evidence: [{ ...emptyPhotoEvidence }],
        sign_off: { ...emptySignOff },
      },
    });
  };
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this security patrolling report?')) return;
    try {
      await axios.delete(`${API_URL}${id}`);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: SecurityPatrollingReport) => {
    setViewModal({ open: true, item });
  };

  // Form state handlers for edit/add modal
  const updateEditField = (field: keyof SecurityPatrollingReport, value: any) => {
    setEditModal((prev) => prev.item ? { ...prev, item: { ...prev.item, [field]: value } } : prev);
  };
  // For nested objects
  const updateNestedField = (section: keyof SecurityPatrollingReport, field: string, value: any) => {
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
  const updateArrayField = <T,>(section: keyof SecurityPatrollingReport, arr: T[]) => {
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
      if (editModal.isNew) {
        await axios.post(API_URL, editModal.item);
      } else {
        await axios.put(`${API_URL}${editModal.item.id}`, editModal.item);
      }
      setEditModal({ open: false, item: null, isNew: false });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Render helpers for array sections
  const renderPatrollingLogs = (arr: SecurityAreaWisePatrollingLog[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Area-wise Patrolling Logs</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('area_wise_patrolling_log', [...arr, { ...emptyPatrollingLog }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No patrolling logs added.</div>}
      {arr.map((log, idx) => (
        <div key={idx} className="border rounded p-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            {editable ? (
              <>
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Time" 
                  type="time"
                  value={log.time} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].time = e.target.value; 
                    updateArrayField('area_wise_patrolling_log', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Location Checkpoint" 
                  value={log.location_checkpoint} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].location_checkpoint = e.target.value; 
                    updateArrayField('area_wise_patrolling_log', newArr);
                  }} 
                />
                <textarea 
                  className="border rounded px-2 py-1 text-xs col-span-2" 
                  placeholder="Observation" 
                  value={log.observation} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].observation = e.target.value; 
                    updateArrayField('area_wise_patrolling_log', newArr);
                  }} 
                />
                <select 
                  className="border rounded px-2 py-1 text-xs" 
                  value={log.status} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].status = e.target.value; 
                    updateArrayField('area_wise_patrolling_log', newArr);
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="Normal">Normal</option>
                  <option value="Issue Found">Issue Found</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Completed">Completed</option>
                </select>
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Remarks" 
                  value={log.remarks} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].remarks = e.target.value; 
                    updateArrayField('area_wise_patrolling_log', newArr);
                  }} 
                />
                <button 
                  type="button" 
                  className="text-red-500" 
                  onClick={() => { 
                    const newArr = arr.filter((_, i) => i !== idx); 
                    updateArrayField('area_wise_patrolling_log', newArr); 
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs"><b>Time:</b> {log.time}</span>
                <span className="text-xs"><b>Location:</b> {log.location_checkpoint}</span>
                <span className="text-xs col-span-2"><b>Observation:</b> {log.observation}</span>
                <span className="text-xs"><b>Status:</b> {log.status}</span>
                {log.remarks && <span className="text-xs"><b>Remarks:</b> {log.remarks}</span>}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderObservationsViolations = (arr: SecurityKeyObservationViolation[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Key Observations/Violations</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('key_observations_or_violations', [...arr, { ...emptyObservationViolation }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No observations/violations added.</div>}
      {arr.map((obs, idx) => (
        <div key={idx} className="flex gap-2 mb-2 items-center">
          {editable ? (
            <>
              <textarea 
                className="border rounded px-2 py-1 text-xs flex-1" 
                placeholder="Observation/Violation" 
                value={obs.observation_violation} 
                onChange={e => {
                  const newArr = [...arr]; 
                  newArr[idx].observation_violation = e.target.value; 
                  updateArrayField('key_observations_or_violations', newArr);
                }} 
              />
              <button 
                type="button" 
                className="text-red-500" 
                onClick={() => { 
                  const newArr = arr.filter((_, i) => i !== idx); 
                  updateArrayField('key_observations_or_violations', newArr); 
                }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <span className="text-xs">{obs.observation_violation}</span>
          )}
        </div>
      ))}
    </div>
  );

  const renderImmediateActions = (arr: SecurityImmediateAction[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Immediate Actions Taken</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('immediate_actions_taken', [...arr, { ...emptyImmediateAction }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No immediate actions added.</div>}
      {arr.map((action, idx) => (
        <div key={idx} className="border rounded p-2 mb-2">
          <div className="grid grid-cols-3 gap-2">
            {editable ? (
              <>
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Action" 
                  value={action.action} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].action = e.target.value; 
                    updateArrayField('immediate_actions_taken', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="By Whom" 
                  value={action.by_whom} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].by_whom = e.target.value; 
                    updateArrayField('immediate_actions_taken', newArr);
                  }} 
                />
                <input 
                  className="border rounded px-2 py-1 text-xs" 
                  placeholder="Time" 
                  type="time"
                  value={action.time} 
                  onChange={e => {
                    const newArr = [...arr]; 
                    newArr[idx].time = e.target.value; 
                    updateArrayField('immediate_actions_taken', newArr);
                  }} 
                />
                <button 
                  type="button" 
                  className="text-red-500" 
                  onClick={() => { 
                    const newArr = arr.filter((_, i) => i !== idx); 
                    updateArrayField('immediate_actions_taken', newArr); 
                  }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs"><b>Action:</b> {action.action}</span>
                <span className="text-xs"><b>By:</b> {action.by_whom}</span>
                <span className="text-xs"><b>Time:</b> {action.time}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPhotoEvidence = (arr: SecurityPhotoEvidence[], editable: boolean) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Photo Evidence</span>
        {editable && (
          <button 
            type="button" 
            className="text-green-600" 
            onClick={() => updateArrayField('photo_evidence', [...arr, { ...emptyPhotoEvidence }])}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No photo evidence added.</div>}
      {arr.map((photo, idx) => (
        <div key={idx} className="flex gap-2 mb-2 items-center">
          {editable ? (
            <>
              <textarea 
                className="border rounded px-2 py-1 text-xs flex-1" 
                placeholder="Photo Description" 
                value={photo.photo_description} 
                onChange={e => {
                  const newArr = [...arr]; 
                  newArr[idx].photo_description = e.target.value; 
                  updateArrayField('photo_evidence', newArr);
                }} 
              />
              <button 
                type="button" 
                className="text-red-500" 
                onClick={() => { 
                  const newArr = arr.filter((_, i) => i !== idx); 
                  updateArrayField('photo_evidence', newArr); 
                }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <span className="text-xs">{photo.photo_description}</span>
          )}
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Security Patrolling Report Management</h2>
      {/* Property Selection Dropdown */}
      {isAdmin ? (
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
      ) : (
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {properties.find(p => p.id === selectedPropertyId)?.name || 'Loading...'}
            </div>
          </div>
        </div>
      )}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Report ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Shift</th>
              <th className="px-3 py-2 border">Prepared By</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Rounds Planned</th>
              <th className="px-3 py-2 border">Rounds Completed</th>
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
                    <td className="border px-2 py-1">{item.site_info?.report_id}</td>
                    <td className="border px-2 py-1">{item.site_info?.site_name}</td>
                    <td className="border px-2 py-1">{item.site_info?.date}</td>
                    <td className="border px-2 py-1">{item.site_info?.shift}</td>
                    <td className="border px-2 py-1">{item.site_info?.prepared_by}</td>
                    <td className="border px-2 py-1">{item.site_info?.location}</td>
                    <td className="border px-2 py-1">{item.patrolling_schedule_summary?.total_rounds_planned}</td>
                    <td className="border px-2 py-1">{item.patrolling_schedule_summary?.completed}</td>
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
          <Plus size={18} className="mr-2" /> Add Security Patrolling Report
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Security Patrolling Report
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* Site Information */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-3">Site Information</div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Site Name" 
                    value={editModal.item.site_info.site_name} 
                    onChange={e => updateNestedField('site_info', 'site_name', e.target.value)} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Location" 
                    value={editModal.item.site_info.location} 
                    onChange={e => updateNestedField('site_info', 'location', e.target.value)} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Date" 
                    type="date"
                    value={editModal.item.site_info.date} 
                    onChange={e => updateNestedField('site_info', 'date', e.target.value)} 
                    required 
                  />
                  <select 
                    className="border rounded px-3 py-2" 
                    value={editModal.item.site_info.shift} 
                    onChange={e => updateNestedField('site_info', 'shift', e.target.value)} 
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
                    placeholder="Prepared By" 
                    value={editModal.item.site_info.prepared_by} 
                    onChange={e => updateNestedField('site_info', 'prepared_by', e.target.value)} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Report ID" 
                    value={editModal.item.site_info.report_id} 
                    onChange={e => updateNestedField('site_info', 'report_id', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* Patrolling Schedule Summary */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-3">Patrolling Schedule Summary</div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Total Rounds Planned" 
                    type="number"
                    value={editModal.item.patrolling_schedule_summary.total_rounds_planned} 
                    onChange={e => updateNestedField('patrolling_schedule_summary', 'total_rounds_planned', parseInt(e.target.value))} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Completed Rounds" 
                    type="number"
                    value={editModal.item.patrolling_schedule_summary.completed} 
                    onChange={e => updateNestedField('patrolling_schedule_summary', 'completed', parseInt(e.target.value))} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Missed Rounds" 
                    type="number"
                    value={editModal.item.patrolling_schedule_summary.missed} 
                    onChange={e => updateNestedField('patrolling_schedule_summary', 'missed', parseInt(e.target.value))} 
                    required 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Reason for Missed Rounds" 
                    value={editModal.item.patrolling_schedule_summary.reason_for_missed_rounds} 
                    onChange={e => updateNestedField('patrolling_schedule_summary', 'reason_for_missed_rounds', e.target.value)} 
                  />
                </div>
              </div>

              {/* Area-wise Patrolling Logs */}
              {renderPatrollingLogs(editModal.item.area_wise_patrolling_log, true)}

              {/* Key Observations/Violations */}
              {renderObservationsViolations(editModal.item.key_observations_or_violations, true)}

              {/* Immediate Actions Taken */}
              {renderImmediateActions(editModal.item.immediate_actions_taken, true)}

              {/* Supervisor Comments */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-2">Supervisor Comments</div>
                <textarea 
                  className="border rounded px-3 py-2 w-full" 
                  placeholder="Supervisor Comments" 
                  value={editModal.item.supervisor_comments.comment} 
                  onChange={e => updateNestedField('supervisor_comments', 'comment', e.target.value)} 
                  required
                />
              </div>

              {/* Photo Evidence */}
              {renderPhotoEvidence(editModal.item.photo_evidence, true)}

              {/* Sign Off */}
              <div className="mb-4 border rounded p-4">
                <div className="font-semibold mb-3">Sign Off</div>
                <div className="grid grid-cols-1 gap-3">
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Patrolling Guard Signature" 
                    value={editModal.item.sign_off.patrolling_guard_signature} 
                    onChange={e => updateNestedField('sign_off', 'patrolling_guard_signature', e.target.value)} 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Security Supervisor Signature" 
                    value={editModal.item.sign_off.security_supervisor_signature} 
                    onChange={e => updateNestedField('sign_off', 'security_supervisor_signature', e.target.value)} 
                  />
                  <input 
                    className="border rounded px-3 py-2" 
                    placeholder="Client Acknowledgment Signature" 
                    value={editModal.item.sign_off.client_acknowledgment_signature} 
                    onChange={e => updateNestedField('sign_off', 'client_acknowledgment_signature', e.target.value)} 
                  />
                </div>
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
                Security Patrolling Report: {viewModal.item.site_info?.report_id}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Site Information */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Site Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>Site Name:</b> {viewModal.item.site_info?.site_name}</div>
                <div><b>Location:</b> {viewModal.item.site_info?.location}</div>
                <div><b>Date:</b> {viewModal.item.site_info?.date}</div>
                <div><b>Shift:</b> {viewModal.item.site_info?.shift}</div>
                <div><b>Prepared By:</b> {viewModal.item.site_info?.prepared_by}</div>
                <div><b>Report ID:</b> {viewModal.item.site_info?.report_id}</div>
              </div>
            </div>

            {/* Patrolling Schedule Summary */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Patrolling Schedule Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>Total Rounds Planned:</b> {viewModal.item.patrolling_schedule_summary?.total_rounds_planned}</div>
                <div><b>Completed Rounds:</b> {viewModal.item.patrolling_schedule_summary?.completed}</div>
                <div><b>Missed Rounds:</b> {viewModal.item.patrolling_schedule_summary?.missed}</div>
                {viewModal.item.patrolling_schedule_summary?.reason_for_missed_rounds && (
                  <div><b>Reason for Missed Rounds:</b> {viewModal.item.patrolling_schedule_summary.reason_for_missed_rounds}</div>
                )}
              </div>
            </div>

            {/* Area-wise Patrolling Logs */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Area-wise Patrolling Logs</h4>
              {viewModal.item.area_wise_patrolling_log?.map((log, idx) => (
                <div key={idx} className="border rounded p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><b>Time:</b> {log.time}</div>
                    <div><b>Location:</b> {log.location_checkpoint}</div>
                    <div className="col-span-2"><b>Observation:</b> {log.observation}</div>
                    <div><b>Status:</b> {log.status}</div>
                    {log.remarks && <div><b>Remarks:</b> {log.remarks}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Observations/Violations */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Key Observations/Violations</h4>
              {viewModal.item.key_observations_or_violations?.map((obs, idx) => (
                <div key={idx} className="text-sm mb-2">{obs.observation_violation}</div>
              ))}
            </div>

            {/* Immediate Actions Taken */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Immediate Actions Taken</h4>
              {viewModal.item.immediate_actions_taken?.map((action, idx) => (
                <div key={idx} className="border rounded p-2 mb-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><b>Action:</b> {action.action}</div>
                    <div><b>By:</b> {action.by_whom}</div>
                    <div><b>Time:</b> {action.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Supervisor Comments */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Supervisor Comments</h4>
              <div className="text-sm">{viewModal.item.supervisor_comments?.comment}</div>
            </div>

            {/* Photo Evidence */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Photo Evidence</h4>
              {viewModal.item.photo_evidence?.map((photo, idx) => (
                <div key={idx} className="text-sm mb-2">{photo.photo_description}</div>
              ))}
            </div>

            {/* Sign Off */}
            <div className="mb-4 border rounded p-4">
              <h4 className="font-semibold mb-2">Sign Off</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {viewModal.item.sign_off?.patrolling_guard_signature && (
                  <div><b>Patrolling Guard Signature:</b> {viewModal.item.sign_off.patrolling_guard_signature}</div>
                )}
                {viewModal.item.sign_off?.security_supervisor_signature && (
                  <div><b>Security Supervisor Signature:</b> {viewModal.item.sign_off.security_supervisor_signature}</div>
                )}
                {viewModal.item.sign_off?.client_acknowledgment_signature && (
                  <div><b>Client Acknowledgment Signature:</b> {viewModal.item.sign_off.client_acknowledgment_signature}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSiteSecurityPage;
