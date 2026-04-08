import React, { useEffect, useState } from "react";
import ProviderSidebar from "./ProviderSidebar";
import { useUI } from "../../context/UIContext";
import { supabase } from "../../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import providerBg from "../../assets/booking-bg.png";

export default function ProviderLayout({ children }) {
  const {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,
  } = useUI();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------- LOAD SESSION ---------------- */

  useEffect(() => {
    let authListener = null;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      await fetchProvider(session.user.id);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchProvider(session.user.id);
        }
      }
    );

    authListener = data?.subscription;

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  /* ---------------- FETCH PROVIDER ---------------- */

  const fetchProvider = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("verification_status, rejection_reason")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Provider fetch error:", error.message);
        setProvider(null);
      } else {
        setProvider(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING SCREEN ---------------- */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  /* ---------------- STATUS ---------------- */

  const status =
    provider?.verification_status?.trim().toLowerCase() || "not_submitted";

  const rejectionReason = provider?.rejection_reason;

  /* ---------------- ROUTE LOCKING ---------------- */

  const restrictedRoutes = [
    "/provider/dashboard",
    "/provider/services",
    "/provider/bookings",
    "/provider/earnings",
  ];

  const isRestrictedRoute = restrictedRoutes.includes(location.pathname);
  const isVerificationRoute = location.pathname === "/provider/verification";

  const shouldLock =
    status !== "approved" && isRestrictedRoute && !isVerificationRoute;

  return (
    <div className="flex min-h-screen bg-transparent font-sans text-black">
      <ProviderSidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        toggle={toggleSidebar}
        closeMobile={closeMobileSidebar}
      />

      <div className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto relative">
        {/* Background */}
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[4px] scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${providerBg})` }}
        />

        {/* Overlay */}
        <div className="fixed inset-0 z-0 bg-black/30 pointer-events-none" />

        <div className="relative z-10 w-full">
          {/* STATUS BANNER */}
          {status !== "approved" && (
            <div className="px-4 md:px-6 pt-[92px] md:pt-[96px]">
              <div
                className={`rounded-3xl shadow-lg px-5 md:px-6 py-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 backdrop-blur-xl border ${
                  status === "rejected"
                    ? "border-red-200 bg-gradient-to-r from-red-50/80 to-red-100/70"
                    : "border-yellow-200 bg-gradient-to-r from-yellow-50/80 to-yellow-100/70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-lg font-extrabold tracking-tight ${
                      status === "rejected"
                        ? "text-red-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {status === "pending"
                      ? "Verification Under Review"
                      : status === "rejected"
                      ? "Verification Rejected"
                      : "Account Not Verified"}
                  </h3>

                  <p
                    className={`text-sm mt-1 leading-relaxed ${
                      status === "rejected"
                        ? "text-red-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {status === "pending"
                      ? "Admin is reviewing your details. You will be notified once approved."
                      : status === "rejected"
                      ? "Your verification request was rejected."
                      : "Complete your registration to activate your account."}
                  </p>

                  {status === "rejected" && rejectionReason && (
                    <div className="mt-4 max-w-md bg-white/75 border border-red-200 rounded-2xl p-4 shadow-sm">
                      <p className="text-sm font-bold text-red-700">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-gray-800 mt-1">
                        {rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {(status === "not_submitted" || status === "rejected") && (
                  <button
                    onClick={() => navigate("/provider/verification")}
                    className="shrink-0 self-start bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md transition"
                  >
                    {status === "rejected"
                      ? "Resubmit"
                      : "Complete Registration"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* LOCK SCREEN */}
          {shouldLock ? (
            <div className="px-4 md:px-6 pt-10 pb-10 min-h-[calc(100vh-92px)] flex items-center justify-center">
              <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 p-8 md:p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-50 flex items-center justify-center mb-6 shadow-sm">
                  <Lock className="text-yellow-500" size={42} />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                  Account Locked
                </h2>

                <p className="text-gray-700 text-base leading-relaxed max-w-md mx-auto">
                  You can access dashboard, services, bookings and earnings only
                  after your account is verified by admin.
                </p>

                {(status === "not_submitted" || status === "rejected") && (
                  <button
                    onClick={() => navigate("/provider/verification")}
                    className="mt-8 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold shadow-md transition"
                  >
                    {status === "rejected"
                      ? "Resubmit Verification"
                      : "Complete Registration"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
    </div>
  );
}