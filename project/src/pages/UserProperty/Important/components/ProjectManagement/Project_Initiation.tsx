import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProjectInitiation {
  id: string;
  project_id: string;
  project_name: string;
  sponsor: string;
  objective: string;
  start_date: string;
  budget: number;
  status: string;
  project_manager: string;
  stakeholders: string[];
  remarks: string;
  created_at: string;
  updated_at: string;
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProjectInitiation: Omit<ProjectInitiation, 'id' | 'created_at' | 'updated_at'> = {
  project_id: '',
  project_name: '',
  sponsor: '',
  objective: '',
  start_date: '',
  budget: 0,
  status: '',
  project_manager: '',
  stakeholders: [],
  remarks: '',
};

const ProjectInitiationPage: React.FC = () => {
  console.log('🚀 ProjectInitiation: Component initialized');
  const { user } = useAuth();
  console.log('👤 ProjectInitiation: User loaded', { userId: user?.userId });
  const [projects, setProjects] = useState<ProjectInitiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; project: ProjectInitiation | null }>({ open: false, project: null });
  const [editModal, setEditModal] = useState<{ open: boolean; project: Omit<ProjectInitiation, 'id' | 'created_at' | 'updated_at'> | null; isNew: boolean }>({ open: false, project: null, isNew: false });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const masters = Array.isArray(res.data) ? res.data : [];
      const filteredMasters = user?.propertyId ? masters.filter((pm: any) => pm.property_id === user.propertyId) : masters;
      const arr: ProjectInitiation[] = filteredMasters.map((pm: any) => pm.project_initiation).filter(Boolean);
      setProjects(arr);
    } catch (e) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.token) fetchData(); }, [user?.token]);

  const handleEdit = (project: ProjectInitiation) => {
    const { id, created_at, updated_at, ...projectData } = project;
    setEditModal({ open: true, project: projectData, isNew: false });
  };

  const handleAdd = () => {
    setEditModal({
      open: true,
      isNew: true,
      project: { ...emptyProjectInitiation },
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}${projectId}`, { headers: { Authorization: `Bearer ${user?.token}` } });
      fetchData();
    } catch (e) {
      setError('Failed to delete project');
    }
  };

  const handleView = (project: ProjectInitiation) => {
    setViewModal({ open: true, project });
  };

  const handleSave = async () => {
    if (!editModal.project) return;
    try {
      if (editModal.isNew) {
        await axios.post(API_URL, {
          property_id: user?.propertyId,
          project_initiation: editModal.project,
          project_planning: null,
          team_resource_allocation: [],
          execution_implementation: [],
          monitoring_control: [],
          documentation_reporting: [],
          project_closure: null,
          depreciation_replacement: []
        }, { headers: { Authorization: `Bearer ${user?.token}` } });
      } else {
        // For editing, we need to update the entire project master
        // This is a simplified approach - in a real scenario, you'd need to handle this more carefully
        const existingProject = projects.find(p => p.project_id === editModal.project!.project_id);
        if (existingProject) {
          await axios.put(`${API_URL}${existingProject.id}`, {
            project_initiation: editModal.project
          }, { headers: { Authorization: `Bearer ${user?.token}` } });
        }
      }
      setEditModal({ open: false, project: null, isNew: false });
      fetchData();
    } catch (e) {
      setError('Failed to save project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Project Initiation</h2>
      
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

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Projects Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project ID</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Sponsor</th>
              <th className="px-3 py-2 border">Project Manager</th>
              <th className="px-3 py-2 border">Start Date</th>
              <th className="px-3 py-2 border">Budget</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Stakeholders</th>
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
                <tr key={project.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">{project.project_id}</td>
                  <td className="border px-2 py-1 font-medium">{project.project_name}</td>
                  <td className="border px-2 py-1">{project.sponsor}</td>
                  <td className="border px-2 py-1">{project.project_manager}</td>
                  <td className="border px-2 py-1">{project.start_date}</td>
                  <td className="border px-2 py-1">₹{project.budget.toLocaleString()}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1">{project.stakeholders.join(', ')}</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(project)} className="text-blue-600 mr-2">
                      <Eye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(project)} className="text-orange-600 mr-2">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="text-red-600">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <button
          onClick={handleAdd}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add New Project
        </button>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Project
              </h3>
              <button
                onClick={() => setEditModal({ open: false, project: null, isNew: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Project ID" 
                  value={editModal.project.project_id} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, project_id: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Project Name" 
                  value={editModal.project.project_name} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, project_name: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Sponsor" 
                  value={editModal.project.sponsor} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, sponsor: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Project Manager" 
                  value={editModal.project.project_manager} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, project_manager: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Start Date" 
                  type="date" 
                  value={editModal.project.start_date} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, start_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Budget" 
                  type="number" 
                  value={editModal.project.budget} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, budget: parseFloat(e.target.value) || 0 } })} 
                  required 
                />
                
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Stakeholders (comma-separated)" 
                  value={editModal.project.stakeholders.join(', ')} 
                  onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, stakeholders: e.target.value.split(',').map(s => s.trim()) } })} 
                  required 
                />
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Objective" 
                    rows={3}
                    value={editModal.project.objective} 
                    onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, objective: e.target.value } })} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.project.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, project: { ...m.project!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, project: null, isNew: false })} 
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
      {viewModal.open && viewModal.project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Details: {viewModal.project.project_name}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, project: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Project ID:</b> {viewModal.project.project_id}</div>
              <div><b>Project Name:</b> {viewModal.project.project_name}</div>
              <div><b>Sponsor:</b> {viewModal.project.sponsor}</div>
              <div><b>Project Manager:</b> {viewModal.project.project_manager}</div>
              <div><b>Start Date:</b> {viewModal.project.start_date}</div>
              <div><b>Budget:</b> ₹{viewModal.project.budget.toLocaleString()}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.project.status)}`}>
                  {viewModal.project.status}
                </span>
              </div>
              <div><b>Stakeholders:</b> {viewModal.project.stakeholders.join(', ')}</div>
              <div className="col-span-2"><b>Objective:</b> {viewModal.project.objective}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.project.remarks}</div>
              <div className="col-span-2"><b>Created:</b> {new Date(viewModal.project.created_at).toLocaleString()}</div>
              <div className="col-span-2"><b>Last Updated:</b> {new Date(viewModal.project.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInitiationPage;
