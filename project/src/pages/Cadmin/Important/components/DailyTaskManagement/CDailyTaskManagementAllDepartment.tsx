import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ChecklistItem {
  id?: string;
  sl_no: number;
  check_point: string;
  action_required: string;
  standard: string;
  frequency: string;
  user_required: boolean;
  property_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

const API_URL = 'https://server.prktechindia.in/daily-task-checklists/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const STATUS_API_URL = 'https://server.prktechindia.in/daily-task-checklist-status/';

const orange = '#FB7E03';
const orangeDark = '#E06002';

const initialNewRow = (property_id: string): ChecklistItem => ({
  sl_no: 0,
  check_point: '',
  action_required: '',
  standard: '',
  frequency: '',
  user_required: false,
  property_id,
});

const frequencyOptions = [
  'Daily',
  'Monthly',
  'Hourly',
  'Weekly',
  '2 Times in a week',
];

const userOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

const CDailyTaskManagementAllDepartment: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ChecklistItem | null>(null);
  const [newRow, setNewRow] = useState<ChecklistItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: ChecklistItem | null }>({ open: false, item: null });
  const [viewDate, setViewDate] = useState<Date | null>(new Date());
  const [statusMap, setStatusMap] = useState<Record<string, string>>({}); // period -> status
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // period that has dropdown open

  // Fetch properties and user's default property_id
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (user?.userType === 'admin') {
          // Admin sees all properties
          const res = await axios.get(PROPERTIES_URL);
          setProperties(res.data);
        } else if (user?.userType === 'property_user' && user?.propertyId) {
          // Property user only sees their assigned property
          const res = await axios.get(`${PROPERTIES_URL}/${user.propertyId}`);
          setProperties([res.data]);
        }
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, [user]);

  useEffect(() => {
    // Fetch user's default property_id from profile
    const fetchUserProperty = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser && matchedUser.property_id) {
          setSelectedPropertyId(matchedUser.property_id);
        }
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  // For property users, automatically set their property and fetch only their data
  useEffect(() => {
    if (user?.userType === 'property_user' && user?.propertyId) {
      setSelectedPropertyId(user.propertyId);
      setIsAdmin(false);
    }
  }, [user]);

  // Fetch checklist data for selected property
  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL + `?property_id=${propertyId}`);
      setData(res.data.sort((a: ChecklistItem, b: ChecklistItem) => a.sl_no - b.sl_no));
    } catch (e) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // Reload status data when viewDate changes
  useEffect(() => {
    if (viewModal.open && viewModal.item && viewDate) {
      const loadStatusData = async () => {
        setStatusLoading(true);
        try {
          const res = await axios.get(STATUS_API_URL + viewModal.item!.id);
          // Build a map: period -> status
          const map: Record<string, string> = {};
          for (const s of res.data) {
            map[s.period] = s.status;
          }
          setStatusMap(map);
        } catch (e) {
          setStatusMap({});
        }
        setStatusLoading(false);
      };
      loadStatusData();
    }
  }, [viewDate, viewModal.open, viewModal.item]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Close dropdown when modal closes
  useEffect(() => {
    if (!viewModal.open) {
      setActiveDropdown(null);
    }
  }, [viewModal.open]);

  // CRUD handlers
  const handleEdit = (item: ChecklistItem) => {
    setEditId(item.id!);
    setEditRow({ ...item });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editRow) return;
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setEditRow({
      ...editRow,
      [name]: newValue,
    });
  };

  const handleSave = async () => {
    if (!editRow || !editId) return;
    try {
      await axios.put(API_URL + editId, { ...editRow, property_id: selectedPropertyId });
      setEditId(null);
      setEditRow(null);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this row?')) return;
    try {
      await axios.delete(API_URL + id);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleAddRow = () => {
    setNewRow(initialNewRow(selectedPropertyId));
  };

  const handleNewRowChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!newRow) return;
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setNewRow({
      ...newRow,
      [name]: newValue,
    });
  };

  const handleSaveNewRow = async () => {
    if (!newRow) return;
    try {
      await axios.post(API_URL, { ...newRow, property_id: selectedPropertyId });
      setNewRow(null);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to add row');
    }
  };

  const handleCancelNewRow = () => {
    setNewRow(null);
  };

  const handleOpenViewModal = async (item: ChecklistItem) => {
    setViewModal({ open: true, item });
    setViewDate(new Date()); // Reset to today's date
    setStatusLoading(true);
    try {
      const res = await axios.get(STATUS_API_URL + item.id);
      
      // Build a map: period -> status
      const map: Record<string, string> = {};
      for (const s of res.data) {
        map[s.period] = s.status;
      }
      setStatusMap(map);
    } catch (e) {
      setStatusMap({});
    }
    setStatusLoading(false);
  };

  // Property dropdown label
  const propertyLabel = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    return prop ? `${prop.name} - ${prop.title}` : 'Select Property';
  };

  const getPeriodString = (date: Date, freq: string) => {
    if (freq === 'Daily') return date.toISOString().slice(0, 10); // YYYY-MM-DD
    if (freq === 'Monthly') return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'); // YYYY-MM
    if (freq === 'Weekly' || freq === '2 Times in a week') {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const year = d.getFullYear();
      // Get ISO week number
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
      const week = Math.ceil((days + jan1.getDay() + 1) / 7);
      return `${year}-W${week}`;
    }
    if (freq === 'Hourly') return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    return '';
  };

  const handleSetStatus = async (period: string, status: string) => {
    if (!viewModal.item || !user) return;
    try {
      
      // Update the status map immediately for instant UI feedback
      setStatusMap((prev) => {
        const newMap = { ...prev, [period]: status };
        return newMap;
      });
      
      // Send to backend
      const response = await axios.post(STATUS_API_URL, {
        checklist_id: viewModal.item.id,
        period,
        status,
        updated_by: user.userId || 'unknown',
      });
      
    } catch (e) {
      console.error('Error updating status:', e);
      // Revert the status map if the API call failed
      setStatusMap((prev) => {
        const newMap = { ...prev };
        delete newMap[period];
        return newMap;
      });
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Yes': 
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'No': 
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'Pending': 
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      default: 
        return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    }
  };

  const getNextStatus = (currentStatus: string | undefined) => {
    switch (currentStatus) {
      case 'Yes': return 'No';
      case 'No': return 'Pending';
      case 'Pending': return 'Yes';
      default: return 'Yes';
    }
  };

  const handleStatusClick = (period: string) => {
    // Toggle dropdown for this period
    if (activeDropdown === period) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(period);
    }
  };

  const handleStatusSelect = async (period: string, status: string) => {
    await handleSetStatus(period, status);
    setActiveDropdown(null); // Close dropdown after selection
  };

  // Render different views based on frequency
  const renderFrequencyView = () => {
    if (!viewModal.item || !viewDate) return null;
    
    const freq = viewModal.item.frequency;
    
    if (freq === 'Hourly') {
      // Show 24 hours grid for selected date
      const selectedDate = viewDate.toISOString().slice(0, 10);
      return (
        <div className="space-y-4">
          <div className="text-center font-medium text-lg">
            {viewDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, i) => {
              const hour = i.toString().padStart(2, '0');
              const period = `${selectedDate}T${hour}`;
              const status = statusMap[period];
              const isDropdownOpen = activeDropdown === period;
              
              return (
                <div key={hour} className="relative">
                  <button
                    onClick={() => handleStatusClick(period)}
                    className={`p-3 rounded text-center text-sm font-medium transition-colors w-full ${getStatusColor(status)}`}
                    title={`${selectedDate} ${hour}:00`}
                  >
                    <div className="font-bold">{hour}:00</div>
                    <div className="text-xs opacity-75">{selectedDate}</div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 dropdown-container">
                      <button
                        onClick={() => handleStatusSelect(period, 'Yes')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 border-b border-gray-200"
                      >
                        ✅ Yes (Completed)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'No')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 border-b border-gray-200"
                      >
                        ❌ No (Not Done)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'Pending')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (freq === 'Daily') {
      // Show calendar for selected month
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      
      return (
        <div className="space-y-4">
          <div className="text-center font-medium text-lg">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const period = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = statusMap[period];
              const currentDate = new Date(year, month, day);
              const isDropdownOpen = activeDropdown === period;
              
              return (
                <div key={day} className="relative">
                  <button
                    onClick={() => handleStatusClick(period)}
                    className={`p-2 rounded text-center text-sm font-medium transition-colors w-full ${getStatusColor(status)}`}
                    title={currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  >
                    <div className="font-bold">{day}</div>
                    <div className="text-xs opacity-75">{currentDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 dropdown-container">
                      <button
                        onClick={() => handleStatusSelect(period, 'Yes')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 border-b border-gray-200"
                      >
                        ✅ Yes (Completed)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'No')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 border-b border-gray-200"
                      >
                        ❌ No (Not Done)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'Pending')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (freq === 'Weekly' || freq === '2 Times in a week') {
      // Show weeks of selected month
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const weeksInMonth = Math.ceil((new Date(year, month + 1, 0).getDate() + new Date(year, month, 1).getDay()) / 7);
      
      return (
        <div className="space-y-4">
          <div className="text-center font-medium text-lg">
            Weeks of {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: weeksInMonth }, (_, i) => {
              const week = i + 1;
              const period = `${year}-W${week}`;
              const status = statusMap[period];
              // Calculate week start and end dates
              const weekStart = new Date(year, month, 1 + (week - 1) * 7 - new Date(year, month, 1).getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              const isDropdownOpen = activeDropdown === period;
              
              return (
                <div key={week} className="relative">
                  <button
                    onClick={() => handleStatusClick(period)}
                    className={`p-4 rounded text-center font-medium transition-colors w-full ${getStatusColor(status)}`}
                    title={`Week ${week}: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`}
                  >
                    <div className="font-bold">Week {week}</div>
                    <div className="text-xs opacity-75">
                      {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 dropdown-container">
                      <button
                        onClick={() => handleStatusSelect(period, 'Yes')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 border-b border-gray-200"
                      >
                        ✅ Yes (Completed)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'No')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 border-b border-gray-200"
                      >
                        ❌ No (Not Done)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'Pending')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (freq === 'Monthly') {
      // Show months of selected year
      const year = viewDate.getFullYear();
      
      return (
        <div className="space-y-4">
          <div className="text-center font-medium text-lg">
            Months of {year}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const period = `${year}-${String(month).padStart(2, '0')}`;
              const status = statusMap[period];
              const monthDate = new Date(year, i, 1);
              const isDropdownOpen = activeDropdown === period;
              
              return (
                <div key={month} className="relative">
                  <button
                    onClick={() => handleStatusClick(period)}
                    className={`p-4 rounded text-center font-medium transition-colors w-full ${getStatusColor(status)}`}
                    title={monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  >
                    <div className="font-bold">{monthDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="text-xs opacity-75">{year}</div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 dropdown-container">
                      <button
                        onClick={() => handleStatusSelect(period, 'Yes')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-700 border-b border-gray-200"
                      >
                        ✅ Yes (Completed)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'No')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700 border-b border-gray-200"
                      >
                        ❌ No (Not Done)
                      </button>
                      <button
                        onClick={() => handleStatusSelect(period, 'Pending')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700"
                      >
                        ⏳ Pending
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return <div>Unknown frequency: {freq}</div>;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Daily Task Management of All Departments</h2>
      {/* Property Selection Dropdown */}
      {isAdmin ? (
        <div className="mb-6 max-w-md">
          <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
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
      ) : (
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-400" />
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
              {properties.find(p => p.id === selectedPropertyId)?.name || 'Loading...'}
            </div>
          </div>
        </div>
      )}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Check Points</th>
              <th className="px-3 py-2 border">Action Required</th>
              <th className="px-3 py-2 border">Standard</th>
              <th className="px-3 py-2 border">Frequency</th>
              <th className="px-3 py-2 border">User</th>
              {isAdmin && <th className="px-3 py-2 border">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    {/* S.No auto-increment */}
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{editId === item.id ? <input name="check_point" value={editRow?.check_point ?? ''} onChange={handleEditChange} className="w-40 border rounded px-1" /> : item.check_point}</td>
                    <td className="border px-2 py-1">{editId === item.id ? <input name="action_required" value={editRow?.action_required ?? ''} onChange={handleEditChange} className="w-32 border rounded px-1" /> : item.action_required}</td>
                    <td className="border px-2 py-1">{editId === item.id ? <input name="standard" value={editRow?.standard ?? ''} onChange={handleEditChange} className="w-40 border rounded px-1" /> : item.standard}</td>
                    <td className="border px-2 py-1">{editId === item.id ? (
                      <select
                        name="frequency"
                        value={editRow?.frequency ?? ''}
                        onChange={e => {
                          const freq = e.target.value;
                          setEditRow({
                            ...editRow!,
                            frequency: freq,
                          });
                        }}
                        className="w-24 border rounded px-1"
                      >
                        <option value="">Select</option>
                        {frequencyOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : item.frequency}</td>
                    {/* User editable dropdown */}
                    <td className="border px-2 py-1 text-center">{editId === item.id ? (
                      <select
                        name="user_required"
                        value={editRow?.user_required ? 'Yes' : 'No'}
                        onChange={e => setEditRow({ ...editRow!, user_required: e.target.value === 'Yes' })}
                        className="border rounded px-1"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : item.user_required ? 'Yes' : 'No'}</td>
                    {isAdmin && (
                      <td className="border px-2 py-1 text-center">
                        {editId === item.id ? (
                          <>
                            <button onClick={handleSave} className="text-green-600 mr-2"><Save size={18} /></button>
                            <button onClick={() => { setEditId(null); setEditRow(null); }} className="text-gray-500"><X size={18} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(item)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!)} className="text-red-600 mr-2"><Trash2 size={18} /></button>
                            <button onClick={() => handleOpenViewModal(item)} className="text-blue-600"><Eye size={18} /></button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {isAdmin && newRow && (
                  <tr style={{ background: '#FFF7ED' }}>
                    <td className="border px-2 py-1">{data.length + 1}</td>
                    <td className="border px-2 py-1"><input name="check_point" value={newRow.check_point} onChange={handleNewRowChange} className="w-40 border rounded px-1" /></td>
                    <td className="border px-2 py-1"><input name="action_required" value={newRow.action_required} onChange={handleNewRowChange} className="w-32 border rounded px-1" /></td>
                    <td className="border px-2 py-1"><input name="standard" value={newRow.standard} onChange={handleNewRowChange} className="w-40 border rounded px-1" /></td>
                    <td className="border px-2 py-1">
                      <select
                        name="frequency"
                        value={newRow.frequency}
                        onChange={e => {
                          const freq = e.target.value;
                          setNewRow({
                            ...newRow,
                            frequency: freq,
                          });
                        }}
                        className="w-24 border rounded px-1"
                      >
                        <option value="">Select</option>
                        {frequencyOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <select
                        name="user_required"
                        value={newRow.user_required ? 'Yes' : 'No'}
                        onChange={e => setNewRow({ ...newRow, user_required: e.target.value === 'Yes' })}
                        className="border rounded px-1"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={handleSaveNewRow} className="text-green-600 mr-2"><Save size={18} /></button>
                      <button onClick={handleCancelNewRow} className="text-gray-500"><X size={18} /></button>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && !newRow && (
        <button
          onClick={handleAddRow}
          className="mt-4 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Row
        </button>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Routine Checker: {viewModal.item.check_point}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Frequency:</strong> {viewModal.item.frequency}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Action Required:</strong> {viewModal.item.action_required}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Standard:</strong> {viewModal.item.standard}
              </p>
            </div>

            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date to View/Update:
              </label>
              <DatePicker
                selected={viewDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setViewDate(date);
                  }
                }}
                dateFormat="MMMM d, yyyy"
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
                maxDate={new Date()}
              />
            </div>
            
            {statusLoading ? (
              <div className="text-center py-8">Loading status data...</div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <span className="px-3 py-1 rounded bg-green-200 text-green-800 text-sm">Green = Yes (Completed)</span>
                    <span className="px-3 py-1 rounded bg-red-200 text-red-800 text-sm">Red = No (Not Done)</span>
                    <span className="px-3 py-1 rounded bg-yellow-200 text-yellow-800 text-sm">Yellow = Pending</span>
                  </div>
                  <p className="text-sm text-gray-600">Click any period to open a dropdown menu and select Yes/No/Pending</p>
                </div>
                
                {renderFrequencyView()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CDailyTaskManagementAllDepartment;
