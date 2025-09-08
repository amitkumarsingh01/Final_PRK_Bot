import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    role: string;
    userId: string | null;
    token: string | null;
    status: string | null;
    propertyId: string | null;
    userType: string | null;
  } | null;
  login: (userId: string, token: string, status: string, propertyId: string, userType: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const isAuthenticated = !!user?.token;

  const login = (user_id: string, token: string, status: string, propertyId: string, userType: string) => {
    console.log('🔐 AUTH CONTEXT - Login called with:');
    console.log('👤 User ID:', user_id);
    console.log('🎫 Token:', token ? 'Present' : 'Missing');
    console.log('📊 Status:', status);
    console.log('🏢 Property ID:', propertyId);
    console.log('👥 User Type:', userType);
    
    const userData = { userId: user_id, token, status, role: 'user', propertyId, userType };
    console.log('💾 Storing user data:', userData);
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User data stored in localStorage');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // Check if user data exists in localStorage on initial load
    console.log('🔄 AUTH CONTEXT - Checking localStorage for existing user...');
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('👤 Found stored user data:', JSON.parse(storedUser));
      setUser(JSON.parse(storedUser));
    } else {
      console.log('❌ No stored user data found');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};