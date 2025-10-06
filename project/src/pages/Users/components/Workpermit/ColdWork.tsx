import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Snowflake } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ColdWorkPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  valid_from: string;
  valid_to: string;
  site_location_of_work: string;
  floor_zone_area_details: string;
  description_of_work: string;
  nature_of_tools_used: string[];
  person_or_agency_performing_work: string;
  number_of_workers_assigned: number;
  contact_details_of_contractor: string;
  work_supervisor_name: string;
  supervisor_contact_number: string;
  type_of_safety_gear_required: string[];
  safety_instructions_explained_to_team: string;
  risk_assessment_attached: string;
  msds_required: string;
  work_area_inspected_before_start: string;
  nearby_sensitive_equipment_covered_or_protected: string;
  floor_corridor_wall_protection_arranged: string;
  emergency_exit_access_ensured: string;
  fire_safety_equipment_nearby: string;
  waste_disposal_method: string;
  permit_approved_by: string;
  date_time_of_approval: string;
  security_team_notified: string;
  post_work_area_inspection_done_by: string;
  final_clearance_given: string;
  signature_of_contractor: string;
  signature_of_approving_officer: string;
  remarks_or_precautions: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/cold-work-permit/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyColdWorkPermit: ColdWorkPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  valid_from: '',
  valid_to: '',
  site_location_of_work: '',
  floor_zone_area_details: '',
  description_of_work: '',
  nature_of_tools_used: [],
  person_or_agency_performing_work: '',
  number_of_workers_assigned: 0,
  contact_details_of_contractor: '',
  work_supervisor_name: '',
  supervisor_contact_number: '',
  type_of_safety_gear_required: [],
  safety_instructions_explained_to_team: '',
  risk_assessment_attached: '',
  msds_required: '',
  work_area_inspected_before_start: '',
  nearby_sensitive_equipment_covered_or_protected: '',
  floor_corridor_wall_protection_arranged: '',
  emergency_exit_access_ensured: '',
  fire_safety_equipment_nearby: '',
  waste_disposal_method: '',
  permit_approved_by: '',
  date_time_of_approval: '',
  security_team_notified: '',
  post_work_area_inspection_done_by: '',
  final_clearance_given: '',
  signature_of_contractor: '',
  signature_of_approving_officer: '',
  remarks_or_precautions: ''
};

const ColdWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ColdWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: ColdWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: ColdWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: ColdWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyColdWorkPermit, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete cold work permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this cold work permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete cold work permit');
      }
    }
  };

  const handleView = (record: ColdWorkPermit) => {
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
      setError('Failed to save cold work permit');
    }
  };

  
  };

  const isPermitActive = (permit: ColdWorkPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.valid_from);
    const validTo = new Date(permit.valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: ColdWorkPermit) => {
    if (permit.final_clearance_given === 'Yes') return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
  };

  const hasRiskAssessment = (permit: ColdWorkPermit) => {
    return permit.risk_assessment_attached === 'Yes';
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
                <Snowflake className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cold Work Permits</h1>
                <p className="text-gray-600">Manage cold work permits and general safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Cold Work Permit</span>
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
                  {data.reduce((sum, permit) => sum + permit.number_of_workers_assigned, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Assessment</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(permit => hasRiskAssessment(permit)).length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor/Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Description</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.floor_zone_area_details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.description_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_workers_assigned}</td>
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
              <Snowflake className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cold work permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new cold work permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cold Work Permit Details</h2>
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
                  <div><b>Valid From:</b> {viewModal.record.valid_from}</div>
                  <div><b>Valid To:</b> {viewModal.record.valid_to}</div>
                  <div><b>Site Location:</b> {viewModal.record.site_location_of_work}</div>
                  <div><b>Floor/Zone Area:</b> {viewModal.record.floor_zone_area_details}</div>
                  <div className="md:col-span-2"><b>Work Description:</b> {viewModal.record.description_of_work}</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Person/Agency:</b> {viewModal.record.person_or_agency_performing_work}</div>
                  <div><b>Number of Workers:</b> {viewModal.record.number_of_workers_assigned}</div>
                  <div><b>Contractor Contact:</b> {viewModal.record.contact_details_of_contractor}</div>
                  <div><b>Work Supervisor:</b> {viewModal.record.work_supervisor_name}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.supervisor_contact_number}</div>
                </div>
              </div>

              {/* Tools and Safety Equipment */}
              {viewModal.record.nature_of_tools_used && viewModal.record.nature_of_tools_used.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tools Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.nature_of_tools_used.map((tool, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewModal.record.type_of_safety_gear_required && viewModal.record.type_of_safety_gear_required.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Gear Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.type_of_safety_gear_required.map((gear, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {gear}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Safety Instructions Explained:</b> {viewModal.record.safety_instructions_explained_to_team}</div>
                  <div><b>Risk Assessment Attached:</b> {viewModal.record.risk_assessment_attached}</div>
                  <div><b>MSDS Required:</b> {viewModal.record.msds_required}</div>
                  <div><b>Work Area Inspected:</b> {viewModal.record.work_area_inspected_before_start}</div>
                  <div><b>Sensitive Equipment Protected:</b> {viewModal.record.nearby_sensitive_equipment_covered_or_protected}</div>
                  <div><b>Floor/Corridor Protection:</b> {viewModal.record.floor_corridor_wall_protection_arranged}</div>
                  <div><b>Emergency Exit Access:</b> {viewModal.record.emergency_exit_access_ensured}</div>
                  <div><b>Fire Safety Equipment Nearby:</b> {viewModal.record.fire_safety_equipment_nearby}</div>
                </div>
              </div>

              {/* Approvals and Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals and Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Permit Approved By:</b> {viewModal.record.permit_approved_by}</div>
                  <div><b>Date/Time of Approval:</b> {viewModal.record.date_time_of_approval}</div>
                  <div><b>Security Team Notified:</b> {viewModal.record.security_team_notified}</div>
                  <div><b>Waste Disposal Method:</b> {viewModal.record.waste_disposal_method}</div>
                  <div><b>Contractor Signature:</b> {viewModal.record.signature_of_contractor}</div>
                  <div><b>Approving Officer Signature:</b> {viewModal.record.signature_of_approving_officer}</div>
                </div>
              </div>

              {/* Work Completion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Post-work Area Inspection By:</b> {viewModal.record.post_work_area_inspection_done_by}</div>
                  <div><b>Final Clearance Given:</b> {viewModal.record.final_clearance_given}</div>
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
                {editModal.isNew ? 'Add New Cold Work Permit' : 'Edit Cold Work Permit'}
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
                    value={editModal.record.valid_from}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, valid_from: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.valid_to}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, valid_to: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor/Zone Area Details</label>
                  <input
                    type="text"
                    value={editModal.record.floor_zone_area_details}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, floor_zone_area_details: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                  <textarea
                    value={editModal.record.description_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, description_of_work: e.target.value}})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Contractor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person/Agency Performing Work</label>
                  <input
                    type="text"
                    value={editModal.record.person_or_agency_performing_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, person_or_agency_performing_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.number_of_workers_assigned}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, number_of_workers_assigned: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Contact</label>
                  <input
                    type="text"
                    value={editModal.record.contact_details_of_contractor}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_details_of_contractor: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Supervisor</label>
                  <input
                    type="text"
                    value={editModal.record.work_supervisor_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_supervisor_name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Contact</label>
                  <input
                    type="text"
                    value={editModal.record.supervisor_contact_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, supervisor_contact_number: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safety Instructions Explained</label>
                  <select
                    value={editModal.record.safety_instructions_explained_to_team}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, safety_instructions_explained_to_team: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Assessment Attached</label>
                  <select
                    value={editModal.record.risk_assessment_attached}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, risk_assessment_attached: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MSDS Required</label>
                  <select
                    value={editModal.record.msds_required}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, msds_required: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Area Inspected</label>
                  <select
                    value={editModal.record.work_area_inspected_before_start}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_area_inspected_before_start: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Additional Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sensitive Equipment Protected</label>
                  <select
                    value={editModal.record.nearby_sensitive_equipment_covered_or_protected}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, nearby_sensitive_equipment_covered_or_protected: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor/Corridor Protection</label>
                  <select
                    value={editModal.record.floor_corridor_wall_protection_arranged}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, floor_corridor_wall_protection_arranged: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Exit Access</label>
                  <select
                    value={editModal.record.emergency_exit_access_ensured}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, emergency_exit_access_ensured: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Safety Equipment Nearby</label>
                  <select
                    value={editModal.record.fire_safety_equipment_nearby}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fire_safety_equipment_nearby: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Waste Disposal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waste Disposal Method</label>
                <select
                  value={editModal.record.waste_disposal_method}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, waste_disposal_method: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  
                  
                  
                  
                  
                </select>
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

export default ColdWorkPage;
