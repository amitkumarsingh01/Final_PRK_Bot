import React from 'react';
import { Users, Building2, CheckSquare, ClipboardCheck } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import TaskProgressChart from '../components/dashboard/TaskProgressChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import TaskCategoryDistribution from '../components/dashboard/TaskCategoryDistribution';
import { DashboardSummary, TaskStatus } from '../types';

const Dashboard: React.FC = () => {
  // Mock data - in a real app, this would come from API
  const dashboardData: DashboardSummary = {
    total_users: 45,
    total_companies: 5,
    total_tasks: 78,
    completed_tasks_today: 18,
    pending_tasks_today: 12,
    recent_activities: [
      {
        id: 1,
        task_name: "Clean main lobby",
        status: TaskStatus.COMPLETE,
        user_name: "John Smith",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        task_name: "Check electrical panels",
        status: TaskStatus.ACTIVE,
        user_name: "Michael Johnson",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 3,
        task_name: "Inspect fire extinguishers",
        status: TaskStatus.COMPLETE,
        user_name: "Sarah Williams",
        timestamp: new Date(Date.now() - 120 * 60000).toISOString()
      }
    ]
  };
  
  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-gradient-to-r from-[#000435] to-[#000655] text-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-2">Welcome to PRK Tech Dashboard</h2>
        <p className="opacity-80">Manage your properties, tasks, and teams efficiently</p>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={dashboardData.total_users} 
          icon={<Users size={20} className="text-white" />} 
          color="bg-blue-500"
          change={{ value: 12, increased: true }}
        />
        <StatCard 
          title="Properties" 
          value={dashboardData.total_companies} 
          icon={<Building2 size={20} className="text-white" />} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Total Tasks" 
          value={dashboardData.total_tasks} 
          icon={<CheckSquare size={20} className="text-white" />} 
          color="bg-[#E06002]"
          change={{ value: 8, increased: true }}
        />
        <StatCard 
          title="Completed Today" 
          value={dashboardData.completed_tasks_today} 
          icon={<ClipboardCheck size={20} className="text-white" />} 
          color="bg-green-500"
        />
      </div>
      
      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TaskProgressChart 
            completed={dashboardData.completed_tasks_today} 
            pending={dashboardData.pending_tasks_today} 
          />
        </div>
        <div className="lg:col-span-1">
          <TaskCategoryDistribution />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed activities={dashboardData.recent_activities} />
        </div>
      </div>
      
      {/* Quick actions panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Add New User', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { label: 'Create Task', color: 'bg-[#FFF3EB] text-[#E06002] hover:bg-orange-100' },
            { label: 'View Reports', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
            { label: 'Manage Property', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' }
          ].map((action, index) => (
            <button
              key={index}
              className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;