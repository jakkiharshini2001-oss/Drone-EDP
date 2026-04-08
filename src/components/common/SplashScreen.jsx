import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';

const SplashScreen = ({ onFinish }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 500); // Allow fade-out animation to finish
        }, 3000);

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center animate-pulse w-full max-w-md md:max-w-2xl px-6">
                <img src={logo} alt="Aerodronemitra" className="w-full h-auto object-contain max-h-[70vh]" />
                <div className="mt-12 flex gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
