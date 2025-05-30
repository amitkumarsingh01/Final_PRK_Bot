import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, RefreshCw, BarChart3, Battery, Clock, Cloud, Droplet, Gauge } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';

// Define types based on the provided model
interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface DieselGenerator {
  id: string;
  property_id: string;
  name: string;
  capacity?: string;
  running_hours: number;
  diesel_balance: number;
  diesel_capacity: number;
  kwh_units: number;
  battery_voltage?: number;
  voltage_line_to_line?: number;
  voltage_line_to_neutral?: number;
  frequency?: number;
  oil_pressure?: number;
  rpm?: number;
  coolant_temperature?: number;
  diesel_topup: number;
  created_at: string;
  updated_at: string;
}

interface CreateGeneratorData {
  property_id: string;
  name: string;
  capacity?: string;
  running_hours?: number;
  diesel_balance?: number;
  diesel_capacity?: number;
  kwh_units?: number;
  battery_voltage?: number;
  voltage_line_to_line?: number;
  voltage_line_to_neutral?: number;
  frequency?: number;
  oil_pressure?: number;
  rpm?: number;
  coolant_temperature?: number;
  diesel_topup?: number;
}

interface UpdateGeneratorData {
  name?: string;
  capacity?: string;
  running_hours?: number;
  diesel_balance?: number;
  diesel_capacity?: number;
  kwh_units?: number;
  battery_voltage?: number;
  voltage_line_to_line?: number;
  voltage_line_to_neutral?: number;
  frequency?: number;
  oil_pressure?: number;
  rpm?: number;
  coolant_temperature?: number;
  diesel_topup?: number;
}

const API_BASE_URL = "https://server.prktechindia.in";

export default function CadminDieselGeneratorDashboard() {
  const [generators, setGenerators] = useState<DieselGenerator[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState<DieselGenerator | null>(null);
  const [formData, setFormData] = useState<CreateGeneratorData | UpdateGeneratorData>({
    property_id: "",
    name: "",
  });
  const [runningHoursData, setRunningHoursData] = useState<any[]>([]);
  const [dieselUsageData, setDieselUsageData] = useState<any[]>([]);

  // Colors
  const primaryColor = "text-blue-900";
  const secondaryColor = "text-orange-500";
  const primaryBgColor = "bg-blue-900";
  const secondaryBgColor = "bg-orange-500";
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Fetch properties
  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`);
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (err) {
      setError("Failed to load properties. Please try again later.");
      console.error(err);
    }
  };

  // Fetch generators
  const fetchGenerators = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/diesel-generators/?property_id=${selectedPropertyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch generators");
      }
      const data = await response.json();
      setGenerators(data);
      
      // Create chart data
      prepareChartData(data);
    } catch (err) {
      setError("Failed to load generators. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = (data: DieselGenerator[]) => {
    // Running hours chart data
    const hoursData = data.map(generator => ({
      name: generator.name,
      hours: generator.running_hours,
    }));
    setRunningHoursData(hoursData);

    // Diesel usage chart data
    const dieselData = data.map(generator => ({
      name: generator.name,
      balance: generator.diesel_balance,
      capacity: generator.diesel_capacity,
      used: generator.diesel_capacity - generator.diesel_balance,
      percentage: (generator.diesel_balance / generator.diesel_capacity) * 100,
      efficiency: generator.kwh_units > 0 && generator.running_hours > 0 
        ? generator.kwh_units / generator.running_hours 
        : 0,
      voltage: generator.voltage_line_to_line || 0,
      frequency: generator.frequency || 0,
      batteryHealth: generator.battery_voltage 
        ? (generator.battery_voltage / 12) * 100 // Assuming 12V is max battery voltage
        : 0
    }));
    setDieselUsageData(dieselData);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchGenerators();
      setFormData(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  // Handle property selection change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPropertyId(e.target.value);
  };

  // Create generator
  const createGenerator = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/diesel-generators/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create generator");
      }
      
      setShowAddModal(false);
      setFormData({ property_id: selectedPropertyId, name: "" });
      fetchGenerators();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  // Update generator
  const updateGenerator = async () => {
    if (!selectedGenerator) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/diesel-generators/${selectedGenerator.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update generator");
      }
      
      setShowEditModal(false);
      setSelectedGenerator(null);
      setFormData({ property_id: selectedPropertyId, name: "" });
      fetchGenerators();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  // Delete generator
  const deleteGenerator = async () => {
    if (!selectedGenerator) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/diesel-generators/${selectedGenerator.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete generator");
      }
      
      setShowDeleteModal(false);
      setSelectedGenerator(null);
      fetchGenerators();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    const processedValue = type === "number" ? (value === "" ? undefined : parseFloat(value)) : value;
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  // Open edit modal and prefill with generator data
  const openEditModal = (generator: DieselGenerator) => {
    // Extract only the fields that we need for update
    const {
      name,
      capacity,
      running_hours,
      diesel_balance,
      diesel_capacity,
      kwh_units,
      battery_voltage,
      voltage_line_to_line,
      voltage_line_to_neutral,
      frequency,
      oil_pressure,
      rpm,
      coolant_temperature,
      diesel_topup,
    } = generator;
    
    setFormData({
      name,
      capacity,
      running_hours,
      diesel_balance,
      diesel_capacity,
      kwh_units,
      battery_voltage,
      voltage_line_to_line,
      voltage_line_to_neutral,
      frequency,
      oil_pressure,
      rpm,
      coolant_temperature,
      diesel_topup,
    });
    
    setSelectedGenerator(generator);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDieselPercentage = (balance: number, capacity: number) => {
    if (capacity <= 0) return 0;
    return Math.min(100, Math.max(0, (balance / capacity) * 100));
  };

  return (
    <div className="bg-white min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`${primaryBgColor} text-white rounded-lg shadow p-4 md:p-6 flex flex-col md:flex-row justify-between items-center mb-6`}>
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <BarChart3 className="mr-2" /> Diesel Generator Management
            </h1>
            <p className="text-white/80 mt-1">
              Monitor and manage diesel generators for your properties
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormData({ 
                  property_id: selectedPropertyId,
                  name: "" 
                });
                setShowAddModal(true);
              }}
              className={`${secondaryBgColor} text-white py-2 px-4 rounded-md flex items-center`}
            >
              <Plus className="mr-1" size={18} /> Add Generator
            </button>
            <button
              onClick={fetchGenerators}
              className="bg-white/10 text-white py-2 px-4 rounded-md flex items-center"
            >
              <RefreshCw className="mr-1" size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Property Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
          <label htmlFor="property" className="block text-gray-700 font-medium mb-2">
            Select Property:
          </label>
          <select
            id="property"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedPropertyId}
            onChange={handlePropertyChange}
            disabled={loading || properties.length === 0}
          >
            {properties.length === 0 ? (
              <option value="">No properties available</option>
            ) : (
              properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {generators.length > 0 && (
          <>
            {/* Summary Stats Cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <Clock className="mr-2" size={18} /> Total Running Hours
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {generators.reduce((total, gen) => total + gen.running_hours, 0).toFixed(1)}h
                </p>
              </div>
              
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                  <Droplet className="mr-2" size={18} /> Total Diesel Capacity
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {generators.reduce((total, gen) => total + gen.diesel_capacity, 0).toFixed(1)}L
                </p>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-green-800 flex items-center">
                  <Battery className="mr-2" size={18} /> Avg Battery Voltage
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {generators.filter(gen => gen.battery_voltage).length > 0 
                    ? (generators.reduce((total, gen) => total + (gen.battery_voltage || 0), 0) / 
                       generators.filter(gen => gen.battery_voltage).length).toFixed(1) 
                    : 'N/A'}V
                </p>
              </div>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                  <Gauge className="mr-2" size={18} /> Total Power Generated
                </h3>
                <p className="text-3xl font-bold mt-2">
                  {generators.reduce((total, gen) => total + gen.kwh_units, 0).toFixed(1)} kWh
                </p>
              </div>
            </div>
            
            {/* Main Charts Grid */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Running Hours Chart - Enhanced */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className={`${primaryColor} text-xl font-bold mb-4 flex items-center`}>
                  <Clock className="mr-2" size={20} /> Running Hours & Efficiency
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={dieselUsageData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#1a365d" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff7300" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="hours" 
                      name="Running Hours (h)" 
                      fill="#1a365d" 
                      barSize={40}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="efficiency"
                      name="Efficiency (kWh/h)"
                      stroke="#ff7300"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Diesel Usage Chart - Enhanced */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className={`${secondaryColor} text-xl font-bold mb-4 flex items-center`}>
                  <Droplet className="mr-2" size={20} /> Diesel Usage
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={dieselUsageData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="capacity" 
                      name="Total Capacity (L)" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      name="Current Balance (L)" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Generator Performance Radar Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className={`text-xl font-bold mb-4 flex items-center text-purple-700`}>
                  <Gauge className="mr-2" size={20} /> Generator Performance Metrics
                </h2>
                {generators.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="80%" 
                      data={[
                        { 
                          subject: 'Energy Efficiency', 
                          A: generators[0].kwh_units / (generators[0].running_hours || 1) * 10, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Fuel Usage', 
                          A: (generators[0].diesel_balance / generators[0].diesel_capacity) * 100, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Battery Health', 
                          A: (generators[0].battery_voltage || 12) / 14 * 100, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Frequency', 
                          A: ((generators[0].frequency || 50) / 50) * 100, 
                          fullMark: 100 
                        },
                        { 
                          subject: 'Voltage', 
                          A: ((generators[0].voltage_line_to_line || 400) / 440) * 100, 
                          fullMark: 100 
                        }
                      ]}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar 
                        name="Performance" 
                        dataKey="A" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6} 
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Diesel Distribution Pie Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className={`text-xl font-bold mb-4 flex items-center text-orange-700`}>
                  <Droplet className="mr-2" size={20} /> Diesel Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dieselUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="balance"
                    >
                      {dieselUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [`${value.toFixed(1)}L`, props.payload.name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        
        {/* Rest of component including generators list, add/edit/delete modals, etc. */}
      </div>
    </div>
  );
}