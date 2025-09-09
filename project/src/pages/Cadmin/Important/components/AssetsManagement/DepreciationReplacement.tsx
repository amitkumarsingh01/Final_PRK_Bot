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

interface DepreciationReplacement {
  id?: string;
  asset_report_id?: string;
  depreciation_id: string;
  asset_id: string;
  asset_name: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_rate?: number;
  depreciation_method: string;
  useful_life?: number;
  annual_depreciation: number;
  replacement_date: string;
  replacement_cost?: number;
  replacement_reason?: string;
  status: string;
  responsible_person: string;
  remarks: string;
}

interface AssetReport {
  id: string;
  property_id: string;
  depreciations: DepreciationReplacement[];
}

const API_URL = 'https://server.prktechindia.in/asset-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyDepreciationReplacement: DepreciationReplacement = {
  depreciation_id: '',
  asset_id: '',
  asset_name: '',
  purchase_date: '',
  purchase_cost: 0,
  current_value: 0,
  depreciation_rate: 0,
  depreciation_method: '',
  useful_life: 0,
  annual_depreciation: 0,
  replacement_date: '',
  replacement_cost: 0,
  replacement_reason: '',
  status: '',
  responsible_person: '',
  remarks: '',
};

const DepreciationReplacementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AssetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: DepreciationReplacement | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: DepreciationReplacement | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: DepreciationReplacement, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };
  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyDepreciationReplacement },
      reportId,
    });
  };
  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this depreciation record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.depreciations.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { depreciations: newArr });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };
  const handleView = (item: DepreciationReplacement) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: DepreciationReplacement[];
      if (editModal.isNew) {
        newArr = [...report.depreciations, editModal.item];
      } else {
        newArr = report.depreciations.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { depreciations: newArr });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Depreciation & Replacement</h2>
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
              <th className="px-3 py-2 border">Depreciation ID</th>
              <th className="px-3 py-2 border">Asset ID</th>
              <th className="px-3 py-2 border">Asset Name</th>
              <th className="px-3 py-2 border">Purchase Date</th>
              <th className="px-3 py-2 border">Purchase Cost</th>
              <th className="px-3 py-2 border">Current Value</th>
              <th className="px-3 py-2 border">Depreciation Method</th>
              <th className="px-3 py-2 border">Annual Depreciation</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Responsible Person</th>
              <th className="px-3 py-2 border">Remarks</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.depreciations.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.depreciation_id}</td>
                      <td className="border px-2 py-1">{item.asset_id}</td>
                      <td className="border px-2 py-1">{item.asset_name}</td>
                      <td className="border px-2 py-1">{item.purchase_date}</td>
                      <td className="border px-2 py-1">₹{item.purchase_cost.toLocaleString()}</td>
                      <td className="border px-2 py-1">₹{item.current_value.toLocaleString()}</td>
                      <td className="border px-2 py-1">{item.depreciation_method}</td>
                      <td className="border px-2 py-1">₹{item.annual_depreciation.toLocaleString()}</td>
                      <td className="border px-2 py-1">{item.status}</td>
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
          <Plus size={18} className="mr-2" /> Add Depreciation Record
        </button>
      )}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Depreciation Record
              </h3>
              <button
                onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="grid grid-cols-3 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Depreciation ID" value={editModal.item.depreciation_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, depreciation_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset ID" value={editModal.item.asset_id} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_id: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Asset Name" value={editModal.item.asset_name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, asset_name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Purchase Date" type="date" value={editModal.item.purchase_date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, purchase_date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Purchase Cost" type="number" value={editModal.item.purchase_cost} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, purchase_cost: parseFloat(e.target.value) || 0 } })} required />
                <input className="border rounded px-3 py-2" placeholder="Current Value" type="number" value={editModal.item.current_value} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, current_value: parseFloat(e.target.value) || 0 } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Annual Depreciation" type="number" value={editModal.item.annual_depreciation} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, annual_depreciation: parseFloat(e.target.value) || 0 } })} required />
                
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Depreciation Record Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Depreciation ID:</b> {viewModal.item.depreciation_id}</div>
              <div><b>Asset ID:</b> {viewModal.item.asset_id}</div>
              <div><b>Asset Name:</b> {viewModal.item.asset_name}</div>
              <div><b>Purchase Date:</b> {viewModal.item.purchase_date}</div>
              <div><b>Purchase Cost:</b> ₹{viewModal.item.purchase_cost.toLocaleString()}</div>
              <div><b>Current Value:</b> ₹{viewModal.item.current_value.toLocaleString()}</div>
              <div><b>Depreciation Method:</b> {viewModal.item.depreciation_method}</div>
              <div><b>Annual Depreciation:</b> ₹{viewModal.item.annual_depreciation.toLocaleString()}</div>
              <div><b>Status:</b> {viewModal.item.status}</div>
              <div><b>Responsible Person:</b> {viewModal.item.responsible_person}</div>
              <div><b>Remarks:</b> {viewModal.item.remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepreciationReplacementPage; 
