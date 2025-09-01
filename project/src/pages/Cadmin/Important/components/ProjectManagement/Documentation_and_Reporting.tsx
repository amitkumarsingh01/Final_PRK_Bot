import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, FileText, Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface DocumentationReporting {
  id: string;
  document_id: string;
  document_type: string;
  title: string;
  created_date: string;
  author: string;
  status: string;
  storage_location: string;
  remarks: string;
}

interface ProjectMaster {
  property_id: string;
  project_initiation: {
    id: string;
    project_id: string;
    project_name: string;
  };
  documentation_reporting: DocumentationReporting[];
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyDocumentationReporting: Omit<DocumentationReporting, 'id'> = {
  document_id: '',
  document_type: '',
  title: '',
  created_date: '',
  author: '',
  status: '',
  storage_location: '',
  remarks: '',
};

const DocumentationReportingPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; document: DocumentationReporting | null; projectName: string }>({ open: false, document: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; document: Omit<DocumentationReporting, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, document: null, isNew: false, projectId: '' });

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
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setProjects(res.data);
    } catch (e) {
      setError('Failed to fetch projects');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (document: DocumentationReporting, projectId: string) => {
    const { id, ...documentData } = document;
    setEditModal({ open: true, document: documentData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      document: { ...emptyDocumentationReporting },
      projectId,
    });
  };

  const handleDelete = async (documentId: string, projectId: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        const updatedDocuments = project.documentation_reporting.filter(d => d.id !== documentId);
        await axios.put(`${API_URL}${projectId}`, {
          documentation_reporting: updatedDocuments
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete document');
    }
  };

  const handleView = (document: DocumentationReporting, projectName: string) => {
    setViewModal({ open: true, document, projectName });
  };

  const handleSave = async () => {
    if (!editModal.document) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project && editModal.document) {
        const document = editModal.document;
        let updatedDocuments: DocumentationReporting[];
        if (editModal.isNew) {
          const newDocument: DocumentationReporting = { 
            id: `temp_${Date.now()}`,
            document_id: document.document_id,
            document_type: document.document_type,
            title: document.title,
            created_date: document.created_date,
            author: document.author,
            status: document.status,
            storage_location: document.storage_location,
            remarks: document.remarks
          };
          updatedDocuments = [...project.documentation_reporting, newDocument];
        } else {
          updatedDocuments = project.documentation_reporting.map(d =>
            d.document_id === document.document_id 
              ? { 
                  id: d.id,
                  document_id: document.document_id,
                  document_type: document.document_type,
                  title: document.title,
                  created_date: document.created_date,
                  author: document.author,
                  status: document.status,
                  storage_location: document.storage_location,
                  remarks: document.remarks
                }
              : d
          );
        }
        
        await axios.put(`${API_URL}${editModal.projectId}`, {
          documentation_reporting: updatedDocuments
        });
        setEditModal({ open: false, document: null, isNew: false, projectId: '' });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'specification': return 'bg-blue-100 text-blue-800';
      case 'report': return 'bg-green-100 text-green-800';
      case 'plan': return 'bg-orange-100 text-orange-800';
      case 'manual': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Flatten all documents from all projects for display
  const getAllDocuments = () => {
    const allDocuments: Array<DocumentationReporting & { projectId: string; projectName: string }> = [];
    projects.forEach(project => {
      project.documentation_reporting.forEach(document => {
        allDocuments.push({
          ...document,
          projectId: project.project_initiation.id,
          projectName: project.project_initiation.project_name
        });
      });
    });
    return allDocuments;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Documentation & Reporting</h2>
      
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

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Documents Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Document ID</th>
              <th className="px-3 py-2 border">Title</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Author</th>
              <th className="px-3 py-2 border">Created Date</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Storage Location</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : getAllDocuments().length === 0 ? (
              <tr><td colSpan={10} className="text-center py-6">No documents found</td></tr>
            ) : (
              getAllDocuments().map((document, idx) => (
                <tr key={document.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1 font-medium">{document.projectName}</td>
                  <td className="border px-2 py-1">{document.document_id}</td>
                  <td className="border px-2 py-1">{document.title}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getDocumentTypeColor(document.document_type)}`}>
                      {document.document_type}
                    </span>
                  </td>
                  <td className="border px-2 py-1">{document.author}</td>
                  <td className="border px-2 py-1">{document.created_date}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1">{document.storage_location}</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(document, document.projectName)} className="text-blue-600 mr-2">
                      <Eye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(document, document.projectId)} className="text-orange-600 mr-2">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(document.id, document.projectId)} className="text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && projects.length > 0 && (
        <div className="mb-6">
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">Add Document to Project:</label>
          <div className="flex gap-2">
            <select
              id="projectSelect"
              className="border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
              onChange={(e) => {
                if (e.target.value) {
                  handleAdd(e.target.value);
                }
              }}
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.project_initiation.id} value={project.project_initiation.id}>
                  {project.project_initiation.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Document
              </h3>
              <button
                onClick={() => setEditModal({ open: false, document: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Document ID" 
                  value={editModal.document.document_id} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, document_id: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Title" 
                  value={editModal.document.title} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, title: e.target.value } })} 
                  required 
                />
                <select 
                  className="border rounded px-3 py-2" 
                  value={editModal.document.document_type} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, document_type: e.target.value } })} 
                  required
                >
                  <option value="">Select Document Type</option>
                  <option value="Contract">Contract</option>
                  <option value="Specification">Specification</option>
                  <option value="Report">Report</option>
                  <option value="Plan">Plan</option>
                  <option value="Manual">Manual</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Requirements">Requirements</option>
                  <option value="Design">Design</option>
                </select>
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Author" 
                  value={editModal.document.author} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, author: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Created Date" 
                  type="date" 
                  value={editModal.document.created_date} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, created_date: e.target.value } })} 
                  required 
                />
                <select 
                  className="border rounded px-3 py-2" 
                  value={editModal.document.status} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, status: e.target.value } })} 
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Storage Location" 
                  value={editModal.document.storage_location} 
                  onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, storage_location: e.target.value } })} 
                  required 
                />
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.document.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, document: { ...m.document!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, document: null, isNew: false, projectId: '' })} 
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Document Details: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, document: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Document ID:</b> {viewModal.document.document_id}</div>
              <div><b>Title:</b> {viewModal.document.title}</div>
              <div><b>Type:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getDocumentTypeColor(viewModal.document.document_type)}`}>
                  {viewModal.document.document_type}
                </span>
              </div>
              <div><b>Author:</b> {viewModal.document.author}</div>
              <div><b>Created Date:</b> {viewModal.document.created_date}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.document.status)}`}>
                  {viewModal.document.status}
                </span>
              </div>
              <div><b>Storage Location:</b> {viewModal.document.storage_location}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.document.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationReportingPage;
