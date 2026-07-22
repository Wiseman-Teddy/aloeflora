import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, X, ShieldCheck } from "lucide-react";
import { CartItem, Order, Promo } from "../types";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

interface CheckoutPageProps {
  onAddOrder: (order: Order) => void;
  promos: Promo[];
}

export default function CheckoutPage({ onAddOrder, promos }: CheckoutPageProps) {
  const navigate = useNavigate();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("aloeflora_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [checkoutConsent, setCheckoutConsent] = useState<boolean>(false);
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutEmail, setCheckoutEmail] = useState<string>("");
  const [checkoutCounty, setCheckoutCounty] = useState<string>("Nairobi");
  const [checkoutSubCounty, setCheckoutSubCounty] = useState<string>("Westlands");
  const [checkoutEstate, setCheckoutEstate] = useState<string>("");
  const [checkoutBuilding, setCheckoutBuilding] = useState<string>("");
  const [checkoutHouseNum, setCheckoutHouseNum] = useState<string>("");
  const [checkoutNotes, setCheckoutNotes] = useState<string>("");
  
  const [isSTKSimulating, setIsSTKSimulating] = useState<boolean>(false);
  const [mpesaPinInput, setMpesaPinInput] = useState<string>("");
  const [stkStatus, setStkStatus] = useState<"not_sent" | "waiting_pin" | "verifying" | "success" | "failed">("not_sent");
  const [generatedOrderId, setGeneratedOrderId] = useState<string>("");
  const [activePromo, setActivePromo] = useState<Promo | null>(null);

  useEffect(() => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/store");
    }
  }, [cart, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const promoDiscount = activePromo ? Math.floor(subtotal * (activePromo.discountPercent / 100)) : 0;
  
  const isCbd = checkoutCounty === "Nairobi" && ["Starehe", "CBD", "City Square", "Kamukunji"].includes(checkoutSubCounty);
  const isFreeStandard = checkoutCounty === "Nairobi" && !isCbd && subtotal >= 3000;
  const deliveryFee = isCbd || isFreeStandard ? 0 : (checkoutCounty === "Nairobi" ? 300 : 500);
  const total = subtotal - promoDiscount + deliveryFee;

  const handleInitiateSTK = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone) {
      toast.error("Please fill in contact info!");
      return;
    }
    const oId = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOrderId(oId);
    setIsSTKSimulating(true);
    setStkStatus("waiting_pin");
    setMpesaPinInput("");
  };

  const submitStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mpesaPinInput.length !== 4) return;
    setStkStatus("verifying");

    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    
    // 90% success rate
    if (Math.random() > 0.1) {
      setStkStatus("success");
      finalizeOrder();
    } else {
      setStkStatus("failed");
    }
  };

  const finalizeOrder = async () => {
    const newOrder: Order = {
      id: "ORD-" + generatedOrderId,
      date: new Date().toISOString().split('T')[0],
      items: cart,
      total: total,
      status: "processing",
      shippingAddress: `${checkoutHouseNum ? checkoutHouseNum + ', ' : ''}${checkoutBuilding ? checkoutBuilding + ', ' : ''}${checkoutEstate}, ${checkoutSubCounty}, ${checkoutCounty}`,
      customerName: checkoutName,
      customerEmail: checkoutEmail,
      customerPhone: checkoutPhone,
      deliveryNotes: checkoutNotes
    };

    onAddOrder(newOrder);
    
    // Clear cart
    setCart([]);
    localStorage.removeItem("aloeflora_cart");

    setTimeout(() => {
      setIsSTKSimulating(false);
      setStkStatus("not_sent");
      navigate("/dashboard");
      toast.success("Order Placed Successfully!");
    }, 2000);
  };

  if (cart.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Secure Checkout</h1>
        <Link to="/store" className="flex items-center gap-2 text-emerald-700 font-medium hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          {checkoutStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">1</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Contact & Shipping Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Full Name</label>
                  <input type="text" value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} required placeholder="e.g. Amani Wanjiku" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Safaricom Phone Number</label>
                  <input type="text" value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} required placeholder="07XXXXXXXX or 01XXXXXXXX" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Email Address</label>
                  <input type="email" value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="mani@example.com (Optional)" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">County</label>
                  <select value={checkoutCounty} onChange={(e) => setCheckoutCounty(e.target.value)} className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white">
                    <option value="Nairobi">Nairobi</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Machakos">Machakos</option>
                    <option value="Kajiado">Kajiado</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Nakuru">Nakuru</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Sub-County / Area</label>
                  <input type="text" value={checkoutSubCounty} onChange={(e) => setCheckoutSubCounty(e.target.value)} placeholder="e.g. Westlands, Langata" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Estate / Road / Landmark</label>
                  <input type="text" value={checkoutEstate} onChange={(e) => setCheckoutEstate(e.target.value)} placeholder="e.g. Waiyaki Way, Near Safaricom" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">House / Room</label>
                  <input type="text" value={checkoutHouseNum} onChange={(e) => setCheckoutHouseNum(e.target.value)} placeholder="e.g. Apt A4" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-gray-500">Delivery Notes</label>
                  <input type="text" value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} placeholder="e.g. Ring bell at gate" className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 dark:text-white" />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    if(!checkoutName || !checkoutPhone || !checkoutSubCounty) {
                      toast.error("Please fill required fields (Name, Phone, Sub-County).");
                      return;
                    }
                    setCheckoutStep(2);
                  }}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-4 rounded-xl transition cursor-pointer shadow-md"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {checkoutStep === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">2</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Payment & Confirmation</h3>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-700"><ShieldCheck className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">M-Pesa STK Push Integration</h4>
                    <p className="text-sm text-gray-500 mt-1">A payment request will be sent securely to <strong>{checkoutPhone}</strong>. Please have your phone ready to enter your M-Pesa PIN.</p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
                <input type="checkbox" required className="mt-1 w-5 h-5 accent-emerald-600" checked={checkoutConsent} onChange={(e) => setCheckoutConsent(e.target.checked)} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I confirm that my billing details are correct, and I explicitly agree to the ALOEFLORA PRODUCTS Privacy Policy and Terms of Service.
                </span>
              </label>

              <div className="flex gap-4">
                <button onClick={() => setCheckoutStep(1)} className="w-1/3 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-xl font-bold transition">
                  Back
                </button>
                <button onClick={handleInitiateSTK} disabled={!checkoutConsent} className={`w-2/3 font-bold p-4 rounded-xl text-white shadow-lg transition ${checkoutConsent ? 'bg-emerald-800 hover:bg-emerald-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}>
                  Pay KES {total} Now
                </button>
              </div>
             </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">Order Summary</h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-6 scrollbar-hide">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.selectedVariant}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img src={item.product.imageUrl?.split(',')[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-sm">
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2">{item.product.name}</h4>
                    <div className="text-gray-500 text-xs mt-1">Qty: {item.quantity} {item.selectedVariant ? `| ${item.selectedVariant}` : ''}</div>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">KES {item.product.price * item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">KES {subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">{deliveryFee === 0 ? 'FREE' : `KES ${deliveryFee}`}</span>
              </div>
              {checkoutCounty === "Nairobi" && isCbd && (
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-center">CBD Starehe Free Delivery Applied!</div>
              )}
              {checkoutCounty === "Nairobi" && !isCbd && subtotal >= 3000 && (
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-center">Subtotal &gt; KES 3,000! Standard Delivery Free!</div>
              )}
              <div className="flex justify-between text-xl font-extrabold text-gray-900 dark:text-white pt-4 border-t border-gray-200 dark:border-gray-800">
                <span>Total</span>
                <span className="text-emerald-700 dark:text-emerald-500">KES {total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa STK Modal */}
      {isSTKSimulating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-800 text-center">
            <div className="bg-emerald-600 h-1 absolute top-0 left-0 right-0"></div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-emerald-600/10 text-emerald-500 font-bold px-3 py-1 rounded-full text-xs uppercase flex items-center gap-1.5 border border-emerald-500/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Safaricom Daraja v2.0
              </div>

              {stkStatus === "waiting_pin" && (
                <div className="space-y-4 w-full">
                  <h4 className="font-bold text-emerald-400">Lipa Na M-Pesa STK Push</h4>
                  
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-left space-y-3 font-mono text-xs">
                    <div className="text-gray-400 border-b border-gray-800 pb-2">STK Push Message Dialog:</div>
                    <div className="text-emerald-400 font-bold">Pay Bill: 174379 (ALOEFLORA PRODUCTS)</div>
                    <div>Account No: ORD-{generatedOrderId}</div>
                    <div>Amount: KES {total}</div>
                    <div className="text-gray-400">Enter Your 4-Digit M-Pesa Secret PIN:</div>
                    
                    <div className="flex justify-center gap-3 py-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className={`w-3.5 h-3.5 rounded-full border border-gray-700 ${mpesaPinInput.length > idx ? "bg-emerald-500 shadow-emerald-500/30 shadow" : "bg-gray-900"}`}></div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={submitStkPush} className="grid grid-cols-3 gap-2 text-sm font-bold">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "Submit"].map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => {
                          if (btn === "C") setMpesaPinInput("");
                          else if (btn === "Submit" && mpesaPinInput.length === 4) submitStkPush({ preventDefault: () => {} } as any);
                          else if (typeof btn === "number" && mpesaPinInput.length < 4) setMpesaPinInput(prev => prev + btn);
                        }}
                        className={`p-3 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-800 transition ${btn === "Submit" ? "text-emerald-400 col-span-1" : ""}`}
                      >
                        {btn}
                      </button>
                    ))}
                  </form>
                </div>
              )}

              {stkStatus === "verifying" && (
                <div className="py-8 space-y-4">
                  <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
                  <div className="font-bold text-lg animate-pulse text-emerald-400">Verifying Transaction...</div>
                </div>
              )}

              {stkStatus === "success" && (
                <div className="py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                    <ShieldCheck className="w-8 h-8 text-black" />
                  </div>
                  <div className="font-bold text-2xl text-emerald-400">Payment Successful!</div>
                </div>
              )}

              {stkStatus === "failed" && (
                <div className="py-8 space-y-4">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                    <X className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-bold text-xl text-red-400">Transaction Cancelled or Failed</div>
                  <button onClick={() => { setIsSTKSimulating(false); setStkStatus("not_sent"); }} className="bg-gray-800 text-white font-bold px-6 py-2 rounded-full text-xs">
                    Retry Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
