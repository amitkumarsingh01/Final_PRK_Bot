import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProcurementDocument {
  id?: string;
  report_id?: string;
  Document_ID: string;
  Project_PO_ID: string;
  Document_Type: string;
  Title: string;
  Created_Date: string;
  Author: string;
  Status: string;
  Storage_Location: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  documents: ProcurementDocument[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyDocument: ProcurementDocument = {
  Document_ID: '',
  Project_PO_ID: '',
  Document_Type: '',
  Title: '',
  Created_Date: '',
  Author: '',
  Status: '',
  Storage_Location: '',
  Responsible_Person: '',
  Remarks: '',
};

const ProcurementDocumentationPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; document: ProcurementDocument | null }>({ open: false, document: null });
  const [editModal, setEditModal] = useState<{ open: boolean; document: ProcurementDocument | null; isNew: boolean; reportId: string | null }>({ open: false, document: null, isNew: false, reportId: null });

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
      setData(res.data);
      setError(null);
    } catch (e) {
      setError('Failed to fetch procurement documentation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const getAllDocuments = (): ProcurementDocument[] => {
    return data.flatMap(report => 
      report.documents.map(document => ({
        ...document,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (document: ProcurementDocument, reportId: string) => {
    setEditModal({ open: true, document: { ...document }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, document: { ...emptyDocument }, isNew: true, reportId });
  };

  const handleDelete = async (documentId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedDocuments = report.documents.filter(d => d.id !== documentId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Procurement_Documentation: updatedDocuments
          }
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete document record');
    }
  };

  const handleView = (document: ProcurementDocument) => {
    setViewModal({ open: true, document });
  };

  const handleSave = async () => {
    if (!editModal.document || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedDocuments: ProcurementDocument[];
        if (editModal.isNew) {
          const newDocument = { ...editModal.document, id: `temp_${Date.now()}` };
          updatedDocuments = [...report.documents, newDocument];
        } else {
          updatedDocuments = report.documents.map(d =>
            d.id === editModal.document!.id ? editModal.document! : d
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Procurement_Documentation: updatedDocuments
          }
        });
        setEditModal({ open: false, document: null, isNew: false, reportId: null });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save document record');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: orange }}></div>
      </div>
    );
  }

  const documents = getAllDocuments();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Procurement Documentation</h1>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Select Property:</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm">Total Documents</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {documents.filter(d => d.Status === 'Approved').length}
              </div>
              <div className="text-sm">Approved</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {documents.filter(d => d.Status === 'Pending').length}
              </div>
              <div className="text-sm">Pending</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {documents.filter(d => d.Status === 'Draft').length}
              </div>
              <div className="text-sm">Draft</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Procurement Documents</h2>
              {isAdmin && selectedPropertyId && (
                <button
                  onClick={() => {
                    const report = data[0];
                    if (report) {
                      handleAdd(report.id);
                    }
                  }}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Document</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project/PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{document.Document_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.Project_PO_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.Document_Type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{document.Title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.Author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{document.Created_Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        document.Status === 'Approved' ? 'bg-green-100 text-green-800' :
                        document.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        document.Status === 'Draft' ? 'bg-blue-100 text-blue-800' :
                        document.Status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {document.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(document)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(document, document.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(document.id!, document.report_id!)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
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
        </div>
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Document</h3>
                <button
                  onClick={() => setViewModal({ open: false, document: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Document_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project/PO ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Project_PO_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Document_Type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Author}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Created_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Storage_Location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Responsible_Person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.document.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Document' : 'Edit Document'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, document: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document ID</label>
                  <input
                    type="text"
                    value={editModal.document.Document_ID}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Document_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project/PO ID</label>
                  <input
                    type="text"
                    value={editModal.document.Project_PO_ID}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Project_PO_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    value={editModal.document.Document_Type}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Document_Type: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Contract">Contract</option>
                    <option value="Specification">Specification</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Tender Document">Tender Document</option>
                    <option value="Evaluation Report">Evaluation Report</option>
                    <option value="Approval Document">Approval Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editModal.document.Title}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Title: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    value={editModal.document.Author}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Author: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <input
                    type="date"
                    value={editModal.document.Created_Date}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Created_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editModal.document.Status}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                  <input
                    type="text"
                    value={editModal.document.Storage_Location}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Storage_Location: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.document.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.document.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, document: { ...editModal.document!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, document: null, isNew: false, reportId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
                >
                  <Save size={16} />
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

export default ProcurementDocumentationPage;
