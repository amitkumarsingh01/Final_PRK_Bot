import React from 'react';
import { Bell, Menu, Search, User } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  title: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, title }) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between h-16 px-4 md:px-6">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 mr-2 rounded-full hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[#000435]">{title}</h1>
      </div>
      
      {/* <div className="hidden sm:flex items-center rounded-lg bg-gray-100 px-3 py-2 w-64 lg:w-96">
        <Search size={18} className="text-gray-500 mr-2" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none flex-1 text-sm text-gray-700 placeholder-gray-500"
        />
      </div> */}
      
      <div className="flex items-center space-x-3">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-700" />
          {/* <span className="absolute top-1 right-1 bg-[#E06002] rounded-full w-2 h-2"></span> */}
        </button>
        
        <div className="flex items-center cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#000435] text-white flex items-center justify-center">
            <User size={16} />
          </div>
          {/* <div className="ml-2 hidden md:block">
            <p className="text-sm font-medium text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TopBar;