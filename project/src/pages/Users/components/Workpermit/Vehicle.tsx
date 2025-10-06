import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, Truck } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VehicleEntryPermit {
  id?: number;
  property_id: string;
  permit_number: string;
  date_of_issue: string;
  permit_valid_from: string;
  permit_valid_to: string;
  site_location_of_entry: string;
  nature_of_vehicle_work: string;
  contractor_agency_name: string;
  contact_details_contractor: string;
  supervisor_name_on_site: string;
  contact_details_supervisor: string;
  number_of_vehicles_involved: number;
  vehicle_types: string[];
  vehicle_registration_numbers: string[];
  driver_names: string[];
  driver_license_numbers: string[];
  driver_contact_numbers: string[];
  vehicle_insurance_valid: string;
  vehicle_fitness_certificate_valid: string;
  vehicle_pollution_certificate_valid: string;
  vehicle_permit_valid: string;
  driver_license_valid: string;
  driver_medical_certificate_valid: string;
  vehicle_safety_equipment_checked: string;
  fire_extinguisher_available: string;
  first_aid_kit_available: string;
  emergency_contact_details: string;
  route_plan_approved: string;
  speed_limit_restrictions: string;
  parking_area_assigned: string;
  security_clearance_given: string;
  work_authorization_by: string;
  pre_entry_site_inspection_done: string;
  signature_of_supervisor: string;
  signature_of_security_officer: string;
  signature_of_contractor: string;
  entry_time: string;
  exit_time: string;
  post_exit_inspection_done_by: string;
  final_clearance_given: string;
  vehicle_exit_verified: string;
  remarks_or_observations: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/vehicle-entry-permit/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyVehicleEntryPermit: VehicleEntryPermit = {
  property_id: '',
  permit_number: '',
  date_of_issue: '',
  permit_valid_from: '',
  permit_valid_to: '',
  site_location_of_entry: '',
  nature_of_vehicle_work: '',
  contractor_agency_name: '',
  contact_details_contractor: '',
  supervisor_name_on_site: '',
  contact_details_supervisor: '',
  number_of_vehicles_involved: 0,
  vehicle_types: [],
  vehicle_registration_numbers: [],
  driver_names: [],
  driver_license_numbers: [],
  driver_contact_numbers: [],
  vehicle_insurance_valid: '',
  vehicle_fitness_certificate_valid: '',
  vehicle_pollution_certificate_valid: '',
  vehicle_permit_valid: '',
  driver_license_valid: '',
  driver_medical_certificate_valid: '',
  vehicle_safety_equipment_checked: '',
  fire_extinguisher_available: '',
  first_aid_kit_available: '',
  emergency_contact_details: '',
  route_plan_approved: '',
  speed_limit_restrictions: '',
  parking_area_assigned: '',
  security_clearance_given: '',
  work_authorization_by: '',
  pre_entry_site_inspection_done: '',
  signature_of_supervisor: '',
  signature_of_security_officer: '',
  signature_of_contractor: '',
  entry_time: '',
  exit_time: '',
  post_exit_inspection_done_by: '',
  final_clearance_given: '',
  vehicle_exit_verified: '',
  remarks_or_observations: ''
};

const VehicleEntryPermitPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VehicleEntryPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: VehicleEntryPermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: VehicleEntryPermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: VehicleEntryPermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyVehicleEntryPermit, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete vehicle entry permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this vehicle entry permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete vehicle entry permit');
      }
    }
  };

  const handleView = (record: VehicleEntryPermit) => {
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
      setError('Failed to save vehicle entry permit');
    }
  };

  
  };

  const isPermitActive = (permit: VehicleEntryPermit) => {
    const now = new Date();
    const validFrom = new Date(permit.permit_valid_from);
    const validTo = new Date(permit.permit_valid_to);
    return now >= validFrom && now <= validTo;
  };

  const getPermitStatus = (permit: VehicleEntryPermit) => {
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
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Entry Permits</h1>
                <p className="text-gray-600">Manage vehicle entry permits and safety compliance</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Vehicle Permit</span>
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
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, permit) => sum + permit.number_of_vehicles_involved, 0)}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicles</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.site_location_of_entry}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.contractor_agency_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.number_of_vehicles_involved}</td>
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
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicle entry permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new vehicle permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vehicle Entry Permit Details</h2>
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
                  <div><b>Entry Location:</b> {viewModal.record.site_location_of_entry}</div>
                  <div><b>Nature of Work:</b> {viewModal.record.nature_of_vehicle_work}</div>
                  <div><b>Number of Vehicles:</b> {viewModal.record.number_of_vehicles_involved}</div>
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
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle & Driver Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Driver Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">License No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewModal.record.vehicle_types.map((_, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{viewModal.record.vehicle_types[index]}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{viewModal.record.vehicle_registration_numbers[index]}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{viewModal.record.driver_names[index]}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{viewModal.record.driver_license_numbers[index]}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{viewModal.record.driver_contact_numbers[index]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vehicle Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Insurance Valid:</b> {viewModal.record.vehicle_insurance_valid}</div>
                  <div><b>Fitness Certificate:</b> {viewModal.record.vehicle_fitness_certificate_valid}</div>
                  <div><b>Pollution Certificate:</b> {viewModal.record.vehicle_pollution_certificate_valid}</div>
                  <div><b>Vehicle Permit:</b> {viewModal.record.vehicle_permit_valid}</div>
                  <div><b>Driver License:</b> {viewModal.record.driver_license_valid}</div>
                  <div><b>Medical Certificate:</b> {viewModal.record.driver_medical_certificate_valid}</div>
                </div>
              </div>

              {/* Safety & Security */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety & Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Safety Equipment:</b> {viewModal.record.vehicle_safety_equipment_checked}</div>
                  <div><b>Fire Extinguisher:</b> {viewModal.record.fire_extinguisher_available}</div>
                  <div><b>First Aid Kit:</b> {viewModal.record.first_aid_kit_available}</div>
                  <div><b>Emergency Contacts:</b> {viewModal.record.emergency_contact_details}</div>
                  <div><b>Route Plan Approved:</b> {viewModal.record.route_plan_approved}</div>
                  <div><b>Speed Restrictions:</b> {viewModal.record.speed_limit_restrictions}</div>
                  <div><b>Parking Assigned:</b> {viewModal.record.parking_area_assigned}</div>
                  <div><b>Security Clearance:</b> {viewModal.record.security_clearance_given}</div>
                </div>
              </div>

              {/* Entry/Exit Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Entry & Exit Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Entry Time:</b> {viewModal.record.entry_time}</div>
                  <div><b>Exit Time:</b> {viewModal.record.exit_time}</div>
                  <div><b>Pre-entry Inspection:</b> {viewModal.record.pre_entry_site_inspection_done}</div>
                  <div><b>Post-exit Inspection:</b> {viewModal.record.post_exit_inspection_done_by}</div>
                  <div><b>Final Clearance:</b> {viewModal.record.final_clearance_given}</div>
                  <div><b>Exit Verified:</b> {viewModal.record.vehicle_exit_verified}</div>
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><b>Supervisor:</b> {viewModal.record.signature_of_supervisor}</div>
                  <div><b>Security Officer:</b> {viewModal.record.signature_of_security_officer}</div>
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
    </div>
  );
};

export default VehicleEntryPermitPage;
