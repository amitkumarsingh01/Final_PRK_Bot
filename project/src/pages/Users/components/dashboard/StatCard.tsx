import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: {
    value: number;
    increased: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color,
  change 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-semibold text-[#000435]">{value}</p>
            
            {change && (
              <span className={`ml-2 text-xs font-medium ${
                change.increased ? 'text-green-500' : 'text-red-500'
              }`}>
                {change.increased ? '+' : '-'}{change.value}%
              </span>
            )}
          </div>
        </div>
        
        <div
          className={`p-3 rounded-full flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
