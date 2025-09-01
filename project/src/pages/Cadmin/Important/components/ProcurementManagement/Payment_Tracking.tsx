import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface Payment {
  id?: string;
  report_id?: string;
  Payment_ID: string;
  PO_ID: string;
  Vendor_ID: string;
  Invoice_Number: string;
  Invoice_Amount: number;
  Payment_Due_Date: string;
  Payment_Date: string;
  Payment_Status: string;
  Payment_Method: string;
  Responsible_Person: string;
  Remarks: string;
}

interface ProcurementReport {
  id: string;
  property_id: string;
  payments: Payment[];
}

const API_URL = 'https://server.prktechindia.in/procurement-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyPayment: Payment = {
  Payment_ID: '',
  PO_ID: '',
  Vendor_ID: '',
  Invoice_Number: '',
  Invoice_Amount: 0,
  Payment_Due_Date: '',
  Payment_Date: '',
  Payment_Status: '',
  Payment_Method: '',
  Responsible_Person: '',
  Remarks: '',
};

const PaymentTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProcurementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
  const [editModal, setEditModal] = useState<{ open: boolean; payment: Payment | null; isNew: boolean; reportId: string | null }>({ open: false, payment: null, isNew: false, reportId: null });

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
      setError('Failed to fetch payment tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const getAllPayments = (): Payment[] => {
    return data.flatMap(report => 
      report.payments.map(payment => ({
        ...payment,
        report_id: report.id
      }))
    );
  };

  const handleEdit = (payment: Payment, reportId: string) => {
    setEditModal({ open: true, payment: { ...payment }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({ open: true, payment: { ...emptyPayment }, isNew: true, reportId });
  };

  const handleDelete = async (paymentId: string, reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
      const report = data.find(r => r.id === reportId);
      if (report) {
        const updatedPayments = report.payments.filter(p => p.id !== paymentId);
        await axios.put(`${API_URL}${reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Payment_Tracking: updatedPayments
          }
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete payment record');
    }
  };

  const handleView = (payment: Payment) => {
    setViewModal({ open: true, payment });
  };

  const handleSave = async () => {
    if (!editModal.payment || !editModal.reportId) return;

    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (report) {
        let updatedPayments: Payment[];
        if (editModal.isNew) {
          const newPayment = { ...editModal.payment, id: `temp_${Date.now()}` };
          updatedPayments = [...report.payments, newPayment];
        } else {
          updatedPayments = report.payments.map(p =>
            p.id === editModal.payment!.id ? editModal.payment! : p
          );
        }

        await axios.put(`${API_URL}${editModal.reportId}`, {
          property_id: selectedPropertyId,
          Procurement_Management: {
            Payment_Tracking: updatedPayments
          }
        });
        setEditModal({ open: false, payment: null, isNew: false, reportId: null });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save payment record');
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

  const payments = getAllPayments();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building size={32} style={{ color: orange }} />
              <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
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
              <div className="text-2xl font-bold">{payments.length}</div>
              <div className="text-sm">Total Payments</div>
            </div>
            <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.Payment_Status === 'Paid').length}
              </div>
              <div className="text-sm">Paid</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.Payment_Status === 'Pending').length}
              </div>
              <div className="text-sm">Pending</div>
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                ₹{payments.reduce((sum, p) => sum + p.Invoice_Amount, 0).toLocaleString()}
              </div>
              <div className="text-sm">Total Amount</div>
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
              <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
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
                  <span>Add Payment</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.Payment_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.PO_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.Vendor_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.Invoice_Number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{payment.Invoice_Amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.Payment_Status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.Payment_Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        payment.Payment_Status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        payment.Payment_Status === 'Partial' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.Payment_Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.Payment_Method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(payment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(payment, payment.report_id!)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id!, payment.report_id!)}
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
      {viewModal.open && viewModal.payment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">View Payment Record</h3>
                <button
                  onClick={() => setViewModal({ open: false, payment: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Payment_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.PO_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Vendor_ID}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Invoice_Number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{viewModal.payment.Invoice_Amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Payment_Status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Due Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Payment_Due_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Payment_Date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Payment_Method}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Responsible_Person}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="mt-1 text-sm text-gray-900">{viewModal.payment.Remarks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.payment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editModal.isNew ? 'Add Payment Record' : 'Edit Payment Record'}
                </h3>
                <button
                  onClick={() => setEditModal({ open: false, payment: null, isNew: false, reportId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <input
                    type="text"
                    value={editModal.payment.Payment_ID}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Payment_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PO ID</label>
                  <input
                    type="text"
                    value={editModal.payment.PO_ID}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, PO_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                  <input
                    type="text"
                    value={editModal.payment.Vendor_ID}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Vendor_ID: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    value={editModal.payment.Invoice_Number}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Invoice_Number: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editModal.payment.Invoice_Amount}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Invoice_Amount: parseFloat(e.target.value) || 0 } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <select
                    value={editModal.payment.Payment_Status}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Payment_Status: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Partial">Partial</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Due Date</label>
                  <input
                    type="date"
                    value={editModal.payment.Payment_Due_Date}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Payment_Due_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={editModal.payment.Payment_Date}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Payment_Date: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    value={editModal.payment.Payment_Method}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Payment_Method: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                  <input
                    type="text"
                    value={editModal.payment.Responsible_Person}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Responsible_Person: e.target.value } })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    value={editModal.payment.Remarks}
                    onChange={(e) => setEditModal({ ...editModal, payment: { ...editModal.payment!, Remarks: e.target.value } })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, payment: null, isNew: false, reportId: null })}
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

export default PaymentTrackingPage;
