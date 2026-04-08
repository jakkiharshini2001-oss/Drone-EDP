import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProviderLayout from "../../components/provider/ProviderLayout";
import { supabase } from "../../lib/supabase";
import { Trash2, Edit3, Upload, ArrowLeft, FileText } from "lucide-react";
import toast from "react-hot-toast";

const BUCKET_NAME = "provider-documents";

const FOLDER_MAP = {
  drone_reg_url: "drone-reg-proofs",
  drone_photo_url: "drone-photos",
  insurance_url: "insurance-proofs",
};

const emptyFormState = {
  categoryId: "",
  categoryName: "",
};

const emptyDroneState = {
  id: null,
  drone_brand: "",
  drone_model: "",
  drone_category: "",
  drone_uin: "",
  tank_capacity: "",
  battery_sets: "",
  battery_capacity: "",
  primary_usage: "",
  insurance_company: "",
  insurance_policy_number: "",
  insurance_expiry: "",
  drone_reg_url: "",
  drone_photo_url: "",
  drone_experience: "",
  acres_sprayed: "",
  insurance_url: "",
  verification_status: "pending",
  is_active: true,
};

const emptyPendingFiles = {
  drone_reg_url: null,
  drone_photo_url: null,
  insurance_url: null,
};

function isDroneCat(name = "") {
  return /drone|spray|spraying/i.test(String(name));
}

function getPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data?.publicUrl || "";
}

async function uploadFile(file, folder, userId) {
  if (!file) return null;

  const ext = file?.name?.split(".").pop()?.toLowerCase() || "file";
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;
  const filePath = `${userId}/${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;
  return getPublicUrl(filePath);
}

function toNullableInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function toNullableFloat(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

function normalizeDateForInput(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

export default function ProviderServices() {
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);

  const [formData, setFormData] = useState(emptyFormState);
  const [droneData, setDroneData] = useState(emptyDroneState);
  const [pendingFiles, setPendingFiles] = useState(emptyPendingFiles);

  const [submitting, setSubmitting] = useState(false);

  const showDroneFields = useMemo(
    () => isDroneCat(formData.categoryName),
    [formData.categoryName]
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("provider-drones-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provider_drones" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDrones([]);
        setCategories([]);
        return;
      }

      const [catRes, droneRes] = await Promise.all([
        supabase
          .from("service_categories")
          .select("id, name")
          .order("name", { ascending: true }),

        supabase
          .from("provider_drones")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (catRes.error) throw catRes.error;
      if (droneRes.error) throw droneRes.error;

      const categoriesData = catRes.data || [];
      const dronesData = droneRes.data || [];

      const categoryMap = new Map(
        categoriesData.map((cat) => [String(cat.id), cat])
      );

      const mappedDrones = dronesData.map((drone) => ({
        ...drone,
        service_categories:
          categoryMap.get(String(drone.category_id || drone.service_id)) || null,
      }));

      setCategories(categoriesData);
      setDrones(mappedDrones);
    } catch (err) {
      console.error("fetchData error:", err);
      toast.error(err?.message || "Failed to load drone services");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingDrone(null);
    setFormData(emptyFormState);
    setDroneData(emptyDroneState);
    setPendingFiles(emptyPendingFiles);
    setSubmitting(false);
  }

  function openAddForm() {
    setEditingDrone(null);
    setFormData(emptyFormState);
    setDroneData(emptyDroneState);
    setPendingFiles(emptyPendingFiles);
    setShowForm(true);
  }

  function handleFileSelect(e, field) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setPendingFiles((prev) => ({
      ...prev,
      [field]: file,
    }));

    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");
      if (!formData.categoryId) throw new Error("Please select service category");

      if (!droneData.drone_brand.trim()) {
        throw new Error("Please enter drone brand");
      }

      if (!droneData.drone_model.trim()) {
        throw new Error("Please enter drone model");
      }

      let finalDroneRegUrl = droneData.drone_reg_url || null;
      let finalDronePhotoUrl = droneData.drone_photo_url || null;
      let finalInsuranceUrl = droneData.insurance_url || null;

      if (pendingFiles.drone_reg_url) {
        finalDroneRegUrl = await uploadFile(
          pendingFiles.drone_reg_url,
          FOLDER_MAP.drone_reg_url,
          user.id
        );
      }

      if (pendingFiles.drone_photo_url) {
        finalDronePhotoUrl = await uploadFile(
          pendingFiles.drone_photo_url,
          FOLDER_MAP.drone_photo_url,
          user.id
        );
      }

      if (pendingFiles.insurance_url) {
        finalInsuranceUrl = await uploadFile(
          pendingFiles.insurance_url,
          FOLDER_MAP.insurance_url,
          user.id
        );
      }

      const payload = {
        provider_id: user.id,

        // keep category in service_id because your table currently has service_id
        service_id: formData.categoryId,

        drone_brand: droneData.drone_brand.trim() || null,
        drone_model: droneData.drone_model.trim() || null,
        drone_category: droneData.drone_category || null,
        drone_uin: droneData.drone_uin.trim() || null,
        tank_capacity: droneData.tank_capacity.trim() || null,
        battery_sets: toNullableInt(droneData.battery_sets),
        battery_capacity: droneData.battery_capacity.trim() || null,
        primary_usage: droneData.primary_usage || null,
        insurance_company: droneData.insurance_company.trim() || null,
        insurance_policy_number:
          droneData.insurance_policy_number.trim() || null,
        insurance_expiry:
          normalizeDateForInput(droneData.insurance_expiry) || null,
        drone_reg_url: finalDroneRegUrl,
        drone_photo_url: finalDronePhotoUrl,
        drone_experience: toNullableFloat(droneData.drone_experience),
        acres_sprayed: toNullableFloat(droneData.acres_sprayed),
        insurance_url: finalInsuranceUrl,
      };

      if (editingDrone?.id) {
        const { error } = await supabase
          .from("provider_drones")
          .update(payload)
          .eq("id", editingDrone.id)
          .eq("provider_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("provider_drones")
          .insert(payload);

        if (error) throw error;
      }

      toast.success(editingDrone ? "Drone updated" : "Drone added");
      resetForm();
      await fetchData();
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(drone) {
    try {
      setEditingDrone(drone);

      const selectedCategoryId = drone.category_id || drone.service_id || "";
      const selectedCategory =
        categories.find((c) => String(c.id) === String(selectedCategoryId)) ||
        null;

      setFormData({
        categoryId: selectedCategoryId,
        categoryName: selectedCategory?.name || "",
      });

      setDroneData({
        id: drone.id || null,
        drone_brand: drone.drone_brand || "",
        drone_model: drone.drone_model || "",
        drone_category: drone.drone_category || "",
        drone_uin: drone.drone_uin || "",
        tank_capacity: drone.tank_capacity || "",
        battery_sets:
          drone.battery_sets !== null && drone.battery_sets !== undefined
            ? String(drone.battery_sets)
            : "",
        battery_capacity: drone.battery_capacity || "",
        primary_usage: drone.primary_usage || "",
        insurance_company: drone.insurance_company || "",
        insurance_policy_number: drone.insurance_policy_number || "",
        insurance_expiry: normalizeDateForInput(drone.insurance_expiry),
        drone_reg_url: drone.drone_reg_url || "",
        drone_photo_url: drone.drone_photo_url || "",
        drone_experience:
          drone.drone_experience !== null && drone.drone_experience !== undefined
            ? String(drone.drone_experience)
            : "",
        acres_sprayed:
          drone.acres_sprayed !== null && drone.acres_sprayed !== undefined
            ? String(drone.acres_sprayed)
            : "",
        insurance_url: drone.insurance_url || "",
        verification_status: drone.verification_status || "pending",
        is_active: drone.is_active ?? true,
      });

      setPendingFiles(emptyPendingFiles);
      setShowForm(true);
    } catch (err) {
      console.error("handleEdit error:", err);
      toast.error(err?.message || "Failed to load drone details");
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Are you sure you want to delete this drone?");
    if (!ok) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("provider_drones")
        .delete()
        .eq("id", id)
        .eq("provider_id", user.id);

      if (error) throw error;

      toast.success("Drone deleted");
      await fetchData();
    } catch (err) {
      console.error("handleDelete error:", err);
      toast.error(err?.message || "Delete failed");
    }
  }

  const filteredCategories = categories.filter((c) => isDroneCat(c.name));

  const filteredDrones =
    activeCategory === "ALL"
      ? drones
      : drones.filter((d) => d.service_categories?.name === activeCategory);

  const inputClass =
    "w-full border border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:border-green-400 text-sm";

  const labelClass = "block text-xs font-semibold text-gray-500 mb-1";

  const FileUploadField = ({
    label,
    field,
    currentUrl,
    pendingFile,
    accept = "*",
  }) => (
    <div>
      <label className={labelClass}>{label}</label>

      <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 hover:bg-green-50 hover:border-green-400 transition-colors">
        <Upload size={14} className="text-gray-400" />
        <span className="text-xs text-gray-500">
          {pendingFile
            ? `${pendingFile.name} selected`
            : currentUrl
              ? "Replace file"
              : "Choose file"}
        </span>

        <input
          type="file"
          hidden
          accept={accept}
          onChange={(e) => handleFileSelect(e, field)}
        />
      </label>

      {pendingFile ? (
        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
          <FileText size={12} />
          Will upload on submit
        </div>
      ) : currentUrl ? (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-600 underline mt-1 inline-block"
        >
          View current file
        </a>
      ) : null}
    </div>
  );

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-gray-50 px-10 pt-28 pb-16">
        <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 mb-2"
              type="button"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              My Drone Services
            </h1>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="bg-black text-white px-6 py-3 rounded-xl"
          >
            + Add Drone
          </button>
        </div>

        <div className="max-w-7xl mx-auto mb-8 flex gap-3 flex-wrap">
          {["ALL", ...filteredCategories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === cat
                  ? "bg-black text-white"
                  : "bg-white border"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 mb-12 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingDrone ? "Edit Drone Service" : "Add New Drone Service"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Service Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => {
                    const cat = categories.find(
                      (c) => String(c.id) === String(e.target.value)
                    );
                    setFormData({
                      categoryId: e.target.value,
                      categoryName: cat?.name || "",
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {showDroneFields && (
                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚁</span>
                    <h3 className="font-bold text-gray-800">Drone Details</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Drone Brand *</label>
                      <input
                        value={droneData.drone_brand}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            drone_brand: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Drone Model *</label>
                      <input
                        value={droneData.drone_model}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            drone_model: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Drone Category</label>
                      <select
                        value={droneData.drone_category}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            drone_category: e.target.value,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="">Select Category</option>
                        <option value="Nano">Nano</option>
                        <option value="Micro">Micro</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Drone UIN</label>
                      <input
                        value={droneData.drone_uin}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            drone_uin: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Tank Capacity</label>
                      <input
                        value={droneData.tank_capacity}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            tank_capacity: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Battery Sets</label>
                      <input
                        type="number"
                        min="0"
                        value={droneData.battery_sets}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            battery_sets: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Battery Capacity</label>
                      <input
                        value={droneData.battery_capacity}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            battery_capacity: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Primary Usage</label>
                    <select
                      value={droneData.primary_usage}
                      onChange={(e) =>
                        setDroneData((prev) => ({
                          ...prev,
                          primary_usage: e.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select Usage</option>
                      <option value="Agriculture Spraying">
                        Agriculture Spraying
                      </option>
                      <option value="Crop Monitoring">Crop Monitoring</option>
                      <option value="Mapping">Mapping</option>
                      <option value="Inspection">Inspection</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Drone Experience</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={droneData.drone_experience}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            drone_experience: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Acres Sprayed</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={droneData.acres_sprayed}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            acres_sprayed: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-700 text-sm">
                      Drone Documents
                    </h4>

                    <FileUploadField
                      label="Drone Registration Certificate"
                      field="drone_reg_url"
                      currentUrl={droneData.drone_reg_url}
                      pendingFile={pendingFiles.drone_reg_url}
                    />

                    <FileUploadField
                      label="Drone Photo"
                      field="drone_photo_url"
                      currentUrl={droneData.drone_photo_url}
                      pendingFile={pendingFiles.drone_photo_url}
                      accept="image/*"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-semibold text-gray-700 text-sm">
                      Insurance Details
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Insurance Company</label>
                        <input
                          value={droneData.insurance_company}
                          onChange={(e) =>
                            setDroneData((prev) => ({
                              ...prev,
                              insurance_company: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Policy Number</label>
                        <input
                          value={droneData.insurance_policy_number}
                          onChange={(e) =>
                            setDroneData((prev) => ({
                              ...prev,
                              insurance_policy_number: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Insurance Expiry Date</label>
                      <input
                        type="date"
                        value={normalizeDateForInput(droneData.insurance_expiry)}
                        onChange={(e) =>
                          setDroneData((prev) => ({
                            ...prev,
                            insurance_expiry: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <FileUploadField
                      label="Insurance Document"
                      field="insurance_url"
                      currentUrl={droneData.insurance_url}
                      pendingFile={pendingFiles.insurance_url}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : editingDrone
                      ? "Update Drone"
                      : "Submit Drone"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              Loading drone services...
            </div>
          ) : filteredDrones.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🚁</p>
              <p className="font-semibold">No drone services added yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {filteredDrones.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">
                        {d.drone_brand || "Drone"} {d.drone_model || ""}
                      </h3>

                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        {d.service_categories?.name || "Drone Service"}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>
                        <span className="font-medium">UIN:</span>{" "}
                        {d.drone_uin || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Usage:</span>{" "}
                        {d.primary_usage || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Tank:</span>{" "}
                        {d.tank_capacity || "-"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-600">
                        pending
                      </span>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(d)}
                          className="text-gray-500 hover:text-black"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}