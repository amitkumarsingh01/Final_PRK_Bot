import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


interface DepartmentTask {
  time: string;
  description: string;
  person_responsible: string;
  status: string;
}

interface Department {
  name: string;
  tasks: DepartmentTask[];
}

interface Summary {
  department: string;
  tasks_planned: number;
  completed: number;
  pending: number;
  remarks: string;
}

export interface DailySummaryReport {
  id?: string;
  property_id: string;
  date: string;
  site_name: string;
  prepared_by: string;
  shift: string;
  departments: Department[];
  summary: Summary[];
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'https://server.prktechindia.in/daily-summary/';

const orange = '#FB7E03';
const orangeDark = '#E06002';

const initialNewReport = (property_id: string): DailySummaryReport => ({
  property_id,
  date: new Date().toISOString().slice(0, 10),
  site_name: '',
  prepared_by: '',
  shift: '',
  departments: [],
  summary: [],
});

const CDailyManagementReport: React.FC = () => {
  console.log('🚀 DailyManagementReport: Component initialized');
  const { user } = useAuth();
  console.log('👤 DailyManagementReport: User loaded', { userId: user?.userId });
  const [reports, setReports] = useState<DailySummaryReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit' | 'view'; report: DailySummaryReport | null }>({ open: false, mode: 'add', report: null });
  const [editReport, setEditReport] = useState<DailySummaryReport | null>(null);
  const [saving, setSaving] = useState(false);


  // Fetch reports for user's property
  useEffect(() => {
    if (!user?.propertyId) return;
    setLoading(true);
    axios.get(API_URL + 'property/' + user.propertyId)
      .then(res => setReports(res.data))
      .catch(() => setError('Failed to fetch reports'))
      .finally(() => setLoading(false));
  }, [user?.propertyId]);

  // Handlers
  const handleAdd = () => {
    setEditReport(initialNewReport(user?.propertyId || ''));
    setModal({ open: true, mode: 'add', report: null });
  };

  const handleEdit = (report: DailySummaryReport) => {
    setEditReport({ ...report });
    setModal({ open: true, mode: 'edit', report });
  };

  const handleView = (report: DailySummaryReport) => {
    setModal({ open: true, mode: 'view', report });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this report?')) return;
    setLoading(true);
    try {
      await axios.delete(API_URL + id);
      setReports(reports.filter(r => r.id !== id));
    } catch {
      setError('Failed to delete report');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editReport) return;
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const res = await axios.post(API_URL, editReport);
        setReports([res.data, ...reports]);
      } else if (modal.mode === 'edit' && editReport.id) {
        const res = await axios.put(API_URL + editReport.id, editReport);
        setReports(reports.map(r => r.id === editReport.id ? res.data : r));
      }
      setModal({ open: false, mode: 'add', report: null });
      setEditReport(null);
    } catch {
      setError('Failed to save report');
    }
    setSaving(false);
  };

  // Form field handlers
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editReport) return;
    const { name, value } = e.target;
    setEditReport({ ...editReport, [name]: value });
  };

  // Department/Task/Summary handlers
  const handleDeptChange = (idx: number, field: keyof Department, value: any) => {
    if (!editReport) return;
    const departments = [...editReport.departments];
    departments[idx] = { ...departments[idx], [field]: value };
    setEditReport({ ...editReport, departments });
  };
  const handleDeptTaskChange = (deptIdx: number, taskIdx: number, field: keyof DepartmentTask, value: any) => {
    if (!editReport) return;
    const departments = [...editReport.departments];
    const tasks = [...departments[deptIdx].tasks];
    tasks[taskIdx] = { ...tasks[taskIdx], [field]: value };
    departments[deptIdx] = { ...departments[deptIdx], tasks };
    setEditReport({ ...editReport, departments });
  };
  const handleAddDept = () => {
    if (!editReport) return;
    setEditReport({ ...editReport, departments: [...editReport.departments, { name: '', tasks: [] }] });
  };
  const handleRemoveDept = (idx: number) => {
    if (!editReport) return;
    const departments = [...editReport.departments];
    departments.splice(idx, 1);
    setEditReport({ ...editReport, departments });
  };
  const handleAddTask = (deptIdx: number) => {
    if (!editReport) return;
    const departments = [...editReport.departments];
    const tasks = [...departments[deptIdx].tasks, { time: '', description: '', person_responsible: '', status: '' }];
    departments[deptIdx] = { ...departments[deptIdx], tasks };
    setEditReport({ ...editReport, departments });
  };
  const handleRemoveTask = (deptIdx: number, taskIdx: number) => {
    if (!editReport) return;
    const departments = [...editReport.departments];
    const tasks = [...departments[deptIdx].tasks];
    tasks.splice(taskIdx, 1);
    departments[deptIdx] = { ...departments[deptIdx], tasks };
    setEditReport({ ...editReport, departments });
  };
  // Summary handlers
  const handleSummaryChange = (idx: number, field: keyof Summary, value: any) => {
    if (!editReport) return;
    const summary = [...editReport.summary];
    summary[idx] = { ...summary[idx], [field]: value };
    setEditReport({ ...editReport, summary });
  };
  const handleAddSummary = () => {
    if (!editReport) return;
    setEditReport({ ...editReport, summary: [...editReport.summary, { department: '', tasks_planned: 0, completed: 0, pending: 0, remarks: '' }] });
  };
  const handleRemoveSummary = (idx: number) => {
    if (!editReport) return;
    const summary = [...editReport.summary];
    summary.splice(idx, 1);
    setEditReport({ ...editReport, summary });
  };


  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Daily Management Report</h2>
      {/* Property Display */}
      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100">
            {user?.propertyId ? 'Current Property' : 'No Property Assigned'}
          </div>
        </div>
      </div>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Prepared By</th>
              <th className="px-3 py-2 border">Shift</th>
              <th className="px-3 py-2 border">Departments</th>
              <th className="px-3 py-2 border">Summary</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {reports.map((report) => (
                  <tr key={report.id} style={{ background: '#fff' }}>
                    <td className="border px-2 py-1">{report.date}</td>
                    <td className="border px-2 py-1">{report.site_name}</td>
                    <td className="border px-2 py-1">{report.prepared_by}</td>
                    <td className="border px-2 py-1">{report.shift}</td>
                    <td className="border px-2 py-1">
                      {report.departments.map((d, i) => <div key={i}>{d.name}</div>)}
                    </td>
                    <td className="border px-2 py-1">
                      {report.summary.map((s, i) => <div key={i}>{s.department}: {s.completed}/{s.tasks_planned}</div>)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => handleView(report)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(report)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(report.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAdd}
        className="mt-4 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        disabled={!user?.propertyId}
      >
        <Plus size={18} className="mr-2" /> Add Report
      </button>

      {/* Modal for Add/Edit/View */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === 'add' ? 'Add Daily Summary Report' : modal.mode === 'edit' ? 'Edit Daily Summary Report' : 'View Daily Summary Report'}
              </h3>
              <button
                onClick={() => { setModal({ open: false, mode: 'add', report: null }); setEditReport(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            {(modal.mode === 'add' || modal.mode === 'edit') && editReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <DatePicker
                      selected={new Date(editReport.date)}
                      onChange={date => date && setEditReport({ ...editReport, date: date.toISOString().slice(0, 10) })}
                      dateFormat="yyyy-MM-dd"
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input
                      name="site_name"
                      value={editReport.site_name}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                    <input
                      name="prepared_by"
                      value={editReport.prepared_by}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                    <input
                      name="shift"
                      value={editReport.shift}
                      onChange={handleFieldChange}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>
                </div>
                {/* Departments */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Departments</label>
                    <button onClick={handleAddDept} className="text-green-600 flex items-center"><Plus size={16} className="mr-1" /> Add Department</button>
                  </div>
                  {editReport.departments.map((dept, deptIdx) => (
                    <div key={deptIdx} className="border rounded p-2 mb-2">
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          placeholder="Department Name"
                          value={dept.name}
                          onChange={e => handleDeptChange(deptIdx, 'name', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                        />
                        <button onClick={() => handleRemoveDept(deptIdx)} className="text-red-600"><Trash2 size={16} /></button>
                      </div>
                      <div className="mb-1 font-semibold">Tasks</div>
                      {dept.tasks.map((task, taskIdx) => (
                        <div key={taskIdx} className="flex gap-2 mb-1 items-center">
                          <input
                            placeholder="Time"
                            value={task.time}
                            onChange={e => handleDeptTaskChange(deptIdx, taskIdx, 'time', e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-24"
                          />
                          <input
                            placeholder="Description"
                            value={task.description}
                            onChange={e => handleDeptTaskChange(deptIdx, taskIdx, 'description', e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                          />
                          <input
                            placeholder="Person Responsible"
                            value={task.person_responsible}
                            onChange={e => handleDeptTaskChange(deptIdx, taskIdx, 'person_responsible', e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-40"
                          />
                          <input
                            placeholder="Status"
                            value={task.status}
                            onChange={e => handleDeptTaskChange(deptIdx, taskIdx, 'status', e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 w-24"
                          />
                          <button onClick={() => handleRemoveTask(deptIdx, taskIdx)} className="text-red-600"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => handleAddTask(deptIdx)} className="text-blue-600 flex items-center mt-1"><Plus size={14} className="mr-1" /> Add Task</button>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Summary</label>
                    <button onClick={handleAddSummary} className="text-green-600 flex items-center"><Plus size={16} className="mr-1" /> Add Summary</button>
                  </div>
                  {editReport.summary.map((sum, sumIdx) => (
                    <div key={sumIdx} className="border rounded p-2 mb-2 flex gap-2 items-center">
                      <input
                        placeholder="Department"
                        value={sum.department}
                        onChange={e => handleSummaryChange(sumIdx, 'department', e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 w-40"
                      />
                      <input
                        type="number"
                        placeholder="Tasks Planned"
                        value={sum.tasks_planned}
                        onChange={e => handleSummaryChange(sumIdx, 'tasks_planned', Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-32"
                      />
                      <input
                        type="number"
                        placeholder="Completed"
                        value={sum.completed}
                        onChange={e => handleSummaryChange(sumIdx, 'completed', Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-32"
                      />
                      <input
                        type="number"
                        placeholder="Pending"
                        value={sum.pending}
                        onChange={e => handleSummaryChange(sumIdx, 'pending', Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-32"
                      />
                      <input
                        placeholder="Remarks"
                        value={sum.remarks}
                        onChange={e => handleSummaryChange(sumIdx, 'remarks', e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 flex-1"
                      />
                      <button onClick={() => handleRemoveSummary(sumIdx)} className="text-red-600"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                    disabled={saving}
                  >
                    <Save size={18} className="inline mr-1" /> Save
                  </button>
                  <button
                    onClick={() => { setModal({ open: false, mode: 'add', report: null }); setEditReport(null); }}
                    className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {modal.mode === 'view' && modal.report && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Date:</strong> {modal.report.date}</div>
                  <div><strong>Site Name:</strong> {modal.report.site_name}</div>
                  <div><strong>Prepared By:</strong> {modal.report.prepared_by}</div>
                  <div><strong>Shift:</strong> {modal.report.shift}</div>
                </div>
                <div>
                  <strong>Departments:</strong>
                  {modal.report.departments.map((dept, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div className="font-semibold mb-1">{dept.name}</div>
                      <div>
                        {dept.tasks.map((task, j) => (
                          <div key={j} className="ml-2 text-sm">
                            <span className="font-medium">{task.time}</span> - {task.description} (<span className="italic">{task.person_responsible}</span>) [{task.status}]
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <strong>Summary:</strong>
                  {modal.report.summary.map((sum, i) => (
                    <div key={i} className="border rounded p-2 mb-2">
                      <div><strong>Department:</strong> {sum.department}</div>
                      <div><strong>Tasks Planned:</strong> {sum.tasks_planned}</div>
                      <div><strong>Completed:</strong> {sum.completed}</div>
                      <div><strong>Pending:</strong> {sum.pending}</div>
                      <div><strong>Remarks:</strong> {sum.remarks}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CDailyManagementReport;
