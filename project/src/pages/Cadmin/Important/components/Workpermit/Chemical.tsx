import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ChemicalHandlingPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  site_location_of_work: string;
  nature_of_chemical_work: string;
  contractor_agency_name: string;
  contact_details_contractor: string;
  supervisor_name_on_site: string;
  contact_details_supervisor: string;
  number_of_workers_involved: number;
  chemicals_to_be_handled: string[];
  chemical_concentrations: string[];
  quantities_involved: string[];
  msds_available_and_reviewed: string;
  chemical_compatibility_checked: string;
  ventilation_system_operational: string;
  fume_hood_available: string;
  emergency_shower_eyewash_available: string;
  spill_containment_equipment_available: string;
  chemical_resistant_ppe_provided: string;
  type_of_ppe_provided: string[];
  emergency_procedures_explained: string;
  first_aid_kit_available_onsite: string;
  fire_extinguisher_available: string;
  work_authorization_by: string;
  pre_work_site_inspection_done: string;
  signature_of_supervisor: string;
  signature_of_safety_officer: string;
  signature_of_contractor: string;
  work_completion_time: string;
  post_work_inspection_done_by: string;
  final_clearance_given: string;
  chemical_waste_disposal_verified: string;
  remarks_or_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/chemical-handling-permit/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyChemicalPermit: ChemicalHandlingPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  site_location_of_work: '',
  nature_of_chemical_work: '',
  contractor_agency_name: '',
  contact_details_contractor: '',
  supervisor_name_on_site: '',
  contact_details_supervisor: '',
  number_of_workers_involved: 0,
  chemicals_to_be_handled: [],
  chemical_concentrations: [],
  quantities_involved: [],
  msds_available_and_reviewed: '',
  chemical_compatibility_checked: '',
  ventilation_system_operational: '',
  fume_hood_available: '',
  emergency_shower_eyewash_available: '',
  spill_containment_equipment_available: '',
  chemical_resistant_ppe_provided: '',
  type_of_ppe_provided: [],
  emergency_procedures_explained: '',
  first_aid_kit_available_onsite: '',
  fire_extinguisher_available: '',
  work_authorization_by: '',
  pre_work_site_inspection_done: '',
  signature_of_supervisor: '',
  signature_of_safety_officer: '',
  signature_of_contractor: '',
  work_completion_time: '',
  post_work_inspection_done_by: '',
  final_clearance_given: '',
  chemical_waste_disposal_verified: '',
  remarks_or_observations: ''
};

const ChemicalPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ChemicalHandlingPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: ChemicalHandlingPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: ChemicalHandlingPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

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
      setError('Failed to fetch chemical permits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (record: ChemicalHandlingPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyChemicalPermit, property_id: selectedPropertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete chemical permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this chemical permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData(selectedPropertyId);
      } catch (e) {
        setError('Failed to delete chemical permit');
      }
    }
  };

  const handleView = (record: ChemicalHandlingPermit) => {
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
      setError('Failed to save chemical permit');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const isPermitActive = (permit: ChemicalHandlingPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: ChemicalHandlingPermit) => {
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
                <FlaskConical className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chemical Handling Permits</h1>
                <p className="text-gray-600">Manage chemical handling permits and safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Chemical Permit</span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature of Work</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chemicals</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.nature_of_chemical_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permit.chemicals_to_be_handled?.length || 0} types
                    </td>
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
              <FlaskConical className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No chemical permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new chemical permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Chemical Handling Permit Details</h2>
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
                  <div><b>Work Location:</b> {viewModal.record.site_location_of_work}</div>
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_chemical_work}</div>
                </div>
              </div>

              {/* Chemical Details */}
              {viewModal.record.chemicals_to_be_handled && viewModal.record.chemicals_to_be_handled.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Chemical Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">Chemical</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">Concentration</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-gray-700 border-b">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewModal.record.chemicals_to_be_handled.map((chemical, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900 border-b">{chemical}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 border-b">
                              {viewModal.record?.chemical_concentrations?.[index] || 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 border-b">
                              {viewModal.record?.quantities_involved?.[index] || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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

              {/* Safety Equipment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Equipment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Ventilation System:</b> {viewModal.record.ventilation_system_operational}</div>
                  <div><b>Fume Hood:</b> {viewModal.record.fume_hood_available}</div>
                  <div><b>Emergency Shower/Eyewash:</b> {viewModal.record.emergency_shower_eyewash_available}</div>
                  <div><b>Spill Containment:</b> {viewModal.record.spill_containment_equipment_available}</div>
                  <div><b>Fire Extinguisher:</b> {viewModal.record.fire_extinguisher_available}</div>
                </div>
              </div>

              {/* PPE Information */}
              {viewModal.record.type_of_ppe_provided && viewModal.record.type_of_ppe_provided.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Protective Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.type_of_ppe_provided.map((ppe, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>MSDS Available & Reviewed:</b> {viewModal.record.msds_available_and_reviewed}</div>
                  <div><b>Chemical Compatibility Checked:</b> {viewModal.record.chemical_compatibility_checked}</div>
                  <div><b>Chemical Resistant PPE Provided:</b> {viewModal.record.chemical_resistant_ppe_provided}</div>
                  <div><b>Emergency Procedures Explained:</b> {viewModal.record.emergency_procedures_explained}</div>
                  <div><b>First Aid Kit Available:</b> {viewModal.record.first_aid_kit_available_onsite}</div>
                  <div><b>Pre-work Site Inspection:</b> {viewModal.record.pre_work_site_inspection_done}</div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Authorization:</b> {viewModal.record.work_authorization_by}</div>
                  <div><b>Work Completion Time:</b> {viewModal.record.work_completion_time}</div>
                  <div><b>Post-work Inspection:</b> {viewModal.record.post_work_inspection_done_by}</div>
                  <div><b>Final Clearance:</b> {viewModal.record.final_clearance_given}</div>
                  <div><b>Chemical Waste Disposal Verified:</b> {viewModal.record.chemical_waste_disposal_verified}</div>
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editModal.isNew ? 'Add New Chemical Permit' : 'Edit Chemical Permit'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.permit_valid_to}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_valid_to: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                  <input
                    type="text"
                    value={editModal.record.site_location_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, site_location_of_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Work</label>
                  <input
                    type="text"
                    value={editModal.record.nature_of_chemical_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, nature_of_chemical_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Contractor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Agency</label>
                  <input
                    type="text"
                    value={editModal.record.contractor_agency_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contractor_agency_name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Contact</label>
                  <input
                    type="text"
                    value={editModal.record.contact_details_contractor}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_details_contractor: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    value={editModal.record.supervisor_name_on_site}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, supervisor_name_on_site: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Contact</label>
                  <input
                    type="text"
                    value={editModal.record.contact_details_supervisor}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_details_supervisor: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.number_of_workers_involved}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, number_of_workers_involved: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MSDS Available & Reviewed</label>
                  <select
                    value={editModal.record.msds_available_and_reviewed}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, msds_available_and_reviewed: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chemical Compatibility Checked</label>
                  <select
                    value={editModal.record.chemical_compatibility_checked}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, chemical_compatibility_checked: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ventilation System Operational</label>
                  <select
                    value={editModal.record.ventilation_system_operational}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, ventilation_system_operational: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fume Hood Available</label>
                  <select
                    value={editModal.record.fume_hood_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fume_hood_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Additional Safety Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Shower/Eyewash</label>
                  <select
                    value={editModal.record.emergency_shower_eyewash_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, emergency_shower_eyewash_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spill Containment Equipment</label>
                  <select
                    value={editModal.record.spill_containment_equipment_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, spill_containment_equipment_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chemical Resistant PPE</label>
                  <select
                    value={editModal.record.chemical_resistant_ppe_provided}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, chemical_resistant_ppe_provided: e.target.value}})}
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
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_authorization_by: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks & Observations</label>
                <textarea
                  value={editModal.record.remarks_or_observations}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, remarks_or_observations: e.target.value}})}
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

export default ChemicalPage;
