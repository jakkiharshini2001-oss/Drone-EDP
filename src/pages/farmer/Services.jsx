import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import backgroundImg from "../../assets/background.jpg";

import droneImg from "../../assets/Drone spraying Service.jpeg";
import solarImg from "../../assets/Solar Panel Installation.png";

const Services = ({ onSelectService }) => {

  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const serviceCategories = [
    {
      id: 1,
      title: "Drone Spraying Service",
      img: droneImg,
      desc: "Precision pesticide and fertilizer application using advanced drone technology.",
    },
    {
      id: 2,
      title: "Solar Panel Installation",
      img: solarImg,
      desc: "Professional solar pump and solar panel installation services for farms.",
    },
  ];

  const filteredServices = serviceCategories.filter((service) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "DRONE")
      return service.title.toLowerCase().includes("drone");
    if (selectedCategory === "SOLAR")
      return service.title.toLowerCase().includes("solar");
    return true;
  });

  const categories = [
    { key: "ALL", label: t("services.allServices") },
    { key: "DRONE", label: "Drone Service" },
    { key: "SOLAR", label: "Solar Installation" },
  ];

  return (
    <div className="bg-emerald-950 pt-[72px] min-h-screen relative overflow-hidden">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url('${backgroundImg}')` }}
      />
      {/* Emerald gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-emerald-950/80 via-green-900/80 to-black/95" />

      <section className="py-20 max-w-7xl mx-auto px-6 mt-10 relative z-10">

        {/* Header wrapped in glassmorphism card */}
        <div className="mb-12 bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10 mb-8">
            <h2 className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] mb-4 opacity-80 group-hover:tracking-[0.4em] transition-all duration-700">
              {t("services.marketplace")}
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
              {t("services.availableSolutions")}
            </h3>
          </div>

          {/* Filters */}
          <div className="relative z-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${
                  selectedCategory === cat.key
                    ? "bg-emerald-500 text-white shadow-lg scale-105 border-transparent"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[100px] rounded-full -z-0 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredServices.map((service) => {
            const isSolar = service.title === "Solar Panel Installation";
            return (
              <div
                key={service.id}
                className={`group bg-gradient-to-br from-emerald-500/80 via-green-500/40 to-teal-600/80 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 ${
                  isSolar
                    ? "opacity-80 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-[0_25px_60px_-15px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30 hover:-translate-y-2 active:scale-[0.98]"
                }`}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-56">
                  <img
                    src={service.img}
                    alt={service.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isSolar ? "blur-[1px] grayscale" : "group-hover:scale-110"
                    }`}
                  />
                  {isSolar && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      Coming Soon
                    </div>
                  )}
                  {isSolar && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-lg font-bold tracking-wide">Coming Soon</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  <h4 className="text-xl font-black text-white mb-2">{service.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">{service.desc}</p>

                  {isSolar ? (
                    <button disabled className="w-full py-3 bg-white/10 text-white/50 rounded-xl font-bold cursor-not-allowed border border-white/10">
                      Coming Soon
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectService(service)}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg"
                    >
                      {t("services.bookService")} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
};

export default Services;