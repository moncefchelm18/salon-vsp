import React from "react";

// Palette de couleurs : "active" pour quand c'est sélectionné, "inactive" pour guider l'œil au repos
const CATEGORY_COLORS = [
  {
    active: "border-blue-500 text-blue-600 bg-blue-500/10",
    inactive:
      "border-blue-500/30 text-blue-600/70 hover:bg-blue-500/5 hover:text-blue-600",
  },
  {
    active: "border-rose-500 text-rose-600 bg-rose-500/10",
    inactive:
      "border-rose-500/30 text-rose-600/70 hover:bg-rose-500/5 hover:text-rose-600",
  },
  {
    active: "border-emerald-500 text-emerald-600 bg-emerald-500/10",
    inactive:
      "border-emerald-500/30 text-emerald-600/70 hover:bg-emerald-500/5 hover:text-emerald-600",
  },
  {
    active: "border-amber-500 text-amber-600 bg-amber-500/10",
    inactive:
      "border-amber-500/30 text-amber-600/70 hover:bg-amber-500/5 hover:text-amber-600",
  },
  {
    active: "border-purple-500 text-purple-600 bg-purple-500/10",
    inactive:
      "border-purple-500/30 text-purple-600/70 hover:bg-purple-500/5 hover:text-purple-600",
  },
  {
    active: "border-cyan-500 text-cyan-600 bg-cyan-500/10",
    inactive:
      "border-cyan-500/30 text-cyan-600/70 hover:bg-cyan-500/5 hover:text-cyan-600",
  },
];

export default function POSMenuGrid({
  categories,
  activeCategory,
  setActiveCategory,
  onAddProduct,
}) {
  // Find products for the currently selected category
  const activeProducts =
    categories.find((c) => c.id === activeCategory)?.products || [];

  return (
    <div className="flex flex-col h-full bg-main">
      {/* CATEGORY TABS (Scrollable horizontally) */}
      <div className="flex overflow-x-auto border-b border-subtle bg-surface shrink-0 hide-scrollbar shadow-sm">
        {categories.map((cat, index) => {
          // On assigne une couleur unique basée sur la position de la catégorie
          const colorTheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-8 py-5 whitespace-nowrap font-bold uppercase tracking-widest text-xs transition-all duration-200 border-b-4 ${
                isActive ? colorTheme.active : colorTheme.inactive
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* PRODUCTS GRID (Scrollable vertically) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddProduct(product)}
              className="bg-surface border border-subtle hover:border-brand hover:shadow-lg flex flex-col items-center p-4 transition-all active:scale-95 shadow-sm group"
            >
              <div className="w-full aspect-square bg-main border border-subtle mb-4 p-2 flex justify-center items-center group-hover:border-brand/50 transition-colors">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-t-muted font-bold text-xs uppercase opacity-50">
                    Sans Image
                  </span>
                )}
              </div>
              <h3 className="font-bold text-t-main text-sm text-center leading-tight mb-2 uppercase tracking-wide group-hover:text-brand transition-colors">
                {product.name}
              </h3>
              <p className="bg-main border border-subtle w-full text-center py-2 text-brand font-mono font-bold text-lg mt-auto">
                {product.price.toFixed(2)} DA
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
