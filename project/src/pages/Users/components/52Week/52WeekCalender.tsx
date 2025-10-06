import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';


interface WorkScheduleItem {
  id?: string;
  asset_name: string;
  category: string;
  location: string;
  schedule_type: string; // D, W, M, Q, H, Y (Daily, Weekly, Monthly, Quarterly, Half Yearly, Yearly)
  weekwise_status: { [key: string]: string }; // Dictionary for weekwise status (W01: "", W02: "", etc.)
  created_at?: string;
  updated_at?: string;
}

export interface WorkSchedule {
  id?: string;
  property_id: string;
  company: string;
  schedule_year: string;
  location: string;
  facility_manager: string;
  afm: string;
  generated_on: string;
  work_schedule_items: WorkScheduleItem[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/work-schedules/';

const orange = '#FB7E03';
const orangeDark = '#E06002';

const initialNewSchedule = (property_id: string): WorkSchedule => ({
  property_id,
  company: '',
  schedule_year: new Date().getFullYear().toString(),
  location: '',
  facility_manager: '',
  afm: '',
  generated_on: new Date().toISOString().slice(0, 10),
  work_schedule_items: [],
});

const initialNewItem = (): WorkScheduleItem => ({
  asset_name: '',
  category: '',
  location: '',
  schedule_type: '',
  weekwise_status: {},
});

const CWeekCalendarP: React.FC = () => {
  console.log('🚀 52WeekCalendar: Component initialized');
  const { user } = useAuth();
  console.log('👤 52WeekCalendar: User loaded', { userId: user?.userId });
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit' | 'view'; schedule: WorkSchedule | null }>({ open: false, mode: 'add', schedule: null });
  const [editSchedule, setEditSchedule] = useState<WorkSchedule | null>(null);
  const [saving, setSaving] = useState(false);


  // Fetch schedules for user's property
  useEffect(() => {
    if (!user?.propertyId) return;
    setLoading(true);
    axios.get(API_URL + 'property/' + user.propertyId)
      .then(res => setSchedules(res.data))
      .catch(() => setError('Failed to fetch work schedules'))
      .finally(() => setLoading(false));
  }, [user?.propertyId]);

  // Handlers
  const handleAdd = () => {
    setEditSchedule(initialNewSchedule(user?.propertyId || ''));
    setModal({ open: true, mode: 'add', schedule: null });
  };

  const handleEdit = (schedule: WorkSchedule) => {
    setEditSchedule({ ...schedule });
    setModal({ open: true, mode: 'edit', schedule });
  };

  const handleView = (schedule: WorkSchedule) => {
    setModal({ open: true, mode: 'view', schedule });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this work schedule?')) return;
    setLoading(true);
    try {
      await axios.delete(API_URL + id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete work schedule');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editSchedule) return;
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const res = await axios.post(API_URL, editSchedule);
        setSchedules([res.data, ...schedules]);
      } else if (modal.mode === 'edit' && editSchedule.id) {
        const res = await axios.put(API_URL + editSchedule.id, editSchedule);
        setSchedules(schedules.map(s => s.id === editSchedule.id ? res.data : s));
      }
      setModal({ open: false, mode: 'add', schedule: null });
      setEditSchedule(null);
    } catch {
      setError('Failed to save work schedule');
    }
    setSaving(false);
  };

  // Form field handlers
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editSchedule) return;
    const { name, value } = e.target;
    setEditSchedule({ ...editSchedule, [name]: value });
  };

  // Work Schedule Item handlers
  const handleItemChange = (idx: number, field: keyof WorkScheduleItem, value: any) => {
    if (!editSchedule) return;
    const items = [...editSchedule.work_schedule_items];
    items[idx] = { ...items[idx], [field]: value };
    setEditSchedule({ ...editSchedule, work_schedule_items: items });
  };

  const handleAddItem = () => {
    if (!editSchedule) return;
    setEditSchedule({ 
      ...editSchedule, 
      work_schedule_items: [...editSchedule.work_schedule_items, initialNewItem()] 
    });
  };

  const handleRemoveItem = (idx: number) => {
    if (!editSchedule) return;
    const items = [...editSchedule.work_schedule_items];
    items.splice(idx, 1);
    setEditSchedule({ ...editSchedule, work_schedule_items: items });
  };

  const handleWeekwiseStatusChange = (itemIdx: number, week: string, value: string) => {
    if (!editSchedule) return;
    const items = [...editSchedule.work_schedule_items];
    const item = { ...items[itemIdx] };
    item.weekwise_status = { ...item.weekwise_status, [week]: value };
    items[itemIdx] = item;
    setEditSchedule({ ...editSchedule, work_schedule_items: items });
  };


  // Generate weeks for the year (52 weeks)
  const generateWeeksForYear = () => {
    return Array.from({ length: 52 }, (_, i) => `W${String(i + 1).padStart(2, '0')}`);
  };

  // Get schedule type label
  const getScheduleTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'D': 'Daily',
      'W': 'Weekly',
      'M': 'Monthly',
      'Q': 'Quarterly',
      'H': 'Half Yearly',
      'Y': 'Yearly'
    };
    return types[type] || type;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>52-Week Work Schedule Management</h2>
      
      {/* Property Display */}
      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
            {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
          </div>
        </div>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}
      
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Company</th>
              <th className="px-3 py-2 border">Year</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Facility Manager</th>
              <th className="px-3 py-2 border">AFM</th>
              <th className="px-3 py-2 border">Generated On</th>
              <th className="px-3 py-2 border">Items</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} style={{ background: '#fff' }}>
                    <td className="border px-2 py-1">{schedule.company}</td>
                    <td className="border px-2 py-1">{schedule.schedule_year}</td>
                    <td className="border px-2 py-1">{schedule.location}</td>
                    <td className="border px-2 py-1">{schedule.facility_manager}</td>
                    <td className="border px-2 py-1">{schedule.afm}</td>
                    <td className="border px-2 py-1">{schedule.generated_on}</td>
                    <td className="border px-2 py-1">{schedule.work_schedule_items?.length || 0}</td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(schedule)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(schedule)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(schedule.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        className="mt-4 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        disabled={!user?.propertyId}
      >
        <Plus size={18} className="mr-2" /> Add Work Schedule
      </button>

      {/* Modal for Add/Edit/View */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === 'add' ? 'Add Work Schedule' : modal.mode === 'edit' ? 'Edit Work Schedule' : 'View Work Schedule'}
              </h3>
              <button
                onClick={() => { setModal({ open: false, mode: 'add', schedule: null }); setEditSchedule(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {(modal.mode === 'add' || modal.mode === 'edit') && editSchedule && (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      name="company"
                      value={editSchedule.company}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Year</label>
                    <input
                      type="number"
                      name="schedule_year"
                      value={editSchedule.schedule_year}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      name="location"
                      value={editSchedule.location}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Manager</label>
                    <input
                      name="facility_manager"
                      value={editSchedule.facility_manager}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AFM</label>
                    <input
                      name="afm"
                      value={editSchedule.afm}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generated On</label>
                    <input
                      type="date"
                      name="generated_on"
                      value={editSchedule.generated_on}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                </div>

                {/* Work Schedule Items */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Work Schedule Items</label>
                    <button onClick={handleAddItem} className="text-green-600 flex items-center">
                      <Plus size={16} className="mr-1" /> Add Item
                    </button>
                  </div>
                  
                  {editSchedule.work_schedule_items.map((item, itemIdx) => (
                    <div key={itemIdx} className="border rounded p-4 mb-4">
                      <div className="grid grid-cols-5 gap-2 items-center mb-2">
                        <input
                          placeholder="Asset Name"
                          value={item.asset_name}
                          onChange={e => handleItemChange(itemIdx, 'asset_name', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        />
                        <input
                          placeholder="Category"
                          value={item.category}
                          onChange={e => handleItemChange(itemIdx, 'category', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        />
                        <input
                          placeholder="Location"
                          value={item.location}
                          onChange={e => handleItemChange(itemIdx, 'location', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        />
                        <select
                          value={item.schedule_type}
                          onChange={e => handleItemChange(itemIdx, 'schedule_type', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="">Schedule Type</option>
                          <option value="D">Daily</option>
                          <option value="W">Weekly</option>
                          <option value="M">Monthly</option>
                          <option value="Q">Quarterly</option>
                          <option value="H">Half Yearly</option>
                          <option value="Y">Yearly</option>
                        </select>
                        <button 
                          onClick={() => handleRemoveItem(itemIdx)} 
                          className="text-red-600 flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Weekwise Status Grid */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weekwise Status</label>
                        <div className="grid grid-cols-13 gap-1 text-xs overflow-x-auto">
                          {generateWeeksForYear().map(week => (
                            <div key={week} className="text-center min-w-[60px]">
                              <div className="font-medium mb-1">{week}</div>
                              <select
                                value={item.weekwise_status[week] || ''}
                                onChange={e => handleWeekwiseStatusChange(itemIdx, week, e.target.value)}
                                className="border border-gray-300 rounded px-1 py-1 w-full text-xs"
                              >
                                <option value="">-</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Not Applicable">Not Applicable</option>
                                <option value="Skipped">Skipped</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    disabled={saving}
                  >
                    <Save size={18} className="inline mr-1" /> Save
                  </button>
                  <button
                    onClick={() => { setModal({ open: false, mode: 'add', schedule: null }); setEditSchedule(null); }}
                    className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modal.mode === 'view' && modal.schedule && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Company:</strong> {modal.schedule.company}</div>
                  <div><strong>Schedule Year:</strong> {modal.schedule.schedule_year}</div>
                  <div><strong>Location:</strong> {modal.schedule.location}</div>
                  <div><strong>Facility Manager:</strong> {modal.schedule.facility_manager}</div>
                  <div><strong>AFM:</strong> {modal.schedule.afm}</div>
                  <div><strong>Generated On:</strong> {modal.schedule.generated_on}</div>
                </div>

                <div>
                  <strong>Work Schedule Items:</strong>
                  {modal.schedule.work_schedule_items?.map((item, i) => (
                    <div key={i} className="border rounded p-3 mb-3">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div><strong>Asset Name:</strong> {item.asset_name}</div>
                        <div><strong>Category:</strong> {item.category}</div>
                        <div><strong>Location:</strong> {item.location}</div>
                        <div><strong>Schedule Type:</strong> {getScheduleTypeLabel(item.schedule_type)}</div>
                      </div>
                      
                      <div className="mt-2">
                        <strong>Weekwise Status:</strong>
                        <div className="grid grid-cols-13 gap-1 text-xs mt-1 overflow-x-auto">
                          {generateWeeksForYear().map(week => (
                            <div key={week} className="text-center border p-1 min-w-[60px]">
                              <div className="font-medium">{week}</div>
                              <div>{item.weekwise_status[week] || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CWeekCalendarP;
