import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ServiceBookingView = ({ onProceedToDetails }) => {

  const navigate = useNavigate();
  const { categoryId } = useParams();

  useEffect(() => {
    if (onProceedToDetails) {
      onProceedToDetails({
        title: "Drone Spraying Service",
        categoryId: categoryId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  return (

    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Blurred Image Background Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-2xl opacity-60"
        style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-emerald-600/90 via-green-700/85 to-teal-900/90 p-12 rounded-[3rem] border border-white/20 shadow-2xl backdrop-blur-md text-center text-white">
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>

        <button
          onClick={() => navigate("/services")}
          className="text-emerald-300 font-black flex items-center gap-2 justify-center mb-6 uppercase tracking-widest text-xs hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Services
        </button>

        <div className="animate-pulse mb-6">
          <div className="w-16 h-16 bg-emerald-400/20 rounded-2xl mx-auto flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Preparing your<br/>Booking Form...
        </h1>
        <p className="text-emerald-100/50 text-xs mt-3 font-medium uppercase tracking-widest">Please hold on a moment</p>

      </div>

    </div>

  );

};

export default ServiceBookingView;