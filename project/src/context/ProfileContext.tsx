// src/context/ProfileContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
}

const ProfileContext = createContext<{
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}>({
  profile: null,
  setProfile: () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
