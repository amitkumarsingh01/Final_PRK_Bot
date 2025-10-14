import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Building, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Property {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
}

interface SiteInformation {
  id?: string;
  cctv_audit_id?: string;
  Site_Name_Code: string;
  Address: string;
  Contact_Person_Site_Incharge: string;
  CCTV_Install_Date: string;
}

interface CameraInventoryLog {
  id?: string;
  cctv_audit_id?: string;
  Camera_ID_Name: string;
  Camera_Type: string;
  Brand_Model_No: string;
  Resolution_MP: string;
  Location_Installed: string;
  Indoor_Outdoor: string;
  Working_Status: string;
}

interface CctvAuditReport {
  id: string;
  property_id: string;
  cctv_audit_data: {
    Documentation_Format: {
      Site_Information: SiteInformation;
      Camera_Inventory_Log: CameraInventoryLog[];
    };
  };
}

const API_URL = 'https://server.prktechindia.in/cctv-audit-reports/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';
const orange = '#FB7E03';
const orangeDark = '#E06002';

const emptySiteInformation: SiteInformation = {
  Site_Name_Code: '',
  Address: '',
  Contact_Person_Site_Incharge: '',
  CCTV_Install_Date: '',
};

const emptyCameraInventory: CameraInventoryLog = {
  Camera_ID_Name: '',
  Camera_Type: '',
  Brand_Model_No: '',
  Resolution_MP: '',
  Location_Installed: '',
  Indoor_Outdoor: '',
  Working_Status: '',
};

const DocumentationPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CctvAuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'site' | 'camera'>('site');
  
  // Site Information modals
  const [viewSiteModal, setViewSiteModal] = useState<{ open: boolean; item: SiteInformation | null }>({ open: false, item: null });
  const [editSiteModal, setEditSiteModal] = useState<{ open: boolean; item: SiteInformation | null; isNew: boolean; reportId: string | null }>({ open: false, item: null, isNew: false, reportId: null });
  
  // Camera Inventory modals
  const [viewCameraModal, setViewCameraModal] = useState<{ open: boolean; item: CameraInventoryLog | null }>({ open: false, item: null });
  const [editCameraModal, setEditCameraModal] = useState<{ open: boolean; item: CameraInventoryLog | null; isNew: boolean; reportId: string | null; index?: number }>({ open: false, item: null, isNew: false, reportId: null });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(PROPERTIES_URL);
        setProperties(res.data);
      } catch (e) {
        setError('Failed to fetch properties');
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUserProperty = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const res = await axios.get('https://server.prktechindia.in/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const matchedUser = res.data.find((u: any) => u.user_id === user.userId);
        if (matchedUser && matchedUser.property_id) {
          setSelectedPropertyId(matchedUser.property_id);
        }
        if (matchedUser && matchedUser.user_role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProperty();
  }, [user]);

  const fetchData = async (propertyId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setData(res.data);
    } catch (e) {
      setError('Failed to fetch CCTV audit reports');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchData(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // Site Information handlers
  const handleEditSite = (item: SiteInformation, reportId: string) => {
    setEditSiteModal({ open: true, item: { ...item }, isNew: false, reportId });
  };

  const handleAddSite = () => {
    setEditSiteModal({
      open: true,
      isNew: true,
      item: { ...emptySiteInformation },
      reportId: null,
    });
  };

  const handleDeleteSite = async (_itemId: string, reportId: string) => {
    if (!window.confirm('Delete this site information entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      // Preserve Camera_Inventory_Log; set Site_Information to empty to satisfy required schema
      await axios.put(`${API_URL}${reportId}`, {
        CCTV_Audit: {
          ...(report.cctv_audit_data || {}),
          Documentation_Format: {
            ...(report.cctv_audit_data?.Documentation_Format || {}),
            Site_Information: { ...emptySiteInformation }
          }
        }
      }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleViewSite = (item: SiteInformation) => {
    setViewSiteModal({ open: true, item });
  };

  const handleSaveSite = async () => {
    if (!editSiteModal.item) return;
    try {
      if (editSiteModal.isNew) {
        if (!selectedPropertyId) return;
        const newPayload = {
          property_id: selectedPropertyId,
          CCTV_Audit: {
            Site_Assessment_Format: [],
            Installation_Checklist: [],
            Configuration_Testing_Checklist: [],
            Daily_Operations_Monitoring: [],
            Maintenance_Schedule: [],
            Documentation_Format: {
              Site_Information: editSiteModal.item,
              Camera_Inventory_Log: []
            },
            AMC_Compliance_Format: []
          }
        };
        await axios.post(`${API_URL}`, newPayload, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      } else {
        if (!editSiteModal.reportId) return;
        const report = data.find(r => r.id === editSiteModal.reportId);
        if (!report) return;
        await axios.put(`${API_URL}${editSiteModal.reportId}`, {
          CCTV_Audit: {
            ...(report.cctv_audit_data || {}),
            Documentation_Format: {
              ...(report.cctv_audit_data?.Documentation_Format || {}),
              Site_Information: editSiteModal.item
            }
          }
        }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      }
      setEditSiteModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  // Camera Inventory handlers
  const handleEditCamera = (item: CameraInventoryLog, reportId: string, index?: number) => {
    setEditCameraModal({ open: true, item: { ...item }, isNew: false, reportId, index });
  };

  const handleAddCamera = (reportId: string) => {
    setEditCameraModal({
      open: true,
      isNew: true,
      item: { ...emptyCameraInventory },
      reportId,
    });
  };

  const handleDeleteCamera = async (itemId: string | undefined, reportId: string, index?: number) => {
    if (!window.confirm('Delete this camera inventory entry?')) return;
    try {
      const report = data.find(r => r.id === reportId);
      if (!report) return;
      const current = (report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || []);
      const newArr = itemId ? current.filter((i: CameraInventoryLog) => i.id !== itemId) : current.filter((_, idx: number) => idx !== (index ?? -1));
      await axios.put(`${API_URL}${reportId}`, {
        CCTV_Audit: {
          ...(report.cctv_audit_data || {}),
          Documentation_Format: {
            ...(report.cctv_audit_data?.Documentation_Format || {}),
            Camera_Inventory_Log: newArr
          }
        }
      }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete');
    }
  };

  const handleViewCamera = (item: CameraInventoryLog) => {
    setViewCameraModal({ open: true, item });
  };

  const handleSaveCamera = async () => {
    if (!editCameraModal.item || !editCameraModal.reportId) return;
    try {
      const report = data.find(r => r.id === editCameraModal.reportId);
      if (!report) return;
      let newArr: CameraInventoryLog[];
      if (editCameraModal.isNew) {
        newArr = [...(report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || []), editCameraModal.item];
      } else {
        const hasId = Boolean(editCameraModal.item!.id);
        if (hasId) {
          newArr = (report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || []).map((i: CameraInventoryLog) =>
            i.id === editCameraModal.item!.id ? editCameraModal.item! : i
          );
        } else if (typeof editCameraModal.index === 'number') {
          newArr = [...(report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || [])];
          newArr[editCameraModal.index] = editCameraModal.item!;
        } else {
          newArr = (report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || []);
        }
      }
      await axios.put(`${API_URL}${editCameraModal.reportId}`, {
        CCTV_Audit: {
          ...(report.cctv_audit_data || {}),
          Documentation_Format: {
            ...(report.cctv_audit_data?.Documentation_Format || {}),
            Camera_Inventory_Log: newArr
          }
        }
      }, user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : undefined);
      setEditCameraModal({ open: false, item: null, isNew: false, reportId: null });
      fetchData(selectedPropertyId);
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fff' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: orangeDark }}>Documentation</h2>
      
      {/* Property Selection Dropdown */}
      <div className="mb-6 max-w-md">
        <label htmlFor="propertySelect" className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-gray-400" />
          <select
            id="propertySelect"
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-[#FB7E03] focus:border-[#FB7E03]"
          >
            <option value="">Select a property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} - {property.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mb-2 text-red-600">{error}</div>}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('site')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'site'
                  ? 'border-[#FB7E03] text-[#FB7E03]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Site Information
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'camera'
                  ? 'border-[#FB7E03] text-[#FB7E03]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Camera Inventory Log
            </button>
          </nav>
        </div>
      </div>

      {/* Site Information Tab */}
      {activeTab === 'site' && (
        <div>
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: orange, color: '#fff' }}>
                  <th className="px-3 py-2 border">Site Name/Code</th>
                  <th className="px-3 py-2 border">Address</th>
                  <th className="px-3 py-2 border">Contact Person/Site Incharge</th>
                  <th className="px-3 py-2 border">CCTV Install Date</th>
                  <th className="px-3 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
                ) : (
                  <>
                    {data.flatMap((report) => {
                      const siteInfo = report.cctv_audit_data?.Documentation_Format?.Site_Information;
                      if (!siteInfo) return [];
                      return [(
                        <tr key={siteInfo.id || report.id} style={{ background: '#fff' }}>
                          <td className="border px-2 py-1">{siteInfo.Site_Name_Code}</td>
                          <td className="border px-2 py-1">{siteInfo.Address}</td>
                          <td className="border px-2 py-1">{siteInfo.Contact_Person_Site_Incharge}</td>
                          <td className="border px-2 py-1">{siteInfo.CCTV_Install_Date}</td>
                          <td className="border px-2 py-1 text-center">
                            <button onClick={() => handleViewSite(siteInfo)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleEditSite(siteInfo, report.id)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                                <button onClick={() => handleDeleteSite(siteInfo.id!, report.id)} className="text-red-600"><Trash2 size={18} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      )];
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <button
              onClick={() => handleAddSite()}
              className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
            >
              <Plus size={18} className="mr-2" /> Add Site Information
            </button>
          )}
        </div>
      )}

      {/* Camera Inventory Tab */}
      {activeTab === 'camera' && (
        <div>
          <div className="overflow-x-auto rounded-lg shadow border border-gray-200 mb-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: orange, color: '#fff' }}>
                  <th className="px-3 py-2 border">Camera ID/Name</th>
                  <th className="px-3 py-2 border">Camera Type</th>
                  <th className="px-3 py-2 border">Brand/Model No</th>
                  <th className="px-3 py-2 border">Resolution (MP)</th>
                  <th className="px-3 py-2 border">Location Installed</th>
                  <th className="px-3 py-2 border">Indoor/Outdoor</th>
                  <th className="px-3 py-2 border">Working Status</th>
                  <th className="px-3 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-6">Loading...</td></tr>
                ) : (
                  <>
                    {data.flatMap((report) =>
                      (report.cctv_audit_data?.Documentation_Format?.Camera_Inventory_Log || []).map((item, idx) => (
                        <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : '#FFF7ED' }}>
                          <td className="border px-2 py-1">{item.Camera_ID_Name}</td>
                          <td className="border px-2 py-1">{item.Camera_Type}</td>
                          <td className="border px-2 py-1">{item.Brand_Model_No}</td>
                          <td className="border px-2 py-1">{item.Resolution_MP}</td>
                          <td className="border px-2 py-1">{item.Location_Installed}</td>
                          <td className="border px-2 py-1">{item.Indoor_Outdoor}</td>
                          <td className="border px-2 py-1">{item.Working_Status}</td>
                          <td className="border px-2 py-1 text-center">
                            <button onClick={() => handleViewCamera(item)} className="text-blue-600 mr-2"><Eye size={18} /></button>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleEditCamera(item, report.id, idx)} className="text-orange-600 mr-2"><Pencil size={18} /></button>
                                <button onClick={() => handleDeleteCamera(item.id, report.id, idx)} className="text-red-600"><Trash2 size={18} /></button>
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
              onClick={() => handleAddCamera(data[0].id)}
              className="mb-6 flex items-center px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow hover:from-[#FB7E03] hover:to-[#E06002]"
            >
              <Plus size={18} className="mr-2" /> Add Camera Inventory Entry
            </button>
          )}
        </div>
      )}

      {/* Site Information Edit Modal */}
      {editSiteModal.open && editSiteModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editSiteModal.isNew ? 'Add' : 'Edit'} Site Information
              </h3>
              <button
                onClick={() => setEditSiteModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveSite(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Site Name/Code" value={editSiteModal.item.Site_Name_Code} onChange={e => setEditSiteModal(m => m && { ...m, item: { ...m.item!, Site_Name_Code: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={editSiteModal.item.Address} onChange={e => setEditSiteModal(m => m && { ...m, item: { ...m.item!, Address: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Contact Person/Site Incharge" value={editSiteModal.item.Contact_Person_Site_Incharge} onChange={e => setEditSiteModal(m => m && { ...m, item: { ...m.item!, Contact_Person_Site_Incharge: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="CCTV Install Date" type="date" value={editSiteModal.item.CCTV_Install_Date} onChange={e => setEditSiteModal(m => m && { ...m, item: { ...m.item!, CCTV_Install_Date: e.target.value } })} required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditSiteModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Information View Modal */}
      {viewSiteModal.open && viewSiteModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Site Information Details
              </h3>
              <button
                onClick={() => setViewSiteModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Site Name/Code:</b> {viewSiteModal.item.Site_Name_Code}</div>
              <div><b>Address:</b> {viewSiteModal.item.Address}</div>
              <div><b>Contact Person/Site Incharge:</b> {viewSiteModal.item.Contact_Person_Site_Incharge}</div>
              <div><b>CCTV Install Date:</b> {viewSiteModal.item.CCTV_Install_Date}</div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Inventory Edit Modal */}
      {editCameraModal.open && editCameraModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editCameraModal.isNew ? 'Add' : 'Edit'} Camera Inventory Entry
              </h3>
              <button
                onClick={() => setEditCameraModal({ open: false, item: null, isNew: false, reportId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveCamera(); }}>
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Camera ID/Name" value={editCameraModal.item.Camera_ID_Name} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Camera_ID_Name: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Camera Type" value={editCameraModal.item.Camera_Type} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Camera_Type: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Brand/Model No" value={editCameraModal.item.Brand_Model_No} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Brand_Model_No: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Resolution (MP)" value={editCameraModal.item.Resolution_MP} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Resolution_MP: e.target.value } })} required />
                <input className="border rounded px-3 py-2" placeholder="Location Installed" value={editCameraModal.item.Location_Installed} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Location_Installed: e.target.value } })} required />
                <select className="border rounded px-3 py-2" value={editCameraModal.item.Indoor_Outdoor} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Indoor_Outdoor: e.target.value } })} required>
                  <option value="">Select Type</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
                <select className="border rounded px-3 py-2" value={editCameraModal.item.Working_Status} onChange={e => setEditCameraModal(m => m && { ...m, item: { ...m.item!, Working_Status: e.target.value } })} required>
                  <option value="">Select Status</option>
                  <option value="Working">Working</option>
                  <option value="Not Working">Not Working</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditCameraModal({ open: false, item: null, isNew: false, reportId: null })} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white font-semibold shadow">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Inventory View Modal */}
      {viewCameraModal.open && viewCameraModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Camera Inventory Details
              </h3>
              <button
                onClick={() => setViewCameraModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><b>Camera ID/Name:</b> {viewCameraModal.item.Camera_ID_Name}</div>
              <div><b>Camera Type:</b> {viewCameraModal.item.Camera_Type}</div>
              <div><b>Brand/Model No:</b> {viewCameraModal.item.Brand_Model_No}</div>
              <div><b>Resolution (MP):</b> {viewCameraModal.item.Resolution_MP}</div>
              <div><b>Location Installed:</b> {viewCameraModal.item.Location_Installed}</div>
              <div><b>Indoor/Outdoor:</b> {viewCameraModal.item.Indoor_Outdoor}</div>
              <div><b>Working Status:</b> {viewCameraModal.item.Working_Status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationPage;
