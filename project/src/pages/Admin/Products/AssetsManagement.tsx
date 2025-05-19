import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

// Define types
interface Asset {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  asset_category: string;
  asset_name: string;
  tag_number: string;
  additional_info?: string;
  location: string;
  vendor_name: string;
  purchase_date: string;
  asset_cost: number;
  warranty_date?: string;
  depreciation_value: number;
  qr_code_url: string;
}

interface AssetFormData {
  asset_category: string;
  asset_name: string;
  tag_number: string;
  additional_info?: string;
  location: string;
  vendor_name: string;
  purchase_date: string;
  asset_cost: string;
  warranty_date?: string;
  depreciation_value: string;
  property_id: string;
}

const AssetManagement: React.FC = () => {
  // Constants
  const DEFAULT_PROPERTY_ID = "waefasarioahwfar";
  const BASE_URL = "https://prkindia.com";
  const API_URL = `${BASE_URL}/api`;

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Initial form state
  const initialFormState: AssetFormData = {
    asset_category: "",
    asset_name: "",
    tag_number: "",
    additional_info: "",
    location: "",
    vendor_name: "",
    purchase_date: "",
    asset_cost: "",
    warranty_date: "",
    depreciation_value: "",
    property_id: DEFAULT_PROPERTY_ID,
  };

  const [formData, setFormData] = useState<AssetFormData>(initialFormState);

  // Fetch assets
  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/assets/`);
      setAssets(response.data);
      setFilteredAssets(response.data);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(response.data.map((asset: Asset) => asset.asset_category))
      );
      setCategories(uniqueCategories as string[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Failed to load assets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAssets();
  }, []);

  // Handle search & filter
  useEffect(() => {
    let filtered = assets;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((asset) => asset.asset_category === categoryFilter);
    }

    setFilteredAssets(filtered);
  }, [searchTerm, categoryFilter, assets]);

  // Form change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        asset_cost: parseFloat(formData.asset_cost),
        depreciation_value: parseFloat(formData.depreciation_value),
        property_id: DEFAULT_PROPERTY_ID,
      };

      if (isEditing && selectedAsset) {
        // Update existing asset
        await axios.put(`${API_URL}/assets/${selectedAsset.id}`, apiData);
        setSuccess("Asset updated successfully!");
      } else {
        // Create new asset
        await axios.post(`${API_URL}/assets/`, apiData);
        setSuccess("Asset created successfully!");
      }

      // Refresh data
      fetchAssets();
      resetForm();
    } catch (err: any) {
      console.error("Error saving asset:", err);
      setError(err.response?.data?.detail || "Failed to save asset. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/assets/${id}`);
      setSuccess("Asset deleted successfully!");
      fetchAssets();
    } catch (err) {
      console.error("Error deleting asset:", err);
      setError("Failed to delete asset. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit handler
  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      asset_category: asset.asset_category,
      asset_name: asset.asset_name,
      tag_number: asset.tag_number,
      additional_info: asset.additional_info || "",
      location: asset.location,
      vendor_name: asset.vendor_name,
      purchase_date: asset.purchase_date.split("T")[0], // Format date for input
      asset_cost: asset.asset_cost.toString(),
      warranty_date: asset.warranty_date ? asset.warranty_date.split("T")[0] : "",
      depreciation_value: asset.depreciation_value.toString(),
      property_id: asset.property_id,
    });
    setIsEditing(true);
    setIsAdding(true);
    window.scrollTo(0, 0);
  };

  // View details handler
  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedAsset(null);
    setIsAdding(false);
    setIsEditing(false);
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold">Asset Management System</h1>
          <p className="text-orange-300">Property ID: {DEFAULT_PROPERTY_ID}</p>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Notifications */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow">
            <p>{success}</p>
          </div>
        )}

        {/* Top Actions */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`${isAdding ? 'bg-gray-500' : 'bg-orange-500'} text-white px-4 py-2 rounded hover:opacity-90 transition shadow`}
          >
            {isAdding ? 'Cancel' : 'Add New Asset'}
          </button>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full sm:w-64"
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Asset Form */}
        {isAdding && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8 border-t-4 border-blue-900">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">
              {isEditing ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Asset Category</label>
                <input
                  type="text"
                  name="asset_category"
                  value={formData.asset_category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  name="asset_name"
                  value={formData.asset_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Tag Number</label>
                <input
                  type="text"
                  name="tag_number"
                  value={formData.tag_number}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Vendor Name</label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Asset Cost ($)</label>
                <input
                  type="number"
                  name="asset_cost"
                  value={formData.asset_cost}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Warranty Date (Optional)</label>
                <input
                  type="date"
                  name="warranty_date"
                  value={formData.warranty_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group">
                <label className="block text-gray-700 font-medium mb-1">Depreciation Value (%)</label>
                <input
                  type="number"
                  name="depreciation_value"
                  value={formData.depreciation_value}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Additional Info (Optional)</label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                ></textarea>
              </div>

              <div className="form-group md:col-span-2 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : isEditing ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Asset Details Modal */}
        {selectedAsset && !isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-blue-900">{selectedAsset.asset_name}</h2>
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row justify-between">
                  <div>
                    <p className="text-gray-600">Category: <span className="font-semibold">{selectedAsset.asset_category}</span></p>
                    <p className="text-gray-600">Tag Number: <span className="font-semibold">{selectedAsset.tag_number}</span></p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-gray-600">Cost: <span className="font-semibold">${selectedAsset.asset_cost.toFixed(2)}</span></p>
                    <p className="text-gray-600">Depreciation: <span className="font-semibold">{selectedAsset.depreciation_value}%</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-blue-900">Location</h3>
                    <p>{selectedAsset.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Vendor</h3>
                    <p>{selectedAsset.vendor_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Purchase Date</h3>
                    <p>{formatDate(selectedAsset.purchase_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Warranty Until</h3>
                    <p>{formatDate(selectedAsset.warranty_date)}</p>
                  </div>
                </div>

                {selectedAsset.additional_info && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-blue-900">Additional Information</h3>
                    <p className="whitespace-pre-line">{selectedAsset.additional_info}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Asset QR Code</h3>
                  {selectedAsset.qr_code_url ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={selectedAsset.qr_code_url} 
                        alt="Asset QR Code" 
                        className="h-40 w-40 object-contain mb-2"
                      />
                      <a 
                        href={`${BASE_URL}/assets/pdf/${selectedAsset.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Asset PDF
                      </a>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">QR code not yet generated</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAsset(null);
                      handleEdit(selectedAsset);
                    }}
                    className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="overflow-x-auto">
          {isLoading && !assets.length ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
              <p>Loading assets...</p>
            </div>
          ) : filteredAssets.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Asset Name</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Tag Number</th>
                  <th className="py-3 px-4 text-left">Location</th>
                  <th className="py-3 px-4 text-left">Purchase Date</th>
                  <th className="py-3 px-4 text-left">Cost</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{asset.asset_name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                        {asset.asset_category}
                      </span>
                    </td>
                    <td className="py-3 px-4">{asset.tag_number}</td>
                    <td className="py-3 px-4">{asset.location}</td>
                    <td className="py-3 px-4">{formatDate(asset.purchase_date)}</td>
                    <td className="py-3 px-4">${asset.asset_cost.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(asset)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No assets found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || categoryFilter 
                  ? "Try adjusting your search or filter" 
                  : "Get started by adding a new asset"}
              </p>
              {(searchTerm || categoryFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("");
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white p-6 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Asset Management System</h3>
              <p className="text-orange-300">Property ID: {DEFAULT_PROPERTY_ID}</p>
            </div>
            <div className="text-sm text-gray-300">
              <p>© 2025 PRK India. All rights reserved.</p>
              <p>Base URL: {BASE_URL}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AssetManagement;