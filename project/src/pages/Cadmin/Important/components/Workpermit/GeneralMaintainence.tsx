import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext'; 

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface GeneralMaintenancePermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_until: string;
  requesting_department_or_resident_name: string;
  contact_number: string;
  apartment_block_building: string;
  nature_of_work: string;
  detailed_description_of_work: string;
  location_of_work: string;
  contractor_or_maintenance_agency_name: string;
  contractor_contact_person: string;
  contractor_contact_number: string;
  no_of_workers_involved: number;
  workers_id_proof_submitted: string;
  list_of_tools_equipment_used: string[];
  electrical_isolation_required: string;
  water_supply_shutdown_required: string;
  ppe_required: string;
  safety_briefing_given: string;
  material_movement_permission_required: string;
  precautionary_measures_taken: string;
  waste_disposal_method: string;
  work_start_date_time: string;
  expected_work_completion_date_time: string;
  supervisor_or_facility_in_charge_name: string;
  supervisor_signature: string;
  security_informed: string;
  security_personnel_name_signature: string;
  final_inspection_done: string;
  final_inspection_done_by: string;
  clearance_given: string;
  remarks_observations: string;
  signature_of_requester: string;
  signature_of_approving_authority: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/general-maintenance-permit/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyGeneralMaintenancePermit: GeneralMaintenancePermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_until: '',
  requesting_department_or_resident_name: '',
  contact_number: '',
  apartment_block_building: '',
  nature_of_work: '',
  detailed_description_of_work: '',
  location_of_work: '',
  contractor_or_maintenance_agency_name: '',
  contractor_contact_person: '',
  contractor_contact_number: '',
  no_of_workers_involved: 0,
  workers_id_proof_submitted: '',
  list_of_tools_equipment_used: [],
  electrical_isolation_required: '',
  water_supply_shutdown_required: '',
  ppe_required: '',
  safety_briefing_given: '',
  material_movement_permission_required: '',
  precautionary_measures_taken: '',
  waste_disposal_method: '',
  work_start_date_time: '',
  expected_work_completion_date_time: '',
  supervisor_or_facility_in_charge_name: '',
  supervisor_signature: '',
  security_informed: '',
  security_personnel_name_signature: '',
  final_inspection_done: '',
  final_inspection_done_by: '',
  clearance_given: '',
  remarks_observations: '',
  signature_of_requester: '',
  signature_of_approving_authority: ''
};

const GeneralMaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GeneralMaintenancePermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: GeneralMaintenancePermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: GeneralMaintenancePermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

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
      setError('Failed to fetch general maintenance permits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (record: GeneralMaintenancePermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyGeneralMaintenancePermit, property_id: selectedPropertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete general maintenance permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this general maintenance permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData(selectedPropertyId);
      } catch (e) {
        setError('Failed to delete general maintenance permit');
      }
    }
  };

  const handleView = (record: GeneralMaintenancePermit) => {
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
      setError('Failed to save general maintenance permit');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const isPermitActive = (permit: GeneralMaintenancePermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validUntil = new Date(permit.permit_valid_until);
    return now >= validFrom && now <= validUntil;
  };

  const getPermitStatus = (permit: GeneralMaintenancePermit) => {
    if (permit.clearance_given === 'Yes') return 'Completed';
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
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">General Maintenance Permits</h1>
                <p className="text-gray-600">Manage general maintenance permits and facility upkeep</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Maintenance Permit</span>
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
                  {data.reduce((sum, permit) => sum + permit.no_of_workers_involved, 0)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature of Work</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.permit_valid_until}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{permit.requesting_department_or_resident_name}</div>
                        <div className="text-gray-500">{permit.apartment_block_building}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.nature_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.no_of_workers_involved}</td>
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
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No general maintenance permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new maintenance permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">General Maintenance Permit Details</h2>
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
                  <div><b>Valid Until:</b> {viewModal.record.permit_valid_until}</div>
                </div>
              </div>

              {/* Requester Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Requester Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Requester:</b> {viewModal.record.requesting_department_or_resident_name}</div>
                  <div><b>Contact Number:</b> {viewModal.record.contact_number}</div>
                  <div><b>Apartment/Block/Building:</b> {viewModal.record.apartment_block_building}</div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_work}</div>
                  <div><b>Location of Work:</b> {viewModal.record.location_of_work}</div>
                  <div><b>Work Start Date/Time:</b> {viewModal.record.work_start_date_time}</div>
                  <div><b>Expected Completion:</b> {viewModal.record.expected_work_completion_date_time}</div>
                </div>
                <div className="mt-3">
                  <b>Detailed Description:</b>
                  <p className="text-gray-700 mt-1">{viewModal.record.detailed_description_of_work}</p>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Contractor Agency:</b> {viewModal.record.contractor_or_maintenance_agency_name}</div>
                  <div><b>Contact Person:</b> {viewModal.record.contractor_contact_person}</div>
                  <div><b>Contact Number:</b> {viewModal.record.contractor_contact_number}</div>
                  <div><b>Number of Workers:</b> {viewModal.record.no_of_workers_involved}</div>
                </div>
              </div>

              {/* Tools and Equipment */}
              {viewModal.record.list_of_tools_equipment_used && viewModal.record.list_of_tools_equipment_used.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tools and Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.list_of_tools_equipment_used.map((tool, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Requirements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Electrical Isolation Required:</b> {viewModal.record.electrical_isolation_required}</div>
                  <div><b>Water Supply Shutdown Required:</b> {viewModal.record.water_supply_shutdown_required}</div>
                  <div><b>PPE Required:</b> {viewModal.record.ppe_required}</div>
                  <div><b>Safety Briefing Given:</b> {viewModal.record.safety_briefing_given}</div>
                  <div><b>Workers ID Proof Submitted:</b> {viewModal.record.workers_id_proof_submitted}</div>
                  <div><b>Material Movement Permission:</b> {viewModal.record.material_movement_permission_required}</div>
                </div>
              </div>

              {/* Safety Measures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Measures & Disposal</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div><b>Precautionary Measures:</b> {viewModal.record.precautionary_measures_taken}</div>
                  <div><b>Waste Disposal Method:</b> {viewModal.record.waste_disposal_method}</div>
                </div>
              </div>

              {/* Approvals & Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals & Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Supervisor/Facility In-charge:</b> {viewModal.record.supervisor_or_facility_in_charge_name}</div>
                  <div><b>Security Informed:</b> {viewModal.record.security_informed}</div>
                  <div><b>Security Personnel:</b> {viewModal.record.security_personnel_name_signature}</div>
                  <div><b>Final Inspection Done:</b> {viewModal.record.final_inspection_done}</div>
                  <div><b>Final Inspection By:</b> {viewModal.record.final_inspection_done_by}</div>
                  <div><b>Clearance Given:</b> {viewModal.record.clearance_given}</div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Requester Signature:</b> {viewModal.record.signature_of_requester}</div>
                  <div><b>Approving Authority:</b> {viewModal.record.signature_of_approving_authority}</div>
                  <div><b>Supervisor Signature:</b> {viewModal.record.supervisor_signature}</div>
                </div>
              </div>

              {/* Remarks */}
              {viewModal.record.remarks_observations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks & Observations</h3>
                  <p className="text-gray-700">{viewModal.record.remarks_observations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editModal.isNew ? 'Add New Maintenance Permit' : 'Edit Maintenance Permit'}
              </h2>
              <button
                onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permit Number</label>
                  <input
                    type="text"
                    value={editModal.record.permit_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_number: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editModal.record.date_of_issue}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, date_of_issue: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.permit_valid_from}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_valid_from: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.permit_valid_until}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_valid_until: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Requester Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
                  <input
                    type="text"
                    value={editModal.record.requesting_department_or_resident_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, requesting_department_or_resident_name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={editModal.record.contact_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_number: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment/Block/Building</label>
                  <input
                    type="text"
                    value={editModal.record.apartment_block_building}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, apartment_block_building: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Work</label>
                  <input
                    type="text"
                    value={editModal.record.nature_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, nature_of_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location of Work</label>
                  <input
                    type="text"
                    value={editModal.record.location_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, location_of_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description of Work</label>
                <textarea
                  value={editModal.record.detailed_description_of_work}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, detailed_description_of_work: e.target.value}})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Contractor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Agency</label>
                  <input
                    type="text"
                    value={editModal.record.contractor_or_maintenance_agency_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contractor_or_maintenance_agency_name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editModal.record.contractor_contact_person}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contractor_contact_person: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={editModal.record.contractor_contact_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contractor_contact_number: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.no_of_workers_involved}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, no_of_workers_involved: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electrical Isolation Required</label>
                  <select
                    value={editModal.record.electrical_isolation_required}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, electrical_isolation_required: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Supply Shutdown Required</label>
                  <select
                    value={editModal.record.water_supply_shutdown_required}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, water_supply_shutdown_required: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PPE Required</label>
                  <select
                    value={editModal.record.ppe_required}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, ppe_required: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safety Briefing Given</label>
                  <select
                    value={editModal.record.safety_briefing_given}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, safety_briefing_given: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Work Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.work_start_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_start_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.expected_work_completion_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, expected_work_completion_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks & Observations</label>
                <textarea
                  value={editModal.record.remarks_observations}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, remarks_observations: e.target.value}})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralMaintenancePage;
