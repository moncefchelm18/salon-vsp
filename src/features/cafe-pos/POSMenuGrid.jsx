import React from "react";

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
    <div className="flex flex-col h-full bg-main select-none">
      {/* ONGLETS DES CATÉGORIES TACTILES */}
      <div className="flex overflow-x-auto border-b border-subtle bg-surface p-3 gap-2 shrink-0 hide-scrollbar shadow-sm">
        {categories.map((cat, index) => {
          const colorTheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3.5 whitespace-nowrap font-bold uppercase tracking-widest text-xs transition-all duration-200 border rounded-none cursor-pointer ${
                isActive ? colorTheme.active : colorTheme.base
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* GRILLE DES ARTICLES TACTILES (SANS RUPTURE NI STOCK BLOQUANT) */}
      <div className="flex-1 overflow-y-auto p-4 bg-main">
        {activeProducts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-t-muted font-bold text-xs uppercase tracking-widest">
            Aucun article dans cette catégorie
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {activeProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onAddProduct(product)}
                className="bg-surface border border-subtle hover:border-brand hover:bg-brand/5 p-4 flex flex-col justify-between text-left transition-all active:scale-[0.98] shadow-sm group min-h-[95px] relative overflow-hidden rounded-none cursor-pointer"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase text-t-muted block mb-1">
                    {product.category?.name || "Cafétéria"}
                  </span>
                  <h3 className="font-bold text-xs uppercase leading-tight line-clamp-2 text-t-main group-hover:text-brand">
                    {product.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-subtle/50 flex justify-between items-end w-full">
                  <span className="text-brand font-mono font-bold text-base">
                    {Number(product.price).toFixed(2)} DA
                  </span>
                  <span className="text-[9px] font-bold uppercase text-t-muted bg-main px-2 py-0.5 border border-subtle">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
