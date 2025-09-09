import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, BookOpen, Award, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ConductedBy {
  trainer_name: string;
  designation: string;
}

interface AttendanceDetails {
  employee_name: string;
  employee_code: string;
  designation: string;
  shift: string;
  attendance: string;
  signature: string;
}

interface TrainingContent {
  module_topic: string;
  key_points_discussed: string;
  materials_used: string;
}

interface PhotosProof {
  description: string;
  file_name_or_link: string;
}

interface FeedbackSummary {
  employee_name: string;
  clarity_of_content: number;
  trainer_knowledge: number;
  usefulness: number;
  suggestions_comments: string;
}

interface TrainerEvaluation {
  employee_name: string;
  participation: string;
  understanding_level: string;
  improvement_area: string;
}

interface SignOff {
  trainer_name: string;
  signature: string;
  date: string;
  verified_by: string;
  remarks: string;
}

interface TrainingDetails {
  s_no: string;
  date_of_training: string;
  site_name: string;
  client_name: string;
  location: string;
  conducted_by: ConductedBy;
  department: string;
  training_topic: string;
  mode_of_training: string;
  duration_hrs: string;
}

interface TrainingRecord {
  id?: number;
  property_id: string;
  training_details: TrainingDetails;
  attendance_details: AttendanceDetails[];
  training_content: TrainingContent[];
  photos_proof: PhotosProof[];
  feedback_summary: FeedbackSummary[];
  trainer_evaluation: TrainerEvaluation[];
  sign_off: SignOff;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/training-details/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyTrainingRecord: TrainingRecord = {
  property_id: '',
  training_details: {
    s_no: '',
    date_of_training: '',
    site_name: '',
    client_name: '',
    location: '',
    conducted_by: {
      trainer_name: '',
      designation: ''
    },
    department: '',
    training_topic: '',
    mode_of_training: '',
    duration_hrs: ''
  },
  attendance_details: [],
  training_content: [],
  photos_proof: [],
  feedback_summary: [],
  trainer_evaluation: [],
  sign_off: {
    trainer_name: '',
    signature: '',
    date: '',
    verified_by: '',
    remarks: ''
  }
};

const TrainingReportPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: TrainingRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: TrainingRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: TrainingRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyTrainingRecord, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete training records');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this training record?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete training record');
      }
    }
  };

  const handleView = (record: TrainingRecord) => {
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
      setError('Failed to save training record');
    }
  };

  
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'in progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const addAttendanceRow = () => {
    if (!editModal.record) return;
    const newAttendance: AttendanceDetails = {
      employee_name: '',
      employee_code: '',
      designation: '',
      shift: '',
      attendance: '',
      signature: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_details: [...m.record!.attendance_details, newAttendance]
      }
    }));
  };

  const removeAttendanceRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_details: m.record!.attendance_details.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAttendanceRow = (index: number, field: keyof AttendanceDetails, value: string) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        attendance_details: m.record!.attendance_details.map((item, i) => 
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
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Reports</h1>
                <p className="text-gray-600">Manage and track training sessions across departments</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Training Report</span>
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
                <p className="text-sm font-medium text-gray-600">Total Trainings</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, record) => sum + record.attendance_details.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(data.map(item => item.training_details.department)).size}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(record => {
                    const trainingDate = new Date(record.training_details.date_of_training);
                    const now = new Date();
                    return trainingDate.getMonth() === now.getMonth() && 
                           trainingDate.getFullYear() === now.getFullYear();
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.training_details.s_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.training_details.date_of_training}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.training_details.site_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.training_details.training_topic}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.training_details.conducted_by.trainer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.training_details.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.training_details.duration_hrs} hrs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendance_details.length}</td>
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
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No training reports</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new training report.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Training Report Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Training Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>SL No:</b> {viewModal.record.training_details.s_no}</div>
                  <div><b>Date:</b> {viewModal.record.training_details.date_of_training}</div>
                  <div><b>Site:</b> {viewModal.record.training_details.site_name}</div>
                  <div><b>Client:</b> {viewModal.record.training_details.client_name}</div>
                  <div><b>Location:</b> {viewModal.record.training_details.location}</div>
                  <div><b>Department:</b> {viewModal.record.training_details.department}</div>
                  <div><b>Topic:</b> {viewModal.record.training_details.training_topic}</div>
                  <div><b>Mode:</b> {viewModal.record.training_details.mode_of_training}</div>
                  <div><b>Duration:</b> {viewModal.record.training_details.duration_hrs} hours</div>
                </div>
              </div>

              {/* Trainer Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Trainer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Name:</b> {viewModal.record.training_details.conducted_by.trainer_name}</div>
                  <div><b>Designation:</b> {viewModal.record.training_details.conducted_by.designation}</div>
                </div>
              </div>

              {/* Attendance Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.attendance_details.map((attendance, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendance.employee_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendance.employee_code}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendance.designation}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendance.shift}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{attendance.attendance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Training Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Content</h3>
                <div className="space-y-3">
                  {viewModal.record.training_content.map((content, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div><b>Module:</b> {content.module_topic}</div>
                      <div><b>Key Points:</b> {content.key_points_discussed}</div>
                      <div><b>Materials:</b> {content.materials_used}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign Off */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Trainer:</b> {viewModal.record.sign_off.trainer_name}</div>
                  <div><b>Date:</b> {viewModal.record.sign_off.date}</div>
                  <div><b>Verified By:</b> {viewModal.record.sign_off.verified_by}</div>
                  <div><b>Remarks:</b> {viewModal.record.sign_off.remarks}</div>
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
                {editModal.isNew ? 'Add New Training Report' : 'Edit Training Report'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Training Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SL No</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.s_no}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            s_no: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Training</label>
                    <input
                      type="date"
                      value={editModal.record.training_details.date_of_training}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            date_of_training: e.target.value
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
                      value={editModal.record.training_details.site_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            site_name: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.client_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            client_name: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.location}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            location: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.department}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            department: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Topic</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.training_topic}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            training_topic: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Training</label>
                    <select
                      value={editModal.record.training_details.mode_of_training}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            mode_of_training: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      
                      
                      
                      
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.duration_hrs}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            duration_hrs: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Trainer Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Trainer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Name</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.conducted_by.trainer_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            conducted_by: {
                              ...m.record!.training_details.conducted_by,
                              trainer_name: e.target.value
                            }
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editModal.record.training_details.conducted_by.designation}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          training_details: {
                            ...m.record!.training_details,
                            conducted_by: {
                              ...m.record!.training_details.conducted_by,
                              designation: e.target.value
                            }
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Details Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Details</h3>
                  <button
                    onClick={addAttendanceRow}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Row</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.attendance_details.map((attendance, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendance.employee_name}
                              onChange={e => updateAttendanceRow(index, 'employee_name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendance.employee_code}
                              onChange={e => updateAttendanceRow(index, 'employee_code', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendance.designation}
                              onChange={e => updateAttendanceRow(index, 'designation', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={attendance.shift}
                              onChange={e => updateAttendanceRow(index, 'shift', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              
                              
                              
                              
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={attendance.attendance}
                              onChange={e => updateAttendanceRow(index, 'attendance', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              
                              
                              
                              
                            </select>
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

              {/* Sign Off Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sign Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Name</label>
                    <input
                      type="text"
                      value={editModal.record.sign_off.trainer_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            trainer_name: e.target.value
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
                      value={editModal.record.sign_off.date}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            date: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verified By</label>
                    <input
                      type="text"
                      value={editModal.record.sign_off.verified_by}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            verified_by: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={editModal.record.sign_off.remarks}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            remarks: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
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

export default TrainingReportPage;
