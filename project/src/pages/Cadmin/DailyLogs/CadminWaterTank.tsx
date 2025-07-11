import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, RefreshCw, BarChart3, Battery, Clock, Cloud, Droplet, Gauge, Building } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { useProfile } from '../../../context/ProfileContext';
import { useAuth } from '../../../context/AuthContext';

// ... existing interfaces ...

export default function CadminWaterTankDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tanks, setTanks] = useState<WaterTank[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTank, setSelectedTank] = useState<WaterTank | null>(null);
  const [formData, setFormData] = useState<CreateTankData | UpdateTankData>({
    property_id: "",
    name: "",
    capacity: 0,
    current_level: 0,
  });
  const [waterLevelData, setWaterLevelData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);

  // Colors
  const primaryColor = "text-blue-900";
  const secondaryColor = "text-orange-500";
  const primaryBgColor = "bg-blue-900";
  const secondaryBgColor = "bg-orange-500";
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Fetch properties
  const fetchProperties = async () => {
    try {
      console.log('Fetching properties...');
      console.log('User profile:', profile);
      console.log('User token:', user?.token);

      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
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

  // ... rest of the existing code ...

  return (
    <div className="bg-white min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`${primaryBgColor} text-white rounded-lg shadow p-4 md:p-6 flex flex-col md:flex-row justify-between items-center mb-6`}>
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <BarChart3 className="mr-2" /> Water Tank Management
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
                setFormData({ 
                  property_id: selectedPropertyId,
                  name: "",
                  capacity: 0,
                  current_level: 0
                });
                setShowAddModal(true);
              }}
              className={`${secondaryBgColor} text-white py-2 px-4 rounded-md flex items-center`}
            >
              <Plus className="mr-1" size={18} /> Add Tank
            </button>
            <button
              onClick={fetchTanks}
              className="bg-white/10 text-white py-2 px-4 rounded-md flex items-center"
            >
              <RefreshCw className="mr-1" size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Remove the Property Selector section since we're using the user's property */}

        {/* Rest of the existing JSX ... */}
      </div>
    </div>
  );
} 