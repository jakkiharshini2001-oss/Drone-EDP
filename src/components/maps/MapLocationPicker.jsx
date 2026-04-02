import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix leaflet icon bug in Vite */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ─── Fly-to helper (rendered inside MapContainer) ───────────────── */
const FlyToLocation = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { animate: true, duration: 1 });
    }
  }, [target, map]);
  return null;
};

/* ─── Click / drag marker ────────────────────────────────────────── */
const LocationMarker = ({ position, setPosition, onLocationSelect, fetchAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (onLocationSelect) onLocationSelect({ latitude: lat, longitude: lng });
      fetchAddress(lat, lng);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
          if (onLocationSelect) onLocationSelect({ latitude: lat, longitude: lng });
          fetchAddress(lat, lng);
        },
      }}
    />
  ) : null;
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const MapLocationPicker = ({ onLocationSelect, onAddressDetected }) => {
  const [position, setPosition] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  /* ── search state ── */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  /* close suggestions on outside click */
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ─── Reverse geocode ─────────────────────────────────────────── */
  const fetchAddress = useCallback(
    async (lat, lng) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
        );
        const data = await res.json();
        const addr = data.address || {};
        const detectedAddress = {
          village:
            addr.village || addr.town || addr.hamlet || addr.suburb || addr.city || "",
          district: addr.state_district || addr.county || addr.region || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
        };
        if (onAddressDetected) onAddressDetected(detectedAddress);
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    },
    [onAddressDetected]
  );

  /* ─── Forward geocode (search) ────────────────────────────────── */
  const searchPlaces = useCallback(async (text) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          text
        )}&format=json&addressdetails=1&limit=6&countrycodes=in`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Search error:", err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 420);
  };

  /* ─── User picks a suggestion ─────────────────────────────────── */
  const handleSuggestionClick = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    setPosition([lat, lng]);
    setFlyTarget({ lat, lng });
    setQuery(place.display_name);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onLocationSelect) onLocationSelect({ latitude: lat, longitude: lng });

    const addr = place.address || {};
    if (onAddressDetected) {
      onAddressDetected({
        village:
          addr.village || addr.town || addr.hamlet || addr.suburb || addr.city || "",
        district: addr.state_district || addr.county || addr.region || "",
        state: addr.state || "",
        pincode: addr.postcode || "",
      });
    }
  };

  /* ─── Clear search ────────────────────────────────────────────── */
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* ── Search bar ── */}
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            borderRadius: "14px",
            border: "1.5px solid #d1d5db",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* search icon */}
          <span
            style={{
              padding: "0 12px",
              fontSize: "18px",
              color: "#6b7280",
              flexShrink: 0,
            }}
          >
            🔍
          </span>

          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for a village, city or address…"
            style={{
              flex: 1,
              padding: "13px 0",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#111827",
              background: "transparent",
            }}
          />

          {/* loading spinner */}
          {searching && (
            <span
              style={{
                padding: "0 14px",
                fontSize: "14px",
                color: "#9ca3af",
                flexShrink: 0,
              }}
            >
              ⏳
            </span>
          )}

          {/* clear button */}
          {query && !searching && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: "0 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "#9ca3af",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── Suggestions dropdown ── */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "14px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              zIndex: 9999,
              overflow: "hidden",
            }}
          >
            {suggestions.map((place, i) => (
              <button
                key={place.place_id || i}
                type="button"
                onClick={() => handleSuggestionClick(place)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    i < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0fdf4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>
                  📍
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.45",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {place.display_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* no results */}
        {showSuggestions && !searching && query.length >= 3 && suggestions.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "14px",
              padding: "16px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
              zIndex: 9999,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
          >
            No locations found. Try a different search.
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div
        style={{
          width: "100%",
          height: "420px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1.5px solid #e5e7eb",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <MapContainer
          center={[17.385044, 78.486671]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToLocation target={flyTarget} />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={onLocationSelect}
            fetchAddress={fetchAddress}
          />
        </MapContainer>
      </div>

      <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: 0 }}>
        Search for a location above, or tap anywhere on the map to pin it. Drag the marker to adjust.
      </p>
    </div>
  );
};

export default MapLocationPicker;