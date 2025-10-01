import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface HeightWorkPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  site_location_of_work: string;
  exact_height_of_work_meters: number;
  description_of_task: string;
  contractor_agency_name: string;
  worker_names_involved: string[];
  contact_details_contractor: string;
  contact_details_supervisor: string;
  supervisor_name_on_site: string;
  number_of_persons_working_at_height: number;
  scaffolding_or_ladder_type_used: string;
  scaffolding_certified_and_tagged: string;
  full_body_harness_worn: string;
  harness_lanyard_double_hooked: string;
  lifeline_or_anchorage_provided: string;
  safety_helmet_and_non_slip_shoes: string;
  work_platform_with_guardrails_provided: string;
  tools_secured_to_prevent_falling: string;
  fall_protection_equipment_checked_before_use: string;
  emergency_plan_in_place: string;
  first_aid_kit_available_onsite: string;
  weather_conditions_verified: string;
  area_barricaded_below: string;
  work_authorization_by: string;
  pre_work_site_inspection_done: string;
  signature_of_supervisor: string;
  signature_of_safety_officer: string;
  signature_of_contractor: string;
  work_completion_time: string;
  post_work_inspection_done_by: string;
  final_clearance_given: string;
  remarks_or_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/height-work-permit/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyHeightWorkPermit: HeightWorkPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  site_location_of_work: '',
  exact_height_of_work_meters: 0,
  description_of_task: '',
  contractor_agency_name: '',
  worker_names_involved: [],
  contact_details_contractor: '',
  contact_details_supervisor: '',
  supervisor_name_on_site: '',
  number_of_persons_working_at_height: 0,
  scaffolding_or_ladder_type_used: '',
  scaffolding_certified_and_tagged: '',
  full_body_harness_worn: '',
  harness_lanyard_double_hooked: '',
  lifeline_or_anchorage_provided: '',
  safety_helmet_and_non_slip_shoes: '',
  work_platform_with_guardrails_provided: '',
  tools_secured_to_prevent_falling: '',
  fall_protection_equipment_checked_before_use: '',
  emergency_plan_in_place: '',
  first_aid_kit_available_onsite: '',
  weather_conditions_verified: '',
  area_barricaded_below: '',
  work_authorization_by: '',
  pre_work_site_inspection_done: '',
  signature_of_supervisor: '',
  signature_of_safety_officer: '',
  signature_of_contractor: '',
  work_completion_time: '',
  post_work_inspection_done_by: '',
  final_clearance_given: '',
  remarks_or_observations: ''
};

const HeightWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HeightWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: HeightWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: HeightWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: HeightWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyHeightWorkPermit, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete height work permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this height work permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete height work permit');
      }
    }
  };

  const handleView = (record: HeightWorkPermit) => {
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
      setError('Failed to save height work permit');
    }
  };

  
  };

  const isPermitActive = (permit: HeightWorkPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: HeightWorkPermit) => {
    if (permit.final_clearance_given === 'Yes') return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
  };

  const isHighRiskHeight = (height: number) => {
    return height >= 10; // 10 meters or above considered high risk
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
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Height Work Permits</h1>
                <p className="text-gray-600">Manage height work permits and fall protection compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Height Work Permit</span>
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
                  {data.reduce((sum, permit) => sum + permit.number_of_persons_working_at_height, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Height</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.filter(permit => isHighRiskHeight(permit.exact_height_of_work_meters)).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height (m)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Description</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isHighRiskHeight(permit.exact_height_of_work_meters) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {permit.exact_height_of_work_meters}m
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.description_of_task}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_persons_working_at_height}</td>
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
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No height work permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new height work permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Height Work Permit Details</h2>
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
                  <div><b>Site Location:</b> {viewModal.record.site_location_of_work}</div>
                  <div><b>Height of Work:</b> {viewModal.record.exact_height_of_work_meters} meters</div>
                  <div><b>Task Description:</b> {viewModal.record.description_of_task}</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Contractor Agency:</b> {viewModal.record.contractor_agency_name}</div>
                  <div><b>Supervisor on Site:</b> {viewModal.record.supervisor_name_on_site}</div>
                  <div><b>Contractor Contact:</b> {viewModal.record.contact_details_contractor}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.contact_details_supervisor}</div>
                  <div><b>Number of Workers:</b> {viewModal.record.number_of_persons_working_at_height}</div>
                </div>
                {viewModal.record.worker_names_involved && viewModal.record.worker_names_involved.length > 0 && (
                  <div className="mt-3">
                    <b>Workers Involved:</b>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {viewModal.record.worker_names_involved.map((worker, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {worker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Safety Equipment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Equipment & Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Scaffolding/Ladder Type:</b> {viewModal.record.scaffolding_or_ladder_type_used}</div>
                  <div><b>Scaffolding Certified:</b> {viewModal.record.scaffolding_certified_and_tagged}</div>
                  <div><b>Full Body Harness:</b> {viewModal.record.full_body_harness_worn}</div>
                  <div><b>Harness Lanyard Double Hooked:</b> {viewModal.record.harness_lanyard_double_hooked}</div>
                  <div><b>Lifeline/Anchorage:</b> {viewModal.record.lifeline_or_anchorage_provided}</div>
                  <div><b>Safety Helmet & Non-slip Shoes:</b> {viewModal.record.safety_helmet_and_non_slip_shoes}</div>
                  <div><b>Work Platform with Guardrails:</b> {viewModal.record.work_platform_with_guardrails_provided}</div>
                  <div><b>Tools Secured:</b> {viewModal.record.tools_secured_to_prevent_falling}</div>
                </div>
              </div>

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Fall Protection Equipment Checked:</b> {viewModal.record.fall_protection_equipment_checked_before_use}</div>
                  <div><b>Emergency Plan in Place:</b> {viewModal.record.emergency_plan_in_place}</div>
                  <div><b>First Aid Kit Available:</b> {viewModal.record.first_aid_kit_available_onsite}</div>
                  <div><b>Weather Conditions Verified:</b> {viewModal.record.weather_conditions_verified}</div>
                  <div><b>Area Barricaded Below:</b> {viewModal.record.area_barricaded_below}</div>
                  <div><b>Pre-work Site Inspection:</b> {viewModal.record.pre_work_site_inspection_done}</div>
                </div>
              </div>

              {/* Approvals and Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals and Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Authorization By:</b> {viewModal.record.work_authorization_by}</div>
                  <div><b>Supervisor Signature:</b> {viewModal.record.signature_of_supervisor}</div>
                  <div><b>Safety Officer Signature:</b> {viewModal.record.signature_of_safety_officer}</div>
                  <div><b>Contractor Signature:</b> {viewModal.record.signature_of_contractor}</div>
                </div>
              </div>

              {/* Work Completion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Completion Time:</b> {viewModal.record.work_completion_time}</div>
                  <div><b>Post-work Inspection Done By:</b> {viewModal.record.post_work_inspection_done_by}</div>
                  <div><b>Final Clearance Given:</b> {viewModal.record.final_clearance_given}</div>
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
                {editModal.isNew ? 'Add New Height Work Permit' : 'Edit Height Work Permit'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height of Work (meters)</label>
                  <input
                    type="number"
                    value={editModal.record.exact_height_of_work_meters}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, exact_height_of_work_meters: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                  <textarea
                    value={editModal.record.description_of_task}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, description_of_task: e.target.value}})}
                    rows={3}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor on Site</label>
                  <input
                    type="text"
                    value={editModal.record.supervisor_name_on_site}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, supervisor_name_on_site: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.number_of_persons_working_at_height}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, number_of_persons_working_at_height: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scaffolding/Ladder Type</label>
                  <input
                    type="text"
                    value={editModal.record.scaffolding_or_ladder_type_used}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, scaffolding_or_ladder_type_used: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scaffolding Certified</label>
                  <select
                    value={editModal.record.scaffolding_certified_and_tagged}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, scaffolding_certified_and_tagged: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Body Harness</label>
                  <select
                    value={editModal.record.full_body_harness_worn}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, full_body_harness_worn: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harness Lanyard Double Hooked</label>
                  <select
                    value={editModal.record.harness_lanyard_double_hooked}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, harness_lanyard_double_hooked: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lifeline/Anchorage</label>
                  <select
                    value={editModal.record.lifeline_or_anchorage_provided}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, lifeline_or_anchorage_provided: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fall Protection Equipment Checked</label>
                  <select
                    value={editModal.record.fall_protection_equipment_checked_before_use}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fall_protection_equipment_checked_before_use: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Plan in Place</label>
                  <select
                    value={editModal.record.emergency_plan_in_place}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, emergency_plan_in_place: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Aid Kit Available</label>
                  <select
                    value={editModal.record.first_aid_kit_available_onsite}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, first_aid_kit_available_onsite: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weather Conditions Verified</label>
                  <select
                    value={editModal.record.weather_conditions_verified}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, weather_conditions_verified: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
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

export default HeightWorkPage;
