import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { CheckCircle, MapPin, Search, Tractor } from "lucide-react";

const SearchingForProvider = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  /* ================= STATES ================= */
  const [status, setStatus] = useState("searching");
  const [providerDetails, setProviderDetails] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [providersNotified, setProvidersNotified] = useState(0);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [currentRadius, setCurrentRadius] = useState(0);

  /* ================= FORMAT DATE TIME ================= */
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  /* ================= RADIUS STAGE HELPER ================= */
  const getRadiusStage = (radius) => {
    if (radius >= 30) return 2;
    if (radius >= 20) return 1;
    if (radius >= 10) return 0;
    return -1;
  };

  const radiusStages = [
    { km: 10, label: "10 km", timeLabel: "0 – 30 min" },
    { km: 20, label: "20 km", timeLabel: "After 30 min" },
    { km: 30, label: "30 km", timeLabel: "After 60 min" }
  ];

  /* ================= INITIAL BOOKING LOAD ================= */
  useEffect(() => {
    if (!id) { navigate("/my-bookings"); return; }

    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings").select("*").eq("id", id).single();

      if (error || !data) return;

      /* Crop Name */
      let cropName = "Unknown Crop";
      if (data.crop_type) {
        const { data: crop } = await supabase
          .from("crop_types").select("name").eq("id", data.crop_type).single();
        if (crop) cropName = crop.name;
      }

      /* Farmer Location */
      let location = null;
      if (data.farmer_id) {
        const { data: farmer } = await supabase
          .from("farmers").select("mandal_name, district, state")
          .eq("id", data.farmer_id).single();
        if (farmer) {
          location = {
            mandal: farmer.mandal_name,
            district: farmer.district,
            state: farmer.state
          };
        }
      }

      setFarmerLocation(location);
      setRequestDetails({ ...data, crop_name: cropName });
      setCurrentRadius(data.current_radius ?? 0);
      setProvidersNotified((data.notified_providers || []).length);

      /* If already accepted when page loads */
      if (data.status === "accepted" && data.provider_id) {
        const { data: provider } = await supabase
          .from("providers")
          .select("full_name, phone_number, mandal_name")
          .eq("id", data.provider_id).single();
        setProviderDetails(provider);
        setStatus("found");
      }
    };

    fetchBooking();
  }, [id, navigate]);

  /* ================= REALTIME LISTENER ================= */
  useEffect(() => {
    const channel = supabase
      .channel(`booking_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${id}`
        },
        async (payload) => {
          const updated = payload.new;

          /* Update radius and notified count live */
          setCurrentRadius(updated.current_radius ?? 0);
          setProvidersNotified((updated.notified_providers || []).length);

          const newStatus = updated.status;

          /* Provider accepted */
          if (newStatus === "accepted" && updated.provider_id) {
            const { data } = await supabase
              .from("providers")
              .select("full_name, phone_number, mandal_name")
              .eq("id", updated.provider_id).single();
            setProviderDetails(data);
            setStatus("found");
            setTimeout(() => { navigate("/my-bookings"); }, 3000);
          }

          /* Reassignment */
          if (newStatus === "reassigning" || newStatus === "requested") {
            setStatus("searching");
            setProviderDetails(null);
          }

          /* Cancelled */
          if (newStatus === "cancelled") {
            navigate("/my-bookings");
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, navigate]);

  /* ================= CANCEL SEARCH ================= */
  const handleCancelSearch = async () => {
    await supabase
      .from("bookings")
      .update({ status: "cancelled", request_status: "cancelled" })
      .eq("id", id);
    navigate("/my-bookings");
  };

  /* ================= DERIVED ================= */
  const currentStage = getRadiusStage(currentRadius);
  const isWaiting = currentStage === -1;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">

      {status === "searching" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] bg-green-500/10 rounded-full animate-ping" />
          <div className="w-[450px] h-[450px] bg-green-500/5 rounded-full animate-ping absolute" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-md text-center mt-20">

        {/* ================= SEARCHING ================= */}
        {status === "searching" && (
          <div className="flex flex-col items-center">

            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-8 border-2 border-green-500">
              <Search size={40} className="animate-pulse" />
            </div>

            <h2 className="text-3xl font-black mb-2">Searching Operators</h2>
            <p className="text-white mb-8">
              Broadcasting your request to nearby drone operators
            </p>

            {/* BOOKING DETAILS */}
            {requestDetails && (
              <div className="bg-slate-800 border border-slate-700 w-full p-6 rounded-3xl mb-4 text-left">
                <p className="text-xs text-black mb-4 uppercase text-white">Booking Details</p>

                <div className="flex justify-between mb-2">
                  <span>Crop</span>
                  <span className="font-semibold">{requestDetails.crop_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Land Area</span>
                  <span className="font-semibold">{requestDetails.area_size} Acres</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Date & Time</span>
                  <span className="font-semibold">{formatDateTime(requestDetails.scheduled_at)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Location</span>
                  <span className="font-semibold">
                    {farmerLocation
                      ? `${farmerLocation.mandal}, ${farmerLocation.district}, ${farmerLocation.state}`
                      : "Location not available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Price</span>
                  <span className="font-bold text-green-400">₹{requestDetails.total_price}</span>
                </div>
              </div>
            )}

            {/* PROVIDERS NOTIFIED */}
            <div className="bg-slate-800 border border-slate-700 w-full p-4 rounded-3xl mb-4">
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <Tractor size={16} />
                {providersNotified} operators notified
              </div>
            </div>

            {/* RADIUS EXPANSION PROGRESS */}
            <div className="bg-slate-800 border border-slate-700 w-full p-5 rounded-3xl mb-4">

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white">Search Radius</p>
                <p className="text-2xl font-black text-green-400">
                  {isWaiting ? "—" : `${currentRadius} km`}
                </p>
              </div>

              {/* Waiting — edge function hasn't run yet */}
              {isWaiting && (
                <div className="text-center py-3">
                  <p className="text-xs text-black animate-pulse">
                    ⏳ Initialising search... operators will be notified shortly
                  </p>
                </div>
              )}

              {/* Stage progress bar */}
              {!isWaiting && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    {radiusStages.map((stage, i) => (
                      <React.Fragment key={stage.km}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                            ${i <= currentStage
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                              : "bg-slate-700 text-white"
                            }`}>
                            {stage.km}
                          </div>
                          <span className={`text-xs ${i <= currentStage ? "text-white" : "text-white"}`}>
                            km
                          </span>
                        </div>
                        {i < radiusStages.length - 1 && (
                          <div className={`flex-1 h-1 rounded-full transition-all ${i < currentStage ? "bg-green-500" : "bg-slate-700"
                            }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {radiusStages.map((stage, i) => (
                      <div key={stage.km}
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl transition-all
                          ${i === currentStage
                            ? "bg-green-500/10 border border-green-500/30"
                            : i < currentStage
                              ? "opacity-50"
                              : "opacity-30"
                          }`}>
                        <span className={i <= currentStage ? "text-white font-semibold" : "text-white"}>
                          {i === currentStage ? "🔵 Active" : i < currentStage ? "✅ Done" : "⏳ Next"}
                          {" "}{stage.label}
                        </span>
                        <span className="text-white">{stage.timeLabel}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="text-xs text-white mt-3 text-center">
                Radius expands automatically every 30 min if no operator responds
              </p>
            </div>

            <button
              onClick={handleCancelSearch}
              className="w-full py-4 bg-slate-800 border border-slate-700 rounded-2xl font-bold hover:bg-red-500/20"
            >
              Cancel Search
            </button>

          </div>
        )}

        {/* ================= PROVIDER FOUND ================= */}
        {status === "found" && (
          <div className="flex flex-col items-center">

            <div className="w-28 h-28 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl">
              <CheckCircle size={50} />
            </div>

            <h2 className="text-4xl font-black mb-2">Operator Found!</h2>
            <p className="text-green-400 mb-8">Your request has been accepted</p>

            <div className="bg-white text-black w-full p-8 rounded-3xl text-left">
              <p className="text-xs text-black mb-4 uppercase">Operator Details</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-xl font-black text-black">
                  {providerDetails?.full_name?.charAt(0) || "D"}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{providerDetails?.full_name}</h3>
                  <p className="text-sm text-black">{providerDetails?.phone_number}</p>
                  <div className="flex items-center gap-1 text-black text-sm mt-1">
                    <MapPin size={14} />
                    {providerDetails?.mandal_name}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-black mt-6">Redirecting to bookings...</p>

          </div>
        )}

      </div>
    </div>
  );
};

export default SearchingForProvider;