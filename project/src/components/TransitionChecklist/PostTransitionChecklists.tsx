import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Building, Plus, Pencil, Trash2, Eye, Save, X, FileText, Layers } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  title?: string;
  description?: string;
  logo_base64?: string;
}

interface ChecklistItem {
  sr_no: number;
  description: string;
  critical_important_desirable: string;
  applicable: string;
  availability_status: string;
  details: string;
  remarks: string;
}

interface SectionCategory {
  documents_to_be_customised: ChecklistItem[];
}

interface SectionsMap {
  [sectionName: string]: SectionCategory;
}

interface TransitionChecklistReport {
  id: string;
  property_id: string;
  created_at: string;
  updated_at: string;
  company_logo: string;
  client_logo: string;
  site_name: string;
  transition_details: string;
  prepared_by: string;
  sections: SectionsMap;
}

const API_URL = 'https://server.prktechindia.in/transition-checklists/';
const PROPERTIES_URL = 'https://server.prktechindia.in/properties';

const PostTransitionChecklistsPage: React.FC = () => {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [reports, setReports] = useState<TransitionChecklistReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string>('');

  const [viewModal, setViewModal] = useState<{ open: boolean; data: any; title?: string }>({ open: false, data: null });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    section: string;
    data: ChecklistItem | null;
    isNew: boolean;
  }>({ open: false, section: '', data: null, isNew: false });

  // Load properties
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

  // Load profile to detect default property and role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.token || !user?.userId) return;
      try {
        const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const profile = await response.json();
        if (profile?.property_id) setSelectedPropertyId(profile.property_id);
        setIsAdmin(profile?.user_role === 'admin');
      } catch (e) {
        setError('Failed to fetch user profile');
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch reports for property
  const fetchReports = async (propertyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}?property_id=${propertyId}`);
      setReports(res.data || []);
    } catch (e) {
      setError('Failed to fetch transition checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) fetchReports(selectedPropertyId);
  }, [selectedPropertyId]);

  const currentReport = useMemo<TransitionChecklistReport | null>(() => {
    return reports?.length ? reports[0] : null;
  }, [reports]);

  const sectionsMap: SectionsMap = currentReport?.sections || {};
  const sectionNames = useMemo(() => Object.keys(sectionsMap || {}).sort(), [sectionsMap]);

  useEffect(() => {
    if (!activeSection && sectionNames.length) setActiveSection(sectionNames[0]);
    if (activeSection && !sectionNames.includes(activeSection) && sectionNames.length) setActiveSection(sectionNames[0]);
  }, [sectionNames, activeSection]);

  const totalItems = useMemo(() => {
    return Object.values(sectionsMap).reduce((sum, section) => sum + (section.documents_to_be_customised?.length || 0), 0);
  }, [sectionsMap]);

  const handlePropertyChange = (propertyId: string) => setSelectedPropertyId(propertyId);

  const openView = (item: ChecklistItem) => setViewModal({ open: true, data: item, title: 'Checklist Item Details' });

  const getEmptyItem = (): ChecklistItem => ({
    sr_no: (sectionsMap[activeSection]?.documents_to_be_customised?.length || 0) + 1,
    description: '',
    critical_important_desirable: '',
    applicable: '',
    availability_status: '',
    details: '',
    remarks: '',
  });

  const openAdd = (section: string) => {
    if (!isAdmin) return alert('Only admins can add items');
    setEditModal({ open: true, section, data: getEmptyItem(), isNew: true });
  };

  const openEdit = (section: string, item: ChecklistItem) => {
    if (!isAdmin) return alert('Only admins can edit items');
    setEditModal({ open: true, section, data: { ...item }, isNew: false });
  };

  const closeModals = () => {
    setViewModal({ open: false, data: null });
    setEditModal({ open: false, section: '', data: null, isNew: false });
  };

  const handleDelete = async (section: string, srNo: number) => {
    if (!isAdmin) return alert('Only admins can delete items');
    if (!currentReport) return;
    if (!confirm('Are you sure you want to delete this item?')) return;

    const updatedSections: SectionsMap = JSON.parse(JSON.stringify(sectionsMap));
    const items = updatedSections[section]?.documents_to_be_customised || [];
    updatedSections[section] = {
      documents_to_be_customised: items.filter((it) => it.sr_no !== srNo).map((it, idx) => ({ ...it, sr_no: idx + 1 })),
    };

    try {
      setLoading(true);
      await axios.put(`${API_URL}${currentReport.id}`, { sections: updatedSections });
      await fetchReports(selectedPropertyId);
    } catch (e) {
      setError('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentReport || !editModal.data || !editModal.section) return;

    const section = editModal.section;
    const item = editModal.data;

    const updatedSections: SectionsMap = JSON.parse(JSON.stringify(sectionsMap));
    const items = updatedSections[section]?.documents_to_be_customised || [];

    if (editModal.isNew) {
      updatedSections[section] = {
        documents_to_be_customised: [...items, { ...item, sr_no: items.length + 1 }],
      };
    } else {
      const newItems = items.map((it) => (it.sr_no === item.sr_no ? item : it));
      updatedSections[section] = { documents_to_be_customised: newItems };
    }

    try {
      setLoading(true);
      await axios.put(`${API_URL}${currentReport.id}`, { sections: updatedSections });
      closeModals();
      await fetchReports(selectedPropertyId);
    } catch (e) {
      setError('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transition Checklists</h1>
                <p className="text-gray-600">View and manage transition checklist sections and items</p>
              </div>
            </div>
            {isAdmin && currentReport && activeSection && (
              <button
                onClick={() => openAdd(activeSection)}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Property Selector */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Select Property</h2>
            </div>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sections</p>
                <p className="text-2xl font-bold text-gray-900">{sectionNames.length}</p>
              </div>
              <Layers className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Site</p>
                <p className="text-xl font-semibold text-gray-900">{currentReport?.site_name || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Empty state */}
        {!currentReport && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">
            No transition checklist report found for the selected property.
          </div>
        )}

        {currentReport && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            {/* Section Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex flex-wrap gap-4 px-6 py-2">
                {sectionNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSection(name)}
                    className={`py-3 px-3 border-b-2 font-medium text-sm ${
                      activeSection === name
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {name}
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {sectionsMap[name]?.documents_to_be_customised?.length || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Active Section Table */}
            <div className="p-6">
              {activeSection && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sr No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical/Important/Desirable</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicable</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(sectionsMap[activeSection]?.documents_to_be_customised || []).map((item, idx) => (
                        <tr key={`${activeSection}-${idx}-${item.sr_no}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sr_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.critical_important_desirable}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.applicable}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.availability_status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.details}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button onClick={() => openView(item)} className="text-blue-600 hover:text-blue-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button onClick={() => openEdit(activeSection, item)} className="text-orange-600 hover:text-orange-900">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDelete(activeSection, item.sr_no)} className="text-red-600 hover:text-red-900">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{viewModal.title || 'Details'}</h2>
              <button onClick={() => setViewModal({ open: false, data: null })} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(viewModal.data).map(([key, value]) => (
                <div key={key}>
                  <b>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</b> {String(value)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editModal.isNew ? 'Add Item' : 'Edit Item'}</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['sr_no', editModal.data.sr_no],
                  ['description', editModal.data.description],
                  ['critical_important_desirable', editModal.data.critical_important_desirable],
                  ['applicable', editModal.data.applicable],
                  ['availability_status', editModal.data.availability_status],
                  ['details', editModal.data.details],
                  ['remarks', editModal.data.remarks],
                ] as [string, string | number][]
              ).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={String(value ?? '')}
                    onChange={(e) =>
                      setEditModal((m) =>
                        m && {
                          ...m,
                          data: { ...m.data!, [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value },
                        }
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={closeModals} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostTransitionChecklistsPage;
