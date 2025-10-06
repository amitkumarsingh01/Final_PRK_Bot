import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, AlertTriangle, Phone, Mail, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ClientDetails {
  client_name: string;
  site_name: string;
  location: string;
  service_type: string;
  prepared_by: string;
  date: string;
}

interface EscalationMatrix {
  escalation_level: string;
  name: string;
  designation: string;
  department: string;
  contact_number: string;
  email_id: string;
  response_time_max: string;
  availability: string;
  remarks: string;
}

interface EscalationGuidelines {
  issue_type: string;
  direct_escalation_level: string;
  expected_resolution_time: string;
  mode_of_escalation: string;
}

interface SignOffEscalation {
  prepared_by: string;
  verified_by: string;
  approved_by: string;
  date_of_approval: string;
}

interface EscalationRecord {
  id?: number;
  property_id: string;
  client_details: ClientDetails;
  escalation_matrix: EscalationMatrix[];
  escalation_guidelines: EscalationGuidelines[];
  sign_off: SignOffEscalation;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/escalation-matrix/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyEscalationRecord: EscalationRecord = {
  property_id: '',
  client_details: {
    client_name: '',
    site_name: '',
    location: '',
    service_type: '',
    prepared_by: '',
    date: ''
  },
  escalation_matrix: [],
  escalation_guidelines: [],
  sign_off: {
    prepared_by: '',
    verified_by: '',
    approved_by: '',
    date_of_approval: ''
  }
};

const EscalationMatrixPage: React.FC = () => {
  console.log('🚀 EscalationMatrix: Component initialized');
  const { user } = useAuth();
  console.log('👤 EscalationMatrix: User loaded', { userId: user?.userId });
  const [data, setData] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: EscalationRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: EscalationRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: EscalationRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyEscalationRecord, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete escalation matrix');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this escalation matrix?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete escalation matrix');
      }
    }
  };

  const handleView = (record: EscalationRecord) => {
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
      setError('Failed to save escalation matrix');
    }
  };

  
  };

  const addEscalationRow = () => {
    if (!editModal.record) return;
    const newEscalation: EscalationMatrix = {
      escalation_level: '',
      name: '',
      designation: '',
      department: '',
      contact_number: '',
      email_id: '',
      response_time_max: '',
      availability: '',
      remarks: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_matrix: [...m.record!.escalation_matrix, newEscalation]
      }
    }));
  };

  const removeEscalationRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_matrix: m.record!.escalation_matrix.filter((_, i) => i !== index)
      }
    }));
  };

  const updateEscalationRow = (index: number, field: keyof EscalationMatrix, value: string) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_matrix: m.record!.escalation_matrix.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addGuidelineRow = () => {
    if (!editModal.record) return;
    const newGuideline: EscalationGuidelines = {
      issue_type: '',
      direct_escalation_level: '',
      expected_resolution_time: '',
      mode_of_escalation: ''
    };
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_guidelines: [...m.record!.escalation_guidelines, newGuideline]
      }
    }));
  };

  const removeGuidelineRow = (index: number) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_guidelines: m.record!.escalation_guidelines.filter((_, i) => i !== index)
      }
    }));
  };

  const updateGuidelineRow = (index: number, field: keyof EscalationGuidelines, value: string) => {
    if (!editModal.record) return;
    setEditModal(m => m && ({
      ...m,
      record: {
        ...m.record!,
        escalation_guidelines: m.record!.escalation_guidelines.map((item, i) => 
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
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Escalation Matrix</h1>
                <p className="text-gray-600">Manage escalation procedures and contact hierarchy for incidents</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Escalation Matrix</span>
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
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <Building className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Escalation Levels</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, record) => sum + record.escalation_matrix.length, 0)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guidelines</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, record) => sum + record.escalation_guidelines.length, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Service Types</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(data.map(item => item.client_details.service_type)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Levels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guidelines</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prepared By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.client_details.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{record.client_details.site_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.client_details.service_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.escalation_matrix.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.escalation_guidelines.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.client_details.prepared_by}</td>
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
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No escalation matrix</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new escalation matrix.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Escalation Matrix Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Client Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Client:</b> {viewModal.record.client_details.client_name}</div>
                  <div><b>Site:</b> {viewModal.record.client_details.site_name}</div>
                  <div><b>Location:</b> {viewModal.record.client_details.location}</div>
                  <div><b>Service Type:</b> {viewModal.record.client_details.service_type}</div>
                  <div><b>Prepared By:</b> {viewModal.record.client_details.prepared_by}</div>
                  <div><b>Date:</b> {viewModal.record.client_details.date}</div>
                </div>
              </div>

              {/* Escalation Matrix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Escalation Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.escalation_matrix.map((escalation, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.escalation_level}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.designation}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.department}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div>{escalation.contact_number}</div>
                            <div className="text-xs text-gray-500">{escalation.email_id}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.response_time_max}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{escalation.availability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Escalation Guidelines */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Escalation Guidelines</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Escalation Level</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolution Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.escalation_guidelines.map((guideline, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{guideline.issue_type}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{guideline.direct_escalation_level}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{guideline.expected_resolution_time}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{guideline.mode_of_escalation}</td>
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
                  <div><b>Prepared By:</b> {viewModal.record.sign_off.prepared_by}</div>
                  <div><b>Verified By:</b> {viewModal.record.sign_off.verified_by}</div>
                  <div><b>Approved By:</b> {viewModal.record.sign_off.approved_by}</div>
                  <div><b>Date of Approval:</b> {viewModal.record.sign_off.date_of_approval}</div>
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
                {editModal.isNew ? 'Add New Escalation Matrix' : 'Edit Escalation Matrix'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Client Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={editModal.record.client_details.client_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            client_name: e.target.value
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
                      value={editModal.record.client_details.site_name}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            site_name: e.target.value
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
                      value={editModal.record.client_details.location}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            location: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                      value={editModal.record.client_details.service_type}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            service_type: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      
                      
                      
                      
                      
                      
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                    <input
                      type="text"
                      value={editModal.record.client_details.prepared_by}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            prepared_by: e.target.value
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
                      value={editModal.record.client_details.date}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          client_details: {
                            ...m.record!.client_details,
                            date: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Escalation Matrix Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Escalation Matrix</h3>
                  <button
                    onClick={addEscalationRow}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Level</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.escalation_matrix.map((escalation, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.escalation_level}
                              onChange={e => updateEscalationRow(index, 'escalation_level', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Level 1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.name}
                              onChange={e => updateEscalationRow(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="John Doe"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.designation}
                              onChange={e => updateEscalationRow(index, 'designation', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Manager"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.department}
                              onChange={e => updateEscalationRow(index, 'department', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Security"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.contact_number}
                              onChange={e => updateEscalationRow(index, 'contact_number', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="+91-9876543210"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="email"
                              value={escalation.email_id}
                              onChange={e => updateEscalationRow(index, 'email_id', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="john@example.com"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={escalation.response_time_max}
                              onChange={e => updateEscalationRow(index, 'response_time_max', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="2 hours"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeEscalationRow(index)}
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

              {/* Escalation Guidelines Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Escalation Guidelines</h3>
                  <button
                    onClick={addGuidelineRow}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Guideline</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Escalation Level</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resolution Time</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {editModal.record.escalation_guidelines.map((guideline, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={guideline.issue_type}
                              onChange={e => updateGuidelineRow(index, 'issue_type', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Minor Complaint"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={guideline.direct_escalation_level}
                              onChange={e => updateGuidelineRow(index, 'direct_escalation_level', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Level 1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={guideline.expected_resolution_time}
                              onChange={e => updateGuidelineRow(index, 'expected_resolution_time', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="4 hours"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={guideline.mode_of_escalation}
                              onChange={e => updateGuidelineRow(index, 'mode_of_escalation', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Call / WhatsApp"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeGuidelineRow(index)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                    <input
                      type="text"
                      value={editModal.record.sign_off.prepared_by}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            prepared_by: e.target.value
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                    <input
                      type="text"
                      value={editModal.record.sign_off.approved_by}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            approved_by: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Approval</label>
                    <input
                      type="date"
                      value={editModal.record.sign_off.date_of_approval}
                      onChange={e => setEditModal(m => m && ({
                        ...m,
                        record: {
                          ...m.record!,
                          sign_off: {
                            ...m.record!.sign_off,
                            date_of_approval: e.target.value
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

export default EscalationMatrixPage;
