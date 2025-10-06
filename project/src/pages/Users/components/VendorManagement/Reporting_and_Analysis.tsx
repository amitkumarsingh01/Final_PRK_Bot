import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface VendorReportingAndAnalysis {
  id: string;
  vendor_master_id: string;
  report_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  metrics: string;
  findings: string;
  generated_date: string;
  responsible_person: string;
  remarks: string;
}

const Vendor_Reporting_and_Analysis: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<VendorReportingAndAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VendorReportingAndAnalysis | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<VendorReportingAndAnalysis>>({});

  // Fetch properties
  useEffect(() => {
    }, []);

  // Fetch reporting and analysis data
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https:        
        // Filter vendors that have reporting and analysis data and map it
        const reportingData = response.data
          .filter((vendor: any) => vendor.reporting_and_analysis)
          .map((vendor: any) => ({
            id: vendor.reporting_and_analysis.id,
            vendor_master_id: vendor.id,
            report_id: vendor.reporting_and_analysis.report_id,
            report_type: vendor.reporting_and_analysis.report_type,
            period_start: vendor.reporting_and_analysis.period_start,
            period_end: vendor.reporting_and_analysis.period_end,
            metrics: vendor.reporting_and_analysis.metrics,
            findings: vendor.reporting_and_analysis.findings,
            generated_date: vendor.reporting_and_analysis.generated_date,
            responsible_person: vendor.reporting_and_analysis.responsible_person,
            remarks: vendor.reporting_and_analysis.remarks,
          }));

        setData(reportingData);
      } catch (err) {
        console.error('Error fetching reporting data:', err);
        setError('Failed to fetch reporting data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty]);

  const handleView = (item: VendorReportingAndAnalysis) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: VendorReportingAndAnalysis) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      report_id: '',
      report_type: '',
      period_start: '',
      period_end: '',
      metrics: '',
      findings: '',
      generated_date: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: VendorReportingAndAnalysis) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      // Find the vendor that has this reporting
      const response = await axios.get(`https:      const vendor = response.data.find((v: any) => v.reporting_and_analysis?.id === item.id);
      
      if (vendor) {
        // Update the vendor with reporting set to null
        await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
          ...vendor,
          reporting_and_analysis: null
        });
        
        setData(data.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (editingItem.id) {
        // Update existing report
        const response = await axios.get(`https:        const vendor = response.data.find((v: any) => v.reporting_and_analysis?.id === editingItem.id);
        
        if (vendor) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
            ...vendor,
            reporting_and_analysis: {
              report_id: editingItem.report_id,
              report_type: editingItem.report_type,
              period_start: editingItem.period_start,
              period_end: editingItem.period_end,
              metrics: editingItem.metrics,
              findings: editingItem.findings,
              generated_date: editingItem.generated_date,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      } else {
        // Create new report - we need to select a vendor first
        // For now, we'll use the first vendor without reporting
        const response = await axios.get(`https:        const vendorWithoutReporting = response.data.find((v: any) => !v.reporting_and_analysis);
        
        if (vendorWithoutReporting) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendorWithoutReporting.id}`, {
            ...vendorWithoutReporting,
            reporting_and_analysis: {
              report_id: editingItem.report_id,
              report_type: editingItem.report_type,
              period_start: editingItem.period_start,
              period_end: editingItem.period_end,
              metrics: editingItem.metrics,
              findings: editingItem.findings,
              generated_date: editingItem.generated_date,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      }

      // Refresh data
      const refreshResponse = await axios.get(`https:      const reportingData = refreshResponse.data
        .filter((vendor: any) => vendor.reporting_and_analysis)
        .map((vendor: any) => ({
          id: vendor.reporting_and_analysis.id,
          vendor_master_id: vendor.id,
          report_id: vendor.reporting_and_analysis.report_id,
          report_type: vendor.reporting_and_analysis.report_type,
          period_start: vendor.reporting_and_analysis.period_start,
          period_end: vendor.reporting_and_analysis.period_end,
          metrics: vendor.reporting_and_analysis.metrics,
          findings: vendor.reporting_and_analysis.findings,
          generated_date: vendor.reporting_and_analysis.generated_date,
          responsible_person: vendor.reporting_and_analysis.responsible_person,
          remarks: vendor.reporting_and_analysis.remarks,
        }));

      setData(reportingData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save report');
    }
  };

  
  };

  const getReportTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'performance':
        return 'bg-green-100 text-green-800';
      case 'financial':
        return 'bg-blue-100 text-blue-800';
      case 'compliance':
        return 'bg-purple-100 text-purple-800';
      case 'quality':
        return 'bg-orange-100 text-orange-800';
      case 'monthly':
        return 'bg-indigo-100 text-indigo-800';
      case 'quarterly':
        return 'bg-yellow-100 text-yellow-800';
      case 'annual':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecentReports = () => {
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return data.filter(item => {
      const generatedDate = new Date(item.generated_date);
      return generatedDate >= lastMonth;
    });
  };

  const getCurrentPeriodReports = () => {
    const today = new Date();
    return data.filter(item => {
      const periodStart = new Date(item.period_start);
      const periodEnd = new Date(item.period_end);
      return periodStart <= today && periodEnd >= today;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reporting and Analysis</h1>
        <p className="text-gray-600">Manage vendor performance reports and analysis</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => item.report_type.toLowerCase() === 'performance').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{getRecentReports().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Period</p>
              <p className="text-2xl font-semibold text-gray-900">{getCurrentPeriodReports().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
        
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Report Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Report
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.report_id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.period_start} - {item.period_end}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeColor(item.report_type)}`}>
                    {item.report_type}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(item)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {data.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new report.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.report_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.report_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Start</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.period_start}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period End</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.period_end}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metrics</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.metrics}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.findings}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.generated_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.responsible_person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.remarks}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem.id ? 'Edit Report' : 'Add Report'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report ID</label>
                  <input
                    type="text"
                    value={editingItem.report_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, report_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report Type</label>
                  
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Start</label>
                  <input
                    type="date"
                    value={editingItem.period_start || ''}
                    onChange={(e) => setEditingItem({...editingItem, period_start: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period End</label>
                  <input
                    type="date"
                    value={editingItem.period_end || ''}
                    onChange={(e) => setEditingItem({...editingItem, period_end: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metrics</label>
                  <textarea
                    value={editingItem.metrics || ''}
                    onChange={(e) => setEditingItem({...editingItem, metrics: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Key performance indicators and metrics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Findings</label>
                  <textarea
                    value={editingItem.findings || ''}
                    onChange={(e) => setEditingItem({...editingItem, findings: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Analysis findings and conclusions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generated Date</label>
                  <input
                    type="date"
                    value={editingItem.generated_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, generated_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editingItem.responsible_person || ''}
                    onChange={(e) => setEditingItem({...editingItem, responsible_person: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editingItem.remarks || ''}
                    onChange={(e) => setEditingItem({...editingItem, remarks: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem({});
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor_Reporting_and_Analysis;
