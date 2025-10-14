import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface TemporaryStructureInstallationPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  site_location_of_installation: string;
  nature_of_temporary_structure: string;
  contractor_agency_name: string;
  contact_details_contractor: string;
  supervisor_name_on_site: string;
  contact_details_supervisor: string;
  number_of_workers_involved: number;
  type_of_temporary_structure: string;
  number_of_units: number;
  total_area_covered_sqm: number;
  height_of_structure_meters: number;
  foundation_type: string;
  foundation_analysis_done: string;
  structural_engineering_approval: string;
  wind_load_calculations: string;
  seismic_considerations: string;
  fire_safety_measures: string;
  emergency_exits_planned: string;
  utilities_connection_plan: string;
  electrical_installation_plan: string;
  water_supply_connection: string;
  sewage_disposal_arrangement: string;
  access_roads_planned: string;
  parking_arrangement: string;
  security_measures: string;
  lighting_arrangement: string;
  first_aid_facility: string;
  emergency_contact_details: string;
  work_authorization_by: string;
  pre_work_site_inspection_done: string;
  signature_of_supervisor: string;
  signature_of_safety_officer: string;
  signature_of_contractor: string;
  installation_completion_time: string;
  post_installation_inspection_done_by: string;
  final_clearance_given: string;
  structure_handover_verified: string;
  remarks_or_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/temporary-structure-installation-permit/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyTemporaryStructurePermit: TemporaryStructureInstallationPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  site_location_of_installation: '',
  nature_of_temporary_structure: '',
  contractor_agency_name: '',
  contact_details_contractor: '',
  supervisor_name_on_site: '',
  contact_details_supervisor: '',
  number_of_workers_involved: 0,
  type_of_temporary_structure: '',
  number_of_units: 0,
  total_area_covered_sqm: 0,
  height_of_structure_meters: 0,
  foundation_type: '',
  foundation_analysis_done: '',
  structural_engineering_approval: '',
  wind_load_calculations: '',
  seismic_considerations: '',
  fire_safety_measures: '',
  emergency_exits_planned: '',
  utilities_connection_plan: '',
  electrical_installation_plan: '',
  water_supply_connection: '',
  sewage_disposal_arrangement: '',
  access_roads_planned: '',
  parking_arrangement: '',
  security_measures: '',
  lighting_arrangement: '',
  first_aid_facility: '',
  emergency_contact_details: '',
  work_authorization_by: '',
  pre_work_site_inspection_done: '',
  signature_of_supervisor: '',
  signature_of_safety_officer: '',
  signature_of_contractor: '',
  installation_completion_time: '',
  post_installation_inspection_done_by: '',
  final_clearance_given: '',
  structure_handover_verified: '',
  remarks_or_observations: ''
};

const TemporaryStructurePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TemporaryStructureInstallationPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: TemporaryStructureInstallationPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: TemporaryStructureInstallationPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

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
      setError(null); // Clear any previous errors
      const res = await axios.get(`${API_URL}property/${propertyId}/`);
      setData(res.data);
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Failed to fetch temporary structure permits');
      setData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (record: TemporaryStructureInstallationPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyTemporaryStructurePermit, property_id: selectedPropertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete temporary structure permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this temporary structure permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}/`);
        fetchData(selectedPropertyId);
        setError(null); // Clear any previous errors
      } catch (e) {
        console.error('Delete error:', e);
        setError('Failed to delete temporary structure permit');
      }
    }
  };

  const handleView = (record: TemporaryStructureInstallationPermit) => {
    setViewModal({ open: true, record });
  };

  const handleSave = async () => {
    if (!editModal.record) return;

    try {
      if (editModal.isNew) {
        await axios.post(API_URL, editModal.record);
      } else {
        await axios.put(`${API_URL}${editModal.record.id}/`, editModal.record);
      }
      setEditModal({ open: false, record: null, isNew: false });
      fetchData(selectedPropertyId);
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error('Save error:', e);
      setError('Failed to save temporary structure permit');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const isPermitActive = (permit: TemporaryStructureInstallationPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: TemporaryStructureInstallationPermit) => {
    if (permit.final_clearance_given === 'Yes') return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
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
                <Home className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Temporary Structure Permits</h1>
                <p className="text-gray-600">Manage temporary structure installation permits and safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Structure Permit</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
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
                <p className="text-sm font-medium text-gray-600">Total Permits</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Permits</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.filter(permit => isPermitActive(permit)).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, permit) => sum + permit.number_of_workers_involved, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(permit => {
                    const issueDate = new Date(permit.date_of_issue);
                    const now = new Date();
                    return issueDate.getMonth() === now.getMonth() && 
                           issueDate.getFullYear() === now.getFullYear();
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permit No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.permit_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.date_of_issue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.permit_valid_from}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.permit_valid_to}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_installation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.type_of_temporary_structure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_workers_involved}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getPermitStatus(permit) === 'Active' ? 'bg-green-100 text-green-800' :
                        getPermitStatus(permit) === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getPermitStatus(permit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(permit)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(permit)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(permit.id!)}
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
              <Home className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No temporary structure permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new structure permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Temporary Structure Permit Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Permit Number:</b> {viewModal.record.permit_number}</div>
                  <div><b>Issue Date:</b> {viewModal.record.date_of_issue}</div>
                  <div><b>Valid From:</b> {viewModal.record.permit_valid_from}</div>
                  <div><b>Valid To:</b> {viewModal.record.permit_valid_to}</div>
                  <div><b>Installation Location:</b> {viewModal.record.site_location_of_installation}</div>
                  <div><b>Nature of Structure:</b> {viewModal.record.nature_of_temporary_structure}</div>
                  <div><b>Structure Type:</b> {viewModal.record.type_of_temporary_structure}</div>
                  <div><b>Number of Units:</b> {viewModal.record.number_of_units}</div>
                  <div><b>Total Area:</b> {viewModal.record.total_area_covered_sqm} sqm</div>
                  <div><b>Height:</b> {viewModal.record.height_of_structure_meters} meters</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Contractor:</b> {viewModal.record.contractor_agency_name}</div>
                  <div><b>Contact:</b> {viewModal.record.contact_details_contractor}</div>
                  <div><b>Supervisor:</b> {viewModal.record.supervisor_name_on_site}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.contact_details_supervisor}</div>
                  <div><b>Number of Workers:</b> {viewModal.record.number_of_workers_involved}</div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Foundation Type:</b> {viewModal.record.foundation_type}</div>
                  <div><b>Foundation Analysis:</b> {viewModal.record.foundation_analysis_done}</div>
                  <div><b>Structural Approval:</b> {viewModal.record.structural_engineering_approval}</div>
                  <div><b>Wind Load Calculations:</b> {viewModal.record.wind_load_calculations}</div>
                  <div><b>Seismic Considerations:</b> {viewModal.record.seismic_considerations}</div>
                </div>
              </div>

              {/* Safety & Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Fire Safety Measures:</b> {viewModal.record.fire_safety_measures}</div>
                  <div><b>Emergency Exits:</b> {viewModal.record.emergency_exits_planned}</div>
                  <div><b>First Aid Facility:</b> {viewModal.record.first_aid_facility}</div>
                  <div><b>Emergency Contacts:</b> {viewModal.record.emergency_contact_details}</div>
                  <div><b>Security Measures:</b> {viewModal.record.security_measures}</div>
                  <div><b>Lighting Arrangement:</b> {viewModal.record.lighting_arrangement}</div>
                </div>
              </div>

              {/* Utilities & Infrastructure */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Utilities & Infrastructure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Utilities Connection:</b> {viewModal.record.utilities_connection_plan}</div>
                  <div><b>Electrical Installation:</b> {viewModal.record.electrical_installation_plan}</div>
                  <div><b>Water Supply:</b> {viewModal.record.water_supply_connection}</div>
                  <div><b>Sewage Disposal:</b> {viewModal.record.sewage_disposal_arrangement}</div>
                  <div><b>Access Roads:</b> {viewModal.record.access_roads_planned}</div>
                  <div><b>Parking Arrangement:</b> {viewModal.record.parking_arrangement}</div>
                </div>
              </div>

              {/* Installation Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Installation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Pre-work Inspection:</b> {viewModal.record.pre_work_site_inspection_done}</div>
                  <div><b>Work Authorization:</b> {viewModal.record.work_authorization_by}</div>
                  <div><b>Installation Completion:</b> {viewModal.record.installation_completion_time}</div>
                  <div><b>Post-installation Inspection:</b> {viewModal.record.post_installation_inspection_done_by}</div>
                  <div><b>Final Clearance:</b> {viewModal.record.final_clearance_given}</div>
                  <div><b>Handover Verified:</b> {viewModal.record.structure_handover_verified}</div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><b>Supervisor:</b> {viewModal.record.signature_of_supervisor}</div>
                  <div><b>Safety Officer:</b> {viewModal.record.signature_of_safety_officer}</div>
                  <div><b>Contractor:</b> {viewModal.record.signature_of_contractor}</div>
                </div>
              </div>

              {/* Remarks */}
              {viewModal.record.remarks_or_observations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks & Observations</h3>
                  <p className="text-gray-700">{viewModal.record.remarks_or_observations}</p>
                </div>
              )}
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
                {editModal.isNew ? 'Add New Temporary Structure Permit' : 'Edit Temporary Structure Permit'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permit Number</label>
                    <input
                      type="text"
                      value={editModal.record.permit_number}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_number: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={editModal.record.date_of_issue}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, date_of_issue: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={editModal.record.permit_valid_from}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_valid_from: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                    <input
                      type="date"
                      value={editModal.record.permit_valid_to}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_valid_to: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Installation Location</label>
                    <input
                      type="text"
                      value={editModal.record.site_location_of_installation}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, site_location_of_installation: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Structure</label>
                    <input
                      type="text"
                      value={editModal.record.nature_of_temporary_structure}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, nature_of_temporary_structure: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structure Type</label>
                    <input
                      type="text"
                      value={editModal.record.type_of_temporary_structure}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, type_of_temporary_structure: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Units</label>
                    <input
                      type="number"
                      value={editModal.record.number_of_units}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, number_of_units: parseInt(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Area (sqm)</label>
                    <input
                      type="number"
                      value={editModal.record.total_area_covered_sqm}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, total_area_covered_sqm: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (meters)</label>
                    <input
                      type="number"
                      value={editModal.record.height_of_structure_meters}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, height_of_structure_meters: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name</label>
                    <input
                      type="text"
                      value={editModal.record.contractor_agency_name}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contractor_agency_name: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Contact</label>
                    <input
                      type="text"
                      value={editModal.record.contact_details_contractor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contact_details_contractor: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                    <input
                      type="text"
                      value={editModal.record.supervisor_name_on_site}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, supervisor_name_on_site: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Contact</label>
                    <input
                      type="text"
                      value={editModal.record.contact_details_supervisor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contact_details_supervisor: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                    <input
                      type="number"
                      value={editModal.record.number_of_workers_involved}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, number_of_workers_involved: parseInt(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foundation Type</label>
                    <select
                      value={editModal.record.foundation_type}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, foundation_type: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Foundation Type</option>
                      <option value="Concrete">Concrete</option>
                      <option value="Steel">Steel</option>
                      <option value="Wood">Wood</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foundation Analysis Done</label>
                    <select
                      value={editModal.record.foundation_analysis_done}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, foundation_analysis_done: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structural Engineering Approval</label>
                    <select
                      value={editModal.record.structural_engineering_approval}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, structural_engineering_approval: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wind Load Calculations</label>
                    <select
                      value={editModal.record.wind_load_calculations}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, wind_load_calculations: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seismic Considerations</label>
                    <select
                      value={editModal.record.seismic_considerations}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, seismic_considerations: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Safety & Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fire Safety Measures</label>
                    <select
                      value={editModal.record.fire_safety_measures}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, fire_safety_measures: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Exits Planned</label>
                    <select
                      value={editModal.record.emergency_exits_planned}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, emergency_exits_planned: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Aid Facility</label>
                    <select
                      value={editModal.record.first_aid_facility}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, first_aid_facility: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Details</label>
                    <input
                      type="text"
                      value={editModal.record.emergency_contact_details}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, emergency_contact_details: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Security Measures</label>
                    <select
                      value={editModal.record.security_measures}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, security_measures: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lighting Arrangement</label>
                    <select
                      value={editModal.record.lighting_arrangement}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, lighting_arrangement: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Utilities & Infrastructure */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Utilities & Infrastructure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Utilities Connection Plan</label>
                    <select
                      value={editModal.record.utilities_connection_plan}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, utilities_connection_plan: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Electrical Installation Plan</label>
                    <select
                      value={editModal.record.electrical_installation_plan}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, electrical_installation_plan: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Supply Connection</label>
                    <select
                      value={editModal.record.water_supply_connection}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, water_supply_connection: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sewage Disposal Arrangement</label>
                    <select
                      value={editModal.record.sewage_disposal_arrangement}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, sewage_disposal_arrangement: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Roads Planned</label>
                    <select
                      value={editModal.record.access_roads_planned}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, access_roads_planned: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parking Arrangement</label>
                    <select
                      value={editModal.record.parking_arrangement}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, parking_arrangement: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Installation Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Installation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pre-work Site Inspection Done</label>
                    <select
                      value={editModal.record.pre_work_site_inspection_done}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, pre_work_site_inspection_done: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Authorization By</label>
                    <input
                      type="text"
                      value={editModal.record.work_authorization_by}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, work_authorization_by: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Installation Completion Time</label>
                    <input
                      type="datetime-local"
                      value={editModal.record.installation_completion_time}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, installation_completion_time: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post-installation Inspection Done By</label>
                    <input
                      type="text"
                      value={editModal.record.post_installation_inspection_done_by}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, post_installation_inspection_done_by: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Clearance Given</label>
                    <select
                      value={editModal.record.final_clearance_given}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, final_clearance_given: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structure Handover Verified</label>
                    <select
                      value={editModal.record.structure_handover_verified}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, structure_handover_verified: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_supervisor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, signature_of_supervisor: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Safety Officer Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_safety_officer}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, signature_of_safety_officer: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_contractor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, signature_of_contractor: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks & Observations</h3>
                <textarea
                  value={editModal.record.remarks_or_observations}
                  onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, remarks_or_observations: e.target.value } })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter any remarks or observations..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{editModal.isNew ? 'Create Permit' : 'Update Permit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporaryStructurePage;
