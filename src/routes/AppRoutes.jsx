import React from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBooking } from "../context/BookingContext";
import ProtectedRoute from "../components/common/ProtectedRoute";

/* ================= PAGE IMPORTS ================= */

// Common
import LandingPage from "../pages/common/LandingPage";
import About from "../pages/common/About";
import Contact from "../pages/common/Contact";
import Profile from "../pages/common/Profile";

// Farmer
import DashboardHome from "../components/farmer/DashboardHome";
import Services from "../pages/farmer/Services";
import ServiceBookingView from "../pages/farmer/ServiceBookingView";
import BookingForm from "../pages/farmer/BookingForm";
import MyBookings from "../pages/farmer/MyBookings";
import SearchingForProvider from "../pages/farmer/SearchingForProvider";
import SelectLocation from "../pages/farmer/SelectLocation";
import BookingMap from "../pages/farmer/BookingMap";
import AddAddress from "../pages/farmer/AddAddress";   // ✅ ADDED

// Provider
import ProviderDashboard from "../pages/provider/ProviderDashboard";
import ProviderServices from "../pages/provider/ProviderServices";
import ProviderBookings from "../pages/provider/ProviderBookings";
import ProviderEarnings from "../pages/provider/ProviderEarnings";
import ProviderHome from "../components/provider/ProviderHome";
import ProviderVerification from "../pages/provider/ProviderVerification";


const AppRoutes = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const { bookingFlow, setBookingFlow, handleFinalBooking } = useBooking();

  return (

    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}

      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* ================= PROFILE ================= */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["farmer", "provider"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ================= FARMER ROUTES ================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <div className="pt-0" key={location.key}>
              <DashboardHome
                userName={userData?.full_name}
                onViewServices={() => navigate("/services")}
              />
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="/bookings" element={<Navigate to="/my-bookings" />} />

      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <MyBookings key={location.key} userId={userData?.id} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <Services
              key={location.key}
              onSelectService={(service) =>
                navigate(`/service/${service.id}`)
              }
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/service/:categoryId"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <ServiceBookingView
              onProceedToDetails={(data) => {
                setBookingFlow(data);
                navigate("/booking-details");
              }}
            />
          </ProtectedRoute>
        }
      />

      {/* ================= MAP LOCATION ================= */}

      <Route
        path="/booking-map"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <BookingMap />
          </ProtectedRoute>
        }
      />

      {/* ================= ADD ADDRESS PAGE ================= */}

      <Route
        path="/add-address"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <AddAddress />
          </ProtectedRoute>
        }
      />

      {/* ================= BOOKING FORM ================= */}

      <Route
        path="/booking-details"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <BookingForm
              bookingData={bookingFlow}
              onConfirmBooking={handleFinalBooking}
              onBack={() => navigate("/services")}
            />
          </ProtectedRoute>
        }
      />

      {/* ================= SELECT LOCATION ================= */}

      <Route
        path="/select-location"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <SelectLocation />
          </ProtectedRoute>
        }
      />

      {/* ================= SEARCHING PROVIDER ================= */}

      <Route
        path="/searching-provider/:id"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <SearchingForProvider />
          </ProtectedRoute>
        }
      />

      {/* ================= PROVIDER ROUTES ================= */}

      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderDashboard key={location.key} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/verification"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderVerification />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/services"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderServices key={location.key} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/bookings"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderBookings key={location.key} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/earnings"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderEarnings key={location.key} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider/home"
        element={
          <ProtectedRoute allowedRoles={["provider"]}>
            <ProviderHome key={location.key} userName={userData?.full_name} />
          </ProtectedRoute>
        }
      />


      {/* ================= REDIRECT ================= */}

      <Route
        path="/provider-dashboard"
        element={<Navigate to="/provider/dashboard" replace />}
      />

    </Routes>

  );

};

export default AppRoutes;