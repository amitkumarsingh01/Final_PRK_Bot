import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ActivityLog, TaskStatus } from '../../types';

interface ActivityFeedProps {
  activities: {
    id: number;
    task_name: string;
    status: TaskStatus;
    user_name: string;
    timestamp: string;
  }[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETE:
        return <CheckCircle size={18} className="text-green-500" />;
      case TaskStatus.ACTIVE:
        return <Clock size={18} className="text-amber-500" />;
      default:
        return <AlertCircle size={18} className="text-gray-500" />;
    }
  };
  
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETE:
        return 'completed';
      case TaskStatus.ACTIVE:
        return 'started';
      default:
        return 'updated';
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex">
              <div className="mr-3 mt-0.5">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{activity.user_name}</span>
                  {' '}{getStatusText(activity.status)}{' '}
                  <span className="font-medium">"{activity.task_name}"</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm text-[#E06002] hover:text-[#FB7E03] font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
