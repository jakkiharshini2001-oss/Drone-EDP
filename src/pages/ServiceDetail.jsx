import React, { useState } from 'react';

const ServiceDetail = ({ service, onFindProviders }) => {
  const [formData, setFormData] = useState({
    cropType: 'Paddy',
    landArea: '',
    liquidType: 'Pesticide'
  });

  const crops = ['Paddy', 'Cotton', 'Corn', 'Chilli', 'Sugarcane'];
  const liquids = ['Pesticide', 'Fertilizer', 'Micro-nutrients'];

  return (
    <div className="pt-24 pb-20 bg-gradient-detail min-h-screen relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-orange-300 blob blob-animate"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-300 blob blob-animate" style={{ animationDelay: '3s' }}></div>

      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <img src={service.img} className="w-full md:w-1/3 rounded-3xl shadow-lg" alt={service.name} />
            <div className="flex-1 w-full">
              <h1 className="text-4xl font-black text-black mb-4 uppercase tracking-tighter">{service.name}</h1>
              <p className="text-black/70 mb-10 font-medium leading-relaxed">{service.desc}</p>
 
              <div className="relative overflow-hidden rounded-[3rem] shadow-2xl">
                {/* Blurred Image Background Overlay */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-2xl opacity-60"
                  style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
                ></div>
                <div className="absolute inset-0 bg-black/40"></div>

                <div className="relative z-10 bg-gradient-to-br from-emerald-600/90 via-green-700/85 to-teal-900/90 p-10 border border-white/20 backdrop-blur-md text-white">
                  <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                  <h2 className="text-xs font-black mb-8 uppercase tracking-[0.2em] text-emerald-300">Enter Field Details</h2>
                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onFindProviders(formData); }}>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-100/70 mb-2 ml-1">Crop Type</label>
                      <select
                        className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all appearance-none"
                        value={formData.cropType}
                        onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                      >
                        {crops.map(c => <option key={c} value={c} className="bg-emerald-900">{c}</option>)}
                      </select>
                    </div>
 
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-100/70 mb-2 ml-1">Land Area (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 5.5"
                        className="w-full p-4 bg-white/10 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-medium"
                        required
                        onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                      />
                    </div>
 
                    <button type="submit" className="w-full bg-white text-emerald-900 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
                      Search Nearest Providers
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;