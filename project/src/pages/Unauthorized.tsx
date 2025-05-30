import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <ShieldAlert size={64} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-[#E06002] text-white rounded-lg hover:bg-[#FB7E03] transition-colors duration-200"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized; 