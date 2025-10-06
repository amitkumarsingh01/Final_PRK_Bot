import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface VendorPaymentTracking {
  id: string;
  vendor_master_id: string;
  payment_id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  payment_status: string;
  payment_date: string;
  payment_method: string;
  responsible_person: string;
  remarks: string;
}

const Payment_Tracking: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<VendorPaymentTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VendorPaymentTracking | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<VendorPaymentTracking>>({});

  // Fetch properties
  useEffect(() => {
    }, []);

  // Fetch payment tracking data
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https:        
        // Filter vendors that have payment tracking data and map it
        const paymentData = response.data
          .filter((vendor: any) => vendor.payment_tracking)
          .map((vendor: any) => ({
            id: vendor.payment_tracking.id,
            vendor_master_id: vendor.id,
            payment_id: vendor.payment_tracking.payment_id,
            invoice_number: vendor.payment_tracking.invoice_number,
            amount: vendor.payment_tracking.amount,
            due_date: vendor.payment_tracking.due_date,
            payment_status: vendor.payment_tracking.payment_status,
            payment_date: vendor.payment_tracking.payment_date,
            payment_method: vendor.payment_tracking.payment_method,
            responsible_person: vendor.payment_tracking.responsible_person,
            remarks: vendor.payment_tracking.remarks,
          }));

        setData(paymentData);
      } catch (err) {
        console.error('Error fetching payment tracking data:', err);
        setError('Failed to fetch payment tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty]);

  const handleView = (item: VendorPaymentTracking) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: VendorPaymentTracking) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      payment_id: '',
      invoice_number: '',
      amount: 0,
      due_date: '',
      payment_status: '',
      payment_date: '',
      payment_method: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: VendorPaymentTracking) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      // Find the vendor that has this payment tracking
      const response = await axios.get(`https:      const vendor = response.data.find((v: any) => v.payment_tracking?.id === item.id);
      
      if (vendor) {
        // Update the vendor with payment tracking set to null
        await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
          ...vendor,
          payment_tracking: null
        });
        
        setData(data.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error('Error deleting payment tracking:', err);
      setError('Failed to delete payment tracking');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (editingItem.id) {
        // Update existing payment tracking
        const response = await axios.get(`https:        const vendor = response.data.find((v: any) => v.payment_tracking?.id === editingItem.id);
        
        if (vendor) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
            ...vendor,
            payment_tracking: {
              payment_id: editingItem.payment_id,
              invoice_number: editingItem.invoice_number,
              amount: editingItem.amount,
              due_date: editingItem.due_date,
              payment_status: editingItem.payment_status,
              payment_date: editingItem.payment_date,
              payment_method: editingItem.payment_method,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      } else {
        // Create new payment tracking - we need to select a vendor first
        // For now, we'll use the first vendor without payment tracking
        const response = await axios.get(`https:        const vendorWithoutPayment = response.data.find((v: any) => !v.payment_tracking);
        
        if (vendorWithoutPayment) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendorWithoutPayment.id}`, {
            ...vendorWithoutPayment,
            payment_tracking: {
              payment_id: editingItem.payment_id,
              invoice_number: editingItem.invoice_number,
              amount: editingItem.amount,
              due_date: editingItem.due_date,
              payment_status: editingItem.payment_status,
              payment_date: editingItem.payment_date,
              payment_method: editingItem.payment_method,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      }

      // Refresh data
      const refreshResponse = await axios.get(`https:      const paymentData = refreshResponse.data
        .filter((vendor: any) => vendor.payment_tracking)
        .map((vendor: any) => ({
          id: vendor.payment_tracking.id,
          vendor_master_id: vendor.id,
          payment_id: vendor.payment_tracking.payment_id,
          invoice_number: vendor.payment_tracking.invoice_number,
          amount: vendor.payment_tracking.amount,
          due_date: vendor.payment_tracking.due_date,
          payment_status: vendor.payment_tracking.payment_status,
          payment_date: vendor.payment_tracking.payment_date,
          payment_method: vendor.payment_tracking.payment_method,
          responsible_person: vendor.payment_tracking.responsible_person,
          remarks: vendor.payment_tracking.remarks,
        }));

      setData(paymentData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving payment tracking:', err);
      setError('Failed to save payment tracking');
    }
  };

  
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank transfer':
        return 'bg-blue-100 text-blue-800';
      case 'cheque':
        return 'bg-purple-100 text-purple-800';
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'online':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getTotalAmount = () => {
    return data.reduce((sum, item) => sum + item.amount, 0);
  };

  const getOverduePayments = () => {
    const today = new Date();
    return data.filter(item => {
      const dueDate = new Date(item.due_date);
      return dueDate < today && item.payment_status.toLowerCase() !== 'paid';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Tracking</h1>
        <p className="text-gray-600">Manage vendor payment tracking and status</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalAmount())}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => item.payment_status.toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{getOverduePayments().length}</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Payment
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
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.payment_id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Invoice: {item.invoice_number} • {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(item.payment_status)}`}>
                    {item.payment_status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(item.payment_method)}`}>
                    {item.payment_method}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new payment record.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.payment_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.invoice_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedItem.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.due_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.payment_status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.payment_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.payment_method}</p>
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
                {editingItem.id ? 'Edit Payment' : 'Add Payment'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                  <input
                    type="text"
                    value={editingItem.payment_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, payment_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    value={editingItem.invoice_number || ''}
                    onChange={(e) => setEditingItem({...editingItem, invoice_number: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={editingItem.amount || ''}
                    onChange={(e) => setEditingItem({...editingItem, amount: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={editingItem.due_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, due_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={editingItem.payment_date || ''}
                    onChange={(e) => setEditingItem({...editingItem, payment_date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  
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

export default Payment_Tracking;
