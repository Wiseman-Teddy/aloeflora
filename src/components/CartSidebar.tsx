import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  Lock, 
  Gift, 
  MessageSquare,
  Tag,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { Promo, Product } from '../types';
import toast from 'react-hot-toast';

interface CartSidebarProps {
  promos: Promo[];
  products?: Product[];
}

export default function CartSidebar({ promos = [], products = [] }: CartSidebarProps) {
  const { cart, isCartOpen, setIsCartOpen, updateCartItemQuantity, removeFromCart, addToCart } = useShop();
  const navigate = useNavigate();

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [activePromo, setActivePromo] = useState<Promo | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.selectedVariantObj?.price || item.product.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const freeDeliveryThreshold = 3000;
  const progressPercent = Math.min(100, Math.floor((subtotal / freeDeliveryThreshold) * 100));
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  const promoDiscount = activePromo ? Math.floor(subtotal * (activePromo.discountPercent / 100)) : 0;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : 250;
  const total = subtotal - promoDiscount + deliveryFee;

  const availablePromos = promos.length > 0 ? promos : [
    { id: "pr-1", code: "ALOE10", discountPercent: 10, isActive: true, createdAt: "2026-08-01T00:00:00.000Z" },
    { id: "pr-2", code: "KARIBU20", discountPercent: 20, isActive: true, createdAt: "2026-08-01T00:00:00.000Z" }
  ];

  const handleApplyPromoCode = (code: string) => {
    if (!code) return;
    const found = availablePromos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    if (found) {
      setActivePromo(found);
      setReferralMessage(`🎉 ${found.code} applied! Saved ${found.discountPercent}%.`);
      toast.success(`Coupon ${found.code} applied!`);
    } else {
      setActivePromo(null);
      setReferralMessage("Invalid or expired promo code.");
      toast.error("Invalid coupon code.");
    }
  };

  const handleRemovePromo = () => {
    setActivePromo(null);
    setReferralMessage("");
    setReferralCodeInput("");
    toast.success("Coupon removed");
  };

  // Smart Add-On Suggestions (Items not currently in cart)
  const cartProductIds = new Set(cart.map(item => item.product.id));
  const suggestedAddOns = products.filter(p => !cartProductIds.has(p.id)).slice(0, 2);

  return (
    <div id="cart-sidebar-backdrop" className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex justify-end">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-250 relative">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsCartOpen(false)}
          className="absolute top-4 left-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-full cursor-pointer text-gray-500 dark:text-gray-300 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-y-auto text-left pt-8 space-y-4 pr-1">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b dark:border-gray-800">
            <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-800 dark:text-emerald-400" /> Shopping Basket
            </h3>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold px-3 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          {/* Dynamic Free Shipping Progress Bar */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {subtotal >= freeDeliveryThreshold ? (
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">🎉 You unlocked FREE Nairobi Delivery!</span>
                ) : (
                  <span>Add <strong className="text-emerald-700 dark:text-emerald-400">KES {amountNeededForFreeDelivery.toLocaleString()}</strong> more for FREE Delivery!</span>
                )}
              </span>
              <span className="text-[11px] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/50 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Your basket is empty</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Explore our handcrafted Kenyan botanical care products and treat your hair & skin.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-[#348C21] hover:bg-[#2b751c] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow transition cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const itemPrice = item.selectedVariantObj?.price || item.product.price;
                const itemImg = item.selectedVariantObj?.imageUrl || item.product.imageUrl?.split(',')[0];

                return (
                  <div key={`${item.product.id}-${item.selectedVariant}`} className="flex items-center gap-3 bg-zinc-50/80 dark:bg-gray-800/50 p-3 rounded-2xl border border-zinc-100 dark:border-gray-800">
                    <div className="h-16 w-16 bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                      <img 
                        src={itemImg || 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg'} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">{item.product.name}</h4>
                      {item.selectedVariant && (
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                          {item.selectedVariant}
                        </span>
                      )}
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                        KES {(itemPrice * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-lg cursor-pointer transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-0.5">
                        <button 
                          onClick={() => updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Special Delivery Notes Collapsible */}
              <div className="pt-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {showNotes ? 'Hide Delivery Note' : '+ Add Special Delivery / Gift Note'}
                </button>
                {showNotes && (
                  <textarea
                    rows={2}
                    placeholder="E.g. Please deliver after 2 PM or call before arrival..."
                    value={deliveryNotes}
                    onChange={(e) => {
                      setDeliveryNotes(e.target.value);
                      localStorage.setItem('aloeflora_cart_notes', e.target.value);
                    }}
                    className="w-full text-xs p-2.5 mt-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                )}
              </div>

              {/* Smart Cross-Sell Recommendations */}
              {suggestedAddOns.length > 0 && (
                <div className="pt-3 border-t dark:border-gray-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Complete Your Care Routine
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedAddOns.map(addon => (
                      <div key={addon.id} className="bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between text-left">
                        <div className="flex gap-2 items-center mb-1">
                          <img 
                            src={addon.imageUrl?.split(',')[0] || 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg'} 
                            alt={addon.name} 
                            className="w-8 h-8 rounded object-cover shrink-0" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg';
                            }}
                          />
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold truncate text-gray-900 dark:text-white">{addon.name}</h5>
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">KES {addon.price}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(addon, 1)}
                          className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-1 text-[10px] rounded-lg transition cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer Summary & Checkout CTA */}
        {cart.length > 0 && (
          <div className="border-t dark:border-gray-800 pt-4 space-y-3 text-left">
            {/* Promo Code Input & One-Click Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-emerald-600" /> Apply Coupon</span>
                {activePromo && (
                  <button onClick={handleRemovePromo} className="text-red-500 hover:underline cursor-pointer text-[10px]">
                    Remove ({activePromo.code})
                  </button>
                )}
              </div>

              {/* Coupon Chips */}
              <div className="flex flex-wrap gap-1.5">
                {availablePromos.map((p) => {
                  const isCurrent = activePromo?.code === p.code;
                  return (
                    <button
                      key={p.id || p.code}
                      type="button"
                      onClick={() => handleApplyPromoCode(p.code)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {isCurrent && <Check className="w-2.5 h-2.5" />}
                      <span>{p.code}</span>
                      <span className="opacity-80">({p.discountPercent}% OFF)</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CUSTOM PROMO CODE"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 bg-gray-50 dark:bg-gray-800 dark:text-white uppercase font-mono"
                />
                <button
                  onClick={() => handleApplyPromoCode(referralCodeInput)}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs uppercase"
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

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-white">KES {subtotal.toLocaleString()}</span>
              </div>
              {activePromo && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg">
                  <span>Coupon Discount ({activePromo.code} - {activePromo.discountPercent}%)</span>
                  <span>-KES {promoDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Estimated Nairobi Delivery</span>
                <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `KES ${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pb-2 border-b dark:border-gray-800 pt-1">
                <span className="dark:text-white">Total</span>
                <span className="text-emerald-800 dark:text-emerald-400 text-base">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full bg-[#348C21] hover:bg-[#2b751c] text-white font-extrabold p-3.5 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wide shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2"
            >
              Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-around pt-1 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/60">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-600" /> M-Pesa Encrypted</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> 100% Organic</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-emerald-600" /> Fast Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
