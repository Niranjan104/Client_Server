"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function AdminPage() {
    const [orderLogs, setOrderLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/orders`);
            const data = await res.json();
            setOrderLogs(data);
        } catch {
            console.error("Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Auto refresh every 5 seconds for convenience
        const intervalId = setInterval(fetchLogs, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleApprove = async (orderId: string) => {
        setApprovingId(orderId);
        try {
            const res = await fetch(`${API_BASE}/admin/approve-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
            });
            if (res.ok) {
                // Refresh logs to show it as paid
                await fetchLogs();
            } else {
                alert("Failed to approve payment");
            }
        } catch (err) {
            alert("Network error approving payment");
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24">
            <header className="bg-gray-900 shadow-md sticky top-0 z-10 border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-white">
                        <ShieldCheck size={28} strokeWidth={2.5} className="text-orange-500" />
                        <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
                    </div>
                    <button onClick={fetchLogs} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-bold text-sm shadow-sm transition-colors">
                        Refresh Feed
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Order Feed</h2>
                        <p className="text-gray-500">View and approve payments for customer orders.</p>
                    </div>
                    <a href="/" target="_blank" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4 pointer-events-auto">
                        Open Client Store
                    </a>
                </div>

                {loading && orderLogs.length === 0 ? (
                    <div className="flex justify-center py-20 text-orange-500"><Loader2 className="animate-spin" size={48} /></div>
                ) : orderLogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200 font-medium shadow-sm">
                        No orders have been placed yet.
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8">
                        {orderLogs.map((log, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono font-bold text-gray-900 drop-shadow-sm">{log.orderId}</span>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider ${log.status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800 shadow-sm"}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 font-medium">Customer: <span className="text-gray-700">{log.customerName}</span> • {new Date(log.timestamp).toLocaleString()}</p>

                                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Items:</p>
                                        {log.items?.map((item: any, i: number) => (
                                            <div key={i} className="text-sm text-gray-700 flex justify-between">
                                                <span><span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}</span>
                                                <span className="text-gray-400 font-mono">₹{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                                    <div className="text-left md:text-right w-full mb-4 md:mb-0">
                                        <span className="text-xs text-gray-400 uppercase font-bold tracking-widest block mb-1">Total Amount</span>
                                        <span className="text-3xl font-extrabold text-orange-600">₹{log.totalAmount}</span>
                                        {log.paidAt && <span className="text-xs text-green-600 font-medium mt-2 flex items-center justify-start md:justify-end gap-1"><CheckCircle size={14} /> Paid: {new Date(log.paidAt).toLocaleTimeString()}</span>}
                                    </div>

                                    {log.status === "Unpaid" ? (
                                        <button
                                            onClick={() => handleApprove(log.orderId)}
                                            disabled={approvingId === log.orderId}
                                            className="w-full mt-auto py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70"
                                        >
                                            {approvingId === log.orderId ? <><Loader2 size={18} className="animate-spin" /> Approving...</> : <><ShieldCheck size={18} /> Approve Payment</>}
                                        </button>
                                    ) : (
                                        <div className="w-full mt-auto py-3 px-4 bg-gray-100 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-gray-200">
                                            <CheckCircle size={18} /> Payment Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
