import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface MeetingDetails {
  s_no: string;
  date_of_meeting: string;
  time: string;
  venue_mode: string;
  conducted_by: string;
  client_department_project: string;
}

interface AttendanceList {
  name: string;
  designation: string;
  department: string;
  email_contact: string;
  signature: string;
}

interface Agenda {
  agenda_point_no: number;
  topic_description: string;
  lead_person: string;
  time_allocated_min: number;
}

interface DiscussionPoints {
  topic_agenda: string;
  discussion_summary: string;
  decision_taken: string;
  responsible_person: string;
  deadline: string;
}

interface ActionItems {
  action_point_no: number;
  action_item: string;
  assigned_to: string;
  priority: string;
  target_completion_date: string;
  remarks_status: string;
}

interface DocumentsShared {
  document_name: string;
  type: string;
  shared_by: string;
  remarks_purpose: string;
}

interface ClientComments {
  name: string;
  comments_suggestions: string;
}

interface PreparedBy {
  name: string;
  designation: string;
  signature: string;
  date: string;
}

interface ApprovedBy {
  name: string;
  designation: string;
  signature: string;
  date: string;
}

interface SignOffMeeting {
  prepared_by: PreparedBy;
  approved_by: ApprovedBy;
}

interface MeetingRecord {
  id?: number;
  property_id: string;
  meeting_details: MeetingDetails;
  attendance_list: AttendanceList[];
  agenda: Agenda[];
  discussion_points: DiscussionPoints[];
  action_items: ActionItems[];
  documents_shared: DocumentsShared[];
  client_comments: ClientComments[];
  sign_off: SignOffMeeting;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/meeting-details/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyMeetingRecord: MeetingRecord = {
  property_id: '',
  meeting_details: {
    s_no: '',
    date_of_meeting: '',
    time: '',
    venue_mode: '',
    conducted_by: '',
    client_department_project: ''
  },
  attendance_list: [],
  agenda: [],
  discussion_points: [],
  action_items: [],
  documents_shared: [],
  client_comments: [],
  sign_off: {
    prepared_by: { name: '', designation: '', signature: '', date: '' },
    approved_by: { name: '', designation: '', signature: '', date: '' }
  }
};

const MinutesofMeetingPage: React.FC = () => {
  console.log('🚀 MinutesofMeeting: Component initialized');
  const { user } = useAuth();
  console.log('👤 MinutesofMeeting: User loaded', { userId: user?.userId });
  const [data, setData] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: MeetingRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: MeetingRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: MeetingRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyMeetingRecord, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete meeting records');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this meeting record?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete meeting record');
      }
    }
  };

  const handleView = (record: MeetingRecord) => {
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
      setError('Failed to save meeting record');
    }
  };

  
  };

  const addAttendanceRow = () => {
    if (!editModal.record) return;
    const newAttendance: AttendanceList = {
      name: '',
      designation: '',
      department: '',
      email_contact: '',
      signature: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_list: [...m.record!.attendance_list, newAttendance]
      }
    }));
  };

  const removeAttendanceRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_list: m.record!.attendance_list.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAttendanceRow = (index: number, field: keyof AttendanceList, value: string) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_list: m.record!.attendance_list.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addAgendaRow = () => {
    if (!editModal.record) return;
    const newAgenda: Agenda = {
      agenda_point_no: editModal.record.agenda.length + 1,
      topic_description: '',
      lead_person: '',
      time_allocated_min: 0
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        agenda: [...m.record!.agenda, newAgenda]
      }
    }));
  };

  const removeAgendaRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        agenda: m.record!.agenda.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAgendaRow = (index: number, field: keyof Agenda, value: string | number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        agenda: m.record!.agenda.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addActionItemRow = () => {
    if (!editModal.record) return;
    const newActionItem: ActionItems = {
      action_point_no: editModal.record.action_items.length + 1,
      action_item: '',
      assigned_to: '',
      priority: '',
      target_completion_date: '',
      remarks_status: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        action_items: [...m.record!.action_items, newActionItem]
      }
    }));
  };

  const removeActionItemRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        action_items: m.record!.action_items.filter((_, i) => i !== index)
      }
    }));
  };

  const updateActionItemRow = (index: number, field: keyof ActionItems, value: string | number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        action_items: m.record!.action_items.map((item, i) => 
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
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Minutes of Meeting</h1>
                <p className="text-gray-600">Manage meeting minutes, agendas, and action items</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Meeting Minutes</span>
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
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendees</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, record) => sum + record.attendance_list.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Items</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, record) => sum + record.action_items.length, 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(record => {
                    const meetingDate = new Date(record.meeting_details.date_of_meeting);
                    const now = new Date();
                    return meetingDate.getMonth() === now.getMonth() && 
                           meetingDate.getFullYear() === now.getFullYear();
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue/Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conducted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.meeting_details.s_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.meeting_details.date_of_meeting}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.meeting_details.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.meeting_details.venue_mode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.meeting_details.conducted_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendance_list.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.action_items.length}</td>
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
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No meeting minutes</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new meeting minutes record.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Meeting Minutes Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Meeting Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Meeting Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>SL No:</b> {viewModal.record.meeting_details.s_no}</div>
                  <div><b>Date:</b> {viewModal.record.meeting_details.date_of_meeting}</div>
                  <div><b>Time:</b> {viewModal.record.meeting_details.time}</div>
                  <div><b>Venue/Mode:</b> {viewModal.record.meeting_details.venue_mode}</div>
                  <div><b>Conducted By:</b> {viewModal.record.meeting_details.conducted_by}</div>
                  <div><b>Project:</b> {viewModal.record.meeting_details.client_department_project}</div>
                </div>
              </div>

              {/* Attendance List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance List</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.attendance_list.map((attendee, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendee.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendee.designation}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendee.department}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendee.email_contact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agenda */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Agenda</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Point</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lead Person</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time (min)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.agenda.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.agenda_point_no}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.topic_description}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.lead_person}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.time_allocated_min}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Point</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.action_items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.action_point_no}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.action_item}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.assigned_to}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.priority}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.target_completion_date}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.remarks_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sign Off */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Prepared By:</b> {viewModal.record.sign_off.prepared_by.name} ({viewModal.record.sign_off.prepared_by.designation})</div>
                  <div><b>Approved By:</b> {viewModal.record.sign_off.approved_by.name} ({viewModal.record.sign_off.approved_by.designation})</div>
                  <div><b>Prepared Date:</b> {viewModal.record.sign_off.prepared_by.date}</div>
                  <div><b>Approved Date:</b> {viewModal.record.sign_off.approved_by.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editModal.isNew ? 'Add New Meeting Minutes' : 'Edit Meeting Minutes'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Meeting Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Meeting Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SL No</label>
                    <input
                      type="text"
                      value={editModal.record.meeting_details.s_no}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            s_no: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Meeting</label>
                    <input
                      type="date"
                      value={editModal.record.meeting_details.date_of_meeting}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            date_of_meeting: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="text"
                      value={editModal.record.meeting_details.time}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            time: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="15:00 - 16:30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue/Mode</label>
                    <input
                      type="text"
                      value={editModal.record.meeting_details.venue_mode}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            venue_mode: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Online (Zoom)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conducted By</label>
                    <input
                      type="text"
                      value={editModal.record.meeting_details.conducted_by}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            conducted_by: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client/Department/Project</label>
                    <input
                      type="text"
                      value={editModal.record.meeting_details.client_department_project}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          meeting_details: {
                            ...m.record!.meeting_details,
                            client_department_project: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance List Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance List</h3>
                  <button
                    onClick={addAttendanceRow}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Attendee</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.attendance_list.map((attendee, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.name}
                              onChange={e => updateAttendanceRow(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="John Doe"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.designation}
                              onChange={e => updateAttendanceRow(index, 'designation', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Manager"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.department}
                              onChange={e => updateAttendanceRow(index, 'department', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Security"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.email_contact}
                              onChange={e => updateAttendanceRow(index, 'email_contact', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="john@example.com"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeAttendanceRow(index)}
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

              {/* Action Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
                  <button
                    onClick={addActionItemRow}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Action Item</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Point</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.action_items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.action_point_no}
                              onChange={e => updateActionItemRow(index, 'action_point_no', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.action_item}
                              onChange={e => updateActionItemRow(index, 'action_item', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Action description"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.assigned_to}
                              onChange={e => updateActionItemRow(index, 'assigned_to', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Person name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.priority}
                              onChange={e => updateActionItemRow(index, 'priority', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              
                              
                              
                              
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={item.target_completion_date}
                              onChange={e => updateActionItemRow(index, 'target_completion_date', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeActionItemRow(index)}
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

export default MinutesofMeetingPage;
