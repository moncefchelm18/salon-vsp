"use client";

import { useState } from "react";
import { mockBarbers } from "../../lib/mockData";
import {
  Plus,
  Edit,
  Trash2,
  X,
  UserPlus,
  Image as ImageIcon,
  Hash,
} from "lucide-react";

const emptyForm = {
  name: "",
  pin: "",
  image: "",
  poste: "",
};

export default function BarbersManager() {
  const [barbers, setBarbers] = useState(mockBarbers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [currentBarber, setCurrentBarber] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const handleOpenModal = (mode, barber = null) => {
    setModalMode(mode);
    if (mode === "edit" && barber) {
      setCurrentBarber(barber);
      setFormData({
        name: barber.name,
        pin: barber.pin,
        image: barber.image,
        poste: barber.poste,
      });
    } else {
      setCurrentBarber(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBarber(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBarber = () => {
    if (!formData.name || !formData.pin || !formData.poste) {
      alert("Name and PIN are required.");
      return;
    }

    if (modalMode === "add") {
      const newBarber = {
        id: Date.now(), // Use a unique ID like a timestamp
        status: "available",
        ...formData,
      };
      setBarbers([...barbers, newBarber]);
    } else if (modalMode === "edit" && currentBarber) {
      setBarbers(
        barbers.map((barber) =>
          barber.id === currentBarber.id ? { ...barber, ...formData } : barber
        )
      );
    }
    handleCloseModal();
  };

  const handleDeleteBarber = (barberId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this barber? This action cannot be undone."
      )
    ) {
      setBarbers(barbers.filter((barber) => barber.id !== barberId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold text-slate-100">
          Manage Barbers
        </h2>
        <button
          onClick={() => handleOpenModal("add")}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold  px-4 py-2 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Barber
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="bg-slate-900 border border-slate-800 p-4 flex flex-col items-center text-center"
          >
            <img
              src={barber.image || `https://i.pravatar.cc/150?u=${barber.name}`}
              alt={barber.name}
              className="w-24 h-24 rounded-full mb-4 border-4 border-slate-700 object-cover"
            />
            <h3 className="text-lg font-bold text-slate-100">{barber.name}</h3>
            <p className="text-sm text-slate-400 font-mono">
              PIN: {barber.pin}
            </p>
            <div className="mt-4 flex gap-2 w-full">
              <button
                onClick={() => handleOpenModal("edit", barber)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2 px-3  flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteBarber(barber.id)}
                className="flex-1 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-bold py-2 px-3  flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md  shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100"
            >
              <X />
            </button>
            <div className="p-6">
              <h3 className="text-2xl font-serif font-bold text-amber-400 mb-6">
                {modalMode === "add" ? "Add New Barber" : "Edit Barber Details"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Barber Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    4-Digit PIN
                  </label>
                  <input
                    name="pin"
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    onChange={handleFormChange}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Poste / Station Number
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute top-1/2 left-3 -translate-y-1/2" />
                    <input
                      name="poste"
                      type="number"
                      placeholder="e.g., 3"
                      value={formData.poste}
                      onChange={handleFormChange}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2 pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Image URL
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-500 absolute top-1/2 left-3 -translate-y-1/2" />
                    <input
                      name="image"
                      value={formData.image}
                      onChange={handleFormChange}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100  px-3 py-2 pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-4 py-2 "
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBarber}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 "
                >
                  {modalMode === "add" ? "Add Barber" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
