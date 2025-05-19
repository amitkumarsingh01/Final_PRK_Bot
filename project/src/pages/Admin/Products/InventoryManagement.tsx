import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaQrcode, FaFilePdf, FaSpinner, FaSearch } from 'react-icons/fa';

// Define the base URL for the API
const API_URL = 'http://localhost:8000';
const DEFAULT_PROPERTY_ID = 'waefasarioahwfar';

// Define types for our data
interface Inventory {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  stock_name: string;
  department: string;
  stock_id: string;
  inventory_subledger: string;
  units: number;
  units_of_measurement: string;
  date_of_purchase: string;
  custodian: string;
  location: string;
  opening_balance: number;
  issued: number;
  closing_balance: number;
  description: string;
  qr_code_url: string | null;
}

interface InventoryFormData {
  property_id: string;
  stock_name: string;
  department: string;
  stock_id: string;
  inventory_subledger: string;
  units: number;
  units_of_measurement: string;
  date_of_purchase: string;
  custodian: string;
  location: string;
  opening_balance: number;
  issued: number;
  closing_balance: number;
  description: string;
}

// Initial form state
const initialFormState: InventoryFormData = {
  property_id: DEFAULT_PROPERTY_ID,
  stock_name: '',
  department: '',
  stock_id: '',
  inventory_subledger: '',
  units: 0,
  units_of_measurement: '',
  date_of_purchase: format(new Date(), 'yyyy-MM-dd'),
  custodian: '',
  location: '',
  opening_balance: 0,
  issued: 0,
  closing_balance: 0,
  description: '',
};

const InventoryManagement: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [formData, setFormData] = useState<InventoryFormData>(initialFormState);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [qrModalItem, setQrModalItem] = useState<Inventory | null>(null);

  // Fetch all inventory items on component mount
  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/inventory/`);
      setInventories(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory items. Please try again later.');
      console.error('Error fetching inventory items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['units', 'opening_balance', 'issued', 'closing_balance'].includes(name)) {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setCurrentItemId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format the date correctly for the API
      const submissionData = {
        ...formData,
        date_of_purchase: new Date(formData.date_of_purchase).toISOString(),
      };
      
      if (isEditing && currentItemId) {
        // Update existing inventory item
        await axios.put(`${API_URL}/inventory/${currentItemId}`, submissionData);
      } else {
        // Create new inventory item
        await axios.post(`${API_URL}/inventory/`, submissionData);
      }
      
      // Reset form and fetch updated data
      resetForm();
      fetchInventories();
      setError(null);
    } catch (err: any) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} inventory item: ${err.response?.data?.detail || err.message}`);
      console.error('Error submitting form:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: Inventory) => {
    // Prepare date in the format expected by the input field (YYYY-MM-DD)
    const purchaseDate = new Date(item.date_of_purchase);
    const formattedDate = format(purchaseDate, 'yyyy-MM-dd');

    setFormData({
      property_id: item.property_id,
      stock_name: item.stock_name,
      department: item.department,
      stock_id: item.stock_id,
      inventory_subledger: item.inventory_subledger,
      units: item.units,
      units_of_measurement: item.units_of_measurement,
      date_of_purchase: formattedDate,
      custodian: item.custodian,
      location: item.location,
      opening_balance: item.opening_balance,
      issued: item.issued,
      closing_balance: item.closing_balance,
      description: item.description,
    });
    
    setIsEditing(true);
    setCurrentItemId(item.id);
    setShowForm(true);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/inventory/${id}`);
      setInventories(inventories.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete inventory item. Please try again later.');
      console.error('Error deleting inventory item:', err);
    } finally {
      setIsLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const openQrModal = (item: Inventory) => {
    setQrModalItem(item);
  };

  const closeQrModal = () => {
    setQrModalItem(null);
  };

  const regenerateFiles = async (id: string) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/inventory/${id}/regenerate`);
      fetchInventories();
      setError(null);
    } catch (err) {
      setError('Failed to regenerate files. Please try again later.');
      console.error('Error regenerating files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = (id: string, stockName: string) => {
    window.open(`${API_URL}/inventory/pdf/${id}`, '_blank');
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Filter inventories based on search term
  const filteredInventories = inventories.filter(item => 
    item.stock_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.stock_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.custodian.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Inventory Management System</h1>
          <p className="mt-2 text-blue-200">Manage your assets efficiently</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <button 
            onClick={handleAddNew}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded shadow flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Asset
          </button>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              {isEditing ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="hidden">
                <label className="block text-gray-700 mb-1">Property ID</label>
                <input
                  type="text"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Stock Name *</label>
                <input
                  type="text"
                  name="stock_name"
                  value={formData.stock_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Stock ID *</label>
                <input
                  type="text"
                  name="stock_id"
                  value={formData.stock_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Inventory Subledger *</label>
                <input
                  type="text"
                  name="inventory_subledger"
                  value={formData.inventory_subledger}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Units *</label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Units of Measurement *</label>
                <input
                  type="text"
                  name="units_of_measurement"
                  value={formData.units_of_measurement}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Date of Purchase *</label>
                <input
                  type="date"
                  name="date_of_purchase"
                  value={formData.date_of_purchase}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Custodian *</label>
                <input
                  type="text"
                  name="custodian"
                  value={formData.custodian}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Opening Balance *</label>
                <input
                  type="number"
                  name="opening_balance"
                  value={formData.opening_balance}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Issued *</label>
                <input
                  type="number"
                  name="issued"
                  value={formData.issued}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Closing Balance *</label>
                <input
                  type="number"
                  name="closing_balance"
                  value={formData.closing_balance}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  min="0"
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 flex gap-3 mt-4">
                <button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded shadow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin mx-auto" />
                  ) : isEditing ? (
                    'Update Asset'
                  ) : (
                    'Save Asset'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded shadow"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory Table */}
        <div className="mt-6 overflow-x-auto bg-white rounded-lg shadow">
          {isLoading && inventories.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-3xl text-blue-900" />
            </div>
          ) : filteredInventories.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Stock Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Stock ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventories.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.stock_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stock_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.units} {item.units_of_measurement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.closing_balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => openQrModal(item)}
                          className="text-orange-500 hover:text-orange-700"
                          title="QR Code"
                        >
                          <FaQrcode />
                        </button>
                        <button
                          onClick={() => downloadPdf(item.id, item.stock_name)}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          <FaFilePdf />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 mb-4">No inventory items found</p>
              <button
                onClick={handleAddNew}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded shadow flex items-center"
              >
                <FaPlus className="mr-2" /> Add First Asset
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center">© {new Date().getFullYear()} Inventory Management System. All rights reserved.</p>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this inventory item? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{qrModalItem.stock_name} - QR Code</h3>
            
            <div className="flex flex-col items-center justify-center mb-4">
              {qrModalItem.qr_code_url ? (
                <img 
                  src={`${API_URL}/inventory/qr/${qrModalItem.id}`} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain border p-2"
                />
              ) : (
                <div className="w-64 h-64 border flex items-center justify-center text-gray-500">
                  No QR code available
                </div>
              )}
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">Scan to view asset information</p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => regenerateFiles(qrModalItem.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
              >
                <FaSpinner className={`mr-2 ${isLoading ? 'animate-spin' : 'hidden'}`} />
                Regenerate
              </button>
              
              <button
                onClick={closeQrModal}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;