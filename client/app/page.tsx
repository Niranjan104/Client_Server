"use client";
import { useState, useEffect } from "react";
import { Coffee, ShieldCheck, Server, Send, Loader2 } from "lucide-react";

// Move API_BASE outside the component so it doesn't trigger useEffect dependency warnings
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [serverVersion, setServerVersion] = useState("Detecting...");
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fetch Server Version for Blue/Green proof
    const fetchVersion = async () => {
      try {
        const res = await fetch(`${API_BASE}/version`);
        const data = await res.json();
        setServerVersion(data.version);
      } catch {
        setServerVersion("Offline");
      }
    };

    // 2. Fetch the Tea Stall Menu
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/menu`);
        const data = await res.json();
        setMenu(data);
      } catch {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch menu");
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
    fetchMenu();

    // Poll the version every 2 seconds so reviewers can see the Blue-Green swap happen LIVE!
    const intervalId = setInterval(fetchVersion, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const placeOrder = async (item: MenuItem) => {
    setOrderingId(item.id);
    setOrderStatus("");

    try {
      const res = await fetch(`${API_BASE}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, quantity: 1, customerName: "Reviewer" })
      });
      const data = await res.json();
      setOrderStatus(data.message);
    } catch {
      setOrderStatus("Order failed.");
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 text-gray-800 font-sans pb-20">

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-orange-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg text-white">
              <Coffee size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-orange-900 tracking-tight">Niranjan&apos;s Tea Stall</h1>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 text-sm font-medium">
            <ShieldCheck size={18} />
            <span>CI/CD Automated</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Fresh & Authentic Beverages</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our cloud-native tea stall. Orders are processed instantly via our backend API containers.
          </p>
        </div>

        {/* Status Messages */}
        {orderStatus && (
          <div className="mb-8 p-4 bg-green-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <ShieldCheck size={20} />
            <span className="font-medium">{orderStatus}</span>
          </div>
        )}

        {/* Menu Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-orange-500">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menu.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">₹{item.price}</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 h-10">{item.description}</p>

                <button
                  onClick={() => placeOrder(item)}
                  disabled={!item.inStock || orderingId === item.id}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${!item.inStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                    }`}
                >
                  {orderingId === item.id ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : !item.inStock ? (
                    'Out of Stock'
                  ) : (
                    <><Send size={18} /> Order Now</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Blue/Green Deployment Floating Indicator */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/80 px-2 py-1 rounded shadow-sm">
          Active Backend Region
        </div>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 text-white font-medium text-lg transition-colors duration-500 ${serverVersion.includes("blue") ? "bg-blue-600/90" :
          serverVersion.includes("green") ? "bg-emerald-500/90" :
            "bg-gray-800/90"
          }`}
        >
          <Server size={24} className={serverVersion !== "Offline" ? "animate-pulse" : ""} />
          <span>Connected to: <strong>{serverVersion.toUpperCase()}</strong></span>
        </div>
      </div>
    </div>
  );
}