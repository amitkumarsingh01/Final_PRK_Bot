import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface TicketAssignment {
  id?: string;
  community_report_id?: string;
  assignment_id: string;
  ticket_id: string;
  assigned_to: string;
  department: string;
  assignment_date: string;
  assignment_time: string;
  priority: string;
  status: string;
  expected_resolution_date: string;
  security_officer: string;
  remarks: string;
}

interface CommunityReport {
  id: string;
  property_id: string;
  ticket_assignments: TicketAssignment[];
}

const API_URL = 'https://server.prktechindia.in/community-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyAssignment: TicketAssignment = {
  assignment_id: '',
  ticket_id: '',
  assigned_to: '',
  department: '',
  assignment_date: '',
  assignment_time: '',
  priority: '',
  status: '',
  expected_resolution_date: '',
  security_officer: '',
  remarks: '',
};

const TicketAssignmentPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: TicketAssignment | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: TicketAssignment | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

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

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch community reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (item: TicketAssignment, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyAssignment },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.ticket_assignments.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { ticket_assignments: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: TicketAssignment) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: TicketAssignment[];
      if (editModal.isNew) {
        const newEntry = { ...editModal.item };
        delete newEntry.id; // Remove id field for new entries
        newArr = [...report.ticket_assignments, newEntry];
      } else {
        newArr = report.ticket_assignments.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { ticket_assignments: newArr }, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Ticket Assignment</h2>
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
              <th className="px-3 py-2 border">Assignment ID</th>
              <th className="px-3 py-2 border">Ticket ID</th>
              <th className="px-3 py-2 border">Assigned To</th>
              <th className="px-3 py-2 border">Department</th>
              <th className="px-3 py-2 border">Assignment Date</th>
              <th className="px-3 py-2 border">Assignment Time</th>
              <th className="px-3 py-2 border">Priority</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Expected Resolution Date</th>
              <th className="px-3 py-2 border">Security Officer</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report) =>
                  report.ticket_assignments.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.assignment_id}</td>
                      <td className="border px-2 py-1">{item.ticket_id}</td>
                      <td className="border px-2 py-1">{item.assigned_to}</td>
                      <td className="border px-2 py-1">{item.department}</td>
                      <td className="border px-2 py-1">{item.assignment_date}</td>
                      <td className="border px-2 py-1">{item.assignment_time}</td>
                      <td className="border px-2 py-1">{item.priority}</td>
                      <td className="border px-2 py-1">{item.status}</td>
                      <td className="border px-2 py-1">{item.expected_resolution_date}</td>
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
          <Plus size={18} className="mr-2" /> Add Assignment
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Assignment
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
                <input className="border rounded px-3 py-2" placeholder="Assignment ID" value={editModal.item.assignment_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, assignment_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Ticket ID" value={editModal.item.ticket_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, ticket_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Assigned To" value={editModal.item.assigned_to} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, assigned_to: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Department" value={editModal.item.department} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, department: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Assignment Date" type="date" value={editModal.item.assignment_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, assignment_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Assignment Time" type="time" value={editModal.item.assignment_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, assignment_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Priority" value={editModal.item.priority} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, priority: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Expected Resolution Date" type="date" value={editModal.item.expected_resolution_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, expected_resolution_date: e.target.value } })} required />
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
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assignment Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Assignment ID:</b> {viewModal.item.assignment_id}</div>
              <div><b>Ticket ID:</b> {viewModal.item.ticket_id}</div>
              <div><b>Assigned To:</b> {viewModal.item.assigned_to}</div>
              <div><b>Department:</b> {viewModal.item.department}</div>
              <div><b>Assignment Date:</b> {viewModal.item.assignment_date}</div>
              <div><b>Assignment Time:</b> {viewModal.item.assignment_time}</div>
              <div><b>Priority:</b> {viewModal.item.priority}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Expected Resolution Date:</b> {viewModal.item.expected_resolution_date}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketAssignmentPage; 
