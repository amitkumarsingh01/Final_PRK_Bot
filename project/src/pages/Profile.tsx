import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://server.prktechindia.in/',
});

interface UserProfileType {
  user_id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
}

interface PropertyType {
  id: string;
  name: string;
  title: string;
  description: string;
  logo_base64?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { setProfile } = useProfile();
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile', {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        const matchedUser = res.data.find((u: UserProfileType) => u.user_id === user?.userId);
        if (matchedUser) {
          setProfileData(matchedUser);
          setProfile(matchedUser);
          
          // Fetch property details
          if (matchedUser.property_id) {
            try {
              const propertyRes = await api.get(`/properties/${matchedUser.property_id}`, {
                headers: {
                  Authorization: `Bearer ${user?.token}`,
                },
              });
              setPropertyData(propertyRes.data);
            } catch (propertyError) {
              console.error('Failed to fetch property details:', propertyError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchProfile();
    }
  }, [user?.userId, setProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Profile Dashboard</h1>
              <p className="text-gray-600 text-lg">Welcome back, {profileData.name}!</p>
            </div>
            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-full">
              <span className="font-semibold">{profileData.user_role}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="inline-block">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              profileData.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {profileData.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
              <InfoField 
                icon="👤" 
                label="Full Name" 
                value={profileData.name} 
              />
              <InfoField 
                icon="📧" 
                label="Email Address" 
                value={profileData.email} 
              />
              <InfoField 
                icon="📱" 
                label="Phone Number" 
                value={profileData.phone_no} 
              />
              <InfoField 
                icon="🎭" 
                label="User Type" 
                value={profileData.user_type} 
              />
            </div>
          </div>

          {/* Property Information Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Property Details</h2>
            </div>
            
            {propertyData ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  {propertyData.logo_base64 && (
                    <img 
                      src={propertyData.logo_base64} 
                      alt="Property Logo" 
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{propertyData.name}</h3>
                    <p className="text-gray-600">{propertyData.title}</p>
                  </div>
                </div>
                
                <InfoField 
                  icon="🏢" 
                  label="Property Name" 
                  value={propertyData.name} 
                />
                <InfoField 
                  icon="📋" 
                  label="Property Title" 
                  value={propertyData.title} 
                />
                <InfoField 
                  icon="📝" 
                  label="Description" 
                  value={propertyData.description || 'No description available'} 
                />
                {/* <InfoField 
                  icon="🆔" 
                  label="Property ID" 
                  value={propertyData.id} 
                  isCode={true}
                /> */}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <p className="text-gray-500">Property information not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Account Summary</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-blue-600 text-2xl mb-2">👤</div>
              <h3 className="font-semibold text-gray-800 mb-1">User ID</h3>
              <p className="text-sm text-gray-600 font-mono">{profileData.user_id}</p>
            </div> */}
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-green-600 text-2xl mb-2">🔑</div>
              <h3 className="font-semibold text-gray-800 mb-1">Access Level</h3>
              <p className="text-sm text-gray-600">{profileData.user_role}</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-purple-600 text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-800 mb-1">Account Status</h3>
              <p className="text-sm text-gray-600 capitalize">{profileData.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ 
  icon: string; 
  label: string; 
  value: string; 
  isCode?: boolean;
}> = ({ icon, label, value, isCode = false }) => (
  <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <span className="text-2xl mr-3">{icon}</span>
    <div className="flex-1">
      <p className="text-sm text-gray-600 font-medium">{label}</p>
      <p className={`text-gray-800 ${isCode ? 'font-mono text-sm' : 'font-semibold'}`}>
        {value}
      </p>
    </div>
  </div>
);

export default Profile;
