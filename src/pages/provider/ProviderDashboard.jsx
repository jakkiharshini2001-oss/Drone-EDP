import React, { useState, useEffect, useCallback } from "react";
import ProviderLayout from "../../components/provider/ProviderLayout";
import {
  Users,
  MapPin,
  Calendar,
  Eye,
  Building2,
  Tractor,
  Sprout,
  Leaf,
  Star,
  Navigation,
  CheckCircle2,
  Clock3,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function ProviderDashboard() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [busyDates, setBusyDates] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);

  const [activeFilter, setActiveFilter] = useState("requested");
  const [requests, setRequests] = useState([]);
  const [providerId, setProviderId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userName, setUserName] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [busyConflict, setBusyConflict] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  /* OTP */
  const [otpModal, setOtpModal] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  /* Cancel reason */
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const hasAll =
      lat1 !== null &&
      lat1 !== undefined &&
      lon1 !== null &&
      lon1 !== undefined &&
      lat2 !== null &&
      lat2 !== undefined &&
      lon2 !== null &&
      lon2 !== undefined;

    if (!hasAll) return null;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

  const patchRequest = useCallback((bookingId, patch) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === bookingId ? { ...item, ...patch } : item))
    );
    setSelectedRequest((prev) =>
      prev && prev.id === bookingId ? { ...prev, ...patch } : prev
    );
    setBusyConflict((prev) =>
      prev && prev.id === bookingId ? { ...prev, ...patch } : prev
    );
    setOtpModal((prev) =>
      prev && prev.booking?.id === bookingId
        ? { ...prev, booking: { ...prev.booking, ...patch } }
        : prev
    );
  }, []);

  const removeRequest = useCallback((bookingId) => {
    setRequests((prev) => prev.filter((item) => item.id !== bookingId));
    setSelectedRequest((prev) => (prev && prev.id === bookingId ? null : prev));
    setBusyConflict((prev) => (prev && prev.id === bookingId ? null : prev));
    setOtpModal((prev) => (prev && prev.booking?.id === bookingId ? null : prev));
  }, []);

  const buildVisibleBookings = useCallback(async (rows, profileData, user) => {
    const enrichedBookings = [];

    for (const booking of rows || []) {
      let distanceKm = null;

      if (
        profileData?.lat != null &&
        profileData?.lng != null &&
        booking.latitude != null &&
        booking.longitude != null
      ) {
        distanceKm = calculateDistance(
          profileData.lat,
          profileData.lng,
          booking.latitude,
          booking.longitude
        );
      }

      const notified = Array.isArray(booking.notified_providers)
        ? booking.notified_providers
        : [];

      const isAssignedToMe = booking.provider_id === user.id;

      const isDirectAssignedBooking =
        isAssignedToMe &&
        (booking.status === "requested" ||
          booking.status === "reassigning" ||
          booking.request_status === "assigned");

      const isAdminBooking =
        booking.booking_source === "admin" && isAssignedToMe;

      const isBroadcastForMe =
        (booking.status === "requested" || booking.status === "reassigning") &&
        booking.provider_id === null &&
        notified.map(String).includes(String(user.id));

      if (!isAssignedToMe && !isBroadcastForMe) continue;
      if (booking.cancelled_provider_id === user.id) continue;

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

      if (booking.farmer_id) {
        const { data: farmer } = await supabase
          .from("farmers")
          .select("mandal_name,district,state")
          .eq("id", booking.farmer_id)
          .maybeSingle();

        if (farmer) {
          farmerLocation = [farmer.mandal_name, farmer.district, farmer.state]
            .filter(Boolean)
            .join(", ");
        }
      }

      enrichedBookings.push({
        ...booking,
        crop_name: cropName,
        farmer_location: booking.address_line || farmerLocation,
        distance_km: distanceKm,
        is_admin_booking: isAdminBooking,
        is_direct_assigned_booking: isDirectAssignedBooking,
        is_dispatch_notified:
          !isAssignedToMe &&
          (booking.status === "requested" || booking.status === "reassigning") &&
          notified.map(String).includes(String(user.id)),
      });
    }

    return enrichedBookings;
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setProviderId(user.id);

      const { data: profileData } = await supabase
        .from("providers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setUserName(profileData.full_name || "");
      }

      const { data: ratedBookings } = await supabase
        .from("bookings")
        .select("rating")
        .eq("provider_id", user.id)
        .eq("status", "completed")
        .not("rating", "is", null);

      if (ratedBookings?.length) {
        const avg =
          ratedBookings.reduce((sum, b) => sum + Number(b.rating || 0), 0) /
          ratedBookings.length;
        setAvgRating(avg.toFixed(1));
        setTotalRatings(ratedBookings.length);
      } else {
        setAvgRating(null);
        setTotalRatings(0);
      }

      const { data: providerBookings } = await supabase
        .from("bookings")
        .select("scheduled_at")
        .eq("provider_id", user.id)
        .in("status", ["accepted", "ongoing"]);

      if (providerBookings) {
        setBusyDates(
          providerBookings.map((b) =>
            new Date(b.scheduled_at).toLocaleDateString("en-CA")
          )
        );
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Bookings fetch error:", error);
        return;
      }

      const visibleBookings = await buildVisibleBookings(data, profileData, user);
      setRequests(visibleBookings);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }, [buildVisibleBookings]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let debounceTimer;

    const channel = supabase
      .channel("provider-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadDashboard();
          }, 350);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const updateProviderLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setUpdatingLocation(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("User not found");
      setUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const { error } = await supabase
          .from("providers")
          .update({
            lat,
            lng,
          })
          .eq("id", user.id);

        if (error) {
          toast.error("Location update failed");
        } else {
          setProfile((prev) => (prev ? { ...prev, lat, lng } : prev));
          toast.success("Location updated successfully");
          loadDashboard();
        }

        setUpdatingLocation(false);
      },
      (err) => {
        toast.error("Allow location access");
        console.error(err);
        setUpdatingLocation(false);
      }
    );
  };

  const handleAccept = async (booking) => {
    if (acceptingId === booking.id) return;

    const bookingDate = new Date(booking.scheduled_at).toISOString().split("T")[0];
    const isBusy = busyDates.includes(bookingDate);

    if (isBusy) {
      setBusyConflict(booking);
      return;
    }

    try {
      setAcceptingId(booking.id);

      const acceptedAt = new Date().toISOString();

      if (booking.is_direct_assigned_booking) {
        const { error } = await supabase
          .from("bookings")
          .update({
            status: "accepted",
            request_status: "assigned",
            accepted_at: acceptedAt,
          })
          .eq("id", booking.id)
          .eq("provider_id", providerId)
          .in("status", ["requested", "reassigning"]);

        if (error) {
          toast.error(error.message || "Could not accept assigned booking");
          loadDashboard();
          return;
        }

        patchRequest(booking.id, {
          status: "accepted",
          request_status: "assigned",
          accepted_at: acceptedAt,
        });

        const newBusyDate = new Date(booking.scheduled_at).toLocaleDateString("en-CA");
        setBusyDates((prev) =>
          prev.includes(newBusyDate) ? prev : [...prev, newBusyDate]
        );

        toast.success("Request Accepted");
        loadDashboard();
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .update({
          status: "accepted",
          request_status: "assigned",
          accepted_at: acceptedAt,
          provider_id: providerId,
          provider_name: userName,
          cancelled_provider_id: null,
        })
        .eq("id", booking.id)
        .is("provider_id", null)
        .in("status", ["requested", "reassigning"])
        .select();

      if (error) {
        toast.error(error.message || "Could not accept booking");
        loadDashboard();
        return;
      }

      if (!data || data.length === 0) {
        toast.error("This booking is no longer available");
        loadDashboard();
        return;
      }

      patchRequest(booking.id, {
        ...booking,
        status: "accepted",
        request_status: "assigned",
        accepted_at: acceptedAt,
        provider_id: providerId,
        provider_name: userName,
        cancelled_provider_id: null,
      });

      const newBusyDate = new Date(booking.scheduled_at).toLocaleDateString("en-CA");
      setBusyDates((prev) =>
        prev.includes(newBusyDate) ? prev : [...prev, newBusyDate]
      );

      toast.success("Request Accepted");
      loadDashboard();
    } catch (err) {
      console.error("Accept booking error:", err);
      toast.error("Could not accept booking");
      loadDashboard();
    } finally {
      setAcceptingId(null);
    }
  };

  const directStartAdminJob = async (booking) => {
    patchRequest(booking.id, {
      status: "ongoing",
      start_otp: null,
    });

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "ongoing",
        start_otp: null,
      })
      .eq("id", booking.id)
      .eq("provider_id", providerId)
      .select();

    if (error || !data?.length) {
      toast.error(error?.message || "Failed to start job");
      loadDashboard();
      return;
    }

    toast.success("Agency job started");
    loadDashboard();
  };

  const directCompleteAdminJob = async (booking) => {
    patchRequest(booking.id, {
      status: "completed",
      complete_otp: null,
    });

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        complete_otp: null,
      })
      .eq("id", booking.id)
      .eq("provider_id", providerId)
      .select();

    if (error || !data?.length) {
      toast.error(error?.message || "Failed to complete job");
      loadDashboard();
      return;
    }

    toast.success("Agency job completed");
    loadDashboard();
  };

  const handleStartJob = async (booking) => {
    if (booking.is_admin_booking) {
      await directStartAdminJob(booking);
      return;
    }

    const otp = generateOtp();

    setOtpInput("");
    setOtpError("");
    setOtpLoading(false);
    setOtpModal({ booking: { ...booking, start_otp: otp }, type: "start" });

    patchRequest(booking.id, { start_otp: otp });

    const { error } = await supabase
      .from("bookings")
      .update({ start_otp: otp })
      .eq("id", booking.id)
      .eq("provider_id", providerId);

    if (error) {
      toast.error("Failed to generate OTP: " + error.message);
      setOtpModal(null);
      patchRequest(booking.id, { start_otp: null });
      return;
    }
  };

  const completeJob = async (booking) => {
    if (booking.is_admin_booking) {
      await directCompleteAdminJob(booking);
      return;
    }

    const otp = generateOtp();

    setOtpInput("");
    setOtpError("");
    setOtpLoading(false);
    setOtpModal({ booking: { ...booking, complete_otp: otp }, type: "complete" });

    patchRequest(booking.id, { complete_otp: otp });

    const { error } = await supabase
      .from("bookings")
      .update({ complete_otp: otp })
      .eq("id", booking.id)
      .eq("provider_id", providerId);

    if (error) {
      toast.error("Failed to generate OTP: " + error.message);
      setOtpModal(null);
      patchRequest(booking.id, { complete_otp: null });
      return;
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpModal) return;

    if (otpInput.trim().length !== 4) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const { data: freshBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("id, start_otp, complete_otp, status, provider_id")
        .eq("id", otpModal.booking.id)
        .maybeSingle();

      if (fetchError) {
        setOtpError("Error fetching booking: " + fetchError.message);
        return;
      }

      const expectedOtp =
        otpModal.type === "start"
          ? freshBooking?.start_otp ?? otpModal.booking.start_otp
          : freshBooking?.complete_otp ?? otpModal.booking.complete_otp;

      if (!expectedOtp) {
        setOtpError("OTP expired. Please try again.");
        return;
      }

      if (otpInput.trim() !== String(expectedOtp).trim()) {
        setOtpError(
          "Incorrect OTP. Ask the farmer to check their My Bookings page."
        );
        return;
      }

      if (otpModal.type === "start") {
        patchRequest(otpModal.booking.id, {
          status: "ongoing",
          start_otp: null,
        });

        const { data: updated, error } = await supabase
          .from("bookings")
          .update({ status: "ongoing", start_otp: null })
          .eq("id", otpModal.booking.id)
          .eq("provider_id", providerId)
          .select();

        if (error || !updated?.length) {
          setOtpError(error?.message || "Update failed");
          loadDashboard();
          return;
        }

        toast.success("Job Started! ✅");
      } else {
        patchRequest(otpModal.booking.id, {
          status: "completed",
          complete_otp: null,
        });

        const { data: updated, error } = await supabase
          .from("bookings")
          .update({ status: "completed", complete_otp: null })
          .eq("id", otpModal.booking.id)
          .eq("provider_id", providerId)
          .select();

        if (error || !updated?.length) {
          setOtpError(error?.message || "Update failed");
          loadDashboard();
          return;
        }

        toast.success("Job Completed! 🎉");
      }

      setOtpModal(null);
      setOtpInput("");
      setOtpError("");
      loadDashboard();
    } catch (err) {
      console.error("OTP verify error:", err);
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelOtp = async () => {
    const modal = otpModal;
    setOtpModal(null);
    setOtpInput("");
    setOtpError("");
    setOtpLoading(false);

    if (!modal) return;

    const field = modal.type === "start" ? "start_otp" : "complete_otp";

    patchRequest(modal.booking.id, { [field]: null });

    await supabase
      .from("bookings")
      .update({ [field]: null })
      .eq("id", modal.booking.id)
      .eq("provider_id", providerId);
  };

  const openCancelModal = (booking) => {
    setCancelModal(booking);
    setCancelReason("");
    setCancelLoading(false);
  };

  const closeCancelModal = () => {
    if (cancelLoading) return;
    setCancelModal(null);
    setCancelReason("");
  };

  const handleConfirmCancelService = async () => {
    if (!cancelModal) return;

    const trimmedReason = cancelReason.trim();

    if (!trimmedReason) {
      toast.error("Please enter cancellation reason");
      return;
    }

    try {
      setCancelLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not found");
        return;
      }

      const previousNotified = Array.isArray(cancelModal.notified_providers)
        ? cancelModal.notified_providers
        : [];

      const restartedNotified = previousNotified.filter(
        (id) => String(id) !== String(user.id)
      );

      removeRequest(cancelModal.id);

      const payload = {
        status: "reassigning",
        provider_id: null,
        provider_name: null,
        decline_reason: trimmedReason,
        cancelled_provider_id: user.id,
        reassignment_started_at: new Date().toISOString(),
        request_status: "broadcasting",
        accepted_at: null,
        start_otp: null,
        complete_otp: null,
        notified_providers: restartedNotified,
      };

      const { data, error } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", cancelModal.id)
        .eq("provider_id", user.id)
        .select();

      if (error) {
        toast.error(error.message || "Cancellation failed");
        loadDashboard();
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Cancellation failed");
        loadDashboard();
        return;
      }

      setBusyDates((prev) => {
        const cancelledDate = new Date(cancelModal.scheduled_at).toLocaleDateString(
          "en-CA"
        );
        return prev.filter((d) => d !== cancelledDate);
      });

      toast.success("Service cancelled. Reassignment started.");
      setCancelModal(null);
      setCancelReason("");
      loadDashboard();
    } catch (err) {
      console.error("Cancel service error:", err);
      toast.error(err.message || "Something went wrong while cancelling");
      loadDashboard();
    } finally {
      setCancelLoading(false);
    }
  };

  const navigateToFarm = (booking) => {
    if (!booking.latitude || !booking.longitude) {
      toast.error("Location not available");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`,
      "_blank"
    );
  };

  const counts = {
    requested: requests.filter(
      (r) => r.status === "requested" || r.status === "reassigning"
    ).length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    ongoing: requests.filter((r) => r.status === "ongoing").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === "requested") {
      return r.status === "requested" || r.status === "reassigning";
    }
    return r.status === activeFilter;
  });

  const filterButtons = [
    {
      key: "requested",
      label: "Requested",
      icon: Clock3,
      count: counts.requested,
    },
    {
      key: "accepted",
      label: "Accepted",
      icon: CheckCircle2,
      count: counts.accepted,
    },
    {
      key: "ongoing",
      label: "Ongoing",
      icon: Tractor,
      count: counts.ongoing,
    },
    {
      key: "completed",
      label: "Completed",
      icon: Star,
      count: counts.completed,
    },
  ];

  return (
    <ProviderLayout>
      <div className="min-h-screen pt-24 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-[#eef8ea] via-[#f7fbf2] to-[#e2f3db]">
        <style>{`
          .provider-calendar {
            width: 100%;
            border: none !important;
            background: transparent !important;
            font-family: inherit;
          }

          .provider-calendar .react-calendar__navigation {
            margin-bottom: 12px;
          }

          .provider-calendar .react-calendar__navigation button {
            color: #14532d;
            min-width: 38px;
            background: #f0fdf4;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
          }

          .provider-calendar .react-calendar__navigation button:hover {
            background: #dcfce7 !important;
          }

          .provider-calendar .react-calendar__month-view__weekdays {
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 800;
            color: #3f6212;
            margin-bottom: 8px;
          }

          .provider-calendar .react-calendar__tile {
            height: 46px;
            border-radius: 14px;
            font-weight: 700;
            color: #1f2937;
            position: relative;
            background: white;
            margin: 3px 0;
          }

          .provider-calendar .react-calendar__tile:enabled:hover {
            background: #dcfce7 !important;
            color: #14532d !important;
          }

          .provider-calendar .react-calendar__tile--now {
            background: #fef3c7 !important;
            color: #92400e !important;
          }

          .provider-calendar .calendar-booked {
            background: #ef4444 !important;
            color: white !important;
          }

          .provider-calendar .calendar-today {
            background: #facc15 !important;
            color: #111827 !important;
          }

          .provider-calendar .calendar-dot {
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 9999px;
            display: block;
            margin: 2px auto 0;
          }
        `}</style>

        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6 rounded-[28px] border border-green-200 bg-gradient-to-r from-green-700 via-emerald-700 to-lime-700 p-6 md:p-8 text-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
              <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-lime-200" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full mb-4 backdrop-blur-sm">
                  <Leaf size={16} />
                  <span className="text-sm font-semibold">Agri Provider Dashboard</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                  Welcome, {userName || "Provider"} 👋
                </h1>
                <p className="text-green-50/90 mt-2 text-sm md:text-base">
                  Manage farmer requests, track service days, and complete field work smoothly.
                </p>

                {profile && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm font-medium">
                      <MapPin size={15} />
                      {[profile.mandal_name, profile.district, profile.state]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={updateProviderLocation}
                  className="px-5 py-3 rounded-2xl bg-white text-green-800 font-bold shadow-md hover:bg-green-50 transition"
                >
                  📍 {updatingLocation ? "Updating..." : "Update Location"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {filterButtons.map((item) => {
                  const Icon = item.icon;
                  const active = activeFilter === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveFilter(item.key)}
                      className={`rounded-[24px] border p-4 text-left transition-all shadow-sm ${
                        active
                          ? "bg-gradient-to-br from-green-700 to-emerald-700 text-white border-green-700 shadow-lg scale-[1.01]"
                          : "bg-white border-green-100 hover:border-green-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                            active ? "bg-white/15" : "bg-green-50"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <span
                          className={`text-2xl font-extrabold ${
                            active ? "text-white" : "text-green-800"
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          active ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-5">
                {filteredRequests.length === 0 && (
                  <div className="bg-white border border-green-100 rounded-[28px] p-10 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <Sprout className="text-green-700" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                      No {activeFilter} requests
                    </h3>
                    <p className="text-slate-500 mt-2">
                      New service requests will appear here when available.
                    </p>
                  </div>
                )}

                {filteredRequests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-[30px] border border-green-100 bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="h-2 bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500" />

                    <div className="p-5 md:p-6">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {r.is_admin_booking ? (
                              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                <Building2 size={12} />
                                Agency Request from Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                <Leaf size={12} />
                                Farmer Booking
                              </span>
                            )}

                            {r.is_dispatch_notified && (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                <Radio size={12} />
                                Notified in Dispatch
                              </span>
                            )}

                            {r.status === "reassigning" && (
                              <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                                🔄 Reassignment started
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-extrabold text-slate-900">
                            {r.service_type}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            <div className="flex items-start gap-3 rounded-2xl bg-[#f8fbf5] border border-green-100 px-4 py-3">
                              <Users className="text-green-700 mt-0.5" size={18} />
                              <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                  Customer
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                  {r.is_admin_booking ? (
                                    <>
                                      {r.contact_person_name || "Admin Booking"}
                                      <span className="ml-2 text-xs text-blue-600 font-semibold">
                                        (via Admin)
                                      </span>
                                    </>
                                  ) : r.beneficiary_name ? (
                                    <>
                                      {r.beneficiary_name}
                                      <span className="ml-2 text-xs text-green-700 font-semibold">
                                        via {r.farmer_name}
                                      </span>
                                    </>
                                  ) : (
                                    r.farmer_name || "—"
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl bg-[#f8fbf5] border border-green-100 px-4 py-3">
                              <Calendar className="text-green-700 mt-0.5" size={18} />
                              <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                  Scheduled Time
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                  {formatDateTime(r.scheduled_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl bg-[#f8fbf5] border border-green-100 px-4 py-3">
                              <Sprout className="text-green-700 mt-0.5" size={18} />
                              <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                  Crop & Area
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                  {r.crop_name || "—"} · {r.area_size || "—"} Acres
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-2xl bg-[#f8fbf5] border border-green-100 px-4 py-3">
                              <MapPin className="text-green-700 mt-0.5" size={18} />
                              <div>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                  Distance
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                  {r.distance_km
                                    ? `${r.distance_km} km away`
                                    : "Distance unavailable"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-lime-50 border border-lime-100 px-4 py-3">
                            <p className="text-xs text-lime-700 font-semibold uppercase tracking-wide mb-1">
                              Field Location
                            </p>
                            <p className="text-sm font-medium text-slate-700">
                              {r.is_admin_booking
                                ? r.address_line || "—"
                                : r.farmer_location || "—"}
                            </p>
                          </div>

                          {r.agency_name && r.is_admin_booking && (
                            <div className="mt-3 text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">
                                Agency:
                              </span>{" "}
                              {r.agency_name}
                            </div>
                          )}
                        </div>

                        <div className="w-full xl:w-[240px] flex flex-col gap-3">
                          <div className="rounded-2xl bg-green-50 border border-green-100 px-4 py-3">
                            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">
                              Provider Earnings
                            </p>
                            <p className="text-2xl font-extrabold text-green-900 mt-1">
                              ₹{Number(r.total_price || 0).toFixed(2)}
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedRequest(r)}
                            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                          >
                            <Eye size={16} />
                            View Details
                          </button>

                          <button
                            onClick={() => navigateToFarm(r)}
                            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                          >
                            <Navigation size={16} />
                            Navigate
                          </button>

                          {(r.status === "requested" || r.status === "reassigning") &&
                            (() => {
                              const bookingDate = new Date(r.scheduled_at)
                                .toISOString()
                                .split("T")[0];
                              const isBusy = busyDates.includes(bookingDate);

                              return (
                                <button
                                  disabled={acceptingId === r.id}
                                  onClick={() => {
                                    if (isBusy) {
                                      setBusyConflict(r);
                                      return;
                                    }
                                    handleAccept(r);
                                  }}
                                  className={`w-full py-3 rounded-2xl text-white font-bold disabled:opacity-60 transition ${
                                    r.is_admin_booking
                                      ? "bg-indigo-600 hover:bg-indigo-700"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  {acceptingId === r.id
                                    ? "Accepting..."
                                    : r.is_direct_assigned_booking
                                    ? "Accept Assigned Job"
                                    : r.status === "reassigning"
                                    ? "Accept Reassigned Job"
                                    : r.is_admin_booking
                                    ? "Accept Agency Job"
                                    : "Accept Booking"}
                                </button>
                              );
                            })()}

                          {r.status === "accepted" && (
                            <>
                              <button
                                onClick={() => handleStartJob(r)}
                                className={`w-full py-3 rounded-2xl text-white font-bold transition ${
                                  r.is_admin_booking
                                    ? "bg-indigo-600 hover:bg-indigo-700"
                                    : "bg-amber-500 hover:bg-amber-600"
                                }`}
                              >
                                {r.is_admin_booking ? "Start Job" : "Start Job (OTP)"}
                              </button>

                              <button
                                onClick={() => openCancelModal(r)}
                                className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
                              >
                                Cancel Service
                              </button>
                            </>
                          )}

                          {r.status === "ongoing" && (
                            <button
                              onClick={() => completeJob(r)}
                              className={`w-full py-3 rounded-2xl text-white font-bold transition ${
                                r.is_admin_booking
                                  ? "bg-indigo-700 hover:bg-indigo-800"
                                  : "bg-emerald-700 hover:bg-emerald-800"
                              }`}
                            >
                              {r.is_admin_booking ? "Complete Job" : "Complete Job (OTP)"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 xl:sticky xl:top-28 h-fit">
              <div className="rounded-[28px] border border-green-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                    <Tractor className="text-green-700" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Total Earnings
                    </p>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                      ₹17,797.5
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  This month: <span className="font-bold text-slate-700">₹0</span>
                </p>
              </div>

              <div className="rounded-[28px] border border-yellow-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
                    <Star className="text-yellow-600" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Your Rating
                    </p>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                      {avgRating || "—"}
                    </h2>
                  </div>
                </div>

                {avgRating ? (
                  <>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xl ${
                            star <= Math.round(parseFloat(avgRating))
                              ? "text-yellow-500"
                              : "text-slate-200"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">
                      Based on{" "}
                      <span className="font-bold text-slate-700">
                        {totalRatings}
                      </span>{" "}
                      review{totalRatings !== 1 ? "s" : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No ratings yet</p>
                )}
              </div>

              <div className="rounded-[28px] border border-green-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Your Service Calendar
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Clear view of booked service days.
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center">
                    <Calendar className="text-green-700" size={20} />
                  </div>
                </div>

                <div className="bg-[#f8fbf5] border border-green-100 rounded-[24px] p-4">
                  <ReactCalendar
                    className="provider-calendar"
                    value={calendarDate}
                    onChange={setCalendarDate}
                    tileClassName={({ date, view }) => {
                      if (view === "month") {
                        const formatted = date.toLocaleDateString("en-CA");
                        const today = new Date().toLocaleDateString("en-CA");

                        if (busyDates.includes(formatted)) return "calendar-booked";
                        if (formatted === today) return "calendar-today";
                      }
                      return null;
                    }}
                    tileContent={({ date, view }) => {
                      if (view === "month") {
                        const formatted = date.toLocaleDateString("en-CA");
                        if (busyDates.includes(formatted)) {
                          return <span className="calendar-dot" />;
                        }
                      }
                      return null;
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="font-semibold text-slate-700">Booked Day</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-yellow-50 border border-yellow-100 px-3 py-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="font-semibold text-slate-700">Today</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2">
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                    <span className="font-semibold text-slate-700">Available</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Red dates indicate already booked service days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-[28px] w-full max-w-[560px] shadow-2xl max-h-[90vh] overflow-y-auto border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                {selectedRequest.is_admin_booking ? (
                  <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    <Building2 size={12} /> Agency Request
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    <Leaf size={12} /> Farmer Request
                  </span>
                )}

                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedRequest.is_admin_booking
                    ? "Admin Agency Booking Details"
                    : selectedRequest.beneficiary_name
                    ? "Beneficiary Details"
                    : "Farmer Details"}
                </h2>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                {selectedRequest.is_admin_booking ? (
                  <>
                    <p><b>Agency:</b> {selectedRequest.agency_name || "—"}</p>
                    <p><b>Contact Person:</b> {selectedRequest.contact_person_name || "—"}</p>
                    <p><b>Service:</b> {selectedRequest.service_type}</p>
                    <p><b>Crop:</b> {selectedRequest.crop_name}</p>
                    <p><b>Acres:</b> {selectedRequest.area_size}</p>
                    <p><b>Location:</b> {selectedRequest.address_line || "—"}</p>
                    <p><b>Date & Time:</b> {formatDateTime(selectedRequest.scheduled_at)}</p>
                    <p>
                      <b>Distance from Farmer:</b>{" "}
                      {selectedRequest.distance_km
                        ? `${selectedRequest.distance_km} km`
                        : "Distance unavailable"}
                    </p>

                    <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                      <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">
                        Contact Details
                      </p>
                      <p><b>Phone:</b> {selectedRequest.contact_phone || "—"}</p>
                    </div>

                    {selectedRequest.notes && (
                      <div className="mt-3 p-4 bg-lime-50 border border-lime-100 rounded-2xl">
                        <p className="text-xs text-lime-700 font-bold mb-1 uppercase tracking-wide">
                          Special Instructions
                        </p>
                        <p>{selectedRequest.notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p><b>Booked By:</b> {selectedRequest.farmer_name || "—"}</p>
                    <p><b>Service:</b> {selectedRequest.service_type}</p>
                    <p><b>Crop:</b> {selectedRequest.crop_name}</p>
                    <p><b>Acres:</b> {selectedRequest.area_size}</p>
                    <p><b>Location:</b> {selectedRequest.farmer_location}</p>
                    {selectedRequest.address_line && (
                      <p><b>Address:</b> {selectedRequest.address_line}</p>
                    )}
                    {selectedRequest.landmark && (
                      <p><b>Landmark:</b> {selectedRequest.landmark}</p>
                    )}
                    <p>
                      <b>Distance:</b>{" "}
                      {selectedRequest.distance_km
                        ? `${selectedRequest.distance_km} km away`
                        : "Distance unavailable"}
                    </p>
                    <p><b>Date & Time:</b> {formatDateTime(selectedRequest.scheduled_at)}</p>

                    {selectedRequest.status !== "requested" &&
                    selectedRequest.status !== "reassigning" ? (
                      <div className="mt-3 p-4 bg-green-50 border border-green-100 rounded-2xl space-y-2">
                        <p className="text-xs text-green-700 font-bold uppercase tracking-wide">
                          Contact Details
                        </p>

                        {selectedRequest.beneficiary_name ? (
                          <>
                            <p><b>Beneficiary Name:</b> {selectedRequest.beneficiary_name}</p>
                            <p><b>Beneficiary Phone:</b> {selectedRequest.beneficiary_phone || "—"}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Booked by farmer: {selectedRequest.farmer_name} · {selectedRequest.contact_phone}
                            </p>
                          </>
                        ) : (
                          <p><b>Phone:</b> {selectedRequest.contact_phone || "—"}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-600">
                        <p className="text-xs text-center">
                          📵 Phone number visible after accepting the request
                        </p>
                      </div>
                    )}

                    {selectedRequest.decline_reason && (
                      <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <p className="text-xs text-red-700 font-bold uppercase tracking-wide mb-1">
                          Previous Cancellation Reason
                        </p>
                        <p className="text-red-700">{selectedRequest.decline_reason}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 rounded-2xl bg-green-50 border border-green-100 px-4 py-3">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-wide">
                    Provider Earnings
                  </p>
                  <p className="text-lg font-extrabold text-green-900 mt-1">
                    ₹{Number(selectedRequest.total_price || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="mt-5 w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {busyConflict && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden border border-orange-100">
              <div className="bg-orange-500 px-6 py-5 flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h2 className="text-white font-extrabold text-lg leading-tight">
                    Date Already Booked
                  </h2>
                  <p className="text-orange-100 text-xs mt-0.5">
                    You have a conflict on this date
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                <p className="text-slate-700 text-sm leading-relaxed">
                  You already have a job scheduled on{" "}
                  <span className="font-bold text-orange-600">
                    {new Date(busyConflict.scheduled_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                  .
                </p>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-sm">
                  <p className="text-orange-800 font-semibold">New Request:</p>
                  <p className="text-orange-700 mt-0.5">
                    {busyConflict.service_type} — {busyConflict.area_size} Acres
                  </p>
                  <p className="text-orange-600 text-xs mt-0.5">
                    {formatDateTime(busyConflict.scheduled_at)}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setBusyConflict(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    const selected = busyConflict;
                    setBusyConflict(null);
                    handleAccept(selected);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
                >
                  Accept Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {otpModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden border border-green-100">
              <div
                className={`px-6 py-5 flex items-center gap-3 ${
                  otpModal.type === "start" ? "bg-amber-500" : "bg-green-700"
                }`}
              >
                <span className="text-3xl">
                  {otpModal.type === "start" ? "🔐" : "✅"}
                </span>
                <div>
                  <h2 className="text-white font-extrabold text-lg leading-tight">
                    {otpModal.type === "start"
                      ? "Start Job Verification"
                      : "Complete Job Verification"}
                  </h2>
                  <p className="text-white/80 text-xs mt-0.5">
                    Ask the farmer for their OTP
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="bg-lime-50 border border-lime-100 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed">
                  The farmer can see their OTP in the <b>My Bookings</b> page.
                  Ask them to share the <b>4-digit code</b> with you.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                    Enter OTP from Farmer
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="_ _ _ _"
                    value={otpInput}
                    autoFocus
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setOtpInput(val);
                      setOtpError("");
                    }}
                    className="w-full text-center text-3xl font-extrabold p-4 border-2 border-green-200 rounded-2xl focus:outline-none focus:border-green-500"
                    style={{ letterSpacing: "0.4em" }}
                  />

                  {otpError && (
                    <p className="text-red-500 text-xs mt-2 text-center font-semibold">
                      ⚠️ {otpError}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={handleCancelOtp}
                  disabled={otpLoading}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpInput.length !== 4}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50 ${
                    otpModal.type === "start"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-green-700 hover:bg-green-800"
                  }`}
                >
                  {otpLoading ? "Verifying..." : "Verify & Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-red-100">
              <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
                <span className="text-3xl">🛑</span>
                <div>
                  <h2 className="text-white font-extrabold text-lg leading-tight">
                    Cancel Accepted Service
                  </h2>
                  <p className="text-red-100 text-xs mt-0.5">
                    Reason is mandatory
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-900">
                  This will cancel your current accepted booking and restart provider reassignment automatically.
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Cancellation Reason <span className="text-red-600">*</span>
                  </label>

                  <textarea
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancelling this service request..."
                    className="w-full rounded-2xl border-2 border-slate-200 p-4 text-sm text-slate-700 focus:outline-none focus:border-red-400 resize-none"
                  />

                  <p className="text-xs text-slate-500">
                    This will be stored in bookings.decline_reason.
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancelLoading}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  onClick={handleConfirmCancelService}
                  disabled={cancelLoading}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50"
                >
                  {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}