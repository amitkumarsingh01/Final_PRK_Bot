import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// --- Types matching backend API ---
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface VendorEntryManagement {
  id?: string;
  report_id?: string;
  vendor_id: string;
  vendor_name: string;
  company_name: string;
  contact_number: string;
  entry_date: string;
  entry_time: string;
  gate_no: string;
  vehicle_no: string;
  driver_name: string;
  purpose: string;
  security_officer: string;
  remarks: string;
}

interface VisitorManagementReport {
  id: string;
  property_id: string;
  vendor_entry_management: VendorEntryManagement[];
  // ... other child arrays omitted for brevity
}

const API_URL = 'https://server.prktechindia.in/visitor-management-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyVendor: VendorEntryManagement = {
  vendor_id: '',
  vendor_name: '',
  company_name: '',
  contact_number: '',
  entry_date: '',
  entry_time: '',
  gate_no: '',
  vehicle_no: '',
  driver_name: '',
  purpose: '',
  security_officer: '',
  remarks: '',
};

const VendorEntryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<VisitorManagementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: VendorEntryManagement | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: VendorEntryManagement | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  // Fetch properties and user's default property_id
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
    // Fetch user's default property_id from profile
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
        // All users can add/edit, only admin and cadmin can delete
        setCanEdit(true);
        setCanDelete(matchedUser && (matchedUser.user_role === 'admin' || matchedUser.user_role === 'cadmin'));
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  // Fetch visitor management reports for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
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
  const handleEdit = (item: VendorEntryManagement, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyVendor },
      reportId,
    });
  };
  
  // Create an empty report for the property if none exists
  const ensureReportForProperty = async (): Promise<string | null> => {
    if (data.length > 0) return data[0].id;
    if (!selectedPropertyId) return null;
    try {
      const res = await axios.post(API_URL, {
        property_id: selectedPropertyId,
        vendor_entry_management: [],
      }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const created = res.data;
      setData([created, ...data]);
      return created.id as string;
    } catch (e) {
      setError('Failed to initialize report for this property');
      return null;
    }
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      // Find the report
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      // Remove the entry
      const newArr = report.vendor_entry_management.filter(i => i.id !== itemId);
      // Update the report
      await axios.put(`${API_URL}${reportId}`, { vendor_entry_management: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: VendorEntryManagement) => {
    setViewModal({ open: true, item });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      // Find the report
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: VendorEntryManagement[];
      if (editModal.isNew) {
        const newEntry = { ...editModal.item };
        delete newEntry.id; // Remove id field for new entries
        newArr = [...report.vendor_entry_management, newEntry];
      } else {
        newArr = report.vendor_entry_management.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { vendor_entry_management: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Main render
  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Vendor Entry Management</h2>
      {/* Property Selection Dropdown */}
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
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Vendor ID</th>
              <th className="px-3 py-2 border">Vendor Name</th>
              <th className="px-3 py-2 border">Company Name</th>
              <th className="px-3 py-2 border">Contact</th>
              <th className="px-3 py-2 border">Entry Date</th>
              <th className="px-3 py-2 border">Entry Time</th>
              <th className="px-3 py-2 border">Gate No</th>
              <th className="px-3 py-2 border">Vehicle No</th>
              <th className="px-3 py-2 border">Driver</th>
              <th className="px-3 py-2 border">Purpose</th>
              <th className="px-3 py-2 border">Security Officer</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report) =>
                  report.vendor_entry_management.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.vendor_id}</td>
                      <td className="border px-2 py-1">{item.vendor_name}</td>
                      <td className="border px-2 py-1">{item.company_name}</td>
                      <td className="border px-2 py-1">{item.contact_number}</td>
                      <td className="border px-2 py-1">{item.entry_date}</td>
                      <td className="border px-2 py-1">{item.entry_time}</td>
                      <td className="border px-2 py-1">{item.gate_no}</td>
                      <td className="border px-2 py-1">{item.vehicle_no}</td>
                      <td className="border px-2 py-1">{item.driver_name}</td>
                      <td className="border px-2 py-1">{item.purpose}</td>
                      <td className="border px-2 py-1">{item.security_officer}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {canEdit && (
                          <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
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
      {/* Add Button */}
      {canEdit && (
        <button
          onClick={async () => { const id = await ensureReportForProperty(); if (id) handleAdd(id); }}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Vendor Entry
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Vendor Entry
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
                <input className="border rounded px-3 py-2" placeholder="Vendor ID" value={editModal.item.vendor_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vendor_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vendor Name" value={editModal.item.vendor_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vendor_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Company Name" value={editModal.item.company_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, company_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Number" value={editModal.item.contact_number} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, contact_number: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Entry Date" type="date" value={editModal.item.entry_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, entry_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Entry Time" type="time" value={editModal.item.entry_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, entry_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Gate No" value={editModal.item.gate_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, gate_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Vehicle No" value={editModal.item.vehicle_no} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, vehicle_no: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Driver Name" value={editModal.item.driver_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, driver_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Purpose" value={editModal.item.purpose} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, purpose: e.target.value } })} required />
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
                Vendor Entry
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Vendor ID:</b> {viewModal.item.vendor_id}</div>
              <div><b>Vendor Name:</b> {viewModal.item.vendor_name}</div>
              <div><b>Company Name:</b> {viewModal.item.company_name}</div>
              <div><b>Contact Number:</b> {viewModal.item.contact_number}</div>
              <div><b>Entry Date:</b> {viewModal.item.entry_date}</div>
              <div><b>Entry Time:</b> {viewModal.item.entry_time}</div>
              <div><b>Gate No:</b> {viewModal.item.gate_no}</div>
              <div><b>Vehicle No:</b> {viewModal.item.vehicle_no}</div>
              <div><b>Driver Name:</b> {viewModal.item.driver_name}</div>
              <div><b>Purpose:</b> {viewModal.item.purpose}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorEntryManagementPage;
