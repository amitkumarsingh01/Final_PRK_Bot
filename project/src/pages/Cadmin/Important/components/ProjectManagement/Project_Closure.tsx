import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ProjectClosure {
  id: string;
  closure_id: string;
  completion_date: string;
  final_budget: number;
  deliverables: string[];
  lessons_learned: string;
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
  project_closure?: ProjectClosure;
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyProjectClosure: Omit<ProjectClosure, 'id'> = {
  closure_id: '',
  completion_date: '',
  final_budget: 0,
  deliverables: [],
  lessons_learned: '',
  status: '',
  remarks: '',
};

const ProjectClosurePage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; closure: ProjectClosure | null; projectName: string }>({ open: false, closure: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; closure: Omit<ProjectClosure, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, closure: null, isNew: false, projectId: '' });

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

  const handleEdit = (closure: ProjectClosure, projectId: string) => {
    const { id, ...closureData } = closure;
    setEditModal({ open: true, closure: closureData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      closure: { ...emptyProjectClosure },
      projectId,
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Delete this project closure?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        await axios.put(`${API_URL}${projectId}`, {
          project_closure: null
        });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to delete project closure');
    }
  };

  const handleView = (closure: ProjectClosure, projectName: string) => {
    setViewModal({ open: true, closure, projectName });
  };

  const handleSave = async () => {
    if (!editModal.closure) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project) {
        await axios.put(`${API_URL}${editModal.projectId}`, {
          project_closure: editModal.closure
        });
        setEditModal({ open: false, closure: null, isNew: false, projectId: '' });
        fetchData(selectedPropertyId);
      }
    } catch (e) {
      setError('Failed to save project closure');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Project Closure</h2>
      
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
              <th className="px-3 py-2 border">Closure ID</th>
              <th className="px-3 py-2 border">Completion Date</th>
              <th className="px-3 py-2 border">Final Budget</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Deliverables</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-6">No projects found</td></tr>
            ) : (
              projects.map((project, idx) => (
                <tr key={project.project_initiation.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">{project.project_initiation.project_id}</td>
                  <td className="border px-2 py-1 font-medium">{project.project_initiation.project_name}</td>
                  <td className="border px-2 py-1">{project.project_closure?.closure_id || '-'}</td>
                  <td className="border px-2 py-1">{project.project_closure?.completion_date || '-'}</td>
                  <td className="border px-2 py-1">
                    {project.project_closure ? `₹${project.project_closure.final_budget.toLocaleString()}` : '-'}
                  </td>
                  <td className="border px-2 py-1">
                    {project.project_closure ? (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.project_closure.status)}`}>
                        {project.project_closure.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        Not Closed
                      </span>
                    )}
                  </td>
                  <td className="border px-2 py-1">{project.project_closure?.deliverables.length || 0}</td>
                  <td className="border px-2 py-1 text-center">
                    {project.project_closure ? (
                      <>
                        <button onClick={() => handleView(project.project_closure!, project.project_initiation.project_name)} className="text-blue-600 mr-2">
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(project.project_closure!, project.project_initiation.id)} className="text-orange-600 mr-2">
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
      {editModal.open && editModal.closure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Project Closure
              </h3>
              <button
                onClick={() => setEditModal({ open: false, closure: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Closure ID" 
                  value={editModal.closure.closure_id} 
                  onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, closure_id: e.target.value } })} 
                  required 
                />
                <select 
                  className="border rounded px-3 py-2" 
                  value={editModal.closure.status} 
                  onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, status: e.target.value } })} 
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                  <option value="Pending">Pending</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Completion Date" 
                  type="date" 
                  value={editModal.closure.completion_date} 
                  onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, completion_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Final Budget" 
                  type="number" 
                  value={editModal.closure.final_budget} 
                  onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, final_budget: parseFloat(e.target.value) || 0 } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Deliverables (comma-separated)" 
                  value={editModal.closure.deliverables.join(', ')} 
                  onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, deliverables: e.target.value.split(',').map(s => s.trim()) } })} 
                  required 
                />
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Lessons Learned" 
                    rows={4}
                    value={editModal.closure.lessons_learned} 
                    onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, lessons_learned: e.target.value } })} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.closure.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, closure: { ...m.closure!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, closure: null, isNew: false, projectId: '' })} 
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
      {viewModal.open && viewModal.closure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Closure: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, closure: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Closure ID:</b> {viewModal.closure.closure_id}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.closure.status)}`}>
                  {viewModal.closure.status}
                </span>
              </div>
              <div><b>Completion Date:</b> {viewModal.closure.completion_date}</div>
              <div><b>Final Budget:</b> ₹{viewModal.closure.final_budget.toLocaleString()}</div>
              <div className="col-span-2"><b>Deliverables:</b> {viewModal.closure.deliverables.join(', ')}</div>
              <div className="col-span-2"><b>Lessons Learned:</b> {viewModal.closure.lessons_learned}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.closure.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectClosurePage;
