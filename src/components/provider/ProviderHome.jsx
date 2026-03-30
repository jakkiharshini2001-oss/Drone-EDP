import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import droneImg from '../../assets/Drone spraying Service.jpeg';
import riceImg from '../../assets/Mini rice mill.jpeg';
import tractorImg from '../../assets/Tractor Rental service.jpeg';
import tillerImg from '../../assets/Power Tillers & Rotavators.jpeg';
import sprayingImg from '../../assets/irrigation_system.png';

const providerHeroSlides = [
    { img: tractorImg, title: "Maximize Your Fleet", text: "Reach more farmers and keep your machinery active with our high-demand rental marketplace." },
    { img: droneImg, title: "Precision Service Growth", text: "Expand your drone spraying business by connecting with farmers who need modern aerial solutions." },
    { img: tillerImg, title: "Local Market Mastery", text: "Dominate your local district by offering high-performance soil preparation tools." }
];

const imgMap = {
    "Drone Spraying Service": droneImg,
    "Mini Rice Mill": riceImg,
    "Power Tillers & Rotavators": tillerImg,
    "Tractor Rental Services": tractorImg,
};

const descMap = {
    "Drone Spraying Service": "Precision pesticide and fertilizer application using advanced drone technology.",
    "Mini Rice Mill": "Efficient local rice processing and milling services for small-scale farmers.",
    "Power Tillers & Rotavators": "High-performance soil preparation equipment available for your land.",
    "Tractor Rental Services": "Versatile tractor fleet available for all your heavy-duty agricultural needs.",
};
const ProviderHome = ({ userName }) => {
    const navigate = useNavigate();
    const [serviceCategories, setServiceCategories] = useState([]);
    const [currentHero, setCurrentHero] = useState(0);
    const heroTimerRef = useRef(null);

    const nextHero = useCallback(() => {
        setCurrentHero((prev) => (prev === providerHeroSlides.length - 1 ? 0 : prev + 1));
    }, []);

    const prevHero = useCallback(() => {
        setCurrentHero((prev) => (prev === 0 ? providerHeroSlides.length - 1 : prev - 1));
    }, []);

    const resetHeroTimer = useCallback(() => {
        if (heroTimerRef.current) clearInterval(heroTimerRef.current);
        heroTimerRef.current = setInterval(nextHero, 7500);
    }, [nextHero]);

    useEffect(() => {
        resetHeroTimer();
        return () => {
            if (heroTimerRef.current) clearInterval(heroTimerRef.current);
        };
    }, [resetHeroTimer]);

    const handleManualHeroNav = (direction) => {
        if (direction === 'next') nextHero();
        else prevHero();
        resetHeroTimer();
    };

    const featureList = [
        {
            title: "Grow Your Business",
            desc: "Reach more farmers in your area and expand your service offerings. Our platform connects you with customers who need your equipment and expertise.",
            icon: "📈",
        },
        {
            title: "Manage Bookings",
            desc: "Accept or decline job requests with ease. Track all your bookings in one place and manage your schedule efficiently.",
            icon: "📋",
        },
        {
            title: "Secure Payments",
            desc: "Get paid on time with our secure payment system. Transparent pricing and detailed invoices for all your services.",
            icon: "💰",
        }
    ];

    const fetchServiceCategories = async () => {
        const { data, error } = await supabase
            .from("service_categories")
            .select("id, name");

        if (error) {
            console.error("Category fetch error:", error.message);
            return;
        }

        const mapped = (data || []).map((cat) => ({
            id: cat.id,
            title: cat.name,
            img: imgMap[cat.name] || droneImg,
            desc: descMap[cat.name] || "Agri service provider support.",
        }));

        setServiceCategories(mapped);
    };

    useEffect(() => {
        fetchServiceCategories();
    }, []);


    return (
        <div>
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden mb-24  group bg">
                {/* Background Image Slider */}
                <img
                    key={providerHeroSlides[currentHero].img}
                    src={providerHeroSlides[currentHero].img}
                    alt={providerHeroSlides[currentHero].title}
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in transition-all duration-1000"
                />
                {/* Minimal Overlay for Readability */}
                <div className="absolute inset-0 bg-black/20"></div>

                {/* Navigation Buttons */}
                <button
                    onClick={() => handleManualHeroNav('prev')}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft size={32} />
                </button>

                <button
                    onClick={() => handleManualHeroNav('next')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight size={32} />
                </button>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 ">
                    <div className="animate-slide-up">
                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                            {providerHeroSlides[currentHero].title}
                        </h2>
                        <p className="text-lg md:text-xl font-bold mb-10 text-white leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                            {providerHeroSlides[currentHero].text}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/provider/services')}
                        className="bg-green-500 text-white px-10 py-4 rounded-full font-black text-lg shadow-[0_20px_50px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Manage Services <span className="text-xl">→</span>
                    </button>

                    {/* Progress dots */}
                    <div className="flex gap-3 mt-12">
                        {providerHeroSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setCurrentHero(i); resetHeroTimer(); }}
                                className={`h-1.5 rounded-full transition-all ${i === currentHero ? 'bg-white w-16' : 'bg-white/40 w-10 hover:bg-white/60'}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Grid Section */}
            <section className="py-10 bg-transparent pt-0">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header with Find Farmers Button */}
                    <div className="text-center mb-16">
                        <h2 className="text-black font-bold uppercase tracking-[0.2em] text-xs mb-3 animate-fade-in">Marketplace</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-green-600 mb-4 animate-slide-up">Services You Can Offer</h3>
                        <p className="text-black max-w-2xl mx-auto text-base animate-slide-up animate-delay-100">
                            Browse available service categories and add your equipment to start receiving booking requests from farmers.
                        </p>
                    </div>

                    {/* Service Cards Redesigned */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {serviceCategories.map((service, idx) => (
                            <div
                                key={service.id}
                                onClick={() => navigate('/provider/services')}
                                className="group bg-white rounded-[2rem] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col"
                            >
                                {/* Card Header with Image */}
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={service.img}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>
                                </div>

                                {/* Content Overlay */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <h4 className="text-xl font-bold text-black mb-3 group-hover:text-green-600 transition-colors">
                                        {service.title}
                                    </h4>

                                    <p className="text-black text-xs leading-relaxed line-clamp-2 mb-6">
                                        {service.desc}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-green-600 text-xs font-black uppercase tracking-wider">
                                            Setup Now
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <button
                            onClick={() => navigate('/provider/services')}
                            className="px-12 py-4 bg-slate-900 text-white font-black rounded-full hover:bg-green-600 hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            View All Opportunities
                        </button>
                    </div>
                </div>
            </section>

            {/* About Platform Section */}
            <section className="py-24 px-6 max-w-7xl mx-auto bg-transparent">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 group">
                        <img src={sprayingImg} alt="Agri Tech" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="space-y-8">
                        <h2 className="text-black font-bold uppercase tracking-[0.2em] text-xs">Platform Strength</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-black leading-tight">
                            Grow Your Agricultural <span className="text-green-500">Empire</span>
                        </h3>
                        <p className="text-black leading-relaxed text-base font-medium">
                            Join our elite network of providers. Connect with thousands of farmers, manage high-value bookings, and dominate your local market with precision tools.
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                "Hyper-local Farmer Discovery",
                                "Automated Schedule Management",
                                "Instant Digital Payments"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-green-500/20 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <span className="text-sm font-black">✓</span>
                                    </div>
                                    <span className="font-bold text-black">{item}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/about')}
                            className="bg-green-500 text-white px-10 py-4 rounded-full font-bold hover:bg-green-600 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
                        >
                            Explore Platform Insights →
                        </button>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-10 bg-transparent mt-0">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-black font-bold uppercase tracking-[0.2em] text-xs mb-3">Core Pillars</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-green-600 mb-4">Elite Provider Benefits</h3>
                        <p className="text-black max-w-2xl mx-auto text-base font-medium">
                            The infrastructure you need to scale your services and maximize profitability.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {featureList.map((feature, index) => (
                            <div
                                key={index}
                                className="p-10 rounded-[2.5rem] bg-white border border-slate-100 hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2 transition-all duration-300 group shadow-sm"
                            >
                                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)]">{feature.icon}</div>
                                <h4 className="text-2xl font-black mb-4 text-black">{feature.title}</h4>
                                <p className="text-black leading-relaxed text-lg font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 m-0 ">
                <div className="max-w-5xl mx-auto rounded-[3.5rem] bg-gradient-to-br from-green-600 to-green-800 p-12 md:p-20 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Ready to Dominate <br />Your Market?</h2>
                        <p className="text-lg mb-12 text-green-50 font-medium max-w-2xl mx-auto">
                            Setup your service portfolio today and unlock direct access to premium farmers in your district.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button
                                onClick={() => navigate('/provider/services')}
                                className="bg-slate-950/20 backdrop-blur-md border border-white/30 text-white px-12 py-5 rounded-full font-black text-lg hover:bg-white hover:text-green-600 transition-all"
                            >
                                Start Service Portal
                            </button>
                            <button
                                onClick={() => navigate('/provider/earnings')}
                                className="bg-slate-950/20 backdrop-blur-md border border-white/30 text-white px-12 py-5 rounded-full font-black text-lg hover:bg-white hover:text-green-600 transition-all"
                            >
                                View Potential
                            </button>
                        </div>
                    </div>
                    {/* Decorative blobs for CTA */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -mr-20 -mb-20"></div>
                </div>
            </section>
        </div >
    );
};

export default ProviderHome;
