import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Save, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface MaintenanceSchedule {
  id?: string;
  asset_report_id?: string;
  maintenance_id: string;
  asset_id: string;
  asset_name: string;
  maintenance_type: string;
  scheduled_date: string;
  actual_date?: string;
  status: string;
  technician: string;
  cost: number;
  responsible_person: string;
  remarks: string;
}

interface AssetReport {
  id: string;
  property_id: string;
  maintenance_schedules: MaintenanceSchedule[];
}

const API_URL = 'https://server.prktechindia.in/asset-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyMaintenanceSchedule: MaintenanceSchedule = {
  maintenance_id: '',
  asset_id: '',
  asset_name: '',
  maintenance_type: '',
  scheduled_date: '',
  actual_date: '',
  status: '',
  technician: '',
  cost: 0,
  responsible_person: '',
  remarks: '',
};

const MaintenanceSchedulePage: React.FC = () => {
  console.log('🚀 MaintenanceSchedule: Component initialized');
  const { user } = useAuth();
  console.log('👤 MaintenanceSchedule: User loaded', { userId: user?.userId });
  const [data, setData] = useState<AssetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: MaintenanceSchedule | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: MaintenanceSchedule | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: MaintenanceSchedule, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyMaintenanceSchedule },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this maintenance schedule?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.maintenance_schedules.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { maintenance_schedules: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: MaintenanceSchedule) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: MaintenanceSchedule[];
      if (editModal.isNew) {
        newArr = [...report.maintenance_schedules, editModal.item];
      } else {
        newArr = report.maintenance_schedules.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { maintenance_schedules: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Maintenance Schedule</h2>
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
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ background: orange, color: '#fff' }}>
              <th className="px-3 py-2 border">Sl.No</th>
              <th className="px-3 py-2 border">Maintenance ID</th>
              <th className="px-3 py-2 border">Asset ID</th>
              <th className="px-3 py-2 border">Asset Name</th>
              <th className="px-3 py-2 border">Maintenance Type</th>
              <th className="px-3 py-2 border">Scheduled Date</th>
              <th className="px-3 py-2 border">Actual Date</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Technician</th>
              <th className="px-3 py-2 border">Cost</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.maintenance_schedules.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.maintenance_id}</td>
                      <td className="border px-2 py-1">{item.asset_id}</td>
                      <td className="border px-2 py-1">{item.asset_name}</td>
                      <td className="border px-2 py-1">{item.maintenance_type}</td>
                      <td className="border px-2 py-1">{item.scheduled_date}</td>
                      <td className="border px-2 py-1">{item.actual_date || '-'}</td>
                      <td className="border px-2 py-1">{item.status}</td>
                      <td className="border px-2 py-1">{item.technician}</td>
                      <td className="border px-2 py-1">₹{item.cost.toLocaleString()}</td>
                      <td className="border px-2 py-1">{item.responsible_person}</td>
                      <td className="border px-2 py-1">{item.remarks}</td>
                      <td className="border px-2 py-1 text-center">
                        <button onClick={() => handleView(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                        {isAdmin && (
                          <>
                            <button onClick={() => handleEdit(item, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                            <button onClick={() => handleDelete(item.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {isAdmin && data.length > 0 && (
        <button
          onClick={() => handleAdd(data[0].id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Maintenance Schedule
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Maintenance Schedule
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Maintenance ID" value={editModal.item.maintenance_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, maintenance_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset ID" value={editModal.item.asset_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset Name" value={editModal.item.asset_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Maintenance Type" value={editModal.item.maintenance_type} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, maintenance_type: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Scheduled Date" type="date" value={editModal.item.scheduled_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, scheduled_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Actual Date (Optional)" type="date" value={editModal.item.actual_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, actual_date: e.target.value } })} />
                <input className="border rounded px-3 py-2" placeholder="Status" value={editModal.item.status} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, status: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Technician" value={editModal.item.technician} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, technician: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Cost" type="number" value={editModal.item.cost} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, cost: parseFloat(e.target.value) } })} required />
                <input className="border rounded px-3 py-2" placeholder="Responsible Person" value={editModal.item.responsible_person} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, responsible_person: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Remarks" value={editModal.item.remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, remarks: e.target.value } })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Maintenance Schedule Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Maintenance ID:</b> {viewModal.item.maintenance_id}</div>
              <div><b>Asset ID:</b> {viewModal.item.asset_id}</div>
              <div><b>Asset Name:</b> {viewModal.item.asset_name}</div>
              <div><b>Maintenance Type:</b> {viewModal.item.maintenance_type}</div>
              <div><b>Scheduled Date:</b> {viewModal.item.scheduled_date}</div>
              <div><b>Actual Date:</b> {viewModal.item.actual_date || '-'}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Technician:</b> {viewModal.item.technician}</div>
              <div><b>Cost:</b> ₹{viewModal.item.cost.toLocaleString()}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceSchedulePage; 
