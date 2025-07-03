import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useProfile } from '../../../context/ProfileContext';
import { useAuth } from '../../../context/AuthContext';
import { Droplet, TrendingUp, Filter, AlertCircle, BarChart2, Activity } from 'lucide-react';

// Define interfaces
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface STP {
  id: string;
  property_id: string;
  phase_name: string;
  tank1_mlss?: number;
  tank2_mlss?: number;
  ph_level?: number;
  chlorine_level?: number;
  smell?: string;
  energy_consumption?: number;
  raw_sewage_flow?: number;
  treated_water_flow?: number;
  raw_sewage_tank_level?: number;
  filter_feed_tank_level?: number;
  flush_water_tank_level?: number;
  air_smell?: string;
  bod_inlet?: number;
  bod_outlet?: number;
  cod_inlet?: number;
  cod_outlet?: number;
  created_time: string;
  updated_time: string;
}

// Define form interface
interface STPForm {
  phase_name: string;
  tank1_mlss: string;
  tank2_mlss: string;
  ph_level: string;
  chlorine_level: string;
  smell: string;
  energy_consumption: string;
  raw_sewage_flow: string;
  treated_water_flow: string;
  raw_sewage_tank_level: string;
  filter_feed_tank_level: string;
  flush_water_tank_level: string;
  air_smell: string;
  bod_inlet: string;
  bod_outlet: string;
  cod_inlet: string;
  cod_outlet: string;
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const STPDashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stpData, setStpData] = useState<STP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSTP, setSelectedSTP] = useState<STP | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<STPForm>({
    phase_name: '',
    tank1_mlss: '',
    tank2_mlss: '',
    ph_level: '',
    chlorine_level: '',
    smell: '',
    energy_consumption: '',
    raw_sewage_flow: '',
    treated_water_flow: '',
    raw_sewage_tank_level: '',
    filter_feed_tank_level: '',
    flush_water_tank_level: '',
    air_smell: '',
    bod_inlet: '',
    bod_outlet: '',
    cod_inlet: '',
    cod_outlet: ''
  });
  
  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  // Get default property_id from profile
  const defaultPropertyId = profile?.property_id || '';
  
  // Add a loading state for profile
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
        const response = await fetch('https://server.prktechindia.in/properties', {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        setProperties(data);
        
        if (data.length > 0) {
          // If we have a property from profile, use it, otherwise use first property
          if (defaultPropertyId && data.some(p => p.id === defaultPropertyId)) {
            setSelectedPropertyId(defaultPropertyId);
          } else {
            setSelectedPropertyId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to fetch properties');
      }
    };
    
    fetchProperties();
  }, [defaultPropertyId, user?.token]);

  // Fetch STP data when property changes
  useEffect(() => {
    if (!selectedPropertyId) return;
    
    const fetchSTPData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://server.prktechindia.in/properties/${selectedPropertyId}/stp`, {
          headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {}
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch STP data');
        }
        
        const data = await response.json();
        setStpData(data);
        if (data.length > 0) {
          setSelectedSTP(data[0]);
        } else {
          setSelectedSTP(null);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSTPData();
  }, [selectedPropertyId, user?.token]);

  // Handle property selection change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPropertyId(e.target.value);
  };

  const handleCreateSTP = async (e: React.FormEvent) => {
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
        tank1_mlss: formData.tank1_mlss ? parseFloat(formData.tank1_mlss) : null,
        tank2_mlss: formData.tank2_mlss ? parseFloat(formData.tank2_mlss) : null,
        ph_level: formData.ph_level ? parseFloat(formData.ph_level) : null,
        chlorine_level: formData.chlorine_level ? parseFloat(formData.chlorine_level) : null,
        smell: formData.smell || null,
        energy_consumption: formData.energy_consumption ? parseFloat(formData.energy_consumption) : null,
        raw_sewage_flow: formData.raw_sewage_flow ? parseFloat(formData.raw_sewage_flow) : null,
        treated_water_flow: formData.treated_water_flow ? parseFloat(formData.treated_water_flow) : null,
        raw_sewage_tank_level: formData.raw_sewage_tank_level ? parseFloat(formData.raw_sewage_tank_level) : null,
        filter_feed_tank_level: formData.filter_feed_tank_level ? parseFloat(formData.filter_feed_tank_level) : null,
        flush_water_tank_level: formData.flush_water_tank_level ? parseFloat(formData.flush_water_tank_level) : null,
        air_smell: formData.air_smell || null,
        bod_inlet: formData.bod_inlet ? parseFloat(formData.bod_inlet) : null,
        bod_outlet: formData.bod_outlet ? parseFloat(formData.bod_outlet) : null,
        cod_inlet: formData.cod_inlet ? parseFloat(formData.cod_inlet) : null,
        cod_outlet: formData.cod_outlet ? parseFloat(formData.cod_outlet) : null
      };
      
      console.log("Sending STP payload:", payload);
      
      const response = await fetch('https://server.prktechindia.in/stp/', {
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
        throw new Error(`Failed to create STP entry: ${response.status} ${response.statusText}`);
      }
      
      const newSTP = await response.json();
      setStpData(prev => [...prev, newSTP]);
      setSelectedSTP(newSTP);
      setShowCreateModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      console.error("Error creating STP entry:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      phase_name: '',
      tank1_mlss: '',
      tank2_mlss: '',
      ph_level: '',
      chlorine_level: '',
      smell: '',
      energy_consumption: '',
      raw_sewage_flow: '',
      treated_water_flow: '',
      raw_sewage_tank_level: '',
      filter_feed_tank_level: '',
      flush_water_tank_level: '',
      air_smell: '',
      bod_inlet: '',
      bod_outlet: '',
      cod_inlet: '',
      cod_outlet: ''
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Prepare chart data
  const prepareWaterQualityData = () => {
    if (stpData.length === 0) return [];
    
    return stpData.map(item => ({
      name: item.phase_name,
      ph: item.ph_level || 0,
      chlorine: item.chlorine_level || 0,
      reduction: item.bod_inlet && item.bod_outlet 
        ? ((item.bod_inlet - item.bod_outlet) / item.bod_inlet) * 100 
        : 0
    }));
  };

  // Prepare flow data
  const prepareFlowData = () => {
    if (stpData.length === 0) return [];
    
    return stpData.map(item => ({
      name: item.phase_name,
      rawFlow: item.raw_sewage_flow || 0,
      treatedFlow: item.treated_water_flow || 0,
      efficiency: item.raw_sewage_flow && item.treated_water_flow 
        ? ((item.treated_water_flow / item.raw_sewage_flow) * 100).toFixed(1)
        : 0
    }));
  };

  // Prepare MLSS data
  const prepareMLSSData = () => {
    if (stpData.length === 0) return [];
    
    return stpData.map(item => ({
      name: item.phase_name,
      tank1: item.tank1_mlss || 0,
      tank2: item.tank2_mlss || 0
    }));
  };

  // Prepare tank levels data
  const prepareTankLevelsData = () => {
    if (!selectedSTP) return [];
    
    return [
      { name: 'Raw Sewage', value: selectedSTP.raw_sewage_tank_level || 0 },
      { name: 'Filter Feed', value: selectedSTP.filter_feed_tank_level || 0 },
      { name: 'Flush Water', value: selectedSTP.flush_water_tank_level || 0 }
    ];
  };

  // Prepare efficiency data for radar chart
  const prepareEfficiencyData = () => {
    if (!selectedSTP) return [];
    
    const bod_efficiency = selectedSTP.bod_inlet && selectedSTP.bod_outlet 
      ? Math.max(0, 100 - ((selectedSTP.bod_outlet / selectedSTP.bod_inlet) * 100))
      : 0;
      
    const cod_efficiency = selectedSTP.cod_inlet && selectedSTP.cod_outlet 
      ? Math.max(0, 100 - ((selectedSTP.cod_outlet / selectedSTP.cod_inlet) * 100))
      : 0;
    
    return [
      { subject: 'BOD Reduction', A: bod_efficiency, fullMark: 100 },
      { subject: 'COD Reduction', A: cod_efficiency, fullMark: 100 },
      { subject: 'Flow Efficiency', A: selectedSTP.raw_sewage_flow && selectedSTP.treated_water_flow 
        ? ((selectedSTP.treated_water_flow / selectedSTP.raw_sewage_flow) * 100)
        : 0, fullMark: 100 },
      { subject: 'pH Level', A: selectedSTP.ph_level ? Math.min(100, (selectedSTP.ph_level / 14) * 100) : 0, fullMark: 100 },
      { subject: 'Chlorine', A: selectedSTP.chlorine_level ? Math.min(100, selectedSTP.chlorine_level * 33) : 0, fullMark: 100 },
    ];
  };

  if (profileLoading && !properties.length) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DD6A1A]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-[#060C18] text-white p-6 rounded-lg shadow-md">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <Droplet className="mr-2" /> STP Dashboard
            </h1>
            <p className="text-white/80 mt-1">Monitor and manage sewage treatment plants</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#F88024] hover:bg-[#DF5F0D] text-white rounded-lg transition-colors flex items-center"
          >
            <Filter className="mr-2" size={18} /> Add New STP Entry
          </button>
        </div>

        {/* Property Selector */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label htmlFor="property" className="block text-gray-700 font-medium mb-2">
            Select Property:
          </label>
          <select
            id="property"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F88024] focus:border-transparent"
            value={selectedPropertyId}
            onChange={handlePropertyChange}
            disabled={loading || properties.length === 0}
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.title}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
            <button 
              className="ml-auto" 
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DD6A1A]"></div>
          </div>
        ) : !selectedPropertyId ? (
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md text-center">
            <p className="text-yellow-700">Please select a property to view STP data.</p>
          </div>
        ) : stpData.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-gray-400 mb-4">
              <Activity size={48} className="mx-auto" />
            </div>
            <p className="text-gray-700 mb-4">No STP data found for this property.</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#F88024] hover:bg-[#DF5F0D] text-white rounded-lg transition-colors"
            >
              Add New STP Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* STP List Sidebar */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
              <h2 className="text-xl font-semibold mb-3 text-[#060C18]">STP Phases</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stpData.map((stp) => (
                  <div 
                    key={stp.id}
                    onClick={() => setSelectedSTP(stp)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedSTP?.id === stp.id 
                        ? 'bg-[#F88024] text-white' 
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{stp.phase_name}</div>
                    <div className="text-sm opacity-80">
                      {formatDate(stp.created_time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Water Quality Chart */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-4 text-[#060C18] flex items-center">
                    <TrendingUp className="mr-2 text-[#F88024]" size={20} /> Water Quality Parameters
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={prepareWaterQualityData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ph" name="pH Level" fill="#8884d8" />
                      <Bar dataKey="chlorine" name="Chlorine Level" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Flow Chart */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold mb-4 text-[#060C18] flex items-center">
                    <BarChart2 className="mr-2 text-[#F88024]" size={20} /> Water Flow Comparison
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={prepareFlowData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rawFlow" name="Raw Sewage Flow" fill="#8884d8" />
                      <Bar dataKey="treatedFlow" name="Treated Water Flow" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {selectedSTP && (
                <>
                  {/* Selected STP Details */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="border-b pb-4 mb-6">
                      <h2 className="text-xl font-bold text-[#060C18]">{selectedSTP.phase_name}</h2>
                      <p className="text-sm text-gray-500">Last updated: {formatDate(selectedSTP.updated_time)}</p>
                    </div>

                    {/* MLSS and Tank Levels Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* MLSS Chart */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[#060C18]">MLSS Levels</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[{ 
                            name: 'MLSS', 
                            tank1: selectedSTP.tank1_mlss || 0, 
                            tank2: selectedSTP.tank2_mlss || 0 
                          }]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tank1" name="Tank 1 MLSS" fill="#0088FE" />
                            <Bar dataKey="tank2" name="Tank 2 MLSS" fill="#00C49F" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Tank Levels Chart */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[#060C18]">Tank Levels</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={prepareTankLevelsData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareTankLevelsData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Efficiency Radar Chart */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-[#060C18]">Treatment Efficiency</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={prepareEfficiencyData()}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Efficiency %" dataKey="A" stroke="#F88024" fill="#F88024" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* STP Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">pH Level</h4>
                        <p className="text-2xl font-bold">{selectedSTP.ph_level || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">Chlorine Level</h4>
                        <p className="text-2xl font-bold">{selectedSTP.chlorine_level || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">Energy Consumption</h4>
                        <p className="text-2xl font-bold">{selectedSTP.energy_consumption || 'N/A'} kWh</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">BOD Reduction</h4>
                        <p className="text-2xl font-bold">
                          {selectedSTP.bod_inlet && selectedSTP.bod_outlet
                            ? `${((selectedSTP.bod_inlet - selectedSTP.bod_outlet) / selectedSTP.bod_inlet * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">COD Reduction</h4>
                        <p className="text-2xl font-bold">
                          {selectedSTP.cod_inlet && selectedSTP.cod_outlet
                            ? `${((selectedSTP.cod_inlet - selectedSTP.cod_outlet) / selectedSTP.cod_inlet * 100).toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500">Air Quality</h4>
                        <p className="text-2xl font-bold">{selectedSTP.air_smell || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create STP Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#060C18]">Add New STP Entry</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreateSTP} className="space-y-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tank 1 MLSS</label>
                    <input
                      type="number"
                      name="tank1_mlss"
                      value={formData.tank1_mlss}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="MLSS value"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tank 2 MLSS</label>
                    <input
                      type="number"
                      name="tank2_mlss"
                      value={formData.tank2_mlss}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="MLSS value"
                      step="0.01"
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
                      placeholder="pH value"
                      step="0.1"
                      min="0"
                      max="14"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chlorine Level</label>
                    <input
                      type="number"
                      name="chlorine_level"
                      value={formData.chlorine_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Chlorine value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Smell</label>
                    <select
                      name="smell"
                      value={formData.smell}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">Select smell</option>
                      <option value="Good">Good</option>
                      <option value="Normal">Normal</option>
                      <option value="Bad">Bad</option>
                    </select>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raw Sewage Flow</label>
                    <input
                      type="number"
                      name="raw_sewage_flow"
                      value={formData.raw_sewage_flow}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Flow value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated Water Flow</label>
                    <input
                      type="number"
                      name="treated_water_flow"
                      value={formData.treated_water_flow}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Flow value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raw Sewage Tank Level</label>
                    <input
                      type="number"
                      name="raw_sewage_tank_level"
                      value={formData.raw_sewage_tank_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Tank level"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter Feed Tank Level</label>
                    <input
                      type="number"
                      name="filter_feed_tank_level"
                      value={formData.filter_feed_tank_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Tank level"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flush Water Tank Level</label>
                    <input
                      type="number"
                      name="flush_water_tank_level"
                      value={formData.flush_water_tank_level}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Tank level"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Air Smell</label>
                    <select
                      name="air_smell"
                      value={formData.air_smell}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">Select air smell</option>
                      <option value="Good">Good</option>
                      <option value="Normal">Normal</option>
                      <option value="Bad">Bad</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BOD Inlet</label>
                    <input
                      type="number"
                      name="bod_inlet"
                      value={formData.bod_inlet}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="BOD value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BOD Outlet</label>
                    <input
                      type="number"
                      name="bod_outlet"
                      value={formData.bod_outlet}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="BOD value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">COD Inlet</label>
                    <input
                      type="number"
                      name="cod_inlet"
                      value={formData.cod_inlet}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="COD value"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">COD Outlet</label>
                    <input
                      type="number"
                      name="cod_outlet"
                      value={formData.cod_outlet}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="COD value"
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
                    className="px-4 py-2 bg-[#F88024] hover:bg-[#DF5F0D] text-white rounded-lg transition-colors"
                  >
                    Create STP Entry
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

export default STPDashboard;