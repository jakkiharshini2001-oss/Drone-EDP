import React, { useEffect, useState } from "react";
import ProviderSidebar from "./ProviderSidebar";
import { useUI } from "../../context/UIContext";
import { supabase } from "../../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import providerBg from "../../assets/app-bg.png";

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

  const shouldLock = status !== "approved" && isRestrictedRoute && !isVerificationRoute;

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen bg-transparent font-sans text-black">
      <ProviderSidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        toggle={toggleSidebar}
        closeMobile={closeMobileSidebar}
      />

      <div className="flex-1 overflow-auto relative">
        {/* Blurred Background Image */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[4px] scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${providerBg})` }}
        />
        
        {/* Dark persistent overlay for readability */}
        <div className="fixed inset-0 z-0 bg-black/30 pointer-events-none"></div>

        <div className="relative z-10 w-full">
        {/* STATUS BANNER */}

        {status !== "approved" && (
          <div
            className={`mx-6 mt-6 rounded-2xl shadow-sm px-6 py-4 flex justify-between items-start
            ${
              status === "rejected"
                ? "border border-red-300 bg-gradient-to-r from-red-50/50 to-red-100/50 backdrop-blur-md"
                : "border border-yellow-300 bg-gradient-to-r from-yellow-50/50 to-yellow-100/50 backdrop-blur-md"
            }`}
          >
            <div>
              {/* TITLE */}

              <h3
                className={`font-semibold ${
                  status === "rejected" ? "text-red-800" : "text-yellow-800"
                }`}
              >
                {status === "pending"
                  ? "Verification Under Review"
                  : status === "rejected"
                  ? "Verification Rejected"
                  : "Account Not Verified"}
              </h3>

              {/* MESSAGE */}

              <p
                className={`text-sm mt-1 ${
                  status === "rejected" ? "text-red-700" : "text-yellow-700"
                }`}
              >
                {status === "pending"
                  ? "Admin is reviewing your details. You will be notified once approved."
                  : status === "rejected"
                  ? "Your verification request was rejected."
                  : "Complete your registration to activate your account."}
              </p>

              {/* REJECTION REASON */}

              {status === "rejected" && rejectionReason && (
                <div className="mt-3 bg-white/70 backdrop-blur-md border border-red-200 rounded-xl p-3">
                  <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                  <p className="text-sm text-black mt-1">{rejectionReason}</p>
                </div>
              )}
            </div>

            {(status === "not_submitted" || status === "rejected") && (
              <button
                onClick={() => navigate("/provider/verification")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm transition"
              >
                {status === "rejected" ? "Resubmit" : "Complete Registration"}
              </button>
            )}
          </div>
        )}

        {/* LOCK SCREEN */}

        {shouldLock ? (
          <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-12 text-center max-w-lg border border-white/20">
              <Lock className="mx-auto text-yellow-500 mb-6" size={48} />
              <h2 className="text-2xl font-semibold text-black mb-3">Account Locked</h2>
              <p className="text-black text-sm">
                You can access dashboard, services, bookings and earnings only after your account is verified by admin.
              </p>
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