import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Eye, Users, Calendar, FileText, CheckCircle, Hammer } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';


interface DemolitionWorkPermit {
  id?: number;
  property_id?: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  site_location_of_demolition: string;
  nature_of_demolition_work: string;
  contractor_agency_name: string;
  contact_details_contractor: string;
  supervisor_name_on_site: string;
  contact_details_supervisor: string;
  number_of_workers_involved: number;
  structure_to_be_demolished: string;
  area_to_be_demolished_sqm: number;
  height_of_structure_meters: number;
  demolition_method: string;
  heavy_equipment_required: string;
  equipment_to_be_used: string[];
  structural_analysis_done: string;
  load_bearing_walls_identified: string;
  utilities_disconnected: string;
  electrical_isolation_done: string;
  water_supply_isolated: string;
  gas_supply_isolated: string;
  asbestos_survey_done: string;
  hazardous_materials_identified: string;
  dust_control_measures: string;
  noise_control_measures: string;
  vibration_monitoring: string;
  barricading_and_signages: string;
  safety_helmet_and_ppe_worn: string;
  first_aid_kit_available_onsite: string;
  emergency_procedures_explained: string;
  work_authorization_by: string;
  pre_work_site_inspection_done: string;
  signature_of_supervisor: string;
  signature_of_safety_officer: string;
  signature_of_contractor: string;
  work_completion_time: string;
  post_work_inspection_done_by: string;
  final_clearance_given: string;
  debris_removal_verified: string;
  remarks_or_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/demolition-work-permit/';

const emptyDemolitionPermit: DemolitionWorkPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  site_location_of_demolition: '',
  nature_of_demolition_work: '',
  contractor_agency_name: '',
  contact_details_contractor: '',
  supervisor_name_on_site: '',
  contact_details_supervisor: '',
  number_of_workers_involved: 0,
  structure_to_be_demolished: '',
  area_to_be_demolished_sqm: 0,
  height_of_structure_meters: 0,
  demolition_method: '',
  heavy_equipment_required: '',
  equipment_to_be_used: [],
  structural_analysis_done: '',
  load_bearing_walls_identified: '',
  utilities_disconnected: '',
  electrical_isolation_done: '',
  water_supply_isolated: '',
  gas_supply_isolated: '',
  asbestos_survey_done: '',
  hazardous_materials_identified: '',
  dust_control_measures: '',
  noise_control_measures: '',
  vibration_monitoring: '',
  barricading_and_signages: '',
  safety_helmet_and_ppe_worn: '',
  first_aid_kit_available_onsite: '',
  emergency_procedures_explained: '',
  work_authorization_by: '',
  pre_work_site_inspection_done: '',
  signature_of_supervisor: '',
  signature_of_safety_officer: '',
  signature_of_contractor: '',
  work_completion_time: '',
  post_work_inspection_done_by: '',
  final_clearance_given: '',
  debris_removal_verified: '',
  remarks_or_observations: ''
};

const CDemolitionPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DemolitionWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: DemolitionWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: DemolitionWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: DemolitionWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyDemolitionPermit, property_id: user?.propertyId || '' }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete demolition permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this demolition permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete demolition permit');
      }
    }
  };

  const handleView = (record: DemolitionWorkPermit) => {
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
      setError('Failed to save demolition permit');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const filteredData = user?.propertyId 
        ? response.data.filter((item: DemolitionWorkPermit) => item.property_id === user.propertyId)
        : response.data;
      setData(filteredData);
    } catch (e) {
      setError('Failed to fetch demolition permits');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (user) {
      const matchedUser = user;
      setIsAdmin(matchedUser && (matchedUser.role === 'admin' || matchedUser.role === 'cadmin'));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user?.propertyId]);

  const isPermitActive = (permit: DemolitionWorkPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: DemolitionWorkPermit) => {
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
                <Hammer className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demolition Work Permits</h1>
                <p className="text-gray-600">Manage demolition work permits and safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Demolition Permit</span>
              </button>
            )}
          </div>
        </div>


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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_demolition}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.structure_to_be_demolished}</td>
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
              <Hammer className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No demolition permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new demolition permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Demolition Work Permit Details</h2>
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
                  <div><b>Demolition Location:</b> {viewModal.record.site_location_of_demolition}</div>
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_demolition_work}</div>
                  <div><b>Structure to be Demolished:</b> {viewModal.record.structure_to_be_demolished}</div>
                  <div><b>Area to be Demolished:</b> {viewModal.record.area_to_be_demolished_sqm} sqm</div>
                  <div><b>Height of Structure:</b> {viewModal.record.height_of_structure_meters} meters</div>
                  <div><b>Demolition Method:</b> {viewModal.record.demolition_method}</div>
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
                  <div><b>Heavy Equipment Required:</b> {viewModal.record.heavy_equipment_required}</div>
                </div>
              </div>

              {/* Equipment Details */}
              {viewModal.record.equipment_to_be_used && viewModal.record.equipment_to_be_used.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Equipment to be Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.equipment_to_be_used.map((equipment, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Structural Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Structural Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Structural Analysis Done:</b> {viewModal.record.structural_analysis_done}</div>
                  <div><b>Load Bearing Walls Identified:</b> {viewModal.record.load_bearing_walls_identified}</div>
                </div>
              </div>

              {/* Utilities Isolation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Utilities Isolation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Utilities Disconnected:</b> {viewModal.record.utilities_disconnected}</div>
                  <div><b>Electrical Isolation:</b> {viewModal.record.electrical_isolation_done}</div>
                  <div><b>Water Supply Isolated:</b> {viewModal.record.water_supply_isolated}</div>
                  <div><b>Gas Supply Isolated:</b> {viewModal.record.gas_supply_isolated}</div>
                </div>
              </div>

              {/* Safety & Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Asbestos Survey Done:</b> {viewModal.record.asbestos_survey_done}</div>
                  <div><b>Hazardous Materials Identified:</b> {viewModal.record.hazardous_materials_identified}</div>
                  <div><b>Dust Control Measures:</b> {viewModal.record.dust_control_measures}</div>
                  <div><b>Noise Control Measures:</b> {viewModal.record.noise_control_measures}</div>
                  <div><b>Vibration Monitoring:</b> {viewModal.record.vibration_monitoring}</div>
                  <div><b>Barricading and Signages:</b> {viewModal.record.barricading_and_signages}</div>
                  <div><b>Safety Helmet and PPE:</b> {viewModal.record.safety_helmet_and_ppe_worn}</div>
                  <div><b>First Aid Kit Available:</b> {viewModal.record.first_aid_kit_available_onsite}</div>
                  <div><b>Emergency Procedures Explained:</b> {viewModal.record.emergency_procedures_explained}</div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Pre-work Inspection:</b> {viewModal.record.pre_work_site_inspection_done}</div>
                  <div><b>Work Authorization:</b> {viewModal.record.work_authorization_by}</div>
                  <div><b>Work Completion Time:</b> {viewModal.record.work_completion_time}</div>
                  <div><b>Post-work Inspection:</b> {viewModal.record.post_work_inspection_done_by}</div>
                  <div><b>Final Clearance:</b> {viewModal.record.final_clearance_given}</div>
                  <div><b>Debris Removal Verified:</b> {viewModal.record.debris_removal_verified}</div>
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
                {editModal.isNew ? 'Add Demolition Permit' : 'Edit Demolition Permit'}
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
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_number: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Issue</label>
                  <input
                    type="date"
                    value={editModal.record.date_of_issue}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, date_of_issue: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={editModal.record.permit_valid_from}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_valid_from: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    type="date"
                    value={editModal.record.permit_valid_to}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, permit_valid_to: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                  <input
                    type="text"
                    value={editModal.record.site_location_of_demolition}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, site_location_of_demolition: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Demolition Work</label>
                  <textarea
                    value={editModal.record.nature_of_demolition_work}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, nature_of_demolition_work: e.target.value } as DemolitionWorkPermit })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Contractor Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Agency Name</label>
                    <input
                      type="text"
                      value={editModal.record.contractor_agency_name}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contractor_agency_name: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Details</label>
                    <input
                      type="text"
                      value={editModal.record.contact_details_contractor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contact_details_contractor: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                    <input
                      type="text"
                      value={editModal.record.supervisor_name_on_site}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, supervisor_name_on_site: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Contact</label>
                    <input
                      type="text"
                      value={editModal.record.contact_details_supervisor}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, contact_details_supervisor: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                    <input
                      type="number"
                      value={editModal.record.number_of_workers_involved}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, number_of_workers_involved: parseInt(e.target.value) || 0 } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Structure Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Structure Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structure to be Demolished</label>
                    <input
                      type="text"
                      value={editModal.record.structure_to_be_demolished}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, structure_to_be_demolished: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqm)</label>
                    <input
                      type="number"
                      value={editModal.record.area_to_be_demolished_sqm}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, area_to_be_demolished_sqm: parseFloat(e.target.value) || 0 } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (meters)</label>
                    <input
                      type="number"
                      value={editModal.record.height_of_structure_meters}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, height_of_structure_meters: parseFloat(e.target.value) || 0 } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Demolition Method</label>
                    <select
                      value={editModal.record.demolition_method}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, demolition_method: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select method</option>
                      <option value="Manual">Manual</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Explosive">Explosive</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Safety Compliance */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structural Analysis Done</label>
                    <select
                      value={editModal.record.structural_analysis_done}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, structural_analysis_done: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Electrical Isolation Done</label>
                    <select
                      value={editModal.record.electrical_isolation_done}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, electrical_isolation_done: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Supply Isolated</label>
                    <select
                      value={editModal.record.water_supply_isolated}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, water_supply_isolated: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Supply Isolated</label>
                    <select
                      value={editModal.record.gas_supply_isolated}
                      onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, gas_supply_isolated: e.target.value } as DemolitionWorkPermit })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks & Observations</label>
                <textarea
                  value={editModal.record.remarks_or_observations}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, remarks_or_observations: e.target.value } as DemolitionWorkPermit })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
                <span>{editModal.isNew ? 'Add Permit' : 'Update Permit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDemolitionPage;
