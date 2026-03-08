"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { Coffee, ShieldCheck, Server, ShoppingCart, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Bill {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  timestamp: string;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [serverVersion, setServerVersion] = useState("Detecting...");
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for Cart & Payments
  const [cart, setCart] = useState<Record<number, number>>({});
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string, totalAmount: number } | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch(`${API_BASE}/version`);
        const data = await res.json();
        setServerVersion(data.version);
      } catch {
        setServerVersion("Offline");
      }
    };

    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/menu`);
        const data = await res.json();
        setMenu(data);
      } catch {
        console.error("Failed to fetch menu");
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
    fetchMenu();

    const intervalId = setInterval(fetchVersion, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Polling logic for Payment Verification
  useEffect(() => {
    if (!pendingOrder) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/check-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: pendingOrder.orderId })
        });
        const data = await res.json();
        if (data.status === "Paid" && data.bill) {
          setOrderStatus("");
          setBill(data.bill);
          setPendingOrder(null);
          setCart({}); // Empty cart after successful payment
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [pendingOrder]);

  const getCartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = menu.find(m => m.id === Number(itemId));
      return total + (item?.price || 0) * qty;
    }, 0);
  };

  const addToCart = (itemId: number) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId]--;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleCheckout = async () => {
    if (getCartCount() === 0) return;
    setIsProcessing(true);
    setOrderStatus("");
    setBill(null);

    const cartData = Object.entries(cart).map(([itemId, quantity]) => ({
      itemId: Number(itemId),
      quantity
    }));

    try {
      const res = await fetch(`${API_BASE}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: cartData, customerName: "Reviewer" })
      });
      const data = await res.json();
      if (res.ok) {
        setPendingOrder({ orderId: data.orderId, totalAmount: data.totalAmount });
        setOrderStatus("Checkout initiated. Waiting for Payment Approval from Admin.");
      } else {
        setOrderStatus(data.error || "Checkout failed");
      }
    } catch {
      setOrderStatus("Checkout failed due to network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 text-gray-800 font-sans pb-24 border-b-8 border-orange-500">
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-orange-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
              <Coffee size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-orange-900 tracking-tight">Nira Premium Tea Stall</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 text-sm font-medium">
              <ShieldCheck size={18} />
              <span className="hidden sm:inline">CI/CD Automated</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!pendingOrder && !bill && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Fresh & Authentic Beverages</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Add items to your cart, and experience our cloud-native simulated checkout flow powered by Azure Container Instances.
            </p>
          </div>
        )}

        {/* Global Status Banner */}
        {orderStatus && !bill && !pendingOrder && (
          <div className="mb-8 p-4 bg-orange-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <span className="font-medium">{orderStatus}</span>
          </div>
        )}

        {/* Simulated QR Payment Screen */}
        {pendingOrder && !bill && (
          <div className="mb-12 bg-white border-2 border-orange-300 rounded-2xl shadow-xl overflow-hidden mx-auto max-w-md animate-in zoom-in slide-in-from-bottom-8">
            <div className="bg-orange-50 text-center py-6 border-b border-orange-100">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Scan to Pay</h3>
              <p className="text-4xl font-extrabold text-orange-600 mb-4">₹{pendingOrder.totalAmount}</p>
              <div className="mx-auto w-56 h-56 bg-white p-3 border-4 border-gray-800 rounded-2xl relative flex items-center justify-center shadow-sm">
                <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50/50">
                  <ShoppingCart size={40} className="text-gray-300 mb-3" />
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">[SIMULATED QR]</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-500 text-sm mb-6">
                Waiting for the Admin to approve the payment....
              </p>
              <div className="w-full py-3.5 bg-gray-100 text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2 shadow-inner text-lg">
                <Loader2 size={20} className="animate-spin" /> Polling Server...
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => setPendingOrder(null)} className="text-gray-400 hover:text-gray-600 font-medium text-sm underline underline-offset-4">
                  Cancel Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Soft Copy Bill Display */}
        {bill && (
          <div className="mb-12 bg-white border-2 border-orange-300 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 mx-auto max-w-lg">
            <div className="bg-orange-500 text-white text-center py-5">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold tracking-widest uppercase mb-1">Soft Copy Receipt</h3>
              <p className="text-orange-100 text-sm opacity-90">Payment fully verified by Server</p>
            </div>
            <div className="p-8">
              <div className="flex justify-between border-b border-gray-100 pb-3 mb-5">
                <span className="text-gray-500 font-medium">Order Reference:</span>
                <span className="text-gray-900 font-bold">{bill.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3 mb-6">
                <span className="text-gray-500 font-medium">Customer:</span>
                <span className="text-gray-900 font-medium">{bill.customerName}</span>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Items Ordered</h4>
                {bill.items?.map((item: OrderItem, idx: number) => (
                  <div key={idx} className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <div className="font-bold text-gray-700">₹{item.subtotal}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end mb-6 pt-5 border-t-2 border-dashed border-orange-200 bg-orange-50/50 -mx-8 px-8 pb-4">
                <div className="text-lg text-gray-800 font-bold">Total Amount Paid</div>
                <div className="font-extrabold text-4xl text-orange-600">₹{bill.totalAmount}</div>
              </div>

              <div className="text-center text-xs font-mono text-gray-400 mt-6 pt-4 border-t border-gray-100">
                {new Date(bill.timestamp).toLocaleString()} • Status: <span className="text-green-500 font-bold uppercase">{bill.status}</span>
              </div>

              <button
                onClick={() => { setBill(null); setOrderStatus(""); }}
                className="mt-8 w-full py-3.5 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold rounded-xl transition-colors active:scale-95 text-lg shadow-sm"
              >
                Start New Order
              </button>
            </div>
          </div>
        )}

        {/* Menu Grid (Only show when not showing Bill or Payment modal) */}
        {!pendingOrder && !bill && (
          loading ? (
            <div className="flex justify-center items-center py-20 text-orange-500">
              <Loader2 className="animate-spin" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menu.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors pr-2">{item.name}</h3>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">₹{item.price}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 h-10 line-clamp-2">{item.description}</p>
                  </div>

                  {cart[item.id] ? (
                    <div className="flex items-center justify-between bg-orange-50 rounded-xl p-1 border border-orange-200 shadow-inner">
                      <button onClick={() => removeFromCart(item.id)} className="w-12 h-12 flex items-center justify-center bg-white text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-lg shadow-sm font-extrabold text-2xl transition-colors select-none">-</button>
                      <span className="font-bold text-orange-900 text-xl w-12 text-center select-none">{cart[item.id]}</span>
                      <button onClick={() => addToCart(item.id)} className="w-12 h-12 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm font-extrabold text-2xl transition-colors select-none">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={!item.inStock || pendingOrder !== null}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!item.inStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                        }`}
                    >
                      {!item.inStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {getCartCount() > 0 && !pendingOrder && !bill && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-orange-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-[100%] pb-safe">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-orange-100 text-orange-600 rounded-2xl hidden sm:block">
                <ShoppingCart size={28} />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {getCartCount()}
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Cart ({getCartCount()} item{getCartCount() !== 1 && 's'})</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">₹{getCartTotal()}</p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-orange-600 hover:bg-orange-700 text-white text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100 w-auto justify-center"
            >
              {isProcessing ? <><Loader2 size={24} className="animate-spin" /> Processing</> : "Checkout"}
            </button>
          </div>
        </div>
      )}

      {/* Blue/Green Deployment Floating Indicator */}
      <div className="fixed bottom-[100px] sm:bottom-6 right-6 flex flex-col items-end gap-2 z-50 pointer-events-none">
        <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/90 px-2 py-1 rounded shadow-sm">
          Active Backend Region
        </div>
        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl shadow-xl backdrop-blur border text-white font-medium transition-colors duration-500 ${serverVersion.includes("blue") ? "bg-blue-600/90 border-blue-400" :
          serverVersion.includes("green") ? "bg-emerald-500/90 border-emerald-400" :
            "bg-gray-800/90 border-gray-600"
          }`}
        >
          <Server size={18} className={serverVersion !== "Offline" ? "animate-pulse" : ""} />
          <span className="text-xs sm:text-sm">Env: <strong className=" tracking-wider">{serverVersion.toUpperCase()}</strong></span>
        </div>
      </div>
    </div>
  );
}
