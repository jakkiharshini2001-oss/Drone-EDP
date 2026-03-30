import { useEffect, useState, useMemo } from "react";
import locations from "../data/locations.json";

const LocationSelector = ({ value, onChange }) => {
  const [initialized, setInitialized] = useState(false);

  const states = useMemo(() => Object.keys(locations), []);
  
  const districts = useMemo(() => {
    return value.state ? Object.keys(locations[value.state] || {}) : [];
  }, [value.state]);

  const mandals = useMemo(() => {
    return (value.state && value.district)
      ? locations[value.state]?.[value.district] || []
      : [];
  }, [value.state, value.district]);

  // Handle state/district changes to reset child values
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return;
    }

    if (value.state) {
      if (!districts.includes(value.district)) {
        onChange({ ...value, district: "", mandal: "" });
      }
    } else {
      if (value.district || value.mandal) {
        onChange({ ...value, district: "", mandal: "" });
      }
    }
  }, [value.state, districts]);

  useEffect(() => {
    if (!initialized) return;

    if (value.state && value.district) {
      if (!mandals.includes(value.mandal)) {
        onChange({ ...value, mandal: "" });
      }
    }
  }, [value.district, mandals]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* STATE */}
      <div>
        <label className="block text-xs font-bold text-white uppercase mb-2">
          State
        </label>
        <select
          value={value.state}
          onChange={(e) =>
            onChange({ ...value, state: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white text-emerald-900 focus:border-green-500 focus:outline-none hover:bg-emerald-50 cursor-pointer transition-colors"
        >
          <option value="" className="bg-white text-emerald-900">Select State</option>
          {states.map((s) => (
            <option key={s} value={s} className="bg-white text-emerald-900">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* DISTRICT */}
      <div>
        <label className="block text-xs font-bold text-white uppercase mb-2">
          District
        </label>
        <select
          value={value.district}
          disabled={!value.state}
          onChange={(e) =>
            onChange({ ...value, district: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white text-emerald-900 focus:border-green-500 focus:outline-none disabled:bg-white/20 disabled:text-emerald-900/50 hover:bg-emerald-50 cursor-pointer transition-colors"
        >
          <option value="" className="bg-white text-emerald-900">Select District</option>
          {districts.map((d) => (
            <option key={d} value={d} className="bg-white text-emerald-900">
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* MANDAL */}
      <div>
        <label className="block text-xs font-bold text-white uppercase mb-2">
          Mandal
        </label>
        <select
          value={value.mandal}
          disabled={!value.district}
          onChange={(e) =>
            onChange({ ...value, mandal: e.target.value })
          }
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white text-emerald-900 focus:border-green-500 focus:outline-none disabled:bg-white/20 disabled:text-emerald-900/50 hover:bg-emerald-50 cursor-pointer transition-colors"
        >
          <option value="" className="bg-white text-emerald-900">Select Mandal</option>
          {mandals.map((m) => (
            <option key={m} value={m} className="bg-white text-emerald-900">
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationSelector;