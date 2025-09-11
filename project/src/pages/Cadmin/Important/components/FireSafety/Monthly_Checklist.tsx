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

interface MonthlyChecklist {
  id?: string;
  report_id?: string;
  Checklist_ID: string;
  Site_Name: string;
  Date: string;
  Inspector: string;
  Equipment_Area_Checked: string;
  Status: string;
  Issues_Found: string;
  Corrective_Actions: string;
  Remarks: string;
}

interface FireSafetyReport {
  id: string;
  property_id: string;
  monthly_checklists: MonthlyChecklist[];
}

const API_URL = 'https://server.prktechindia.in/fire-safety-reports/';
const  = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyMonthlyChecklist: MonthlyChecklist = {
  Checklist_ID: '',
  Site_Name: '',
  Date: '',
  Inspector: '',
  Equipment_Area_Checked: '',
  Status: '',
  Issues_Found: '',
  Corrective_Actions: '',
  Remarks: '',
};

const MonthlyChecklistPage: React.FC = () => {
  console.log('🚀 MonthlyChecklist: Component initialized');
  const { user } = useAuth();
  console.log('👤 MonthlyChecklist: User loaded', { userId: user?.userId });
  const [data, setData] = useState<FireSafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: MonthlyChecklist | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: MonthlyChecklist | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  const handleEdit = (item: MonthlyChecklist, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = (reportId: string) => {
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyMonthlyChecklist },
      reportId,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this monthly checklist record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.monthly_checklists.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        Fire_Safety_Management: { Monthly_Checklist: newArr }
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: MonthlyChecklist) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: MonthlyChecklist[];
      if (editModal.isNew) {
        newArr = [...report.monthly_checklists, editModal.item];
      } else {
        newArr = report.monthly_checklists.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        Fire_Safety_Management: { Monthly_Checklist: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Monthly Checklist</h2>
      
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
              <th className="px-3 py-2 border">Checklist ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Inspector</th>
              <th className="px-3 py-2 border">Equipment/Area Checked</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Issues Found</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-6">Loading...</td></tr>
            ) : (
              <>
                {data.flatMap((report, rIdx) =>
                  report.monthly_checklists.map((item, idx) => (
                    <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                      <td className="border px-2 py-1">{idx + 1}</td>
                      <td className="border px-2 py-1">{item.Checklist_ID}</td>
                      <td className="border px-2 py-1">{item.Site_Name}</td>
                      <td className="border px-2 py-1">{item.Date}</td>
                      <td className="border px-2 py-1">{item.Inspector}</td>
                      <td className="border px-2 py-1">{item.Equipment_Area_Checked}</td>
                      <td className="border px-2 py-1">{item.Status}</td>
                      <td className="border px-2 py-1">{item.Issues_Found}</td>
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
          <Plus size={18} className="mr-2" /> Add Monthly Checklist
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Monthly Checklist
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
                <input className="border rounded px-3 py-2" placeholder="Checklist ID" value={editModal.item.Checklist_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Checklist_ID: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Site Name" value={editModal.item.Site_Name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Site_Name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Date" type="date" value={editModal.item.Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Inspector" value={editModal.item.Inspector} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Inspector: e.target.value } })} required />
                
                
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Issues Found" value={editModal.item.Issues_Found} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Issues_Found: e.target.value } })} />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Corrective Actions" value={editModal.item.Corrective_Actions} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Corrective_Actions: e.target.value } })} />
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Remarks" value={editModal.item.Remarks} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Remarks: e.target.value } })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.open && viewModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Checklist Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Checklist ID:</b> {viewModal.item.Checklist_ID}</div>
              <div><b>Site Name:</b> {viewModal.item.Site_Name}</div>
              <div><b>Date:</b> {viewModal.item.Date}</div>
              <div><b>Inspector:</b> {viewModal.item.Inspector}</div>
              <div><b>Equipment/Area Checked:</b> {viewModal.item.Equipment_Area_Checked}</div>
              <div><b>Status:</b> {viewModal.item.Status}</div>
              <div className="col-span-2"><b>Issues Found:</b> {viewModal.item.Issues_Found}</div>
              <div className="col-span-2"><b>Corrective Actions:</b> {viewModal.item.Corrective_Actions}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyChecklistPage;
