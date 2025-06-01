import React, { useState, useEffect } from 'react';
import { Edit, Check, Play, RotateCcw, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'https://server.prktechindia.in';

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

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
}

const UserTasks: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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

  // Fetch user profile to get property_id and user_role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.userId) {
        try {
          const response = await fetch('https://server.prktechindia.in/profile', {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          const data = await response.json();
          const currentUserProfile = data.find((profile: UserProfile) => profile.user_id === user.userId);
          if (currentUserProfile) {
            setUserProfile(currentUserProfile);
            // Load activities after getting user profile
            loadActivities(currentUserProfile.property_id, currentUserProfile.user_role);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Load activities filtered by user role
  const loadActivities = async (propertyId: string, userRole: string) => {
    if (!propertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/activities`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data: Activity[] = await response.json();
      // Filter activities by property_id and user_role
      const filteredActivities = data.filter(activity => 
        activity.property_id === propertyId && 
        activity.user_role === userRole
      );
      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityTasks = async (activityId: string): Promise<Task[]> => {
    if (!userProfile?.property_id) return [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const data: Task[] = await response.json();
      return data.filter(task => 
        task.activity_id === activityId && 
        task.property_id === userProfile.property_id
      );
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.property_id || !editingTask) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          ...taskForm,
          total: parseInt(taskForm.total) || 0,
          reset_after: taskForm.reset_after ? parseInt(taskForm.reset_after) : null,
          property_id: userProfile.property_id
        })
      });
      
      if (response.ok) {
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
        loadActivities(userProfile.property_id, userProfile.user_role);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    if (!userProfile) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/tasks/${id}/complete`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      loadActivities(userProfile.property_id, userProfile.user_role);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskActive = async (id: string) => {
    if (!userProfile) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/tasks/${id}/activate`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      loadActivities(userProfile.property_id, userProfile.user_role);
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTask = async (id: string) => {
    if (!userProfile) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/tasks/${id}/reset`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      loadActivities(userProfile.property_id, userProfile.user_role);
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
      const tasks = await loadActivityTasks(activityId);
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === activityId ? { ...activity, tasks } : activity
        )
      );
    }
    setExpandedActivities(newExpanded);
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

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#060C18' }}>
              Task Management
            </h1>
            {userProfile && (
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                User Role: {userProfile.user_role}
              </p>
            )}
          </div>
        </div>

        {/* Activities List */}
        {!userProfile ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: '#6B7280' }}>
              Loading user profile...
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: '#6B7280' }}>
              No activities found for your role.
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
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                {expandedActivities.has(activity.id) && activity.tasks && (
                  <div className="p-6 bg-gray-50">
                    {activity.tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-lg" style={{ color: '#6B7280' }}>
                          No tasks available.
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
                                    onClick={() => handleToggleTaskActive(task.id)}
                                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: task.active ? '#DB7723' : '#F88024' }}
                                    title="Set Active"
                                  >
                                    <Play size={14} />
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

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: '#060C18' }}>
                  Edit Task
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
                    {loading ? 'Saving...' : 'Update'}
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

export default UserTasks;