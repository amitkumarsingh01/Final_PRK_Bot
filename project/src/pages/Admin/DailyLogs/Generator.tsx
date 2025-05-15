import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Pencil, RotateCcw } from "lucide-react";

// Types based on your API
type Property = {
  id: string;
  name: string;
  title: string;
  description?: string;
  logo_base64?: string;
};

type DieselGenerator = {
  id: string;
  property_id: string;
  name: string;
  capacity?: string;
  running_hours: number;
  diesel_balance: number;
  diesel_capacity: number;
  kwh_units: number;
  battery_voltage?: number;
  voltage_line_to_line?: number;
  voltage_line_to_neutral?: number;
  frequency?: number;
  oil_pressure?: number;
  rpm?: number;
  coolant_temperature?: number;
  diesel_topup: number;
};

// Generator form values type
type GeneratorFormValues = {
  name: string;
  capacity: string;
  running_hours: number;
  diesel_balance: number;
  diesel_capacity: number;
  kwh_units: number;
  battery_voltage: number;
  voltage_line_to_line: number;
  voltage_line_to_neutral: number;
  frequency: number;
  oil_pressure: number;
  rpm: number;
  coolant_temperature: number;
  diesel_topup: number;
};

const initialFormValues: GeneratorFormValues = {
  name: "",
  capacity: "",
  running_hours: 0,
  diesel_balance: 0,
  diesel_capacity: 0,
  kwh_units: 0,
  battery_voltage: 0,
  voltage_line_to_line: 0,
  voltage_line_to_neutral: 0,
  frequency: 0,
  oil_pressure: 0,
  rpm: 0,
  coolant_temperature: 0,
  diesel_topup: 0
};

export default function DieselGeneratorManager() {
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [generators, setGenerators] = useState<DieselGenerator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentGeneratorId, setCurrentGeneratorId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<GeneratorFormValues>(initialFormValues);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Fetch generators when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      fetchGenerators(selectedProperty);
    } else {
      setGenerators([]);
    }
  }, [selectedProperty]);

  // API calls
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://server.prktechindia.in/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      setProperties(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching properties: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const fetchGenerators = async (propertyId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators?property_id=${propertyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch generators");
      }
      const data = await response.json();
      setGenerators(data);
      setLoading(false);
    } catch (err) {
      setError("Error fetching generators: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const createGenerator = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://server.prktechindia.in/diesel-generators/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formValues,
          property_id: selectedProperty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
      resetForm();
    } catch (err) {
      setError("Error creating generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const updateGenerator = async () => {
    if (!currentGeneratorId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators/${currentGeneratorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
      resetForm();
    } catch (err) {
      setError("Error updating generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const deleteGenerator = async (generatorId: string) => {
    if (!confirm("Are you sure you want to delete this generator?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://server.prktechindia.in/diesel-generators/${generatorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete generator");
      }

      // Refresh generators list
      fetchGenerators(selectedProperty);
    } catch (err) {
      setError("Error deleting generator: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  // Event handlers
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProperty(e.target.value);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormValues({
      ...formValues,
      [name]: name === "name" || name === "capacity" ? value : parseFloat(value) || 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateGenerator();
    } else {
      createGenerator();
    }
  };

  const handleEdit = (generator: DieselGenerator) => {
    setIsEditing(true);
    setCurrentGeneratorId(generator.id);
    setFormValues({
      name: generator.name,
      capacity: generator.capacity || "",
      running_hours: generator.running_hours,
      diesel_balance: generator.diesel_balance,
      diesel_capacity: generator.diesel_capacity,
      kwh_units: generator.kwh_units,
      battery_voltage: generator.battery_voltage || 0,
      voltage_line_to_line: generator.voltage_line_to_line || 0,
      voltage_line_to_neutral: generator.voltage_line_to_neutral || 0,
      frequency: generator.frequency || 0,
      oil_pressure: generator.oil_pressure || 0,
      rpm: generator.rpm || 0,
      coolant_temperature: generator.coolant_temperature || 0,
      diesel_topup: generator.diesel_topup,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormValues(initialFormValues);
    setShowForm(false);
    setIsEditing(false);
    setCurrentGeneratorId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-900 text-white py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold">Diesel Generator Management</h1>
      </div>
      
      <div className="container mx-auto p-6">
        {/* Property Selector */}
        <div className="mb-6">
          <label htmlFor="property-select" className="block text-blue-900 font-medium mb-2">
            Select Property
          </label>
          <select
            id="property-select"
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={selectedProperty}
            onChange={handlePropertyChange}
            disabled={loading}
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title} ({property.name})
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-700">
              &times;
            </button>
          </div>
        )}

        {selectedProperty && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-900">Diesel Generators</h2>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded flex items-center"
                  disabled={loading}
                >
                  <PlusCircle className="mr-2" size={16} />
                  Add Generator
                </button>
              ) : (
                <button
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Generator Form */}
            {showForm && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">
                  {isEditing ? "Edit Generator" : "Add New Generator"}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formValues.name}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. DG-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input
                        type="text"
                        name="capacity"
                        value={formValues.capacity}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. 750 KVA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Running Hours</label>
                      <input
                        type="number"
                        name="running_hours"
                        value={formValues.running_hours}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Balance (L)</label>
                      <input
                        type="number"
                        name="diesel_balance"
                        value={formValues.diesel_balance}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Capacity (L)</label>
                      <input
                        type="number"
                        name="diesel_capacity"
                        value={formValues.diesel_capacity}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">kWh Units</label>
                      <input
                        type="number"
                        name="kwh_units"
                        value={formValues.kwh_units}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Battery Voltage</label>
                      <input
                        type="number"
                        name="battery_voltage"
                        value={formValues.battery_voltage}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voltage (Line-to-Line)</label>
                      <input
                        type="number"
                        name="voltage_line_to_line"
                        value={formValues.voltage_line_to_line}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voltage (Line-to-Neutral)</label>
                      <input
                        type="number"
                        name="voltage_line_to_neutral"
                        value={formValues.voltage_line_to_neutral}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (Hz)</label>
                      <input
                        type="number"
                        name="frequency"
                        value={formValues.frequency}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Oil Pressure (psi)</label>
                      <input
                        type="number"
                        name="oil_pressure"
                        value={formValues.oil_pressure}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RPM</label>
                      <input
                        type="number"
                        name="rpm"
                        value={formValues.rpm}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coolant Temp (°C)</label>
                      <input
                        type="number"
                        name="coolant_temperature"
                        value={formValues.coolant_temperature}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Top-up (L)</label>
                      <input
                        type="number"
                        name="diesel_topup"
                        value={formValues.diesel_topup}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : isEditing ? "Update Generator" : "Add Generator"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Generators List */}
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <RotateCcw className="animate-spin text-orange-500" size={24} />
              </div>
            ) : generators.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
                <p className="text-gray-500">No generators found for this property.</p>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded inline-flex items-center"
                  >
                    <PlusCircle className="mr-2" size={16} />
                    Add First Generator
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Capacity</th>
                      <th className="py-3 px-4 text-left">Running Hours</th>
                      <th className="py-3 px-4 text-left">Diesel</th>
                      <th className="py-3 px-4 text-left">kWh Units</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generators.map((generator) => (
                      <tr key={generator.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">{generator.name}</td>
                        <td className="py-3 px-4">{generator.capacity || "N/A"}</td>
                        <td className="py-3 px-4">{generator.running_hours.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          {generator.diesel_balance.toFixed(1)} / {generator.diesel_capacity.toFixed(1)} L
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div 
                              className={`h-2.5 rounded-full ${
                                (generator.diesel_balance / generator.diesel_capacity) < 0.2 
                                  ? "bg-red-500" 
                                  : (generator.diesel_balance / generator.diesel_capacity) < 0.5 
                                    ? "bg-yellow-500" 
                                    : "bg-green-500"
                              }`}
                              style={{ 
                                width: `${Math.min(100, (generator.diesel_balance / generator.diesel_capacity) * 100)}%` 
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">{generator.kwh_units.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Operational
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(generator)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteGenerator(generator.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}