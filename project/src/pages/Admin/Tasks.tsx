import React, { useState, useEffect } from 'react';
import { Plus, Edit, Delete, Check, Play, Pause, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';

const API_BASE_URL = 'https://server.prktechindia.in';

// API service functions
const api = {
  // Activity CRUD
  getActivities: (): Promise<Activity[]> => fetch(`${API_BASE_URL}/activities`).then(res => res.json()),
  getActivity: (id: string): Promise<Activity> => fetch(`${API_BASE_URL}/activities/${id}`).then(res => res.json()),
  createActivity: (data: any): Promise<Activity> => fetch(`${API_BASE_URL}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateActivity: (id: string, data: any): Promise<Activity> => fetch(`${API_BASE_URL}/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteActivity: (id: string): Promise<Response> => fetch(`${API_BASE_URL}/activities/${id}`, { method: 'DELETE' }),

  // Task CRUD
  getTasks: (): Promise<Task[]> => fetch(`${API_BASE_URL}/tasks`).then(res => res.json()),
  getTask: (id: string): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}`).then(res => res.json()),
  getActivityTasks: (activityId: string): Promise<Task[]> => fetch(`${API_BASE_URL}/activities/${activityId}/tasks`).then(res => res.json()),
  createTask: (data: any): Promise<Task> => fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateTask: (id: string, data: any): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteTask: (id: string): Promise<Response> => fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' }),
  completeTask: (id: string): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}/complete`, { method: 'PATCH' }).then(res => res.json()),
  toggleTaskActive: (id: string): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}/activate`, { method: 'PATCH' }).then(res => res.json()),
  resetTask: (id: string): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}/reset`, { method: 'PATCH' }).then(res => res.json()),
};

// Add these interfaces after imports
interface Task {
  id: string;
  name: string;
  description?: string;
  reset_time?: string;
  reset_after?: number | null;
  total?: number;
  active?: boolean;
  completed?: boolean;
  default?: boolean;
  reset?: boolean;
  opening_time?: string;
  closing_time?: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  activity_id: string;
}

interface Activity {
  id: string;
  name: string;
  description?: string;
  user_role?: string;
  user_type?: string;
  created_at?: string;
  updated_at?: string;
  tasks?: Task[];
  total_tasks: number;
  active_tasks: number;
  default_tasks: number;
  completed_tasks: number;
}

const Tasks: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Activity form state
  const [activityForm, setActivityForm] = useState<{
    name: string;
    description: string;
    user_role: string;
    user_type: string;
  }>({
    name: '',
    description: '',
    user_role: '',
    user_type: ''
  });

  // Task form state
  const [taskForm, setTaskForm] = useState<{
    name: string;
    description: string;
    reset_after: string;
    total: string;
    opening_time: string;
    closing_time: string;
    comment: string;
    activity_id: string;
  }>({
    name: '',
    description: '',
    reset_after: '',
    total: '',
    opening_time: '',
    closing_time: '',
    comment: '',
    activity_id: ''
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data: Activity[] = await api.getActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityTasks = async (activityId: string): Promise<Task[]> => {
    try {
      const data: Task[] = await api.getActivityTasks(activityId);
      return data;
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingActivity) {
        await api.updateActivity(editingActivity.id, activityForm);
      } else {
        await api.createActivity(activityForm);
      }
      setShowActivityForm(false);
      setEditingActivity(null);
      setActivityForm({ name: '', description: '', user_role: '', user_type: '' });
      loadActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const taskData = {
        ...taskForm,
        total: parseInt(taskForm.total) || 0,
        reset_after: taskForm.reset_after ? parseInt(taskForm.reset_after) : null,
      };
      if (editingTask) {
        await api.updateTask(editingTask.id, taskData);
      } else {
        await api.createTask(taskData);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      setTaskForm({
        name: '',
        description: '',
        reset_after: '',
        total: '',
        opening_time: '',
        closing_time: '',
        comment: '',
        activity_id: ''
      });
      loadActivities();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity and all its tasks?')) {
      setLoading(true);
      try {
        await api.deleteActivity(id);
        loadActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        await api.deleteTask(id);
        loadActivities();
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCompleteTask = async (id: string) => {
    setLoading(true);
    try {
      await api.completeTask(id);
      loadActivities();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskActive = async (id: string) => {
    setLoading(true);
    try {
      await api.toggleTaskActive(id);
      loadActivities();
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTask = async (id: string) => {
    setLoading(true);
    try {
      await api.resetTask(id);
      loadActivities();
    } catch (error) {
      console.error('Error resetting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityExpanded = async (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
      // Load tasks for this activity
      const tasks = await loadActivityTasks(activityId);
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === activityId ? { ...activity, tasks } : activity
        )
      );
    }
    setExpandedActivities(newExpanded);
  };

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityForm({
      name: activity.name,
      description: activity.description || '',
      user_role: activity.user_role || '',
      user_type: activity.user_type || ''
    });
    setShowActivityForm(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      description: task.description || '',
      reset_after: task.reset_after?.toString() || '',
      total: task.total?.toString() || '',
      opening_time: task.opening_time ? task.opening_time.slice(0, 16) : '',
      closing_time: task.closing_time ? task.closing_time.slice(0, 16) : '',
      comment: task.comment || '',
      activity_id: task.activity_id
    });
    setShowTaskForm(true);
  };

  const openCreateTask = (activityId: string) => {
    setEditingTask(null);
    setTaskForm({
      name: '',
      description: '',
      reset_after: '',
      total: '',
      opening_time: '',
      closing_time: '',
      comment: '',
      activity_id: activityId
    });
    setShowTaskForm(true);
  };

  const handleSetTaskActive = async (task: Task) => {
    setLoading(true);
    try {
      await api.updateTask(task.id, {
        ...task,
        active: true,
        default: false,
        reset: false,
      });
      loadActivities();
    } catch (error) {
      console.error('Error setting task active:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTaskDefault = async (task: Task) => {
    setLoading(true);
    try {
      await api.updateTask(task.id, {
        ...task,
        active: false,
        default: true,
        reset: false,
      });
      loadActivities();
    } catch (error) {
      console.error('Error setting task default:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTaskReset = async (task: Task) => {
    setLoading(true);
    try {
      await api.updateTask(task.id, {
        ...task,
        active: false,
        default: false,
        reset: true,
      });
      loadActivities();
    } catch (error) {
      console.error('Error setting task reset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#060C18' }}>Task Management</h1>
          <button
            onClick={() => setShowActivityForm(true)}
            className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: '#DD6A1A' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Activity
          </button>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: '#060C18' }}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                style={{ backgroundColor: '#060C18' }}
                onClick={() => toggleActivityExpanded(activity.id)}
              >
                <div className="flex items-center text-white">
                  {expandedActivities.has(activity.id) ? (
                    <ChevronDown className="w-5 h-5 mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 mr-2" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-sm opacity-75">{activity.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-orange-200">
                      <span>Total: {activity.total_tasks}</span>
                      <span>Active: {activity.active_tasks}</span>
                      <span>Default: {activity.default_tasks}</span>
                      <span>Completed: {activity.completed_tasks}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateTask(activity.id);
                    }}
                    className="p-2 rounded hover:opacity-75"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditActivity(activity);
                    }}
                    className="p-2 rounded hover:opacity-75"
                    style={{ backgroundColor: '#DB7723' }}
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteActivity(activity.id);
                    }}
                    className="p-2 rounded hover:opacity-75"
                    style={{ backgroundColor: '#DF5F0D' }}
                  >
                    <Delete className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              {expandedActivities.has(activity.id) && activity.tasks && (
                <div className="p-4 bg-gray-50">
                  {activity.tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tasks yet</p>
                  ) : (
                    <div className="grid gap-4">
                      {activity.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`border rounded-lg p-4 ${
                            task.completed ? 'opacity-75' : ''
                          }`}
                          style={{ borderColor: '#F88024' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${task.completed ? 'line-through' : ''}`}>
                                {task.name}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                {(task.total ?? 0) > 0 && <span>Total: {task.total}</span>}
                                {task.reset_after && <span>Reset after: {task.reset_after}h</span>}
                                {task.opening_time && (
                                  <span>Opens: {new Date(task.opening_time).toLocaleString()}</span>
                                )}
                                {task.closing_time && (
                                  <span>Closes: {new Date(task.closing_time).toLocaleString()}</span>
                                )}
                              </div>
                              {task.comment && (
                                <p className="text-sm italic mt-2" style={{ color: '#DB7723' }}>
                                  {task.comment}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              {!task.completed && (
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="p-2 rounded hover:opacity-75"
                                  style={{ backgroundColor: '#DD6A1A' }}
                                  title="Complete task"
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </button>
                              )}
                              <button
                                onClick={() => handleSetTaskActive(task)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: task.active ? '#DB7723' : '#F88024' }}
                                title="Set Active"
                              >
                                <Play className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => handleSetTaskDefault(task)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: task.default ? '#DB7723' : '#F88024' }}
                                title="Set Default"
                              >
                                D
                              </button>
                              <button
                                onClick={() => handleSetTaskReset(task)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: task.reset ? '#DB7723' : '#F88024' }}
                                title="Set Reset"
                              >
                                R
                              </button>
                              <button
                                onClick={() => handleResetTask(task.id)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: '#DF5F0D' }}
                                title="Reset task"
                              >
                                <RotateCcw className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => openEditTask(task)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: '#060C18' }}
                                title="Edit task"
                              >
                                <Edit className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 rounded hover:opacity-75"
                                style={{ backgroundColor: '#DF5F0D' }}
                                title="Delete task"
                              >
                                <Delete className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Activity Form Modal */}
        {showActivityForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#060C18' }}>
                {editingActivity ? 'Edit Activity' : 'Create Activity'}
              </h2>
              <form onSubmit={handleActivitySubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Description
                    </label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      User Role
                    </label>
                    <input
                      type="text"
                      value={activityForm.user_role}
                      onChange={(e) => setActivityForm({ ...activityForm, user_role: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      User Type
                    </label>
                    <input
                      type="text"
                      value={activityForm.user_type}
                      onChange={(e) => setActivityForm({ ...activityForm, user_type: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityForm(false);
                      setEditingActivity(null);
                      setActivityForm({ name: '', description: '', user_role: '', user_type: '' });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {loading ? 'Saving...' : (editingActivity ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#060C18' }}>
                {editingTask ? 'Edit Task' : 'Create Task'}
              </h2>
              <form onSubmit={handleTaskSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={taskForm.name}
                      onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Total
                    </label>
                    <input
                      type="number"
                      value={taskForm.total}
                      onChange={(e) => setTaskForm({ ...taskForm, total: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Reset After (hours)
                    </label>
                    <input
                      type="number"
                      value={taskForm.reset_after}
                      onChange={(e) => setTaskForm({ ...taskForm, reset_after: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Opening Time
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.opening_time}
                      onChange={(e) => setTaskForm({ ...taskForm, opening_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Closing Time
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.closing_time}
                      onChange={(e) => setTaskForm({ ...taskForm, closing_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" style={{ color: '#060C18' }}>
                      Comment
                    </label>
                    <textarea
                      value={taskForm.comment}
                      onChange={(e) => setTaskForm({ ...taskForm, comment: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                      setTaskForm({
                        name: '',
                        description: '',
                        reset_after: '',
                        total: '',
                        opening_time: '',
                        closing_time: '',
                        comment: '',
                        activity_id: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {loading ? 'Saving...' : (editingTask ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#DD6A1A' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;