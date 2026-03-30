import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Using your exact filenames from image_ad9d45.jpg
import droneVid from '../../assets/Crop_Drone_Spraying_Video_Generated.mp4';
import powerTillerVid from '../../assets/Power_Tiller_Farming_Video_Generated.mp4';
import harvestVid from '../../assets/All-in-One Harvesting.mp4';
import tractorVid from '../../assets/Flexible Tractor Rentals.mp4';

const slides = [
  { vid: droneVid, title: "Precision Drone Spraying", text: "Efficient, targeted aerial application designed to maximize coverage." },
  { vid: powerTillerVid, title: "High-Performance Power Tillers", text: "Effortlessly prep your soil with our rugged power tillers." },
  { vid: harvestVid, title: "All-in-One Harvesting Solutions", text: "Experience the future of farming with our comprehensive all-in-one harvesting services." },
  { vid: tractorVid, title: "Flexible Tractor Rentals", text: "Get the power you need without the upfront cost." }
];

const VideoSlider = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 8000);
  }, [nextSlide]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handleManualNav = (direction) => {
    if (direction === 'next') nextSlide();
    else prevSlide();
    resetTimer();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black group">
      <video key={slides[current].vid} autoPlay loop muted playsInline className="absolute w-full h-full object-cover opacity-70 transition-opacity duration-1000">
        <source src={slides[current].vid} type="video/mp4" />
      </video>

      {/* Navigation Buttons */}
      <button
        onClick={() => handleManualNav('prev')}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={() => handleManualNav('next')}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={32} />
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg animate-fade-in">{slides[current].title}</h1>
        <p className="text-xl md:text-2xl font-light max-w-3xl drop-shadow-md animate-slide-up">{slides[current].text}</p>

        {/* Slide Indicators */}
        <div className="flex gap-3 mt-12">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer(); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-16' : 'bg-white/30 w-10 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSlider;
