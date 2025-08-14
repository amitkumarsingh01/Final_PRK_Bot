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
        user_name: "Suni Verma",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        task_name: "Check electrical panels",
        status: TaskStatus.ACTIVE,
        user_name: "Ankit Kumar",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 3,
        task_name: "Inspect fire extinguishers",
        status: TaskStatus.COMPLETE,
        user_name: "Rajesh Yadav",
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
      
      {/* Best Employee of the Month */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-sm border border-yellow-200 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🌟</span>
            <h3 className="text-xl font-bold text-gray-800">Best Employee of the Month</h3>
            <span className="text-2xl ml-2">🌟</span>
          </div>
          <p className="text-sm text-gray-600 italic">"Recognizing Excellence, Inspiring Performance"</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-2">🏅</span>
              Awarded To:
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="text-gray-800">Rajesh Kumar Singh</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Department:</span>
                <span className="text-gray-800">Security</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Designation:</span>
                <span className="text-gray-800">Security Supervisor</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Site/Location:</span>
                <span className="text-gray-800">Tech Park - Block A</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Month:</span>
                <span className="text-gray-800">January 2025</span>
              </div>
            </div>
          </div>
          
          {/* Selection Criteria */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-xl mr-2">🔍</span>
              Selection Criteria
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm font-medium text-gray-700">Attendance & Punctuality</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ 100%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-sm font-medium text-gray-700">Job Knowledge & SOP Adherence</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✅ 95%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                <span className="text-sm font-medium text-gray-700">Grooming & Personal Hygiene</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">✅ 98%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-sm font-medium text-gray-700">Attitude & Teamwork</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">✅ 92%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-sm font-medium text-gray-700">Safety & Incident Handling</span>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">✅ 100%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-indigo-50 rounded">
                <span className="text-sm font-medium text-gray-700">Client & Supervisor Feedback</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">✅ 96%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-pink-50 rounded">
                <span className="text-sm font-medium text-gray-700">Initiative & Proactiveness</span>
                <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">✅ 94%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Documentation & Reporting</span>
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">✅ 97%</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
              <div className="text-center">
                <span className="text-lg font-bold text-gray-800">Overall Score: 96.5%</span>
                <p className="text-xs text-gray-600 mt-1">Outstanding Performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emergency Contact Details */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🚨</span>
            <h3 className="text-xl font-bold text-gray-800">Emergency Contact Details</h3>
            <span className="text-2xl ml-2">🚨</span>
          </div>
          <p className="text-sm text-gray-600 italic">"Quick Response Saves Lives"</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🆘 Emergency Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📞 Contact Person / Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📱 Phone Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📍 Location / Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">🔥</span>
                    <span className="text-sm font-medium text-gray-900">Fire Emergency</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Fire Control Room / Local Fire Station
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    101 / 98765-43210
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    On-site fire panel / Extinguisher zone
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">🚑</span>
                    <span className="text-sm font-medium text-gray-900">Medical Emergency</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Site Paramedic / Ambulance Service
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    102 / 98765-43211
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    First aid room / Nearby hospital
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">👮</span>
                    <span className="text-sm font-medium text-gray-900">Security Emergency</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Security Control Room / Site In-charge
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43212
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Guard room / CCTV monitoring room
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">⚡</span>
                    <span className="text-sm font-medium text-gray-900">Electrical Emergency</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Facility Electrician / Maintenance Lead
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43213
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Main electrical panel
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">💧</span>
                    <span className="text-sm font-medium text-gray-900">Plumbing/Water Leakage</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Facility Plumber / Utility Desk
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43214
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Basement, restrooms, pantry areas
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">📵</span>
                    <span className="text-sm font-medium text-gray-900">IT/Communication Failure</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    IT Admin / Service Desk
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43215
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Server room or Communication panel
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">🚨</span>
                    <span className="text-sm font-medium text-gray-900">Panic / SOS Alert</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Emergency Coordinator / Security Officer
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43216
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Escalate to HOD/Site Head immediately
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">☣️</span>
                    <span className="text-sm font-medium text-gray-900">Chemical Spill/HAZMAT</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Safety Officer / Facility Safety Head
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43217
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Use chemical spill kit
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">📍</span>
                    <span className="text-sm font-medium text-gray-900">Nearest Police Station</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Central Police Station
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    100 / 98765-43218
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    123 Main Street, City Center
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">📍</span>
                    <span className="text-sm font-medium text-gray-900">Nearest Hospital</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    City General Hospital
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43219
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    456 Health Avenue, Medical District
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg mr-2">📞</span>
                    <span className="text-sm font-medium text-gray-900">PRKTech FMS Support</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    Tech/Admin Support Team
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    98765-43220
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    For technical emergency on the platform
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Emergency Response Team (ERT) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">🚨</span>
            <h3 className="text-xl font-bold text-gray-800">Emergency Response Team (ERT)</h3>
            <span className="text-2xl ml-2">🚨</span>
          </div>
          <p className="text-sm text-gray-600 italic">"Prepared. Alert. Responsive."</p>
        </div>
        
        {/* ERT Organizational Structure */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-xl mr-2">🧩</span>
            ERT Organizational Structure
          </h4>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🧑‍💼 Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🛠️ Responsibility
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📞 Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ERT Leader / Site Head
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Oversees the entire emergency response process, final decision-making
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43221
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Safety Officer / HSE Lead
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Safety assessments, PPE compliance, leads evacuation, handles chemical/fire issues
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43222
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Security In-Charge
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Manages perimeter security, access control, lockdown protocols
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43223
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      First Aid Officer
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Immediate medical aid, coordinates with ambulance/hospital
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43224
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Electrical/Utility Lead
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Handles power shutdowns, controls hazardous utilities (electrical/water/gas)
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43225
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Communication Officer
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Maintains internal communication, alerts client & PRKTech management
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43226
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Floor Wardens / Marshals
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Guides employees during evacuation, does headcount, checks washrooms, staircases
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43227
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Fire Response Lead
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Operates fire panels, extinguishers, assists fire dept
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43228
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Documentation Officer
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      Maintains incident log, timeline, photos, investigation reports
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      98765-43229
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Escalation Levels */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-xl mr-2">🧭</span>
            Escalation Levels and Timeframe
          </h4>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⚙️ Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      👤 Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⏱️ Response Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📞 Contact Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📝 Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">L1</td>
                    <td className="px-4 py-3 text-sm text-gray-900">On-Duty Supervisor / Shift In-charge</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Within 15 minutes</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Call / WhatsApp / App Log</td>
                    <td className="px-4 py-3 text-sm text-gray-900">First point of response</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">L2</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Department Head (Facility/Security)</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Within 30 minutes</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Call / App escalation</td>
                    <td className="px-4 py-3 text-sm text-gray-900">If unresolved by L1</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">L3</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Site Manager / Admin Manager</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Within 1 hour</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Call / Email</td>
                    <td className="px-4 py-3 text-sm text-gray-900">For priority or client-impacting issues</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">L4</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Operations Head / Area Manager</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Within 2 hours</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Email / Conference call</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Regional-level problem-solving</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">L5</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Director - Operations / CXO Level</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Same day (as required)</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Email / App escalation</td>
                    <td className="px-4 py-3 text-sm text-gray-900">Only for major, legal, or client-level escalation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Safety PPE Guidelines */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-xl mr-2">🧰</span>
            Safety PPE Guidelines
          </h4>
          <p className="text-sm text-gray-600 italic mb-4">"Right Gear. Right Job. Every Time."</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mandatory PPE */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="text-md font-semibold text-gray-800 mb-3">🧍 Mandatory Personal Protective Equipment (PPE):</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🪖</span>
                    <span className="text-sm font-medium text-gray-700">Safety Helmet</span>
                  </div>
                  <span className="text-xs text-gray-600">Construction sites, warehouse, plant</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🥽</span>
                    <span className="text-sm font-medium text-gray-700">Safety Goggles</span>
                  </div>
                  <span className="text-xs text-gray-600">Cleaning, welding, mechanical work</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">😷</span>
                    <span className="text-sm font-medium text-gray-700">Face Mask / Respirator</span>
                  </div>
                  <span className="text-xs text-gray-600">Cleaning, painting, close public areas</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🎧</span>
                    <span className="text-sm font-medium text-gray-700">Ear Protection</span>
                  </div>
                  <span className="text-xs text-gray-600">Machine rooms, near heavy equipment</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🧤</span>
                    <span className="text-sm font-medium text-gray-700">Safety Gloves</span>
                  </div>
                  <span className="text-xs text-gray-600">Electrical, housekeeping, material handling</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-indigo-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">👷‍♂️</span>
                    <span className="text-sm font-medium text-gray-700">High-Visibility Vest</span>
                  </div>
                  <span className="text-xs text-gray-600">Outdoor, logistics, traffic areas</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-pink-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">👢</span>
                    <span className="text-sm font-medium text-gray-700">Safety Shoes</span>
                  </div>
                  <span className="text-xs text-gray-600">All work areas</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🧥</span>
                    <span className="text-sm font-medium text-gray-700">Protective Suit / Apron</span>
                  </div>
                  <span className="text-xs text-gray-600">Disinfection, chemical handling</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">🧯</span>
                    <span className="text-sm font-medium text-gray-700">Fire Retardant Gear</span>
                  </div>
                  <span className="text-xs text-gray-600">Electrical, boiler, generator areas</span>
                </div>
              </div>
            </div>
            
            {/* Employee Responsibilities */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h5 className="text-md font-semibold text-gray-800 mb-3">✅ Employee Responsibilities</h5>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-700">Wear assigned PPE at all times in designated zones</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-700">Inspect PPE before use – report any damage</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-700">Replace PPE as per safety standards and supervisor's instruction</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-700">Attend regular PPE training sessions</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-bold text-red-800 text-center">⚠️ "No PPE = No Work Entry"</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-bold text-blue-800 text-center">🛡️ Safety is not optional — it's your first tool at work.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Safety Pledge */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <div className="text-center mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">🛡️ Employee Safety Pledge 🛡️</h4>
            <p className="text-md font-semibold text-gray-700">"My Safety, My Responsibility"</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-800 mb-3">I pledge to:</p>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Follow all safety rules, guidelines, and standard operating procedures.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Wear all necessary personal protective equipment (PPE) at all times.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Report any unsafe conditions, incidents, or near-misses immediately.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Encourage my teammates to stay alert and follow safety protocols.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Never take shortcuts that compromise health and safety.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Stay physically and mentally fit for duty every day.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Cooperate fully during drills, audits, and emergency procedures.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Keep my work area clean, hazard-free, and organized.</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✅</span>
                <span className="text-sm text-gray-700">Commit to zero harm — to myself, my coworkers, and the environment.</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
              <p className="text-sm font-bold text-gray-800 text-center italic">
                "Because every safe action today ensures we return home healthy tomorrow."
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm font-bold text-gray-700">🚶‍♂️ Be Alert. Be Safe. Be Responsible. 🚶‍♀️</p>
            </div>
          </div>
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