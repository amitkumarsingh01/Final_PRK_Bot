import React, { useState, useEffect } from 'react';
import { User, Edit, Trash2, CheckCircle, Plus, X } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'https://server.prktechindia.in';

interface Profile {
  id: string;
  name?: string;
  email?: string;
  phone_no?: string;
  user_role?: string;
  user_type?: string;
  property_id?: string;
  status?: string;
}

interface Property {
  id: string;
  name: string;
  title: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone_no: '',
    user_role: '',
    user_type: '',
    property_id: ''
  });

  // Check if current user is admin or property user
  const isAdmin = user?.userType === 'admin';
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Fetch properties based on user type
  const fetchProperties = async () => {
    try {
      if (isAdmin) {
        // Admin sees all properties
        const response = await fetch(`${API_BASE_URL}/properties`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await response.json();
        setProperties(data);
      } else if (isPropertyUser && currentUserPropertyId) {
        // Property user only sees their assigned property
        const response = await fetch(`${API_BASE_URL}/properties/${currentUserPropertyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const property = await response.json();
        setProperties([property]);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  // Fetch profiles based on user type
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/profile`;
      
      // If property user, filter by their property_id
      if (isPropertyUser && currentUserPropertyId) {
        url = `${API_BASE_URL}/users?property_id=${currentUserPropertyId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch profiles');
      }
      const data = await response.json();
      
      // For property users, ensure we only show users from their property
      if (isPropertyUser && currentUserPropertyId) {
        const filteredData = data.filter((profile: Profile) => 
          profile.property_id === currentUserPropertyId
        );
        setProfiles(filteredData);
      } else {
        setProfiles(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  // Create new profile
  const createProfile = async (profile: ProfileFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profile,
          status: 'active' // Set default status to active
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to create profile');
      }
      await fetchProfiles();
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  // Update profile
  const updateProfile = async (id: string, profile: ProfileFormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profile,
          status: 'active' // Maintain active status on update
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update profile');
      }
      await fetchProfiles();
      setEditingProfile(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  // Delete profile
  const deleteProfile = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete profile');
      }
      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  // Activate user
  const activateUser = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${id}/activate`, {
        method: 'PATCH'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to activate user');
      }
      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_no: '',
      user_role: '',
      user_type: '',
      property_id: isPropertyUser && currentUserPropertyId ? currentUserPropertyId : ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfile) {
      updateProfile(editingProfile.id, formData);
    } else {
      createProfile(formData);
    }
  };

  const startEditing = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone_no: profile.phone_no || '',
      user_role: profile.user_role || '',
      user_type: profile.user_type || '',
      property_id: profile.property_id || ''
    });
    setShowCreateForm(true);
  };

  useEffect(() => {
    fetchProfiles();
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
            User Profile Dashboard
          </h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#DD6A1A' }}
          >
            <Plus size={20} />
            <span>Create Profile</span>
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
                  {editingProfile ? 'Edit Profile' : 'Create Profile'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProfile(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    User Role *
                  </label>
                  <select
                    name="user_role"
                    value={formData.user_role}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    required
                  >
                    <option value="">Select a role...</option>
                    <option value="cadmin">CompanyAdmin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                    User Type *
                  </label>
                  <select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    required
                  >
                    <option value="">Select a type...</option>
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>
                        {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                {isAdmin ? (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Property *
                    </label>
                    <select
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                      required
                    >
                      <option value="">Select a property...</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} - {property.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Property *
                    </label>
                    <input
                      type="text"
                      value={properties.find(p => p.id === currentUserPropertyId)?.name || currentUserPropertyId || 'N/A'}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                      disabled
                    />
                    <input
                      type="hidden"
                      name="property_id"
                      value={currentUserPropertyId || ''}
                    />
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 px-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {editingProfile ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingProfile(null);
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
              </div>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#060C18' }}
                  >
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#060C18' }}>
                      {profile.name || 'N/A'}
                    </h3>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      {profile.email || 'N/A'}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {profile.status || 'unknown'}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Phone:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {profile.phone_no || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Role:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {profile.user_role || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Type:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {profile.user_type || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Property ID:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {profile.property_id || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditing(profile)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#DB7723' }}
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                
                {profile.status !== 'active' && (
                  <button
                    onClick={() => activateUser(profile.id)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#F88024' }}
                  >
                    <CheckCircle size={16} />
                    <span>Activate</span>
                  </button>
                )}
                
                <button
                  onClick={() => deleteProfile(profile.id)}
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

        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <User size={48} style={{ color: '#6B7280' }} className="mx-auto mb-4" />
            <p className="text-lg" style={{ color: '#6B7280' }}>
              No profiles found. Create your first profile!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;