import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix leaflet icon bug in Vite */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const MapLocationPicker = ({ onLocationSelect, onAddressDetected }) => {

  const [position, setPosition] = useState(null);

  /* ================= REVERSE GEOCODING ================= */

  const fetchAddress = async (lat, lng) => {

    try {

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );

      const data = await res.json();

      console.log("OSM RESPONSE:", data);

      const addr = data.address || {};

      const detectedAddress = {

        village:
          addr.village ||
          addr.town ||
          addr.hamlet ||
          addr.suburb ||
          addr.city ||
          "",

        district:
          addr.state_district ||
          addr.county ||
          addr.region ||
          "",

        state: addr.state || "",

        pincode: addr.postcode || ""

      };

      console.log("Detected Address:", detectedAddress);

      if (onAddressDetected) {
        onAddressDetected(detectedAddress);
      }

    } catch (err) {

      console.error("Reverse geocoding error:", err);

    }

  };

  /* ================= MAP CLICK ================= */

  const LocationMarker = () => {

    useMapEvents({

      click(e) {

        const { lat, lng } = e.latlng;

        setPosition([lat, lng]);

        if (onLocationSelect) {
          onLocationSelect({
            latitude: lat,
            longitude: lng
          });
        }

        fetchAddress(lat, lng);

      }

    });

    return position ? (

      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {

            const marker = e.target;
            const { lat, lng } = marker.getLatLng();

            setPosition([lat, lng]);

            if (onLocationSelect) {
              onLocationSelect({
                latitude: lat,
                longitude: lng
              });
            }

            fetchAddress(lat, lng);

          }
        }}
      />

    ) : null;

  };

  return (

    <div className="w-full h-[420px] rounded-xl overflow-hidden">

      <MapContainer
        center={[17.385044, 78.486671]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >

        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker />

      </MapContainer>

    </div>

  );

};

export default MapLocationPicker;