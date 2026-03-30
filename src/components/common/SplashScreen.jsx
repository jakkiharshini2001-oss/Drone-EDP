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
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center animate-pulse">
                <img src={logo} alt="Agri Dhara" className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6" />
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-green-600">
                    Agri Dhara
                </h1>
                <div className="mt-8 flex gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-150"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
