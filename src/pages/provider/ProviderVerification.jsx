import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import ProviderLayout from "../../components/provider/ProviderLayout";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Landmark,
  Plane,
  Lock
} from "lucide-react";

const CATEGORY_WEIGHTS = {
  Nano: 1,
  Micro: 2,
  Small: 3,
  Medium: 4,
  Large: 5
};

const RPC_CATEGORY_OPTIONS = [
  { value: "Nano", label: "Nano (< 250 g)" },
  { value: "Micro", label: "Micro (250 g – 2 kg)" },
  { value: "Small", label: "Small (2 kg – 25 kg)" },
  { value: "Medium", label: "Medium (25 kg – 150 kg)" },
  { value: "Large", label: "Large (> 150 kg)" }
];

const USAGE_OPTIONS = [
  "Agriculture Spraying",
  "Crop Monitoring",
  "Mapping",
  "Inspection"
];

const EMPTY_DRONE = {
  id: null,
  drone_brand: "",
  drone_model: "",
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
  drone_photo: null,
  existing_drone_reg_url: "",
  existing_insurance_url: "",
  existing_drone_photo_url: ""
};

const INITIAL_FORM_DATA = {
  aadhaar_name: "",
  aadhar_number: "",
  aadharProof: null,
  pan_number: "",
  panProof: null,
  profilePhoto: null,
  permanent_address: "",
  landmark: "",
  contact_phone: "",

  rpc_number: "",
  rpc_institute: "",
  rpc_category: "",
  rpc_issue_date: "",
  rpc_expiry_date: "",
  rpc_proof: null,
  pilot_photo: null,

  bank_name: "",
  account_holder: "",
  account_number: "",
  ifsc_code: "",
  bank_proof: null,
  declarationAccepted: false,

  existing_aadhar_url: "",
  existing_pan_url: "",
  existing_profile_photo_url: "",
  existing_rpc_url: "",
  existing_pilot_photo_url: "",
  existing_bank_url: ""
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeValue(value) {
  return value ?? "";
}

function buildPublicFilePath(providerId, folder, customName, fileName = "") {
  const ext = fileName?.split(".").pop() || "file";
  return `${folder}/${providerId}-${customName}-${Date.now()}.${ext}`;
}

function SectionTitle({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md shadow-lg">
        <Icon className="h-6 w-6 text-emerald-200" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StepBadge({ step, currentStep, label, completed }) {
  const active = currentStep === step;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 backdrop-blur-xl transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
        active
          ? "border-emerald-400/40 bg-emerald-500/15"
          : completed
            ? "border-white/20 bg-white/10"
            : "border-white/10 bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
            active
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg"
              : completed
                ? "bg-white/20 text-emerald-200"
                : "bg-white/10 text-white/70"
          )}
        >
          {completed ? <CheckCircle2 size={18} /> : step}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            Step {step}
          </p>
          <p className="text-sm font-medium text-white md:text-base">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required = false, hint, children, className = "" }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-white/90">
        {label} {required ? <span className="text-rose-300">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white outline-none backdrop-blur-md transition-all",
        "placeholder:text-white/40 focus:border-emerald-400/50 focus:bg-white/15 focus:ring-4 focus:ring-emerald-400/10",
        props.className
      )}
    />
  );
}

function ReadOnlyInput(props) {
  return (
    <div className="relative">
      <input
        {...props}
        readOnly
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white/85 outline-none backdrop-blur-md",
          props.className
        )}
      />
      <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
    </div>
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white outline-none backdrop-blur-md transition-all",
        "focus:border-emerald-400/50 focus:bg-white/15 focus:ring-4 focus:ring-emerald-400/10",
        props.className
      )}
    />
  );
}

function StyledFileInput({ onChange, accept, file, existingUrl, label }) {
  return (
    <div className="space-y-3">
      <label className="flex min-h-[58px] cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/20 bg-white/8 px-4 py-3 backdrop-blur-md transition hover:border-emerald-300/35 hover:bg-white/12">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Choose file</p>
          <p className="truncate text-xs text-white/50">
            {file?.name || "No file selected"}
          </p>
        </div>

        <span className="ml-4 rounded-xl border border-emerald-300/20 bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100">
          Browse
        </span>

        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </label>

      {existingUrl && !file ? (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs font-medium text-emerald-200 hover:text-emerald-100 hover:underline"
        >
          View existing {label.toLowerCase()}
        </a>
      ) : null}
    </div>
  );
}

function ActionButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/12 bg-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function ProviderVerification() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [providerId, setProviderId] = useState(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [step1Saving, setStep1Saving] = useState(false);
  const [step2Saving, setStep2Saving] = useState(false);
  const [step3Saving, setStep3Saving] = useState(false);

  const [step1Saved, setStep1Saved] = useState(false);
  const [step2Saved, setStep2Saved] = useState(false);
  const [step3Saved, setStep3Saved] = useState(false);

  const [dronesLoaded, setDronesLoaded] = useState(false);
  const loadingDronesRef = useRef(false);

  const [drones, setDrones] = useState([{ ...EMPTY_DRONE }]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const completedSteps = useMemo(
    () => ({
      1: step1Saved,
      2: step2Saved,
      3: step3Saved
    }),
    [step1Saved, step2Saved, step3Saved]
  );

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateDroneField = useCallback((index, field, value) => {
    setDrones((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  }, []);

  const addDrone = useCallback(() => {
    setDrones((prev) => [...prev, { ...EMPTY_DRONE }]);
  }, []);

  const removeDrone = useCallback((index) => {
    setDrones((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length ? filtered : [{ ...EMPTY_DRONE }];
    });
  }, []);

  const uploadFile = useCallback(
    async (file, folder, customName) => {
      if (!file || !providerId) return null;

      const filePath = buildPublicFilePath(
        providerId,
        folder,
        customName,
        file.name
      );

      const { error } = await supabase.storage
        .from("provider-documents")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("provider-documents")
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
    [providerId]
  );

  const loadInitialProfile = useCallback(async () => {
    try {
      setPageLoading(true);

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }

      setProviderId(user.id);

      const { data: profData, error } = await supabase
        .from("providers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profData) {
        setFormData((prev) => ({
          ...prev,
          aadhaar_name: normalizeValue(profData.aadhaar_name),
          contact_phone: normalizeValue(
            profData.contact_phone || profData.contact_phone
          ),
          permanent_address: normalizeValue(profData.permanent_address),
          landmark: normalizeValue(profData.landmark),

          aadhar_number: normalizeValue(profData.aadhar_number),
          pan_number: normalizeValue(profData.pan_number),

          rpc_number: normalizeValue(profData.rpc_number),
          rpc_institute: normalizeValue(profData.rpc_institute),
          rpc_category: normalizeValue(profData.rpc_category),
          rpc_issue_date: normalizeValue(profData.rpc_issue_date),
          rpc_expiry_date: normalizeValue(profData.rpc_expiry_date),

          bank_name: normalizeValue(profData.bank_name),
          account_holder: normalizeValue(profData.account_holder_name),
          account_number: normalizeValue(profData.account_number),
          ifsc_code: normalizeValue(profData.ifsc_code),

          existing_aadhar_url: normalizeValue(profData.aadhar_url),
          existing_pan_url: normalizeValue(profData.pan_url),
          existing_profile_photo_url: normalizeValue(
            profData.profile_photo_url
          ),
          existing_rpc_url: normalizeValue(profData.rpc_url),
          existing_pilot_photo_url: normalizeValue(
            profData.pilot_photo_url
          ),
          existing_bank_url: normalizeValue(profData.bank_url)
        }));

        const hasStep1Data =
          !!profData.aadhar_number ||
          !!profData.pan_number ||
          !!profData.contact_phone ||
          !!profData.contact_phone;

        const hasStep2Data =
          !!profData.rpc_number ||
          !!profData.rpc_institute ||
          !!profData.rpc_category;

        const hasStep3Data =
          !!profData.bank_name ||
          !!profData.account_holder_name ||
          !!profData.account_number ||
          !!profData.ifsc_code;

        setStep1Saved(hasStep1Data);
        setStep2Saved(hasStep2Data);
        setStep3Saved(Boolean(profData.verification_submitted) || hasStep3Data);
      }
    } catch (err) {
      console.error("Error loading provider profile:", err);
      toast.error(err.message || "Failed to load provider details");
    } finally {
      setPageLoading(false);
    }
  }, [navigate]);

  const loadDrones = useCallback(async () => {
    if (!providerId || dronesLoaded || loadingDronesRef.current) return;

    try {
      loadingDronesRef.current = true;

      const { data, error } = await supabase
        .from("provider_drones")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setDrones(
          data.map((drone) => ({
            ...EMPTY_DRONE,
            id: drone.id || null,
            drone_brand: normalizeValue(drone.drone_brand),
            drone_model: normalizeValue(drone.drone_model),
            drone_category: normalizeValue(drone.drone_category),
            drone_uin: normalizeValue(drone.drone_uin),
            tank_capacity: normalizeValue(drone.tank_capacity),
            primary_usage: normalizeValue(drone.primary_usage),
            battery_sets: normalizeValue(drone.battery_sets),
            battery_capacity: normalizeValue(drone.battery_capacity),
            insurance_company: normalizeValue(drone.insurance_company),
            insurance_policy_number: normalizeValue(
              drone.insurance_policy_number
            ),
            insurance_expiry: normalizeValue(drone.insurance_expiry),
            drone_experience: normalizeValue(drone.drone_experience),
            acres_sprayed: normalizeValue(drone.acres_sprayed),
            existing_drone_reg_url: normalizeValue(drone.drone_reg_url),
            existing_insurance_url: normalizeValue(drone.insurance_url),
            existing_drone_photo_url: normalizeValue(drone.drone_photo_url)
          }))
        );
      }

      setDronesLoaded(true);
    } catch (err) {
      console.error("Error loading drones:", err);
      toast.error(err.message || "Failed to load drone details");
    } finally {
      loadingDronesRef.current = false;
    }
  }, [providerId, dronesLoaded]);

  useEffect(() => {
    loadInitialProfile();
  }, [loadInitialProfile]);

  useEffect(() => {
    if (step === 2) loadDrones();
  }, [step, loadDrones]);

  const validateStep1 = useCallback(() => {
    if (!formData.aadhaar_name.trim()) {
      toast.error("Aadhaar name is required");
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
  }, [formData]);

  const validateStep2 = useCallback(() => {
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

      if (!String(drone.drone_brand || "").trim()) {
        toast.error(`Drone #${i + 1}: Drone brand is required`);
        return false;
      }

      if (!String(drone.drone_model || "").trim()) {
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
          `Drone #${i + 1}: RPC category (${formData.rpc_category}) is lower than drone category (${drone.drone_category}).`
        );
        return false;
      }
    }

    return true;
  }, [formData.rpc_category, formData.rpc_institute, formData.rpc_number, drones]);

  const validateStep3 = useCallback(() => {
    if (!formData.account_holder.trim()) {
      toast.error("Account holder name is required");
      return false;
    }

    if (!formData.bank_name.trim()) {
      toast.error("Bank name is required");
      return false;
    }

    if (!formData.account_number.trim()) {
      toast.error("Account number is required");
      return false;
    }

    if (!formData.ifsc_code.trim()) {
      toast.error("IFSC code is required");
      return false;
    }

    if (!formData.declarationAccepted) {
      toast.error("Please accept declaration");
      return false;
    }

    return true;
  }, [formData]);

  const saveStep1 = useCallback(async () => {
    try {
      if (!providerId) {
        toast.error("Provider not found");
        return false;
      }

      if (!validateStep1()) return false;

      setStep1Saving(true);

      const aadharProofUrl = formData.aadharProof
        ? await uploadFile(formData.aadharProof, "aadhar-proofs", "aadhar")
        : formData.existing_aadhar_url || null;

      const panProofUrl = formData.panProof
        ? await uploadFile(formData.panProof, "pan-proofs", "pan")
        : formData.existing_pan_url || null;

      const profilePhotoUrl = formData.profilePhoto
        ? await uploadFile(formData.profilePhoto, "profile-photos", "profile")
        : formData.existing_profile_photo_url || null;

      const { error } = await supabase
        .from("providers")
        .update({
          aadhaar_name: formData.aadhaar_name.trim(),   // ✅ NEW LINE

          contact_phone: formData.contact_phone.trim(),
          permanent_address: formData.permanent_address.trim() || null,
          landmark: formData.landmark.trim() || null,
          aadhar_number: formData.aadhar_number.trim(),
          aadhar_url: aadharProofUrl,
          pan_number: formData.pan_number.trim(),
          pan_url: panProofUrl,
          profile_photo_url: profilePhotoUrl
        })
        .eq("id", providerId);

      if (error) throw error;

      setFormData((prev) => ({
        ...prev,
        existing_aadhar_url: aadharProofUrl || prev.existing_aadhar_url,
        existing_pan_url: panProofUrl || prev.existing_pan_url,
        existing_profile_photo_url:
          profilePhotoUrl || prev.existing_profile_photo_url
      }));

      setStep1Saved(true);
      toast.success("Step 1 saved successfully");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save Step 1");
      return false;
    } finally {
      setStep1Saving(false);
    }
  }, [formData, providerId, uploadFile, validateStep1]);

  const saveStep2 = useCallback(async () => {
    try {
      if (!providerId) {
        toast.error("Provider not found");
        return false;
      }

      if (!validateStep2()) return false;

      setStep2Saving(true);

      const rpcProofUrl = formData.rpc_proof
        ? await uploadFile(formData.rpc_proof, "rpc-proofs", "rpc")
        : formData.existing_rpc_url || null;

      const pilotPhotoUrl = formData.pilot_photo
        ? await uploadFile(formData.pilot_photo, "pilot-photos", "pilot")
        : formData.existing_pilot_photo_url || null;

      const { error: providerError } = await supabase
        .from("providers")
        .update({
          rpc_number: formData.rpc_number.trim(),
          rpc_institute: formData.rpc_institute.trim(),
          rpc_category: formData.rpc_category,
          rpc_issue_date: formData.rpc_issue_date || null,
          rpc_expiry_date: formData.rpc_expiry_date || null,
          rpc_url: rpcProofUrl,
          pilot_photo_url: pilotPhotoUrl
        })
        .eq("id", providerId);

      if (providerError) throw providerError;

      const { error: deleteError } = await supabase
        .from("provider_drones")
        .delete()
        .eq("provider_id", providerId);

      if (deleteError) throw deleteError;

      const droneRows = [];

      for (let i = 0; i < drones.length; i++) {
        const drone = drones[i];

        const droneRegUrl = drone.drone_reg_proof
          ? await uploadFile(
            drone.drone_reg_proof,
            "drone-reg-proofs",
            `drone-reg-${i + 1}`
          )
          : drone.existing_drone_reg_url || null;

        const dronePhotoUrl = drone.drone_photo
          ? await uploadFile(
            drone.drone_photo,
            "drone-photos",
            `drone-photo-${i + 1}`
          )
          : drone.existing_drone_photo_url || null;

        const insuranceUrl = drone.insurance_proof
          ? await uploadFile(
            drone.insurance_proof,
            "insurance-proofs",
            `insurance-${i + 1}`
          )
          : drone.existing_insurance_url || null;

        droneRows.push({
          provider_id: providerId,
          drone_brand: drone.drone_brand || null,
          drone_model: drone.drone_model || null,
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
        const { error: insertError } = await supabase
          .from("provider_drones")
          .insert(droneRows);

        if (insertError) throw insertError;
      }

      setFormData((prev) => ({
        ...prev,
        existing_rpc_url: rpcProofUrl || prev.existing_rpc_url,
        existing_pilot_photo_url:
          pilotPhotoUrl || prev.existing_pilot_photo_url
      }));

      setDrones((prev) =>
        prev.map((drone, i) => ({
          ...drone,
          existing_drone_reg_url:
            droneRows[i]?.drone_reg_url || drone.existing_drone_reg_url,
          existing_drone_photo_url:
            droneRows[i]?.drone_photo_url || drone.existing_drone_photo_url,
          existing_insurance_url:
            droneRows[i]?.insurance_url || drone.existing_insurance_url,
          drone_reg_proof: null,
          drone_photo: null,
          insurance_proof: null
        }))
      );

      setStep2Saved(true);
      toast.success("Step 2 saved successfully");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save Step 2");
      return false;
    } finally {
      setStep2Saving(false);
    }
  }, [drones, formData, providerId, uploadFile, validateStep2]);

  const saveStep3AndSubmit = useCallback(async () => {
    try {
      if (!providerId) {
        toast.error("Provider not found");
        return false;
      }

      if (!step1Saved) {
        toast.error("Please save Step 1 first");
        setStep(1);
        return false;
      }

      if (!step2Saved) {
        toast.error("Please save Step 2 first");
        setStep(2);
        return false;
      }

      if (!validateStep3()) return false;

      setStep3Saving(true);

      const bankProofUrl = formData.bank_proof
        ? await uploadFile(formData.bank_proof, "bank-proofs", "bank")
        : formData.existing_bank_url || null;

      const { error } = await supabase
        .from("providers")
        .update({
          bank_name: formData.bank_name.trim(),
          account_holder_name: formData.account_holder.trim(),
          account_number: formData.account_number.trim(),
          ifsc_code: formData.ifsc_code.trim().toUpperCase(),
          bank_url: bankProofUrl,
          verification_status: "pending",
          verification_submitted: true
        })
        .eq("id", providerId);

      if (error) throw error;

      setFormData((prev) => ({
        ...prev,
        existing_bank_url: bankProofUrl || prev.existing_bank_url
      }));

      setStep3Saved(true);
      toast.success("Verification submitted. Awaiting admin approval.");
      navigate("/provider/dashboard");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit verification");
      return false;
    } finally {
      setStep3Saving(false);
    }
  }, [
    formData,
    navigate,
    providerId,
    step1Saved,
    step2Saved,
    uploadFile,
    validateStep3
  ]);

  if (pageLoading) {
    return (
      <ProviderLayout>
        <div className="min-h-screen px-4 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 rounded bg-white/10" />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="h-20 rounded-2xl bg-white/10" />
                  <div className="h-20 rounded-2xl bg-white/10" />
                  <div className="h-20 rounded-2xl bg-white/10" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-14 rounded-2xl bg-white/10" />
                  <div className="h-14 rounded-2xl bg-white/10" />
                  <div className="h-14 rounded-2xl bg-white/10" />
                  <div className="h-14 rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-80px] top-[-60px] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-[-80px] top-[120px] h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[35%] h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-6">
          <Card className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle
                title="Provider Verification"
                subtitle="Complete your profile in three steps. Each step saves separately so the final submission feels faster and smoother."
                icon={ShieldCheck}
              />

              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {step3Saved ? "Submitted" : "In Progress"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StepBadge
                step={1}
                currentStep={step}
                label="Personal Details"
                completed={completedSteps[1]}
              />
              <StepBadge
                step={2}
                currentStep={step}
                label="RPC & Drone Details"
                completed={completedSteps[2]}
              />
              <StepBadge
                step={3}
                currentStep={step}
                label="Bank Details"
                completed={completedSteps[3]}
              />
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-8">
                <SectionTitle
                  title="Step 1 — Personal & Identity Details"
                  subtitle="Enter your basic information and upload identity documents."
                  icon={FileText}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field
                    label="Profile Name"
                    required
                    hint="This name comes from your provider profile and cannot be changed here."
                  >
                    <Input
                      placeholder="Enter name as per Aadhaar"
                      value={formData.aadhaar_name}
                      onChange={(e) => updateFormData("aadhaar_name", e.target.value)}
                    />
                  </Field>

                  <Field label="Contact Number" required>
                    <Input
                      placeholder="Enter contact number"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData("contact_phone", e.target.value)}
                    />
                  </Field>

                  <Field label="Aadhaar Number" required>
                    <Input
                      placeholder="Enter 12 digit Aadhaar number"
                      value={formData.aadhar_number}
                      onChange={(e) => updateFormData("aadhar_number", e.target.value)}
                    />
                    <StyledFileInput
                      label="Aadhaar Proof"
                      file={formData.aadharProof}
                      existingUrl={formData.existing_aadhar_url}
                      onChange={(e) =>
                        updateFormData("aadharProof", e.target.files?.[0] || null)
                      }
                    />
                  </Field>

                  <Field label="PAN Number" required>
                    <Input
                      placeholder="Enter PAN number"
                      value={formData.pan_number}
                      onChange={(e) =>
                        updateFormData("pan_number", e.target.value.toUpperCase())
                      }
                    />
                    <StyledFileInput
                      label="PAN Proof"
                      file={formData.panProof}
                      existingUrl={formData.existing_pan_url}
                      onChange={(e) =>
                        updateFormData("panProof", e.target.files?.[0] || null)
                      }
                    />
                  </Field>

                  <Field label="Permanent Address">
                    <Input
                      placeholder="Enter permanent address"
                      value={formData.permanent_address}
                      onChange={(e) =>
                        updateFormData("permanent_address", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Landmark">
                    <Input
                      placeholder="Enter nearby landmark"
                      value={formData.landmark}
                      onChange={(e) => updateFormData("landmark", e.target.value)}
                    />
                  </Field>
                </div>

                <Card className="bg-white/7 p-5">
                  <div className="grid gap-5 md:grid-cols-[140px_1fr] md:items-center">
                    <div className="flex items-center justify-center">
                      {formData.profilePhoto ? (
                        <img
                          src={URL.createObjectURL(formData.profilePhoto)}
                          alt="Profile Preview"
                          className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-xl"
                        />
                      ) : formData.existing_profile_photo_url ? (
                        <img
                          src={formData.existing_profile_photo_url}
                          alt="Existing Profile"
                          className="h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-xl"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5 text-sm text-white/40">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white">
                        Profile Photo
                      </h4>
                      <p className="text-sm text-white/60">
                        Upload a clear passport-style photo.
                      </p>
                      <StyledFileInput
                        label="Profile Photo"
                        file={formData.profilePhoto}
                        existingUrl={formData.existing_profile_photo_url}
                        accept="image/*"
                        onChange={(e) =>
                          updateFormData("profilePhoto", e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end border-t border-white/10 pt-6">
                  <ActionButton
                    type="button"
                    onClick={async () => {
                      const ok = await saveStep1();
                      if (ok) setStep(2);
                    }}
                    disabled={step1Saving}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:scale-[1.01]"
                  >
                    {step1Saving ? "Saving..." : "Save & Continue"}
                    <ChevronRight size={18} />
                  </ActionButton>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <SectionTitle
                  title="Step 2 — RPC & Drone Details"
                  subtitle="Add pilot certification and all registered drone information."
                  icon={Plane}
                />

                <Card className="bg-white/7">
                  <h3 className="mb-5 text-lg font-semibold text-white">
                    RPC Certification Details
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Field label="RPC Certificate Number" required>
                      <Input
                        placeholder="Enter RPC certificate number"
                        value={formData.rpc_number}
                        onChange={(e) => updateFormData("rpc_number", e.target.value)}
                      />
                    </Field>

                    <Field label="RPC Training Institute" required>
                      <Input
                        placeholder="Enter institute name"
                        value={formData.rpc_institute}
                        onChange={(e) =>
                          updateFormData("rpc_institute", e.target.value)
                        }
                      />
                    </Field>

                    <Field label="RPC Category" required>
                      <Select
                        value={formData.rpc_category}
                        onChange={(e) => updateFormData("rpc_category", e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {RPC_CATEGORY_OPTIONS.map((item) => (
                          <option
                            key={item.value}
                            value={item.value}
                            className="text-black"
                          >
                            {item.label}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Field label="Issue Date">
                        <Input
                          type="date"
                          value={formData.rpc_issue_date}
                          onChange={(e) =>
                            updateFormData("rpc_issue_date", e.target.value)
                          }
                        />
                      </Field>

                      <Field label="Expiry Date">
                        <Input
                          type="date"
                          value={formData.rpc_expiry_date}
                          onChange={(e) =>
                            updateFormData("rpc_expiry_date", e.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Upload RPC Certificate">
                      <StyledFileInput
                        label="RPC Certificate"
                        file={formData.rpc_proof}
                        existingUrl={formData.existing_rpc_url}
                        onChange={(e) =>
                          updateFormData("rpc_proof", e.target.files?.[0] || null)
                        }
                      />
                    </Field>

                    <Field label="Pilot Photo">
                      <StyledFileInput
                        label="Pilot Photo"
                        file={formData.pilot_photo}
                        existingUrl={formData.existing_pilot_photo_url}
                        accept="image/*"
                        onChange={(e) =>
                          updateFormData("pilot_photo", e.target.files?.[0] || null)
                        }
                      />
                    </Field>
                  </div>
                </Card>

                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Drone Details
                      </h3>
                      <p className="text-sm text-white/60">
                        Add each drone separately.
                      </p>
                    </div>

                    <ActionButton
                      type="button"
                      onClick={addDrone}
                      className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    >
                      <Plus size={16} />
                      Add Another Drone
                    </ActionButton>
                  </div>

                  {drones.map((drone, index) => (
                    <Card key={index} className="bg-white/7">
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-white">
                            Drone #{index + 1}
                          </h4>
                          <p className="text-sm text-white/55">
                            Enter drone registration and insurance details.
                          </p>
                        </div>

                        {drones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDrone(index)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 hover:bg-rose-500/15"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Drone Brand" required>
                          <Input
                            placeholder="e.g. DJI"
                            value={drone.drone_brand}
                            onChange={(e) =>
                              updateDroneField(index, "drone_brand", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Drone Model" required>
                          <Input
                            placeholder="Enter drone model"
                            value={drone.drone_model}
                            onChange={(e) =>
                              updateDroneField(index, "drone_model", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Drone Category" required>
                          <Select
                            value={drone.drone_category}
                            onChange={(e) =>
                              updateDroneField(index, "drone_category", e.target.value)
                            }
                          >
                            <option value="">Select Category</option>
                            {RPC_CATEGORY_OPTIONS.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                                className="text-black"
                              >
                                {item.label}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Primary Usage">
                          <Select
                            value={drone.primary_usage}
                            onChange={(e) =>
                              updateDroneField(index, "primary_usage", e.target.value)
                            }
                          >
                            <option value="">Select Usage</option>
                            {USAGE_OPTIONS.map((item) => (
                              <option key={item} value={item} className="text-black">
                                {item}
                              </option>
                            ))}
                          </Select>
                        </Field>

                        <Field label="Years of Drone Experience">
                          <Input
                            type="number"
                            placeholder="Enter years"
                            value={drone.drone_experience}
                            onChange={(e) =>
                              updateDroneField(index, "drone_experience", e.target.value)
                            }
                          />
                        </Field>

                        {drone.primary_usage === "Agriculture Spraying" && (
                          <Field label="Acres Sprayed">
                            <Input
                              type="number"
                              placeholder="Enter total acres sprayed"
                              value={drone.acres_sprayed}
                              onChange={(e) =>
                                updateDroneField(index, "acres_sprayed", e.target.value)
                              }
                            />
                          </Field>
                        )}

                        <Field label="Drone UIN">
                          <Input
                            placeholder="Enter drone UIN"
                            value={drone.drone_uin}
                            onChange={(e) =>
                              updateDroneField(index, "drone_uin", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Tank Capacity">
                          <Input
                            placeholder="e.g. 10L"
                            value={drone.tank_capacity}
                            onChange={(e) =>
                              updateDroneField(index, "tank_capacity", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Battery Sets">
                          <Input
                            type="number"
                            placeholder="Enter battery sets"
                            value={drone.battery_sets}
                            onChange={(e) =>
                              updateDroneField(index, "battery_sets", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Battery Capacity">
                          <Input
                            placeholder="e.g. 30000 mAh"
                            value={drone.battery_capacity}
                            onChange={(e) =>
                              updateDroneField(index, "battery_capacity", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Insurance Company">
                          <Input
                            placeholder="Enter insurance company"
                            value={drone.insurance_company}
                            onChange={(e) =>
                              updateDroneField(index, "insurance_company", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Insurance Policy Number">
                          <Input
                            placeholder="Enter policy number"
                            value={drone.insurance_policy_number}
                            onChange={(e) =>
                              updateDroneField(
                                index,
                                "insurance_policy_number",
                                e.target.value
                              )
                            }
                          />
                        </Field>

                        <Field label="Insurance Expiry">
                          <Input
                            type="date"
                            value={drone.insurance_expiry}
                            onChange={(e) =>
                              updateDroneField(index, "insurance_expiry", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Drone Registration Certificate">
                          <StyledFileInput
                            label="Drone Registration Certificate"
                            file={drone.drone_reg_proof}
                            existingUrl={drone.existing_drone_reg_url}
                            onChange={(e) =>
                              updateDroneField(
                                index,
                                "drone_reg_proof",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </Field>

                        <Field label="Drone Photo">
                          <StyledFileInput
                            label="Drone Photo"
                            file={drone.drone_photo}
                            existingUrl={drone.existing_drone_photo_url}
                            accept="image/*"
                            onChange={(e) =>
                              updateDroneField(
                                index,
                                "drone_photo",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </Field>

                        <Field label="Insurance Certificate">
                          <StyledFileInput
                            label="Insurance Certificate"
                            file={drone.insurance_proof}
                            existingUrl={drone.existing_insurance_url}
                            onChange={(e) =>
                              updateDroneField(
                                index,
                                "insurance_proof",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </Field>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
                  <ActionButton
                    type="button"
                    onClick={() => setStep(1)}
                    className="border border-white/15 bg-white/8 text-white hover:bg-white/12"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </ActionButton>

                  <ActionButton
                    type="button"
                    onClick={async () => {
                      const ok = await saveStep2();
                      if (ok) setStep(3);
                    }}
                    disabled={step2Saving}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:scale-[1.01]"
                  >
                    {step2Saving ? "Saving..." : "Save & Continue"}
                    <ChevronRight size={18} />
                  </ActionButton>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <SectionTitle
                  title="Step 3 — Bank Details"
                  subtitle="Enter your payout details and complete verification."
                  icon={Landmark}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Account Holder Name" required className="md:col-span-2">
                    <Input
                      placeholder="Enter account holder name"
                      value={formData.account_holder}
                      onChange={(e) =>
                        updateFormData("account_holder", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="Bank Name" required>
                    <Input
                      placeholder="Enter bank name"
                      value={formData.bank_name}
                      onChange={(e) => updateFormData("bank_name", e.target.value)}
                    />
                  </Field>

                  <Field label="Account Number" required>
                    <Input
                      placeholder="Enter account number"
                      value={formData.account_number}
                      onChange={(e) =>
                        updateFormData("account_number", e.target.value)
                      }
                    />
                  </Field>

                  <Field label="IFSC Code" required>
                    <Input
                      placeholder="Enter IFSC code"
                      value={formData.ifsc_code}
                      onChange={(e) =>
                        updateFormData("ifsc_code", e.target.value.toUpperCase())
                      }
                    />
                  </Field>

                  <Field label="Bank Proof (Passbook / Cancelled Cheque)">
                    <StyledFileInput
                      label="Bank Proof"
                      file={formData.bank_proof}
                      existingUrl={formData.existing_bank_url}
                      onChange={(e) =>
                        updateFormData("bank_proof", e.target.files?.[0] || null)
                      }
                    />
                  </Field>
                </div>

                <Card className="bg-white/7 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-400"
                      checked={formData.declarationAccepted}
                      onChange={(e) =>
                        updateFormData("declarationAccepted", e.target.checked)
                      }
                    />
                    <span className="text-sm leading-6 text-white/80">
                      I confirm that all the information and uploaded documents are correct.
                    </span>
                  </label>
                </Card>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
                  <ActionButton
                    type="button"
                    onClick={() => setStep(2)}
                    className="border border-white/15 bg-white/8 text-white hover:bg-white/12"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </ActionButton>

                  <ActionButton
                    type="button"
                    onClick={saveStep3AndSubmit}
                    disabled={step3Saving}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30 hover:scale-[1.01]"
                  >
                    {step3Saving ? "Submitting..." : "Submit Verification"}
                  </ActionButton>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}