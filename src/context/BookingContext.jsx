import React, { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const BookingContext = createContext();

export const useBooking = () => {
    return useContext(BookingContext);
};

export const BookingProvider = ({ children }) => {
    const [bookingFlow, setBookingFlow] = useState(null);
    const navigate = useNavigate();
    const { userData } = useAuth();

    const handleFinalBooking = async (finalDetails) => {
        try {
            if (!bookingFlow) {
                alert("Booking session expired. Please select service again.");
                navigate("/services");
                return;
            }

            const providerUUID = bookingFlow.provider_id;

            if (!providerUUID) {
                alert("Provider ID missing. Please select provider again.");
                navigate(-1);
                return;
            }

            const { error } = await supabase.from("bookings").insert([
                {
                    farmer_id: userData?.id,
                    service_type: bookingFlow.serviceTitle,
                    equipment_option: bookingFlow.option,
                    provider_id: providerUUID,
                    crop_type: finalDetails.cropType,
                    area_size: parseFloat(finalDetails.areaSize),
                    liquid_type: finalDetails.liquidType,
                    village: finalDetails.address,
                    district: "",
                    scheduled_at: finalDetails.scheduledAt,
                    status: "NEW",
                    total_price: parseFloat(finalDetails.areaSize) * bookingFlow.price,
                },
            ]);

            if (error) throw error;

            alert("Booking Saved Successfully ✅");
            setBookingFlow(null);
            navigate("/my-bookings");
        } catch (err) {
            alert("Booking failed: " + err.message);
        }
    };

    const value = {
        bookingFlow,
        setBookingFlow,
        handleFinalBooking,
    };

    return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};
