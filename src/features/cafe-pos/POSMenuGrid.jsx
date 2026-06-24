import React from "react";
import { AlertTriangle } from "lucide-react"; // <-- Nouvel import

const CATEGORY_COLORS = [
  {
    base: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    active: "bg-blue-600 text-white border-blue-600 shadow-md",
  },
  {
    base: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    active: "bg-rose-600 text-white border-rose-600 shadow-md",
  },
  {
    base: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    active: "bg-emerald-600 text-white border-emerald-600 shadow-md",
  },
  {
    base: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    active: "bg-amber-500 text-white border-amber-500 shadow-md",
  },
  {
    base: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    active: "bg-purple-600 text-white border-purple-600 shadow-md",
  },
  {
    base: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
    active: "bg-cyan-600 text-white border-cyan-600 shadow-md",
  },
];

export default function POSMenuGrid({
  categories,
  activeCategory,
  setActiveCategory,
  onAddProduct,
}) {
  const activeProducts =
    categories.find((c) => c.id === activeCategory)?.products || [];

  return (
    <div className="flex flex-col h-full bg-main">
      {/* CATEGORY TABS */}
      <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shrink-0 hide-scrollbar shadow-sm">
        {categories.map((cat, index) => {
          const colorTheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 whitespace-nowrap font-bold uppercase tracking-widest text-xs transition-all duration-200 border ${
                isActive ? colorTheme.active : colorTheme.base
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* PRODUCTS GRID */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeProducts.map((product) => {
            // --- LOGIQUE D'ALERTE STOCK ---
            // On vérifie si c'est un produit physique suivi et s'il est à zéro ou moins
            const isOutOfStock = product.isTracked && product.stock <= 0;

            return (
              <button
                key={product.id}
                onClick={() => onAddProduct(product)}
                // Si hors stock, on ajoute un filtre rouge/grisé léger pour alerter l'œil, mais ça reste cliquable !
                className={`bg-surface border flex flex-col items-center p-4 transition-all active:scale-95 shadow-sm group relative overflow-hidden ${
                  isOutOfStock
                    ? "border-red-500/50 hover:border-red-500 bg-red-500/5"
                    : "border-subtle hover:border-brand hover:shadow-lg"
                }`}
              >
                {/* Badge Hors Stock visuel */}
                {isOutOfStock && (
                  <div className="absolute top-0 w-full bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest py-1 flex justify-center items-center gap-1 shadow-md z-10">
                    <AlertTriangle size={10} /> Stock : {product.stock}
                  </div>
                )}

                <div
                  className={`w-full aspect-square bg-main border mb-4 p-2 flex justify-center items-center transition-colors ${
                    isOutOfStock
                      ? "border-red-500/30 opacity-60"
                      : "border-subtle group-hover:border-brand/50"
                  }`}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-opacity ${
                        isOutOfStock
                          ? "grayscale opacity-80"
                          : "opacity-90 group-hover:opacity-100"
                      }`}
                    />
                  ) : (
                    <span className="text-t-muted font-bold text-xs uppercase opacity-50">
                      Sans Image
                    </span>
                  )}
                </div>

                <h3
                  className={`font-bold text-sm text-center leading-tight mb-2 uppercase tracking-wide transition-colors ${
                    isOutOfStock
                      ? "text-red-400"
                      : "text-t-main group-hover:text-brand"
                  }`}
                >
                  {product.name}
                </h3>

                <p
                  className={`border w-full text-center py-2 font-mono font-bold text-lg mt-auto ${
                    isOutOfStock
                      ? "bg-red-950/20 border-red-500/30 text-red-500"
                      : "bg-main border-subtle text-brand"
                  }`}
                >
                  {product.price.toFixed(2)} DA
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
