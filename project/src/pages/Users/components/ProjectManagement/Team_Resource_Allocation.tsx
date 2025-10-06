import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Users, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface TeamAllocation {
  id: string;
  allocation_id: string;
  team_member: string;
  role: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated: number;
  department: string;
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
  team_resource_allocation: TeamAllocation[];
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyTeamAllocation: Omit<TeamAllocation, 'id'> = {
  allocation_id: '',
  team_member: '',
  role: '',
  allocation_start_date: '',
  allocation_end_date: '',
  hours_allocated: 0,
  department: '',
  status: '',
  remarks: '',
};

const TeamResourceAllocationPage: React.FC = () => {
  console.log('🚀 TeamResourceAllocation: Component initialized');
  const { user } = useAuth();
  console.log('👤 TeamResourceAllocation: User loaded', { userId: user?.userId });
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; allocation: TeamAllocation | null; projectName: string }>({ open: false, allocation: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; allocation: Omit<TeamAllocation, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, allocation: null, isNew: false, projectId: '' });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const all = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? all.filter((p: ProjectMaster) => p.property_id === user.propertyId) : all;
      setProjects(filtered);
    } catch (e) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.propertyId]);

  const handleEdit = (allocation: TeamAllocation, projectId: string) => {
    const { id, ...allocationData } = allocation;
    setEditModal({ open: true, allocation: allocationData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      allocation: { ...emptyTeamAllocation },
      projectId,
    });
  };

  const handleDelete = async (allocationId: string, projectId: string) => {
    if (!window.confirm('Delete this team allocation?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        const updatedAllocations = project.team_resource_allocation.filter(a => a.id !== allocationId);
        await axios.put(`${API_URL}${projectId}`, {
          team_resource_allocation: updatedAllocations
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete team allocation');
    }
  };

  const handleView = (allocation: TeamAllocation, projectName: string) => {
    setViewModal({ open: true, allocation, projectName });
  };

  const handleSave = async () => {
    if (!editModal.allocation) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project && editModal.allocation) {
        const allocation = editModal.allocation;
        let updatedAllocations: TeamAllocation[];
        if (editModal.isNew) {
          // Generate a temporary ID for new allocation
          const newAllocation: TeamAllocation = { 
            id: `temp_${Date.now()}`,
            allocation_id: allocation.allocation_id,
            team_member: allocation.team_member,
            role: allocation.role,
            allocation_start_date: allocation.allocation_start_date,
            allocation_end_date: allocation.allocation_end_date,
            hours_allocated: allocation.hours_allocated,
            department: allocation.department,
            status: allocation.status,
            remarks: allocation.remarks
          };
          updatedAllocations = [...project.team_resource_allocation, newAllocation];
        } else {
          updatedAllocations = project.team_resource_allocation.map(a =>
            a.allocation_id === allocation.allocation_id 
              ? { 
                  id: a.id,
                  allocation_id: allocation.allocation_id,
                  team_member: allocation.team_member,
                  role: allocation.role,
                  allocation_start_date: allocation.allocation_start_date,
                  allocation_end_date: allocation.allocation_end_date,
                  hours_allocated: allocation.hours_allocated,
                  department: allocation.department,
                  status: allocation.status,
                  remarks: allocation.remarks
                }
              : a
          );
        }
        
        await axios.put(`${API_URL}${editModal.projectId}`, {
          team_resource_allocation: updatedAllocations
        });
        setEditModal({ open: false, allocation: null, isNew: false, projectId: '' });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save team allocation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Flatten all team allocations from all projects for display
  const getAllAllocations = () => {
    const allAllocations: Array<TeamAllocation & { projectId: string; projectName: string }> = [];
    projects.forEach(project => {
      project.team_resource_allocation.forEach(allocation => {
        allAllocations.push({
          ...allocation,
          projectId: project.project_initiation.id,
          projectName: project.project_initiation.project_name
        });
      });
    });
    return allAllocations;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Team Resource Allocation</h2>
      
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

      {isAdmin && (
        <button
          onClick={() => {
            if (projects.length > 0) {
              setEditModal({ open: true, isNew: true, allocation: { ...emptyTeamAllocation }, projectId: projects[0].project_initiation.id });
            } else {
              window.location.assign('/cadmin/project-initiation');
            }
          }}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Allocation
        </button>
      )}

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Team Allocations Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Allocation ID</th>
              <th className="px-3 py-2 border">Team Member</th>
              <th className="px-3 py-2 border">Role</th>
              <th className="px-3 py-2 border">Department</th>
              <th className="px-3 py-2 border">Allocation Period</th>
              <th className="px-3 py-2 border">Hours Allocated</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : getAllAllocations().length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6">
                  <div className="flex items-center justify-center gap-3">
                    <span>No team allocations found</span>
                    {isAdmin && projects.length > 0 && (
                      <button onClick={() => setEditModal({ open: true, isNew: true, allocation: { ...emptyTeamAllocation }, projectId: projects[0].project_initiation.id })} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Allocation</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              getAllAllocations().map((allocation, idx) => (
                <tr key={allocation.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1 font-medium">{allocation.projectName}</td>
                  <td className="border px-2 py-1">{allocation.allocation_id}</td>
                  <td className="border px-2 py-1">{allocation.team_member}</td>
                  <td className="border px-2 py-1">{allocation.role}</td>
                  <td className="border px-2 py-1">{allocation.department}</td>
                  <td className="border px-2 py-1">{allocation.allocation_start_date} - {allocation.allocation_end_date}</td>
                  <td className="border px-2 py-1">{allocation.hours_allocated}</td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(allocation.status)}`}>
                      {allocation.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(allocation, allocation.projectName)} className="text-blue-600 mr-2">
                      <Eye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(allocation, allocation.projectId)} className="text-orange-600 mr-2">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(allocation.id, allocation.projectId)} className="text-red-600">
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

      {isAdmin && projects.length > 0 && (
        <div className="mb-6">
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">Add Allocation to Project:</label>
          <div className="flex gap-2">
            
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.allocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Team Allocation
              </h3>
              <button
                onClick={() => setEditModal({ open: false, allocation: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Allocation ID" 
                  value={editModal.allocation.allocation_id} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, allocation_id: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Team Member" 
                  value={editModal.allocation.team_member} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, team_member: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Role" 
                  value={editModal.allocation.role} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, role: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Department" 
                  value={editModal.allocation.department} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, department: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Start Date" 
                  type="date" 
                  value={editModal.allocation.allocation_start_date} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, allocation_start_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="End Date" 
                  type="date" 
                  value={editModal.allocation.allocation_end_date} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, allocation_end_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Hours Allocated" 
                  type="number" 
                  value={editModal.allocation.hours_allocated} 
                  onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, hours_allocated: parseInt(e.target.value) || 0 } })} 
                  required 
                />
                
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.allocation.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, allocation: { ...m.allocation!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, allocation: null, isNew: false, projectId: '' })} 
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
      {viewModal.open && viewModal.allocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Team Allocation: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, allocation: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Allocation ID:</b> {viewModal.allocation.allocation_id}</div>
              <div><b>Team Member:</b> {viewModal.allocation.team_member}</div>
              <div><b>Role:</b> {viewModal.allocation.role}</div>
              <div><b>Department:</b> {viewModal.allocation.department}</div>
              <div><b>Start Date:</b> {viewModal.allocation.allocation_start_date}</div>
              <div><b>End Date:</b> {viewModal.allocation.allocation_end_date}</div>
              <div><b>Hours Allocated:</b> {viewModal.allocation.hours_allocated}</div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.allocation.status)}`}>
                  {viewModal.allocation.status}
                </span>
              </div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.allocation.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamResourceAllocationPage;
