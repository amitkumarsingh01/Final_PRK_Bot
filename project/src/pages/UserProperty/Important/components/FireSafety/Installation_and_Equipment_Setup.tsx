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

interface InstallationAndEquipmentSetup {
  id?: string;
  report_id?: string;
  Installation_ID: string;
  Site_Name: string;
  Equipment_ID: string;
  Equipment_Type: string;
  Location: string;
  Installation_Date: string;
  Installer: string;
  Status: string;
  Checklist_Items: string;
  Compliance_Status: string;
  Remarks: string;
}

interface FireSafetyReport {
  id: string;
  property_id: string;
  installations: InstallationAndEquipmentSetup[];
}

const API_URL = 'https://server.prktechindia.in/fire-safety-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptyInstallation: InstallationAndEquipmentSetup = {
  Installation_ID: '',
  Site_Name: '',
  Equipment_ID: '',
  Equipment_Type: '',
  Location: '',
  Installation_Date: '',
  Installer: '',
  Status: '',
  Checklist_Items: '',
  Compliance_Status: '',
  Remarks: '',
};

const InstallationAndEquipmentSetupPage: React.FC = () => {
  console.log('🚀 InstallationAndEquipmentSetup: Component initialized');
  const { user } = useAuth();
  console.log('👤 InstallationAndEquipmentSetup: User loaded', { userId: user?.userId });
  const [data, setData] = useState<FireSafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; item: InstallationAndEquipmentSetup | null }>({ open: false, item: null });
  const [editModal, setEditModal] = useState<{ open: boolean; item: InstallationAndEquipmentSetup | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    setIsAdmin(user?.userType === 'admin' || user?.userType === 'cadmin');
  }, [user?.userType]);

  const fetchData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${user.token}` } });
      const arr = Array.isArray(res.data) ? res.data : [];
      const filtered = user?.propertyId ? arr.filter((r: any) => r.property_id === user.propertyId) : arr;
      setData(filtered);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.token, user?.propertyId]);

  const ensureReportForProperty = async (): Promise<string | null> => {
    try {
      const existing = data.find(r => r.property_id === user?.propertyId);
      if (existing) return existing.id;
      const res = await axios.post(
        API_URL,
        { property_id: user?.propertyId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      const newId = res.data?.id || res.data?.report?.id || null;
      await fetchData();
      return newId;
    } catch (e) {
      setError('Failed to prepare report for adding');
      return null;
    }
  };

  const handleEdit = (item: InstallationAndEquipmentSetup, reportId: string) => {
    setEditModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAdd = async (reportId?: string) => {
    const id = reportId || (await ensureReportForProperty());
    if (!id) return;
    setEditModal({
      open: true,
      isNew: true,
      item: { ...emptyInstallation },
      reportId: id,
    });
  };

  const handleDelete = async (itemId: string, reportId: string) => {
    if (!window.confirm('Delete this installation record?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const newArr = report.installations.filter(i => i.id !== itemId);
      await axios.put(`${API_URL}${reportId}`, { 
        Fire_Safety_Management: { Installation_and_Equipment_Setup: newArr }
      });
      fetchData();
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleView = (item: InstallationAndEquipmentSetup) => {
    setViewModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!editModal.item || !editModal.reportId) return;
    try {
      const report = data.find(r => r.id === editModal.reportId);
      if (!report) return;
      let newArr: InstallationAndEquipmentSetup[];
      if (editModal.isNew) {
        newArr = [...report.installations, editModal.item];
      } else {
        newArr = report.installations.map(i =>
          i.id === editModal.item!.id ? editModal.item! : i
        );
      }
      await axios.put(`${API_URL}${editModal.reportId}`, { 
        Fire_Safety_Management: { Installation_and_Equipment_Setup: newArr }
      });
      setEditModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData();
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Installation and Equipment Setup</h2>
      
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
              <th className="px-3 py-2 border">Installation ID</th>
              <th className="px-3 py-2 border">Site Name</th>
              <th className="px-3 py-2 border">Equipment ID</th>
              <th className="px-3 py-2 border">Equipment Type</th>
              <th className="px-3 py-2 border">Location</th>
              <th className="px-3 py-2 border">Installation Date</th>
              <th className="px-3 py-2 border">Installer</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Compliance Status</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="text-center py-6">Loading...</td></tr>
            ) : (() => {
              const rows = data.flatMap((report, rIdx) =>
                report.installations.map((item, idx) => (
                  <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.Installation_ID}</td>
                    <td className="border px-2 py-1">{item.Site_Name}</td>
                    <td className="border px-2 py-1">{item.Equipment_ID}</td>
                    <td className="border px-2 py-1">{item.Equipment_Type}</td>
                    <td className="border px-2 py-1">{item.Location}</td>
                    <td className="border px-2 py-1">{item.Installation_Date}</td>
                    <td className="border px-2 py-1">{item.Installer}</td>
                    <td className="border px-2 py-1">{item.Status}</td>
                    <td className="border px-2 py-1">{item.Compliance_Status}</td>
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
              );
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={11} className="text-center py-6">
                      <div className="flex items-center justify-center gap-3">
                        <span>No installation records found</span>
                        {isAdmin && (
                          <button onClick={() => handleAdd()} className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Add Installation Record</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <button
          onClick={() => handleAdd(data[0]?.id)}
          className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
        >
          <Plus size={18} className="mr-2" /> Add Installation Record
        </button>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editModal.isNew ? 'Add' : 'Edit'} Installation Record
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
                <input className="border rounded px-3 py-2" placeholder="Installation ID" value={editModal.item.Installation_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Installation_ID: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Site Name" value={editModal.item.Site_Name} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Site_Name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Equipment ID" value={editModal.item.Equipment_ID} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Equipment_ID: e.target.value } })} required />
                
                <input className="border rounded px-3 py-2" placeholder="Location" value={editModal.item.Location} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Location: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Installation Date" type="date" value={editModal.item.Installation_Date} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Installation_Date: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Installer" value={editModal.item.Installer} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Installer: e.target.value } })} required />
                
                
                <textarea className="border rounded px-3 py-2 col-span-2" placeholder="Checklist Items" value={editModal.item.Checklist_Items} onChange={e => setEditModal(m => m && { ...m, item: { ...m.item!, Checklist_Items: e.target.value } })} required />
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
                Installation Details
              </h3>
              <button
                onClick={() => setViewModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Installation ID:</b> {viewModal.item.Installation_ID}</div>
              <div><b>Site Name:</b> {viewModal.item.Site_Name}</div>
              <div><b>Equipment ID:</b> {viewModal.item.Equipment_ID}</div>
              <div><b>Equipment Type:</b> {viewModal.item.Equipment_Type}</div>
              <div><b>Location:</b> {viewModal.item.Location}</div>
              <div><b>Installation Date:</b> {viewModal.item.Installation_Date}</div>
              <div><b>Installer:</b> {viewModal.item.Installer}</div>
              <div><b>Status:</b> {viewModal.item.Status}</div>
              <div><b>Compliance Status:</b> {viewModal.item.Compliance_Status}</div>
              <div className="col-span-2"><b>Checklist Items:</b> {viewModal.item.Checklist_Items}</div>
              <div className="col-span-2"><b>Remarks:</b> {viewModal.item.Remarks}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationAndEquipmentSetupPage;
