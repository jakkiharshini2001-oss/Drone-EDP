import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(true);
                await fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        };

        init();

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, session) => {
                // Ignore auth changes if we're doing a strict login check manually
                if (window.isLoggingInStrictMode) return;

                if (session) {
                    setIsLoggedIn(true);
                    fetchUserProfile(session.user.id);
                } else {
                    setIsLoggedIn(false);
                    setUserData(null);
                    setLoading(false);
                    navigate("/", { replace: true });
                }
            });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const fetchUserProfile = async (userId) => {
        try {
            // Updated to check both tables since we split 'profiles'
            let userRole = null;
            let finalData = null;

            // 1. Try finding in Farmers
            const { data: farmerData } = await supabase
                .from("farmers")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (farmerData) {
                userRole = 'farmer';
                finalData = { ...farmerData, user_role: 'farmer' };
            } else {
                // 2. Try finding in Providers
                const { data: providerData } = await supabase
                    .from("providers")
                    .select("*")
                    .eq("id", userId)
                    .maybeSingle();


                if (providerData) {
                    userRole = 'provider';
                    finalData = { ...providerData, user_role: 'provider' };
                } else {
                    // 3. Try finding in Admins
                    const { data: adminData } = await supabase
                        .from("admins")
                        .select("*")
                        .eq("id", userId)
                        .maybeSingle();

                    if (adminData) {
                        userRole = 'admin';
                        finalData = { ...adminData, user_role: 'admin', full_name: 'Admin' };
                    }
                }
            }

            if (!finalData) {
                console.warn("User profile not found in farmers or providers table (yet).");
                // Do NOT sign out automatically. This allows the signup flow to complete insertion.
                // We'll leave userData as null for now.
                setUserData(null);
                return;
            }

            setUserData(finalData);

            // ✅ Double check session existence before redirecting (prevents race condition during Signup -> SignOut flow)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // ✅ Prevent redirect if we are in the middle of a signup flow (flag set in Auth.jsx)
            if (window.isSigningUp) return;

            if (window.location.pathname === "/" || window.location.pathname === "/login") {
                navigate(
                    userRole === "admin"
                        ? "/admin/dashboard"
                        : userRole === "provider"
                        ? "/provider/home"
                        : "/dashboard",
                    { replace: true }
                );
            }
        } catch (err) {
            console.error("Auth init error:", err);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUserData(null);
        setIsLoggedIn(false);
        navigate("/", { replace: true });
    };

    const completeLogin = async (userId) => {
        setIsLoggedIn(true);
        await fetchUserProfile(userId);
    };

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                userData,
                loading,
                logout,
                setUserData,
                fetchUserProfile, // Exposing this so Signup components can call it after inserting profile
                completeLogin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};