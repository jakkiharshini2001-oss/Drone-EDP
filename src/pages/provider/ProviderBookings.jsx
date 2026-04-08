import React, { useEffect, useMemo, useState } from "react";
import ProviderLayout from "../../components/provider/ProviderLayout";
import {
  Search,
  Filter,
  CheckCircle2,
  Briefcase,
  User,
  Phone,
  MapPin,
  CalendarDays,
  Clock3,
  Layers3,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

const ProviderBookings = () => {
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("ALL");

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatServiceName = (value) => {
    if (!value) return "Service";
    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };


  useEffect(() => {
    loadCompletedJobs();
  }, []);

  const loadCompletedJobs = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCompletedJobs([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("providers")
        .select("id, lat, lng")
        .eq("id", user.id)
        .maybeSingle();

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", user.id)
        .eq("status", "completed")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      const enrichedBookings = [];

      for (const booking of bookings || []) {
        let cropName = "Unknown Crop";

        if (booking.crop_type) {
          const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              booking.crop_type
            );

          if (isUUID) {
            try {
              const { data: crop, error: cropError } = await supabase
                .from("crop_types")
                .select("name")
                .eq("id", booking.crop_type)
                .limit(1)
                .single();

              if (!cropError && crop?.name) cropName = crop.name;
            } catch (err) {
              console.warn("Crop fetch failed:", err);
            }
          } else {
            cropName = booking.crop_type;
          }
        }

        let farmerLocation = "Location unavailable";
        let farmerName = booking.farmer_name || "Unknown Farmer";
        let farmerPhone = "—";

        if (booking.farmer_id) {
          const { data: farmer } = await supabase
            .from("farmers")
            .select("full_name, contact_phone, mandal_name, district, state")
            .eq("id", booking.farmer_id)
            .maybeSingle();

          if (farmer) {
            farmerName =
              booking.beneficiary_name ||
              farmer.full_name ||
              booking.farmer_name ||
              "Unknown Farmer";

            farmerPhone =
              booking.beneficiary_phone ||
              booking.contact_phone ||
              farmer.contact_phone ||
              "—";

            farmerLocation =
              booking.address_line ||
              [farmer.mandal_name, farmer.district, farmer.state]
                .filter(Boolean)
                .join(", ") ||
              "Location unavailable";
          }
        } else {
          farmerPhone =
            booking.beneficiary_phone || booking.contact_phone || "—";
          farmerLocation = booking.address_line || booking.location || "—";
        }

        const when =
          booking.completed_at ||
          booking.updated_at ||
          booking.scheduled_at ||
          booking.created_at;

        enrichedBookings.push({
          id: booking.id,
          service: formatServiceName(booking.service_type),
          farmer_name: farmerName,
          phone: farmerPhone,
          crop_name: cropName,
          acres: booking.area_size ?? "—",
          location: farmerLocation,
          date: formatDate(when),
          time: formatTime(when),
          status: booking.status,
          total_price: booking.total_price || 0,
        });
      }

      setCompletedJobs(enrichedBookings);
    } catch (err) {
      console.error("Completed jobs load error:", err);
      toast.error("Failed to load completed jobs");
      setCompletedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("provider-completed-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadCompletedJobs();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const serviceOptions = useMemo(() => {
    const unique = [
      ...new Set(completedJobs.map((job) => job.service).filter(Boolean)),
    ];
    return ["ALL", ...unique];
  }, [completedJobs]);

  const stats = useMemo(() => {
    const totalJobs = completedJobs.length;

    const farmersServed = new Set(
      completedJobs.map((job) => job.farmer_name).filter(Boolean)
    ).size;

    const totalAcresCovered = completedJobs.reduce((sum, job) => {
      const acres = parseFloat(job.acres);
      return sum + (Number.isFinite(acres) ? acres : 0);
    }, 0);

    return {
      totalJobs,
      farmersServed,
      totalAcresCovered,
    };
  }, [completedJobs]);

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return completedJobs.filter((job) => {
      const matchesSearch =
        !q ||
        String(job.service).toLowerCase().includes(q) ||
        String(job.farmer_name).toLowerCase().includes(q) ||
        String(job.phone).toLowerCase().includes(q) ||
        String(job.crop_name).toLowerCase().includes(q) ||
        String(job.location).toLowerCase().includes(q);

      const matchesService =
        selectedService === "ALL" || job.service === selectedService;

      return matchesSearch && matchesService;
    });
  }, [completedJobs, searchTerm, selectedService]);

  // Background is now handled by ProviderLayout

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-transparent pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-900/40 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest mb-6">
                    <CheckCircle2 size={14} />
                    Completed Services
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-md uppercase tracking-tighter">
                    Completed Jobs
                  </h1>

                  <p className="text-emerald-50/80 mt-4 max-w-2xl font-medium text-lg leading-relaxed mix-blend-screen">
                    View completed jobs with the exact acres covered and other
                    important booking details.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto xl:min-w-[620px]">
                  <div className="bg-gradient-to-br from-emerald-600/90 to-teal-900/90 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      Completed Jobs
                    </p>
                    <h3 className="text-4xl font-black text-white mt-2 drop-shadow-lg">
                      {stats.totalJobs}
                    </h3>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-600/90 to-teal-900/90 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      Farmers Served
                    </p>
                    <h3 className="text-4xl font-black text-white mt-2 drop-shadow-lg">
                      {stats.farmersServed}
                    </h3>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-600/90 to-teal-900/90 backdrop-blur-md rounded-[2rem] p-6 border border-white/20 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                      Total Acres Covered
                    </p>
                    <h3 className="text-4xl font-black text-white mt-2 drop-shadow-lg">
                      {stats.totalAcresCovered}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="relative flex-1 group">
                <Search
                  size={18}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-emerald-400 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search by service, farmer, phone, crop, location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 pl-14 pr-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white/70 shrink-0 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <Filter size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Service</span>
                </div>

                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="h-14 min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all appearance-none cursor-pointer"
                >
                  {serviceOptions.map((service) => (
                    <option key={service} value={service} className="bg-emerald-900 text-white">
                      {service === "ALL" ? "All Services" : service}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-900/20 pointer-events-none"></div>

            <div className="relative z-10">
              {loading ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/10 animate-pulse mb-4" />
                  <h3 className="text-xl font-bold text-white">
                    Loading completed jobs...
                  </h3>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-300">
                    <Briefcase size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                    No completed jobs found
                  </h3>
                  <p className="text-white/60 mt-2 font-medium">
                    No records match your current filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr className="text-left text-[10px] uppercase font-black tracking-widest text-emerald-300">
                        <th className="px-6 py-5">Service</th>
                        <th className="px-6 py-5">Farmer</th>
                        <th className="px-6 py-5">Phone</th>
                        <th className="px-6 py-5">Crop</th>
                        <th className="px-6 py-5">Acres</th>
                        <th className="px-6 py-5">Location</th>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5">Time</th>
                        <th className="px-6 py-5">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {filteredJobs.map((job, index) => (
                        <tr
                          key={job.id}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-5 font-bold text-white whitespace-nowrap">
                            {job.service}
                          </td>

                          <td className="px-6 py-5 text-white/80 whitespace-nowrap group-hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
                                <User size={14} />
                              </div>
                              <span className="font-semibold">{job.farmer_name}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-white/80 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-emerald-400" />
                              {job.phone}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-white/80 whitespace-nowrap">
                            {job.crop_name}
                          </td>

                          <td className="px-6 py-5 text-white font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Layers3 size={14} className="text-emerald-400" />
                              {job.acres !== "—" ? `${job.acres} acres` : "—"}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-white/80 min-w-[260px]">
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={14}
                                className="text-emerald-400 mt-0.5 shrink-0"
                              />
                              <span className="line-clamp-2">{job.location}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-white/80 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarDays size={14} className="text-emerald-400" />
                              {job.date}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-white/80 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock3 size={14} className="text-emerald-400" />
                              {job.time}
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest shadow-inner">
                              <CheckCircle2 size={12} />
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
};

export default ProviderBookings;