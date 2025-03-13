'use client';

import { useEffect, useState,useCallback } from 'react';

export default function Home() {
    const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
    const [coupon, setCoupon] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");
    const [availableCoupons, setAvailableCoupons] = useState<string[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [totalCoupons, setTotalCoupons] = useState<number>(0);
    const pageSize = 12; // Match API

    useEffect(() => {
        fetchCoupons();
    }, [page, searchQuery]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (timeRemaining && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining((prev) => (prev ? prev - 1 : 0));
            }, 1000);
        } else {
            if (timer) clearInterval(timer);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [timeRemaining]);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch(`/api/coupon?page=${page}&search=${searchQuery}`);
            const data = await res.json();
            setAvailableCoupons(data.coupons.map((c: { code: string }) => c.code));
            setTotalCoupons(data.totalCoupons);
        } catch (error) {
            console.error("Error fetching coupons:", error);
        }
    }, [page, searchQuery]); // ✅ Dependencies added here
    
    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]); // ✅ No warning now!

    const claimCoupon = async () => {
        if (!selectedCoupon) {
            setMessage("Please select a coupon.");
            return;
        }

        try {
            const res = await fetch('/api/claim', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ couponCode: selectedCoupon }),
            });

            const data = await res.json();
            if (res.ok) {
                setCoupon(data.code);
                setTimeRemaining(null);

                // Remove claimed coupon from list immediately
                setAvailableCoupons((prev) => prev.filter((code) => code !== selectedCoupon));
                setSelectedCoupon(null);
            } else if (res.status === 429) {
                setTimeRemaining(data.timeRemaining);
            }
            setMessage(data.message);
            // @typescript-eslint/no-unused-vars
        } catch (error) {
            console.error("Claim Coupon Error:", error);
        }
    };
   
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-100 to-blue-200 p-6">
            <div className="bg-white shadow-2xl rounded-3xl p-8 max-w-lg w-full transform transition duration-300 hover:shadow-xl">
                <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-4">
                    🎟️ Claim Your Coupon
                </h1>

                {/* 🔎 Search Bar */}
                <input
                    type="text"
                    placeholder="🔍 Search coupons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4 text-black focus:ring-2 focus:ring-blue-400 outline-none"
                />

                {availableCoupons.length > 0 ? (
                    <select 
                        value={selectedCoupon || ""} 
                        onChange={(e) => setSelectedCoupon(e.target.value)} 
                        className="w-full px-4 py-2 border rounded-lg mb-4 text-black bg-gray-100"
                    >
                        <option value="" disabled>Select a coupon</option>
                        {availableCoupons.map((code, index) => (
                            <option key={index} value={code}>{code}</option>
                        ))}
                    </select>
                ) : (
                    <p className="text-center text-gray-500 mb-4">No coupons available 😞</p>
                )}

                <button 
                    onClick={claimCoupon} 
                    disabled={timeRemaining !== null && timeRemaining > 0 || availableCoupons.length === 0}
                    className={`w-full px-5 py-3 font-semibold rounded-lg transition duration-300 
                        ${timeRemaining 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:scale-105"}
                    `}
                >
                    {timeRemaining ? `⏳ Wait ${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s` : "🎁 Claim Coupon"}
                </button>

                {coupon && (
                    <p className="mt-4 text-center text-lg text-green-600 font-semibold">
                        🎉 Your Coupon Code: <span className="font-bold">{coupon}</span>
                    </p>
                )}
                {message && (
                    <p className={`mt-4 text-center text-lg font-medium ${message.includes('wait') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </p>
                )}

                {/* 💎 Beautiful Coupon Grid with Pagination & Search */}
                <h2 className="mt-6 text-xl font-semibold text-gray-700">🎟️ Available Coupons:</h2>
                <div className="mt-3 border-t border-gray-300 max-h-64 overflow-y-auto p-2">
                    {availableCoupons.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3 p-2">
                            {availableCoupons.map((code, index) => (
                                <div 
                                    key={index} 
                                    className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center font-bold rounded-xl shadow-md hover:scale-105 transition cursor-pointer"
                                >
                                    {code}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 mt-3">No coupons available 😞</p>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between mt-6">
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage((prev) => prev - 1)}
                        className="px-5 py-2 bg-blue-300 rounded-md disabled:opacity-50 hover:bg-blue-400 transition text-black"
                    >
                        ⬅️ Previous
                    </button>
                    <button 
                        disabled={page * pageSize >= totalCoupons} 
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-5 py-2 bg-blue-300 rounded-md disabled:opacity-50 hover:bg-blue-400 transition text-black"
                    >
                        Next ➡️
                    </button>
                </div>
            </div>
        </div>
    );
}
