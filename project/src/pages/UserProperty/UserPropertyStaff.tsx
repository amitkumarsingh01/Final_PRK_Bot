import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { UserRole } from '../../types';

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

const CadminStaff: React.FC = () => {
  // State management
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: UserRole.SUPER_ADMIN,
    user_ids: [],
  });

  // Fetch current user profile and set propertyId
  useEffect(() => {
    const fetchProfileAndData = async () => {
      setLoading(true);
      try {
        // Fetch current user profile
        const profileRes = await axios.get(`${BASE_URL}/profile`);
        const currentUser = profileRes.data[0];
        setPropertyId(currentUser.property_id);

        // Fetch all users
        setUsers(profileRes.data);
      } catch (err) {
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndData();
  }, []);

  // Fetch staff categories for this property
  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    axios.get(`${BASE_URL}/staff-categories`)
      .then(res => {
        setCategories(res.data.filter((cat: StaffCategory) => cat.property_id === propertyId));
      })
      .catch(() => setError('Failed to load staff categories.'))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // Filter users by propertyId
  useEffect(() => {
    if (!propertyId) return;
    setFilteredUsers(users.filter(user => user.property_id === propertyId));
  }, [users, propertyId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        user_ids: userIds,
        property_id: propertyId,
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/staff-categories/${editingId}`, submitData);
      } else {
        await axios.post(`${BASE_URL}/staff-categories`, submitData);
      }
      // Refresh categories list
      const res = await axios.get(`${BASE_URL}/staff-categories`);
      setCategories(res.data.filter((cat: StaffCategory) => cat.property_id === propertyId));
      resetForm();
      setShowForm(false);
    } catch (err) {
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
      setError('Failed to delete. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <button className="float-right" onClick={() => setError(null)}>&times;</button>
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
                  disabled={!propertyId}
                >
                  {filteredUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} ({user.user_role})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {!propertyId
                    ? 'Loading property...'
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
                    <th className="px-4 py-3 text-left">Staff Members</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        No staff categories found. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    categories.map(category => (
                      <tr key={category.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{category.title.replace(/_/g, ' ').toUpperCase()}</td>
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

export default CadminStaff;