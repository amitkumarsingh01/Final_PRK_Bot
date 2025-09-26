import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface RecordKeeping {
  id?: string;
  report_id?: string;
  Record_ID: string;
  Site_Name: string;
  Record_Type: string;
  Title: string;
  Created_Date: string;
  Author: string;
  Storage_Location: string;
  Retention_Period: string;
  Status: string;
  Remarks: string;
}

interface FireSafetyReport {
  id: string;
  property_id: string;
  records: RecordKeeping[];
}

const API_URL = 'https://server.prktechindia.in/fire-safety-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyRecord: RecordKeeping = {
  Record_ID: '',
  Site_Name: '',
  Record_Type: '',
  Title: '',
  Created_Date: '',
  Author: '',
  Storage_Location: '',
  Retention_Period: '',
  Status: '',
  Remarks: '',
};

const RecordKeepingPage: React.FC = () => {
  console.log('🚀 RecordKeeping: Component initialized');
  const { user } = useAuth();
  console.log('👤 RecordKeeping: User loaded', { userId: user?.userId });
  const [data, setData] = useState<FireSafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: RecordKeeping | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: RecordKeeping | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? arr.filter((r: any) => r.property_id === user.propertyId) : arr;
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token, user?.propertyId]);

  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === user?.propertyId);
      if (existing) return existing.id;
      const res = await axios.post(
        API_URL,
        { property_id: user?.propertyId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      const newId = res.data?.id || res.data?.report?.id || null;
      await fetchData();
      return newId;
    } catch (e) {
      setError('Failed to prepare report for adding');
      return null;
    }
  };

  const handleEdit = (item: RecordKeeping, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyRecord },
      reportId: id,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this record entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.records.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        Fire_Safety_Management: { Record_Keeping: newArr }
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: RecordKeeping) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: RecordKeeping[];
      if (editModal.isNew) {
        newArr = [...report.records, editModal.item];
      } else {
        newArr = report.records.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        Fire_Safety_Management: { Record_Keeping: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Record Keeping</h2>
      
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
              <th className="px-3 py-2 border">Record ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Record Type</th>
              <th className="px-3 py-2 border">Title</th>
              <th className="px-3 py-2 border">Created Date</th>
              <th className="px-3 py-2 border">Author</th>
              <th className="px-3 py-2 border">Storage Location</th>
              <th className="px-3 py-2 border">Retention Period</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : (() => {
              const rows = data.flatMap((report, rIdx) =>
                report.records.map((item, idx) => (
                  <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.Record_ID}</td>
                    <td className="border px-2 py-1">{item.Site_Name}</td>
                    <td className="border px-2 py-1">{item.Record_Type}</td>
                    <td className="border px-2 py-1">{item.Title}</td>
                    <td className="border px-2 py-1">{item.Created_Date}</td>
                    <td className="border px-2 py-1">{item.Author}</td>
                    <td className="border px-2 py-1">{item.Storage_Location}</td>
                    <td className="border px-2 py-1">{item.Retention_Period}</td>
                    <td className="border px-2 py-1">{item.Status}</td>
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
              );
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={11} className="text-center py-6">
                      <div className="flex items-center justify-center gap-3">
                        <span>No record keeping entries found</span>
                        {isAdmin && (
                          <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Record Entry</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <button
          onClick={() => handleAdd(data[0]?.id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Record Entry
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Record Entry
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
                <input className="border rounded px-3 py-2" placeholder="Record ID" value={editModal.item.Record_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Record_ID: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Site Name" value={editModal.item.Site_Name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Site_Name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Record Type" value={editModal.item.Record_Type} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Record_Type: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Title" value={editModal.item.Title} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Title: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Created Date" type="date" value={editModal.item.Created_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Created_Date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Author" value={editModal.item.Author} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Author: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Storage Location" value={editModal.item.Storage_Location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Storage_Location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Retention Period" value={editModal.item.Retention_Period} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Retention_Period: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.Status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Status: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.Remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Remarks: e.target.value } })} />
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Record Entry Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Record ID:</b> {viewModal.item.Record_ID}</div>
              <div><b>Site Name:</b> {viewModal.item.Site_Name}</div>
              <div><b>Record Type:</b> {viewModal.item.Record_Type}</div>
              <div><b>Title:</b> {viewModal.item.Title}</div>
              <div><b>Created Date:</b> {viewModal.item.Created_Date}</div>
              <div><b>Author:</b> {viewModal.item.Author}</div>
              <div><b>Storage Location:</b> {viewModal.item.Storage_Location}</div>
              <div><b>Retention Period:</b> {viewModal.item.Retention_Period}</div>
              <div><b>Status:</b> {viewModal.item.Status}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordKeepingPage;