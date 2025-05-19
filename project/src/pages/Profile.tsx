// // // src/pages/Profile.tsx
// // import React, { useEffect, useState } from 'react';
// // import { useAuth } from '../context/AuthContext';
// // import { useProfile } from '../context/ProfileContext';

// // const Profile: React.FC = () => {
// //   const { user } = useAuth();
// //   const { profile, setProfile } = useProfile();
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const fetchProfile = async () => {
// //       try {
// //         const response = await fetch('/profile');
// //         const data = await response.json();
// //         const matchedUser = data.find((u: any) => u.user_id === user?.userId);
// //         if (matchedUser) {
// //           setProfile(matchedUser);
// //         }
// //       } catch (err) {
// //         console.error('Failed to fetch profile:', err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     if (user?.userId) fetchProfile();
// //   }, [user?.userId, setProfile]);

// //   if (loading) return <div className="text-white p-4">Loading profile...</div>;
// //   if (!profile) return <div className="text-white p-4">Profile not found</div>;

// //   return (
// //     <div className="bg-white min-h-screen p-8 text-[#060C18]">
// //       <h1 className="text-3xl font-bold mb-6 text-[#DD6A1A]">User Profile</h1>
// //       <div className="grid gap-4">
// //         <Field label="Name" value={profile.name} />
// //         <Field label="Email" value={profile.email} />
// //         <Field label="Phone Number" value={profile.phone_no} />
// //         <Field label="Role" value={profile.user_role} />
// //         <Field label="Type" value={profile.user_type} />
// //         <Field label="Property ID" value={profile.property_id} />
// //         <Field label="Status" value={profile.status} />
// //       </div>
// //     </div>
// //   );
// // };

// // const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
// //   <div className="flex flex-col border-b border-[#F88024] pb-2">
// //     <span className="text-[#DF5F0D] font-medium">{label}</span>
// //     <span className="text-[#060C18]">{value}</span>
// //   </div>
// // );

// // export default Profile;


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';

// interface UserProfileType {
//   user_id: string;
//   name: string;
//   email: string;
//   phone_no: string;
//   user_role: string;
//   user_type: string;
//   property_id: string;
//   status: string;
// }

// const Profile: React.FC = () => {
//   const { user } = useAuth();
//   const [profileData, setProfileData] = useState<UserProfileType | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const res = await axios.get('/profile', {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//           },
//         });

//         const matchedUser = res.data.find((u: UserProfileType) => u.user_id === user?.userId);
//         if (matchedUser) {
//           setProfileData(matchedUser);
//         }
//       } catch (error) {
//         console.error('Failed to fetch profile:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (user?.userId) {
//       fetchProfile();
//     }
//   }, [user?.userId]);

//   if (loading) return <div className="p-4 text-white">Loading...</div>;

//   if (!profileData) return <div className="p-4 text-white">Profile not found.</div>;

//   return (
//     <div className="p-6 bg-white rounded-xl shadow-md max-w-xl mx-auto mt-10 text-[#060C18]">
//       <h1 className="text-3xl font-bold mb-4 text-[#DD6A1A]">User Profile</h1>
//       <div className="space-y-2">
//         <p><span className="font-semibold">Name:</span> {profileData.name}</p>
//         <p><span className="font-semibold">Email:</span> {profileData.email}</p>
//         <p><span className="font-semibold">Phone:</span> {profileData.phone_no}</p>
//         <p><span className="font-semibold">Role:</span> {profileData.user_role}</p>
//         <p><span className="font-semibold">Type:</span> {profileData.user_type}</p>
//         <p><span className="font-semibold">Property ID:</span> {profileData.property_id}</p>
//         <p><span className="font-semibold">Status:</span> <span className="text-[#DF5F0D]">{profileData.status}</span></p>
//       </div>
//     </div>
//   );
// };

// export default Profile;


import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);
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
  }, [user?.userId]);

  if (loading) return <div className="p-4 text-white">Loading...</div>;
  if (!profileData) return <div className="p-4 text-white">Profile not found.</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-xl mx-auto mt-10 text-[#060C18]">
      <h1 className="text-3xl font-bold mb-4 text-[#DD6A1A]">User Profile</h1>
      <div className="space-y-2">
        <p><span className="font-semibold">Name:</span> {profileData.name}</p>
        <p><span className="font-semibold">Email:</span> {profileData.email}</p>
        <p><span className="font-semibold">Phone:</span> {profileData.phone_no}</p>
        <p><span className="font-semibold">Role:</span> {profileData.user_role}</p>
        <p><span className="font-semibold">Type:</span> {profileData.user_type}</p>
        <p><span className="font-semibold">Property ID:</span> {profileData.property_id}</p>
        <p><span className="font-semibold">Status:</span> <span className="text-[#DF5F0D]">{profileData.status}</span></p>
      </div>
    </div>
  );
};

export default Profile;
