import React, { useEffect, useState } from "react";
import ProviderLayout from "../../components/provider/ProviderLayout";
import { TrendingUp, Calendar, ArrowUpRight, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const ProviderEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [completedBookings, setCompletedBookings] = useState([]);
  // Background is now handled by ProviderLayout


  useEffect(() => {
    loadEarnings();
  }, []);

  async function loadEarnings() {
    setLoading(true);

    /* AUTH */
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      toast.error("Authentication failed");
      setLoading(false);
      return;
    }

    const providerId = authData.user.id;

    /* FETCH COMPLETED BOOKINGS */
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        service_type,
        scheduled_at,
        total_price,
        farmer_name,
        village,
        district
      `)
      .eq("provider_id", providerId)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Earnings fetch error:", error);
      toast.error("Failed to load earnings");
      setLoading(false);
      return;
    }

    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todaySum = 0;
    let monthSum = 0;
    let lifetimeSum = 0;

    const rows = (data || []).map((b) => {
      const jobDate = new Date(b.scheduled_at);
      const amount = Number(b.total_price) || 0;

      lifetimeSum += amount;

      if (jobDate.toDateString() === todayStr) {
        todaySum += amount;
      }

      if (
        jobDate.getMonth() === currentMonth &&
        jobDate.getFullYear() === currentYear
      ) {
        monthSum += amount;
      }

      return {
        id: b.id,
        service: b.service_type,
        farmer: b.farmer_name || "Farmer",
        amount,
        location: b.village || b.district || "—",
        date: jobDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: jobDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    setTodayTotal(todaySum);
    setMonthlyTotal(monthSum);
    setLifetimeTotal(lifetimeSum);
    setCompletedCount(rows.length);
    setCompletedBookings(rows);
    setLoading(false);
  }

  return (
    <ProviderLayout>
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <h1 className="text-4xl md:text-5xl font-black mb-10 text-white drop-shadow-md uppercase tracking-tighter">
          Financial Overview
        </h1>
 
        {/* SUMMARY */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
 
          {/* TODAY */}
          <div className="bg-gradient-to-br from-emerald-600/90 to-teal-900/90 border border-white/20 backdrop-blur-md text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Today's Earnings
              </p>
              <h2 className="text-5xl md:text-6xl font-black mt-3 drop-shadow-lg">
                ₹{todayTotal.toLocaleString("en-IN")}
              </h2>
              <div className="mt-6 flex items-center gap-2 text-emerald-100/80 text-sm font-bold tracking-widest uppercase">
                <TrendingUp size={16} className="text-emerald-400" /> {completedCount} Completed Jobs
              </div>
            </div>
          </div>
 
          {/* MONTH */}
          <div className="bg-gradient-to-br from-emerald-600/80 to-teal-900/80 border border-white/20 backdrop-blur-md text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Monthly Revenue
              </p>
              <h2 className="text-4xl md:text-5xl font-black mt-3 drop-shadow-md">
                ₹{monthlyTotal.toLocaleString("en-IN")}
              </h2>
              <div className="mt-6 flex items-center gap-2 text-emerald-100/80 text-sm font-bold tracking-widest uppercase">
                <Calendar size={16} className="text-emerald-400" />
                {new Date().toLocaleString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
 
          {/* LIFETIME */}
          <div className="bg-gradient-to-br from-teal-700/80 to-emerald-900/80 border border-white/20 backdrop-blur-md text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                Lifetime Earnings
              </p>
              <h2 className="text-4xl md:text-5xl font-black mt-3 text-emerald-400 drop-shadow-md">
                ₹{lifetimeTotal.toLocaleString("en-IN")}
              </h2>
              <p className="mt-6 text-emerald-100/80 text-sm font-bold tracking-widest uppercase">
                Total completed jobs revenue
              </p>
            </div>
          </div>
 
        </div>

        {/* COMPLETED SERVICES LIST */}
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-900/20 pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-8 pb-4 border-b border-white/10">
              Completed Services ({completedCount})
            </h3>
 
            {loading ? (
              <p className="text-white/70 font-medium tracking-wide">Loading earnings…</p>
            ) : completedBookings.length === 0 ? (
              <p className="text-white/70 font-medium tracking-wide">
                No completed services yet.
              </p>
            ) : (
              <div className="space-y-4">
                {completedBookings.map((job) => (
                  <div
                    key={job.id}
                    className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-300 shadow-inner group-hover:scale-110 transition-transform">
                        <ArrowUpRight size={24} />
                      </div>
 
                      <div>
                        <p className="font-black text-white text-lg tracking-tight mb-1">
                          {job.service}
                        </p>
 
                        <div className="flex items-center gap-4 text-emerald-100/70 text-sm font-semibold">
                          <span className="flex items-center gap-1.5">
                            <User size={14} className="text-emerald-400" />
                            {job.farmer}
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-xs tracking-widest uppercase">
                            {job.date} • {job.time}
                          </span>
                        </div>
                      </div>
                    </div>
 
                    <div className="text-right">
                      <p className="font-black text-2xl text-emerald-400 drop-shadow-sm mb-1">
                        +₹{job.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        {job.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
};

export default ProviderEarnings;