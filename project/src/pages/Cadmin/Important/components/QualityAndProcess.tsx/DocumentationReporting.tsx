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

interface QualityDocument {
  id?: string;
  quality_report_id?: string;
  document_id: string;
  project_process_id: string;
  document_type: string;
  title: string;
  created_date: string;
  author: string;
  status: string;
  storage_location: string;
  responsible_person: string;
  remarks: string;
}

interface QualityReport {
  id: string;
  property_id: string;
  documents: QualityDocument[];
}

const API_URL = 'https://server.prktechindia.in/quality-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyQualityDocument: QualityDocument = {
  document_id: '',
  project_process_id: '',
  document_type: '',
  title: '',
  created_date: '',
  author: '',
  status: '',
  storage_location: '',
  responsible_person: '',
  remarks: '',
};

const DocumentationReportingPage: React.FC = () => {
  console.log('🚀 DocumentationReporting: Component initialized');
  const { user } = useAuth();
  console.log('👤 DocumentationReporting: User loaded', { userId: user?.userId });
  const [data, setData] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: QualityDocument | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: QualityDocument | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: QualityDocument, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyQualityDocument },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this quality document?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.documents.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { documents: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: QualityDocument) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: QualityDocument[];
      if (editModal.isNew) {
        newArr = [...report.documents, editModal.item];
      } else {
        newArr = report.documents.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { documents: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Obsolete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Documentation & Reporting</h2>
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
              <th className="px-3 py-2 border">Document ID</th>
              <th className="px-3 py-2 border">Project/Process ID</th>
              <th className="px-3 py-2 border">Document Type</th>
              <th className="px-3 py-2 border">Title</th>
              <th className="px-3 py-2 border">Created Date</th>
              <th className="px-3 py-2 border">Author</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Storage Location</th>
              <th className="px-3 py-2 border">Responsible Person</th>
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
                  report.documents.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.document_id}</td>
                      <td className="border px-2 py-1">{item.project_process_id}</td>
                      <td className="border px-2 py-1">{item.document_type}</td>
                      <td className="border px-2 py-1">{item.title}</td>
                      <td className="border px-2 py-1">{item.created_date}</td>
                      <td className="border px-2 py-1">{item.author}</td>
                      <td className="border px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">{item.storage_location}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
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
          <Plus size={18} className="mr-2" /> Add Quality Document
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Quality Document
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
                <input className="border rounded px-3 py-2" placeholder="Document ID" value={editModal.item.document_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, document_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Project/Process ID" value={editModal.item.project_process_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, project_process_id: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Title" value={editModal.item.title} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, title: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Created Date" type="date" value={editModal.item.created_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, created_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Author" value={editModal.item.author} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, author: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Storage Location" value={editModal.item.storage_location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, storage_location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} rows={3} />
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Quality Document Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Document ID:</b> {viewModal.item.document_id}</div>
              <div><b>Project/Process ID:</b> {viewModal.item.project_process_id}</div>
              <div><b>Document Type:</b> {viewModal.item.document_type}</div>
              <div><b>Title:</b> {viewModal.item.title}</div>
              <div><b>Created Date:</b> {viewModal.item.created_date}</div>
              <div><b>Author:</b> {viewModal.item.author}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.item.status)}`}>
                  {viewModal.item.status}
                </span>
              </div>
              <div><b>Storage Location:</b> {viewModal.item.storage_location}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationReportingPage; 
