import React, { useState, useEffect, useCallback, useRef } from 'react';
import droneVid from '../../assets/Crop_Drone_Spraying_Video_Generated.mp4';
import sprayingVid from '../../assets/dronespraying.mp4';

const slides = [
  { vid: sprayingVid, title: "Precision Drone Spraying", text: "Efficient, targeted aerial application designed to maximize coverage." },
  { vid: droneVid, title: "Advanced Aerial Solutions", text: "State of the art technology for sustainable agriculture and farm monitoring." }
];

const VideoSlider = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black group">
      <video key={slides[current].vid} autoPlay loop muted playsInline className="absolute w-full h-full object-cover opacity-70 transition-opacity duration-1000">
        <source src={slides[current].vid} type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg animate-fade-in">{slides[current].title}</h1>
        <p className="text-xl md:text-2xl font-light max-w-3xl drop-shadow-md animate-slide-up">{slides[current].text}</p>
      </div>
    </div>
  );
};

export default VideoSlider;
