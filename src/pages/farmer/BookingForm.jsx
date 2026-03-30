import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/* ================================================================
   SAVED ADDRESSES MODAL
================================================================ */

const AddressModal = ({ onClose, onSelect, farmerId }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const [newAddress, setNewAddress] = useState({
    label: "",
    address_name: "",
    address_line: "",
    district: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    is_default: false,
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("farmer_addresses")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      setAddresses(data || []);
      setLoading(false);
    };

    if (farmerId) fetchAddresses();
  }, [farmerId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;

    await supabase.from("farmer_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id) => {
    await supabase
      .from("farmer_addresses")
      .update({ is_default: false })
      .eq("farmer_id", farmerId);

    await supabase
      .from("farmer_addresses")
      .update({ is_default: true })
      .eq("id", id);

    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
  };

  const reverseGeocode = async (lat, lng) => {
    setResolvingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      const data = await response.json();
      const address = data?.address || {};

      const addressName =
        data?.display_name ||
        address?.road ||
        address?.village ||
        address?.town ||
        address?.city ||
        "Current Location";

      setNewAddress((prev) => ({
        ...prev,
        address_name: addressName,
        latitude: lat,
        longitude: lng,
        district:
          address?.state_district ||
          address?.county ||
          address?.district ||
          prev.district,
        state: address?.state || prev.state,
        pincode: address?.postcode || prev.pincode,
      }));
    } catch (err) {
      console.error("Reverse geocode error:", err);

      setNewAddress((prev) => ({
        ...prev,
        address_name: `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
      }));
    } finally {
      setResolvingAddress(false);
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setCapturingGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setCapturingGPS(false);
      },
      (err) => {
        console.error(err);
        alert("Unable to capture location");
        setCapturingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleSaveAddress = async () => {
    if (!newAddress.label.trim()) {
      alert("Please enter a label");
      return;
    }

    if (!newAddress.address_name.trim()) {
      alert("Please enter or capture address");
      return;
    }

    if (!newAddress.latitude || !newAddress.longitude) {
      alert("Please capture GPS or enter coordinates");
      return;
    }

    setSaving(true);

    if (newAddress.is_default) {
      await supabase
        .from("farmer_addresses")
        .update({ is_default: false })
        .eq("farmer_id", farmerId);
    }

    const { data, error } = await supabase
      .from("farmer_addresses")
      .insert([
        {
          farmer_id: farmerId,
          label: newAddress.label,
          address_name: newAddress.address_name,
          address_line: newAddress.address_line,
          district: newAddress.district,
          state: newAddress.state,
          pincode: newAddress.pincode,
          latitude: parseFloat(newAddress.latitude),
          longitude: parseFloat(newAddress.longitude),
          is_default: newAddress.is_default,
        },
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setAddresses((prev) => {
      const updated = newAddress.is_default
        ? prev.map((a) => ({ ...a, is_default: false }))
        : prev;
      return [data, ...updated];
    });

    setNewAddress({
      label: "",
      address_name: "",
      address_line: "",
      district: "",
      state: "",
      pincode: "",
      latitude: "",
      longitude: "",
      is_default: false,
    });

    setShowAddForm(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1.5px solid #d1d5db",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = {
    width: "100%",
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {showAddForm ? (
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            ) : (
              <span style={{ fontSize: "20px" }}>🏠</span>
            )}
            <h2
              style={{
                color: "#ffffff",
                fontWeight: "900",
                fontSize: "17px",
                margin: 0,
              }}
            >
              {showAddForm ? "Add New Address" : "Saved Addresses"}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "8px",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "900",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {!showAddForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {loading && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    padding: "32px 0",
                    margin: 0,
                  }}
                >
                  Loading addresses...
                </p>
              )}

              {!loading && addresses.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: "36px", margin: "0 0 10px" }}>📭</p>
                  <p
                    style={{
                      color: "#374151",
                      fontWeight: "700",
                      margin: "0 0 4px",
                    }}
                  >
                    No saved addresses yet
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                    Add one below to speed up future bookings
                  </p>
                </div>
              )}

              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => onSelect(addr)}
                  style={{
                    border: "2px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    backgroundColor: "#ffffff",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "800",
                            color: "#111827",
                            fontSize: "15px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {addr.label || "Unnamed"}
                        </span>

                        {addr.is_default && (
                          <span
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#dcfce7",
                              color: "#15803d",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontWeight: "700",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          color: "#4b5563",
                          margin: "0 0 2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {addr.address_name}
                      </p>

                      {(addr.district || addr.state) && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            margin: 0,
                          }}
                        >
                          {[addr.district, addr.state, addr.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      {!addr.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(addr.id);
                          }}
                          style={{
                            fontSize: "12px",
                            color: "#3b82f6",
                            fontWeight: "700",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 0",
                          }}
                        >
                          Set Default
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(addr.id);
                        }}
                        style={{
                          fontSize: "12px",
                          color: "#ef4444",
                          fontWeight: "700",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 0",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                placeholder="Label (e.g. Home Farm, North Field)"
                style={inputStyle}
                value={newAddress.label}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, label: e.target.value })
                }
              />

              <button
                type="button"
                onClick={captureGPS}
                disabled={capturingGPS || resolvingAddress}
                style={{
                  ...btnStyle,
                  backgroundColor:
                    capturingGPS || resolvingAddress ? "#93c5fd" : "#3b82f6",
                }}
              >
                {capturingGPS
                  ? "Capturing GPS..."
                  : resolvingAddress
                    ? "Resolving Address..."
                    : "📡 Capture GPS Location"}
              </button>

              <input
                type="text"
                placeholder="Address Name"
                style={inputStyle}
                value={newAddress.address_name}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, address_name: e.target.value })
                }
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="District"
                  style={inputStyle}
                  value={newAddress.district}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, district: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="State"
                  style={inputStyle}
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, state: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Pincode"
                  style={inputStyle}
                  value={newAddress.pincode}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, pincode: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Address Line"
                  style={inputStyle}
                  value={newAddress.address_line}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address_line: e.target.value })
                  }
                />
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newAddress.is_default}
                  onChange={(e) =>
                    setNewAddress({
                      ...newAddress,
                      is_default: e.target.checked,
                    })
                  }
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#16a34a",
                  }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "600",
                  }}
                >
                  Set as default address
                </span>
              </label>

              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={saving}
                style={{
                  ...btnStyle,
                  backgroundColor: saving ? "#86efac" : "#16a34a",
                  marginTop: "4px",
                }}
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          )}
        </div>

        {!showAddForm && (
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "14px",
                border: "2px dashed #16a34a",
                backgroundColor: "transparent",
                color: "#16a34a",
                fontWeight: "800",
                fontSize: "15px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0fdf4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              + Add New Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   REUSABLE LOCATION SELECTION SECTION
   You can copy this block into admin booking form later
================================================================ */

const LocationSelectionSection = ({
  setShowAddressModal,
  handleSelectOnMap,
  captureLocation,
  capturingLocation,
  resolvingAddress,
  selectedLocation,
  gpsAccuracy,
}) => {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">

        {/* Saved */}
        <button
          type="button"
          onClick={() => setShowAddressModal(true)}
          className="flex items-center justify-center gap-2
               bg-green-500
               hover:from-green-700 hover:to-emerald-700
               text-black font-semibold py-3 rounded-xl
               shadow-md hover:shadow-lg
               active:scale-95 transition-all"
        >
          🏠 Saved
        </button>

        {/* Map */}
        <button
          type="button"
          onClick={handleSelectOnMap}
          className="flex items-center justify-center gap-2
               bg-yellow-500
               hover:from-indigo-700 hover:to-purple-700
               text-black font-semibold py-3 rounded-xl
               shadow-md hover:shadow-lg
               active:scale-95 transition-all"
        >
          📍 Map
        </button>

        {/* GPS */}
        <button
          type="button"
          onClick={captureLocation}
          disabled={capturingLocation || resolvingAddress}
          className="flex items-center justify-center gap-2
               bg-blue-500
               hover:from-blue-500 hover:to-blue-600
               text-black font-semibold py-3 rounded-xl
               shadow-md hover:shadow-lg
               active:scale-95 transition-all
               disabled:opacity-50"
        >
          {capturingLocation
            ? "GPS..."
            : resolvingAddress
              ? "..."
              : "📡 GPS"}
        </button>

      </div>

      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-semibold text-green-700">
            ✅ Location Selected
          </p>
          <p className="text-sm text-gray-700">{selectedLocation.address_name}</p>
          <p className="text-xs text-gray-400">
            Lat: {selectedLocation.latitude?.toFixed(6)} | Lng:{" "}
            {selectedLocation.longitude?.toFixed(6)}
          </p>
          {gpsAccuracy && (
            <p className="text-xs text-gray-400">
              GPS Accuracy: ±{Math.round(gpsAccuracy)} meters
            </p>
          )}
        </div>
      )}
    </>
  );
};

/* ================================================================
   BOOKING FORM  (/booking-details)
================================================================ */

const BookingForm = ({ bookingData, onBack }) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [cropTypes, setCropTypes] = useState([]);
  const [baseRate, setBaseRate] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  const [finalRate, setFinalRate] = useState(0);
  const [baseTotal, setBaseTotal] = useState(0);
  const [platformTotal, setPlatformTotal] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [capturingLocation, setCapturingLocation] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  const [farmerProfile, setFarmerProfile] = useState(null);
  const [farmerId, setFarmerId] = useState(null);

  const [bookForOthers, setBookForOthers] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("");

  const [farmerPhone, setFarmerPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_SERVICE");

  const [details, setDetails] = useState({
    cropType: "",
    acres: "",
    district: "",
    state: "",
    pincode: "",
    landmark: "",
    selectedDate: "",
    selectedTime: "",
  });

  useEffect(() => {
    const incomingLocation = routerLocation.state?.selectedLocation;

    if (incomingLocation) {
      setSelectedLocation(incomingLocation);
      setDetails((prev) => ({
        ...prev,
        district: incomingLocation.district || prev.district,
        state: incomingLocation.state || prev.state,
        pincode: incomingLocation.pincode || prev.pincode,
      }));
    }
  }, [routerLocation.state]);

  useEffect(() => {
    const loadFarmer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setFarmerId(user.id);

      const { data } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFarmerProfile(data);
        // setFarmerPhone(data.phone_number || ""); // Removed auto-fill

        setDetails((prev) => ({
          ...prev,
          district: data.district || prev.district,
          state: data.state || prev.state,
          pincode: data.pincode || prev.pincode,
        }));
      }
    };

    loadFarmer();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    setResolvingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      const address = data?.address || {};

      const addressName =
        data?.display_name ||
        address?.road ||
        address?.hamlet ||
        address?.village ||
        address?.town ||
        address?.city ||
        "Current Location";

      const district =
        address?.state_district || address?.county || address?.district || "";
      const state = address?.state || "";
      const pincode = address?.postcode || "";

      setSelectedLocation({
        address_name: addressName,
        latitude: lat,
        longitude: lng,
        district,
        state,
        pincode,
      });

      setDetails((prev) => ({
        ...prev,
        district: district || prev.district,
        state: state || prev.state,
        pincode: pincode || prev.pincode,
      }));
    } catch (error) {
      console.error("Reverse geocode error:", error);

      setSelectedLocation({
        address_name: `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
      });
    } finally {
      setResolvingAddress(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGpsAccuracy(pos.coords.accuracy);
        await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setCapturingLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Please allow location permission");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Location information is unavailable");
        } else if (error.code === error.TIMEOUT) {
          alert("Location request timed out. Please try again.");
        } else {
          alert("Unable to capture location");
        }
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const fetchCrops = async () => {
      const { data, error } = await supabase
        .from("service_pricing")
        .select("id, crop_name, base_rate, platform_fee, final_rate, is_active")
        .eq("is_active", true)
        .order("crop_name", { ascending: true });

      if (error) {
        console.error("Crop load error:", error);
        return;
      }

      const rows = data || [];
      setCropTypes(rows);

      if (rows.length > 0) {
        setDetails((prev) => ({
          ...prev,
          cropType: prev.cropType || String(rows[0].id),
        }));
      }
    };

    fetchCrops();
  }, []);

  useEffect(() => {
    if (!details.cropType) {
      setBaseRate(0);
      setPlatformFee(0);
      setFinalRate(0);
      return;
    }

    const selected = cropTypes.find(
      (c) => String(c.id) === String(details.cropType)
    );

    if (selected) {
      setBaseRate(Number(selected.base_rate || 0));
      setPlatformFee(Number(selected.platform_fee || 0));
      setFinalRate(Number(selected.final_rate || 0));
    } else {
      setBaseRate(0);
      setPlatformFee(0);
      setFinalRate(0);
    }
  }, [details.cropType, cropTypes]);

  useEffect(() => {
    const acres = parseFloat(details.acres);

    if (!details.acres || Number.isNaN(acres)) {
      setBaseTotal(0);
      setPlatformTotal(0);
      setTotalPrice(0);
      return;
    }

    setBaseTotal(acres * baseRate);
    setPlatformTotal(acres * platformFee);
    setTotalPrice(acres * finalRate);
  }, [details.acres, baseRate, platformFee, finalRate]);

  const generateTimeSlots = () => {
    const slots = [];
    let hour = 6;
    let minute = 0;

    while (hour < 18) {
      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
      );
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getMinBookingDate = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  };

  const minBookingDate = getMinBookingDate();

  const handleDateChange = (e) => {
    const picked = e.target.value;
    if (picked < minBookingDate) return;
    setDetails({ ...details, selectedDate: picked });
  };

  const handleSelectOnMap = () => {
    navigate("/booking-map", {
      state: {
        returnTo: "/booking-details",
        bookingState: { selectedLocation },
      },
    });
  };

  const handleAddressSelected = (addr) => {
    setSelectedLocation({
      address_name: addr.address_name,
      latitude: addr.latitude,
      longitude: addr.longitude,
      district: addr.district || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    });

    setDetails((prev) => ({
      ...prev,
      district: addr.district || prev.district,
      state: addr.state || prev.state,
      pincode: addr.pincode || prev.pincode,
    }));

    setShowAddressModal(false);
  };

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const validateBooking = () => {
    if (!details.acres || !details.selectedDate || !details.selectedTime) {
      alert("Please fill land area, date and time");
      return false;
    }

    if (!details.cropType) {
      alert("Please select crop type");
      return false;
    }

    if (details.selectedDate < minBookingDate) {
      alert("Booking must be at least 2 days from today");
      return false;
    }

    if (!selectedLocation) {
      alert("Please select field location");
      return false;
    }

    if (bookForOthers) {
      if (!beneficiaryName.trim()) {
        alert("Please enter the beneficiary's name");
        return false;
      }
      if (!beneficiaryPhone.trim()) {
        alert("Please enter the beneficiary's phone number");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateBooking();
    if (!isValid) return;

    setShowPreviewModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!validateBooking()) {
      setShowPreviewModal(false);
      return;
    }

    setConfirmingBooking(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not found");
        setConfirmingBooking(false);
        return;
      }

      const latitude = selectedLocation.latitude;
      const longitude = selectedLocation.longitude;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        alert("Invalid location selected");
        setConfirmingBooking(false);
        return;
      }

      const scheduledAt = new Date(
        `${details.selectedDate}T${details.selectedTime}:00`
      ).toISOString();

      const bookingDate = details.selectedDate;
      const dispatchStarted = new Date().toISOString();

      const selectedCrop = cropTypes.find(
        (c) => String(c.id) === String(details.cropType)
      );

      const selectedCropName = selectedCrop?.crop_name || null;

      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            farmer_id: user.id,
            farmer_name: farmerProfile?.full_name,

            service_type: bookingData.title,
            crop_type: selectedCropName,
            area_size: parseFloat(details.acres),
            total_price: totalPrice,

            district: selectedLocation.district || details.district,
            address_line: selectedLocation.address_name,
            landmark: details.landmark,

            contact_phone: farmerPhone,

            beneficiary_name: bookForOthers ? beneficiaryName.trim() : null,
            beneficiary_phone: bookForOthers ? beneficiaryPhone.trim() : null,

            scheduled_at: scheduledAt,
            latitude,
            longitude,

            status: "requested",
            request_status: "broadcasting",
            current_radius: 0,
            dispatch_started_at: dispatchStarted,
            notified_providers: [],

            payment_status: "PENDING",
            payment_method: paymentMethod,
            booking_source: "farmer_app",
          },
        ])
        .select()
        .single();

      if (error) {
        alert(error.message);
        setConfirmingBooking(false);
        return;
      }
      // ✅ AUTO SAVE LOCATION FOR FUTURE BOOKINGS
try {
  const lat = selectedLocation.latitude;
  const lng = selectedLocation.longitude;

  if (lat && lng) {
    // Check if already exists (avoid duplicates)
    const { data: existing } = await supabase
      .from("farmer_addresses")
      .select("id")
      .eq("farmer_id", user.id)
      .eq("latitude", lat)
      .eq("longitude", lng)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Check if this is first address (set default)
      const { data: existingAddresses } = await supabase
        .from("farmer_addresses")
        .select("id")
        .eq("farmer_id", user.id);

      const isFirst = !existingAddresses || existingAddresses.length === 0;

      await supabase.from("farmer_addresses").insert([
        {
          farmer_id: user.id,
          label: "Recent Location", // you can improve this later
          address_name: selectedLocation.address_name,
          address_line: selectedLocation.address_name,
          district: selectedLocation.district || "",
          state: selectedLocation.state || "",
          pincode: selectedLocation.pincode || "",
          latitude: lat,
          longitude: lng,
          is_default: isFirst,
        },
      ]);
    }
  }
} catch (err) {
  console.error("Auto save address failed:", err);
}
  

      const { data: allProviders } = await supabase
        .from("providers")
        .select("id, lat, lng")
        .eq("is_active", true)
        .eq("is_online", true)
        .eq("verification_status", "approved");

      if (allProviders && allProviders.length > 0) {
        const { data: busyBookings } = await supabase
          .from("bookings")
          .select("provider_id, scheduled_at")
          .in("status", ["accepted", "ongoing"])
          .not("provider_id", "is", null);

        const busyProviderIds = new Set(
          (busyBookings || [])
            .filter((b) => {
              const d = new Date(b.scheduled_at).toISOString().split("T")[0];
              return d === bookingDate;
            })
            .map((b) => b.provider_id)
        );

        const within10km = allProviders
          .filter((p) => {
            if (!p.lat || !p.lng) return false;
            if (busyProviderIds.has(p.id)) return false;
            const dist = haversineKm(latitude, longitude, p.lat, p.lng);
            return dist <= 10;
          })
          .map((p) => p.id);

        if (within10km.length > 0) {
          await supabase
            .from("bookings")
            .update({
              current_radius: 10,
              notified_providers: within10km,
            })
            .eq("id", data.id);
        }
      }

      setShowPreviewModal(false);
      navigate(`/searching-provider/${data.id}`);
    } catch (err) {
      console.error("Confirm booking error:", err);
      alert("Something went wrong while confirming booking");
    } finally {
      setConfirmingBooking(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="pt-24 pb-20 bg-gray-50 min-h-screen flex items-center justify-center px-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-xl w-full text-center">
          <h2 className="text-2xl font-black mb-4">
            Booking session expired
          </h2>
          <button
            onClick={() => navigate("/services")}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-black hover:bg-green-600"
          >
            Go to Services
          </button>
        </div>
      </div>
    );
  }

  const selectedCrop = cropTypes.find(
    (c) => String(c.id) === String(details.cropType)
  );

  return (
    <>
      {showAddressModal && farmerId && (
        <AddressModal
          farmerId={farmerId}
          onClose={() => setShowAddressModal(false)}
          onSelect={handleAddressSelected}
        />
      )}



      <div className="pt-36 pb-20 min-h-screen relative overflow-hidden">
        {/* Transparent Background */}

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="bg-gradient-to-br from-emerald-500/95 via-green-600/90 to-teal-700/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-white/30 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>

            {showPreviewModal ? (
              <div className="flex flex-col min-h-[600px]">
                {/* Header for Review View */}
                <div className="px-10 py-8 border-b border-emerald-100 bg-white/90 sticky top-0 z-20 shadow-sm backdrop-blur-md">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Review Your Booking</h2>
                  <p className="text-black text-sm mt-1 uppercase tracking-widest font-bold opacity-70">Please verify all details before confirming</p>
                </div>

                <div className="p-10 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-black text-xl mb-4 text-black uppercase tracking-tight">Service Details</h3>
                      <div className="space-y-3 text-sm">
                        <p><span className="text-black font-medium uppercase text-xs block mb-1">Service</span> <span className="text-lg font-bold text-emerald-900">{bookingData?.title || "—"}</span></p>
                        <p><span className="text-black font-medium uppercase text-xs block mb-1">Crop</span> <span className="text-lg font-bold text-emerald-900">{selectedCrop?.crop_name || "—"}</span></p>
                        <p><span className="text-black font-medium uppercase text-xs block mb-1">Land Area</span> <span className="text-lg font-bold text-emerald-900">{details.acres} Acres</span></p>
                        <div className="flex gap-10">
                          <p><span className="text-black font-medium uppercase text-xs block mb-1">Date</span> <span className="font-bold text-emerald-900">{details.selectedDate}</span></p>
                          <p><span className="text-black font-medium uppercase text-xs block mb-1">Time</span> <span className="font-bold text-emerald-900">{details.selectedTime}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-black text-xl mb-4 text-black
                     uppercase tracking-tight">Field Location</h3>
                      <div className="space-y-3 text-sm">
                        <p className="break-words">
                          <span className="text-black font-medium uppercase text-xs block mb-1">Address</span>
                          <span className="font-bold leading-relaxed text-emerald-900">{selectedLocation?.address_name || "—"}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <p><span className="text-black font-medium uppercase text-xs block mb-1">District</span> <span className="font-bold text-emerald-900">{selectedLocation?.district || details.district || "—"}</span></p>
                          <p><span className="text-black font-medium uppercase text-xs block mb-1">Pincode</span> <span className="font-bold text-emerald-900">{selectedLocation?.pincode || details.pincode || "—"}</span></p>
                        </div>
                        <p><span className="text-black font-medium uppercase text-xs block mb-1">Landmark</span> <span className="font-bold text-emerald-900">{details.landmark || "—"}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 backdrop-blur-sm shadow-sm">
                    <h3 className="font-black text-xl mb-4 text-black uppercase tracking-tight">Booking Contact</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <p><span className="text-black font-medium uppercase text-xs block mb-1">Booking Type</span> <span className="font-bold text-emerald-900">{bookForOthers ? "Booking for Someone Else" : "Self Booking"}</span></p>
                      <p><span className="text-black font-medium uppercase text-xs block mb-1">{bookForOthers ? "Beneficiary Name" : "Farmer Name"}</span> <span className="font-bold text-emerald-900">{bookForOthers ? beneficiaryName : (bookingData?.farmer_name || "You")}</span></p>
                      <p><span className="text-black font-medium uppercase text-xs block mb-1">Phone Number</span> <span className="font-bold text-emerald-900">{bookForOthers ? beneficiaryPhone : farmerPhone}</span></p>
                    </div>
                  </div>

                  <div className="bg-emerald-950/5 rounded-3xl p-8 border border-emerald-950/10 shadow-inner">
                    <h3 className="font-black text-xl mb-6 text-black uppercase tracking-tight border-b border-emerald-950/5 pb-4">Payment Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-black font-medium">Base Spraying ({baseRate} × {details.acres} acres)</span>
                        <span className="font-mono text-lg font-bold text-emerald-950">₹{baseTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-black font-medium">Platform Fee ({platformFee} × {details.acres} acres)</span>
                        <span className="font-mono text-lg font-bold text-emerald-950">₹{platformTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-black font-bold border-t border-emerald-950/5 pt-4">
                        <span className="uppercase text-xs tracking-widest">Final Rate per Acre</span>
                        <span className="font-mono">₹{finalRate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-emerald-500/20 pt-6 mt-4">
                        <span className="text-3xl font-black uppercase tracking-tighter text-black">Total Payable</span>
                        <div className="text-right">
                          <span className="text-4xl font-black text-black font-mono">₹{totalPrice.toFixed(2)}</span>
                          <p className="text-[10px] text-black uppercase tracking-[0.2em] mt-1 font-bold italic">Inclusive of all taxes</p>
                        </div>
                      </div>
                      <div className="mt-8 pt-4 border-t border-emerald-950/5 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] font-black text-black">Payment Method</span>
                        <span className="bg-emerald-600 text-white px-4 py-2 rounded-full border border-emerald-600 shadow-sm font-black text-xs uppercase tracking-widest">
                          {paymentMethod === "CASH_ON_SERVICE" ? "💵 Cash on Service" : paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-100/50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 leading-relaxed font-black uppercase tracking-wider text-center flex items-center justify-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span>Please verify all details before confirming. provider search flow will start immediately.</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-10 pt-0 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    disabled={confirmingBooking}
                    className="flex-1 py-5 rounded-2xl border-2 border-emerald-100 font-black text-emerald-800 hover:bg-emerald-50 transition-all uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={confirmingBooking}
                    className="flex-1 py-5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10 uppercase tracking-widest text-lg active:scale-95 disabled:opacity-50"
                  >
                    {confirmingBooking ? "Processing..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10">
                <button onClick={onBack} className="absolute top-8 left-8 font-black text-emerald-800 hover:text-emerald-950 transition-colors flex items-center gap-1 uppercase tracking-widest text-xs">
                  ← Back
                </button>

                <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter text-white">
                  Request Drone Service
                </h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">
                          {bookForOthers
                            ? "Booking for Someone Else"
                            : "Booking for Yourself"}
                        </p>
                        <p className="text-sm text-black mt-0.5">
                          {bookForOthers
                            ? "Enter the beneficiary's details below"
                            : "Toggle to book on behalf of another farmer"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBookForOthers((p) => !p);
                          setBeneficiaryName("");
                          setBeneficiaryPhone("");
                        }}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${bookForOthers ? "bg-green-500" : "bg-gray-300"
                          }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${bookForOthers ? "translate-x-8" : "translate-x-1"
                            }`}
                        />
                      </button>
                    </div>

                    {bookForOthers && (
                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-emerald-100/60 mb-1 ml-1">
                            Beneficiary Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Full name of farmer"
                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-green-400 text-black placeholder-gray-400"
                            value={beneficiaryName}
                            onChange={(e) => setBeneficiaryName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-emerald-100/60 mb-1 ml-1">
                            Beneficiary Phone *
                          </label>
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-green-400 text-black placeholder-gray-400"
                            value={beneficiaryPhone}
                            onChange={(e) => setBeneficiaryPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <LocationSelectionSection
                    setShowAddressModal={setShowAddressModal}
                    handleSelectOnMap={handleSelectOnMap}
                    captureLocation={captureLocation}
                    capturingLocation={capturingLocation}
                    resolvingAddress={resolvingAddress}
                    selectedLocation={selectedLocation}
                    gpsAccuracy={gpsAccuracy}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <select
                      className="w-full p-4 bg-white rounded-2xl text-black"
                      value={details.cropType}
                      onChange={(e) =>
                        setDetails({ ...details, cropType: e.target.value })
                      }
                    >
                      {cropTypes.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.crop_name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="Land Area (Acres)"
                      className="w-full p-4 bg-white rounded-2xl text-black placeholder-gray-400"
                      value={details.acres}
                      onChange={(e) => {
                        const value = e.target.value;

                        // allow only numbers + decimal
                        if (/^\d*\.?\d*$/.test(value)) {
                          setDetails({ ...details, acres: value });
                        }
                      }}
                      onWheel={(e) => e.target.blur()} // 🔥 prevents scroll change
                    />
                  </div>

                  {details.acres && (
                    <div className="bg-white border border-white/20 p-6 rounded-2xl text-emerald-900">
                      <h3 className="font-bold text-lg mb-4">Drone Spraying Cost</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Crop: {selectedCrop?.crop_name} • {details.acres} Acres
                      </p>

                      <div className="flex justify-between mb-2">
                        <span>
                          Base Spray ({baseRate} × {details.acres})
                        </span>
                        <span>₹{baseTotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between mb-2">
                        <span>
                          Platform Fee ({platformFee} × {details.acres})
                        </span>
                        <span>₹{platformTotal.toFixed(2)}</span>
                      </div>

                      <div className="border-t my-3" />

                      <div className="flex justify-between text-xl font-bold text-emerald-900">
                        <span>Total Payable</span>
                        <span>₹{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {!bookForOthers && (
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      className="w-full p-4 bg-white rounded-2xl text-black placeholder-gray-400"
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                    />
                  )}

                  <input
                    type="text"
                    placeholder="Optional Landmark"
                    className="w-full p-4 bg-white rounded-2xl text-black placeholder-gray-400"
                    value={details.landmark}
                    onChange={(e) =>
                      setDetails({ ...details, landmark: e.target.value })
                    }
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-white ml-1">
                      Booking Date{" "}
                      <span className="text-emerald-100/50 font-normal">
                        (available from {minBookingDate})
                      </span>
                    </label>

                    <input
                      type="date"
                      required
                      min={minBookingDate}
                      className="w-full p-4 bg-white rounded-2xl text-black"
                      value={details.selectedDate}
                      onChange={handleDateChange}
                    />
                  </div>

                  {details.selectedDate && details.selectedDate >= minBookingDate && (
                    <div className="grid grid-cols-4 gap-3">
                      {timeSlots.map((slot, index) => {
                        const isSelected = details.selectedTime === slot;

                        return (
                          <div
                            key={index}
                            onClick={() =>
                              setDetails({ ...details, selectedTime: slot })
                            }
                            className={`p-3 rounded-lg text-center cursor-pointer text-sm transition-colors ${isSelected
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 hover:bg-green-100 text-black"
                              }`}
                          >
                            {slot}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="font-bold text-white">Payment Method</p>

                    <div
                      onClick={() => setPaymentMethod("CASH_ON_SERVICE")}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === "CASH_ON_SERVICE"
                        ? "border-emerald-300 bg-white"
                        : "border-white/10 bg-white/5 hover:border-white/40"
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "CASH_ON_SERVICE"
                          ? "border-green-500"
                          : "border-gray-300"
                          }`}
                      >
                        {paymentMethod === "CASH_ON_SERVICE" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-bold text-sm ${paymentMethod === "CASH_ON_SERVICE"
                            ? "text-emerald-900"
                            : "text-white"
                            }`}
                        >
                          💵 Cash on Service
                        </p>
                        <p className={`text-xs mt-0.5 ${paymentMethod === "CASH_ON_SERVICE" ? "text-emerald-800" : "text-emerald-100/70"}`}>
                          Pay the operator directly after the service is completed
                        </p>
                      </div>

                      {paymentMethod === "CASH_ON_SERVICE" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-white/5 bg-white opacity-50 cursor-not-allowed">
                      <div className="w-5 h-5 rounded-full border-2 border-black shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-black">
                          🏦 Online Payment
                        </p>
                        <p className="text-xs text-black mt-0.5">Coming soon</p>
                      </div>
                      <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-semibold shrink-0">
                        Soon
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={
                      !details.acres ||
                      capturingLocation ||
                      resolvingAddress ||
                      cropTypes.length === 0
                    }
                    className="w-full bg-white text-emerald-900 py-5 rounded-2xl font-black text-xl hover:bg-emerald-50 shadow-xl disabled:opacity-50 transition-all active:scale-95"
                  >
                    {bookForOthers ? "Review Booking for Others" : "Review Booking"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingForm;
