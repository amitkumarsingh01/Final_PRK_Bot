import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, FileText, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext'; 

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface WorkingAlonePermit {
  id?: number;
  property_id: string;
  S_No: number;
  Date: string;
  Employee_Name: string;
  Employee_ID: string;
  Department: string;
  Designation: string;
  Contact_Number: string;
  Site_Location_of_Work: string;
  Nature_of_Task: string;
  Reason_for_Working_Alone: string;
  Work_Start_Time: string;
  Estimated_Completion_Time: string;
  Supervisor_Name: string;
  Supervisor_Contact_Number: string;
  Communication_Method: string;
  Last_Check_In_Time: string;
  Next_Check_In_Schedule: string;
  Emergency_Contact_Name: string;
  Emergency_Contact_Number: string;
  First_Aid_Kit_Available: string;
  Personal_Protective_Equipment_Used: string;
  Lone_Worker_Training_Completed: string;
  Risk_Assessment_Completed: string;
  Emergency_Procedures_Explained: string;
  Safety_Hazards_Identified: string;
  Control_Measures_Implemented: string;
  Special_Instructions: string;
  Approved_By: string;
  Approver_Designation: string;
  Approver_Signature: string;
  Employee_Signature: string;
  Remarks: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/working-alone-permit/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';

const emptyWorkingAlonePermit: WorkingAlonePermit = {
  property_id: '',
  S_No: 1,
  Date: '',
  Employee_Name: '',
  Employee_ID: '',
  Department: '',
  Designation: '',
  Contact_Number: '',
  Site_Location_of_Work: '',
  Nature_of_Task: '',
  Reason_for_Working_Alone: '',
  Work_Start_Time: '',
  Estimated_Completion_Time: '',
  Supervisor_Name: '',
  Supervisor_Contact_Number: '',
  Communication_Method: '',
  Last_Check_In_Time: '',
  Next_Check_In_Schedule: '',
  Emergency_Contact_Name: '',
  Emergency_Contact_Number: '',
  First_Aid_Kit_Available: '',
  Personal_Protective_Equipment_Used: '',
  Lone_Worker_Training_Completed: '',
  Risk_Assessment_Completed: '',
  Emergency_Procedures_Explained: '',
  Safety_Hazards_Identified: '',
  Control_Measures_Implemented: '',
  Special_Instructions: '',
  Approved_By: '',
  Approver_Designation: '',
  Approver_Signature: '',
  Employee_Signature: '',
  Remarks: ''
};

const WorkingAlonePage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<WorkingAlonePermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; record: WorkingAlonePermit | null }>({ open: false, record: null });
  const [editModal, setEditModal] = useState<{ open: boolean; record: WorkingAlonePermit | null; isNew: boolean }>({ open: false, record: null, isNew: false });

  const handleEdit = (record: WorkingAlonePermit) => {
    setEditModal({ open: true, record: { ...record }, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({ open: true, record: { ...emptyWorkingAlonePermit, property_id: user?.propertyId }, isNew: true });
  };

  const handleDelete = async (recordId: number) => {
    if (!isAdmin) {
      alert('Only admins can delete working alone permits');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this working alone permit?')) {
      try {
        await axios.delete(`${API_URL}${recordId}`);
        fetchData();
      } catch (e) {
        setError('Failed to delete working alone permit');
      }
    }
  };

  const handleView = (record: WorkingAlonePermit) => {
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
      setError('Failed to save working alone permit');
    }
  };

  
  };

  const isPermitActive = (permit: WorkingAlonePermit) => {
    const now = new Date();
    const workDate = new Date(permit.Date);
    const startTime = new Date(`${permit.Date}T${permit.Work_Start_Time}`);
    const endTime = new Date(`${permit.Date}T${permit.Estimated_Completion_Time}`);
    return now >= startTime && now <= endTime;
  };

  const getPermitStatus = (permit: WorkingAlonePermit) => {
    if (isPermitActive(permit)) return 'Active';
    const now = new Date();
    const workDate = new Date(permit.Date);
    const endTime = new Date(`${permit.Date}T${permit.Estimated_Completion_Time}`);
    if (now > endTime) return 'Completed';
    return 'Scheduled';
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
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Working Alone Permits</h1>
                <p className="text-gray-600">Manage working alone permits and lone worker safety</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Working Alone Permit</span>
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
                <p className="text-sm font-medium text-gray-600">Today's Permits</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.filter(permit => {
                    const permitDate = new Date(permit.Date);
                    const today = new Date();
                    return permitDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trained Workers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.filter(permit => permit.Lone_Worker_Training_Completed === 'Yes').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-500" />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.S_No}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{permit.Employee_Name}</div>
                        <div className="text-gray-500">{permit.Employee_ID}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.Department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.Site_Location_of_Work}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permit.Work_Start_Time} - {permit.Estimated_Completion_Time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permit.Lone_Worker_Training_Completed === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {permit.Lone_Worker_Training_Completed === 'Yes' ? 'Trained' : 'Not Trained'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getPermitStatus(permit) === 'Active' ? 'bg-green-100 text-green-800' :
                        getPermitStatus(permit) === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
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
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No working alone permits</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new working alone permit.</p>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.record && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Working Alone Permit Details</h2>
              <button
                onClick={() => setViewModal({ open: false, record: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>S.No:</b> {viewModal.record.S_No}</div>
                  <div><b>Date:</b> {viewModal.record.Date}</div>
                  <div><b>Employee Name:</b> {viewModal.record.Employee_Name}</div>
                  <div><b>Employee ID:</b> {viewModal.record.Employee_ID}</div>
                  <div><b>Department:</b> {viewModal.record.Department}</div>
                  <div><b>Designation:</b> {viewModal.record.Designation}</div>
                  <div><b>Contact Number:</b> {viewModal.record.Contact_Number}</div>
                </div>
              </div>

              {/* Work Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Site Location:</b> {viewModal.record.Site_Location_of_Work}</div>
                  <div><b>Nature of Task:</b> {viewModal.record.Nature_of_Task}</div>
                  <div><b>Reason for Working Alone:</b> {viewModal.record.Reason_for_Working_Alone}</div>
                  <div><b>Work Start Time:</b> {viewModal.record.Work_Start_Time}</div>
                  <div><b>Estimated Completion Time:</b> {viewModal.record.Estimated_Completion_Time}</div>
                </div>
              </div>

              {/* Supervisor & Communication */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supervisor & Communication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Supervisor Name:</b> {viewModal.record.Supervisor_Name}</div>
                  <div><b>Supervisor Contact:</b> {viewModal.record.Supervisor_Contact_Number}</div>
                  <div><b>Communication Method:</b> {viewModal.record.Communication_Method}</div>
                  <div><b>Last Check-in Time:</b> {viewModal.record.Last_Check_In_Time}</div>
                  <div><b>Next Check-in Schedule:</b> {viewModal.record.Next_Check_In_Schedule}</div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Emergency Contact Name:</b> {viewModal.record.Emergency_Contact_Name}</div>
                  <div><b>Emergency Contact Number:</b> {viewModal.record.Emergency_Contact_Number}</div>
                </div>
              </div>

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>First Aid Kit Available:</b> {viewModal.record.First_Aid_Kit_Available}</div>
                  <div><b>PPE Used:</b> {viewModal.record.Personal_Protective_Equipment_Used}</div>
                  <div><b>Lone Worker Training:</b> {viewModal.record.Lone_Worker_Training_Completed}</div>
                  <div><b>Risk Assessment:</b> {viewModal.record.Risk_Assessment_Completed}</div>
                  <div><b>Emergency Procedures:</b> {viewModal.record.Emergency_Procedures_Explained}</div>
                </div>
              </div>

              {/* Safety Hazards & Controls */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Hazards & Controls</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div><b>Safety Hazards Identified:</b> {viewModal.record.Safety_Hazards_Identified}</div>
                  <div><b>Control Measures Implemented:</b> {viewModal.record.Control_Measures_Implemented}</div>
                  <div><b>Special Instructions:</b> {viewModal.record.Special_Instructions}</div>
                </div>
              </div>

              {/* Approvals & Signatures */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Approvals & Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><b>Approved By:</b> {viewModal.record.Approved_By}</div>
                  <div><b>Approver Designation:</b> {viewModal.record.Approver_Designation}</div>
                  <div><b>Approver Signature:</b> {viewModal.record.Approver_Signature}</div>
                  <div><b>Employee Signature:</b> {viewModal.record.Employee_Signature}</div>
                </div>
              </div>

              {/* Remarks */}
              {viewModal.record.Remarks && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Remarks</h3>
                  <p className="text-gray-700">{viewModal.record.Remarks}</p>
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
                {editModal.isNew ? 'Add New Working Alone Permit' : 'Edit Working Alone Permit'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">S.No</label>
                  <input
                    type="number"
                    value={editModal.record.S_No}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, S_No: parseInt(e.target.value)}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editModal.record.Date}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Date: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={editModal.record.Employee_Name}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Employee_Name: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editModal.record.Employee_ID}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Employee_ID: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editModal.record.Department}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Department: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editModal.record.Designation}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Designation: e.target.value}})}
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
                    value={editModal.record.Site_Location_of_Work}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Site_Location_of_Work: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Task</label>
                  <input
                    type="text"
                    value={editModal.record.Nature_of_Task}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Nature_of_Task: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                  <input
                    type="time"
                    value={editModal.record.Work_Start_Time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Work_Start_Time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Completion Time</label>
                  <input
                    type="time"
                    value={editModal.record.Estimated_Completion_Time}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Estimated_Completion_Time: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Safety Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lone Worker Training Completed</label>
                  <select
                    value={editModal.record.Lone_Worker_Training_Completed}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Lone_Worker_Training_Completed: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Assessment Completed</label>
                  <select
                    value={editModal.record.Risk_Assessment_Completed}
                    onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Risk_Assessment_Completed: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={editModal.record.Remarks}
                  onChange={(e) => setEditModal({...editModal, record: {...editModal.record!, Remarks: e.target.value}})}
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

export default WorkingAlonePage;
