/* ================================================================
   DROP THIS COMPONENT INTO AdminProviders.jsx

   Usage:
     import ProviderRatingBadge from "./ProviderRatingBadge";
     <ProviderRatingBadge providerId={provider.id} />

   OR paste the useProviderRating hook + ProviderRatingBadge
   directly into your AdminProviders.jsx file.
================================================================ */

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/* ── Hook: fetch avg rating for a provider ── */
export const useProviderRating = (providerId) => {
  const [avgRating,    setAvgRating]    = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!providerId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("rating")
        .eq("provider_id", providerId)
        .eq("status", "completed")
        .not("rating", "is", null);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, b) => sum + b.rating, 0) / data.length;
        setAvgRating(avg.toFixed(1));
        setTotalRatings(data.length);
      }
      setLoading(false);
    };
    fetch();
  }, [providerId]);

  return { avgRating, totalRatings, loading };
};

/* ── Badge component ── */
export default function ProviderRatingBadge({ providerId }) {
  const { avgRating, totalRatings, loading } = useProviderRating(providerId);

  if (loading) return null;

  if (!avgRating) {
    return (
      <span className="text-xs text-black font-medium">No ratings yet</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-yellow-400 text-sm">★</span>
      <span className="text-sm font-bold text-black">{avgRating}</span>
      <span className="text-xs text-black">({totalRatings} review{totalRatings !== 1 ? "s" : ""})</span>
    </div>
  );
}