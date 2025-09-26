import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReportingAnalysis {
  id?: string;
  report_id?: string;
  Analysis_Report_ID: string;
  Report_Type: string;
  Period_Start: string;
  Period_End: string;
  Metrics: string;
  Findings: string;
  Generated_Date: string;
  Responsible_Person: string;
  Status: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  analysis_reports: ReportingAnalysis[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const orange = '#FB7E03';

const emptyAnalysis: ReportingAnalysis = {
  Analysis_Report_ID: '',
  Report_Type: '',
  Period_Start: '',
  Period_End: '',
  Metrics: '',
  Findings: '',
  Generated_Date: '',
  Responsible_Person: '',
  Status: '',
  Remarks: '',
};

const ReportingAndAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; analysis: ReportingAnalysis | null }>({ open: false, analysis: null });
  const [editModal, setEditModal] = useState<{ open: boolean; analysis: ReportingAnalysis | null; isNew: boolean; reportId: string | null }>({ open: false, analysis: null, isNew: false, reportId: null });

  const getAllAnalyses = (): ReportingAnalysis[] => {
    return data.flatMap(report =>
      report.analysis_reports.map(analysis => ({
        ...analysis,
        report_id: report.id,
      }))
    );
  };

  const handleEdit = (analysis: ReportingAnalysis, reportId: string) => {
    setEditModal({ open: true, analysis: { ...analysis }, isNew: false, reportId });
  };

  const handleDelete = async (analysisId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis report?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updated = report.analysis_reports.filter(a => a.id !== analysisId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Reporting_and_Analysis: updated,
          },
        }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete analysis report');
    }
  };

  const handleView = (analysis: ReportingAnalysis) => {
    setViewModal({ open: true, analysis });
  };

  const handleSave = async () => {
    if (!editModal.analysis || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updated: ReportingAnalysis[];
        if (editModal.isNew) {
          const newAnalysis = { ...editModal.analysis, id: `temp_${Date.now()}` };
          updated = [...report.analysis_reports, newAnalysis];
        } else {
          updated = report.analysis_reports.map(a => (a.id === editModal.analysis!.id ? editModal.analysis! : a));
        }
        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: user?.propertyId,
          Procurement_Management: {
            Reporting_and_Analysis: updated,
          },
        }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
        setEditModal({ open: false, analysis: null, isNew: false, reportId: null });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save analysis report');
    }
  };

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

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({ open: true, analysis: { ...emptyAnalysis }, isNew: true, reportId: id });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: orange }}></div>
      </div>
    );
  }

  const analyses = getAllAnalyses();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Reporting and Analysis</h1>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{analyses.length}</div>
              <div className="text-sm">Total Reports</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{analyses.filter(a => a.Status === 'Published').length}</div>
              <div className="text-sm">Published</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{analyses.filter(a => a.Status === 'Draft').length}</div>
              <div className="text-sm">Draft</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{analyses.filter(a => a.Status === 'In Review').length}</div>
              <div className="text-sm">In Review</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Analysis Reports</h2>
              {isAdmin && user?.propertyId && (
                <button onClick={() => handleAdd()} className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors">
                  <Plus size={16} />
                  <span>Add Report</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No analysis reports found</div>
                {isAdmin && user?.propertyId && (
                  <button onClick={() => handleAdd()} className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors mx-auto">
                    <Plus size={16} />
                    <span>Add Analysis Report</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyses.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.Analysis_Report_ID}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.Report_Type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.Period_Start} - {a.Period_End}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.Generated_Date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          a.Status === 'Published' ? 'bg-green-100 text-green-800' :
                          a.Status === 'In Review' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {a.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleView(a)} className="text-blue-600 hover:text-blue-900">
                            <Eye size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button onClick={() => handleEdit(a, a.report_id!)} className="text-orange-600 hover:text-orange-900">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDelete(a.id!, a.report_id!)} className="text-red-600 hover:text-red-900">
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
            )}
          </div>
        </div>
      </div>

      {viewModal.open && viewModal.analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Analysis Report</h3>
                <button onClick={() => setViewModal({ open: false, analysis: null })} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Analysis_Report_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Report_Type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Start</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Period_Start}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period End</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Period_End}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Generated_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Responsible_Person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Status}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Metrics</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Metrics}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Findings}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.analysis.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModal.open && editModal.analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{editModal.isNew ? 'Add Analysis Report' : 'Edit Analysis Report'}</h3>
                <button onClick={() => setEditModal({ open: false, analysis: null, isNew: false, reportId: null })} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report ID</label>
                  <input type="text" value={editModal.analysis.Analysis_Report_ID} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Analysis_Report_ID: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Type</label>
                  <input type="text" value={editModal.analysis.Report_Type} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Report_Type: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Start</label>
                  <input type="date" value={editModal.analysis.Period_Start} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Period_Start: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period End</label>
                  <input type="date" value={editModal.analysis.Period_End} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Period_End: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Metrics</label>
                  <textarea value={editModal.analysis.Metrics} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Metrics: e.target.value } })} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <textarea value={editModal.analysis.Findings} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Findings: e.target.value } })} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated Date</label>
                  <input type="date" value={editModal.analysis.Generated_Date} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Generated_Date: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text sm font-medium text-gray-700">Responsible Person</label>
                  <input type="text" value={editModal.analysis.Responsible_Person} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Responsible_Person: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={editModal.analysis.Status} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Status: e.target.value } })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select Status</option>
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea value={editModal.analysis.Remarks} onChange={(e) => setEditModal({ ...editModal, analysis: { ...editModal.analysis!, Remarks: e.target.value } })} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setEditModal({ open: false, analysis: null, isNew: false, reportId: null })} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md">
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

export default ReportingAndAnalysisPage;
