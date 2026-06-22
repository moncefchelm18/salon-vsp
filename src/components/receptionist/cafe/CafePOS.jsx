"use client";
import { useState } from "react";
import { mockCafeItems } from "../../../lib/mockData";
import { Plus, Minus, X, CreditCard } from "lucide-react";

export default function CafePOS() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((ci) => ci.id === item.id);
      if (existingItem) {
        return currentCart.map((ci) =>
          ci.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci,
        );
      }
      return [...currentCart, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((currentCart) => currentCart.filter((ci) => ci.id !== itemId));
  };

  const updateQty = (itemId, amount) => {
    setCart((currentCart) => {
      const newCart = currentCart.map((ci) =>
        ci.id === itemId ? { ...ci, qty: Math.max(1, ci.qty + amount) } : ci,
      );
      return newCart;
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleConfirmPayment = () => {
    alert(`Payment confirmed for DZD ${total.toFixed(2)}!`);
    setCart([]); // Clear cart
  };

  const categories = [...new Set(mockCafeItems.map((item) => item.category))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-10rem)]">
      {/* Menu Items */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 overflow-y-auto">
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-serif text-orange-400 border-b border-slate-700 pb-2 mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockCafeItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <button
                    onClick={() => addToCart(item)}
                    key={item.id}
                    className="bg-slate-800 border border-slate-700 text-left hover:border-orange-500 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-full object-cover"
                    />
                    <div className="p-2">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="font-mono text-orange-400">
                        DZD {item.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      {/* Cart / Order */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-serif text-slate-100">Current Order</h2>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-slate-400">
                  DZD {item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-1">
                <button onClick={() => updateQty(item.id, -1)}>
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-mono text-sm">
                  {item.qty}
                </span>
                <button onClick={() => updateQty(item.id, 1)}>
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <p className="text-center text-slate-500 py-8">Cart is empty</p>
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono text-orange-400">
                DZD {total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900 font-bold py-3 flex items-center justify-center gap-2"
            >
              <CreditCard size={18} /> Confirm Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
