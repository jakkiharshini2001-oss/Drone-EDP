import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoggedIn) {
        setCheckingRole(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingRole(false);
        return;
      }

      // 1️⃣ Check Admin first (highest priority)
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .single();

      if (admin) {
        setRole("admin");
        setCheckingRole(false);
        return;
      }

      // 2️⃣ Check Provider
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("id", user.id)
        .single();

      if (provider) {
        setRole("provider");
        setCheckingRole(false);
        return;
      }

      // 3️⃣ Check Farmer
      const { data: farmer } = await supabase
        .from("farmers")
        .select("id")
        .eq("id", user.id)
        .single();

      if (farmer) {
        setRole("farmer");
        setCheckingRole(false);
        return;
      }

      setRole(null);
      setCheckingRole(false);
    };

    checkUserRole();
  }, [isLoggedIn]);

  /* ================= LOADING ================= */

  if (loading || checkingRole) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agri-green"></div>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  /* ================= ROLE NOT ALLOWED ================= */

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  /* ================= SUCCESS ================= */

  return children;
};

export default ProtectedRoute;