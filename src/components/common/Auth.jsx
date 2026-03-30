import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import logo from "../../assets/logo.png";
import { User, Tractor } from "lucide-react";
import LocationSelector from "../LocationSelector";
import { useAuth } from "../../context/AuthContext";

const Auth = ({ onClose, initialRole }) => {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [authFlow, setAuthFlow] = useState(
    initialRole === "farmer"
      ? "farmer-signin"
      : initialRole === "provider"
        ? "provider-signin"
        : initialRole === "admin"
          ? "admin-signin"
          : "role-select"
  );

  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    village: "",
    district: "",
    state: "",
    
    // farmer only
    aadharNumber: "",
    aadharImage: null,
    age: "",
    landType: "",
    noOfAcres: "",
  });

  const [location, setLocation] = useState({
    state: "",
    district: "",
    mandal: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      state: location.state,
      district: location.district,
      village: location.mandal,
    }));
  }, [location]);

  

  const uploadFarmerAadharImage = async (file, userId) => {
    if (!file) return null;

    const ext = file.name?.split(".").pop() || "jpg";
    const filePath = `aadhar/${userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("farmers")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("farmers").getPublicUrl(filePath);

    return data?.publicUrl || null;
  };

  const handleSignIn = async (e, role) => {
    e.preventDefault();
    setLoading(true);
    window.isLoggingInStrictMode = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("User not found");

      if (role === "provider") {
        const { data: provider } = await supabase
          .from("providers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (provider) {
          window.isLoggingInStrictMode = false;
          onClose();
          await completeLogin(user.id);
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error(
            "Invalid credentials. You are not registered as a Provider."
          );
        }
      }

      if (role === "farmer") {
        const { data: farmer } = await supabase
          .from("farmers")
          .select("id")
          .eq("id", user.id)
          .single();

        if (farmer) {
          window.isLoggingInStrictMode = false;
          onClose();
          await completeLogin(user.id);
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error(
            "Invalid credentials. You are not registered as a Farmer."
          );
        }
      }

      if (role === "admin") {
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .single();

        if (admin) {
          window.isLoggingInStrictMode = false;
          onClose();
          await completeLogin(user.id);
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error(
            "Invalid credentials. You do not have admin privileges."
          );
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      window.isLoggingInStrictMode = false;
      setLoading(false);
    }
  };

  const validateFarmerSignup = () => {
    if (!formData.aadharNumber.trim()) {
      throw new Error("Aadhaar number is required for farmer signup.");
    }

    if (!/^\d{12}$/.test(formData.aadharNumber.trim())) {
      throw new Error("Aadhaar number must be exactly 12 digits.");
    }

    if (!formData.aadharImage) {
      throw new Error("Please upload Aadhaar image.");
    }

    if (!formData.age || Number(formData.age) < 18) {
      throw new Error("Farmer age must be 18 or above.");
    }

    if (!formData.landType) {
      throw new Error("Please select land type.");
    }

    if (
      formData.landType === "Own" &&
      (!formData.noOfAcres || Number(formData.noOfAcres) <= 0)
    ) {
      throw new Error("Please enter number of acres for owned land.");
    }
  };

  const handleSignUp = async (e, role) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === "farmer") {
        validateFarmerSignup();
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const user = authData.user;

      if (user) {
        const table = role === "admin" ? "admins" : role === "farmer" ? "farmers" : "providers";

        let aadharImageUrl = null;

        if (role === "farmer" && formData.aadharImage) {
          aadharImageUrl = await uploadFarmerAadharImage(
            formData.aadharImage,
            user.id
          );
        }

        const insertPayload =
          role === "admin"
            ? {
              id: user.id,
              full_name: formData.fullName,
              email: formData.email,
            }
            : role === "provider"
              ? {
                id: user.id,
                full_name: formData.fullName,
                phone_number: formData.phone,
                state: formData.state,
                district: formData.district,
                mandal_name: formData.village,
                verification_status: "not_submitted",
              }
              : {
                id: user.id,
                full_name: formData.fullName,
                phone_number: formData.phone,
                state: formData.state,
                district: formData.district,
                mandal_name: formData.village,
                aadhaar_number: formData.aadharNumber,
                aadhaar_image: aadharImageUrl,
                age: formData.age ? Number(formData.age) : null,
                land_type: formData.landType,
                land_acres:
                  formData.landType === "Own" && formData.noOfAcres
                    ? Number(formData.noOfAcres)
                    : null,
              };

        const { error: insertError } = await supabase
          .from(table)
          .insert([insertPayload]);

        if (insertError) throw insertError;

        await supabase.auth.signOut();
      }

      alert("Account created successfully. Please sign in.");

      setAuthFlow(role === "farmer" ? "farmer-signin" : role === "provider" ? "provider-signin" : "admin-signin");

      setFormData({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        village: "",
        district: "",
        state: "",
        aadharNumber: "",
        aadharImage: null,
        age: "",
        landType: "",
        noOfAcres: "",
      });

      setLocation({ state: "", district: "", mandal: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authFlow === "role-select") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Blurred Image Background Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-2xl opacity-70"
          style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 rounded-[2.5rem] p-12 border border-white/20 shadow-2xl overflow-hidden text-white backdrop-blur-md text-center">
          <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
          <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          <div className="mb-10 relative z-10">
            <img src={logo} className="w-20 mx-auto mb-4 drop-shadow-lg" alt="logo" />
            <h2 className="text-4xl font-black uppercase tracking-tighter">
              Choose your role
            </h2>
            <p className="text-emerald-100/70 text-sm mt-2 font-medium tracking-wide">Select how you want to use Agri Dhara</p>
          </div>

          <div className="grid grid-cols-2 gap-8 relative z-10">
            <button
              onClick={() => setAuthFlow("farmer-signin")}
              className="group bg-white/10 hover:bg-white/20 border border-white/20 p-8 rounded-3xl transition-all hover:scale-[1.05] active:scale-95 flex flex-col items-center gap-4"
            >
              <div className="bg-emerald-500/20 p-4 rounded-2xl group-hover:bg-emerald-500/40 transition-colors">
                <User size={48} className="text-white" />
              </div>
              <span className="text-xl font-black uppercase tracking-widest">Farmer</span>
            </button>

            <button
              onClick={() => setAuthFlow("provider-signin")}
              className="group bg-white/10 hover:bg-white/20 border border-white/20 p-8 rounded-3xl transition-all hover:scale-[1.05] active:scale-95 flex flex-col items-center gap-4"
            >
              <div className="bg-emerald-500/20 p-4 rounded-2xl group-hover:bg-emerald-500/40 transition-colors">
                <Tractor size={48} className="text-white" />
              </div>
              <span className="text-xl font-black uppercase tracking-widest">Provider</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  const SignInForm = (role) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Image Background Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-2xl opacity-70"
        style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 rounded-[2.5rem] p-10 border border-white/20 shadow-2xl overflow-hidden text-white backdrop-blur-md">
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2 className="text-3xl font-black text-center text-white mb-8 uppercase tracking-tighter">
          {role === "farmer"
            ? "Farmer"
            : role === "provider"
              ? "Provider"
              : "Admin"}{" "}
          Sign In
        </h2>

        <form onSubmit={(e) => handleSignIn(e, role)} className="space-y-5 relative z-10">
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full bg-white/10 border border-white/20 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 backdrop-blur-sm transition-all"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full bg-white/10 border border-white/20 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 backdrop-blur-sm transition-all"
            required
          />

          <button className="w-full bg-white text-emerald-900 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => setAuthFlow(`${role}-signup`)}
            className="text-sm text-white hover:text-emerald-200 block mx-auto font-bold mt-4 uppercase tracking-widest"
          >
            Create New Account
          </button>
        </form>
      </div>
    </div>
  );

  if (authFlow === "farmer-signin") return SignInForm("farmer");
  if (authFlow === "provider-signin") return SignInForm("provider");
  if (authFlow === "admin-signin") return SignInForm("admin");
  if (authFlow === "admin-signup") return SignUpForm("admin");
  const SignUpForm = (role) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Image Background Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-2xl opacity-70"
        style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 rounded-[2.5rem] p-10 border border-white/20 shadow-2xl overflow-hidden text-white backdrop-blur-md max-h-[90vh] flex flex-col">
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[60]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2 className="text-3xl font-black text-center text-white mb-8 uppercase tracking-tighter">
          {role === "farmer" ? "Farmer" : role === "provider" ? "Provider" : "Admin"} Sign Up
        </h2>

        <form onSubmit={(e) => handleSignUp(e, role)} className="space-y-6 overflow-y-auto pr-2 scrollbar-hide relative z-10 pb-4">
          <div className={`grid grid-cols-1 ${role === 'admin' ? '' : 'md:grid-cols-2'} gap-4`}>
            <input
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
              required
            />
 
            {role !== 'admin' && (
              <input
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
              required
            />

            <input
              type="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
              required
            />
          </div>

          {role !== 'admin' && (
            <>
              <div className="bg-black/20 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-white mb-4 uppercase font-black tracking-[0.2em]">Location Details</p>
                <LocationSelector value={location} onChange={setLocation} />
              </div>
 
              
            </>
          )}

          {role === "farmer" && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">
                Farmer Verification
              </h3>

              <input
                placeholder="Aadhaar Number (12 Digits)"
                value={formData.aadharNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aadharNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
                  })
                }
                className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl w-full text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
                required
              />

                <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-3">
                  Upload Aadhaar Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadharImage: e.target.files?.[0] || null,
                      })
                    }
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className="bg-emerald-600 text-white rounded-xl py-3 px-4 text-xs font-black flex items-center justify-between border border-white/10 hover:bg-emerald-500 transition-colors">
                    <span className="truncate max-w-[200px]">
                      {formData.aadharImage ? formData.aadharImage.name : "Choose Aadhaar File"}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded text-[10px]">BROWSE</span>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Farmer Age"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl w-full text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
                  required
                />

                <select
                  value={formData.landType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      landType: e.target.value,
                      noOfAcres: e.target.value === "Own" ? formData.noOfAcres : "",
                    })
                  }
                  className="bg-white border border-white/10 px-4 py-4 rounded-2xl w-full text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium hover:bg-emerald-50 cursor-pointer"
                  required
                >
                  <option value="">Select Land Type</option>
                  <option value="Own">Own Land</option>
                  <option value="Rented">Rented Land</option>
                </select>
              </div>

              {formData.landType === "Own" && (
                <input
                  type="number"
                  step="0.01"
                  placeholder="Number of Acres"
                  value={formData.noOfAcres}
                  onChange={(e) =>
                    setFormData({ ...formData, noOfAcres: e.target.value })
                  }
                  className="bg-white/10 border border-white/10 px-4 py-4 rounded-2xl w-full text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
                  required
                />
              )}
            </div>
          )}

          <button className="w-full bg-white text-emerald-900 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-6 relative z-10">
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );

  if (authFlow === "farmer-signup") return SignUpForm("farmer");
  if (authFlow === "provider-signup") return SignUpForm("provider");

  return null;
};

export default Auth;