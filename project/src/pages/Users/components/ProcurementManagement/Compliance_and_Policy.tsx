import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ComplianceRecord {
  id?: string;
  report_id?: string;
  Compliance_ID: string;
  Project_PO_ID: string;
  Policy_Regulation: string;
  Audit_Date: string;
  Auditor: string;
  Findings: string;
  Compliance_Status: string;
  Corrective_Actions: string;
  Next_Audit_Date: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  compliances: ComplianceRecord[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyComplianceRecord: ComplianceRecord = {
  Compliance_ID: '',
  Project_PO_ID: '',
  Policy_Regulation: '',
  Audit_Date: '',
  Auditor: '',
  Findings: '',
  Compliance_Status: '',
  Corrective_Actions: '',
  Next_Audit_Date: '',
  Remarks: '',
};

const ComplianceAndPolicyPage: React.FC = () => {
  console.log('🚀 ComplianceAndPolicy: Component initialized');
  const { user } = useAuth();
  console.log('👤 ComplianceAndPolicy: User loaded', { userId: user?.userId });
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; compliance: ComplianceRecord | null }>({ open: false, compliance: null });
  const [editModal, setEditModal] = useState<{ open: boolean; compliance: ComplianceRecord | null; isNew: boolean; reportId: string | null }>({ open: false, compliance: null, isNew: false, reportId: null });

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

  const getAllCompliances = (): ComplianceRecord[] => {
    return data.flatMap(report => 
      report.compliances.map(compliance => ({
        ...compliance,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (compliance: ComplianceRecord, reportId: string) => {
    setEditModal({ open: true, compliance: { ...compliance }, isNew: false, reportId });
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, compliance: { ...emptyComplianceRecord }, isNew: true, reportId: id });
  };

  const handleDelete = async (complianceId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this compliance record?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedCompliances = report.compliances.filter(c => c.id !== complianceId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Compliance_and_Policy: updatedCompliances
          }
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete compliance record');
    }
  };

  const handleView = (compliance: ComplianceRecord) => {
    setViewModal({ open: true, compliance });
  };

  const handleSave = async () => {
    if (!editModal.compliance || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedCompliances: ComplianceRecord[];
        if (editModal.isNew) {
          const newCompliance = { ...editModal.compliance, id: `temp_${Date.now()}` };
          updatedCompliances = [...report.compliances, newCompliance];
        } else {
          updatedCompliances = report.compliances.map(c =>
            c.id === editModal.compliance!.id ? editModal.compliance! : c
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Compliance_and_Policy: updatedCompliances
          }
        });
        setEditModal({ open: false, compliance: null, isNew: false, reportId: null });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save compliance record');
    }
  };

  
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: orange }}></div>
      </div>
    );
  }

  const compliances = getAllCompliances();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Compliance and Policy</h1>
            </div>
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
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{compliances.length}</div>
              <div className="text-sm">Total Audits</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {compliances.filter(c => c.Compliance_Status === 'Compliant').length}
              </div>
              <div className="text-sm">Compliant</div>
            </div>
            <div className="bg-gradient-to-r from-red-400 to-red-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {compliances.filter(c => c.Compliance_Status === 'Non-Compliant').length}
              </div>
              <div className="text-sm">Non-Compliant</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {compliances.filter(c => c.Compliance_Status === 'Pending Review').length}
              </div>
              <div className="text-sm">Pending Review</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Compliance Records</h2>
              {isAdmin && user?.propertyId && (
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
                  <span>Add Compliance</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project/PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy/Regulation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Audit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compliances.map((compliance) => (
                  <tr key={compliance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compliance.Compliance_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compliance.Project_PO_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compliance.Policy_Regulation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compliance.Audit_Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compliance.Auditor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.Compliance_Status === 'Compliant' ? 'bg-green-100 text-green-800' :
                        compliance.Compliance_Status === 'Non-Compliant' ? 'bg-red-100 text-red-800' :
                        compliance.Compliance_Status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                        compliance.Compliance_Status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.Compliance_Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compliance.Next_Audit_Date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(compliance)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(compliance, compliance.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(compliance.id!, compliance.report_id!)}
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
      {viewModal.open && viewModal.compliance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Compliance Record</h3>
                <button
                  onClick={() => setViewModal({ open: false, compliance: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Compliance_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project/PO ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Project_PO_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy/Regulation</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Policy_Regulation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Audit_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auditor</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Auditor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Compliance_Status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Audit Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Next_Audit_Date}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Findings}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Corrective Actions</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Corrective_Actions}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.compliance.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.compliance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Compliance Record' : 'Edit Compliance Record'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, compliance: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance ID</label>
                  <input
                    type="text"
                    value={editModal.compliance.Compliance_ID}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Compliance_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project/PO ID</label>
                  <input
                    type="text"
                    value={editModal.compliance.Project_PO_ID}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Project_PO_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy/Regulation</label>
                  <input
                    type="text"
                    value={editModal.compliance.Policy_Regulation}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Policy_Regulation: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Date</label>
                  <input
                    type="date"
                    value={editModal.compliance.Audit_Date}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Audit_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Auditor</label>
                  <input
                    type="text"
                    value={editModal.compliance.Auditor}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Auditor: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
                  <select
                    value={editModal.compliance.Compliance_Status}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Compliance_Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    
                    
                    
                    
                    
                    
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Audit Date</label>
                  <input
                    type="date"
                    value={editModal.compliance.Next_Audit_Date}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Next_Audit_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <textarea
                    value={editModal.compliance.Findings}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Findings: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Corrective Actions</label>
                  <textarea
                    value={editModal.compliance.Corrective_Actions}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Corrective_Actions: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.compliance.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, compliance: { ...editModal.compliance!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, compliance: null, isNew: false, reportId: null })}
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

export default ComplianceAndPolicyPage;
