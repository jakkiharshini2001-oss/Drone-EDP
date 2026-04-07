import React from 'react';
// Using your image assets from image_ad9d45.jpg
import droneImg from '../../assets/Drone spraying Service.jpeg';

const services = [
  { title: "Drone Spraying Service", img: droneImg, desc: "Precision pesticide and fertilizer application." }
];

const ServiceGrid = () => (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-10">
        <h2 className="text-agri-green font-bold uppercase tracking-widest text-sm">Our Services</h2>
        <h3 className="text-3xl font-bold text-black">Providing Fresh Produce Every Single Day</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {services.map((service, index) => (
          <div key={index} className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 border border-slate-100">
            <div className="relative overflow-hidden rounded-xl mb-4 h-48">
              <img src={service.img} alt={service.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-500" />
            </div>
            <h4 className="text-lg font-bold text-black mb-2 group-hover:text-green-600 transition-colors">{service.title}</h4>
            <p className="text-black text-xs mb-4 line-clamp-2">{service.desc}</p>
            <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
              <span className="text-agri-green font-bold text-xs flex items-center gap-2">
                Details <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <button className="px-10 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all">
          View More Services
        </button>
      </div>
    </div>
  </section>
);

export default ServiceGrid;