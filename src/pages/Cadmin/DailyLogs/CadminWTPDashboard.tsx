import React, { useState, useEffect } from 'react';
import { useProfile } from '../../../context/ProfileContext';
import { useAuth } from '../../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Droplet, TrendingUp, Activity, Filter, AlertCircle, Building } from 'lucide-react';

// Define Property interface
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

// Define WTP interface
interface WTP {
  id: string;
  property_id: string;
  phase_name: string;
  raw_sump_level?: number;
  treated_water_sump_level?: number;
  raw_water_hardness?: number;
  treated_water_hardness_morning?: number;
  treated_water_hardness_evening?: number;
  treated_water_meter?: number;
  energy_consumption?: number;
  salt_todays_usage?: number;
  salt_stock?: number;
  ph_level?: number;
  chlorine_level?: number;
  turbidity?: number;
  created_time: string;
  updated_time: string;
}

// Define form interface
interface WTPForm {
  phase_name: string;
  raw_sump_level: string;
  treated_water_sump_level: string;
  raw_water_hardness: string;
  treated_water_hardness_morning: string;
  treated_water_hardness_evening: string;
  treated_water_meter: string;
  energy_consumption: string;
  salt_todays_usage: string;
  salt_stock: string;
  ph_level: string;
  chlorine_level: string;
  turbidity: string;
}

// Component for showing a loading spinner
const Spinner = () => (
  <div className="flex justify-center items-center h-40">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
  </div>
);

// Component for showing error messages
const ErrorAlert = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    <p>{message}</p>
  </div>
);

// Card component for displaying metrics
const MetricCard = ({ title, value, unit }) => (
  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <div className="flex items-end mt-2">
      <span className="text-2xl font-bold text-gray-800">{value !== null && value !== undefined ? value : 'N/A'}</span>
      {value !== null && value !== undefined && unit && <span className="text-gray-500 ml-1">{unit}</span>}
    </div>
  </div>
);

// Colors for charts
const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Component for displaying WTP phase data
const WTPPhaseCard = ({ wtp }) => {
  // Generate chart data for water quality
  const waterQualityData = [
    { name: 'Raw Water Hardness', value: wtp.raw_water_hardness || 0 },
    { name: 'Morning Treated', value: wtp.treated_water_hardness_morning || 0 },
    { name: 'Evening Treated', value: wtp.treated_water_hardness_evening || 0 }
  ];

  // Generate water level data
  const waterLevelData = [
    { name: 'Raw Sump', value: wtp.raw_sump_level || 0 },
    { name: 'Treated Sump', value: wtp.treated_water_sump_level || 0 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">{wtp.phase_name}</h2>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(wtp.updated_time).toLocaleString()}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Water Hardness Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Water Hardness</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waterQualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#FF8042" name="Hardness (mg/L)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Water Level Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Sump Levels</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waterLevelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name="Level (m)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <h3 className="text-lg font-semibold text-gray-700 col-span-full">Sump Levels</h3>
        <MetricCard title="Raw Sump Level" value={wtp.raw_sump_level} unit="m" />
        <MetricCard title="Treated Water Sump Level" value={wtp.treated_water_sump_level} unit="m" />
        
        <h3 className="text-lg font-semibold text-gray-700 col-span-full mt-4">Water Quality</h3>
        <MetricCard title="Raw Water Hardness" value={wtp.raw_water_hardness} unit="mg/L" />
        <MetricCard title="Treated Water Hardness (Morning)" value={wtp.treated_water_hardness_morning} unit="mg/L" />
        <MetricCard title="Treated Water Hardness (Evening)" value={wtp.treated_water_hardness_evening} unit="mg/L" />
        <MetricCard title="pH Level" value={wtp.ph_level} unit="" />
        <MetricCard title="Chlorine Level" value={wtp.chlorine_level} unit="ppm" />
        <MetricCard title="Turbidity" value={wtp.turbidity} unit="NTU" />
        
        <h3 className="text-lg font-semibold text-gray-700 col-span-full mt-4">Meter Readings</h3>
        <MetricCard title="Treated Water Meter" value={wtp.treated_water_meter} unit="m³" />
        <MetricCard title="Energy Consumption" value={wtp.energy_consumption} unit="kWh" />
        
        <h3 className="text-lg font-semibold text-gray-700 col-span-full mt-4">Salt Usage</h3>
        <MetricCard title="Today's Salt Usage" value={wtp.salt_todays_usage} unit="kg" />
        <MetricCard title="Salt Stock" value={wtp.salt_stock} unit="kg" />
      </div>
    </div>
  );
};

const CadminWTPDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfile();
  const [wtpData, setWtpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<WTPForm>({
    phase_name: '',
    raw_sump_level: '',
    treated_water_sump_level: '',
    raw_water_hardness: '',
    treated_water_hardness_morning: '',
    treated_water_hardness_evening: '',
    treated_water_meter: '',
    energy_consumption: '',
    salt_todays_usage: '',
    salt_stock: '',
    ph_level: '',
    chlorine_level: '',
    turbidity: ''
  });

  // Get property_id from different sources
  const defaultPropertyId = profile?.property_id || '';
  
  // Use profile loading state
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileLoading(false);
    }
  }, [profile]);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Fetching properties...');
        console.log('User profile:', profile);
        console.log('User token:', user?.token);

        const response = await fetch('https://server.prktechindia.in/properties', {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        console.log('Properties response:', data);
        
        const userProperty = data.find((p: Property) => p.id === profile?.property_id);
        console.log('Found user property:', userProperty);
        
        if (userProperty) {
          setProperties([userProperty]);
          setSelectedPropertyId(userProperty.id);
        } else {
          setError("No property found for this user");
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to fetch properties. Please try again.');
      }
    };
    
    fetchProperties();
  }, [defaultPropertyId, user?.token, profile]);

  // Fetch WTP data when property changes
  useEffect(() => {
    const fetchWTPData = async () => {
      if (!isAuthenticated || !selectedPropertyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`https://server.prktechindia.in/properties/${selectedPropertyId}/wtp`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch WTP data');
        }

        const data = await response.json();
        setWtpData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching WTP data:', err);
        setError(err.message || 'Failed to load WTP data');
      } finally {
        setLoading(false);
      }
    };

    fetchWTPData();
  }, [isAuthenticated, user, selectedPropertyId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission for creating new WTP entry
  const handleCreateWTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure phase_name is not empty
      if (!formData.phase_name.trim()) {
        setError("Phase name is required");
        return;
      }
      
      // Ensure property is selected
      if (!selectedPropertyId) {
        setError("Please select a property first");
        return;
      }
      
      const payload = {
        property_id: selectedPropertyId,
        phase_name: formData.phase_name,
        raw_sump_level: formData.raw_sump_level ? parseFloat(formData.raw_sump_level) : null,
        treated_water_sump_level: formData.treated_water_sump_level ? parseFloat(formData.treated_water_sump_level) : null,
        raw_water_hardness: formData.raw_water_hardness ? parseFloat(formData.raw_water_hardness) : null,
        treated_water_hardness_morning: formData.treated_water_hardness_morning ? parseFloat(formData.treated_water_hardness_morning) : null,
        treated_water_hardness_evening: formData.treated_water_hardness_evening ? parseFloat(formData.treated_water_hardness_evening) : null,
        treated_water_meter: formData.treated_water_meter ? parseFloat(formData.treated_water_meter) : null,
        energy_consumption: formData.energy_consumption ? parseFloat(formData.energy_consumption) : null,
        salt_todays_usage: formData.salt_todays_usage ? parseInt(formData.salt_todays_usage) : null,
        salt_stock: formData.salt_stock ? parseInt(formData.salt_stock) : null,
        ph_level: formData.ph_level ? parseFloat(formData.ph_level) : null,
        chlorine_level: formData.chlorine_level ? parseFloat(formData.chlorine_level) : null,
        turbidity: formData.turbidity ? parseFloat(formData.turbidity) : null
      };
      
      console.log("Sending WTP payload:", payload);
      
      const response = await fetch('https://server.prktechindia.in/wtp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user?.token ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.detail) {
          throw new Error(errorData.detail);
        }
        throw new Error(`Failed to create WTP entry: ${response.status} ${response.statusText}`);
      }
      
      const newWTP = await response.json();
      setWtpData(prev => [...prev, newWTP]);
      setShowCreateModal(false);
      resetForm();
      setError(null);
      
      // Refresh WTP data
      const refreshResponse = await fetch(`https://server.prktechindia.in/properties/${selectedPropertyId}/wtp`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setWtpData(refreshedData);
      }
    } catch (err) {
      console.error("Error creating WTP entry:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      phase_name: '',
      raw_sump_level: '',
      treated_water_sump_level: '',
      raw_water_hardness: '',
      treated_water_hardness_morning: '',
      treated_water_hardness_evening: '',
      treated_water_meter: '',
      energy_consumption: '',
      salt_todays_usage: '',
      salt_stock: '',
      ph_level: '',
      chlorine_level: '',
      turbidity: ''
    });
  };

  // Prepare summary data for overview charts
  const prepareSummaryChartData = () => {
    if (!wtpData || wtpData.length === 0) return [];
    
    return wtpData.map(wtp => ({
      name: wtp.phase_name,
      hardness: wtp.raw_water_hardness || 0,
      treatedHardness: ((wtp.treated_water_hardness_morning || 0) + (wtp.treated_water_hardness_evening || 0)) / 2,
      ph: wtp.ph_level || 0,
      chlorine: wtp.chlorine_level || 0
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-700">Please log in to view WTP data.</p>
      </div>
    );
  }
  
  if (profileLoading && !properties.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  const summaryData = prepareSummaryChartData();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0 flex items-center">
              <Droplet className="mr-2 text-orange-500" /> Water Treatment Plant Dashboard
            </h1>
            {selectedPropertyId && properties.length > 0 && (
              <div className="mt-2 flex items-center">
                <Building className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-gray-600">
                  {properties.find(p => p.id === selectedPropertyId)?.name} - {properties.find(p => p.id === selectedPropertyId)?.title}
                </span>
              </div>
            )}
          </div>
          
          {/* Add New WTP Entry Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center"
          >
            <Filter className="mr-2" size={18} /> Add New WTP Entry
          </button>
        </div>

        {/* Error message */}
        {error && <ErrorAlert message={error} />}

        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : !selectedPropertyId ? (
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
            <p className="text-center text-yellow-700">Please select a property to view WTP data.</p>
          </div>
        ) : wtpData.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-gray-400 mb-4">
              <Activity size={48} className="mx-auto" />
            </div>
            <p className="text-center text-gray-700 mb-4">No WTP data available for this property.</p>
            <div className="flex justify-center">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Add New WTP Entry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Water Hardness Comparison */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="mr-2 text-orange-500" size={20} /> Hardness Comparison
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hardness" name="Raw Hardness" fill="#FF8042" />
                    <Bar dataKey="treatedHardness" name="Avg. Treated Hardness" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Water Quality Parameters */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Activity className="mr-2 text-orange-500" size={20} /> Water Quality
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="ph" name="pH Level" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="chlorine" name="Chlorine (ppm)" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium">Total Phases</h3>
                <p className="text-3xl font-bold mt-2">{wtpData.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium">Avg. pH Level</h3>
                <p className="text-3xl font-bold mt-2">
                  {(wtpData.reduce((sum, wtp) => sum + (wtp.ph_level || 0), 0) / wtpData.length).toFixed(1)}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium">Avg. Chlorine Level</h3>
                <p className="text-3xl font-bold mt-2">
                  {(wtpData.reduce((sum, wtp) => sum + (wtp.chlorine_level || 0), 0) / wtpData.length).toFixed(2)}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium">Total Salt Stock</h3>
                <p className="text-3xl font-bold mt-2">
                  {wtpData.reduce((sum, wtp) => sum + (wtp.salt_stock || 0), 0)} kg
                </p>
              </div>
            </div>

            {/* Detailed WTP Cards */}
            {wtpData.map((wtp) => (
              <WTPPhaseCard key={wtp.id} wtp={wtp} />
            ))}
          </>
        )}
        
        {/* Create WTP Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add New WTP Entry</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreateWTP} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name*</label>
                    <input
                      type="text"
                      name="phase_name"
                      value={formData.phase_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="e.g. Phase 1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raw Sump Level (m)</label>
                    <input
                      type="number"
                      name="raw_sump_level"
                      value={formData.raw_sump_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Raw sump level"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated Water Sump Level (m)</label>
                    <input
                      type="number"
                      name="treated_water_sump_level"
                      value={formData.treated_water_sump_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Treated water sump level"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raw Water Hardness (mg/L)</label>
                    <input
                      type="number"
                      name="raw_water_hardness"
                      value={formData.raw_water_hardness}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Raw water hardness"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated Water Hardness - Morning (mg/L)</label>
                    <input
                      type="number"
                      name="treated_water_hardness_morning"
                      value={formData.treated_water_hardness_morning}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Morning treated water hardness"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated Water Hardness - Evening (mg/L)</label>
                    <input
                      type="number"
                      name="treated_water_hardness_evening"
                      value={formData.treated_water_hardness_evening}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Evening treated water hardness"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated Water Meter (m³)</label>
                    <input
                      type="number"
                      name="treated_water_meter"
                      value={formData.treated_water_meter}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Treated water meter"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Energy Consumption (kWh)</label>
                    <input
                      type="number"
                      name="energy_consumption"
                      value={formData.energy_consumption}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Energy consumption"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Today's Salt Usage (kg)</label>
                    <input
                      type="number"
                      name="salt_todays_usage"
                      value={formData.salt_todays_usage}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Salt usage today"
                      step="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salt Stock (kg)</label>
                    <input
                      type="number"
                      name="salt_stock"
                      value={formData.salt_stock}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Salt stock"
                      step="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
                    <input
                      type="number"
                      name="ph_level"
                      value={formData.ph_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="pH level"
                      step="0.1"
                      min="0"
                      max="14"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chlorine Level (ppm)</label>
                    <input
                      type="number"
                      name="chlorine_level"
                      value={formData.chlorine_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Chlorine level"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turbidity (NTU)</label>
                    <input
                      type="number"
                      name="turbidity"
                      value={formData.turbidity}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Turbidity"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Create WTP Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadminWTPDashboard;