import React, { useState, useEffect } from 'react';
import { Building2, Edit, Trash2, Plus, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'https://server.prktechindia.in';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
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
  logo_base64?: string;
}

const PropertiesProfiles: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    title: '',
    description: '',
    logo_base64: ''
  });

  // Check if current user is admin or property user
  const isAdmin = user?.userType === 'admin';
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Fetch properties based on user type
  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      if (isPropertyUser && currentUserPropertyId) {
        // Property user only sees their assigned property
        const response = await fetch(`${API_BASE_URL}/properties/${currentUserPropertyId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch property');
        }
        const property = await response.json();
        setProperties([property]);
      } else {
        // Admin sees all properties
        const response = await fetch(`${API_BASE_URL}/properties`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Failed to fetch properties');
        }
        const data = await response.json();
        setProperties(data);
      }
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
      description: '',
      logo_base64: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_base64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
      description: property.description || '',
      logo_base64: property.logo_base64 || ''
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
        <div className="relative overflow-hidden rounded-2xl p-8 mb-8" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(circle at 25% 25%, #DD6A1A 0%, transparent 50%), radial-gradient(circle at 75% 75%, #DB7723 0%, transparent 50%)',
              backgroundSize: '200px 200px'
            }}></div>
          </div>
          <div className="relative flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#060C18' }}>
                Properties Dashboard
              </h1>
              <p className="text-lg" style={{ color: '#6B7280' }}>
                Manage your properties and their configurations
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-3 px-8 py-4 rounded-xl text-white font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg"
                style={{ backgroundColor: '#DD6A1A' }}
              >
                <Plus size={24} />
                <span>Add Property</span>
              </button>
            )}
          </div>
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
            <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#060C18' }}>
                  {editingProperty ? 'Edit Property' : 'Add Property'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProperty(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#060C18' }}>
                    Property Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-[#DD6A1A] transition-all duration-200"
                    placeholder="Enter property name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#060C18' }}>
                    Property Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-[#DD6A1A] transition-all duration-200"
                    placeholder="Enter property title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#060C18' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-[#DD6A1A] transition-all duration-200 min-h-[120px] resize-none"
                    placeholder="Enter property description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#060C18' }}>
                    Property Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#DD6A1A] transition-colors duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {formData.logo_base64 ? (
                        <div className="space-y-3">
                          <div className="relative inline-block">
                            <img
                              src={formData.logo_base64}
                              alt="Logo Preview"
                              className="w-32 h-32 object-contain border-2 border-gray-200 rounded-xl shadow-md mx-auto"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, logo_base64: '' }))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600">Click to change logo</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                            <Building2 size={48} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Upload your property logo</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 py-4 px-6 rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {editingProperty ? 'Update Property' : 'Create Property'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingProperty(null);
                      resetForm();
                    }}
                    className="flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 border-2"
                    style={{ 
                      borderColor: '#E5E7EB',
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
              className="border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {property.logo_base64 ? (
                    <div className="relative">
                      <img
                        src={property.logo_base64}
                        alt="Logo"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-24 h-24 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: '#060C18' }}
                    >
                      <Building2 size={36} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#060C18' }}>
                      {property.name}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                      {property.title}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  {property.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewUsers(property.id)}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                  style={{ backgroundColor: '#DD6A1A' }}
                >
                  <Users size={18} />
                  <span>Users</span>
                </button>
                
                {isAdmin && (
                  <>
                    <button
                      onClick={() => startEditing(property)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                      style={{ backgroundColor: '#DB7723' }}
                    >
                      <Edit size={18} />
                      <span>Edit</span>
                    </button>
                    
                    <button
                      onClick={() => deleteProperty(property.id)}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                      style={{ backgroundColor: '#DF5F0D' }}
                    >
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 size={48} style={{ color: '#6B7280' }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#060C18' }}>
              No Properties Found
            </h3>
            <p className="text-lg mb-6" style={{ color: '#6B7280' }}>
              Get started by adding your first property to the system
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg"
                style={{ backgroundColor: '#DD6A1A' }}
              >
                <Plus size={20} />
                <span>Add Your First Property</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesProfiles;
