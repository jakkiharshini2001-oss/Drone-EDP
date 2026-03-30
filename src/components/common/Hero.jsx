import React from 'react';
import droneVideo from '../assets/Crop_Drone_Spraying_Video_Generated.mp4';

const Hero = () => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
      >
        <source src={droneVideo} type="video/mp4" />
      </video>

      {/* Overlay and Text */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      <div className="relative z-20 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4">
          Precision Drone Spraying
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto">
          Efficient, targeted aerial application designed to maximize coverage.
        </p>
      </div>
    </div>
  );
};

export default Hero;