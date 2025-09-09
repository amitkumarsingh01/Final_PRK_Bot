import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye, Calendar, Target, Clock } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface ExecutionTask {
  id: string;
  task_id: string;
  task_description: string;
  assigned_to: string;
  start_date: string;
  due_date: string;
  progress: number;
  status: string;
  priority: string;
  remarks: string;
}

interface ProjectMaster {
  property_id: string;
  project_initiation: {
    id: string;
    project_id: string;
    project_name: string;
  };
  execution_implementation: ExecutionTask[];
}

const API_URL = 'https://server.prktechindia.in/project-masters/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyExecutionTask: Omit<ExecutionTask, 'id'> = {
  task_id: '',
  task_description: '',
  assigned_to: '',
  start_date: '',
  due_date: '',
  progress: 0,
  status: '',
  priority: '',
  remarks: '',
};

const ExecutionImplementationPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; task: ExecutionTask | null; projectName: string }>({ open: false, task: null, projectName: '' });
  const [editModal, setEditModal] = useState<{ open: boolean; task: Omit<ExecutionTask, 'id'> | null; isNew: boolean; projectId: string }>({ open: false, task: null, isNew: false, projectId: '' });

  const handleEdit = (task: ExecutionTask, projectId: string) => {
    const { id, ...taskData } = task;
    setEditModal({ open: true, task: taskData, isNew: false, projectId });
  };

  const handleAdd = (projectId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      task: { ...emptyExecutionTask },
      projectId,
    });
  };

  const handleDelete = async (taskId: string, projectId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const project = projects.find(p => p.project_initiation.id === projectId);
      if (project) {
        const updatedTasks = project.execution_implementation.filter(t => t.id !== taskId);
        await axios.put(`${API_URL}${projectId}`, {
          execution_implementation: updatedTasks
        });
        fetchData();
      }
    } catch (e) {
      setError('Failed to delete task');
    }
  };

  const handleView = (task: ExecutionTask, projectName: string) => {
    setViewModal({ open: true, task, projectName });
  };

  const handleSave = async () => {
    if (!editModal.task) return;
    try {
      const project = projects.find(p => p.project_initiation.id === editModal.projectId);
      if (project && editModal.task) {
        const task = editModal.task;
        let updatedTasks: ExecutionTask[];
        if (editModal.isNew) {
          const newTask: ExecutionTask = { 
            id: `temp_${Date.now()}`,
            task_id: task.task_id,
            task_description: task.task_description,
            assigned_to: task.assigned_to,
            start_date: task.start_date,
            due_date: task.due_date,
            progress: task.progress,
            status: task.status,
            priority: task.priority,
            remarks: task.remarks
          };
          updatedTasks = [...project.execution_implementation, newTask];
        } else {
          updatedTasks = project.execution_implementation.map(t =>
            t.task_id === task.task_id 
              ? { 
                  id: t.id,
                  task_id: task.task_id,
                  task_description: task.task_description,
                  assigned_to: task.assigned_to,
                  start_date: task.start_date,
                  due_date: task.due_date,
                  progress: task.progress,
                  status: task.status,
                  priority: task.priority,
                  remarks: task.remarks
                }
              : t
          );
        }
        
        await axios.put(`${API_URL}${editModal.projectId}`, {
          execution_implementation: updatedTasks
        });
        setEditModal({ open: false, task: null, isNew: false, projectId: '' });
        fetchData();
      }
    } catch (e) {
      setError('Failed to save task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Flatten all tasks from all projects for display
  const getAllTasks = () => {
    const allTasks: Array<ExecutionTask & { projectId: string; projectName: string }> = [];
    projects.forEach(project => {
      project.execution_implementation.forEach(task => {
        allTasks.push({
          ...task,
          projectId: project.project_initiation.id,
          projectName: project.project_initiation.project_name
        });
      });
    });
    return allTasks;
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Execution & Implementation</h2>
      
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

      {/* Tasks Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Project Name</th>
              <th className="px-3 py-2 border">Task ID</th>
              <th className="px-3 py-2 border">Description</th>
              <th className="px-3 py-2 border">Assigned To</th>
              <th className="px-3 py-2 border">Due Date</th>
              <th className="px-3 py-2 border">Progress</th>
              <th className="px-3 py-2 border">Priority</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-6">Loading...</td></tr>
            ) : getAllTasks().length === 0 ? (
              <tr><td colSpan={10} className="text-center py-6">No tasks found</td></tr>
            ) : (
              getAllTasks().map((task, idx) => (
                <tr key={task.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1 font-medium">{task.projectName}</td>
                  <td className="border px-2 py-1">{task.task_id}</td>
                  <td className="border px-2 py-1">{task.task_description}</td>
                  <td className="border px-2 py-1">{task.assigned_to}</td>
                  <td className="border px-2 py-1">{task.due_date}</td>
                  <td className="border px-2 py-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{task.progress}%</span>
                  </td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => handleView(task, task.projectName)} className="text-blue-600 mr-2">
                      <Eye size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleEdit(task, task.projectId)} className="text-orange-600 mr-2">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(task.id, task.projectId)} className="text-red-600">
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
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">Add Task to Project:</label>
          <div className="flex gap-2">
            
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editModal.open && editModal.task && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Task
              </h3>
              <button
                onClick={() => setEditModal({ open: false, task: null, isNew: false, projectId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Task ID" 
                  value={editModal.task.task_id} 
                  onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, task_id: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Assigned To" 
                  value={editModal.task.assigned_to} 
                  onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, assigned_to: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Start Date" 
                  type="date" 
                  value={editModal.task.start_date} 
                  onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, start_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Due Date" 
                  type="date" 
                  value={editModal.task.due_date} 
                  onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, due_date: e.target.value } })} 
                  required 
                />
                <input 
                  className="border rounded px-3 py-2" 
                  placeholder="Progress (%)" 
                  type="number" 
                  min="0" 
                  max="100"
                  value={editModal.task.progress} 
                  onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, progress: parseInt(e.target.value) || 0 } })} 
                  required 
                />
                
                
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Task Description" 
                    rows={3}
                    value={editModal.task.task_description} 
                    onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, task_description: e.target.value } })} 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <textarea 
                    className="border rounded px-3 py-2 w-full" 
                    placeholder="Remarks" 
                    rows={3}
                    value={editModal.task.remarks} 
                    onChange={e => setEditModal(m => m && { ...m, task: { ...m.task!, remarks: e.target.value } })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ open: false, task: null, isNew: false, projectId: '' })} 
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
      {viewModal.open && viewModal.task && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Task Details: {viewModal.projectName}
              </h3>
              <button
                onClick={() => setViewModal({ open: false, task: null, projectName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Task ID:</b> {viewModal.task.task_id}</div>
              <div><b>Assigned To:</b> {viewModal.task.assigned_to}</div>
              <div><b>Start Date:</b> {viewModal.task.start_date}</div>
              <div><b>Due Date:</b> {viewModal.task.due_date}</div>
              <div><b>Progress:</b> {viewModal.task.progress}%</div>
              <div><b>Priority:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(viewModal.task.priority)}`}>
                  {viewModal.task.priority}
                </span>
              </div>
              <div><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(viewModal.task.status)}`}>
                  {viewModal.task.status}
                </span>
              </div>
              <div className="col-span-2"><b>Description:</b> {viewModal.task.task_description}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.task.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionImplementationPage;
