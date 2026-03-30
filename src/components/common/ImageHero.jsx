import React from 'react';
import droneImg from '../assets/Drone spraying Service.jpeg';

const ImageHero = () => {
  return (
    <div className="relative h-[80vh] w-full overflow-hidden">
      <img 
        src={droneImg} 
        alt="Drone Spraying" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">Precision Drone Spraying</h1>
        <p className="text-lg md:text-xl max-w-2xl font-light">
          Efficient, targeted aerial application designed to maximize coverage while reducing chemical waste and labor costs.
        </p>
        {/* Progress dots from your video */}
        <div className="flex gap-2 mt-8">
          <div className="h-1 w-8 bg-white rounded-full"></div>
          <div className="h-1 w-8 bg-white/40 rounded-full"></div>
          <div className="h-1 w-8 bg-white/40 rounded-full"></div>
          <div className="h-1 w-8 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ImageHero;