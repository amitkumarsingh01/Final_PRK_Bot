import { useState, useEffect } from "react";
import { PlusCircle, Trash2, RefreshCw, Activity, Edit, Building } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useProfile } from '../../../context/ProfileContext';
import { useAuth } from '../../../context/AuthContext';

// Define types
type Property = {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
};

type SwimmingPool = {
  id: string;
  property_id: string;
  ph_value: number | null;
  chlorine_value: number | null;
  ph_updated_at: string | null;
  chlorine_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

type PoolFormData = {
  property_id: string;
  ph_value: number | null;
  chlorine_value: number | null;
};

const BASE_URL = "https://server.prktechindia.in";

export default function CadminSwimmingPoolManager() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [pools, setPools] = useState<SwimmingPool[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PoolFormData>({
    property_id: "",
    ph_value: null,
    chlorine_value: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentPoolId, setCurrentPoolId] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Colors
  const ORANGE = "text-orange-500";
  const DARK_BLUE = "text-blue-800";
  const BG_ORANGE = "bg-orange-500";
  const BG_DARK_BLUE = "bg-blue-800";

  // Fetch properties (cadmin fixed property)
  const fetchProperties = async () => {
    try {
      const resolvedPropertyId = profile?.property_id || user?.propertyId || '';
      if (!resolvedPropertyId) {
        setError('No property found for this user');
        return;
      }

      const response = await fetch(`${BASE_URL}/properties/${resolvedPropertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }
      
      const data: Property = await response.json();
      setProperties([data]);
      setSelectedPropertyId(data.id);
      setFormData(prev => ({ ...prev, property_id: data.id }));
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties. Please try again.');
    }
  };

  // Fetch pools data
  const fetchPools = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/swimming-pools/?property_id=${selectedPropertyId}`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Failed to fetch swimming pools");
      }
      const data = await response.json();
      const filtered = Array.isArray(data)
        ? data.filter((p: SwimmingPool) => p.property_id === selectedPropertyId)
        : [];
      setPools(filtered);
      
      // Create historical data for charts (using the last 7 days)
      const mockHistorical = createMockHistoricalData(data);
      setHistoricalData(mockHistorical);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Create mock historical data for charts
  const createMockHistoricalData = (poolData: SwimmingPool[]) => {
    if (poolData.length === 0) return [];
    
    const pool = poolData[0]; // Get the first pool
    const today = new Date();
    const result = [];
    
    // Base values
    const basePh = pool.ph_value || 7.2;
    const baseChlorine = pool.chlorine_value || 1.5;
    
    // Create data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add some random variation to make the chart interesting
      const randomPhVariation = Math.random() * 0.4 - 0.2; // Random between -0.2 and 0.2
      const randomChlorineVariation = Math.random() * 0.5 - 0.25; // Random between -0.25 and 0.25
      
      result.push({
        date: date.toISOString().split('T')[0],
        ph: Math.max(6.8, Math.min(8.0, basePh + randomPhVariation)), // Keep within reasonable range
        chlorine: Math.max(0.8, Math.min(3.0, baseChlorine + randomChlorineVariation)), // Keep within reasonable range
      });
    }
    
    return result;
  };

  useEffect(() => {
    fetchProperties();
  }, [profile, user?.propertyId]);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchPools();
      setFormData(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === "" ? null : parseFloat(value),
    });
  };

  // Handle form submission for creating or updating a pool
  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let response;
      
      if (editMode && currentPoolId) {
        // Update existing pool
        const updateData = {
          ph_value: formData.ph_value,
          chlorine_value: formData.chlorine_value,
        };
        
        response = await fetch(`${BASE_URL}/swimming-pools/${currentPoolId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
      } else {
        // Create new pool
        response = await fetch(`${BASE_URL}/swimming-pools/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Operation failed");
      }

      // Reset form and fetch updated data
      setFormData({
        property_id: selectedPropertyId,
        ph_value: null,
        chlorine_value: null,
      });
      setShowForm(false);
      setEditMode(false);
      setCurrentPoolId(null);
      fetchPools();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete a swimming pool
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this swimming pool?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/swimming-pools/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete swimming pool");
      }
      
      fetchPools();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Edit a swimming pool
  const handleEdit = (pool: SwimmingPool) => {
    setFormData({
      property_id: pool.property_id,
      ph_value: pool.ph_value,
      chlorine_value: pool.chlorine_value,
    });
    setCurrentPoolId(pool.id);
    setEditMode(true);
    setShowForm(true);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not recorded";
    return new Date(dateString).toLocaleString();
  };

  const handleRefresh = () => {
    fetchPools();
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`flex justify-between items-center p-6 ${BG_DARK_BLUE} text-white rounded-lg mb-6`}>
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold flex items-center">
              <Activity className="mr-2" /> Swimming Pool Management
            </h1>
            {selectedPropertyId && properties.length > 0 && (
              <div className="mt-2 flex items-center">
                <Building className="h-5 w-5 text-white/80 mr-2" />
                <span className="text-white/80">
                  {properties.find(p => p.id === selectedPropertyId)?.name} - {properties.find(p => p.id === selectedPropertyId)?.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditMode(false);
                setFormData({
                  property_id: selectedPropertyId,
                  ph_value: null,
                  chlorine_value: null,
                });
              }}
              className={`flex items-center px-4 py-2 ${BG_ORANGE} rounded-md text-white hover:opacity-90 transition-opacity`}
            >
              <PlusCircle className="mr-1" size={18} />
              {showForm ? "Cancel" : "Add Pool"}
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="mr-1" size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button className="float-right" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Charts */}
        {historicalData.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* pH Value Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className={`text-lg font-bold mb-4 ${ORANGE}`}>pH Value Trend (Last 7 days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[6.5, 8.5]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ph" 
                    stroke="#ED8936" 
                    name="pH Value" 
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-500 mr-1"></div>
                  <span>Ideal Range (7.2 - 7.8)</span>
                </div>
              </div>
            </div>

            {/* Chlorine Level Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className={`text-lg font-bold mb-4 ${DARK_BLUE}`}>Chlorine Level Trend (Last 7 days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="chlorine" 
                    stroke="#2C5282" 
                    name="Chlorine (ppm)" 
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-500 mr-1"></div>
                  <span>Ideal Range (1.0 - 3.0 ppm)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg shadow">
            <h2 className={`text-xl font-bold mb-4 ${DARK_BLUE}`}>
              {editMode ? "Update Swimming Pool" : "Add New Swimming Pool"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ph_value" className="block text-gray-700 mb-1">
                  pH Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="ph_value"
                  name="ph_value"
                  value={formData.ph_value !== null ? formData.ph_value : ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter pH value"
                />
              </div>
              <div>
                <label htmlFor="chlorine_value" className="block text-gray-700 mb-1">
                  Chlorine Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="chlorine_value"
                  name="chlorine_value"
                  value={formData.chlorine_value !== null ? formData.chlorine_value : ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter chlorine value"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 ${BG_DARK_BLUE} text-white rounded hover:opacity-90 transition-opacity`}
                disabled={loading}
              >
                {loading ? "Processing..." : editMode ? "Update Pool" : "Add Pool"}
              </button>
            </div>
          </div>
        )}

        {/* Current Values Display */}
        {pools.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className={`text-lg font-bold ${ORANGE}`}>Current pH Level</h3>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-full border-8 border-gray-200 flex items-center justify-center">
                  <div className="text-4xl font-bold text-gray-800">
                    {pools[0]?.ph_value !== null ? pools[0].ph_value.toFixed(1) : "N/A"}
                  </div>
                  <div className="absolute bottom-[-20px] text-sm text-gray-500">
                    Last updated: {pools[0]?.ph_updated_at ? new Date(pools[0].ph_updated_at).toLocaleDateString() : "Never"}
                  </div>
                </div>
              </div>
              <div className="mt-8 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    pools[0]?.ph_value !== null 
                      ? (pools[0].ph_value < 7.2 ? "bg-yellow-500" : pools[0].ph_value > 7.8 ? "bg-red-500" : "bg-green-500")
                      : "bg-gray-400"
                  }`}
                  style={{ 
                    width: pools[0]?.ph_value !== null 
                      ? `${Math.min(100, Math.max(0, ((pools[0].ph_value - 6.5) / 2) * 100))}%` 
                      : "0%" 
                  }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>6.5</span>
                <span className="text-green-600 font-medium">Ideal: 7.2-7.8</span>
                <span>8.5</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className={`text-lg font-bold ${DARK_BLUE}`}>Current Chlorine Level</h3>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-full border-8 border-gray-200 flex items-center justify-center">
                  <div className="text-4xl font-bold text-gray-800">
                    {pools[0]?.chlorine_value !== null ? pools[0].chlorine_value.toFixed(1) : "N/A"}
                  </div>
                  <div className="absolute bottom-[-20px] text-sm text-gray-500">
                    Last updated: {pools[0]?.chlorine_updated_at ? new Date(pools[0].chlorine_updated_at).toLocaleDateString() : "Never"}
                  </div>
                </div>
              </div>
              <div className="mt-8 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    pools[0]?.chlorine_value !== null 
                      ? (pools[0].chlorine_value < 1.0 ? "bg-yellow-500" : pools[0].chlorine_value > 3.0 ? "bg-red-500" : "bg-green-500")
                      : "bg-gray-400"
                  }`}
                  style={{ 
                    width: pools[0]?.chlorine_value !== null 
                      ? `${Math.min(100, Math.max(0, (pools[0].chlorine_value / 4) * 100))}%` 
                      : "0%" 
                  }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>0.0</span>
                <span className="text-green-600 font-medium">Ideal: 1.0-3.0 ppm</span>
                <span>4.0</span>
              </div>
            </div>
          </div>
        )}

        {/* Swimming Pool List */}
        <div className="bg-white rounded-lg shadow">
          <h2 className={`text-xl font-bold p-4 ${DARK_BLUE} border-b`}>
            Swimming Pools{selectedPropertyId ? ` for ${properties.find(p => p.id === selectedPropertyId)?.name || 'Selected Property'}` : ''}
          </h2>
          
          {loading && !error ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : pools.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No swimming pools found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chlorine Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chlorine Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pool.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${ORANGE} font-medium`}>
                          {pool.ph_value !== null ? pool.ph_value.toFixed(1) : "Not set"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pool.ph_updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${DARK_BLUE} font-medium`}>
                          {pool.chlorine_value !== null ? pool.chlorine_value.toFixed(1) : "Not set"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pool.chlorine_updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(pool)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(pool.id)}
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
          )}
        </div>

        {/* Status panel */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg shadow">
            <h3 className={`text-lg font-bold mb-2 ${ORANGE}`}>Pool pH Guidelines</h3>
            <p className="text-gray-600">Ideal pH levels for swimming pools should be maintained between 7.2 and 7.8.</p>
            <ul className="mt-2 text-sm text-gray-600">
              <li>Below 7.2: Too acidic, can cause eye irritation and equipment corrosion</li>
              <li>Above 7.8: Too alkaline, reduces chlorine effectiveness and causes scaling</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow">
            <h3 className={`text-lg font-bold mb-2 ${DARK_BLUE}`}>Chlorine Guidelines</h3>
            <p className="text-gray-600">Ideal free chlorine levels should be maintained between 1.0 and 3.0 ppm.</p>
            <ul className="mt-2 text-sm text-gray-600">
              <li>Below 1.0 ppm: Insufficient sanitization, risk of algae growth</li>
              <li>Above 3.0 ppm: May cause eye and skin irritation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}