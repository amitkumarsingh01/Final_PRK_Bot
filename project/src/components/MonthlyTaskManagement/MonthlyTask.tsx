import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface CheckPoint {
  id?: string;
  sl_no: number;
  item: string;
  action_required: string;
  standard: string;
  frequency: string;
  daily_status: { [key: string]: string }; // Dictionary for daily status (01: "", 02: "", etc.)
  created_at?: string;
  updated_at?: string;
}

export interface UtilityPanel {
  id?: string;
  property_id: string;
  panel_name: string;
  building_name: string;
  month: string;
  site_name: string;
  prepared_by: string;
  reviewed_date: string;
  document_no: string;
  prepared_date: string;
  implemented_date: string;
  version_no: string;
  reviewed_by: string;
  responsible_spoc: string;
  incharge_signature?: string;
  shift_staff_signature?: string;
  comment?: string;
  checkpoints: CheckPoint[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/utility-panels/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const orange = '#FB7E03';
const orangeDark = '#E06002';

const initialNewPanel = (property_id: string): UtilityPanel => ({
  property_id,
  panel_name: '',
  building_name: '',
  month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  site_name: '',
  prepared_by: '',
  reviewed_date: new Date().toISOString().slice(0, 10),
  document_no: '',
  prepared_date: new Date().toISOString().slice(0, 10),
  implemented_date: new Date().toISOString().slice(0, 10),
  version_no: '1.0',
  reviewed_by: '',
  responsible_spoc: '',
  incharge_signature: '',
  shift_staff_signature: '',
  comment: '',
  checkpoints: [],
});

const MonthlyTask: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [panels, setPanels] = useState<UtilityPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit' | 'view'; panel: UtilityPanel | null }>({ open: false, mode: 'add', panel: null });
  const [editPanel, setEditPanel] = useState<UtilityPanel | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (user?.userType === 'admin') {
          const res = await axios.get(PROPERTIES_URL);
          setProperties(res.data);
        } else {
          const resolvedPropertyId = user?.propertyId || '';
          if (!resolvedPropertyId) return;
          const res = await axios.get(`${PROPERTIES_URL}/${resolvedPropertyId}`);
          setProperties([res.data]);
          setSelectedPropertyId(resolvedPropertyId);
        }
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, [user?.userType, user?.propertyId]);

  // Fetch panels for selected property
  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoading(true);
    axios.get(API_URL + 'property/' + selectedPropertyId)
      .then(res => {
        const data: UtilityPanel[] = res.data || [];
        const filtered = Array.isArray(data)
          ? data.filter(p => p.property_id === selectedPropertyId)
          : [];
        setPanels(filtered);
      })
      .catch(() => setError('Failed to fetch utility panels'))
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  // Handlers
  const handleAdd = () => {
    setEditPanel(initialNewPanel(selectedPropertyId));
    setModal({ open: true, mode: 'add', panel: null });
  };

  const handleEdit = (panel: UtilityPanel) => {
    setEditPanel({ ...panel });
    setModal({ open: true, mode: 'edit', panel });
  };

  const handleView = (panel: UtilityPanel) => {
    setModal({ open: true, mode: 'view', panel });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this utility panel?')) return;
    setLoading(true);
    try {
      await axios.delete(API_URL + id);
      setPanels(panels.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete utility panel');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editPanel) return;
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const res = await axios.post(API_URL, editPanel);
        setPanels([res.data, ...panels]);
      } else if (modal.mode === 'edit' && editPanel.id) {
        const res = await axios.put(API_URL + editPanel.id, editPanel);
        setPanels(panels.map(p => p.id === editPanel.id ? res.data : p));
      }
      setModal({ open: false, mode: 'add', panel: null });
      setEditPanel(null);
    } catch {
      setError('Failed to save utility panel');
    }
    setSaving(false);
  };

  // Form field handlers
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editPanel) return;
    const { name, value } = e.target;
    setEditPanel({ ...editPanel, [name]: value });
  };

  // Checkpoint handlers
  const handleCheckpointChange = (idx: number, field: keyof CheckPoint, value: any) => {
    if (!editPanel) return;
    const checkpoints = [...editPanel.checkpoints];
    checkpoints[idx] = { ...checkpoints[idx], [field]: value };
    setEditPanel({ ...editPanel, checkpoints });
  };

  const handleAddCheckpoint = () => {
    if (!editPanel) return;
    const newCheckpoint: CheckPoint = {
      sl_no: editPanel.checkpoints.length + 1,
      item: '',
      action_required: '',
      standard: '',
      frequency: '',
      daily_status: {},
    };
    setEditPanel({ ...editPanel, checkpoints: [...editPanel.checkpoints, newCheckpoint] });
  };

  const handleRemoveCheckpoint = (idx: number) => {
    if (!editPanel) return;
    const checkpoints = [...editPanel.checkpoints];
    checkpoints.splice(idx, 1);
    // Update sl_no for remaining checkpoints
    checkpoints.forEach((checkpoint, index) => {
      checkpoint.sl_no = index + 1;
    });
    setEditPanel({ ...editPanel, checkpoints });
  };

  const handleDailyStatusChange = (checkpointIdx: number, day: string, value: string) => {
    if (!editPanel) return;
    const checkpoints = [...editPanel.checkpoints];
    const checkpoint = { ...checkpoints[checkpointIdx] };
    checkpoint.daily_status = { ...checkpoint.daily_status, [day]: value };
    checkpoints[checkpointIdx] = checkpoint;
    setEditPanel({ ...editPanel, checkpoints });
  };

  // Property dropdown label
  const propertyLabel = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    return prop ? `${prop.name} - ${prop.title}` : 'Select Property';
  };

  // Generate days for the month
  const generateDaysForMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Monthly Utility Panel Management</h2>
      
      {/* Property Selection / Display */}
      {user?.userType === 'admin' ? (
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
              {properties.find(p => p.id === selectedPropertyId)?.name || properties[0]?.name || 'Loading...'}
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-2 text-red-600">{error}</div>}
      
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Panel Name</th>
              <th className="px-3 py-2 border">Building</th>
              <th className="px-3 py-2 border">Month</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Prepared By</th>
              <th className="px-3 py-2 border">Checkpoints</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {panels.map((panel) => (
                  <tr key={panel.id} style={{ background: '#fff' }}>
                    <td className="border px-2 py-1">{panel.panel_name}</td>
                    <td className="border px-2 py-1">{panel.building_name}</td>
                    <td className="border px-2 py-1">{panel.month}</td>
                    <td className="border px-2 py-1">{panel.site_name}</td>
                    <td className="border px-2 py-1">{panel.prepared_by}</td>
                    <td className="border px-2 py-1">{panel.checkpoints?.length || 0}</td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(panel)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(panel)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(panel.id)} className="text-red-600"><Trash2 size={18} /></button>
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
        disabled={!selectedPropertyId}
      >
        <Plus size={18} className="mr-2" /> Add Utility Panel
      </button>

      {/* Modal for Add/Edit/View */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === 'add' ? 'Add Utility Panel' : modal.mode === 'edit' ? 'Edit Utility Panel' : 'View Utility Panel'}
              </h3>
              <button
                onClick={() => { setModal({ open: false, mode: 'add', panel: null }); setEditPanel(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {(modal.mode === 'add' || modal.mode === 'edit') && editPanel && (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Panel Name</label>
                    <input
                      name="panel_name"
                      value={editPanel.panel_name}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                    <input
                      name="building_name"
                      value={editPanel.building_name}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <input
                      type="month"
                      name="month"
                      value={editPanel.month}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input
                      name="site_name"
                      value={editPanel.site_name}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                    <input
                      name="prepared_by"
                      value={editPanel.prepared_by}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reviewed By</label>
                    <input
                      name="reviewed_by"
                      value={editPanel.reviewed_by}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document No</label>
                    <input
                      name="document_no"
                      value={editPanel.document_no}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version No</label>
                    <input
                      name="version_no"
                      value={editPanel.version_no}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prepared Date</label>
                    <input
                      type="date"
                      name="prepared_date"
                      value={editPanel.prepared_date}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reviewed Date</label>
                    <input
                      type="date"
                      name="reviewed_date"
                      value={editPanel.reviewed_date}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implemented Date</label>
                    <input
                      type="date"
                      name="implemented_date"
                      value={editPanel.implemented_date}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsible SPOC</label>
                    <input
                      name="responsible_spoc"
                      value={editPanel.responsible_spoc}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    name="comment"
                    value={editPanel.comment || ''}
                    onChange={handleFieldChange}
                    rows={3}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  />
                </div>

                {/* Checkpoints */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Checkpoints</label>
                    <button onClick={handleAddCheckpoint} className="text-green-600 flex items-center">
                      <Plus size={16} className="mr-1" /> Add Checkpoint
                    </button>
                  </div>
                  
                  {editPanel.checkpoints.map((checkpoint, checkpointIdx) => (
                    <div key={checkpointIdx} className="border rounded p-4 mb-4">
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          type="number"
                          placeholder="SL No"
                          value={checkpoint.sl_no}
                          onChange={e => handleCheckpointChange(checkpointIdx, 'sl_no', Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-2 py-1 w-20"
                        />
                        <input
                          placeholder="Item"
                          value={checkpoint.item}
                          onChange={e => handleCheckpointChange(checkpointIdx, 'item', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                        />
                        <input
                          placeholder="Action Required"
                          value={checkpoint.action_required}
                          onChange={e => handleCheckpointChange(checkpointIdx, 'action_required', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 w-40"
                        />
                        <input
                          placeholder="Standard"
                          value={checkpoint.standard}
                          onChange={e => handleCheckpointChange(checkpointIdx, 'standard', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 w-40"
                        />
                        <select
                          value={checkpoint.frequency}
                          onChange={e => handleCheckpointChange(checkpointIdx, 'frequency', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 w-32"
                        >
                          <option value="">Frequency</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                        <button 
                          onClick={() => handleRemoveCheckpoint(checkpointIdx)} 
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Daily Status Grid */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Daily Status</label>
                        <div className="grid grid-cols-10 gap-1 text-xs">
                          {generateDaysForMonth(editPanel.month).map(day => (
                            <div key={day} className="text-center">
                              <div className="font-medium mb-1">{day}</div>
                              <select
                                value={checkpoint.daily_status[day] || ''}
                                onChange={e => handleDailyStatusChange(checkpointIdx, day, e.target.value)}
                                className="border border-gray-300 rounded px-1 py-1 w-full text-xs"
                              >
                                <option value="">-</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="NA">NA</option>
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
                    onClick={() => { setModal({ open: false, mode: 'add', panel: null }); setEditPanel(null); }}
                    className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modal.mode === 'view' && modal.panel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Panel Name:</strong> {modal.panel.panel_name}</div>
                  <div><strong>Building Name:</strong> {modal.panel.building_name}</div>
                  <div><strong>Month:</strong> {modal.panel.month}</div>
                  <div><strong>Site Name:</strong> {modal.panel.site_name}</div>
                  <div><strong>Prepared By:</strong> {modal.panel.prepared_by}</div>
                  <div><strong>Reviewed By:</strong> {modal.panel.reviewed_by}</div>
                  <div><strong>Document No:</strong> {modal.panel.document_no}</div>
                  <div><strong>Version No:</strong> {modal.panel.version_no}</div>
                  <div><strong>Prepared Date:</strong> {modal.panel.prepared_date}</div>
                  <div><strong>Reviewed Date:</strong> {modal.panel.reviewed_date}</div>
                  <div><strong>Implemented Date:</strong> {modal.panel.implemented_date}</div>
                  <div><strong>Responsible SPOC:</strong> {modal.panel.responsible_spoc}</div>
                </div>
                
                {modal.panel.comment && (
                  <div><strong>Comment:</strong> {modal.panel.comment}</div>
                )}

                <div>
                  <strong>Checkpoints:</strong>
                  {modal.panel.checkpoints?.map((checkpoint, i) => (
                    <div key={i} className="border rounded p-3 mb-3">
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        <div><strong>SL No:</strong> {checkpoint.sl_no}</div>
                        <div><strong>Item:</strong> {checkpoint.item}</div>
                        <div><strong>Action Required:</strong> {checkpoint.action_required}</div>
                        <div><strong>Standard:</strong> {checkpoint.standard}</div>
                        <div><strong>Frequency:</strong> {checkpoint.frequency}</div>
                      </div>
                      
                      <div className="mt-2">
                        <strong>Daily Status:</strong>
                        <div className="grid grid-cols-10 gap-1 text-xs mt-1">
                          {generateDaysForMonth(modal.panel!.month).map(day => (
                            <div key={day} className="text-center border p-1">
                              <div className="font-medium">{day}</div>
                              <div>{checkpoint.daily_status[day] || '-'}</div>
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

export default MonthlyTask;
