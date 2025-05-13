import React, { useState, useEffect } from 'react';
import { Building2, Edit, Trash2, Plus, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
}

interface PropertyUser {
  id: string;
  name?: string;
  email?: string;
  phone_no?: string;
  user_role?: string;
  user_type?: string;
  property_id?: string;
  status?: string;
}

interface PropertyFormData {
  name: string;
  title: string;
  description: string;
}

const PropertiesProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    title: '',
    description: ''
  });

  // Fetch all properties
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/properties`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch properties');
      }
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Create new property
  const createProperty = async (property: PropertyFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(property)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create property');
      }
      await fetchProperties();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    }
  };

  // Update property
  const updateProperty = async (id: string, property: PropertyFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(property)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update property');
      }
      await fetchProperties();
      setEditingProperty(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    }
  };

  // Delete property
  const deleteProperty = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete property');
      }
      await fetchProperties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      updateProperty(editingProperty.id, formData);
    } else {
      createProperty(formData);
    }
  };

  const startEditing = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      title: property.title,
      description: property.description || ''
    });
    setShowCreateForm(true);
  };

  const handleViewUsers = (propertyId: string) => {
    navigate(`/properties/${propertyId}/users`);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-lg font-semibold" style={{ color: '#060C18' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: '#060C18' }}>
            Properties Dashboard
          </h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#DD6A1A' }}
          >
            <Plus size={20} />
            <span>Add Property</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#060C18' }}>
                  {editingProperty ? 'Edit Property' : 'Add Property'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProperty(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent min-h-[100px]"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {editingProperty ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingProperty(null);
                      resetForm();
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors"
                    style={{ 
                      backgroundColor: '#F3F4F6',
                      color: '#060C18'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#060C18' }}
                  >
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#060C18' }}>
                      {property.name}
                    </h3>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      {property.title}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {property.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewUsers(property.id)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#DD6A1A' }}
                >
                  <Users size={16} />
                  <span>Users</span>
                </button>
                
                <button
                  onClick={() => startEditing(property)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#DB7723' }}
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => deleteProperty(property.id)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#DF5F0D' }}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 size={48} style={{ color: '#6B7280' }} className="mx-auto mb-4" />
            <p className="text-lg" style={{ color: '#6B7280' }}>
              No properties found. Add your first property!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesProfiles;
