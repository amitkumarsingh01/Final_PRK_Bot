import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Background from '../components/auth/Background';
import { UserPlus, Building2 } from 'lucide-react';

interface Property {
  id: number;
  name: string;
  title: string;
  description: string;
}

const Signup: React.FC = () => {
  const [step, setStep] = useState<'property' | 'details'>('property');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    user_role: 'user', // default value
    user_type: 'tenant', // default value
    property_id: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch properties when component mounts
    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:8000/properties');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await response.json();
        setProperties(data);
      } catch (err) {
        setError('Failed to load properties. Please try again later.');
      }
    };

    fetchProperties();
  }, []);

  const handlePropertySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProperty(Number(e.target.value));
  };

  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProperty) {
      setFormData(prev => ({ ...prev, property_id: selectedProperty.toString() }));
      setStep('details');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_no: formData.phone,
          password: formData.password,
          user_role: formData.user_role,
          user_type: formData.user_type,
          property_id: formData.property_id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Redirect to verify page since status will be pending
      navigate('/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPropertyStep = () => (
    <form onSubmit={handlePropertySubmit} className="space-y-6">
      <div>
        <label htmlFor="property" className="block text-sm font-medium text-gray-700">
          Select Property
        </label>
        <select
          id="property"
          value={selectedProperty}
          onChange={handlePropertySelect}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
          required
        >
          <option value="">Select a property</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name} - {property.title}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!selectedProperty}
        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-[#E06002] to-[#FB7E03] hover:from-[#FB7E03] hover:to-[#E06002] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E06002] disabled:opacity-50"
      >
        <Building2 size={20} className="mr-2" />
        Continue
      </button>
    </form>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
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
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
          required
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#E06002] focus:border-[#E06002]"
          required
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setStep('property')}
          className="flex-1 py-2 px-4 border border-[#E06002] rounded-md text-[#E06002] hover:bg-[#E06002] hover:text-white transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-[#E06002] to-[#FB7E03] hover:from-[#FB7E03] hover:to-[#E06002] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E06002] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <UserPlus size={20} className="mr-2" />
          )}
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </form>
  );

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
            <p className="text-gray-600">
              {step === 'property' 
                ? 'Select your property to get started' 
                : 'Complete your account details'}
            </p>
          </div>

          {step === 'property' ? renderPropertyStep() : renderDetailsStep()}

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E06002] hover:text-[#FB7E03] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;