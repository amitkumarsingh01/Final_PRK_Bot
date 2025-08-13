import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, MapPin, Clock, Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VisitedBy {
  name: string;
  designation: string;
}

interface SiteVisitDetails {
  s_no: string;
  date_of_visit: string;
  site_name: string;
  client_name: string;
  location: string;
  visited_by: VisitedBy;
  visit_purpose: string;
  time_in: string;
  time_out: string;
  duration_hrs: number;
}

interface ObservationInteractionSummary {
  department_visited: string;
  staff_met: string;
  observation_summary: string;
  compliance_with_sop: string;
  remarks_issues_found: string;
  corrective_action_required: string;
}

interface ChecklistReview {
  checklist_item: string;
  status: string;
  remarks: string;
}

interface PhotosCaptured {
  location_area: string;
  photo_description: string;
  photo_file_link: string;
}

interface FollowUpActionPlan {
  issue_observed: string;
  assigned_to: string;
  target_completion_date: string;
  status_update: string;
}

interface FinalCommentsSummary {
  team_observations: string;
  client_feedback: string;
  suggestions_recommendations: string;
}

interface ReportedBy {
  name: string;
  designation: string;
  signature: string;
  date: string;
}

interface SignOffSiteVisit {
  reported_by: ReportedBy;
}

interface SiteVisitRecord {
  id?: number;
  property_id: string;
  site_visit_details: SiteVisitDetails;
  observation_interaction_summary: ObservationInteractionSummary[];
  checklist_review: ChecklistReview[];
  photos_captured: PhotosCaptured[];
  follow_up_action_plan: FollowUpActionPlan[];
  final_comments_summary: FinalCommentsSummary;
  sign_off: SignOffSiteVisit;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/site-visit-details/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptySiteVisitRecord: SiteVisitRecord = {
  property_id: '',
  site_visit_details: {
    s_no: '',
    date_of_visit: '',
    site_name: '',
    client_name: '',
    location: '',
    visited_by: { name: '', designation: '' },
    visit_purpose: '',
    time_in: '',
    time_out: '',
    duration_hrs: 0
  },
  observation_interaction_summary: [],
  checklist_review: [],
  photos_captured: [],
  follow_up_action_plan: [],
  final_comments_summary: {
    team_observations: '',
    client_feedback: '',
    suggestions_recommendations: ''
  },
  sign_off: {
    reported_by: { name: '', designation: '', signature: '', date: '' }
  }
};

const SiteVisitPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SiteVisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: SiteVisitRecord | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: SiteVisitRecord | null; isNew: boolean }>({ open: false, record: null, isNew: false });

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
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}property/${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch site visit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (record: SiteVisitRecord) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptySiteVisitRecord, property_id: selectedPropertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete site visit records');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this site visit record?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData(selectedPropertyId);
      } catch (e) {
        setError('Failed to delete site visit record');
      }
    }
  };

  const handleView = (record: SiteVisitRecord) => {
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
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save site visit record');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
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
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Site Visit Reports</h1>
                <p className="text-gray-600">Manage site visit reports and compliance checks</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Site Visit</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Select Property</h2>
            </div>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(data.flatMap(record => 
                    record.observation_interaction_summary.map(obs => obs.department_visited)
                  )).size}
                </p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Items</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, record) => sum + record.follow_up_action_plan.length, 0)}
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
                    const visitDate = new Date(record.site_visit_details.date_of_visit);
                    const now = new Date();
                    return visitDate.getMonth() === now.getMonth() && 
                           visitDate.getFullYear() === now.getFullYear();
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.s_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.date_of_visit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.site_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.visited_by.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_visit_details.duration_hrs} hrs</td>
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
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No site visit reports</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new site visit report.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Site Visit Report Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Site Visit Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Visit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>SL No:</b> {viewModal.record.site_visit_details.s_no}</div>
                  <div><b>Date:</b> {viewModal.record.site_visit_details.date_of_visit}</div>
                  <div><b>Site Name:</b> {viewModal.record.site_visit_details.site_name}</div>
                  <div><b>Client:</b> {viewModal.record.site_visit_details.client_name}</div>
                  <div><b>Location:</b> {viewModal.record.site_visit_details.location}</div>
                  <div><b>Purpose:</b> {viewModal.record.site_visit_details.visit_purpose}</div>
                  <div><b>Time In:</b> {viewModal.record.site_visit_details.time_in}</div>
                  <div><b>Time Out:</b> {viewModal.record.site_visit_details.time_out}</div>
                  <div><b>Duration:</b> {viewModal.record.site_visit_details.duration_hrs} hours</div>
                  <div><b>Visitor:</b> {viewModal.record.site_visit_details.visited_by.name} ({viewModal.record.site_visit_details.visited_by.designation})</div>
                </div>
              </div>

              {/* Observations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Observations & Interactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff Met</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.observation_interaction_summary.map((obs, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.department_visited}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.staff_met}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.observation_summary}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.compliance_with_sop}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.remarks_issues_found}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{obs.corrective_action_required}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Plan */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow-up Action Plan</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.follow_up_action_plan.map((action, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{action.issue_observed}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{action.assigned_to}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{action.target_completion_date}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{action.status_update}</td>
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
                  <div><b>Reported By:</b> {viewModal.record.sign_off.reported_by.name} ({viewModal.record.sign_off.reported_by.designation})</div>
                  <div><b>Date:</b> {viewModal.record.sign_off.reported_by.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteVisitPage;
