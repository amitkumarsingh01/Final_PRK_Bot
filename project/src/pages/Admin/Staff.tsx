import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Define the base URL for API calls
const BASE_URL = 'https://server.prktechindia.in';

// Interface for Staff Category
interface StaffCategory {
  id: string;
  title: UserRole;
  user_ids: string[];
  property_id: string;
  created_at: string;
}

// Interface for form data
interface FormData {
  title: UserRole;
  user_ids: string[];
  property_id: string;
}

// Interface for users - updated to match API response
interface User {
  user_id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
}

// Colors
const colors = {
  primary: '#060C18',
  secondary: '#DD6A1A',
  accent1: '#DB7723',
  accent2: '#DF5F0D',
  accent3: '#F88024',
};

const Staff: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: UserRole.SUPER_ADMIN,
    user_ids: [],
    property_id: '',
  });

  // Check if current user is admin or property user
  const isAdmin = user?.userType === 'admin';
  const isPropertyUser = user?.userType === 'property_user';
  const currentUserPropertyId = user?.propertyId;

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch staff categories based on user type
        if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees categories from their property
          const categoriesRes = await axios.get(`${BASE_URL}/staff-categories`);
          const filteredCategories = categoriesRes.data.filter(
            (category: StaffCategory) => category.property_id === currentUserPropertyId
          );
          setCategories(filteredCategories);
        } else {
          // Admin sees all categories
          const categoriesRes = await axios.get(`${BASE_URL}/staff-categories`);
          setCategories(categoriesRes.data);
        }

        // Fetch users based on user type
        if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees users from their property
          const usersRes = await axios.get(`${BASE_URL}/profile`);
          const filteredUsers = usersRes.data.filter(
            (user: User) => user.property_id === currentUserPropertyId
          );
          setUsers(filteredUsers);
        } else {
          // Admin sees all users
          const usersRes = await axios.get(`${BASE_URL}/profile`);
          setUsers(usersRes.data);
        }

        // Fetch properties based on user type
        if (isAdmin) {
          // Admin sees all properties
          const propertiesRes = await axios.get(`${BASE_URL}/properties`);
          setProperties(propertiesRes.data);
        } else if (isPropertyUser && currentUserPropertyId) {
          // Property user only sees their assigned property
          const propertiesRes = await axios.get(`${BASE_URL}/properties/${currentUserPropertyId}`);
          const property = propertiesRes.data;
          setProperties([{ id: property.id, name: property.name }]);
          // Automatically set the property for property users
          setFormData(prev => ({ ...prev, property_id: currentUserPropertyId }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, isPropertyUser, currentUserPropertyId]);

  // Update filtered users when property_id changes
  useEffect(() => {
    if (formData.property_id) {
      const filtered = users.filter(user => user.property_id === formData.property_id);
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [formData.property_id, users]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'property_id') {
      setFormData(prev => ({ ...prev, user_ids: [] }));
    }
  };

  // Handle user selection changes (multi-select)
  const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, user_ids: selectedUsers });
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      title: UserRole.SUPER_ADMIN,
      user_ids: [],
      property_id: '',
    });
    setEditingId(null);
  };

  // Toggle form visibility
  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      resetForm();
    }
  };

  // Set up form for editing
  const handleEdit = (category: StaffCategory) => {
    // Convert user names back to user IDs for editing
    const userIds = category.user_ids.map(userIdOrName => {
      // Check if it's already a valid user ID
      const userById = users.find(u => u.user_id === userIdOrName);
      if (userById) return userIdOrName;
      
      // If not, try to find by name (for backward compatibility)
      const userByName = users.find(u => userIdOrName.includes(u.name));
      return userByName ? userByName.user_id : userIdOrName;
    });

    setFormData({
      title: category.title,
      user_ids: userIds,
      property_id: category.property_id,
    });
    setEditingId(category.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit form for create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure we're sending user IDs only
      const userIds = formData.user_ids.filter(id => {
        // Verify the ID exists in our users list
        return users.some(u => u.user_id === id);
      });

      const submitData = {
        ...formData,
        user_ids: userIds
      };

      if (editingId) {
        // Update existing category
        await axios.put(`${BASE_URL}/staff-categories/${editingId}`, submitData);
      } else {
        // Create new category
        await axios.post(`${BASE_URL}/staff-categories`, submitData);
      }

      // Refresh categories list
      const res = await axios.get(`${BASE_URL}/staff-categories`);
      setCategories(res.data);
      
      // Reset form and close it
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to save data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete operation
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this staff category?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/staff-categories/${id}`);
      setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Find property name by ID
  const getPropertyName = (id: string) => {
    const property = properties.find(p => p.id === id);
    return property ? property.name : 'Unknown Property';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get user names from IDs with role - updated to handle both IDs and names
  const getUserNames = (userIds: string[]) => {
    return userIds
      .map(userIdOrName => {
        // First try to find by user_id
        const userById = users.find(u => u.user_id === userIdOrName);
        if (userById) {
          return `${userById.name}${userById.user_role ? ` (${userById.user_role.replace(/_/g, ' ').toUpperCase()})` : ''}`;
        }
        
        // If not found by ID, try to find by name (for backward compatibility)
        const userByName = users.find(u => userIdOrName.includes(u.name));
        if (userByName) {
          return `${userByName.name}${userByName.user_role ? ` (${userByName.user_role.replace(/_/g, ' ').toUpperCase()})` : ''}`;
        }
        
        // If neither found, return the original value
        return userIdOrName;
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="bg-white min-h-screen p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-6" style={{ color: colors.primary }}>
        Staff Categories
      </h1>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            className="float-right" 
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Add/Edit Form Toggle Button */}
      <div className="mb-6">
        <button
          onClick={toggleForm}
          className="flex items-center gap-2 px-4 py-2 rounded text-white"
          style={{ backgroundColor: showForm ? colors.accent1 : colors.secondary }}
        >
          {showForm ? 'Cancel' : (
            <>
              <FaPlus /> {editingId ? 'Edit' : 'Add'} Staff Category
            </>
          )}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
            {editingId ? 'Edit Staff Category' : 'Add New Staff Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="title">
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin ? (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="property_id">
                    Property
                  </label>
                  <select
                    id="property_id"
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="property_id">
                    Property
                  </label>
                  <input
                    type="text"
                    value={properties.find(p => p.id === currentUserPropertyId)?.name || currentUserPropertyId || 'N/A'}
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                    disabled
                  />
                  <input
                    type="hidden"
                    name="property_id"
                    value={currentUserPropertyId || ''}
                  />
                </div>
              )}

              <div className="mb-4 md:col-span-2">
                <label className="block text-gray-700 mb-2" htmlFor="user_ids">
                  Staff Members
                </label>
                <select
                  id="user_ids"
                  name="user_ids"
                  multiple
                  value={formData.user_ids}
                  onChange={handleUserSelection}
                  className="w-full px-3 py-2 border rounded"
                  size={5}
                  disabled={!formData.property_id}
                >
                  {filteredUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} ({user.user_role})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {!formData.property_id 
                    ? 'Please select a property first' 
                    : 'Hold Ctrl/Cmd to select multiple staff members'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded text-white flex items-center gap-2"
                style={{ backgroundColor: colors.accent3 }}
                disabled={loading}
              >
                {loading ? <FaSpinner className="animate-spin" /> : null}
                {editingId ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Categories List */}
      <div>
        {loading && !categories.length ? (
          <div className="flex justify-center items-center h-32">
            <FaSpinner className="animate-spin text-3xl" style={{ color: colors.secondary }} />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                <thead className="text-white" style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">Staff Members</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        No staff categories found. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    categories.map(category => (
                      <tr key={category.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{category.title.replace(/_/g, ' ').toUpperCase()}</td>
                        <td className="px-4 py-3">{getPropertyName(category.property_id)}</td>
                        <td className="px-4 py-3 max-w-md">
                          <div className="whitespace-normal">
                            {category.user_ids && category.user_ids.length > 0
                              ? getUserNames(category.user_ids)
                              : 'No staff assigned'}
                          </div>
                        </td>
                        <td className="px-4 py-3">{formatDate(category.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1 rounded"
                              style={{ color: colors.accent2 }}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-1 rounded"
                              style={{ color: colors.primary }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden flex flex-col gap-4">
              {categories.length === 0 ? (
                <div className="text-center text-gray-500 bg-white p-4 rounded shadow">
                  No staff categories found. Create your first one!
                </div>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Title:</span>
                      <span>{category.title.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Property:</span>
                      <span>{getPropertyName(category.property_id)}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Staff Members:</span>
                      <div className="whitespace-normal mt-1">
                        {category.user_ids && category.user_ids.length > 0
                          ? getUserNames(category.user_ids)
                          : 'No staff assigned'}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Created:</span>
                      <span>{formatDate(category.created_at)}</span>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 rounded"
                        style={{ color: colors.accent2 }}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1 rounded"
                        style={{ color: colors.primary }}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Staff;