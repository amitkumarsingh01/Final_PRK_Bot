import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../components/auth/Background';
import { Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Verification: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    logout(); // This will clear localStorage and auth state
    navigate('/login');
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
            <div className="flex justify-center mb-4">
              <Shield size={48} className="text-[#E06002]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Under Verification</h2>
            <p className="text-gray-600">
              Your account is under verification process. Once it will be verified you will be able to login.
            </p>
          </div>

          <div className="bg-[#FFF8F5] border border-[#E06002]/20 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Clock size={20} className="text-[#E06002] mr-2" />
              <span className="text-sm text-gray-700">
                Verification typically takes 24-48 hours
              </span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We'll send you an email once your account is verified.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={handleBackToLogin}
                className="w-full flex justify-center items-center py-2 px-4 border border-[#E06002] rounded-md text-[#E06002] hover:bg-[#E06002] hover:text-white transition-colors duration-200"
              >
                Back to Login
              </button>
              
              <Link 
                to="/support" 
                className="text-sm text-[#E06002] hover:text-[#FB7E03] underline"
              >
                Need help? Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;