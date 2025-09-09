import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface Announcement {
  id?: string;
  community_report_id?: string;
  communication_id: string;
  title: string;
  description: string;
  target_audience: string;
  sent_date: string;
  sent_time: string;
  sent_by: string;
  channel: string;
  status: string;
  security_officer: string;
  remarks: string;
}

interface CommunityReport {
  id: string;
  property_id: string;
  announcements: Announcement[];
}

const API_URL = 'https://server.prktechindia.in/community-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyAnnouncement: Announcement = {
  communication_id: '',
  title: '',
  description: '',
  target_audience: '',
  sent_date: '',
  sent_time: '',
  sent_by: '',
  channel: '',
  status: '',
  security_officer: '',
  remarks: '',
};

const CCommunicationAnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: Announcement | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: Announcement | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: Announcement, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyAnnouncement },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.announcements.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { announcements: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: Announcement) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: Announcement[];
      if (editModal.isNew) {
        newArr = [...report.announcements, editModal.item];
      } else {
        newArr = report.announcements.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { announcements: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Communication Announcements</h2>
      {/* Property Display */}
      <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
            </div>
          </div>
        </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Communication ID</th>
              <th className="px-3 py-2 border">Title</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Target Audience</th>
              <th className="px-3 py-2 border">Sent Date</th>
              <th className="px-3 py-2 border">Sent Time</th>
              <th className="px-3 py-2 border">Channel</th>
              <th className="px-3 py-2 border">Sent By</th>
              <th className="px-3 py-2 border">Status</th>
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
                {data.flatMap((report, rIdx) =>
                  report.announcements.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.communication_id}</td>
                      <td className="border px-2 py-1">{item.title}</td>
                      <td className="border px-2 py-1">{item.description}</td>
                      <td className="border px-2 py-1">{item.target_audience}</td>
                      <td className="border px-2 py-1">{item.sent_date}</td>
                      <td className="border px-2 py-1">{item.sent_time}</td>
                      <td className="border px-2 py-1">{item.channel}</td>
                      <td className="border px-2 py-1">{item.sent_by}</td>
                      <td className="border px-2 py-1">{item.status}</td>
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
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Announcement
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Announcement
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
                <input className="border rounded px-3 py-2" placeholder="Communication ID" value={editModal.item.communication_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, communication_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Title" value={editModal.item.title} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, title: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Description" value={editModal.item.description} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, description: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Target Audience" value={editModal.item.target_audience} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, target_audience: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Sent Date" type="date" value={editModal.item.sent_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sent_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Sent Time" type="time" value={editModal.item.sent_time} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sent_time: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Channel" value={editModal.item.channel} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, channel: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Sent By" value={editModal.item.sent_by} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, sent_by: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
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
                Announcement Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Communication ID:</b> {viewModal.item.communication_id}</div>
              <div><b>Title:</b> {viewModal.item.title}</div>
              <div><b>Description:</b> {viewModal.item.description}</div>
              <div><b>Target Audience:</b> {viewModal.item.target_audience}</div>
              <div><b>Sent Date:</b> {viewModal.item.sent_date}</div>
              <div><b>Sent Time:</b> {viewModal.item.sent_time}</div>
              <div><b>Channel:</b> {viewModal.item.channel}</div>
              <div><b>Sent By:</b> {viewModal.item.sent_by}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Security Officer:</b> {viewModal.item.security_officer}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCommunicationAnnouncementsPage; 
