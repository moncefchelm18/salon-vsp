import React, { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";

export default function ImageUpload({
  label,
  value,
  onChange,
  name = "image",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Drag Events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // THE FIX: Convert Image to Base64 Text instead of a temporary Blob
  const handleFileSelected = (file) => {
    if (!file) return;

    // We use FileReader to convert the physical file into a Base64 String
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result; // This is the final permanent string!

      if (typeof onChange === "function") {
        const fakeEvent = {
          target: { name: name, value: base64String, file: file },
        };
        onChange(fakeEvent);

        // Also support direct setters just in case
        if (onChange.length === 1) {
          onChange(base64String);
        }
      }
    };

    // This triggers the reader to start converting
    reader.readAsDataURL(file);
  };

  const clearImage = (e) => {
    e.stopPropagation();
    if (typeof onChange === "function") {
      const fakeEvent = { target: { name: name, value: "", file: null } };
      onChange(fakeEvent);
      if (onChange.length === 1) {
        onChange("");
      }
    }
  };

  // Determine if we should show a placeholder or the actual image
  // Sometimes external URLs (http://) are passed, sometimes base64 (data:image...)
  const displayImage = value && value.length > 0 ? value : null;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-t-muted mb-2">
          {label}
        </label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full h-40 bg-main border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 ${
          isDragging
            ? "border-brand bg-brand/10"
            : displayImage
              ? "border-subtle hover:border-brand"
              : "border-subtle hover:border-brand"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileSelected(e.target.files[0])}
        />

        {displayImage ? (
          // Image Preview Mode
          <div className="relative w-full h-full p-2 group">
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover border border-subtle"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-4 right-4 bg-red-600 text-white p-2 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Supprimer l'image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          // Upload Prompt Mode
          <div className="text-center p-4">
            <div className="mx-auto w-10 h-10 mb-2 bg-surface border border-subtle flex items-center justify-center text-t-muted transition-colors duration-300">
              <UploadCloud size={20} />
            </div>
            <p className="text-xs font-bold uppercase text-t-main tracking-widest transition-colors duration-300">
              Glisser ou Choisir une Image
            </p>
            <p className="text-[10px] uppercase font-bold text-t-muted mt-1 tracking-widest">
              PNG, JPG max 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
