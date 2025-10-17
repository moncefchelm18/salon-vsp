"use client";

import { useState } from "react";
import { mockServices, mockProducts } from "../../lib/mockData";
import {
  Scissors,
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  Image as ImageIcon,
} from "lucide-react";

export default function SalonManager() {
  const [activeTab, setActiveTab] = useState("services"); // 'services' or 'products'

  // We need separate states for services and products
  const [services, setServices] = useState(mockServices);
  const [products, setProducts] = useState(mockProducts);

  // A unified modal state will handle both types
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("service"); // 'service' or 'product'
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});

  const handleOpenModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    if (mode === "edit" && item) {
      setCurrentItem(item);
      setFormData(item);
    } else {
      setCurrentItem(null);
      const emptyForm =
        type === "service"
          ? { name: "", price: "", duration: "", image: "" }
          : { name: "", salePrice: "", costPerUse: "", stock: "", image: "" };
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.image) {
      alert("Name and Image URL are required.");
      return;
    }

    if (modalType === "service") {
      if (modalMode === "add") {
        setServices([...services, { id: Date.now(), ...formData }]);
      } else {
        setServices(
          services.map((s) => (s.id === currentItem.id ? formData : s))
        );
      }
    } else {
      // It's a product
      if (modalMode === "add") {
        setProducts([...products, { id: Date.now(), ...formData }]);
      } else {
        setProducts(
          products.map((p) => (p.id === currentItem.id ? formData : p))
        );
      }
    }

    handleCloseModal();
  };

  const handleDelete = (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    if (type === "service") {
      setServices(services.filter((s) => s.id !== id));
    } else {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
            activeTab === "services"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Scissors className="w-4 h-4" />
          Manage Services
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
            activeTab === "products"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          Manage Products
        </button>
      </div>

      {/* Conditional Content based on active tab */}
      <div>
        {/* --- SERVICES VIEW --- */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-slate-300">
                Manage all haircut and grooming services offered.
              </p>
              <button
                onClick={() => handleOpenModal("service", "add")}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4  flex items-center gap-2"
              >
                <Plus /> Add Service
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-slate-900 border border-slate-800 overflow-hidden group"
                >
                  <img
                    src={service.image}
                    alt={service.name}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-slate-100">{service.name}</h3>
                    <div className="flex justify-between items-baseline mt-2">
                      <p className="text-xl font-mono text-amber-400 font-bold">
                        ${service.price}
                      </p>
                      <p className="text-sm text-slate-400">
                        {service.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex border-t border-slate-800">
                    <button
                      onClick={() =>
                        handleOpenModal("service", "edit", service)
                      }
                      className="flex-1 text-center py-2 text-slate-300 hover:bg-slate-800/50 flex items-center justify-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete("service", service.id)}
                      className="flex-1 text-center py-2 text-red-400 hover:bg-red-900/20 border-l border-slate-800 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* --- PRODUCTS VIEW --- */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-slate-300">
                Manage all retail products sold and used in the salon.
              </p>
              <button
                onClick={() => handleOpenModal("product", "add")}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4  flex items-center gap-2"
              >
                <Plus /> Add Product
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 overflow-hidden group"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-slate-100">{product.name}</h3>
                    <div className="flex justify-between items-center text-sm mt-2 text-slate-300">
                      <span>Sale Price:</span>{" "}
                      <span className="text-amber-400 font-mono font-bold text-lg">
                        ${product.salePrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1 text-slate-400">
                      <span>Cost per Use:</span>{" "}
                      <span className="font-mono">
                        ${Number(product.costPerUse).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex border-t border-slate-800">
                    <button
                      onClick={() =>
                        handleOpenModal("product", "edit", product)
                      }
                      className="flex-1 text-center py-2 text-slate-300 hover:bg-slate-800/50 flex items-center justify-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete("product", product.id)}
                      className="flex-1 text-center py-2 text-red-400 hover:bg-red-900/20 border-l border-slate-800 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- UNIVERSAL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg  shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100"
            >
              <X />
            </button>
            <div className="p-6">
              <h3 className="text-2xl font-serif font-bold text-amber-400 mb-6 capitalize">
                {modalMode} {modalType}
              </h3>
              {modalType === "service" ? (
                // Service Form
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleFormChange}
                    placeholder="Service Name"
                    className="col-span-2 bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="price"
                    value={formData.price || ""}
                    onChange={handleFormChange}
                    placeholder="Price ($)"
                    type="number"
                    className="bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="duration"
                    value={formData.duration || ""}
                    onChange={handleFormChange}
                    placeholder="Duration (min)"
                    type="number"
                    className="bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="image"
                    value={formData.image || ""}
                    onChange={handleFormChange}
                    placeholder="Image URL"
                    className="col-span-2 bg-slate-800 border-slate-700  p-2"
                  />
                </div>
              ) : (
                // Product Form
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleFormChange}
                    placeholder="Product Name"
                    className="col-span-2 bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="salePrice"
                    value={formData.salePrice || ""}
                    onChange={handleFormChange}
                    placeholder="Sale Price ($)"
                    type="number"
                    className="bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="costPerUse"
                    value={formData.costPerUse || ""}
                    onChange={handleFormChange}
                    placeholder="Cost per Use ($)"
                    type="number"
                    className="bg-slate-800 border-slate-700  p-2"
                  />
                  <input
                    name="image"
                    value={formData.image || ""}
                    onChange={handleFormChange}
                    placeholder="Image URL"
                    className="col-span-2 bg-slate-800 border-slate-700  p-2"
                  />
                </div>
              )}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="bg-slate-700 text-slate-200 font-semibold px-4 py-2 "
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-amber-500 text-slate-950 font-semibold px-4 py-2 "
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
