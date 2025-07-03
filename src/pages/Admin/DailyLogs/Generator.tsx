import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Pencil, RotateCcw, Battery, Zap, Gauge, Thermometer, DropletIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Types based on your API
type Property = {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
};

type DieselGenerator = {
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
};

// Generator form values type
type GeneratorFormValues = {
  name: string;
  capacity: string;
  running_hours: number;
  diesel_balance: number;
  diesel_capacity: number;
  kwh_units: number;
  battery_voltage: number;
  voltage_line_to_line: number;
  voltage_line_to_neutral: number;
  frequency: number;
  oil_pressure: number;
  rpm: number;
  coolant_temperature: number;
  diesel_topup: number;
};

const initialFormValues: GeneratorFormValues = {
  name: "",
  capacity: "",
  running_hours: 0,
  diesel_balance: 0,
  diesel_capacity: 0,
  kwh_units: 0,
  battery_voltage: 0,
  voltage_line_to_line: 0,
  voltage_line_to_neutral: 0,
  frequency: 0,
  oil_pressure: 0,
  rpm: 0,
  coolant_temperature: 0,
  diesel_topup: 0
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DieselGeneratorManager() {
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [generators, setGenerators] = useState<DieselGenerator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentGeneratorId, setCurrentGeneratorId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<GeneratorFormValues>(initialFormValues);

  // Add chart data state
  const [chartData, setChartData] = useState<any[]>([]);
  const [dieselUsageData, setDieselUsageData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch generators when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      fetchGenerators(selectedProperty);
    } else {
      setGenerators([]);
    }
  }, [selectedProperty]);

  // Prepare chart data when generators change
  useEffect(() => {
    if (generators.length > 0) {
      // Create data for running hours chart
      const runningHoursData = generators.map(gen => ({
        name: gen.name,
        hours: gen.running_hours
      }));
      
      // Create data for diesel usage chart
      const dieselData = generators.map(gen => {
        const usedPercentage = (gen.diesel_capacity > 0) 
          ? ((gen.diesel_capacity - gen.diesel_balance) / gen.diesel_capacity) * 100 
          : 0;
          
        return {
          name: gen.name,
          balance: gen.diesel_balance,
          capacity: gen.diesel_capacity,
          used: gen.diesel_capacity - gen.diesel_balance,
          usedPercentage: usedPercentage.toFixed(1)
        };
      });
      
      // Create data for performance metrics chart
      const performanceData = generators.map(gen => ({
        name: gen.name,
        battery: gen.battery_voltage || 0,
        frequency: gen.frequency || 0,
        temperature: gen.coolant_temperature || 0,
        pressure: gen.oil_pressure || 0
      }));
      
      setChartData(runningHoursData);
      setDieselUsageData(dieselData);
      setPerformanceData(performanceData);
    }
  }, [generators]);

  // API calls
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://server.prktechindia.in/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      setProperties(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching properties: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const fetchGenerators = async (propertyId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators?property_id=${propertyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch generators");
      }
      const data = await response.json();
      setGenerators(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching generators: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const createGenerator = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://server.prktechindia.in/diesel-generators/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formValues,
          property_id: selectedProperty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
      resetForm();
    } catch (err) {
      setError("Error creating generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const updateGenerator = async () => {
    if (!currentGeneratorId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators/${currentGeneratorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
      resetForm();
    } catch (err) {
      setError("Error updating generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const deleteGenerator = async (generatorId: string) => {
    if (!confirm("Are you sure you want to delete this generator?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators/${generatorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
    } catch (err) {
      setError("Error deleting generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  // Event handlers
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProperty(e.target.value);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormValues({
      ...formValues,
      [name]: name === "name" || name === "capacity" ? value : parseFloat(value) || 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateGenerator();
    } else {
      createGenerator();
    }
  };

  const handleEdit = (generator: DieselGenerator) => {
    setIsEditing(true);
    setCurrentGeneratorId(generator.id);
    setFormValues({
      name: generator.name,
      capacity: generator.capacity || "",
      running_hours: generator.running_hours,
      diesel_balance: generator.diesel_balance,
      diesel_capacity: generator.diesel_capacity,
      kwh_units: generator.kwh_units,
      battery_voltage: generator.battery_voltage || 0,
      voltage_line_to_line: generator.voltage_line_to_line || 0,
      voltage_line_to_neutral: generator.voltage_line_to_neutral || 0,
      frequency: generator.frequency || 0,
      oil_pressure: generator.oil_pressure || 0,
      rpm: generator.rpm || 0,
      coolant_temperature: generator.coolant_temperature || 0,
      diesel_topup: generator.diesel_topup,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormValues(initialFormValues);
    setShowForm(false);
    setIsEditing(false);
    setCurrentGeneratorId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-blue-900 text-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold">Diesel Generator Management</h1>
              <p className="text-white/80 mt-1">Monitor and manage your diesel generators</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded flex items-center transition-colors"
              >
                <PlusCircle size={18} className="mr-1" /> Add Generator
              </button>
              <button 
                onClick={() => {
                  if (selectedProperty) {
                    fetchGenerators(selectedProperty);
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded flex items-center transition-colors"
              >
                <RotateCcw size={18} className="mr-1" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Property Selector */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label htmlFor="property" className="block text-gray-700 font-medium mb-2">
            Select Property:
          </label>
          <div className="flex gap-2">
            <select
              id="property"
              value={selectedProperty}
              onChange={handlePropertyChange}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-md">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {!loading && !error && generators.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generator Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Running Hours Chart */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Gauge className="mr-2 text-blue-600" size={20} /> Running Hours
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hours" name="Running Hours" fill="#1a365d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diesel Usage Chart */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <DropletIcon className="mr-2 text-orange-500" size={20} /> Diesel Usage
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dieselUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="balance" name="Current (L)" fill="#0088FE" stackId="a" />
                      <Bar dataKey="used" name="Used (L)" fill="#FF8042" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Metrics Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <Zap className="mr-2 text-yellow-500" size={20} /> Performance Metrics
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="battery" name="Battery Voltage" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="frequency" name="Frequency" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="temperature" name="Coolant Temperature" stroke="#ff7300" />
                    <Line yAxisId="right" type="monotone" dataKey="pressure" name="Oil Pressure" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diesel Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {dieselUsageData.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{item.name} - Diesel Status</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-medium">{item.balance.toFixed(1)} L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div 
                      className={`h-2.5 rounded-full ${item.balance / item.capacity > 0.25 ? 'bg-green-600' : 'bg-red-600'}`} 
                      style={{width: `${Math.min(100, Math.max(0, (item.balance / item.capacity) * 100))}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {((item.balance / item.capacity) * 100).toFixed(1)}% full
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No generators message */}
        {!loading && !error && selectedProperty && generators.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No generators found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new generator.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Generator
              </button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* Generator Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {isEditing ? "Update Generator" : "Add New Generator"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-gray-700 mb-1">Capacity</label>
                  <input
                    type="text"
                    id="capacity"
                    name="capacity"
                    value={formValues.capacity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g. 750 KVA"
                  />
                </div>
                <div>
                  <label htmlFor="running_hours" className="block text-gray-700 mb-1">Running Hours</label>
                  <input
                    type="number"
                    id="running_hours"
                    name="running_hours"
                    value={formValues.running_hours}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="diesel_balance" className="block text-gray-700 mb-1">Diesel Balance (L)</label>
                  <input
                    type="number"
                    id="diesel_balance"
                    name="diesel_balance"
                    value={formValues.diesel_balance}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="diesel_capacity" className="block text-gray-700 mb-1">Diesel Capacity (L)</label>
                  <input
                    type="number"
                    id="diesel_capacity"
                    name="diesel_capacity"
                    value={formValues.diesel_capacity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="kwh_units" className="block text-gray-700 mb-1">kWh Units</label>
                  <input
                    type="number"
                    id="kwh_units"
                    name="kwh_units"
                    value={formValues.kwh_units}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="battery_voltage" className="block text-gray-700 mb-1">Battery Voltage</label>
                  <input
                    type="number"
                    id="battery_voltage"
                    name="battery_voltage"
                    value={formValues.battery_voltage}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="voltage_line_to_line" className="block text-gray-700 mb-1">Line-to-Line Voltage</label>
                  <input
                    type="number"
                    id="voltage_line_to_line"
                    name="voltage_line_to_line"
                    value={formValues.voltage_line_to_line}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="voltage_line_to_neutral" className="block text-gray-700 mb-1">Line-to-Neutral Voltage</label>
                  <input
                    type="number"
                    id="voltage_line_to_neutral"
                    name="voltage_line_to_neutral"
                    value={formValues.voltage_line_to_neutral}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="frequency" className="block text-gray-700 mb-1">Frequency (Hz)</label>
                  <input
                    type="number"
                    id="frequency"
                    name="frequency"
                    value={formValues.frequency}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="oil_pressure" className="block text-gray-700 mb-1">Oil Pressure (psi)</label>
                  <input
                    type="number"
                    id="oil_pressure"
                    name="oil_pressure"
                    value={formValues.oil_pressure}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="rpm" className="block text-gray-700 mb-1">RPM</label>
                  <input
                    type="number"
                    id="rpm"
                    name="rpm"
                    value={formValues.rpm}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="coolant_temperature" className="block text-gray-700 mb-1">Coolant Temperature (°C)</label>
                  <input
                    type="number"
                    id="coolant_temperature"
                    name="coolant_temperature"
                    value={formValues.coolant_temperature}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label htmlFor="diesel_topup" className="block text-gray-700 mb-1">Diesel Topup (L)</label>
                  <input
                    type="number"
                    id="diesel_topup"
                    name="diesel_topup"
                    value={formValues.diesel_topup}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Processing..." : isEditing ? "Update Generator" : "Add Generator"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generators List */}
        {!loading && generators.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Generators List</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Running Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diesel Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generators.map((generator) => (
                    <tr key={generator.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{generator.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{generator.capacity || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{generator.running_hours.toFixed(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-2">{generator.diesel_balance.toFixed(1)} L</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${generator.diesel_balance / generator.diesel_capacity > 0.25 ? 'bg-green-600' : 'bg-red-600'}`} 
                              style={{width: `${Math.min(100, Math.max(0, (generator.diesel_balance / generator.diesel_capacity) * 100))}%`}}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{generator.kwh_units.toFixed(1)} kWh</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(generator)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => deleteGenerator(generator.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}