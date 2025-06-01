import React, { useState, useEffect } from 'react';
import { Plus, Edit, Delete, Check, Play, Pause, RotateCcw, ChevronDown, ChevronRight, X, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const API_BASE_URL = 'https://server.prktechindia.in';

// Add Property interface
interface Property {
  id: string;
  name: string;
  title: string;
  description: string;
  logo_base64: string;
}

// API service functions
const api = {
  // Property CRUD
  getProperties: (token?: string): Promise<Property[]> => 
    fetch(`${API_BASE_URL}/properties`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => res.json()),

  // Activity CRUD - Modified to fetch all activities and filter client-side
  getActivities: (propertyId?: string, token?: string): Promise<Activity[]> => {
    // Fetch all activities since backend filtering isn't working properly
    return fetch(`${API_BASE_URL}/activities`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    .then(res => res.json())
    .then((activities: Activity[]) => {
      // Filter activities by property_id on the client side
      if (propertyId) {
        return activities.filter(activity => activity.property_id === propertyId);
      }
      return activities;
    });
  },
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

  // Task CRUD - Modified to fetch all tasks and filter client-side
  getTasks: (): Promise<Task[]> => fetch(`${API_BASE_URL}/tasks`).then(res => res.json()),
  getTask: (id: string): Promise<Task> => fetch(`${API_BASE_URL}/tasks/${id}`).then(res => res.json()),
  getActivityTasks: (activityId: string, propertyId: string): Promise<Task[]> => {
    // Fetch all tasks and filter by both activity_id and property_id
    return fetch(`${API_BASE_URL}/tasks`)
      .then(res => res.json())
      .then((tasks: Task[]) => {
        return tasks.filter(task => 
          task.activity_id === activityId && task.property_id === propertyId
        );
      });
  },
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
  property_id: string;
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
  property_id: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // Add property states
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>('');

  // Activity form state
  const [activityForm, setActivityForm] = useState<{
    name: string;
    description: string;
    user_role: string;
    user_type: string;
    property_id: string;
  }>({
    name: '',
    description: '',
    user_role: '',
    user_type: 'user',
    property_id: ''
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
    property_id: string;
  }>({
    name: '',
    description: '',
    reset_after: '',
    total: '',
    opening_time: '',
    closing_time: '',
    comment: '',
    activity_id: '',
    property_id: ''
  });

  // Add property fetching
  const fetchProperties = async () => {
    try {
      const data = await api.getProperties(user?.token || undefined);
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user?.token]);

  // Reset all states when property changes
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setExpandedActivities(new Set());
    setActivities([]);
    setTasks([]);
    setSelectedActivity(null);
    setEditingActivity(null);
    setEditingTask(null);
    
    // Set property name for display
    const selectedProperty = properties.find(p => p.id === propertyId);
    setSelectedPropertyName(selectedProperty ? `${selectedProperty.name} - ${selectedProperty.title}` : '');
  };

  // Modified loadActivities to handle client-side filtering
  const loadActivities = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      console.log('Loading activities for property:', selectedPropertyId);
      const data: Activity[] = await api.getActivities(selectedPropertyId, user?.token || undefined);
      console.log('Filtered activities:', data);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add effect to reload activities when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      loadActivities();
    }
  }, [selectedPropertyId, user?.token]);

  const loadActivityTasks = async (activityId: string): Promise<Task[]> => {
    if (!selectedPropertyId) return [];
    
    try {
      console.log('Loading tasks for activity:', activityId, 'property:', selectedPropertyId);
      const data: Task[] = await api.getActivityTasks(activityId, selectedPropertyId);
      console.log('Filtered tasks:', data);
      return data;
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      alert('Please select a property first');
      return;
    }
    
    setLoading(true);
    try {
      const activityData = {
        ...activityForm,
        property_id: selectedPropertyId,
        user_type: 'user'
      };
      
      if (editingActivity) {
        await api.updateActivity(editingActivity.id, activityData);
      } else {
        await api.createActivity(activityData);
      }
      setShowActivityForm(false);
      setEditingActivity(null);
      setActivityForm({ 
        name: '', 
        description: '', 
        user_role: '', 
        user_type: 'user',
        property_id: '' 
      });
      loadActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      alert('Please select a property first');
      return;
    }
    
    setLoading(true);
    try {
      const taskData = {
        ...taskForm,
        total: parseInt(taskForm.total) || 0,
        reset_after: taskForm.reset_after ? parseInt(taskForm.reset_after) : null,
        property_id: selectedPropertyId
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
        activity_id: '',
        property_id: ''
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
      user_type: activity.user_type || '',
      property_id: activity.property_id
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
      activity_id: task.activity_id,
      property_id: task.property_id
    });
    setShowTaskForm(true);
  };

  const openCreateTask = (activityId: string) => {
    if (!selectedPropertyId) {
      alert('Please select a property first');
      return;
    }
    
    setEditingTask(null);
    setTaskForm({
      name: '',
      description: '',
      reset_after: '',
      total: '',
      opening_time: '',
      closing_time: '',
      comment: '',
      activity_id: activityId,
      property_id: selectedPropertyId
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
    <div className="min-h-screen p-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#060C18' }}>
              Task Management
            </h1>
            {selectedPropertyName && (
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                Current Property: {selectedPropertyName}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (!selectedPropertyId) {
                alert('Please select a property first');
                return;
              }
              setShowActivityForm(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#DD6A1A' }}
          >
            <Plus size={20} />
            <span>New Activity</span>
          </button>
        </div>

        {/* Property Selection */}
        <div className="mb-6">
          <label htmlFor="propertySelect" className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
            Select Property
          </label>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" style={{ color: '#6B7280' }} />
            <select
              id="propertySelect"
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="flex-1 max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
            >
              <option value="">Select a property...</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.title}
                </option>
              ))}
            </select>
          </div>
          {selectedPropertyId && (
            <p className="text-xs mt-1 text-blue-600">
              Debug: Selected Property ID: {selectedPropertyId}
            </p>
          )}
        </div>

        {/* Activities List */}
        {!selectedPropertyId ? (
          <div className="text-center py-12">
            <Building size={48} style={{ color: '#6B7280' }} className="mx-auto mb-4" />
            <p className="text-lg" style={{ color: '#6B7280' }}>
              Please select a property to view tasks
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: '#6B7280' }}>
              No activities found for this property. Create your first activity!
            </p>
            <p className="text-xs mt-2 text-blue-600">
              Debug: Looking for activities with property_id: {selectedPropertyId}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
              >
                <div
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => toggleActivityExpanded(activity.id)}
                >
                  <div className="flex items-center">
                    {expandedActivities.has(activity.id) ? (
                      <ChevronDown className="w-5 h-5 mr-3" style={{ color: '#060C18' }} />
                    ) : (
                      <ChevronRight className="w-5 h-5 mr-3" style={{ color: '#060C18' }} />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: '#060C18' }}>{activity.name}</h3>
                      {activity.description && (
                        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{activity.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2">
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                          Total: {activity.total_tasks}
                        </span>
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                          Active: {activity.active_tasks}
                        </span>
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                          Default: {activity.default_tasks}
                        </span>
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                          Completed: {activity.completed_tasks}
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-blue-600">
                        Debug: Activity Property ID: {activity.property_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateTask(activity.id);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#DD6A1A' }}
                      title="Add Task"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditActivity(activity);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#DB7723' }}
                      title="Edit Activity"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActivity(activity.id);
                      }}
                      className="flex items-center justify-center p-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#DF5F0D' }}
                      title="Delete Activity"
                    >
                      <Delete size={16} />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                {expandedActivities.has(activity.id) && activity.tasks && (
                  <div className="p-6 bg-gray-50">
                    {activity.tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-lg" style={{ color: '#6B7280' }}>
                          No tasks yet. Create your first task!
                        </p>
                        <p className="text-xs mt-2 text-blue-600">
                          Debug: Looking for tasks with activity_id: {activity.id} and property_id: {selectedPropertyId}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activity.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                              task.completed ? 'opacity-75' : ''
                            }`}
                            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h4 className={`font-semibold ${task.completed ? 'line-through' : ''}`} style={{ color: '#060C18' }}>
                                  {task.name}
                                </h4>
                                <div className="flex space-x-2">
                                  {!task.completed && (
                                    <button
                                      onClick={() => handleCompleteTask(task.id)}
                                      className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                                      style={{ backgroundColor: '#DD6A1A' }}
                                      title="Complete task"
                                    >
                                      <Check size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSetTaskActive(task)}
                                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: task.active ? '#DB7723' : '#F88024' }}
                                    title="Set Active"
                                  >
                                    <Play size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleSetTaskDefault(task)}
                                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: task.default ? '#DB7723' : '#F88024' }}
                                    title="Set Default"
                                  >
                                    D
                                  </button>
                                  <button
                                    onClick={() => handleSetTaskReset(task)}
                                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: task.reset ? '#DB7723' : '#F88024' }}
                                    title="Set Reset"
                                  >
                                    R
                                  </button>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-sm" style={{ color: '#6B7280' }}>{task.description}</p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {(task.total ?? 0) > 0 && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                                    Total: {task.total}
                                  </span>
                                )}
                                {task.reset_after && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                                    Reset: {task.reset_after}h
                                  </span>
                                )}
                                {task.opening_time && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                                    Opens: {new Date(task.opening_time).toLocaleString()}
                                  </span>
                                )}
                                {task.closing_time && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#060C18' }}>
                                    Closes: {new Date(task.closing_time).toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {task.comment && (
                                <p className="text-sm italic" style={{ color: '#DB7723' }}>
                                  {task.comment}
                                </p>
                              )}

                              <p className="text-xs text-blue-600">
                                Debug: Task Property ID: {task.property_id}
                              </p>

                              <div className="flex space-x-2 pt-2">
                                <button
                                  onClick={() => handleResetTask(task.id)}
                                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: '#DF5F0D' }}
                                >
                                  <RotateCcw size={14} />
                                  <span>Reset</span>
                                </button>
                                <button
                                  onClick={() => openEditTask(task)}
                                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: '#DB7723' }}
                                >
                                  <Edit size={14} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: '#DF5F0D' }}
                                >
                                  <Delete size={14} />
                                  <span>Delete</span>
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
        )}

        {/* Activity Form Modal */}
        {showActivityForm && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#060C18' }}>
                  {editingActivity ? 'Edit Activity' : 'Create Activity'}
                </h2>
                <button
                  onClick={() => {
                    setShowActivityForm(false);
                    setEditingActivity(null);
                    setActivityForm({ name: '', description: '', user_role: '', user_type: 'user', property_id: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleActivitySubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Description
                    </label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      User Role *
                    </label>
                    <select
                      required
                      value={activityForm.user_role}
                      onChange={(e) => setActivityForm({ ...activityForm, user_role: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    >
                      <option value="">Select a role...</option>
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {loading ? 'Saving...' : (editingActivity ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityForm(false);
                      setEditingActivity(null);
                      setActivityForm({ name: '', description: '', user_role: '', user_type: 'user', property_id: '' });
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors"
                    style={{ 
                      backgroundColor: '#F3F4F6',
                      color: '#060C18'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#060C18' }}>
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <button
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
                      activity_id: '',
                      property_id: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleTaskSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={taskForm.name}
                      onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Total
                    </label>
                    <input
                      type="number"
                      value={taskForm.total}
                      onChange={(e) => setTaskForm({ ...taskForm, total: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Reset After (hours)
                    </label>
                    <input
                      type="number"
                      value={taskForm.reset_after}
                      onChange={(e) => setTaskForm({ ...taskForm, reset_after: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Opening Time
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.opening_time}
                      onChange={(e) => setTaskForm({ ...taskForm, opening_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Closing Time
                    </label>
                    <input
                      type="datetime-local"
                      value={taskForm.closing_time}
                      onChange={(e) => setTaskForm({ ...taskForm, closing_time: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#060C18' }}>
                      Comment
                    </label>
                    <textarea
                      value={taskForm.comment}
                      onChange={(e) => setTaskForm({ ...taskForm, comment: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DD6A1A] focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#DD6A1A' }}
                  >
                    {loading ? 'Saving...' : (editingTask ? 'Update' : 'Create')}
                  </button>
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
                        activity_id: '',
                        property_id: ''
                      });
                    }}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold transition-colors"
                    style={{ 
                      backgroundColor: '#F3F4F6',
                      color: '#060C18'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#DD6A1A' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;