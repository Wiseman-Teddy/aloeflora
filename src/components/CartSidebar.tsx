import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Trash2, Minus, Plus, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { Promo } from '../types';

interface CartSidebarProps {
  promos: Promo[];
}

export default function CartSidebar({ promos }: CartSidebarProps) {
  const { cart, isCartOpen, setIsCartOpen, updateCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [activePromo, setActivePromo] = useState<Promo | null>(null);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const promoDiscount = activePromo ? Math.floor(subtotal * (activePromo.discountPercent / 100)) : 0;
  const deliveryFee = subtotal >= 3000 ? 0 : 250;

  const applyReferral = () => {
    if (!referralCodeInput) return;
    const promo = promos.find(p => p.code.toUpperCase() === referralCodeInput.toUpperCase() && p.isActive);
    if (promo) {
      setActivePromo(promo);
      setReferralMessage(`Valid code! ${promo.discountPercent}% off applied.`);
    } else {
      setActivePromo(null);
      setReferralMessage("Invalid or expired promo code.");
    }
  };

  return (
    <div id="cart-sidebar-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-250 relative">
        <button 
          onClick={() => setIsCartOpen(false)}
          className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full cursor-pointer text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto text-left pt-10">
          <div className="flex items-center justify-between pb-4 border-b dark:border-gray-800">
            <h3 className="text-md font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-800" /> Shopping Basket
            </h3>
            <span className="text-xs bg-emerald-50 text-emerald-900 border font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mt-2">Your basket is empty</h4>
              <p className="text-xs text-gray-500 mt-1">Add items from our premium range to start.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.selectedVariant}`} className="flex items-center gap-3 bg-zinc-50/50 dark:bg-gray-800/50 p-3 rounded-xl border border-zinc-100/60 dark:border-gray-800">
                  <div className="h-12 w-12 bg-white rounded-lg overflow-hidden border dark:border-gray-700">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">{item.product.name}</h4>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-gray-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded font-bold">
                        {item.selectedVariant}
                      </span>
                    )}
                    <div className="text-xs font-semibold text-emerald-800 mt-1">KES {item.product.price * item.quantity}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded cursor-pointer transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded bg-transparent">
                      <button 
                        onClick={() => updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity - 1)}
                        className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity + 1)}
                        className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t dark:border-gray-800 pt-4 space-y-4 text-left">
            <div className="space-y-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-700 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white uppercase"
                />
                <button
                  onClick={applyReferral}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg transition cursor-pointer text-xs uppercase"
                >
                  Apply
                </button>
              </div>
              {referralMessage && (
                <div className={`text-[10px] font-bold ${activePromo ? 'text-emerald-600' : 'text-red-500'}`}>
                  {referralMessage}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Retail Subtotal</span>
                <span className="font-bold">KES {subtotal}</span>
              </div>
              {activePromo && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Discount ({activePromo.discountPercent}%)</span>
                  <span>-KES {promoDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Nairobi Delivery</span>
                <span>KES {deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pb-2 border-b dark:border-gray-800">
                <span className="dark:text-white">Est. Total</span>
                <span className="dark:text-white">KES {subtotal - promoDiscount + deliveryFee}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3.5 rounded-xl transition cursor-pointer text-xs uppercase tracking-wide shadow flex items-center justify-center gap-1.5"
            >
              Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
