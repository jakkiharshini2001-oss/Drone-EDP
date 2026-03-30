import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ProviderLayout from "../../components/provider/ProviderLayout";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";

const CATEGORY_WEIGHTS = {
  Nano: 1,
  Micro: 2,
  Small: 3,
  Medium: 4,
  Large: 5
};

const EMPTY_DRONE = {
  drone_brand: "",
  drone_model: "",
  drone_serial_number: "",
  drone_category: "",
  drone_uin: "",
  tank_capacity: "",
  primary_usage: "",
  battery_sets: "",
  battery_capacity: "",
  insurance_company: "",
  insurance_policy_number: "",
  insurance_expiry: "",
  drone_experience: "",
  acres_sprayed: "",
  drone_reg_proof: null,
  insurance_proof: null,
  drone_photo: null
};

export default function ProviderVerification() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [providerId, setProviderId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [drones, setDrones] = useState([{ ...EMPTY_DRONE }]);

  const [formData, setFormData] = useState({
    // Step 1
    full_name: "",
    aadhar_number: "",
    aadharProof: null,
    pan_number: "",
    panProof: null,
    profilePhoto: null,
    permanent_address: "",
    landmark: "",
    contact_phone: "",

    // Step 2 - RPC
    rpc_number: "",
    rpc_institute: "",
    rpc_category: "",
    rpc_issue_date: "",
    rpc_expiry_date: "",
    rpc_proof: null,
    pilot_photo: null,

    // Step 3 - Bank
    bank_name: "",
    account_holder: "",
    account_number: "",
    ifsc_code: "",

    bank_proof: null,
    declarationAccepted: false
  });

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;
      setProviderId(user.id);

      const { data: profData, error } = await supabase
        .from("providers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching provider profile:", error);
      } else if (profData) {
        setFormData(prev => ({
          ...prev,
          full_name: profData.full_name || "",
          contact_phone: profData.phone_number || "",
          permanent_address: profData.permanent_address || "",
          landmark: profData.landmark || ""
        }));
      }
    };

    loadData();
  }, []);

  const updateDroneField = (index, field, value) => {
    setDrones((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const addDrone = () => {
    setDrones((prev) => [...prev, { ...EMPTY_DRONE }]);
  };

  const removeDrone = (index) => {
    setDrones((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file, folder, customName = "") => {
    if (!file) return null;

    const ext = file.name?.split(".").pop() || "file";
    const filePath = `${folder}/${providerId}-${customName || Date.now()}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("provider-documents")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("provider-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const validateStep1 = () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return false;
    }

    if (!formData.aadhar_number.trim()) {
      toast.error("Aadhaar number is required");
      return false;
    }

    if (!formData.pan_number.trim()) {
      toast.error("PAN number is required");
      return false;
    }

    if (!formData.contact_phone.trim()) {
      toast.error("Contact number is required");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.rpc_number.trim()) {
      toast.error("RPC number is required");
      return false;
    }

    if (!formData.rpc_institute.trim()) {
      toast.error("RPC institute is required");
      return false;
    }

    if (!formData.rpc_category) {
      toast.error("Please select RPC category");
      return false;
    }

    if (drones.length === 0) {
      toast.error("Please add at least one drone");
      return false;
    }

    const rpcWeight = CATEGORY_WEIGHTS[formData.rpc_category] || 0;

    for (let i = 0; i < drones.length; i++) {
      const drone = drones[i];

      if (!drone.drone_brand?.trim()) {
        toast.error(`Drone #${i + 1}: Drone brand is required`);
        return false;
      }

      if (!drone.drone_model?.trim()) {
        toast.error(`Drone #${i + 1}: Drone model is required`);
        return false;
      }

      if (!drone.drone_category) {
        toast.error(`Drone #${i + 1}: Drone category is required`);
        return false;
      }

      const droneWeight = CATEGORY_WEIGHTS[drone.drone_category] || 0;

      if (droneWeight > rpcWeight) {
        toast.error(
          `Drone #${i + 1}: Category mismatch. RPC category (${formData.rpc_category}) is lower than drone category (${drone.drone_category}).`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.declarationAccepted) {
        toast.error("Please accept declaration");
        return;
      }

      if (!providerId) {
        toast.error("Provider not found");
        return;
      }

      if (!validateStep1()) return;
      if (!validateStep2()) return;

      setLoading(true);

      // provider-level files
      const aadharProofUrl = await uploadFile(
        formData.aadharProof,
        "aadhar-proofs",
        "aadhar"
      );
      const panProofUrl = await uploadFile(
        formData.panProof,
        "pan-proofs",
        "pan"
      );
      const profilePhotoUrl = await uploadFile(
        formData.profilePhoto,
        "profile-photos",
        "profile"
      );
      const rpcProofUrl = await uploadFile(
        formData.rpc_proof,
        "rpc-proofs",
        "rpc"
      );
      const pilotPhotoUrl = await uploadFile(
        formData.pilot_photo,
        "pilot-photos",
        "pilot"
      );
      const bankProofUrl = await uploadFile(
        formData.bank_proof,
        "bank-proofs",
        "bank"
      );

      // update providers table
      const { error: providerError } = await supabase
        .from("providers")
        .update({
          contact_phone: formData.contact_phone,
          permanent_address: formData.permanent_address,
          landmark: formData.landmark,

          aadhar_number: formData.aadhar_number,
          aadhar_url: aadharProofUrl,

          pan_number: formData.pan_number,
          pan_url: panProofUrl,

          profile_photo_url: profilePhotoUrl,

          rpc_number: formData.rpc_number,
          rpc_institute: formData.rpc_institute,
          rpc_category: formData.rpc_category,
          rpc_issue_date: formData.rpc_issue_date || null,
          rpc_expiry_date: formData.rpc_expiry_date || null,
          rpc_url: rpcProofUrl,
          pilot_photo_url: pilotPhotoUrl,

          bank_name: formData.bank_name,
          account_holder_name: formData.account_holder,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          bank_url: bankProofUrl,

          verification_status: "pending",
          verification_submitted: true
        })
        .eq("id", providerId);

      if (providerError) throw providerError;

      // remove old drones first
      const { error: deleteDronesError } = await supabase
        .from("provider_drones")
        .delete()
        .eq("provider_id", providerId);

      if (deleteDronesError) throw deleteDronesError;

      // upload and insert all drones
      const droneRows = [];

      for (let i = 0; i < drones.length; i++) {
        const drone = drones[i];

        const droneRegUrl = await uploadFile(
          drone.drone_reg_proof,
          "drone-reg-proofs",
          `drone-reg-${i + 1}`
        );

        const dronePhotoUrl = await uploadFile(
          drone.drone_photo,
          "drone-photos",
          `drone-photo-${i + 1}`
        );

        const insuranceUrl = await uploadFile(
          drone.insurance_proof,
          "insurance-proofs",
          `insurance-${i + 1}`
        );

        droneRows.push({
          provider_id: providerId,
          drone_brand: drone.drone_brand || null,
          drone_model: drone.drone_model || null,
          drone_serial_number: drone.drone_serial_number || null,
          drone_category: drone.drone_category || null,
          drone_uin: drone.drone_uin || null,
          tank_capacity: drone.tank_capacity || null,
          battery_sets: drone.battery_sets ? Number(drone.battery_sets) : null,
          battery_capacity: drone.battery_capacity || null,
          primary_usage: drone.primary_usage || null,
          drone_experience: drone.drone_experience
            ? Number(drone.drone_experience)
            : null,
          acres_sprayed:
            drone.primary_usage === "Agriculture Spraying" &&
            drone.acres_sprayed
              ? Number(drone.acres_sprayed)
              : null,
          insurance_company: drone.insurance_company || null,
          insurance_policy_number: drone.insurance_policy_number || null,
          insurance_expiry: drone.insurance_expiry || null,
          drone_reg_url: droneRegUrl,
          insurance_url: insuranceUrl,
          drone_photo_url: dronePhotoUrl
        });
      }

      if (droneRows.length > 0) {
        const { error: dronesInsertError } = await supabase
          .from("provider_drones")
          .insert(droneRows);

        if (dronesInsertError) throw dronesInsertError;
      }

      toast.success("Verification submitted. Awaiting admin approval.");
      navigate("/provider/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProviderLayout>
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-900/20 pointer-events-none"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-md uppercase tracking-tighter">
              Provider Verification
            </h2>

            <div className="flex gap-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 text-center py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    step === s
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/50"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  Step {s}
                </div>
              ))}
            </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-black text-2xl text-white border-b border-white/10 pb-4 tracking-tight uppercase tracking-widest">
                Personal & Identity Details
              </h3>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Full Name
                </label>
                <input
                  placeholder="Enter your full name as per Aadhaar/PAN"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
 
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    Aadhaar Number
                  </label>
                  <input
                    placeholder="Enter 12 digit Aadhaar number"
                    className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                    value={formData.aadhar_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadhar_number: e.target.value
                      })
                    }
                  />
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      Aadhaar Proof
                    </label>
                    <input
                      type="file"
                      className="text-sm text-white/60 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer file:transition-colors"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aadharProof: e.target.files?.[0] || null
                        })
                      }
                    />
                  </div>
                </div>
 
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    PAN Card Number
                  </label>
                  <input
                    placeholder="Enter 10 digit PAN number"
                    className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                    value={formData.pan_number}
                    onChange={(e) =>
                      setFormData({ ...formData, pan_number: e.target.value })
                    }
                  />
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      PAN Proof
                    </label>
                    <input
                      type="file"
                      className="text-sm text-white/60 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 cursor-pointer file:transition-colors"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          panProof: e.target.files?.[0] || null
                        })
                      }
                    />
                  </div>
                </div>
              </div>
 
              <div className="bg-white/5 p-8 rounded-[2rem] border border-dashed border-white/20">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-6 text-center">
                  Update Profile Picture
                </label>
                <div className="flex flex-col items-center gap-6">
                  {formData.profilePhoto && (
                    <div className="relative w-32 h-32">
                      <img
                        src={URL.createObjectURL(formData.profilePhoto)}
                        alt="Profile Preview"
                        className="w-full h-full object-cover rounded-full border-4 border-emerald-500/50 shadow-2xl"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm text-white/60 file:mr-4 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-gradient-to-r file:from-emerald-500 file:to-emerald-400 file:text-white file:shadow-lg hover:file:shadow-emerald-500/20 cursor-pointer file:transition-all"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profilePhoto: e.target.files?.[0] || null
                      })
                    }
                  />
                </div>
              </div>
 
              <div className="space-y-6">
                <h4 className="font-black text-white text-lg tracking-tight uppercase border-b border-white/10 pb-4 mt-8">
                  Contact & Address
                </h4>
 
                <input
                  placeholder="Permanent Address"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                  value={formData.permanent_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permanent_address: e.target.value
                    })
                  }
                />
 
                <input
                  placeholder="Landmark"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                  value={formData.landmark}
                  onChange={(e) =>
                    setFormData({ ...formData, landmark: e.target.value })
                  }
                />
 
                <input
                  placeholder="Contact Number"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-emerald-400/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_phone: e.target.value
                    })
                  }
                />
              </div>
 
              <div className="flex justify-end pt-8">
                <button
                  onClick={() => {
                    if (!validateStep1()) return;
                    setStep(2);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 text-sm"
                >
                  Save & Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 pb-10">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white border-l-4 border-emerald-500 pl-4 py-1 tracking-tight uppercase">
                  Section 1 — RPC Certification Details
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-black">
                      RPC Certificate Number
                    </label>
                    <input
                      placeholder="Enter RPC Number"
                      className="border p-3 rounded-xl w-full"
                      value={formData.rpc_number}
                      onChange={(e) =>
                        setFormData({ ...formData, rpc_number: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-black">
                      RPC Training Institute
                    </label>
                    <input
                      placeholder="Enter Institute Name"
                      className="border p-3 rounded-xl w-full"
                      value={formData.rpc_institute}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rpc_institute: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-black">
                      RPC Category
                    </label>
                    <select
                      className="border p-3 rounded-xl w-full"
                      value={formData.rpc_category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rpc_category: e.target.value
                        })
                      }
                    >
                      <option value="">Select Category</option>
                      <option value="Nano">Nano (&lt; 250 g)</option>
                      <option value="Micro">Micro (250 g – 2 kg)</option>
                      <option value="Small">Small (2 kg – 25 kg)</option>
                      <option value="Medium">Medium (25 kg – 150 kg)</option>
                      <option value="Large">Large (&gt; 150 kg)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-black">
                        RPC Issue Date
                      </label>
                      <input
                        type="date"
                        className="border p-3 rounded-xl w-full"
                        value={formData.rpc_issue_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rpc_issue_date: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-black">
                        RPC Expiry Date
                      </label>
                      <input
                        type="date"
                        className="border p-3 rounded-xl w-full"
                        value={formData.rpc_expiry_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rpc_expiry_date: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-semibold text-black">
                        Upload RPC Certificate
                      </label>
                      <input
                        type="file"
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rpc_proof: e.target.files?.[0] || null
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-semibold text-black">
                        Pilot Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pilot_photo: e.target.files?.[0] || null
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-black text-white border-l-4 border-emerald-500 pl-4 py-1 tracking-tight uppercase">
                  Section 2 — Drone Details
                </h3>

                {drones.map((drone, index) => (
                  <div
                    key={index}
                    className="border rounded-2xl p-6 bg-gray-50 space-y-6"
                  >
                    <h4 className="font-semibold text-black">
                      Drone #{index + 1}
                    </h4>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold">
                          Drone Brand
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          placeholder="e.g. DJI"
                          value={drone.drone_brand}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_brand",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Drone Model
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          placeholder="Model"
                          value={drone.drone_model}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_model",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Drone Serial Number
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          placeholder="Serial Number"
                          value={drone.drone_serial_number}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_serial_number",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Drone Category
                        </label>
                        <select
                          className="border p-3 rounded-xl w-full"
                          value={drone.drone_category}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_category",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select Category</option>
                          <option value="Nano">Nano (&lt;250g)</option>
                          <option value="Micro">Micro (250g–2kg)</option>
                          <option value="Small">Small (2kg–25kg)</option>
                          <option value="Medium">Medium (25kg–150kg)</option>
                          <option value="Large">Large (&gt;150kg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Primary Drone Usage
                        </label>
                        <select
                          className="border p-3 rounded-xl w-full"
                          value={drone.primary_usage}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "primary_usage",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select Usage</option>
                          <option value="Agriculture Spraying">
                            Agriculture Spraying
                          </option>
                          <option value="Crop Monitoring">
                            Crop Monitoring
                          </option>
                          <option value="Mapping">Mapping</option>
                          <option value="Inspection">Inspection</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Years of Drone Experience
                        </label>
                        <input
                          placeholder="Years"
                          type="number"
                          className="border p-3 rounded-xl w-full"
                          value={drone.drone_experience}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_experience",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {drone.primary_usage === "Agriculture Spraying" && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-sm font-semibold text-black">
                            Acres Sprayed
                          </label>
                          <input
                            placeholder="Total acres sprayed so far"
                            type="number"
                            className="border p-3 rounded-xl w-full"
                            value={drone.acres_sprayed}
                            onChange={(e) =>
                              updateDroneField(
                                index,
                                "acres_sprayed",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-semibold">
                          Drone UIN
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          value={drone.drone_uin}
                          onChange={(e) =>
                            updateDroneField(index, "drone_uin", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Tank Capacity
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          placeholder="e.g. 10L"
                          value={drone.tank_capacity}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "tank_capacity",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Battery Sets
                        </label>
                        <input
                          type="number"
                          className="border p-3 rounded-xl w-full"
                          value={drone.battery_sets}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "battery_sets",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Battery Capacity
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          placeholder="30000 mAh"
                          value={drone.battery_capacity}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "battery_capacity",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Insurance Company
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          value={drone.insurance_company}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "insurance_company",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Insurance Policy Number
                        </label>
                        <input
                          className="border p-3 rounded-xl w-full"
                          value={drone.insurance_policy_number}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "insurance_policy_number",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold">
                          Insurance Expiry
                        </label>
                        <input
                          type="date"
                          className="border p-3 rounded-xl w-full"
                          value={drone.insurance_expiry}
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "insurance_expiry",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black">
                          Drone Registration Certificate
                        </label>
                        <input
                          type="file"
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_reg_proof",
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black">
                          Drone Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "drone_photo",
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black">
                          Upload Insurance Certificate
                        </label>
                        <input
                          type="file"
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          onChange={(e) =>
                            updateDroneField(
                              index,
                              "insurance_proof",
                              e.target.files?.[0] || null
                            )
                          }
                        />
                      </div>
                    </div>

                    {drones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDrone(index)}
                        className="text-red-600 font-semibold"
                      >
                        Remove Drone
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addDrone}
                  className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold"
                >
                  + Add Another Drone
                </button>
              </div>

              <div className="flex justify-between pt-8 border-t border-white/10">
                <button
                  onClick={() => setStep(1)}
                  className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-sm"
                >
                  Back
                </button>
 
                <button
                  onClick={() => {
                    if (!validateStep2()) return;
                    setStep(3);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 text-sm"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <h3 className="text-2xl font-black text-white border-l-4 border-emerald-500 pl-4 py-1 tracking-tight uppercase">
                Step 3 — Bank Account Details
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-black">
                    Account Holder Name (as per bank records)
                  </label>
                  <input
                    placeholder="Enter Account Holder Name"
                    className="border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.account_holder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_holder: e.target.value
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    Bank Name
                  </label>
                  <input
                    placeholder="Enter Bank Name"
                    className="border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    Account Number
                  </label>
                  <input
                    placeholder="Enter Account Number"
                    className="border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_number: e.target.value
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-black">
                    IFSC Code
                  </label>
                  <input
                    placeholder="Enter IFSC Code"
                    className="border p-3 rounded-xl w-full focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.ifsc_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ifsc_code: e.target.value.toUpperCase()
                      })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-black">
                    Bank Proof (Passbook/Cancelled Cheque)
                  </label>
                  <input
                    type="file"
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_proof: e.target.files?.[0] || null
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    checked={formData.declarationAccepted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        declarationAccepted: e.target.checked
                      })
                    }
                  />
                  <p className="text-sm text-black">
                    I confirm that the information provided is correct.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-white/10">
                  <button
                    onClick={() => setStep(2)}
                    className="border border-white/20 bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-sm"
                  >
                    Back
                  </button>
 
                  <button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 text-sm"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Verification"}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}