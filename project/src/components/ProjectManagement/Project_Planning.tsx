import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Calendar, Target, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProjectPlanning {
  id: string;
  plan_id: string;
  scope: string;
  milestones: string[];
  start_date: string;
  end_date: string;
  resources_required: string[];
  risk_assessment: string;
  status: string;
  remarks: string;
}

interface ProjectMaster {
  property_id: string;
  project_initiation: {
    id: string;
    project_id: string;
    project_name: string;
  };
  project_planning?: ProjectPlanning;
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProjectPlanning: Omit<ProjectPlanning, 'id'> = {
  plan_id: '',
  scope: '',
  milestones: [],
  start_date: '',
  end_date: '',
  resources_required: [],
  risk_assessment: '',
  status: '',
  remarks: '',
};

const ProjectPlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; planning: ProjectPlanning | null; projectName: string }>({ open: false, planning: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; planning: Omit<ProjectPlanning, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, planning: null, isNew: false, projectId: '' });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        setProperties(res.data);
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
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

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setProjects(res.data);
    } catch (e) {
      setError('Failed to fetch projects');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const handleEdit = (planning: ProjectPlanning, projectId: string) => {
    const { id, ...planningData } = planning;
    setEditModal({ open: true, planning: planningData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      planning: { ...emptyProjectPlanning },
      projectId,
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Delete this project planning?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        await axios.put(`${API_URL}${projectId}`, {
          project_planning: null
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete project planning');
    }
  };

  const handleView = (planning: ProjectPlanning, projectName: string) => {
    setViewModal({ open: true, planning, projectName });
  };

  const handleSave = async () => {
    if (!editModal.planning) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project) {
        await axios.put(`${API_URL}${editModal.projectId}`, {
          project_planning: editModal.planning
        });
        setEditModal({ open: false, planning: null, isNew: false, projectId: '' });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save project planning');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Project Planning</h2>
      
      {/* Property Selection Dropdown */}
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

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Projects Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project ID</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Plan ID</th>
              <th className="px-3 py-2 border">Start Date</th>
              <th className="px-3 py-2 border">End Date</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Milestones</th>
              <th className="px-3 py-2 border">Resources</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-6">No projects found</td></tr>
            ) : (
              projects.map((project, idx) => (
                <tr key={project.project_initiation.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">{project.project_initiation.project_id}</td>
                  <td className="border px-2 py-1 font-medium">{project.project_initiation.project_name}</td>
                  <td className="border px-2 py-1">{project.project_planning?.plan_id || '-'}</td>
                  <td className="border px-2 py-1">{project.project_planning?.start_date || '-'}</td>
                  <td className="border px-2 py-1">{project.project_planning?.end_date || '-'}</td>
                  <td className="border px-2 py-1">
                    {project.project_planning ? (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.project_planning.status)}`}>
                        {project.project_planning.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        Not Planned
                      </span>
                    )}
                  </td>
                  <td className="border px-2 py-1">{project.project_planning?.milestones.length || 0}</td>
                  <td className="border px-2 py-1">{project.project_planning?.resources_required.length || 0}</td>
                  <td className="border px-2 py-1 text-center">
                    {project.project_planning ? (
                      <>
                        <button onClick={() => handleView(project.project_planning!, project.project_initiation.project_name)} className="text-blue-600 mr-2">
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(project.project_planning!, project.project_initiation.id)} className="text-orange-600 mr-2">
                              <Pencil size={18} />
                            </button>
                            <button onClick={() => handleDelete(project.project_initiation.id)} className="text-red-600">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      isAdmin && (
                        <button onClick={() => handleAdd(project.project_initiation.id)} className="text-green-600">
                          <Plus size={18} />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {editModal.open && editModal.planning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Project Planning
              </h3>
              <button
                onClick={() => setEditModal({ open: false, planning: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Plan ID" 
                  value={editModal.planning.plan_id} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, plan_id: e.target.value } })} 
                  required 
                />
                <select 
                  className="border rounded px-3 py-2" 
                  value={editModal.planning.status} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, status: e.target.value } })} 
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Start Date" 
                  type="date" 
                  value={editModal.planning.start_date} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, start_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="End Date" 
                  type="date" 
                  value={editModal.planning.end_date} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, end_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Milestones (comma-separated)" 
                  value={editModal.planning.milestones.join(', ')} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, milestones: e.target.value.split(',').map(s => s.trim()) } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Resources Required (comma-separated)" 
                  value={editModal.planning.resources_required.join(', ')} 
                  onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, resources_required: e.target.value.split(',').map(s => s.trim()) } })} 
                  required 
                />
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Scope" 
                    rows={3}
                    value={editModal.planning.scope} 
                    onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, scope: e.target.value } })} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Risk Assessment" 
                    rows={3}
                    value={editModal.planning.risk_assessment} 
                    onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, risk_assessment: e.target.value } })} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.planning.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, planning: { ...m.planning!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, planning: null, isNew: false, projectId: '' })} 
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.planning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Planning: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, planning: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Plan ID:</b> {viewModal.planning.plan_id}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.planning.status)}`}>
                  {viewModal.planning.status}
                </span>
              </div>
              <div><b>Start Date:</b> {viewModal.planning.start_date}</div>
              <div><b>End Date:</b> {viewModal.planning.end_date}</div>
              <div className="col-span-2"><b>Scope:</b> {viewModal.planning.scope}</div>
              <div className="col-span-2"><b>Milestones:</b> {viewModal.planning.milestones.join(', ')}</div>
              <div className="col-span-2"><b>Resources Required:</b> {viewModal.planning.resources_required.join(', ')}</div>
              <div className="col-span-2"><b>Risk Assessment:</b> {viewModal.planning.risk_assessment}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.planning.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanningPage;
