import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, Shield, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ReportedBy {
  name: string;
  designation: string;
}

interface PatrollingDetails {
  s_no: string;
  date: string;
  site_name: string;
  client_name: string;
  location: string;
  shift_timing: string;
  reported_by: ReportedBy;
}

interface CheckpointLog {
  checkpoint_no: number;
  area_location_name: string;
  time_checked: string;
  checked_by: string;
  observations: string;
  status: string;
  action_taken: string;
}

interface PatrolRouteFrequency {
  route_covered: string;
  no_of_rounds_completed: number;
  time_of_each_round: string[];
  any_skipped_area: string;
  reason_if_skipped: string;
}

interface IncidentsObservations {
  time: string;
  location: string;
  description: string;
  severity: string;
  immediate_action_taken: string;
  escalated_to: string;
}

interface PhotoVideoEvidence {
  checkpoint_location: string;
  file_name_or_link: string;
  type: string;
  purpose: string;
}

interface ChecklistSummary {
  description: string;
  status: string;
  remarks: string;
}

interface SignOffPatrol {
  patrolling_guard_name: string;
  patrolling_guard_signature: string;
  supervisor_name: string;
  supervisor_signature: string;
  date_time_submission: string;
}

interface PatrollingRecord {
  id?: number;
  property_id: string;
  patrolling_details: PatrollingDetails;
  checkpoint_log: CheckpointLog[];
  patrol_route_frequency: PatrolRouteFrequency[];
  incidents_observations: IncidentsObservations[];
  photo_video_evidence: PhotoVideoEvidence[];
  checklist_summary: ChecklistSummary[];
  final_remarks: string;
  sign_off: SignOffPatrol;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/patrolling-details/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyPatrollingRecord: PatrollingRecord = {
  property_id: '',
  patrolling_details: {
    s_no: '',
    date: '',
    site_name: '',
    client_name: '',
    location: '',
    shift_timing: '',
    reported_by: { name: '', designation: '' }
  },
  checkpoint_log: [],
  patrol_route_frequency: [],
  incidents_observations: [],
  photo_video_evidence: [],
  checklist_summary: [],
  final_remarks: '',
  sign_off: {
    patrolling_guard_name: '',
    patrolling_guard_signature: '',
    supervisor_name: '',
    supervisor_signature: '',
    date_time_submission: ''
  }
};

const NightPatrollingPage: React.FC = () => {
  console.log('🚀 NightPatrolling: Component initialized');
  const { user } = useAuth();
  console.log('👤 NightPatrolling: User loaded', { userId: user?.userId });
  const [data, setData] = useState<PatrollingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: PatrollingRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: PatrollingRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: PatrollingRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyPatrollingRecord, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete patrolling records');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this patrolling record?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete patrolling record');
      }
    }
  };

  const handleView = (record: PatrollingRecord) => {
    setViewModal({ open: true, record });
  };

  const handleSave = async () => {
    if (!editModal.record) return;

    try {
      if (editModal.isNew) {
        await axios.post(API_URL, editModal.record);
      } else {
        await axios.put(`${API_URL}${editModal.record.id}`, editModal.record);
      }
      setEditModal({ open: false, record: null, isNew: false });
      fetchData();
    } catch (e) {
      setError('Failed to save patrolling record');
    }
  };

  
  };

  const addCheckpointRow = () => {
    if (!editModal.record) return;
    const newCheckpoint: CheckpointLog = {
      checkpoint_no: editModal.record.checkpoint_log.length + 1,
      area_location_name: '',
      time_checked: '',
      checked_by: '',
      observations: '',
      status: '',
      action_taken: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        checkpoint_log: [...m.record!.checkpoint_log, newCheckpoint]
      }
    }));
  };

  const removeCheckpointRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        checkpoint_log: m.record!.checkpoint_log.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCheckpointRow = (index: number, field: keyof CheckpointLog, value: string | number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        checkpoint_log: m.record!.checkpoint_log.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Night Patrolling Reports</h1>
                <p className="text-gray-600">Manage and track night patrolling activities and security rounds</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Patrolling Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
        {/* Property Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Property</h2>
          </div>
          <div className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
            {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patrols</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checkpoints</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, record) => sum + record.checkpoint_log.length, 0)}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incidents</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.reduce((sum, record) => sum + record.incidents_observations.length, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(record => {
                    const patrolDate = new Date(record.patrolling_details.date);
                    const now = new Date();
                    return patrolDate.getMonth() === now.getMonth() && 
                           patrolDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkpoints</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.patrolling_details.s_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.patrolling_details.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.patrolling_details.site_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.patrolling_details.shift_timing}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.patrolling_details.reported_by.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkpoint_log.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.incidents_observations.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id!)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.length === 0 && (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patrolling reports</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new patrolling report.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Patrolling Report Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Patrolling Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patrolling Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>SL No:</b> {viewModal.record.patrolling_details.s_no}</div>
                  <div><b>Date:</b> {viewModal.record.patrolling_details.date}</div>
                  <div><b>Site:</b> {viewModal.record.patrolling_details.site_name}</div>
                  <div><b>Client:</b> {viewModal.record.patrolling_details.client_name}</div>
                  <div><b>Location:</b> {viewModal.record.patrolling_details.location}</div>
                  <div><b>Shift:</b> {viewModal.record.patrolling_details.shift_timing}</div>
                </div>
              </div>

              {/* Reporter Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporter Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Name:</b> {viewModal.record.patrolling_details.reported_by.name}</div>
                  <div><b>Designation:</b> {viewModal.record.patrolling_details.reported_by.designation}</div>
                </div>
              </div>

              {/* Checkpoint Log */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Checkpoint Log</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Checkpoint</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Checked By</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.checkpoint_log.map((checkpoint, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{checkpoint.checkpoint_no}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{checkpoint.area_location_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{checkpoint.time_checked}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{checkpoint.checked_by}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{checkpoint.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incidents */}
              {viewModal.record.incidents_observations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Incidents & Observations</h3>
                  <div className="space-y-3">
                    {viewModal.record.incidents_observations.map((incident, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div><b>Time:</b> {incident.time}</div>
                        <div><b>Location:</b> {incident.location}</div>
                        <div><b>Description:</b> {incident.description}</div>
                        <div><b>Severity:</b> {incident.severity}</div>
                        <div><b>Action Taken:</b> {incident.immediate_action_taken}</div>
                        <div><b>Escalated To:</b> {incident.escalated_to}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Remarks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Final Remarks</h3>
                <p className="text-gray-700">{viewModal.record.final_remarks}</p>
              </div>

              {/* Sign Off */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Patrolling Guard:</b> {viewModal.record.sign_off.patrolling_guard_name}</div>
                  <div><b>Supervisor:</b> {viewModal.record.sign_off.supervisor_name}</div>
                  <div><b>Submission Time:</b> {viewModal.record.sign_off.date_time_submission}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editModal.isNew ? 'Add New Patrolling Report' : 'Edit Patrolling Report'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SL No</label>
                    <input
                      type="text"
                      value={editModal.record.patrolling_details.s_no}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          patrolling_details: {
                            ...m.record!.patrolling_details,
                            s_no: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editModal.record.patrolling_details.date}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          patrolling_details: {
                            ...m.record!.patrolling_details,
                            date: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      value={editModal.record.patrolling_details.site_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          patrolling_details: {
                            ...m.record!.patrolling_details,
                            site_name: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift Timing</label>
                    <input
                      type="text"
                      value={editModal.record.patrolling_details.shift_timing}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          patrolling_details: {
                            ...m.record!.patrolling_details,
                            shift_timing: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Checkpoint Log Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Checkpoint Log</h3>
                  <button
                    onClick={addCheckpointRow}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Checkpoint</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Checked By</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.checkpoint_log.map((checkpoint, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={checkpoint.checkpoint_no}
                              onChange={e => updateCheckpointRow(index, 'checkpoint_no', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={checkpoint.area_location_name}
                              onChange={e => updateCheckpointRow(index, 'area_location_name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="time"
                              value={checkpoint.time_checked}
                              onChange={e => updateCheckpointRow(index, 'time_checked', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={checkpoint.checked_by}
                              onChange={e => updateCheckpointRow(index, 'checked_by', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={checkpoint.status}
                              onChange={e => updateCheckpointRow(index, 'status', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              
                              
                              
                              
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeCheckpointRow(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Remarks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Final Remarks</h3>
                <textarea
                  value={editModal.record.final_remarks}
                  onChange={e => setEditModal(m => m && ({
                    ...m,
                    record: {
                      ...m.record!,
                      final_remarks: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter final remarks about the patrolling session..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NightPatrollingPage;
