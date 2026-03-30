import React from 'react';

const VideoSection = ({ videoSrc, title, description, reverse = false }) => {
  return (
    <section className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center py-20 px-10 gap-10`}>
      <div className="w-full md:w-1/2 overflow-hidden rounded-2xl shadow-2xl">
        <video autoPlay loop muted className="w-full h-full object-cover">
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="w-full md:w-1/2 space-y-4">
        <h2 className="text-3xl font-bold text-black">{title}</h2>
        <p className="text-black text-lg leading-relaxed">{description}</p>
        <button className="bg-agri-green text-white px-8 py-3 rounded-full font-semibold">View Service</button>
      </div>
    </section>
  );
};

export default VideoSection;