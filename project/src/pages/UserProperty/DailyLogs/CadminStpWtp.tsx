import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit, Trash2, Save, X, Eye, Building } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useProfile } from '../../../context/ProfileContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description: string;
  logo_base64: string;
}

interface WTP {
  id?: string;
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
  created_time?: string;
  updated_time?: string;
}

interface STP {
  id?: string;
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
  created_time?: string;
  updated_time?: string;
}

const COLORS = {
  orange: '#f97316',
  darkBlue: '#1e40af',
  lightOrange: '#fed7aa',
  lightBlue: '#dbeafe',
  white: '#ffffff',
  gray: '#6b7280'
};

export default function CadminStpWtp() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'WTP' | 'STP'>('WTP');
  const [wtpList, setWtpList] = useState<WTP[]>([]);
  const [stpList, setStpList] = useState<STP[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingItem, setEditingItem] = useState<WTP | STP | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data
  const initWtpForm: WTP = {
    property_id: '',
    phase_name: ''
  };

  const initStpForm: STP = {
    property_id: '',
    phase_name: ''
  };

  const [wtpForm, setWtpForm] = useState<WTP>(initWtpForm);
  const [stpForm, setStpForm] = useState<STP>(initStpForm);

  useEffect(() => {
    console.log('Initial load - Profile:', profile);
    if (profile?.property_id) {
      fetchProperties();
    } else {
      console.log('No property ID in profile');
      setError("User profile not loaded properly");
    }
  }, [profile]);

  useEffect(() => {
    if (selectedProperty) {
      fetchWtpList();
      fetchStpList();
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      console.log('Fetching properties...');
      console.log('User profile:', profile);
      console.log('User token:', user?.token);

      const response = await fetch('https://server.prktechindia.in/properties', {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      
      const data = await response.json();
      console.log('Properties response:', data);
      
      const userProperty = data.find((p: Property) => p.id === profile?.property_id);
      console.log('Found user property:', userProperty);
      
      if (userProperty) {
        setProperties([userProperty]);
        setSelectedProperty(userProperty);
      } else {
        setError("No property found for this user");
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to fetch properties. Please try again.');
    }
  };

  const fetchWtpList = async () => {
    if (!selectedProperty) return;
    try {
      const response = await fetch(`https://server.prktechindia.in/wtp?property_id=${selectedProperty.id}`);
      const data = await response.json();
      setWtpList(data);
    } catch (error) {
      console.error('Error fetching WTP list:', error);
    }
  };

  const fetchStpList = async () => {
    if (!selectedProperty) return;
    try {
      const response = await fetch(`https://server.prktechindia.in/stp?property_id=${selectedProperty.id}`);
      const data = await response.json();
      setStpList(data);
    } catch (error) {
      console.error('Error fetching STP list:', error);
    }
  };

  const openCreateModal = (type: 'WTP' | 'STP') => {
    setActiveTab(type);
    setModalMode('create');
    if (type === 'WTP') {
      setWtpForm({ ...initWtpForm, property_id: selectedProperty?.id || '' });
      setEditingItem(null);
    } else {
      setStpForm({ ...initStpForm, property_id: selectedProperty?.id || '' });
      setEditingItem(null);
    }
    setShowModal(true);
  };

  const openEditModal = (item: WTP | STP, type: 'WTP' | 'STP') => {
    setActiveTab(type);
    setModalMode('edit');
    setEditingItem(item);
    if (type === 'WTP') {
      setWtpForm(item as WTP);
    } else {
      setStpForm(item as STP);
    }
    setShowModal(true);
  };

  const openViewModal = (item: WTP | STP, type: 'WTP' | 'STP') => {
    setActiveTab(type);
    setModalMode('view');
    setEditingItem(item);
    if (type === 'WTP') {
      setWtpForm(item as WTP);
    } else {
      setStpForm(item as STP);
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (activeTab === 'WTP') {
        const method = modalMode === 'edit' && editingItem ? 'PUT' : 'POST';
        const url = modalMode === 'edit' && editingItem 
          ? `https://server.prktechindia.in/wtp/${editingItem.id}`
          : 'https://server.prktechindia.in/wtp/';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wtpForm)
        });
        
        if (response.ok) {
          fetchWtpList();
          setShowModal(false);
        }
      } else {
        const method = modalMode === 'edit' && editingItem ? 'PUT' : 'POST';
        const url = modalMode === 'edit' && editingItem 
          ? `https://server.prktechindia.in/stp/${editingItem.id}`
          : 'https://server.prktechindia.in/stp/';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stpForm)
        });
        
        if (response.ok) {
          fetchStpList();
          setShowModal(false);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (id: string, type: 'WTP' | 'STP') => {
    try {
      const url = type === 'WTP' 
        ? `https://server.prktechindia.in/wtp/${id}`
        : `https://server.prktechindia.in/stp/${id}`;
      
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        if (type === 'WTP') {
          fetchWtpList();
        } else {
          fetchStpList();
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.darkBlue }}>
              WTP & STP Management
            </h1>
            {selectedProperty && (
              <div className="mt-2 flex items-center">
                <Building className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {selectedProperty.name} - {selectedProperty.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedProperty && (
          <>
            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              {['WTP', 'STP'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'WTP' | 'STP')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === tab ? COLORS.orange : COLORS.white,
                    border: `2px solid ${activeTab === tab ? COLORS.orange : COLORS.gray}`
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => openCreateModal(activeTab)}
              className="mb-6 px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity flex items-center space-x-2"
              style={{ backgroundColor: COLORS.orange }}
            >
              <Plus size={20} />
              <span>Add New {activeTab}</span>
            </button>

            {/* Content */}
            {activeTab === 'WTP' ? (
              <div className="space-y-4">
                {wtpList.map((wtp) => (
                  <div
                    key={wtp.id}
                    className="border rounded-lg p-4"
                    style={{ borderColor: COLORS.lightOrange, backgroundColor: COLORS.white }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: COLORS.darkBlue }}>
                          {wtp.phase_name}
                        </h3>
                        <p className="text-sm" style={{ color: COLORS.gray }}>
                          Created: {wtp.created_time && formatDate(wtp.created_time)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(wtp, 'WTP')}
                          className="p-2 rounded hover:opacity-75"
                          style={{ color: COLORS.darkBlue }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(wtp, 'WTP')}
                          className="p-2 rounded hover:opacity-75"
                          style={{ color: COLORS.orange }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(wtp.id!, 'WTP')}
                          className="p-2 rounded hover:opacity-75 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stpList.map((stp) => (
                  <div
                    key={stp.id}
                    className="border rounded-lg p-4"
                    style={{ borderColor: COLORS.lightBlue, backgroundColor: COLORS.white }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: COLORS.darkBlue }}>
                          {stp.phase_name}
                        </h3>
                        <p className="text-sm" style={{ color: COLORS.gray }}>
                          Created: {stp.created_time && formatDate(stp.created_time)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(stp, 'STP')}
                          className="p-2 rounded hover:opacity-75"
                          style={{ color: COLORS.darkBlue }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(stp, 'STP')}
                          className="p-2 rounded hover:opacity-75"
                          style={{ color: COLORS.orange }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(stp.id!, 'STP')}
                          className="p-2 rounded hover:opacity-75 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-90vh overflow-y-auto">
              <div className="p-6 border-b" style={{ borderColor: COLORS.lightOrange }}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold" style={{ color: COLORS.darkBlue }}>
                    {modalMode === 'create' ? `Create ${activeTab}` :
                     modalMode === 'edit' ? `Edit ${activeTab}` :
                     `View ${activeTab}`}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:opacity-75"
                  >
                    <X size={24} style={{ color: COLORS.gray }} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'WTP' ? (
                  <WTPForm
                    wtp={wtpForm}
                    onChange={setWtpForm}
                    disabled={modalMode === 'view'}
                  />
                ) : (
                  <STPForm
                    stp={stpForm}
                    onChange={setStpForm}
                    disabled={modalMode === 'view'}
                  />
                )}
              </div>

              {modalMode !== 'view' && (
                <div className="p-6 border-t" style={{ borderColor: COLORS.lightOrange }}>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 rounded font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: COLORS.orange }}
                    >
                      <Save size={16} className="inline mr-2" />
                      {modalMode === 'create' ? 'Create' : 'Update'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 rounded border hover:opacity-75"
                      style={{ borderColor: COLORS.gray, color: COLORS.gray }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WTPForm({ wtp, onChange, disabled = false }: { 
  wtp: WTP; 
  onChange: (wtp: WTP) => void; 
  disabled?: boolean;
}) {
  const handleChange = (field: keyof WTP, value: string | number) => {
    onChange({ ...wtp, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Phase Name *
        </label>
        <input
          type="text"
          value={wtp.phase_name}
          onChange={(e) => handleChange('phase_name', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500 border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Raw Sump Level (%)
        </label>
        <input
          type="number"
          value={wtp.raw_sump_level || ''}
          onChange={(e) => handleChange('raw_sump_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Treated Water Sump Level (%)
        </label>
        <input
          type="number"
          value={wtp.treated_water_sump_level || ''}
          onChange={(e) => handleChange('treated_water_sump_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Raw Water Hardness (ppm)
        </label>
        <input
          type="number"
          value={wtp.raw_water_hardness || ''}
          onChange={(e) => handleChange('raw_water_hardness', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Treated Water Hardness - Morning (ppm)
        </label>
        <input
          type="number"
          value={wtp.treated_water_hardness_morning || ''}
          onChange={(e) => handleChange('treated_water_hardness_morning', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Treated Water Hardness - Evening (ppm)
        </label>
        <input
          type="number"
          value={wtp.treated_water_hardness_evening || ''}
          onChange={(e) => handleChange('treated_water_hardness_evening', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Treated Water Meter (KL)
        </label>
        <input
          type="number"
          value={wtp.treated_water_meter || ''}
          onChange={(e) => handleChange('treated_water_meter', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Energy Consumption (kWh)
        </label>
        <input
          type="number"
          value={wtp.energy_consumption || ''}
          onChange={(e) => handleChange('energy_consumption', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Salt Today's Usage (bags)
        </label>
        <input
          type="number"
          value={wtp.salt_todays_usage || ''}
          onChange={(e) => handleChange('salt_todays_usage', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Salt Stock (bags)
        </label>
        <input
          type="number"
          value={wtp.salt_stock || ''}
          onChange={(e) => handleChange('salt_stock', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          pH Level
        </label>
        <input
          type="number"
          step="0.1"
          value={wtp.ph_level || ''}
          onChange={(e) => handleChange('ph_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Chlorine Level (ppm)
        </label>
        <input
          type="number"
          step="0.1"
          value={wtp.chlorine_level || ''}
          onChange={(e) => handleChange('chlorine_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Turbidity (NTU)
        </label>
        <input
          type="number"
          step="0.1"
          value={wtp.turbidity || ''}
          onChange={(e) => handleChange('turbidity', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}

function STPForm({ stp, onChange, disabled = false }: { 
  stp: STP; 
  onChange: (stp: STP) => void; 
  disabled?: boolean;
}) {
  const handleChange = (field: keyof STP, value: string | number) => {
    onChange({ ...stp, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Phase Name *
        </label>
        <input
          type="text"
          value={stp.phase_name}
          onChange={(e) => handleChange('phase_name', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Tank-1 MLSS (mg/l)
        </label>
        <input
          type="number"
          value={stp.tank1_mlss || ''}
          onChange={(e) => handleChange('tank1_mlss', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Tank-2 MLSS (mg/l)
        </label>
        <input
          type="number"
          value={stp.tank2_mlss || ''}
          onChange={(e) => handleChange('tank2_mlss', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          pH Level
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.ph_level || ''}
          onChange={(e) => handleChange('ph_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Chlorine Level (ppm)
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.chlorine_level || ''}
          onChange={(e) => handleChange('chlorine_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Smell
        </label>
        <select
          value={stp.smell || ''}
          onChange={(e) => handleChange('smell', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        >
          <option value="">Select...</option>
          <option value="No Smell">No Smell</option>
          <option value="Slight Smell">Slight Smell</option>
          <option value="Strong Smell">Strong Smell</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Energy Consumption (kWh)
        </label>
        <input
          type="number"
          value={stp.energy_consumption || ''}
          onChange={(e) => handleChange('energy_consumption', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Raw Sewage Flow (KL)
        </label>
        <input
                  type="number"
          value={stp.raw_sewage_flow || ''}
          onChange={(e) => handleChange('raw_sewage_flow', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Treated Water Flow (KL)
        </label>
        <input
          type="number"
          value={stp.treated_water_flow || ''}
          onChange={(e) => handleChange('treated_water_flow', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Raw Sewage Tank Level (%)
        </label>
        <input
          type="number"
          value={stp.raw_sewage_tank_level || ''}
          onChange={(e) => handleChange('raw_sewage_tank_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Filter Feed Tank Level (%)
        </label>
        <input
          type="number"
          value={stp.filter_feed_tank_level || ''}
          onChange={(e) => handleChange('filter_feed_tank_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Flush Water Tank Level (%)
        </label>
        <input
          type="number"
          value={stp.flush_water_tank_level || ''}
          onChange={(e) => handleChange('flush_water_tank_level', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          Air Smell
        </label>
        <select
          value={stp.air_smell || ''}
          onChange={(e) => handleChange('air_smell', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        >
          <option value="">Select...</option>
          <option value="No Smell">No Smell</option>
          <option value="Slight Smell">Slight Smell</option>
          <option value="Strong Smell">Strong Smell</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          BOD Inlet (mg/l)
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.bod_inlet || ''}
          onChange={(e) => handleChange('bod_inlet', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          BOD Outlet (mg/l)
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.bod_outlet || ''}
          onChange={(e) => handleChange('bod_outlet', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          COD Inlet (mg/l)
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.cod_inlet || ''}
          onChange={(e) => handleChange('cod_inlet', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: COLORS.darkBlue }}>
          COD Outlet (mg/l)
        </label>
        <input
          type="number"
          step="0.1"
          value={stp.cod_outlet || ''}
          onChange={(e) => handleChange('cod_outlet', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}