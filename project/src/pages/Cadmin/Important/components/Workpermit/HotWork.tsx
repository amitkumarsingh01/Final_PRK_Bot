import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Eye, FileText, CheckCircle, AlertTriangle, Flame } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';


interface HotWorkPermit {
  id?: number;
  property_id: string;
  permit_no: string;
  date_of_issue: string;
  location_of_work: string;
  description_of_hot_work: string;
  person_or_agency_performing_work: string;
  supervisor_or_project_incharge_name: string;
  contact_number_worker: string;
  contact_number_supervisor: string;
  start_date_time: string;
  end_date_time: string;
  fire_watch_personnel_assigned: string;
  name_of_fire_watch_personnel: string;
  fire_extinguisher_available: string;
  type_of_fire_extinguisher_provided: string;
  fire_blanket_or_shielding_used: string;
  nearby_flammable_materials_removed_or_covered: string;
  gas_cylinders_condition_verified: string;
  work_area_ventilation_verified: string;
  sparks_and_heat_barriers_installed: string;
  area_wet_down_if_required: string;
  gas_detector_used: string;
  last_gas_test_reading_ppm: number;
  ppe_verified: string[];
  permit_validity_period: string;
  emergency_procedure_explained_to_workers: string;
  area_inspected_before_work_by: string;
  area_inspected_after_work_by: string;
  work_completed_time: string;
  post_work_fire_watch_time: string;
  final_area_clearance_given_by: string;
  signature_of_worker: string;
  signature_of_fire_watcher: string;
  signature_of_safety_officer: string;
  remarks_or_precautions: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/hot-work-permit/';

const emptyHotWorkPermit: HotWorkPermit = {
  property_id: '',
  permit_no: '',
  date_of_issue: '',
  location_of_work: '',
  description_of_hot_work: '',
  person_or_agency_performing_work: '',
  supervisor_or_project_incharge_name: '',
  contact_number_worker: '',
  contact_number_supervisor: '',
  start_date_time: '',
  end_date_time: '',
  fire_watch_personnel_assigned: '',
  name_of_fire_watch_personnel: '',
  fire_extinguisher_available: '',
  type_of_fire_extinguisher_provided: '',
  fire_blanket_or_shielding_used: '',
  nearby_flammable_materials_removed_or_covered: '',
  gas_cylinders_condition_verified: '',
  work_area_ventilation_verified: '',
  sparks_and_heat_barriers_installed: '',
  area_wet_down_if_required: '',
  gas_detector_used: '',
  last_gas_test_reading_ppm: 0,
  ppe_verified: [],
  permit_validity_period: '',
  emergency_procedure_explained_to_workers: '',
  area_inspected_before_work_by: '',
  area_inspected_after_work_by: '',
  work_completed_time: '',
  post_work_fire_watch_time: '',
  final_area_clearance_given_by: '',
  signature_of_worker: '',
  signature_of_fire_watcher: '',
  signature_of_safety_officer: '',
  remarks_or_precautions: ''
};

const HotWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HotWorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: HotWorkPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: HotWorkPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });
  const [editingPpeIndex, setEditingPpeIndex] = useState<number | null>(null);
  const [tempPpeValue, setTempPpeValue] = useState<string>('');

  const handleEdit = (record: HotWorkPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyHotWorkPermit, property_id: user?.propertyId || '' }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete hot work permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this hot work permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete hot work permit');
      }
    }
  };

  const handleView = (record: HotWorkPermit) => {
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
      setError('Failed to save hot work permit');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const filteredData = user?.propertyId 
        ? response.data.filter((item: HotWorkPermit) => item.property_id === user.propertyId)
        : response.data;
      setData(filteredData);
    } catch (e) {
      setError('Failed to fetch hot work permits');
    } finally {
      setLoading(false);
    }
  };



  // PPE Management Handlers
  const handleEditPpe = (index: number, value: string) => {
    setEditingPpeIndex(index);
    setTempPpeValue(value);
  };

  const handleSavePpe = () => {
    if (editingPpeIndex !== null) {
      const newPpe = [...(editModal.record?.ppe_verified || [])];
      newPpe[editingPpeIndex] = tempPpeValue;
      setEditModal({...editModal, record: {...editModal.record!, ppe_verified: newPpe}});
      setEditingPpeIndex(null);
      setTempPpeValue('');
    }
  };

  const handleCancelEditPpe = () => {
    setEditingPpeIndex(null);
    setTempPpeValue('');
  };

  const handleDeletePpe = (index: number) => {
    const newPpe = (editModal.record?.ppe_verified || []).filter((_, i) => i !== index);
    setEditModal({...editModal, record: {...editModal.record!, ppe_verified: newPpe}});
    if (editingPpeIndex === index) {
      setEditingPpeIndex(null);
      setTempPpeValue('');
    } else if (editingPpeIndex !== null && editingPpeIndex > index) {
      setEditingPpeIndex(editingPpeIndex - 1);
    }
  };

  const handleViewPpe = (ppe: string) => {
    alert(`PPE Item: ${ppe}`);
  };

  useEffect(() => {
    if (user) {
      console.log('HotWork - User object:', user);
      console.log('HotWork - UserType:', user.userType);
      console.log('HotWork - Role:', user.role);
      // Since this is the Cadmin section, assume all users have admin privileges
      setIsAdmin(true);
      console.log('HotWork - IsAdmin (Cadmin section):', true);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user?.propertyId]);

  const isPermitActive = (permit: HotWorkPermit) => {
    const now = new Date();
    const startTime = new Date(permit.start_date_time);
    const endTime = new Date(permit.end_date_time);
    return now >= startTime && now <= endTime;
  };

  const getPermitStatus = (permit: HotWorkPermit) => {
    if (permit.final_area_clearance_given_by) return 'Completed';
    if (isPermitActive(permit)) return 'Active';
    return 'Expired';
  };

  const hasFireWatch = (permit: HotWorkPermit) => {
    return permit.fire_watch_personnel_assigned === 'Yes';
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
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hot Work Permits</h1>
                <p className="text-gray-600">Manage hot work permits and fire safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
              >
                <Plus size={18} className="mr-2" />
                Add Hot Work Permit
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
                <p className="text-sm font-medium text-gray-600">Fire Watch</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.filter(permit => hasFireWatch(permit)).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gas Detector</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(permit => permit.gas_detector_used === 'Yes').length}
                </p>
              </div>
              <Flame className="h-8 w-8 text-purple-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fire Watch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.permit_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.date_of_issue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.location_of_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.description_of_hot_work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.start_date_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permit.fire_watch_personnel_assigned === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {permit.fire_watch_personnel_assigned}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <button 
                        onClick={() => handleView(permit)} 
                        className="text-blue-600 mr-2"
                        title="View Hot Work Permit"
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => handleEdit(permit)} 
                            className="text-orange-600 mr-2"
                            title="Edit Hot Work Permit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(permit.id!)} 
                            className="text-red-600"
                            title="Delete Hot Work Permit"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.length === 0 && (
            <div className="text-center py-12">
              <Flame className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hot work permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new hot work permit.</p>
              {isAdmin && (
                <button 
                  onClick={handleAdd} 
                  className="mt-4 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow"
                >
                  Add Hot Work Permit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Hot Work Permit Details</h2>
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
                  <div><b>Permit Number:</b> {viewModal.record.permit_no}</div>
                  <div><b>Issue Date:</b> {viewModal.record.date_of_issue}</div>
                  <div><b>Location:</b> {viewModal.record.location_of_work}</div>
                  <div><b>Start Time:</b> {viewModal.record.start_date_time}</div>
                  <div><b>End Time:</b> {viewModal.record.end_date_time}</div>
                  <div className="md:col-span-2"><b>Work Description:</b> {viewModal.record.description_of_hot_work}</div>
                </div>
              </div>

              {/* Contractor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contractor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Person/Agency:</b> {viewModal.record.person_or_agency_performing_work}</div>
                  <div><b>Supervisor/Project Incharge:</b> {viewModal.record.supervisor_or_project_incharge_name}</div>
                  <div><b>Worker Contact:</b> {viewModal.record.contact_number_worker}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.contact_number_supervisor}</div>
                </div>
              </div>

              {/* Fire Safety Equipment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fire Safety Equipment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Fire Watch Personnel:</b> {viewModal.record.fire_watch_personnel_assigned}</div>
                  <div><b>Fire Watch Name:</b> {viewModal.record.name_of_fire_watch_personnel}</div>
                  <div><b>Fire Extinguisher Available:</b> {viewModal.record.fire_extinguisher_available}</div>
                  <div><b>Fire Extinguisher Type:</b> {viewModal.record.type_of_fire_extinguisher_provided}</div>
                  <div><b>Fire Blanket/Shielding:</b> {viewModal.record.fire_blanket_or_shielding_used}</div>
                </div>
              </div>

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Flammable Materials Removed:</b> {viewModal.record.nearby_flammable_materials_removed_or_covered}</div>
                  <div><b>Gas Cylinders Verified:</b> {viewModal.record.gas_cylinders_condition_verified}</div>
                  <div><b>Work Area Ventilation:</b> {viewModal.record.work_area_ventilation_verified}</div>
                  <div><b>Heat Barriers Installed:</b> {viewModal.record.sparks_and_heat_barriers_installed}</div>
                  <div><b>Area Wet Down:</b> {viewModal.record.area_wet_down_if_required}</div>
                  <div><b>Gas Detector Used:</b> {viewModal.record.gas_detector_used}</div>
                  <div><b>Gas Test Reading (PPM):</b> {viewModal.record.last_gas_test_reading_ppm}</div>
                </div>
              </div>

              {/* PPE Equipment */}
              {viewModal.record.ppe_verified && viewModal.record.ppe_verified.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Protective Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.record.ppe_verified.map((ppe, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {ppe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Completion */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Work Completed Time:</b> {viewModal.record.work_completed_time}</div>
                  <div><b>Post-work Fire Watch:</b> {viewModal.record.post_work_fire_watch_time}</div>
                  <div><b>Area Inspected Before Work By:</b> {viewModal.record.area_inspected_before_work_by}</div>
                  <div><b>Area Inspected After Work By:</b> {viewModal.record.area_inspected_after_work_by}</div>
                  <div><b>Final Clearance Given By:</b> {viewModal.record.final_area_clearance_given_by}</div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Worker Signature:</b> {viewModal.record.signature_of_worker}</div>
                  <div><b>Fire Watcher Signature:</b> {viewModal.record.signature_of_fire_watcher}</div>
                  <div><b>Safety Officer Signature:</b> {viewModal.record.signature_of_safety_officer}</div>
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
                {editModal.isNew ? 'Add New Hot Work Permit' : 'Edit Hot Work Permit'}
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
                    value={editModal.record.permit_no}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_no: e.target.value}})}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.start_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, start_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time</label>
                  <input
                    type="datetime-local"
                    value={editModal.record.end_date_time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, end_date_time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location of Work</label>
                  <input
                    type="text"
                    value={editModal.record.location_of_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, location_of_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
                  <textarea
                    value={editModal.record.description_of_hot_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, description_of_hot_work: e.target.value}})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Contractor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person/Agency</label>
                  <input
                    type="text"
                    value={editModal.record.person_or_agency_performing_work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, person_or_agency_performing_work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor/Project Incharge</label>
                  <input
                    type="text"
                    value={editModal.record.supervisor_or_project_incharge_name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, supervisor_or_project_incharge_name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Contact</label>
                  <input
                    type="text"
                    value={editModal.record.contact_number_worker}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_number_worker: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Contact</label>
                  <input
                    type="text"
                    value={editModal.record.contact_number_supervisor}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, contact_number_supervisor: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Fire Safety */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Watch Personnel Assigned</label>
                  <select
                    value={editModal.record.fire_watch_personnel_assigned}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fire_watch_personnel_assigned: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Watch Personnel Name</label>
                  <input
                    type="text"
                    value={editModal.record.name_of_fire_watch_personnel}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, name_of_fire_watch_personnel: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Extinguisher Available</label>
                  <select
                    value={editModal.record.fire_extinguisher_available}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fire_extinguisher_available: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Extinguisher Type</label>
                  <input
                    type="text"
                    value={editModal.record.type_of_fire_extinguisher_provided}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, type_of_fire_extinguisher_provided: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fire Blanket/Shielding Used</label>
                  <select
                    value={editModal.record.fire_blanket_or_shielding_used}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, fire_blanket_or_shielding_used: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Working Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Working Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flammable Materials Removed/Covered</label>
                    <select
                      value={editModal.record.nearby_flammable_materials_removed_or_covered}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, nearby_flammable_materials_removed_or_covered: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Cylinders Condition Verified</label>
                    <select
                      value={editModal.record.gas_cylinders_condition_verified}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, gas_cylinders_condition_verified: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Area Ventilation Verified</label>
                    <select
                      value={editModal.record.work_area_ventilation_verified}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_area_ventilation_verified: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sparks and Heat Barriers Installed</label>
                    <select
                      value={editModal.record.sparks_and_heat_barriers_installed}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, sparks_and_heat_barriers_installed: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area Wet Down (if required)</label>
                    <select
                      value={editModal.record.area_wet_down_if_required}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, area_wet_down_if_required: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Detector Used</label>
                    <select
                      value={editModal.record.gas_detector_used}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, gas_detector_used: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Test Reading (PPM)</label>
                    <input
                      type="number"
                      value={editModal.record.last_gas_test_reading_ppm}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, last_gas_test_reading_ppm: parseInt(e.target.value)}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* PPE Equipment Management */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Protective Equipment</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPpe = editModal.record?.ppe_verified || [];
                      const newPpe = [...currentPpe, 'New PPE Item'];
                      setEditModal({...editModal, record: {...editModal.record!, ppe_verified: newPpe}});
                    }}
                    className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add PPE</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {(editModal.record?.ppe_verified && editModal.record.ppe_verified.length > 0) ? (
                    editModal.record.ppe_verified.map((ppe, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        {editingPpeIndex === index ? (
                          <input
                            type="text"
                            value={tempPpeValue}
                            onChange={(e) => setTempPpeValue(e.target.value)}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter PPE item"
                          />
                        ) : (
                          <span className="flex-grow px-3 py-2 border border-transparent rounded-lg bg-gray-50">{ppe}</span>
                        )}
                        <div className="flex space-x-1">
                          {editingPpeIndex !== index && (
                            <button
                              type="button"
                              onClick={() => handleViewPpe(ppe)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                              title="View PPE"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {editingPpeIndex === index ? (
                            <>
                              <button
                                type="button"
                                onClick={handleSavePpe}
                                className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-100 transition-colors"
                                title="Save PPE"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditPpe}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEditPpe(index, ppe)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-100 transition-colors"
                              title="Edit PPE"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePpe(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors"
                            title="Delete PPE"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No PPE items added yet. Click "Add PPE" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Completion Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Completion Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permit Validity Period</label>
                    <input
                      type="text"
                      value={editModal.record.permit_validity_period}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, permit_validity_period: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Procedure Explained</label>
                    <select
                      value={editModal.record.emergency_procedure_explained_to_workers}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, emergency_procedure_explained_to_workers: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area Inspected Before Work By</label>
                    <input
                      type="text"
                      value={editModal.record.area_inspected_before_work_by}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, area_inspected_before_work_by: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area Inspected After Work By</label>
                    <input
                      type="text"
                      value={editModal.record.area_inspected_after_work_by}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, area_inspected_after_work_by: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Completed Time</label>
                    <input
                      type="datetime-local"
                      value={editModal.record.work_completed_time}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, work_completed_time: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post-work Fire Watch Time</label>
                    <input
                      type="datetime-local"
                      value={editModal.record.post_work_fire_watch_time}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, post_work_fire_watch_time: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Area Clearance Given By</label>
                    <input
                      type="text"
                      value={editModal.record.final_area_clearance_given_by}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, final_area_clearance_given_by: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_worker}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, signature_of_worker: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fire Watcher Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_fire_watcher}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, signature_of_fire_watcher: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Safety Officer Signature</label>
                    <input
                      type="text"
                      value={editModal.record.signature_of_safety_officer}
                      onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, signature_of_safety_officer: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
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
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModal({ open: false, record: null, isNew: false })}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotWorkPage;
    