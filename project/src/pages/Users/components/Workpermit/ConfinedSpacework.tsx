import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Box } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface GasTestConductedBy {
  name: string;
  designation: string;
}

interface PermitIssuedBy {
  name: string;
  designation: string;
}

interface AuthorizedBy {
  name: string;
  designation: string;
}

interface ConfinedSpaceWorkPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  site_location_of_confined_space: string;
  specific_space_name_or_number: string;
  nature_of_work: string;
  contractor_agency_name: string;
  name_of_person_in_charge: string;
  contact_number: string;
  names_of_workers_entering: string[];
  number_of_persons_entering: number;
  entry_time: string;
  expected_exit_time: string;
  work_start_date_time: string;
  work_end_date_time: string;
  atmospheric_testing_done: string;
  oxygen_level_percent: number;
  explosive_gases_lel_percent: number;
  toxic_gases_ppm: Record<string, number>;
  gas_test_conducted_by: GasTestConductedBy;
  ventilation_arranged: string;
  continuous_gas_monitoring_required: string;
  type_of_ppe_provided: string[];
  communication_device_used: string;
  rescue_equipment_available: string[];
  emergency_contact_details_posted: string;
  trained_standby_person_present: string;
  lockout_tagout_implemented: string;
  barricading_and_signages_installed: string;
  permit_issued_by: PermitIssuedBy;
  authorized_by: AuthorizedBy;
  signature_of_worker: string;
  signature_of_supervisor: string;
  post_work_gas_test_done: string;
  work_completion_time: string;
  final_clearance_given_by: string;
  remarks_or_precautions: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/confined-space-work-permit/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyConfinedSpaceWorkPermit: ConfinedSpaceWorkPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  site_location_of_confined_space: '',
  specific_space_name_or_number: '',
  nature_of_work: '',
  contractor_agency_name: '',
  name_of_person_in_charge: '',
  contact_number: '',
  names_of_workers_entering: [],
  number_of_persons_entering: 0,
  entry_time: '',
  expected_exit_time: '',
  work_start_date_time: '',
  work_end_date_time: '',
  atmospheric_testing_done: '',
  oxygen_level_percent: 0,
  explosive_gases_lel_percent: 0,
  toxic_gases_ppm: {},
  gas_test_conducted_by: { name: '', designation: '' },
  ventilation_arranged: '',
  continuous_gas_monitoring_required: '',
  type_of_ppe_provided: [],
  communication_device_used: '',
  rescue_equipment_available: [],
  emergency_contact_details_posted: '',
  trained_standby_person_present: '',
  lockout_tagout_implemented: '',
  barricading_and_signages_installed: '',
  permit_issued_by: { name: '', designation: '' },
  authorized_by: { name: '', designation: '' },
  signature_of_worker: '',
  signature_of_supervisor: '',
  post_work_gas_test_done: '',
  work_completion_time: '',
  final_clearance_given_by: '',
  remarks_or_precautions: ''
};

const ConfinedSpaceWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ConfinedSpaceWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: ConfinedSpaceWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: ConfinedSpaceWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: ConfinedSpaceWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyConfinedSpaceWorkPermit, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete confined space work permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this confined space work permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete confined space work permit');
      }
    }
  };

  const handleView = (record: ConfinedSpaceWorkPermit) => {
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
      setError('Failed to save confined space work permit');
    }
  };

  
  };

  const isPermitActive = (permit: ConfinedSpaceWorkPermit) => {
    const now = new Date();
    const workStart = new Date(permit.work_start_date_time);
    const workEnd = new Date(permit.work_end_date_time);
    return now >= workStart && now <= workEnd;
  };

  const getPermitStatus = (permit: ConfinedSpaceWorkPermit) => {
    if (permit.post_work_gas_test_done === 'Yes') return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
  };

  const isOxygenSafe = (oxygenLevel: number) => {
    return oxygenLevel >= 19.5 && oxygenLevel <= 23.5;
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
                <Box className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Confined Space Work Permits</h1>
                <p className="text-gray-600">Manage confined space work permits and safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Confined Space Permit</span>
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
                  {data.reduce((sum, permit) => sum + permit.number_of_persons_entering, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safe Oxygen Levels</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(permit => isOxygenSafe(permit.oxygen_level_percent)).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specific Space</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature of Work</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oxygen Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.permit_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.date_of_issue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_confined_space}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.specific_space_name_or_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.nature_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_persons_entering}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isOxygenSafe(permit.oxygen_level_percent) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {permit.oxygen_level_percent}%
                      </span>
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
              <Box className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No confined space work permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new confined space permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Confined Space Work Permit Details</h2>
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
                  <div><b>Site Location:</b> {viewModal.record.site_location_of_confined_space}</div>
                  <div><b>Specific Space:</b> {viewModal.record.specific_space_name_or_number}</div>
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_work}</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Contractor Agency:</b> {viewModal.record.contractor_agency_name}</div>
                  <div><b>Person in Charge:</b> {viewModal.record.name_of_person_in_charge}</div>
                  <div><b>Contact Number:</b> {viewModal.record.contact_number}</div>
                </div>
              </div>

              {/* Workers and Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Workers and Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Number of Workers:</b> {viewModal.record.number_of_persons_entering}</div>
                  <div><b>Entry Time:</b> {viewModal.record.entry_time}</div>
                  <div><b>Expected Exit Time:</b> {viewModal.record.expected_exit_time}</div>
                  <div><b>Work Start Time:</b> {viewModal.record.work_start_date_time}</div>
                  <div><b>Work End Time:</b> {viewModal.record.work_end_date_time}</div>
                </div>
                {viewModal.record.names_of_workers_entering && viewModal.record.names_of_workers_entering.length > 0 && (
                  <div className="mt-3">
                    <b>Workers Entering:</b>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewModal.record.names_of_workers_entering.map((worker, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {worker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Atmospheric Testing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Atmospheric Testing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Testing Done:</b> {viewModal.record.atmospheric_testing_done}</div>
                  <div><b>Oxygen Level:</b> {viewModal.record.oxygen_level_percent}%</div>
                  <div><b>Explosive Gases (LEL):</b> {viewModal.record.explosive_gases_lel_percent}%</div>
                  <div><b>Gas Test Conducted By:</b> {viewModal.record.gas_test_conducted_by.name} ({viewModal.record.gas_test_conducted_by.designation})</div>
                </div>
                {Object.keys(viewModal.record.toxic_gases_ppm).length > 0 && (
                  <div className="mt-3">
                    <b>Toxic Gases (PPM):</b>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(viewModal.record.toxic_gases_ppm).map(([gas, ppm]) => (
                        <span key={gas} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {gas}: {ppm} PPM
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Equipment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Equipment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Ventilation Arranged:</b> {viewModal.record.ventilation_arranged}</div>
                  <div><b>Continuous Gas Monitoring:</b> {viewModal.record.continuous_gas_monitoring_required}</div>
                  <div><b>Communication Device:</b> {viewModal.record.communication_device_used}</div>
                  <div><b>Emergency Contact Details Posted:</b> {viewModal.record.emergency_contact_details_posted}</div>
                  <div><b>Trained Standby Person:</b> {viewModal.record.trained_standby_person_present}</div>
                  <div><b>Lockout/Tagout Implemented:</b> {viewModal.record.lockout_tagout_implemented}</div>
                  <div><b>Barricading & Signages:</b> {viewModal.record.barricading_and_signages_installed}</div>
                </div>
              </div>

              {/* PPE and Rescue Equipment */}
              {viewModal.record.type_of_ppe_provided && viewModal.record.type_of_ppe_provided.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Protective Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.type_of_ppe_provided.map((ppe, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewModal.record.rescue_equipment_available && viewModal.record.rescue_equipment_available.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Rescue Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.rescue_equipment_available.map((equipment, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Approvals and Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals and Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Permit Issued By:</b> {viewModal.record.permit_issued_by.name} ({viewModal.record.permit_issued_by.designation})</div>
                  <div><b>Authorized By:</b> {viewModal.record.authorized_by.name} ({viewModal.record.authorized_by.designation})</div>
                  <div><b>Worker Signature:</b> {viewModal.record.signature_of_worker}</div>
                  <div><b>Supervisor Signature:</b> {viewModal.record.signature_of_supervisor}</div>
                </div>
              </div>

              {/* Work Completion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Post-work Gas Test Done:</b> {viewModal.record.post_work_gas_test_done}</div>
                  <div><b>Work Completion Time:</b> {viewModal.record.work_completion_time}</div>
                  <div><b>Final Clearance Given By:</b> {viewModal.record.final_clearance_given_by}</div>
                </div>
              </div>

              {/* Remarks */}
              {viewModal.record.remarks_or_precautions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks & Precautions</h3>
                  <p className="text-gray-700">{viewModal.record.remarks_or_precautions}</p>
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
                {editModal.isNew ? 'Add New Confined Space Permit' : 'Edit Confined Space Permit'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                  <input
                    type="text"
                    value={editModal.record.site_location_of_confined_space}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, site_location_of_confined_space: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specific Space</label>
                  <input
                    type="text"
                    value={editModal.record.specific_space_name_or_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, specific_space_name_or_number: e.target.value}})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.number_of_persons_entering}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, number_of_persons_entering: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.entry_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, entry_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Exit Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.expected_exit_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, expected_exit_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.work_start_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_start_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.work_end_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_end_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Atmospheric Testing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atmospheric Testing Done</label>
                  <select
                    value={editModal.record.atmospheric_testing_done}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, atmospheric_testing_done: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oxygen Level (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editModal.record.oxygen_level_percent}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, oxygen_level_percent: parseFloat(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explosive Gases (LEL %)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editModal.record.explosive_gases_lel_percent}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, explosive_gases_lel_percent: parseFloat(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ventilation Arranged</label>
                  <select
                    value={editModal.record.ventilation_arranged}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, ventilation_arranged: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Continuous Gas Monitoring</label>
                  <select
                    value={editModal.record.continuous_gas_monitoring_required}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, continuous_gas_monitoring_required: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trained Standby Person</label>
                  <select
                    value={editModal.record.trained_standby_person_present}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, trained_standby_person_present: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lockout/Tagout Implemented</label>
                  <select
                    value={editModal.record.lockout_tagout_implemented}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, lockout_tagout_implemented: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks & Precautions</label>
                <textarea
                  value={editModal.record.remarks_or_precautions}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, remarks_or_precautions: e.target.value}})}
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

export default ConfinedSpaceWorkPage;
