import { useState, useEffect } from 'react';
import { AlertCircle, Check, Edit, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Droplets, Calendar, Building } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Type definitions based on the API
interface WaterSource {
  id: string;
  name: string;
  source_type: string;
  location: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  update_history: string;
  property_id: string;
}

interface WaterReading {
  id: string;
  water_source_id: string;
  reading_type: string;
  value: number;
  unit: string;
  reading_date: string;
  created_at: string;
  updated_at: string;
  update_history: string;
  property_id: string;
}

// Form states for create/update operations
interface WaterSourceForm {
  name: string;
  source_type: string;
  location: string;
  description: string;
  is_active: boolean;
  property_id: string;
}

interface WaterReadingForm {
  water_source_id: string;
  reading_type: string;
  value: number;
  unit: string;
  reading_date: string;
  property_id: string;
}

interface Property {
  id: string;
  name: string;
  title: string;
  description: string;
  logo_base64: string;
}
  

// API base URL
const API_BASE_URL = 'https://server.prktechindia.in';

export default function FreshWater() {
  // Get user and property_id from AuthContext

  
  // State for water sources and readings
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [waterReadings, setWaterReadings] = useState<WaterReading[]>([]);
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Form states
  const [sourceForm, setSourceForm] = useState<WaterSourceForm>({
    name: '',
    source_type: 'BWSSB',
    location: '',
    description: '',
    is_active: true,
    property_id: '',
  });
  
  const [readingForm, setReadingForm] = useState<WaterReadingForm>({
    water_source_id: '',
    reading_type: 'intake',
    value: 0,
    unit: 'KL',
    reading_date: new Date().toISOString().split('T')[0],
    property_id: '',
  });
  
  // UI states
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  
  // Date filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Source types for dropdown
  const sourceTypes = ['BWSSB', 'Tanker', 'Borewell'];
  const readingTypes = ['intake', 'yield', 'supply'];
  const { user } = useAuth();
  const [propertyId, setPropertyId] = useState<string>('');

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties. Please try again.');
    }
  };

  
  // Fetch user's property ID from profile
  useEffect(() => {
    // Fetch properties on component mount
    fetchProperties();
    
    // Also fetch user's default property if needed
    const fetchPropertyId = async () => {
      if (!user?.token || !user?.userId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        const matchedUser = data.find((u: any) => u.user_id === user.userId);
        
        if (matchedUser && matchedUser.property_id) {
          setPropertyId(matchedUser.property_id);
          setSelectedPropertyId(matchedUser.property_id);
          
          // Update forms with the property_id
          setSourceForm(prev => ({ ...prev, property_id: matchedUser.property_id }));
          setReadingForm(prev => ({ ...prev, property_id: matchedUser.property_id }));
        }
      } catch (err) {
        console.error('Error fetching property ID:', err);
        setError('Failed to fetch property information. Please try again.');
      }
    };
    
    fetchPropertyId();
  }, [user]);
  
  
  // Fetch water sources when needed
  useEffect(() => {
    if (propertyId) {
      fetchWaterSources();
    }
  }, [propertyId, sourceTypeFilter, activeFilter]);

  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
      setSourceForm(prev => ({ ...prev, property_id: selectedPropertyId }));
      setReadingForm(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);
  
  // Reset reading form when selected source changes
  useEffect(() => {
    if (selectedSource) {
      setReadingForm({
        water_source_id: selectedSource.id,
        reading_type: 'intake',
        value: 0,
        unit: 'KL',
        reading_date: new Date().toISOString().split('T')[0],
        property_id: propertyId,
      });
    }
  }, [selectedSource, propertyId]);
  
  // Fetch water sources from API
  const fetchWaterSources = async () => {
    if (!propertyId) return;
    
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/water-sources/?property_id=${propertyId}`;
      
      if (sourceTypeFilter) {
        url += `&source_type=${sourceTypeFilter}`;
      }
      
      if (activeFilter !== null) {
        url += `&is_active=${activeFilter}`;
      }
      
      const response = await fetch(url, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to fetch water sources');
      
      const data = await response.json();
      // Frontend filter safeguard: keep only the currently selected property's sources
      const filtered = Array.isArray(data)
        ? data.filter((w: WaterSource) => w.property_id === propertyId)
        : [];
      setWaterSources(filtered);
      setError('');
    } catch (err) {
      setError('Error fetching water sources. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch readings for a specific water source
  const fetchReadingsForSource = async (sourceId: string) => {
    if (!propertyId) return;
    
    try {
      let url = `${API_BASE_URL}/water-sources/${sourceId}/readings?property_id=${propertyId}`;
      
      // Add date filters if selected
      if (selectedDates.length > 0) {
        const formattedDates = selectedDates
          .map(date => date.toISOString().split('T')[0])
          .join(',');
        url += `&dates=${formattedDates}`;
      } else if (startDate && endDate) {
        url += `&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
      }
      
      const response = await fetch(url, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to fetch readings');
      
      const data = await response.json();
      // Frontend filter safeguard for readings as well
      const filtered = Array.isArray(data)
        ? data.filter((r: WaterReading) => r.property_id === propertyId)
        : [];
      setWaterReadings(filtered);
    } catch (err) {
      setError('Error fetching water readings. Please try again.');
      console.error(err);
    }
  };
  
  // Create new water source
  const createWaterSource = async () => {
    if (!propertyId) {
      setError('Property ID is required. Please try again.');
      return;
    }
    
    // Ensure property_id is set
    const formData = { ...sourceForm, property_id: propertyId };
    
    try {
      const response = await fetch(`${API_BASE_URL}/water-sources/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create water source');
      
      await fetchWaterSources();
      setIsAddingSource(false);
      setSourceForm({
        name: '',
        source_type: 'BWSSB',
        location: '',
        description: '',
        is_active: true,
        property_id: propertyId,
      });
      setSuccess('Water source created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating water source. Please try again.');
      console.error(err);
    }
  };
  
  // Update water source
  const updateWaterSource = async () => {
    if (!selectedSource || !propertyId) return;
    
    // Ensure property_id is set
    const formData = { ...sourceForm, property_id: propertyId };
    
    try {
      const response = await fetch(`${API_BASE_URL}/water-sources/${selectedSource.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to update water source');
      
      await fetchWaterSources();
      setIsEditingSource(false);
      setSuccess('Water source updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error updating water source. Please try again.');
      console.error(err);
    }
  };
  
  // Delete water source
  const deleteWaterSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this water source? This will also delete all associated readings.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/water-sources/${id}`, {
        method: 'DELETE',
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to delete water source');
      
      await fetchWaterSources();
      setExpandedSourceId(null);
      setSelectedSource(null);
      setSuccess('Water source deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error deleting water source. Please try again.');
      console.error(err);
    }
  };
  
  // Create new water reading
  const createWaterReading = async () => {
    if (!propertyId) {
      setError('Property ID is required. Please try again.');
      return;
    }
    
    // Ensure property_id is set
    const formData = {
      ...readingForm,
      property_id: propertyId,
      reading_date: new Date(readingForm.reading_date).toISOString().split('T')[0]
    };
    
    console.log('Submitting water reading form data:', formData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/water-readings/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create water reading');
      
      if (selectedSource) {
        await fetchReadingsForSource(selectedSource.id);
      }
      
      setIsAddingReading(false);
      setReadingForm({
        water_source_id: selectedSource?.id || '',
        reading_type: 'intake',
        value: 0,
        unit: 'KL',
        reading_date: new Date().toISOString().split('T')[0],
        property_id: propertyId,
      });
      
      setSuccess('Water reading created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error creating water reading. Please try again.');
      console.error('Error creating water reading:', err);
      // Log additional details if available
      if (err instanceof Error) {
        console.error('Error message:', err.message);
      }
    }
  };
  
  // Delete water reading
  const deleteWaterReading = async (id: string) => {
    if (!confirm('Are you sure you want to delete this water reading?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/water-readings/${id}`, {
        method: 'DELETE',
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to delete water reading');
      
      if (selectedSource) {
        await fetchReadingsForSource(selectedSource.id);
      }
      
      setSuccess('Water reading deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error deleting water reading. Please try again.');
      console.error(err);
    }
  };
  
  // Handle source card click (expand/collapse)
  const handleSourceClick = (source: WaterSource) => {
    // Close previously expanded card if it exists
    if (expandedSourceId === source.id) {
      setExpandedSourceId(null);
      setSelectedSource(null);
    } else {
      // If another card was expanded, close it and open the new one
      setExpandedSourceId(source.id);
      setSelectedSource(source);
      fetchReadingsForSource(source.id);
    }
  };
  
  // Start editing a source
  const handleEditSource = (source: WaterSource) => {
    setSelectedSource(source);
    setSourceForm({
      name: source.name,
      source_type: source.source_type,
      location: source.location || '',
      description: source.description || '',
      is_active: source.is_active,
      property_id: propertyId,
    });
    setIsEditingSource(true);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateExists = selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Remove date if already selected
      setSelectedDates(selectedDates.filter(
        selectedDate => selectedDate.toDateString() !== date.toDateString()
      ));
    } else {
      // Add date to selection
      setSelectedDates([...selectedDates, date]);
    }
  };
  
  // Apply date filter
  const applyDateFilter = () => {
    if (selectedSource) {
      fetchReadingsForSource(selectedSource.id);
    }
    setIsDateFilterOpen(false);
  };
  
  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedDates([]);
    if (selectedSource) {
      fetchReadingsForSource(selectedSource.id);
    }
    setIsDateFilterOpen(false);
  };

  // Check if a date is in the selectedDates array
  const isDateSelected = (date: Date) => {
    return selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white text-black p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Droplets className="h-8 w-8 text-[#F88024] mr-2" />
            <h1 className="text-2xl font-bold">Fresh Water</h1>
          </div>
          <button 
            onClick={() => fetchWaterSources()}
            className="flex items-center bg-[#DF5F0D] text-white px-3 py-2 rounded-md hover:bg-[#DD6A1A] transition"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Notification area */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <button 
              className="absolute top-0 right-0 p-2" 
              onClick={() => setError('')}
            >
              &times;
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <span>{success}</span>
            <button 
              className="absolute top-0 right-0 p-2" 
              onClick={() => setSuccess('')}
            >
              &times;
            </button>
          </div>
        )}

        {/* Filters and Add Source button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label htmlFor="sourceTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
              <select
                id="sourceTypeFilter"
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(e.target.value)}
                className="w-full sm:w-40 border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
              >
                <option value="">All Types</option>
                {sourceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="activeFilter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="activeFilter"
                value={activeFilter === null ? '' : activeFilter.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveFilter(val === '' ? null : val === 'true');
                }}
                className="w-full sm:w-40 border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            {/* Date Filter Button */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
              <button
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                className="w-full sm:w-40 border border-gray-300 rounded-md p-2 flex items-center justify-between focus:outline-none focus:ring-[#F88024] focus:border-[#F88024]"
              >
                <span>
                  {selectedDates.length > 0 
                    ? `${selectedDates.length} dates selected` 
                    : startDate && endDate 
                      ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                      : "Select Dates"}
                </span>
                <Calendar className="h-4 w-4" />
              </button>
              
              {/* Date Picker Dropdown */}
              {isDateFilterOpen && (
                <div className="absolute z-10 mt-1 w-72 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-3">
                    <div className="mb-2">
                      <h4 className="text-sm font-medium mb-1">Date Range</h4>
                      <div className="flex gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Start</label>
                          <input
                            type="date"
                            value={startDate ? startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full text-sm border border-gray-300 rounded-md p-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">End</label>
                          <input
                            type="date"
                            value={endDate ? endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full text-sm border border-gray-300 rounded-md p-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Or Select Multiple Dates</h4>
                      <div className="border border-gray-200 rounded-md p-2">
                        <DatePicker
                          inline
                          selectsMultiple
                          selected={null}
                          highlightDates={selectedDates}
                          onSelect={(date: Date | null) => {
                            if (date) handleDateSelect(date);
                          }}
                          dayClassName={(date) => 
                            isDateSelected(date) ? "bg-[#F88024] text-white rounded-full" : ""
                          }
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedDates.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDates.map((date, index) => (
                              <span key={index} className="bg-gray-100 rounded-md px-2 py-1">
                                {date.toLocaleDateString()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button
                        onClick={clearDateFilters}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={applyDateFilter}
                        className="bg-[#DF5F0D] text-white px-3 py-1 rounded-md text-sm"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => {
              setSourceForm({
                name: '',
                source_type: 'BWSSB',
                location: '',
                description: '',
                is_active: true,
                property_id: propertyId,
              });
              setIsAddingSource(true);
              setIsEditingSource(false);
            }}
            className="bg-[#DF5F0D] text-white px-4 py-2 rounded-md hover:bg-[#DD6A1A] transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Water Source
          </button>
        </div>

        {/* Property Selection */}
        <div className="mb-4">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
        <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <select
            id="propertySelect"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="flex-1 max-w-md border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
            >
            <option value="">Select a property...</option>
            {properties.map(property => (
                <option key={property.id} value={property.id}>
                {property.name} - {property.title}
                </option>
            ))}
            </select>
        </div>
        </div>

        {/* Water Source Form (Add/Edit) */}
        {(isAddingSource || isEditingSource) && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">
              {isEditingSource ? 'Edit Water Source' : 'Add New Water Source'}
            </h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                isEditingSource ? updateWaterSource() : createWaterSource();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="source_type" className="block text-sm font-medium text-gray-700 mb-1">Source Type *</label>
                <select
                  id="source_type"
                  value={sourceForm.source_type}
                  onChange={(e) => setSourceForm({ ...sourceForm, source_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
                  required
                >
                  {sourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  id="location"
                  value={sourceForm.location}
                  onChange={(e) => setSourceForm({ ...sourceForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
                />
              </div>
              
              <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="is_active"
                  value={sourceForm.is_active.toString()}
                  onChange={(e) => setSourceForm({ ...sourceForm, is_active: e.target.value === 'true' })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  value={sourceForm.description}
                  onChange={(e) => setSourceForm({ ...sourceForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-[#F88024] focus:border-[#F88024]"
                />
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSource(false);
                    setIsEditingSource(false);
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#DF5F0D] text-white px-4 py-2 rounded-md hover:bg-[#DD6A1A] transition"
                >
                  {isEditingSource ? 'Update Source' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Water Sources List */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Water Sources</h2>
          
          {!propertyId ? (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Loading property information...</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center p-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F88024]"></div>
            </div>
          ) : waterSources.length === 0 ? (
            <div className="text-center p-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No water sources found. Add a new water source to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waterSources.map(source => (
                <div 
                  key={source.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  <div 
                    className="cursor-pointer bg-gray-50 p-4 flex justify-between items-center"
                    onClick={() => handleSourceClick(source)}
                    >
                        <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${source.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <h3 className="font-medium">{source.name}</h3>
                        </div>
                        <div className="flex items-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-2">
                            {source.source_type}
                        </span>
                        {expandedSourceId === source.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                        </div>
                    </div>
                  {expandedSourceId === source.id && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm">{source.location || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className="text-sm">{source.is_active ? 'Active' : 'Inactive'}</p>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="text-sm">{source.description || 'No description provided.'}</p>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <p>Created: {new Date(source.created_at).toLocaleDateString()}</p>
                          <p>Last Updated: {new Date(source.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSource(source);
                          }}
                          className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition"
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWaterSource(source.id);
                          }}
                          className="flex items-center text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </button>
                      </div>
                      
                      {/* Water Readings Section */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Water Readings</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddingReading(true);
                              setReadingForm({
                                ...readingForm,
                                water_source_id: source.id,
                                property_id: propertyId,
                              });
                            }}
                            className="flex items-center text-xs bg-[#F88024] hover:bg-[#DD6A1A] text-white px-2 py-1 rounded transition"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Reading
                          </button>
                        </div>
                        
                        {/* Water Reading Form */}
                        {isAddingReading && selectedSource?.id === source.id && (
                          <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                            <h5 className="text-sm font-medium mb-2">Add New Reading</h5>
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                createWaterReading();
                              }}
                              className="grid grid-cols-2 gap-2"
                            >
                              <div>
                                <label htmlFor="reading_type" className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                  id="reading_type"
                                  value={readingForm.reading_type}
                                  onChange={(e) => setReadingForm({ ...readingForm, reading_type: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-md p-1 focus:ring-[#F88024] focus:border-[#F88024]"
                                  required
                                >
                                  {readingTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div>
                                <label htmlFor="reading_date" className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                  type="date"
                                  id="reading_date"
                                  value={readingForm.reading_date}
                                  onChange={(e) => setReadingForm({ ...readingForm, reading_date: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-md p-1 focus:ring-[#F88024] focus:border-[#F88024]"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="value" className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
                                <input
                                  type="number"
                                  id="value"
                                  value={readingForm.value}
                                  onChange={(e) => setReadingForm({ ...readingForm, value: parseFloat(e.target.value) })}
                                  step="0.01"
                                  min="0"
                                  className="w-full text-sm border border-gray-300 rounded-md p-1 focus:ring-[#F88024] focus:border-[#F88024]"
                                  required
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="unit" className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                                <select
                                  id="unit"
                                  value={readingForm.unit}
                                  onChange={(e) => setReadingForm({ ...readingForm, unit: e.target.value })}
                                  className="w-full text-sm border border-gray-300 rounded-md p-1 focus:ring-[#F88024] focus:border-[#F88024]"
                                  required
                                >
                                  <option value="KL">KL</option>
                                  <option value="L">L</option>
                                  <option value="m³">m³</option>
                                </select>
                              </div>
                              
                              <div className="col-span-2 flex justify-end gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddingReading(false);
                                  }}
                                  className="text-xs bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="text-xs bg-[#DF5F0D] text-white px-3 py-1 rounded hover:bg-[#DD6A1A] transition"
                                >
                                  Add Reading
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                        
                        {/* Readings Table */}
                        {waterReadings.length === 0 ? (
                          <div className="text-center p-4 bg-gray-50 rounded">
                            <p className="text-sm text-gray-500">No readings found for this water source.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-left">Type</th>
                                  <th className="px-3 py-2 text-right">Value</th>
                                  <th className="px-3 py-2 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {waterReadings.map(reading => (
                                  <tr key={reading.id} className="border-t border-gray-200">
                                    <td className="px-3 py-2">
                                      {new Date(reading.reading_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 capitalize">{reading.reading_type}</td>
                                    <td className="px-3 py-2 text-right">
                                      {reading.value} {reading.unit}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteWaterReading(reading.id);
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
