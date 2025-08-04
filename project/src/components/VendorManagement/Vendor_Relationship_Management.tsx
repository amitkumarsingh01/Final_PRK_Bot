import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
}

interface VendorRelationshipManagement {
  id: string;
  vendor_master_id: string;
  relationship_id: string;
  relationship_type: string;
  communication_frequency: string;
  last_contact: string;
  next_contact: string;
  relationship_status: string;
  responsible_person: string;
  remarks: string;
}

const Vendor_Relationship_Management: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState<VendorRelationshipManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VendorRelationshipManagement | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<VendorRelationshipManagement>>({});

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get('https://server.prktechindia.in/properties');
        setProperties(response.data);
        if (response.data.length > 0) {
          setSelectedProperty(response.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  // Fetch relationship management data
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        
        // Filter vendors that have relationship management data and map it
        const relationshipData = response.data
          .filter((vendor: any) => vendor.vendor_relationship_management)
          .map((vendor: any) => ({
            id: vendor.vendor_relationship_management.id,
            vendor_master_id: vendor.id,
            relationship_id: vendor.vendor_relationship_management.relationship_id,
            relationship_type: vendor.vendor_relationship_management.relationship_type,
            communication_frequency: vendor.vendor_relationship_management.communication_frequency,
            last_contact: vendor.vendor_relationship_management.last_contact,
            next_contact: vendor.vendor_relationship_management.next_contact,
            relationship_status: vendor.vendor_relationship_management.relationship_status,
            responsible_person: vendor.vendor_relationship_management.responsible_person,
            remarks: vendor.vendor_relationship_management.remarks,
          }));

        setData(relationshipData);
      } catch (err) {
        console.error('Error fetching relationship management data:', err);
        setError('Failed to fetch relationship management data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProperty]);

  const handleView = (item: VendorRelationshipManagement) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: VendorRelationshipManagement) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingItem({
      relationship_id: '',
      relationship_type: '',
      communication_frequency: '',
      last_contact: '',
      next_contact: '',
      relationship_status: '',
      responsible_person: '',
      remarks: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: VendorRelationshipManagement) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this relationship record?')) {
      return;
    }

    try {
      // Find the vendor that has this relationship management
      const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const vendor = response.data.find((v: any) => v.vendor_relationship_management?.id === item.id);
      
      if (vendor) {
        // Update the vendor with relationship management set to null
        await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
          ...vendor,
          vendor_relationship_management: null
        });
        
        setData(data.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error('Error deleting relationship management:', err);
      setError('Failed to delete relationship management');
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;

    try {
      if (editingItem.id) {
        // Update existing relationship management
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendor = response.data.find((v: any) => v.vendor_relationship_management?.id === editingItem.id);
        
        if (vendor) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendor.id}`, {
            ...vendor,
            vendor_relationship_management: {
              relationship_id: editingItem.relationship_id,
              relationship_type: editingItem.relationship_type,
              communication_frequency: editingItem.communication_frequency,
              last_contact: editingItem.last_contact,
              next_contact: editingItem.next_contact,
              relationship_status: editingItem.relationship_status,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      } else {
        // Create new relationship management - we need to select a vendor first
        // For now, we'll use the first vendor without relationship management
        const response = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
        const vendorWithoutRelationship = response.data.find((v: any) => !v.vendor_relationship_management);
        
        if (vendorWithoutRelationship) {
          await axios.put(`https://server.prktechindia.in/vendor-master/${vendorWithoutRelationship.id}`, {
            ...vendorWithoutRelationship,
            vendor_relationship_management: {
              relationship_id: editingItem.relationship_id,
              relationship_type: editingItem.relationship_type,
              communication_frequency: editingItem.communication_frequency,
              last_contact: editingItem.last_contact,
              next_contact: editingItem.next_contact,
              relationship_status: editingItem.relationship_status,
              responsible_person: editingItem.responsible_person,
              remarks: editingItem.remarks,
            }
          });
        }
      }

      // Refresh data
      const refreshResponse = await axios.get(`https://server.prktechindia.in/vendor-master/${selectedProperty}`);
      const relationshipData = refreshResponse.data
        .filter((vendor: any) => vendor.vendor_relationship_management)
        .map((vendor: any) => ({
          id: vendor.vendor_relationship_management.id,
          vendor_master_id: vendor.id,
          relationship_id: vendor.vendor_relationship_management.relationship_id,
          relationship_type: vendor.vendor_relationship_management.relationship_type,
          communication_frequency: vendor.vendor_relationship_management.communication_frequency,
          last_contact: vendor.vendor_relationship_management.last_contact,
          next_contact: vendor.vendor_relationship_management.next_contact,
          relationship_status: vendor.vendor_relationship_management.relationship_status,
          responsible_person: vendor.vendor_relationship_management.responsible_person,
          remarks: vendor.vendor_relationship_management.remarks,
        }));

      setData(relationshipData);
      setShowEditModal(false);
      setEditingItem({});
    } catch (err) {
      console.error('Error saving relationship management:', err);
      setError('Failed to save relationship management');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const getRelationshipStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'strategic':
        return 'bg-purple-100 text-purple-800';
      case 'preferred':
        return 'bg-blue-100 text-blue-800';
      case 'regular':
        return 'bg-green-100 text-green-800';
      case 'occasional':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommunicationFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case 'daily':
        return 'bg-red-100 text-red-800';
      case 'weekly':
        return 'bg-orange-100 text-orange-800';
      case 'monthly':
        return 'bg-yellow-100 text-yellow-800';
      case 'quarterly':
        return 'bg-green-100 text-green-800';
      case 'annually':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingContacts = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return data.filter(item => {
      const nextContact = new Date(item.next_contact);
      return nextContact >= today && nextContact <= nextWeek;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Relationship Management</h1>
        <p className="text-gray-600">Manage vendor relationships and communication</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Relationships</p>
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
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => item.relationship_status.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Strategic</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.filter(item => item.relationship_type.toLowerCase() === 'strategic').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Contacts</p>
              <p className="text-2xl font-semibold text-gray-900">{getUpcomingContacts().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
        <select
          value={selectedProperty}
          onChange={(e) => handlePropertyChange(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Relationship Records</h2>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Relationship
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.relationship_id}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Next Contact: {item.next_contact}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipStatusColor(item.relationship_status)}`}>
                    {item.relationship_status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipTypeColor(item.relationship_type)}`}>
                    {item.relationship_type}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommunicationFrequencyColor(item.communication_frequency)}`}>
                    {item.communication_frequency}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No relationships</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new relationship record.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Relationship Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.relationship_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.relationship_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Communication Frequency</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.communication_frequency}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.last_contact}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Contact</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.next_contact}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedItem.relationship_status}</p>
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
                {editingItem.id ? 'Edit Relationship' : 'Add Relationship'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship ID</label>
                  <input
                    type="text"
                    value={editingItem.relationship_id || ''}
                    onChange={(e) => setEditingItem({...editingItem, relationship_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Type</label>
                  <select
                    value={editingItem.relationship_type || ''}
                    onChange={(e) => setEditingItem({...editingItem, relationship_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Strategic">Strategic</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Regular">Regular</option>
                    <option value="Occasional">Occasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Communication Frequency</label>
                  <select
                    value={editingItem.communication_frequency || ''}
                    onChange={(e) => setEditingItem({...editingItem, communication_frequency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Frequency</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Contact</label>
                  <input
                    type="date"
                    value={editingItem.last_contact || ''}
                    onChange={(e) => setEditingItem({...editingItem, last_contact: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Contact</label>
                  <input
                    type="date"
                    value={editingItem.next_contact || ''}
                    onChange={(e) => setEditingItem({...editingItem, next_contact: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship Status</label>
                  <select
                    value={editingItem.relationship_status || ''}
                    onChange={(e) => setEditingItem({...editingItem, relationship_status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
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

export default Vendor_Relationship_Management;
