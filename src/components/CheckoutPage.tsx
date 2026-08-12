import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, X, ShieldCheck, Smartphone } from "lucide-react";
import { CartItem, Order, Promo } from "../types";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useShop } from "../contexts/ShopContext";
import { toast } from "react-hot-toast";

interface CheckoutPageProps {
  onAddOrder: (order: Order) => void;
  promos: Promo[];
}

export default function CheckoutPage({ onAddOrder, promos }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shop = useShop();
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (shop?.cart && shop.cart.length > 0) return shop.cart;
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
  
  const [isSTKPromptOpen, setIsSTKPromptOpen] = useState<boolean>(false);
  const [stkStatus, setStkStatus] = useState<"not_sent" | "waiting_pin" | "verifying" | "success" | "failed">("not_sent");
  const [generatedOrderId, setGeneratedOrderId] = useState<string>("");
  const [activePromo, setActivePromo] = useState<Promo | null>(null);

  // Auto-fill customer profile details for logged in users
  useEffect(() => {
    if (user) {
      if (user.user_metadata?.full_name) setCheckoutName(user.user_metadata.full_name);
      if (user.user_metadata?.phone) setCheckoutPhone(user.user_metadata.phone);
      if (user.email) setCheckoutEmail(user.email);
      if (user.user_metadata?.address) setCheckoutEstate(user.user_metadata.address);
    }
  }, [user]);

  useEffect(() => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/dashboard");
    }
  }, [cart, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const promoDiscount = activePromo ? Math.floor(subtotal * (activePromo.discountPercent / 100)) : 0;
  
  const isCbd = checkoutCounty === "Nairobi" && ["Starehe", "CBD", "City Square", "Kamukunji"].includes(checkoutSubCounty);
  const isFreeStandard = checkoutCounty === "Nairobi" && !isCbd && subtotal >= 3000;
  const deliveryFee = isCbd || isFreeStandard ? 0 : (checkoutCounty === "Nairobi" ? 300 : 500);
  const total = subtotal - promoDiscount + deliveryFee;

  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [pollTimer, setPollTimer] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(120);
  const [countdownTimer, setCountdownTimer] = useState<any>(null);
  const [currentAccountRef, setCurrentAccountRef] = useState<string>("");

  // Helper to generate 12-character Safaricom-compliant Account Reference (e.g. AF2608110024)
  const generateAccountReference = (rawSeq: string) => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD (6 chars)
    const seq = rawSeq.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0'); // 4 chars
    return `AF${dateStr}${seq}`.slice(0, 12).toUpperCase();
  };

  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [pollTimer, countdownTimer]);

  const checkOrderPaymentStatus = async (orderId: string, isManualCheck = false) => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('payment_status, status, mpesa_receipt')
        .eq('id', orderId)
        .maybeSingle();

      if (data && (data.payment_status === "paid" || data.status === "paid")) {
        if (pollTimer) clearInterval(pollTimer);
        if (countdownTimer) clearInterval(countdownTimer);
        setStkStatus("success");
        toast.success(`Payment Received! M-Pesa Receipt: ${data.mpesa_receipt || 'Confirmed'}`);
        localStorage.removeItem("aloeflora_active_stk");
        
        // Clear cart
        if (shop?.clearCart) {
          shop.clearCart();
        } else {
          setCart([]);
          localStorage.removeItem("aloeflora_cart");
        }

        setTimeout(() => {
          setIsSTKPromptOpen(false);
          setStkStatus("not_sent");
          navigate("/dashboard");
        }, 2000);
        return true;
      }

      // If manual button click and still pending, query Daraja Gateway directly
      if (isManualCheck && checkoutRequestId) {
        toast.loading("Querying M-Pesa gateway...", { id: "mpesa-query" });
        const res = await fetch("/api/mpesa/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestID: checkoutRequestId })
        });
        const queryRes = await res.json();
        toast.dismiss("mpesa-query");

        if (queryRes.success) {
          setStkStatus("success");
          toast.success("Payment confirmed from M-Pesa Gateway!");
          localStorage.removeItem("aloeflora_active_stk");
          if (shop?.clearCart) shop.clearCart();
          setTimeout(() => {
            setIsSTKPromptOpen(false);
            setStkStatus("not_sent");
            navigate("/dashboard");
          }, 2000);
          return true;
        } else if (queryRes.details?.ResultDesc) {
          toast.error(`M-Pesa Status: ${queryRes.details.ResultDesc}`);
        } else {
          toast.error("Payment still pending. Please enter your M-Pesa PIN on your phone handset.");
        }
      }
    } catch (err) {
      console.error("Error polling order status:", err);
    }
    return false;
  };

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutPhone) {
      toast.error("Please fill in contact info!");
      return;
    }

    const rawId = Math.floor(100000 + Math.random() * 900000).toString();
    const orderId = "ORD-" + rawId;
    const accountRef = generateAccountReference(rawId);
    setGeneratedOrderId(rawId);
    setCurrentAccountRef(accountRef);
    setIsSTKPromptOpen(true);
    setStkStatus("verifying");
    setCountdown(120);

    // 1. Create Pending Order in Supabase
    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice,
        selectedVariant: item.selectedVariant
      })),
      subtotal: subtotal - promoDiscount,
      deliveryFee: deliveryFee,
      total: total,
      paymentMethod: "mpesa_stk",
      paymentStatus: "pending",
      deliveryStatus: "pending",
      county: checkoutCounty,
      subCounty: checkoutSubCounty,
      estate: checkoutEstate,
      building: checkoutBuilding,
      houseNumber: checkoutHouseNum,
      customerName: checkoutName,
      email: checkoutEmail,
      phone: checkoutPhone,
      deliveryNotes: checkoutNotes
    };

    try {
      await supabase.from('orders').insert({
        id: newOrder.id,
        customer_name: newOrder.customerName,
        phone: newOrder.phone,
        email: newOrder.email,
        county: newOrder.county,
        sub_county: newOrder.subCounty,
        estate: newOrder.estate,
        building: newOrder.building,
        house_number: newOrder.houseNumber,
        delivery_notes: newOrder.deliveryNotes,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        delivery_fee: newOrder.deliveryFee,
        total_amount: newOrder.total,
        payment_method: newOrder.paymentMethod,
        status: "pending",
        payment_status: "pending",
        delivery_status: newOrder.deliveryStatus
      });
    } catch (err) {
      console.error("Supabase order insert error:", err);
    }

    onAddOrder(newOrder);

    // Store active pending order in localStorage for Customer Dashboard synchronization
    localStorage.setItem("aloeflora_active_stk", JSON.stringify({
      orderId: orderId,
      accountRef: accountRef,
      phone: checkoutPhone,
      amount: total,
      rawId: rawId,
      createdAt: new Date().toISOString()
    }));

    // 2. Trigger Real STK Push via Backend API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: checkoutPhone, amount: total, orderId, accountRef }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success) {
        setStkStatus("waiting_pin");
        if (data.checkoutRequestID) {
          setCheckoutRequestId(data.checkoutRequestID);
          await supabase.from('orders').update({ checkout_request_id: data.checkoutRequestID }).eq('id', orderId);
        }
        
        // Start polling Supabase for payment callback
        if (pollTimer) clearInterval(pollTimer);
        const timer = setInterval(() => checkOrderPaymentStatus(orderId), 3000);
        setPollTimer(timer);

        // Start countdown timer
        if (countdownTimer) clearInterval(countdownTimer);
        const cdTimer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(cdTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setCountdownTimer(cdTimer);
      } else {
        setStkStatus("failed");
        toast.error(data.error || "Failed to send STK Push to phone");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("STK Push call error:", err);
      setStkStatus("failed");
      if (err.name === 'AbortError') {
        toast.error("M-Pesa Gateway timeout. Make sure Express server (node server.js) is running on port 3001.");
      } else {
        toast.error("Failed to connect to M-Pesa gateway.");
      }
    }
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

              {/* Production Paybill Summary Card */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-900 text-white p-6 rounded-2xl border border-emerald-800 shadow-xl space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-800/80">
                  <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> M-Pesa Paybill Checkout
                  </span>
                  <span className="text-[10px] bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">Official Safaricom Merchant</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-emerald-300/80 block text-[11px] font-medium">Paybill Number</span>
                    <strong className="text-xl font-mono tracking-widest text-white">4160861</strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px] font-medium">Business Name</span>
                    <strong className="text-sm font-semibold text-white">Aloe Flora Products Ltd</strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px] font-medium">STK Account Reference</span>
                    <strong className="text-sm font-mono text-emerald-300 bg-emerald-900/90 px-2 py-1 rounded inline-block mt-0.5 border border-emerald-700">
                      {generateAccountReference("1234")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-emerald-300/80 block text-[11px] font-medium">Total Amount</span>
                    <strong className="text-xl font-extrabold text-emerald-400">KES {total}</strong>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-200/90 bg-emerald-900/40 p-3 rounded-xl border border-emerald-800/60 leading-relaxed">
                  ✓ Clicking <strong>Pay KES {total} Now</strong> sends an automated M-Pesa prompt to <strong>{checkoutPhone}</strong>. You will be prompted to verify the account number matches your order.
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
                <input type="checkbox" required className="mt-1 w-5 h-5 accent-emerald-600" checked={checkoutConsent} onChange={(e) => setCheckoutConsent(e.target.checked)} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  I confirm that my billing details are correct, and I explicitly agree to the ALOEFLORA PRODUCTS{" "}
                  <Link to="/policies/privacy" target="_blank" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/policies/terms" target="_blank" className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                    Terms of Service
                  </Link>.
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

        {/* Right Column: Order Summary with Interactive Steppers */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl sticky top-24">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Order Summary</h3>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
              </span>
            </div>
            
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mb-6 scrollbar-hide">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.selectedVariant}`} className="flex gap-3 bg-white dark:bg-gray-800/60 p-2.5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 items-center">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                    <img 
                      src={item.selectedVariantObj?.imageUrl || item.product.imageUrl?.split(',')[0] || 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg'} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://apnmunmhlrpcbmjmywyh.supabase.co/storage/v1/object/public/images/product_fscsf9o1nk_1786355189795.jpeg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">{item.product.name}</h4>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                        Size: {item.selectedVariant}
                      </span>
                    )}
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
                      KES {item.product.price * item.quantity}
                    </div>
                  </div>

                  {/* Quantity Stepper inside Checkout Sidebar */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => shop?.updateCartItemQuantity ? shop.updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity - 1) : null}
                      className="w-5 h-5 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded text-xs"
                    >-</button>
                    <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => shop?.updateCartItemQuantity ? shop.updateCartItemQuantity(item.product.id, item.selectedVariant, item.quantity + 1) : null}
                      className="w-5 h-5 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded text-xs"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">KES {subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `KES ${deliveryFee}`}</span>
              </div>
              {checkoutCounty === "Nairobi" && isCbd && (
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-lg text-center">CBD Starehe Free Delivery Applied!</div>
              )}
              {checkoutCounty === "Nairobi" && !isCbd && subtotal >= 3000 && (
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-lg text-center">Subtotal &gt; KES 3,000! Standard Delivery Free!</div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-800">
                <span>Total</span>
                <span className="text-emerald-700 dark:text-emerald-400">KES {total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Inline M-Pesa Payment Overlay */}
      {isSTKPromptOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-gray-100 dark:border-gray-800 text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Accent Bar */}
            <div className="bg-emerald-600 h-1.5 absolute top-0 left-0 right-0"></div>

            {stkStatus === "verifying" && (
              <div className="py-8 space-y-6">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                  <RefreshCw className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Initiating M-Pesa Payment...</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sending request with Account Ref <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentAccountRef}</span> to {checkoutPhone}</p>
                </div>
              </div>
            )}

            {stkStatus === "waiting_pin" && (
              <div className="space-y-5">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-center items-center gap-2">
                    <span className="inline-block text-[11px] font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full uppercase border border-emerald-200 dark:border-emerald-800">
                      Action Required on Phone
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white pt-1">Check Your Phone Screen</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Enter your M-Pesa PIN for <strong className="text-gray-900 dark:text-white">KES {total}</strong> on <span className="font-semibold text-emerald-600 dark:text-emerald-400">{checkoutPhone}</span>.
                  </p>
                </div>

                {/* Minimal Receipt Summary Card */}
                <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">ORD-{generatedOrderId}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700/50 pt-2">
                    <span className="text-gray-500 dark:text-gray-400">Account Reference</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{currentAccountRef}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700/50 pt-2">
                    <span className="text-gray-500 dark:text-gray-400">Paybill / ShortCode</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">4160861</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-2xl text-left text-xs space-y-1">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Auto-polling payment gateway status...
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    Once you enter your PIN, Safaricom automatically reconciles this payment with order <strong>{currentAccountRef}</strong>.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => checkOrderPaymentStatus("ORD-" + generatedOrderId, true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Verify Payment Status Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pollTimer) clearInterval(pollTimer);
                      if (countdownTimer) clearInterval(countdownTimer);
                      setIsSTKPromptOpen(false);
                      setStkStatus("not_sent");
                      localStorage.removeItem("aloeflora_active_stk");
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-2.5 rounded-2xl text-xs transition cursor-pointer"
                  >
                    Cancel / Pay Later
                  </button>
                </div>
              </div>
            )}

            {stkStatus === "success" && (
              <div className="py-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white">Payment Received!</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Redirecting to your order confirmation...</p>
                </div>
              </div>
            )}

            {stkStatus === "failed" && (
              <div className="py-8 space-y-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto border border-red-200 dark:border-red-800">
                  <X className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Transaction Not Completed</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">We didn't receive your M-Pesa PIN authorization.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setIsSTKPromptOpen(false); setStkStatus("not_sent"); localStorage.removeItem("aloeflora_active_stk"); }} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Retry Payment
                  </button>
                  <button 
                    onClick={() => { setIsSTKPromptOpen(false); setStkStatus("not_sent"); }} 
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
