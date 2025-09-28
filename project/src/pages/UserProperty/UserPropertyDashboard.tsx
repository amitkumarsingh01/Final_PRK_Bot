import React from 'react';
import { Building, FileText, Calendar, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserPropertyDashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Daily Reports',
      value: '12',
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      color: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Monthly Tasks',
      value: '8',
      icon: <Calendar className="h-8 w-8 text-green-500" />,
      color: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Week Tasks',
      value: '24',
      icon: <Calendar className="h-8 w-8 text-purple-500" />,
      color: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Incident Reports',
      value: '3',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      color: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Updated Daily Report', time: '2 hours ago', type: 'report' },
    { id: 2, action: 'Completed Monthly Task', time: '4 hours ago', type: 'task' },
    { id: 3, action: 'Submitted Incident Report', time: '1 day ago', type: 'incident' },
    { id: 4, action: 'Updated Week Calendar', time: '2 days ago', type: 'calendar' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property User Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your property tasks.</p>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Building size={24} />
            <span className="text-sm font-medium">Property User Panel</span>
          </div>
        </div>
      </div>

      {/* Property Display */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Building className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Property</h2>
        </div>
        <div className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
          {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/user-property/daily-reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Daily Reports</p>
                <p className="text-sm text-gray-500">View and edit daily work details</p>
              </div>
            </a>
            <a
              href="/user-property/monthly-task-management"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Monthly Tasks</p>
                <p className="text-sm text-gray-500">Manage monthly checklist</p>
              </div>
            </a>
            <a
              href="/user-property/incident-report"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Incident Reports</p>
                <p className="text-sm text-gray-500">View and edit incident reports</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPropertyDashboard;
