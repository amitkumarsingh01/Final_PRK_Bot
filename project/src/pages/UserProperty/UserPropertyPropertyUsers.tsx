import React, { useState, useEffect } from 'react';
import { User, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'https://server.prktechindia.in';

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

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
}

const CadminPropertyUsers: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<PropertyUser[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch property details
        const propertyResponse = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        if (!propertyResponse.ok) {
          throw new Error('Failed to fetch property details');
        }
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);

        // Fetch users for the property
        const usersResponse = await fetch(`${API_BASE_URL}/profile/property/${propertyId}`);
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-lg font-semibold" style={{ color: '#060C18' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/properties')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back to Properties</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold" style={{ color: '#060C18' }}>
              {property?.name || 'Property'} Users
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Property Info */}
        {property && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#060C18' }}>
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-medium" style={{ color: '#060C18' }}>{property.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium" style={{ color: '#060C18' }}>
                  {property.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
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
                      {user.name || 'N/A'}
                    </h3>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      {user.email || 'N/A'}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.status || 'unknown'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Phone:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {user.phone_no || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Role:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {user.user_role || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#6B7280' }}>Type:</span>
                  <span className="text-sm" style={{ color: '#060C18' }}>
                    {user.user_type || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <User size={48} style={{ color: '#6B7280' }} className="mx-auto mb-4" />
            <p className="text-lg" style={{ color: '#6B7280' }}>
              No users found for this property.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadminPropertyUsers; 