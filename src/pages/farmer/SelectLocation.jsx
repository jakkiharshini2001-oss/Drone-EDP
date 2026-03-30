import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MapLocationPicker from "../../components/maps/MapLocationPicker";// adjust path as needed

/* ================================================================
   SELECT LOCATION PAGE  (/booking-map)

   Flow:
     1. MAP VIEW  — drop / drag pin → "Confirm This Location"
     2. CONFIRM   — review address  → "Use This Location"
                  → navigates to returnTo (default: /booking-details)
                    with selectedLocation injected into router state
================================================================ */

const SelectLocation = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  /* BookingForm passes returnTo: "/booking-details" when navigating here */
  const returnTo    = routerLocation.state?.returnTo    || "/booking-details";
  const bookingState = routerLocation.state?.bookingState || {};

  const [view,            setView]            = useState("map");   // "map" | "confirm"
  const [coords,          setCoords]          = useState(null);    // { latitude, longitude }
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [geocoding,       setGeocoding]       = useState(false);

  /* ================= MAP HANDLERS ================= */

  const handleLocationSelect = (loc) => {
    setCoords(loc);
    setDetectedAddress(null);
    setGeocoding(true);
  };

  const handleAddressDetected = (addr) => {
    setDetectedAddress(addr);
    setGeocoding(false);
  };

  /* ================= CONFIRM BUTTON (map → confirm screen) ================= */

  const handleConfirmClick = () => {
    if (!coords) return;
    setView("confirm");
  };

  /* ================= PICK AGAIN (confirm → map) ================= */

  const handlePickAgain = () => {
    setView("map");
  };

  /* ================= USE THIS LOCATION → back to BookingForm ================= */

  const handleUseLocation = () => {
    if (!coords) return;

    const selectedLocation = {
      address_name : detectedAddress?.address_name
                     || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
      latitude  : coords.latitude,
      longitude : coords.longitude,
      district  : detectedAddress?.district || "",
      state     : detectedAddress?.state    || "",
      pincode   : detectedAddress?.pincode  || "",
      village   : detectedAddress?.village  || ""
    };

    /* Navigate straight to BookingForm — no SelectLocation in between */
    navigate(returnTo, {
      state: {
        ...bookingState,
        selectedLocation   // BookingForm reads this from routerLocation.state
      }
    });
  };

  /* ================================================================
     CONFIRM SCREEN
  ================================================================ */

  if (view === "confirm") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-12">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">

          {/* Header */}
          <div className="bg-green-600 px-8 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📍</span>
              <h1 className="text-2xl font-black">Confirm Location</h1>
            </div>
            <p className="text-green-100 text-sm">
              Review the details below before using this location
            </p>
          </div>

          {/* Address details */}
          <div className="px-8 py-6 space-y-4">

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                Address
              </p>
              <p className="text-black font-medium text-sm leading-relaxed">
                {detectedAddress?.address_name
                  || `${coords?.latitude?.toFixed(6)}, ${coords?.longitude?.toFixed(6)}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                  Village / Town
                </p>
                <p className="text-black font-semibold text-sm">
                  {detectedAddress?.village || "—"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                  District
                </p>
                <p className="text-black font-semibold text-sm">
                  {detectedAddress?.district || "—"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                  State
                </p>
                <p className="text-black font-semibold text-sm">
                  {detectedAddress?.state || "—"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                  Pincode
                </p>
                <p className="text-black font-semibold text-sm">
                  {detectedAddress?.pincode || "—"}
                </p>
              </div>

            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                Coordinates
              </p>
              <p className="text-black text-xs font-mono">
                {coords?.latitude?.toFixed(6)}, {coords?.longitude?.toFixed(6)}
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="px-8 pb-8 space-y-3">
            <button
              onClick={handleUseLocation}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-colors"
            >
              ✅ Use This Location
            </button>

            <button
              onClick={handlePickAgain}
              className="w-full bg-gray-100 hover:bg-gray-200 text-black py-4 rounded-2xl font-bold transition-colors"
            >
              ← Pick Again
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ================================================================
     MAP VIEW
  ================================================================ */

  return (
    <div className="min-h-screen bg-transparent flex flex-col">

      {/* Top bar */}
      <div className="bg-white/60 backdrop-blur-md shadow-sm px-6 py-4 flex items-center gap-4 z-10 border-b border-white/20">
        <button
          onClick={() => navigate(-1)}
          className="text-black hover:text-black font-bold text-lg"
        >
          ←
        </button>
        <div>
          <h1 className="font-black text-black text-lg leading-tight">
            Select Field Location
          </h1>
          <p className="text-xs text-black">
            Tap on the map to drop a pin on your field
          </p>
        </div>
      </div>

      {/* Map — fills remaining screen height */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <div className="absolute inset-0">
          <MapLocationPicker
            onLocationSelect={handleLocationSelect}
            onAddressDetected={handleAddressDetected}
          />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-white/60 backdrop-blur-md px-6 py-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] space-y-4 border-t border-white/20">

        {/* No pin yet */}
        {!coords && (
          <div className="text-center py-2">
            <p className="text-black text-sm font-medium">
              👆 Tap anywhere on the map to place a pin
            </p>
          </div>
        )}

        {/* Pin placed — address preview */}
        {coords && (
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">📍</span>
            <div className="flex-1 min-w-0">
              {geocoding ? (
                <p className="text-sm text-black animate-pulse">
                  Detecting address...
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-black leading-snug line-clamp-2">
                    {detectedAddress?.address_name
                      || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`}
                  </p>
                  {(detectedAddress?.district || detectedAddress?.state) && (
                    <p className="text-xs text-black mt-0.5">
                      {[
                        detectedAddress?.village,
                        detectedAddress?.district,
                        detectedAddress?.state,
                        detectedAddress?.pincode
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirmClick}
          disabled={!coords || geocoding}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {geocoding ? "Detecting Address..." : "Confirm This Location →"}
        </button>

      </div>
    </div>
  );
};

export default SelectLocation;
