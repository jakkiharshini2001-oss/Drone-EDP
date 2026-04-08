import React, { useEffect, useState } from 'react';
import { supabase } from "../../lib/supabase";
import { Clock, CheckCircle, MapPin, Calendar, AlertCircle, XCircle, Eye, Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import bookingBg from "../../assets/booking-bg.png";

/* ================================================================
   STAR RATING COMPONENT
================================================================ */
const StarRating = ({ value, onChange, readonly = false, size = 28 }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

/* ================================================================
   RATING SECTION — shown on completed bookings
================================================================ */
const RatingSection = ({ booking, onRated }) => {
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  /* If already rated — show the submitted rating */
  if (booking.rating || submitted) {
    return (
      <div className="mt-6 bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm relative z-10 shadow-inner">
        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-3">
          Your Feedback
        </p>
        <StarRating value={booking.rating || rating} readonly size={22} />
        {booking.rating_comment && (
          <p className="text-sm text-emerald-50 mt-4 italic font-medium">"{booking.rating_comment}"</p>
        )}
        <p className="text-[10px] text-emerald-400 mt-4 font-black uppercase tracking-widest">Thank you for your feedback! ✅</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { alert("Please select a rating"); return; }
    setSubmitting(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        rating,
        rating_comment: comment.trim() || null,
        rated_at:       new Date().toISOString()
      })
      .eq("id", booking.id);

    setSubmitting(false);

    if (error) { alert("Failed to submit rating: " + error.message); return; }

    setSubmitted(true);
    if (onRated) onRated();
  };

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-[2rem] p-6 relative z-10">
      <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter">⭐ Rate Your Operator</p>
      <p className="text-xs text-emerald-100/60 mb-4 font-medium uppercase tracking-wider">
        How was your experience with {booking.provider_name || "the operator"}?
      </p>

      <div className="bg-white/5 p-4 rounded-xl border border-white/5 inline-block mb-4">
        <StarRating value={rating} onChange={setRating} size={32} />
      </div>

      {rating > 0 && (
        <div className="mt-2 space-y-4">
          <textarea
            placeholder="Add a comment (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full text-sm p-4 border border-white/10 rounded-2xl bg-white/5 text-white placeholder-emerald-100/30 focus:outline-none focus:border-emerald-500/50 resize-none transition-all font-medium"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ================================================================
   MYBOOKINGS
================================================================ */
const MyBookings = ({ userId }) => {

  const { t } = useLanguage();

  const [bookings,         setBookings]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [errorStatus,      setErrorStatus]      = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  /* ================= FETCH BOOKINGS ================= */

  const fetchMyBookings = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('farmer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Read Error:", error.code, error.message);
        setErrorStatus(error.message);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Critical Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= REALTIME LISTENER ================= */

  useEffect(() => {
    if (!userId) return;
    fetchMyBookings();
    const sub = supabase
      .channel('booking-status-updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `farmer_id=eq.${userId}` },
        () => { fetchMyBookings(); }
      ).subscribe();
    return () => supabase.removeChannel(sub);
  }, [userId]);

  /* ================= CANCEL BOOKING ================= */

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(t('bookings.confirmCancel'));
    if (!confirmCancel) return;
    const { error } = await supabase
      .from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (error) { alert(t('bookings.failedCancel')); return; }
    fetchMyBookings();
  };

  /* ================= VIEW PROVIDER DETAILS ================= */

  const handleViewProvider = async (providerId) => {
    const { data, error } = await supabase
      .from("providers")
      .select("full_name, phone_number, mandal_name, district, state")
      .eq("id", providerId).single();
    if (error) { alert("Failed to fetch provider details"); return; }
    setSelectedProvider(data);
  };

  /* ================= STATUS UI ================= */

  const getStatusDetails = (status) => {
    switch (status) {
      case 'requested':
      case 'pending':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <Clock size={10} />, label: "Searching Provider" };
      case 'accepted':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <CheckCircle size={10} />, label: "Provider Assigned" };
      case 'ongoing':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <Clock size={10} />, label: "Job Ongoing" };
      case 'completed':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <CheckCircle size={10} />, label: "Completed" };
      case 'rejected':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <AlertCircle size={10} />, label: "Rejected" };
      case 'cancelled':
        return { color: 'bg-white text-black border-indigo-500/30', icon: <XCircle size={10} />, label: "Cancelled" };
      default:
        return { color: 'bg-white text-black border-indigo-500/30', icon: <Clock size={10} />, label: status };
    }
  };

  /* ================= UI ================= */

  return (
    <div className="pt-36 pb-20 min-h-screen relative overflow-hidden">
      {/* Blurred Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[4px] scale-110"
        style={{ backgroundImage: `url(${bookingBg})` }}
      />
      
      {/* Dark persistent overlay for readability */}
      <div className="fixed inset-0 z-0 bg-black/30 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
              {t('bookings.pageTitle')}
            </h1>
            <p className="text-emerald-100/70 font-medium uppercase tracking-widest text-xs">
              {t('bookings.pageSubtitle')}
            </p>
          </div>
          <button onClick={fetchMyBookings}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md">
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agri-green mx-auto" />
          </div>

        ) : bookings.length > 0 ? (

          <div className="grid gap-6">
            {bookings.map((booking) => {
              const status         = getStatusDetails(booking.status);
              const hasStartOtp    = !!booking.start_otp;
              const hasCompleteOtp = !!booking.complete_otp;

              return (
                <div key={booking.id} className="bg-gradient-to-br from-emerald-600/90 via-green-700/85 to-teal-900/90 p-8 rounded-[2.5rem] shadow-2xl border border-white/20 backdrop-blur-md text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors"></div>


                  {/* ── START OTP BANNER ── */}
                  {hasStartOtp && (
                    <div className="mb-6 flex items-center gap-6 bg-white/10 border border-white/20 rounded-2xl px-6 py-5 backdrop-blur-sm relative z-10 shadow-inner">
                      <div className="text-4xl drop-shadow-lg">🔐</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-1 opacity-80">
                          OTP to Start Job
                        </p>
                        <p className="text-sm text-emerald-50 mb-3 font-medium">
                          Share this code with your operator to begin the service
                        </p>
                        <p className="text-5xl font-black text-white drop-shadow-md" style={{ letterSpacing: "0.4em" }}>
                          {booking.start_otp}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── COMPLETE OTP BANNER ── */}
                  {hasCompleteOtp && (
                    <div className="mb-6 flex items-center gap-6 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-6 py-5 backdrop-blur-sm relative z-10 shadow-inner">
                      <div className="text-4xl">✅</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                          OTP to Complete Job
                        </p>
                        <p className="text-sm text-emerald-50 mb-3 font-medium">
                          Share this code with your operator to confirm completion
                        </p>
                        <p className="text-5xl font-black text-white drop-shadow-md" style={{ letterSpacing: "0.4em" }}>
                          {booking.complete_otp}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Booking Info ── */}
                  <div className="flex flex-col md:flex-row justify-between gap-6">

                    <div className="space-y-4 flex-1">

                      <div className="flex items-center gap-3 relative z-10">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status.color} shadow-sm border border-black/5`}>
                          {status.icon} {status.label}
                        </span>
                        <span className="text-emerald-100/50 text-[10px] font-black uppercase tracking-widest">
                          ID: {booking.id.slice(-6)}
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{booking.service_type}</h3>
                        <p className="text-emerald-100 font-bold opacity-80 uppercase tracking-wider text-xs mt-1">
                          {booking.crop_type} • {booking.area_size} Acres
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-2 relative z-10">
                        <div className="flex items-center gap-3 text-emerald-50 text-xs font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                          <MapPin size={16} className="text-emerald-400" />
                          <span className="truncate">{booking.address_line || booking.district || "—"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-50 text-xs font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                          <Calendar size={16} className="text-emerald-400" />
                          <span>{new Date(booking.scheduled_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* ── RATING SECTION — only for completed bookings ── */}
                      {booking.status === "completed" && booking.provider_id && (
                        <RatingSection
                          booking={booking}
                          onRated={fetchMyBookings}
                        />
                      )}

                    </div>

                    <div className="md:text-right flex flex-col justify-between items-start md:items-end">

                      <div className="relative z-10">
                        <p className="text-[10px] text-emerald-200/60 font-black uppercase tracking-[0.2em] mb-1">
                          Estimated Cost
                        </p>
                        <p className="text-5xl font-black text-emerald-400 drop-shadow-lg font-mono">
                          ₹{booking.total_price}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 w-full relative z-10">
                        {booking.provider_id && (
                          <button
                            onClick={() => handleViewProvider(booking.provider_id)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 py-3.5 rounded-2xl text-xs font-black hover:bg-emerald-400 transition-all shadow-lg uppercase tracking-widest active:scale-95">
                            <Eye size={16} /> View Provider Details
                          </button>
                        )}
                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-2xl text-xs font-black hover:bg-white/20 transition-all uppercase tracking-widest active:scale-95">
                            <XCircle size={16} /> Cancel Booking
                          </button>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        ) : (
          <div className="bg-gradient-to-br from-emerald-600/90 to-teal-900/90 rounded-[3rem] p-20 text-center border border-white/20 backdrop-blur-md shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
            <div className="text-6xl mb-6 drop-shadow-lg">🚜</div>
            <h3 className="text-3xl font-black mb-3 uppercase tracking-tighter">No Bookings Yet</h3>
            <p className="text-emerald-100/70 font-medium max-w-md mx-auto leading-relaxed">You haven't placed any drone service requests. Your upcoming and past services will appear here.</p>
            <button 
              onClick={() => navigate('/services')}
              className="mt-8 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm active:scale-95"
            >
              Explore Services
            </button>
          </div>
        )}
      </div>

      {/* ================= PROVIDER MODAL ================= */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-emerald-800 to-teal-950 p-10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter border-b border-white/10 pb-4">Operator Info</h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-300 mb-1">Full Name</p>
                  <p className="text-xl font-bold">{selectedProvider.full_name}</p>
                </div>
                
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-300 mb-1">Contact Phone</p>
                  <p className="text-xl font-bold font-mono">{selectedProvider.phone_number}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-300 mb-1">District</p>
                    <p className="font-bold">{selectedProvider.district}</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-300 mb-1">State</p>
                    <p className="font-bold">{selectedProvider.state}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedProvider(null)}
                className="mt-10 w-full bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border border-white/10 active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookings;