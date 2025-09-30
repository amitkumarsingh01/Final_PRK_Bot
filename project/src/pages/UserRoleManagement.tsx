import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Building2, Users, Save, AlertCircle, Eye, Trash2, Edit } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface UserRole {
  value: string;
  label: string;
  category: string;
}

interface CreatedUser {
  id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
  created_at: string;
}

const UserRoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // User form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone_no: '',
    password: '',
    confirmPassword: '',
    user_role: '',
    user_type: 'property_user'
  });

  // Function to determine user_type based on user_role
  const getUserTypeFromRole = (role: string): string => {
    if (role === 'cadmin') {
      return 'cadmin';
    }
    return 'property_user';
  };

  // All available user roles organized by category
  const userRoles: UserRole[] = [
    // Administrative Roles
    { value: 'cadmin', label: 'Company Admin', category: 'Administrative' },
    { value: 'helpdesk', label: 'Helpdesk', category: 'Administrative' },
    
    // Management Roles
    { value: 'general_manager', label: 'General Manager', category: 'Management' },
    { value: 'assistant_general_manager', label: 'Assistant General Manager', category: 'Management' },
    { value: 'operations_head', label: 'Operations Head', category: 'Management' },
    { value: 'operations_manager', label: 'Operations Manager', category: 'Management' },
    { value: 'training_manager', label: 'Training Manager', category: 'Management' },
    { value: 'area_manager', label: 'Area Manager', category: 'Management' },
    { value: 'field_officer', label: 'Field Officer', category: 'Management' },
    
    // Security Roles
    { value: 'security_supervisor', label: 'Security Supervisor', category: 'Security' },
    { value: 'security_officer', label: 'Security Officer', category: 'Security' },
    
    // Technical Roles - Electrical
    { value: 'electrical_supervisor', label: 'Electrical Supervisor', category: 'Technical - Electrical' },
    { value: 'electrical_technician', label: 'Electrical Technician', category: 'Technical - Electrical' },
    
    // Technical Roles - Plumbing
    { value: 'plumber', label: 'Plumber', category: 'Technical - Plumbing' },
    { value: 'plumbing_supervisor', label: 'Plumbing Supervisor', category: 'Technical - Plumbing' },
    
    // Technical Roles - STP/WTP
    { value: 'stp_supervisor', label: 'STP Supervisor', category: 'Technical - STP/WTP' },
    { value: 'stp_technician', label: 'STP Technician', category: 'Technical - STP/WTP' },
    { value: 'wtp_supervisor', label: 'WTP Supervisor', category: 'Technical - STP/WTP' },
    { value: 'wtp_technician', label: 'WTP Technician', category: 'Technical - STP/WTP' },
    
    // Technical Roles - Swimming Pool
    { value: 'swimming_pool_supervisor', label: 'Swimming Pool Supervisor', category: 'Technical - Swimming Pool' },
    { value: 'swimming_pool_technician', label: 'Swimming Pool Technician', category: 'Technical - Swimming Pool' },
    
    // Technical Roles - Other
    { value: 'lift_technician', label: 'Lift Technician', category: 'Technical - Other' },
    { value: 'gym_technician', label: 'Gym Technician', category: 'Technical - Other' },
    { value: 'gas_technician', label: 'Gas Technician', category: 'Technical - Other' },
    { value: 'multi_technician', label: 'Multi Technician', category: 'Technical - Other' },
    
    // Housekeeping Roles
    { value: 'housekeeping_supervisor', label: 'Housekeeping Supervisor', category: 'Housekeeping' },
    
    // Pest Control Roles
    { value: 'pest_control_supervisor', label: 'Pest Control Supervisor', category: 'Pest Control' },
    { value: 'pest_control_technician', label: 'Pest Control Technician', category: 'Pest Control' },
    
    // Fire Safety Roles
    { value: 'fire_officer', label: 'Fire Officer', category: 'Fire Safety' },
    
    // Garden/Landscaping Roles
    { value: 'garden_supervisor', label: 'Garden Supervisor', category: 'Garden/Landscaping' },
    
    // CCTV Roles
    { value: 'cctv_technician', label: 'CCTV Technician', category: 'CCTV' },
  ];

  // Group roles by category
  const groupedRoles = userRoles.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = [];
    }
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, UserRole[]>);

  useEffect(() => {
    fetchProperties();
    
    // For cadmin users, set their property as selected
    if (user?.userType === 'cadmin' && user?.propertyId) {
      setSelectedProperty(user.propertyId);
    }
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      fetchUsers();
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('https://server.prktechindia.in/properties', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUsers = async () => {
    if (!selectedProperty) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/properties/${selectedProperty}/users`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreatedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!selectedProperty) {
      setError('Please select a property');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!newUser.user_role) {
      setError('Please select a user role');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://server.prktechindia.in/create-property-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone_no: newUser.phone_no,
          password: newUser.password,
          property_id: selectedProperty,
          user_type: newUser.user_type,
          user_role: newUser.user_role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User created successfully!');
        setNewUser({
          name: '',
          email: '',
          phone_no: '',
          password: '',
          confirmPassword: '',
          user_role: '',
          user_type: 'property_user'
        });
        // Refresh the users list
        fetchUsers();
      } else {
        setError(data.detail || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred while creating the user');
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessPermissions = (role: string) => {
    const permissions: Record<string, string[]> = {
      // Administrative roles
      'cadmin': ['All Pages'],
      'helpdesk': [
        'Daily Task Management of all department', 'Daily Management Report', 'Daily Complete work Details', 'Monthly Management Report',
        '52 Week Work Calendar', '52 week training calendar format', 'Incident Report',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Tickets Management', 'Ticket Assignment', 'Notice Management',
        'Parking Sticker Management', 'Communication & Announcements',
        'Move-In Coordination', 'Move-Out Coordination', 'Interior Work Approvals',
        'Work Permit Tracking', 'Inventory Management', 'Asset Management',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Work Permits'
      ],
      
      // Management roles
      'general_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'assistant_general_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'operations_head': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'operations_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'training_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'area_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'field_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      
      // Security roles
      'security_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Site Security Patrolling Report', 'Gate Management', 'Work Permits'
      ],
      'security_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Site Security Patrolling Report', 'Gate Management', 'Work Permits',
        'Inventory Management', 'Asset Management', 'CCTV Department'
      ],
      
      // Technical roles
      'electrical_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Generator', 'Diesel Generator', 'Facility or Technical team Patrolling Report',
        'Inventory Management', 'Asset Management'
      ],
      'electrical_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Generator', 'Diesel Generator', 'Facility or Technical team Patrolling Report'
      ],
      'plumber': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Fresh Water', 'Facility or Technical team Patrolling Report'
      ],
      'plumbing_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Inventory Management', 'Asset Management'
      ],
      'stp_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'STP', 'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'stp_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'STP', 'Facility or Technical team Patrolling Report'
      ],
      'wtp_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'WTP', 'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'wtp_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'WTP', 'Facility or Technical team Patrolling Report'
      ],
      'swimming_pool_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Swimming Pool', 'Facility or Technical team Patrolling Report'
      ],
      'swimming_pool_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Swimming Pool', 'Facility or Technical team Patrolling Report'
      ],
      'lift_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'gym_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'gas_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'multi_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      
      // Other roles
      'housekeeping_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Inventory Management', 'Asset Management'
      ],
      'pest_control_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'pest_control_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'fire_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report', 'Fire and Safety', 'Work Permits'
      ],
      'garden_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'cctv_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'CCTV Department'
      ]
    };

    return permissions[role] || ['Limited Access'];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <UserPlus className="h-8 w-8 text-[#E06002] mr-3" />
          <h1 className="text-2xl font-bold text-[#000435]">User Role Management</h1>
        </div>

        {/* Property Selection */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Building2 className="h-5 w-5 text-[#E06002] mr-2" />
            <h3 className="text-lg font-semibold text-[#000435]">Property Selection</h3>
          </div>
          
          {user?.userType === 'admin' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
              >
                <option value="">Choose a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <strong>Fixed Property:</strong> {properties.find(p => p.id === selectedProperty)?.name || 'Loading...'}
            </div>
          )}
        </div>

        {/* User Creation Form */}
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={newUser.phone_no}
                onChange={(e) => setNewUser({ ...newUser, phone_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
              />
            </div>

            {/* User Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role *
              </label>
              <select
                value={newUser.user_role}
                onChange={(e) => {
                  const selectedRole = e.target.value;
                  setNewUser({ 
                    ...newUser, 
                    user_role: selectedRole,
                    user_type: getUserTypeFromRole(selectedRole)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
              >
                <option value="">Select a role...</option>
                {Object.entries(groupedRoles).map(([category, roles]) => (
                  <optgroup key={category} label={category}>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Note: Admin role cannot be created through this interface. Company Admin is the highest assignable role.
              </p>
              {newUser.user_role && (
                <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-xs text-blue-700">
                    <strong>User Type:</strong> {newUser.user_type === 'cadmin' ? 'Company Admin' : 'Property User'}
                  </p>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:border-transparent"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Access Permissions Preview */}
          {newUser.user_role && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Access Permissions Preview:</h4>
              <div className="text-sm text-blue-700">
                {getAccessPermissions(newUser.user_role).map((permission, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="flex items-center p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <Users className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !selectedProperty}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white rounded-lg hover:from-[#FB7E03] hover:to-[#E06002] focus:outline-none focus:ring-2 focus:ring-[#E06002] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {isLoading ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Created Users Display */}
      {selectedProperty && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-[#E06002] mr-3" />
              <h2 className="text-xl font-bold text-[#000435]">
                Users for {properties.find(p => p.id === selectedProperty)?.name}
              </h2>
            </div>
            <button
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              {isLoadingUsers ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-[#E06002] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : createdUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found for this property.</p>
              <p className="text-sm">Create your first user using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {createdUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone_no}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {userRoles.find(role => role.value === user.user_role)?.label || user.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.user_type === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : user.user_type === 'cadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.user_type === 'admin' ? 'Admin' :
                           user.user_type === 'cadmin' ? 'Company Admin' :
                           user.user_type === 'property_user' ? 'Property User' :
                           user.user_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRoleManagement;
