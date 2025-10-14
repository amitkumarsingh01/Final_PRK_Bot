import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';


interface ElectricalWorkPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  work_location: string;
  nature_of_work: string;
  equipment_panel_area_to_be_worked_on: string;
  voltage_level: string;
  description_of_electrical_task: string;
  contractor_agency_name: string;
  name_of_electrician_or_technician: string;
  electrician_contact_number: string;
  supervisor_name: string;
  supervisor_contact_number: string;
  number_of_persons_involved: number;
  work_isolate_point_identified: string;
  lockout_tagout_applied: string;
  isolation_verified: string;
  earthing_discharge_done: string;
  ppe_checked: string[];
  multimeter_or_electrical_tester_available: string;
  danger_board_displayed: string;
  safety_barricading_done: string;
  emergency_contact_details_available: string;
  work_authorized_by: string;
  signature_of_contractor: string;
  signature_of_supervisor: string;
  signature_of_safety_officer: string;
  post_work_area_inspection_by: string;
  power_restored_on: string;
  final_clearance_given_by: string;
  remarks_or_safety_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/electrical-work-permit/';

const emptyElectricalWorkPermit: ElectricalWorkPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  work_location: '',
  nature_of_work: '',
  equipment_panel_area_to_be_worked_on: '',
  voltage_level: '',
  description_of_electrical_task: '',
  contractor_agency_name: '',
  name_of_electrician_or_technician: '',
  electrician_contact_number: '',
  supervisor_name: '',
  supervisor_contact_number: '',
  number_of_persons_involved: 0,
  work_isolate_point_identified: '',
  lockout_tagout_applied: '',
  isolation_verified: '',
  earthing_discharge_done: '',
  ppe_checked: [],
  multimeter_or_electrical_tester_available: '',
  danger_board_displayed: '',
  safety_barricading_done: '',
  emergency_contact_details_available: '',
  work_authorized_by: '',
  signature_of_contractor: '',
  signature_of_supervisor: '',
  signature_of_safety_officer: '',
  post_work_area_inspection_by: '',
  power_restored_on: '',
  final_clearance_given_by: '',
  remarks_or_safety_observations: ''
};

const ElectricalWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ElectricalWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: ElectricalWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: ElectricalWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: ElectricalWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyElectricalWorkPermit, property_id: user?.propertyId || '' }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete electrical work permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this electrical work permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete electrical work permit');
      }
    }
  };

  const handleView = (record: ElectricalWorkPermit) => {
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
      setError('Failed to save electrical work permit');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const filteredData = user?.propertyId 
        ? response.data.filter((item: ElectricalWorkPermit) => item.property_id === user.propertyId)
        : response.data;
      setData(filteredData);
    } catch (e) {
      setError('Failed to fetch electrical work permits');
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

  const isPermitActive = (permit: ElectricalWorkPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: ElectricalWorkPermit) => {
    if (permit.final_clearance_given_by) return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
  };

  const isHighVoltage = (voltage: string) => {
    return voltage.toLowerCase().includes('high') || voltage.toLowerCase().includes('hv');
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
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Electrical Work Permits</h1>
                <p className="text-gray-600">Manage electrical work permits and electrical safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Electrical Work Permit</span>
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
                  {data.reduce((sum, permit) => sum + permit.number_of_persons_involved, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Voltage</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.filter(permit => isHighVoltage(permit.voltage_level)).length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment/Panel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage Level</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.work_location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.equipment_panel_area_to_be_worked_on}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isHighVoltage(permit.voltage_level) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {permit.voltage_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_persons_involved}</td>
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
              <Zap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No electrical work permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new electrical work permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Electrical Work Permit Details</h2>
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
                  <div><b>Work Location:</b> {viewModal.record.work_location}</div>
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_work}</div>
                  <div><b>Equipment/Panel Area:</b> {viewModal.record.equipment_panel_area_to_be_worked_on}</div>
                  <div><b>Voltage Level:</b> {viewModal.record.voltage_level}</div>
                  <div className="md:col-span-2"><b>Task Description:</b> {viewModal.record.description_of_electrical_task}</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Contractor Agency:</b> {viewModal.record.contractor_agency_name}</div>
                  <div><b>Electrician/Technician:</b> {viewModal.record.name_of_electrician_or_technician}</div>
                  <div><b>Electrician Contact:</b> {viewModal.record.electrician_contact_number}</div>
                  <div><b>Supervisor Name:</b> {viewModal.record.supervisor_name}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.supervisor_contact_number}</div>
                  <div><b>Number of Workers:</b> {viewModal.record.number_of_persons_involved}</div>
                </div>
              </div>

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Isolate Point Identified:</b> {viewModal.record.work_isolate_point_identified}</div>
                  <div><b>Lockout/Tagout Applied:</b> {viewModal.record.lockout_tagout_applied}</div>
                  <div><b>Isolation Verified:</b> {viewModal.record.isolation_verified}</div>
                  <div><b>Earthing/Discharge Done:</b> {viewModal.record.earthing_discharge_done}</div>
                  <div><b>Multimeter/Electrical Tester Available:</b> {viewModal.record.multimeter_or_electrical_tester_available}</div>
                  <div><b>Danger Board Displayed:</b> {viewModal.record.danger_board_displayed}</div>
                  <div><b>Safety Barricading Done:</b> {viewModal.record.safety_barricading_done}</div>
                  <div><b>Emergency Contact Details Available:</b> {viewModal.record.emergency_contact_details_available}</div>
                </div>
              </div>

              {/* PPE Equipment */}
              {viewModal.record.ppe_checked && viewModal.record.ppe_checked.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Protective Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.ppe_checked.map((ppe, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Approvals and Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals and Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Authorized By:</b> {viewModal.record.work_authorized_by}</div>
                  <div><b>Contractor Signature:</b> {viewModal.record.signature_of_contractor}</div>
                  <div><b>Supervisor Signature:</b> {viewModal.record.signature_of_supervisor}</div>
                  <div><b>Safety Officer Signature:</b> {viewModal.record.signature_of_safety_officer}</div>
                </div>
              </div>

              {/* Work Completion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Post-work Area Inspection By:</b> {viewModal.record.post_work_area_inspection_by}</div>
                  <div><b>Power Restored On:</b> {viewModal.record.power_restored_on}</div>
                  <div><b>Final Clearance Given By:</b> {viewModal.record.final_clearance_given_by}</div>
                </div>
              </div>

              {/* Remarks */}
              {viewModal.record.remarks_or_safety_observations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks & Safety Observations</h3>
                  <p className="text-gray-700">{viewModal.record.remarks_or_safety_observations}</p>
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
                {editModal.isNew ? 'Add New Electrical Work Permit' : 'Edit Electrical Work Permit'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={editModal.record.work_location}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_location: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Work</label>
                  <select
                    value={editModal.record.nature_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, nature_of_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment/Panel Area</label>
                  <input
                    type="text"
                    value={editModal.record.equipment_panel_area_to_be_worked_on}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, equipment_panel_area_to_be_worked_on: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voltage Level</label>
                  <select
                    value={editModal.record.voltage_level}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, voltage_level: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                    
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                  <textarea
                    value={editModal.record.description_of_electrical_task}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, description_of_electrical_task: e.target.value}})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electrician/Technician</label>
                  <input
                    type="text"
                    value={editModal.record.name_of_electrician_or_technician}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, name_of_electrician_or_technician: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electrician Contact</label>
                  <input
                    type="text"
                    value={editModal.record.electrician_contact_number}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, electrician_contact_number: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    value={editModal.record.supervisor_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, supervisor_name: e.target.value}})}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers</label>
                  <input
                    type="number"
                    value={editModal.record.number_of_persons_involved}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, number_of_persons_involved: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Isolate Point Identified</label>
                  <select
                    value={editModal.record.work_isolate_point_identified}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_isolate_point_identified: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lockout/Tagout Applied</label>
                  <select
                    value={editModal.record.lockout_tagout_applied}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, lockout_tagout_applied: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isolation Verified</label>
                  <select
                    value={editModal.record.isolation_verified}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, isolation_verified: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Earthing/Discharge Done</label>
                  <select
                    value={editModal.record.earthing_discharge_done}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, earthing_discharge_done: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Additional Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multimeter/Electrical Tester Available</label>
                  <select
                    value={editModal.record.multimeter_or_electrical_tester_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, multimeter_or_electrical_tester_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danger Board Displayed</label>
                  <select
                    value={editModal.record.danger_board_displayed}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, danger_board_displayed: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safety Barricading Done</label>
                  <select
                    value={editModal.record.safety_barricading_done}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, safety_barricading_done: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Details Available</label>
                  <select
                    value={editModal.record.emergency_contact_details_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, emergency_contact_details_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks & Safety Observations</label>
                <textarea
                  value={editModal.record.remarks_or_safety_observations}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, remarks_or_safety_observations: e.target.value}})}
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

export default ElectricalWorkPage;
