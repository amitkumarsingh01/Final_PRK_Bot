import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface StaffEntryManagement {
  id?: string;
  report_id?: string;
  staff_id: string;
  name: string;
  contact_number: string;
  department: string;
  entry_date: string;
  entry_time: string;
  exit_time?: string;
  gate_no: string;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  staff_entry_management: StaffEntryManagement[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyStaff: StaffEntryManagement = {
  staff_id: '',
  name: '',
  contact_number: '',
  department: '',
  entry_date: '',
  entry_time: '',
  exit_time: '',
  gate_no: '',
  security_officer: '',
  remarks: '',
};

const CStaEntryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: StaffEntryManagement | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: StaffEntryManagement | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  // Check if current user is admin or property user
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Fetch properties based on user type
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (isAdmin) {
          // Admin sees all properties
          const res = await axios.get(PROPERTIES_URL);
          setProperties(res.data);
        } else if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees their assigned property
          const res = await axios.get(`${PROPERTIES_URL}/${currentUserPropertyId}`);
          const property = res.data;
          setProperties([property]);
          // Automatically set the property for property users
          setSelectedPropertyId(currentUserPropertyId);
        }
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, [isAdmin, isPropertyUser, currentUserPropertyId]);

  // For property users, automatically set their property
  useEffect(() => {
    if (user?.userType === 'property_user' && user?.propertyId) {
      setSelectedPropertyId(user.propertyId);
      setIsAdmin(false);
    }
  }, [user]);

  // Fetch visitor management reports for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch visitor management reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // CRUD handlers
  const handleEdit = (item: StaffEntryManagement, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyStaff },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      // Find the report
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      // Remove the entry
      const newArr = report.staff_entry_management.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { staff_entry_management: newArr });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: StaffEntryManagement) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: StaffEntryManagement[];
      if (editModal.isNew) {
        newArr = [...report.staff_entry_management, editModal.item];
      } else {
        newArr = report.staff_entry_management.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { staff_entry_management: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
    return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Staff Entry Management</h2>
      {/* Property Selection Dropdown */}
      {isAdmin ? (
        <div className="mb-6 max-w-md">
          <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
            >
              <option value="">Select a property...</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {properties.find(p => p.id === selectedPropertyId)?.name || 'Loading...'}
            </div>
          </div>
        </div>
      )}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Staff ID</th>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Department</th>
              <th className="px-3 py-2 border">Entry Date</th>
              <th className="px-3 py-2 border">Entry Time</th>
              <th className="px-3 py-2 border">Exit Time</th>
              <th className="px-3 py-2 border">Gate No</th>
              <th className="px-3 py-2 border">Security Officer</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.staff_entry_management.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.staff_id}</td>
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{item.contact_number}</td>
                      <td className="border px-2 py-1">{item.department}</td>
                      <td className="border px-2 py-1">{item.entry_date}</td>
                      <td className="border px-2 py-1">{item.entry_time}</td>
                      <td className="border px-2 py-1">{item.exit_time || '-'}</td>
                      <td className="border px-2 py-1">{item.gate_no}</td>
                      <td className="border px-2 py-1">{item.security_officer}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {/* Add Button (only if a report exists for the property) */}
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Staff Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Staff Entry
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Staff ID" value={editModal.item.staff_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, staff_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Name" value={editModal.item.name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Number" value={editModal.item.contact_number} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contact_number: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Department" value={editModal.item.department} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, department: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Entry Date" type="date" value={editModal.item.entry_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, entry_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Entry Time" type="time" value={editModal.item.entry_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, entry_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Exit Time" type="time" value={editModal.item.exit_time || ''} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, exit_time: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Gate No" value={editModal.item.gate_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, gate_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Security Officer" value={editModal.item.security_officer} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, security_officer: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Staff Entry
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Staff ID:</b> {viewModal.item.staff_id}</div>
              <div><b>Name:</b> {viewModal.item.name}</div>
              <div><b>Contact Number:</b> {viewModal.item.contact_number}</div>
              <div><b>Department:</b> {viewModal.item.department}</div>
              <div><b>Entry Date:</b> {viewModal.item.entry_date}</div>
              <div><b>Entry Time:</b> {viewModal.item.entry_time}</div>
              <div><b>Exit Time:</b> {viewModal.item.exit_time || '-'}</div>
              <div><b>Gate No:</b> {viewModal.item.gate_no}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
        </div>
    );
};

export default CStaEntryManagementPage;
