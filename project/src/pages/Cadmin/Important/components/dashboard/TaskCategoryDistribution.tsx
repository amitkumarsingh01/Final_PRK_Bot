import React from 'react';

interface CategoryData {
  name: string;
  count: number;
  color: string;
}

const TaskCategoryDistribution: React.FC = () => {
  // Mock data - in a real app, this would come from API
  const categories: CategoryData[] = [
    { name: 'Housekeeping', count: 24, color: 'bg-blue-500' },
    { name: 'Electrical', count: 18, color: 'bg-yellow-500' },
    { name: 'Plumbing', count: 12, color: 'bg-green-500' },
    { name: 'Security', count: 9, color: 'bg-purple-500' },
    { name: 'Others', count: 15, color: 'bg-gray-500' }
  ];
  
  const total = categories.reduce((sum, category) => sum + category.count, 0);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Task Distribution by Category</h3>
      
      <div className="space-y-4">
        {categories.map((category) => {
          const percentage = Math.round((category.count / total) * 100);
          
          return (
            <div key={category.name}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">{category.name}</span>
                <span className="text-sm font-medium text-[#000435]">{percentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${category.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCategoryDistribution;