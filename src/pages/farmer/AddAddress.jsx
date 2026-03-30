import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapLocationPicker from "../../components/maps/MapLocationPicker";
import { supabase } from "../../lib/supabase";

const AddAddress = () => {
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [form, setForm] = useState({
    address_name: "",
    address_line: "",
    district: "",
    state: "",
    pincode: ""
  });

  /* ================= HANDLE INPUT ================= */

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  /* ================= BUILD BETTER ADDRESS ================= */

  const buildAddressLine = (address = {}) => {
    const parts = [
      address.road,
      address.suburb,
      address.hamlet,
      address.village,
      address.town,
      address.city
    ].filter(Boolean);

    return [...new Set(parts)].join(", ");
  };

  /* ================= REVERSE GEOCODE ================= */

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      setFetchingAddress(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }

      const data = await response.json();
      const address = data?.address || {};

      const addressLine =
        buildAddressLine(address) ||
        data?.display_name ||
        "";

      const district =
        address.state_district ||
        address.county ||
        address.district ||
        "";

      const state = address.state || "";

      const pincode = address.postcode || "";

      setForm((prev) => ({
        ...prev,
        address_line: addressLine || prev.address_line,
        district: district || prev.district,
        state: state || prev.state,
        pincode: pincode || prev.pincode
      }));
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      alert("Unable to auto-fetch address. Please enter it manually.");
    } finally {
      setFetchingAddress(false);
    }
  };

  /* ================= HANDLE LOCATION SELECT ================= */

  const handleLocationSelect = async (loc) => {
    if (!loc) return;

    setLocation(loc);

    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;

    if (typeof lat !== "number" || typeof lng !== "number") {
      alert("Invalid location selected");
      return;
    }

    await fetchAddressFromCoordinates(lat, lng);
  };

  /* ================= GET CURRENT LOCATION ================= */

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const loc = { lat, lng };
        setLocation(loc);

        await fetchAddressFromCoordinates(lat, lng);

        setDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to access current location. Please allow location permission.");
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  /* ================= OPTIONAL AUTO DETECT ON PAGE LOAD ================= */

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  /* ================= SAVE ADDRESS ================= */

  const handleSave = async () => {
    if (!form.address_name.trim()) {
      alert("Please enter address name");
      return;
    }

    if (!location) {
      alert("Please select the field location on map");
      return;
    }

    if (!form.address_line.trim()) {
      alert("Please confirm the village/address");
      return;
    }

    if (!form.district.trim()) {
      alert("Please confirm district");
      return;
    }

    if (!form.state.trim()) {
      alert("Please confirm state");
      return;
    }

    if (!form.pincode.trim()) {
      alert("Please confirm pincode");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("User not logged in");
        setSaving(false);
        return;
      }

      const latitude = location.lat ?? location.latitude;
      const longitude = location.lng ?? location.longitude;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        alert("Invalid map location");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("farmer_addresses")
        .insert([
          {
            farmer_id: user.id,
            address_name: form.address_name.trim(),
            address_line: form.address_line.trim(),
            district: form.district.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
            latitude,
            longitude
          }
        ]);

      if (error) {
        console.error("Insert error:", error);
        alert(error.message);
        setSaving(false);
        return;
      }

      alert("✅ Address saved successfully");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="pt-28 pb-20 bg-transparent min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-xl">
        <h1 className="text-2xl font-black mb-6 text-center">
          Add New Field Address
        </h1>

        <div className="mb-4">
          <button
            onClick={handleUseCurrentLocation}
            type="button"
            disabled={detectingLocation}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {detectingLocation ? "Detecting Current Location..." : "Use Current Location"}
          </button>
        </div>

        {/* ADDRESS NAME */}

        <input
          type="text"
          placeholder="Address Name (Example: Cotton Field)"
          className="w-full p-4 bg-gray-50 rounded-xl mb-4"
          value={form.address_name}
          onChange={(e) => handleChange("address_name", e.target.value)}
        />

        {/* ADDRESS LINE */}

        <input
          type="text"
          placeholder="Village / Address"
          className="w-full p-4 bg-gray-50 rounded-xl mb-4"
          value={form.address_line}
          onChange={(e) => handleChange("address_line", e.target.value)}
        />

        {/* DISTRICT + STATE */}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="District"
            className="p-4 bg-gray-50 rounded-xl"
            value={form.district}
            onChange={(e) => handleChange("district", e.target.value)}
          />

          <input
            type="text"
            placeholder="State"
            className="p-4 bg-gray-50 rounded-xl"
            value={form.state}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>

        {/* PINCODE */}

        <input
          type="text"
          placeholder="Pincode"
          className="w-full p-4 bg-gray-50 rounded-xl mb-6"
          value={form.pincode}
          onChange={(e) => handleChange("pincode", e.target.value)}
        />

        {/* MAP PICKER */}

        <h2 className="font-bold mb-3">Select Field Location</h2>

        <MapLocationPicker onLocationSelect={handleLocationSelect} />

        {fetchingAddress && (
          <p className="text-sm text-blue-600 mt-3 text-center">
            Fetching address from selected location...
          </p>
        )}

        {location && (
          <div className="mt-3 text-center">
            <p className="text-green-600 text-sm">
              📍 Location Selected:
              {" "}
              {(location.lat ?? location.latitude).toFixed(5)}
              {" , "}
              {(location.lng ?? location.longitude).toFixed(5)}
            </p>
          </div>
        )}

        {/* SAVE BUTTON */}

        <button
          onClick={handleSave}
          disabled={saving || fetchingAddress}
          className="w-full mt-6 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Saving Address..." : "Save Address"}
        </button>
      </div>
    </div>
  );
};

export default AddAddress;