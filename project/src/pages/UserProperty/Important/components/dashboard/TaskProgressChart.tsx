import React from 'react';

interface TaskProgressChartProps {
  completed: number;
  pending: number;
}

const TaskProgressChart: React.FC<TaskProgressChartProps> = ({ completed, pending }) => {
  const total = completed + pending;
  const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPercentage = 100 - completedPercentage;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Task Progress</h3>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-[#000435]">{completedPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#E06002] to-[#FB7E03]" 
            style={{ width: `${completedPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Completed</p>
          <div className="flex items-center mt-1">
            <span className="text-xl font-semibold text-green-600">{completed}</span>
            <span className="ml-1 text-xs text-gray-500">tasks</span>
          </div>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <div className="flex items-center mt-1">
            <span className="text-xl font-semibold text-amber-600">{pending}</span>
            <span className="ml-1 text-xs text-gray-500">tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressChart;