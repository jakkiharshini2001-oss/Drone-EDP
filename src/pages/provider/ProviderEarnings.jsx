import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProviderLayout from "../../components/provider/ProviderLayout";
import {
  TrendingUp,
  Calendar,
  ArrowUpRight,
  User,
  Wallet,
  MapPin,
  RefreshCw
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const isSameLocalDay = (dateValue, compareDate = new Date()) => {
  const d = new Date(dateValue);
  return (
    d.getDate() === compareDate.getDate() &&
    d.getMonth() === compareDate.getMonth() &&
    d.getFullYear() === compareDate.getFullYear()
  );
};

const isSameLocalMonth = (dateValue, compareDate = new Date()) => {
  const d = new Date(dateValue);
  return (
    d.getMonth() === compareDate.getMonth() &&
    d.getFullYear() === compareDate.getFullYear()
  );
};

const ProviderEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providerId, setProviderId] = useState(null);

  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedBookings, setCompletedBookings] = useState([]);

  const realtimeChannelRef = useRef(null);
  const authToastShownRef = useRef(false);

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleString("en-IN", {
        month: "long",
        year: "numeric"
      }),
    []
  );

  const calculateEarnings = useCallback((bookings = []) => {
    const now = new Date();

    let today = 0;
    let month = 0;
    let lifetime = 0;

    const mapped = bookings.map((item) => {
      const amount = Number(item.total_price) || 0;
      lifetime += amount;

      if (item.scheduled_at && isSameLocalDay(item.scheduled_at, now)) {
        today += amount;
      }

      if (item.scheduled_at && isSameLocalMonth(item.scheduled_at, now)) {
        month += amount;
      }

      return {
        id: item.id,
        service: item.service_type || "Service",
        farmer: item.farmer_name || "Farmer",
        amount,
        location: item.address_line || item.district || "—",
        date: formatDate(item.scheduled_at),
        time: formatTime(item.scheduled_at)
      };
    });

    setTodayTotal(today);
    setMonthlyTotal(month);
    setLifetimeTotal(lifetime);
    setCompletedCount(mapped.length);
    setCompletedBookings(mapped);
  }, []);

  const fetchEarnings = useCallback(
    async (showMainLoader = false) => {
      if (!providerId) return;

      if (showMainLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
            id,
            provider_id,
            status,
            service_type,
            scheduled_at,
            total_price,
            farmer_name,
            district,
            address_line
          `
          )
          .eq("provider_id", providerId)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false });

        if (error) {
          console.error("Supabase earnings query error:", error);
          throw error;
        }

        calculateEarnings(data || []);
      } catch (error) {
        console.error("Failed to load provider earnings:", error);
        toast.error(error?.message || "Failed to load earnings");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [providerId, calculateEarnings]
  );

  const loadProvider = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        if (!authToastShownRef.current) {
          toast.error("Authentication failed");
          authToastShownRef.current = true;
        }
        setLoading(false);
        return;
      }

      setProviderId(user.id);
    } catch (error) {
      console.error("Auth load error:", error);
      toast.error("Failed to load provider account");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    if (!providerId) return;
    fetchEarnings(true);
  }, [providerId, fetchEarnings]);

  useEffect(() => {
    if (!providerId) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`provider-earnings-${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${providerId}`
        },
        () => {
          fetchEarnings(false);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [providerId, fetchEarnings]);

  return (
    <ProviderLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300 mb-2">
              Provider Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Earnings Overview
            </h1>
            <p className="mt-2 text-sm text-white/70 max-w-2xl">
              Dynamic provider earnings from completed bookings.
            </p>
          </div>

          <button
            onClick={() => fetchEarnings(false)}
            disabled={loading || refreshing || !providerId}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/20 to-teal-900/30 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center">
                <Wallet size={20} className="text-emerald-300" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Today
              </span>
            </div>

            {loading ? (
              <div className="h-9 w-32 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {formatCurrency(todayTotal)}
              </h2>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <TrendingUp size={15} className="text-emerald-300" />
              <span>{completedCount} completed jobs</span>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-cyan-500/15 to-slate-900/35 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/20 flex items-center justify-center">
                <Calendar size={20} className="text-cyan-300" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                This Month
              </span>
            </div>

            {loading ? (
              <div className="h-9 w-32 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {formatCurrency(monthlyTotal)}
              </h2>
            )}

            <div className="mt-4 text-sm text-white/70">{monthLabel}</div>
          </div>

          <div className="rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-teal-500/15 to-emerald-900/35 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/20 flex items-center justify-center">
                <ArrowUpRight size={20} className="text-teal-300" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200/80">
                Lifetime
              </span>
            </div>

            {loading ? (
              <div className="h-9 w-32 rounded-lg bg-white/10 animate-pulse" />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {formatCurrency(lifetimeTotal)}
              </h2>
            )}

            <div className="mt-4 text-sm text-white/70">
              Total earnings from completed bookings
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-900/20 pointer-events-none" />

          <div className="relative z-10 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  Completed Services
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Earnings list from completed provider bookings
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                  Total Jobs
                </p>
                <p className="text-lg font-semibold text-white">{completedCount}</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 mt-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="h-4 w-40 rounded bg-white/10" />
                        <div className="h-3 w-56 rounded bg-white/10" />
                        <div className="h-3 w-28 rounded bg-white/10" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 w-20 rounded bg-white/10" />
                        <div className="h-3 w-16 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : completedBookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-white text-base font-medium">
                  No completed services yet
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Once bookings are marked completed, provider earnings will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                {completedBookings.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center shrink-0">
                          <ArrowUpRight size={20} className="text-emerald-300" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-base md:text-lg font-semibold text-white truncate">
                            {job.service}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                            <span className="inline-flex items-center gap-1.5">
                              <User size={14} className="text-emerald-300" />
                              {job.farmer}
                            </span>
                            <span className="hidden sm:inline text-white/30">•</span>
                            <span>{job.date}</span>
                            <span className="hidden sm:inline text-white/30">•</span>
                            <span>{job.time}</span>
                          </div>

                          <div className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-white/50">
                            <MapPin size={13} />
                            {job.location}
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right shrink-0">
                        <p className="text-xl md:text-2xl font-bold text-emerald-400">
                          +{formatCurrency(job.amount)}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                          completed earning
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {refreshing && !loading ? (
              <div className="mt-4 text-xs text-white/55">Updating latest earnings…</div>
            ) : null}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
};

export default ProviderEarnings;