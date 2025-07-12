import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface SiteDetails {
  site_name: string;
  location: string;
  date_time_of_incident: string;
  reported_by: string;
  reported_to: string;
  department_involved: string;
  incident_type: string;
}

interface Personnel {
  name: string;
  designation: string;
  department: string;
  role_in_incident: string;
}

interface EvidenceAttachments {
  cctv_footage: string;
  visitor_entry_logs: string;
  photographs: string;
  site_map: string;
}

interface RootCause {
  cause_description: string;
}

interface ImmediateAction {
  action: string;
  by_whom: string;
  time: string;
}

interface CorrectiveAction {
  action: string;
  responsible: string;
  deadline: string;
  status: string;
}

interface IncidentClassification {
  risk_level: string;
  report_severity: string;
}

interface ClientCommunication {
  client_contacted: string;
  mode: string;
  date_time: string;
  response_summary: string;
}

interface Approval {
  approval_type: string;
  name: string;
  signature: string;
  date: string;
}

interface IncidentReport {
  id?: string;
  property_id: string;
  prepared_by: string;
  organization: string;
  date_of_report: string;
  incident_id: string;
  incident_description: string;
  site_details: SiteDetails;
  personnel_involved: Personnel[];
  evidence_attachments: EvidenceAttachments;
  root_cause_analysis: RootCause[];
  immediate_actions: ImmediateAction[];
  corrective_preventive_actions: CorrectiveAction[];
  incident_classification: IncidentClassification;
  client_communication: ClientCommunication;
  approvals_signatures: Approval[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/incident-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySiteDetails: SiteDetails = {
  site_name: '',
  location: '',
  date_time_of_incident: '',
  reported_by: '',
  reported_to: '',
  department_involved: '',
  incident_type: '',
};
const emptyEvidence: EvidenceAttachments = {
  cctv_footage: '',
  visitor_entry_logs: '',
  photographs: '',
  site_map: '',
};
const emptyClassification: IncidentClassification = {
  risk_level: '',
  report_severity: '',
};
const emptyClientComm: ClientCommunication = {
  client_contacted: '',
  mode: '',
  date_time: '',
  response_summary: '',
};

const IncidentReportPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: IncidentReport | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: IncidentReport | null; isNew: boolean }>({ open: false, item: null, isNew: false });

  // Fetch properties and user's default property_id
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
    // Fetch user's default property_id from profile
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

  // Fetch incident reports for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch incident reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // CRUD handlers
  const handleEdit = (item: IncidentReport) => {
    setEditModal({ open: true, item: { ...item }, isNew: false });
  };
  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      item: {
        property_id: selectedPropertyId,
        prepared_by: '',
        organization: '',
        date_of_report: '',
        incident_id: '',
        incident_description: '',
        site_details: { ...emptySiteDetails },
        personnel_involved: [],
        evidence_attachments: { ...emptyEvidence },
        root_cause_analysis: [],
        immediate_actions: [],
        corrective_preventive_actions: [],
        incident_classification: { ...emptyClassification },
        client_communication: { ...emptyClientComm },
        approvals_signatures: [],
      },
    });
  };
  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this incident report?')) return;
    try {
      await axios.delete(`${API_URL}${id}`);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: IncidentReport) => {
    setViewModal({ open: true, item });
  };

  // Form state handlers for edit/add modal
  const updateEditField = (field: keyof IncidentReport, value: any) => {
    setEditModal((prev) => prev.item ? { ...prev, item: { ...prev.item, [field]: value } } : prev);
  };
  // For nested objects
  const updateNestedField = (section: keyof IncidentReport, field: string, value: any) => {
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
  const updateArrayField = <T,>(section: keyof IncidentReport, arr: T[]) => {
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
  const renderPersonnel = (arr: Personnel[], editable: boolean) => (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">Personnel Involved</span>
        {editable && <button type="button" className="text-green-600" onClick={() => updateArrayField('personnel_involved', [...arr, { name: '', designation: '', department: '', role_in_incident: '' }])}><Plus size={16} /></button>}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No personnel added.</div>}
      {arr.map((p, idx) => (
        <div key={idx} className="flex gap-2 mb-1 items-center">
          {editable ? (
            <>
              <input className="border rounded px-1 text-xs" placeholder="Name" value={p.name} onChange={e => {
                const newArr = [...arr]; newArr[idx].name = e.target.value; updateArrayField('personnel_involved', newArr);
              }} />
              <input className="border rounded px-1 text-xs" placeholder="Designation" value={p.designation} onChange={e => {
                const newArr = [...arr]; newArr[idx].designation = e.target.value; updateArrayField('personnel_involved', newArr);
              }} />
              <input className="border rounded px-1 text-xs" placeholder="Department" value={p.department} onChange={e => {
                const newArr = [...arr]; newArr[idx].department = e.target.value; updateArrayField('personnel_involved', newArr);
              }} />
              <input className="border rounded px-1 text-xs" placeholder="Role" value={p.role_in_incident} onChange={e => {
                const newArr = [...arr]; newArr[idx].role_in_incident = e.target.value; updateArrayField('personnel_involved', newArr);
              }} />
              <button type="button" className="text-red-500" onClick={() => { const newArr = arr.filter((_, i) => i !== idx); updateArrayField('personnel_involved', newArr); }}><X size={14} /></button>
            </>
          ) : (
            <span className="text-xs">{p.name} ({p.designation}, {p.department}) - {p.role_in_incident}</span>
          )}
        </div>
      ))}
    </div>
  );
  const renderRootCauses = (arr: RootCause[], editable: boolean) => (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">Root Cause Analysis</span>
        {editable && <button type="button" className="text-green-600" onClick={() => updateArrayField('root_cause_analysis', [...arr, { cause_description: '' }])}><Plus size={16} /></button>}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No root causes added.</div>}
      {arr.map((r, idx) => (
        <div key={idx} className="flex gap-2 mb-1 items-center">
          {editable ? (
            <>
              <input className="border rounded px-1 text-xs w-64" placeholder="Cause Description" value={r.cause_description} onChange={e => {
                const newArr = [...arr]; newArr[idx].cause_description = e.target.value; updateArrayField('root_cause_analysis', newArr);
              }} />
              <button type="button" className="text-red-500" onClick={() => { const newArr = arr.filter((_, i) => i !== idx); updateArrayField('root_cause_analysis', newArr); }}><X size={14} /></button>
            </>
          ) : (
            <span className="text-xs">{r.cause_description}</span>
          )}
        </div>
      ))}
    </div>
  );
  const renderImmediateActions = (arr: ImmediateAction[], editable: boolean) => (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">Immediate Actions</span>
        {editable && <button type="button" className="text-green-600" onClick={() => updateArrayField('immediate_actions', [...arr, { action: '', by_whom: '', time: '' }])}><Plus size={16} /></button>}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No immediate actions added.</div>}
      {arr.map((a, idx) => (
        <div key={idx} className="flex gap-2 mb-1 items-center">
          {editable ? (
            <>
              <input className="border rounded px-1 text-xs" placeholder="Action" value={a.action} onChange={e => { const newArr = [...arr]; newArr[idx].action = e.target.value; updateArrayField('immediate_actions', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="By Whom" value={a.by_whom} onChange={e => { const newArr = [...arr]; newArr[idx].by_whom = e.target.value; updateArrayField('immediate_actions', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Time" value={a.time} onChange={e => { const newArr = [...arr]; newArr[idx].time = e.target.value; updateArrayField('immediate_actions', newArr); }} />
              <button type="button" className="text-red-500" onClick={() => { const newArr = arr.filter((_, i) => i !== idx); updateArrayField('immediate_actions', newArr); }}><X size={14} /></button>
            </>
          ) : (
            <span className="text-xs">{a.action} by {a.by_whom} at {a.time}</span>
          )}
        </div>
      ))}
    </div>
  );
  const renderCorrectiveActions = (arr: CorrectiveAction[], editable: boolean) => (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">Corrective/Preventive Actions</span>
        {editable && <button type="button" className="text-green-600" onClick={() => updateArrayField('corrective_preventive_actions', [...arr, { action: '', responsible: '', deadline: '', status: '' }])}><Plus size={16} /></button>}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No corrective actions added.</div>}
      {arr.map((a, idx) => (
        <div key={idx} className="flex gap-2 mb-1 items-center">
          {editable ? (
            <>
              <input className="border rounded px-1 text-xs" placeholder="Action" value={a.action} onChange={e => { const newArr = [...arr]; newArr[idx].action = e.target.value; updateArrayField('corrective_preventive_actions', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Responsible" value={a.responsible} onChange={e => { const newArr = [...arr]; newArr[idx].responsible = e.target.value; updateArrayField('corrective_preventive_actions', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Deadline" value={a.deadline} onChange={e => { const newArr = [...arr]; newArr[idx].deadline = e.target.value; updateArrayField('corrective_preventive_actions', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Status" value={a.status} onChange={e => { const newArr = [...arr]; newArr[idx].status = e.target.value; updateArrayField('corrective_preventive_actions', newArr); }} />
              <button type="button" className="text-red-500" onClick={() => { const newArr = arr.filter((_, i) => i !== idx); updateArrayField('corrective_preventive_actions', newArr); }}><X size={14} /></button>
            </>
          ) : (
            <span className="text-xs">{a.action} (Responsible: {a.responsible}, Deadline: {a.deadline}, Status: {a.status})</span>
          )}
        </div>
      ))}
    </div>
  );
  const renderApprovals = (arr: Approval[], editable: boolean) => (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold">Approvals/Signatures</span>
        {editable && <button type="button" className="text-green-600" onClick={() => updateArrayField('approvals_signatures', [...arr, { approval_type: '', name: '', signature: '', date: '' }])}><Plus size={16} /></button>}
      </div>
      {arr.length === 0 && <div className="text-xs text-gray-400">No approvals added.</div>}
      {arr.map((a, idx) => (
        <div key={idx} className="flex gap-2 mb-1 items-center">
          {editable ? (
            <>
              <input className="border rounded px-1 text-xs" placeholder="Type" value={a.approval_type} onChange={e => { const newArr = [...arr]; newArr[idx].approval_type = e.target.value; updateArrayField('approvals_signatures', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Name" value={a.name} onChange={e => { const newArr = [...arr]; newArr[idx].name = e.target.value; updateArrayField('approvals_signatures', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Signature" value={a.signature} onChange={e => { const newArr = [...arr]; newArr[idx].signature = e.target.value; updateArrayField('approvals_signatures', newArr); }} />
              <input className="border rounded px-1 text-xs" placeholder="Date" value={a.date} onChange={e => { const newArr = [...arr]; newArr[idx].date = e.target.value; updateArrayField('approvals_signatures', newArr); }} />
              <button type="button" className="text-red-500" onClick={() => { const newArr = arr.filter((_, i) => i !== idx); updateArrayField('approvals_signatures', newArr); }}><X size={14} /></button>
            </>
          ) : (
            <span className="text-xs">{a.approval_type}: {a.name} ({a.date})</span>
          )}
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Incident Report Management</h2>
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
              <th className="px-3 py-2 border">Incident ID</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Prepared By</th>
              <th className="px-3 py-2 border">Organization</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Incident Type</th>
              <th className="px-3 py-2 border">Risk Level</th>
              <th className="px-3 py-2 border">Severity</th>
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
                    <td className="border px-2 py-1">{item.incident_id}</td>
                    <td className="border px-2 py-1">{item.date_of_report}</td>
                    <td className="border px-2 py-1">{item.prepared_by}</td>
                    <td className="border px-2 py-1">{item.organization}</td>
                    <td className="border px-2 py-1">{item.site_details?.site_name}</td>
                    <td className="border px-2 py-1">{item.site_details?.incident_type}</td>
                    <td className="border px-2 py-1">{item.incident_classification?.risk_level}</td>
                    <td className="border px-2 py-1">{item.incident_classification?.report_severity}</td>
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
          <Plus size={18} className="mr-2" /> Add Incident Report
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Incident Report
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              {/* Main Fields */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <input className="border rounded px-2 py-1" placeholder="Prepared By" value={editModal.item.prepared_by} onChange={e => updateEditField('prepared_by', e.target.value)} required />
                <input className="border rounded px-2 py-1" placeholder="Organization" value={editModal.item.organization} onChange={e => updateEditField('organization', e.target.value)} required />
                <input className="border rounded px-2 py-1" placeholder="Date of Report" value={editModal.item.date_of_report} onChange={e => updateEditField('date_of_report', e.target.value)} required />
                <input className="border rounded px-2 py-1" placeholder="Incident ID" value={editModal.item.incident_id} onChange={e => updateEditField('incident_id', e.target.value)} required />
              </div>
              <textarea className="border rounded px-2 py-1 w-full mb-2" placeholder="Incident Description" value={editModal.item.incident_description} onChange={e => updateEditField('incident_description', e.target.value)} required />
              {/* Site Details */}
              <div className="mb-4 border rounded p-2">
                <div className="font-semibold mb-2">Site Details</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Site Name" value={editModal.item.site_details.site_name} onChange={e => updateNestedField('site_details', 'site_name', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Location" value={editModal.item.site_details.location} onChange={e => updateNestedField('site_details', 'location', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Date/Time of Incident" value={editModal.item.site_details.date_time_of_incident} onChange={e => updateNestedField('site_details', 'date_time_of_incident', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Reported By" value={editModal.item.site_details.reported_by} onChange={e => updateNestedField('site_details', 'reported_by', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Reported To" value={editModal.item.site_details.reported_to} onChange={e => updateNestedField('site_details', 'reported_to', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Department Involved" value={editModal.item.site_details.department_involved} onChange={e => updateNestedField('site_details', 'department_involved', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Incident Type" value={editModal.item.site_details.incident_type} onChange={e => updateNestedField('site_details', 'incident_type', e.target.value)} required />
                </div>
              </div>
              {/* Personnel Involved */}
              {renderPersonnel(editModal.item.personnel_involved, true)}
              {/* Evidence Attachments */}
              <div className="mb-4 border rounded p-2">
                <div className="font-semibold mb-2">Evidence Attachments</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="CCTV Footage" value={editModal.item.evidence_attachments.cctv_footage} onChange={e => updateNestedField('evidence_attachments', 'cctv_footage', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Visitor Entry Logs" value={editModal.item.evidence_attachments.visitor_entry_logs} onChange={e => updateNestedField('evidence_attachments', 'visitor_entry_logs', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Photographs" value={editModal.item.evidence_attachments.photographs} onChange={e => updateNestedField('evidence_attachments', 'photographs', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Site Map" value={editModal.item.evidence_attachments.site_map} onChange={e => updateNestedField('evidence_attachments', 'site_map', e.target.value)} />
                </div>
              </div>
              {/* Root Cause Analysis */}
              {renderRootCauses(editModal.item.root_cause_analysis, true)}
              {/* Immediate Actions */}
              {renderImmediateActions(editModal.item.immediate_actions, true)}
              {/* Corrective/Preventive Actions */}
              {renderCorrectiveActions(editModal.item.corrective_preventive_actions, true)}
              {/* Incident Classification */}
              <div className="mb-4 border rounded p-2">
                <div className="font-semibold mb-2">Incident Classification</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Risk Level" value={editModal.item.incident_classification.risk_level} onChange={e => updateNestedField('incident_classification', 'risk_level', e.target.value)} required />
                  <input className="border rounded px-2 py-1" placeholder="Report Severity" value={editModal.item.incident_classification.report_severity} onChange={e => updateNestedField('incident_classification', 'report_severity', e.target.value)} required />
                </div>
              </div>
              {/* Client Communication */}
              <div className="mb-4 border rounded p-2">
                <div className="font-semibold mb-2">Client Communication</div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded px-2 py-1" placeholder="Client Contacted" value={editModal.item.client_communication.client_contacted} onChange={e => updateNestedField('client_communication', 'client_contacted', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Mode" value={editModal.item.client_communication.mode} onChange={e => updateNestedField('client_communication', 'mode', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Date/Time" value={editModal.item.client_communication.date_time} onChange={e => updateNestedField('client_communication', 'date_time', e.target.value)} />
                  <input className="border rounded px-2 py-1" placeholder="Response Summary" value={editModal.item.client_communication.response_summary} onChange={e => updateNestedField('client_communication', 'response_summary', e.target.value)} />
                </div>
              </div>
              {/* Approvals/Signatures */}
              {renderApprovals(editModal.item.approvals_signatures, true)}
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Incident Report: {viewModal.item.incident_id}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-2"><b>Date:</b> {viewModal.item.date_of_report}</div>
            <div className="mb-2"><b>Prepared By:</b> {viewModal.item.prepared_by}</div>
            <div className="mb-2"><b>Organization:</b> {viewModal.item.organization}</div>
            <div className="mb-2"><b>Description:</b> {viewModal.item.incident_description}</div>
            <div className="mb-2"><b>Site Details:</b> {Object.entries(viewModal.item.site_details).map(([k, v]) => <span key={k} className="ml-2"><b>{k.replace(/_/g, ' ')}:</b> {v}</span>)}</div>
            <div className="mb-2"><b>Personnel Involved:</b> {viewModal.item.personnel_involved.map((p, i) => <span key={i} className="ml-2">{p.name} ({p.designation}, {p.department}) - {p.role_in_incident}</span>)}</div>
            <div className="mb-2"><b>Evidence Attachments:</b> {Object.entries(viewModal.item.evidence_attachments).map(([k, v]) => <span key={k} className="ml-2"><b>{k.replace(/_/g, ' ')}:</b> {v}</span>)}</div>
            <div className="mb-2"><b>Root Cause Analysis:</b> {viewModal.item.root_cause_analysis.map((r, i) => <span key={i} className="ml-2">{r.cause_description}</span>)}</div>
            <div className="mb-2"><b>Immediate Actions:</b> {viewModal.item.immediate_actions.map((a, i) => <span key={i} className="ml-2">{a.action} by {a.by_whom} at {a.time}</span>)}</div>
            <div className="mb-2"><b>Corrective/Preventive Actions:</b> {viewModal.item.corrective_preventive_actions.map((a, i) => <span key={i} className="ml-2">{a.action} (Responsible: {a.responsible}, Deadline: {a.deadline}, Status: {a.status})</span>)}</div>
            <div className="mb-2"><b>Incident Classification:</b> {Object.entries(viewModal.item.incident_classification).map(([k, v]) => <span key={k} className="ml-2"><b>{k.replace(/_/g, ' ')}:</b> {v}</span>)}</div>
            <div className="mb-2"><b>Client Communication:</b> {Object.entries(viewModal.item.client_communication).map(([k, v]) => <span key={k} className="ml-2"><b>{k.replace(/_/g, ' ')}:</b> {v}</span>)}</div>
            <div className="mb-2"><b>Approvals/Signatures:</b> {viewModal.item.approvals_signatures.map((a, i) => <span key={i} className="ml-2">{a.approval_type}: {a.name} ({a.date})</span>)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReportPage;
