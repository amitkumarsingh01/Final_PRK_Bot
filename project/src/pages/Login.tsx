import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../components/auth/Background';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔐 LOGIN ATTEMPT STARTED');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);

    try {
      console.log('🌐 Making login request to server...');
      const response = await fetch('https://server.prktechindia.in/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 Full response data:', data);

      if (!response.ok) {
        console.error('❌ Login failed:', data.detail || 'Login failed');
        throw new Error(data.detail || 'Login failed');
      }

      console.log('✅ Login successful!');
      console.log('👤 User ID:', data.user_id);
      console.log('🎫 Token:', data.token ? 'Present' : 'Missing');
      console.log('📊 Status:', data.status);
      console.log('🏢 Property ID:', data.property_id);
      console.log('👥 User Type:', data.user_type);

      // Store auth data using AuthContext
      console.log('💾 Storing auth data in context...');
      login(data.user_id, data.token, data.status, data.property_id, data.user_type);

      // Redirect based on status
      if (data.status === 'active') {
        console.log('🔄 Redirecting to /profile (user is active)');
        navigate('/profile');
      } else {
        console.log('🔄 Redirecting to /verify (user needs verification)');
        navigate('/verify');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      console.log('🏁 Login attempt finished');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              <span className="text-[#000435]">PRK</span>
              <span className="text-[#E06002]">TECH</span>
            </h1>
            <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
                required
              />
            </div>

            <div className="flex flex justify-end">
              <Link to="/forgot-password" className="text-sm text-[#E06002] hover:text-[#FB7E03]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-[#E06002] to-[#FB7E03] hover:from-[#FB7E03] hover:to-[#E06002] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E06002] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <LogIn size={20} className="mr-2" />
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#E06002] hover:text-[#FB7E03] font-medium">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;