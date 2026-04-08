import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import droneImg from '../../assets/Drone spraying Service.jpeg';
import sprayingImg from '../../assets/irrigation_system.png';
import solarImg from '../../assets/Solar Panel Installation.png';
import img1 from '../../assets/img 1.png';
import img2 from '../../assets/img 2.png';

const SLIDE_DURATION = 5000; // 5 seconds per slide

// Only slide 0 has content — slides 1 & 2 are pure images
const heroSlides = [
  {
    img: droneImg,
    title: "Precision Drone Spraying",
    text: "Efficient, targeted aerial application designed to maximize coverage while reducing chemical waste.",
    badge: "🚁 Aerial Tech",
    hasContent: true
  },
  { img: img1, hasContent: false },
  { img: img2, hasContent: false }
];

const imgMap = {
  "Drone Spraying Service": droneImg,
  "Solar Panel Installation": solarImg,
};

const descMap = {
  "Drone Spraying Service": "Precision pesticide and fertilizer application using advanced drone technology.",
  "Solar Panel Installation": "Professional solar pump and solar panel installation services for farms.",
};

const DashboardHome = ({ userName, onViewServices }) => {
  const navigate = useNavigate();
  const [serviceCategories, setServiceCategories] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(null);
  const [currentHero, setCurrentHero] = useState(0);
  const heroTimerRef = useRef(null);

  /* ================= LOCATION STATE ================= */
  const [updatingLocation, setUpdatingLocation] = useState(false);

  /* ================= UPDATE FARMER LOCATION ================= */
  const updateMyLocation = async () => {

    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
      return;
    }

    setUpdatingLocation(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("User not logged in");
      setUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(

      async (pos) => {

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const { error } = await supabase
          .from("farmers")
          .update({
            lat: lat,
            lng: lng
          })
          .eq("id", user.id);

        if (error) {
          console.error(error);
          alert("Failed to update location");
        } else {
          alert("Location updated successfully");
        }

        setUpdatingLocation(false);

      },

      () => {
        alert("Please allow location permission.");
        setUpdatingLocation(false);
      }

    );

  };

  const nextHero = useCallback(() => {
    setCurrentHero((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevHero = useCallback(() => {
    setCurrentHero((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  }, []);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  const resetHeroTimer = useCallback(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
    }, 30);
    heroTimerRef.current = setTimeout(() => {
      nextHero();
    }, SLIDE_DURATION);
  }, [nextHero]);

  useEffect(() => {
    resetHeroTimer();
    return () => {
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [resetHeroTimer, currentHero]);

  const handleManualHeroNav = (direction) => {
    if (direction === 'next') nextHero();
    else prevHero();
    resetHeroTimer();
  };

  const featureList = [
    {
      title: "Easy Booking",
      desc: "Book any service in a few clicks. Our intuitive interface allows you to schedule machinery and operators for specific dates and times.",
      icon: "📱",
    },
    {
      title: "Verified Quality",
      desc: "All operators and equipment are strictly verified. We ensure that you get the best performance and value for your money.",
      icon: "✅",
    },
    {
      title: "Transparent Pricing",
      desc: "No hidden costs. Get clear upfront pricing and estimates for all services. Secure payments and detailed invoices for your records.",
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
      desc: descMap[cat.name] || "Agriculture service provider support.",
    }));

    if (!mapped.find(cat => cat.title === "Solar Panel Installation")) {
      mapped.push({
        id: 'solar-coming-soon',
        title: "Solar Panel Installation",
        img: solarImg,
        desc: descMap["Solar Panel Installation"]
      });
    }

    setServiceCategories(mapped);
  };

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const findNearbyProviders = async () => {
    setIsSearching(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const { data, error } = await supabase.rpc("get_nearby_providers", {
          lat: latitude,
          long: longitude,
        });

        if (!error && data) {
          setNearbyCount(data.length);
          console.log("Providers found in your district:", data);
        }
        setIsSearching(false);
      },
      () => {
        alert("Please enable location to find local operators.");
        setIsSearching(false);
      }
    );
  };

  return (
    <div className="bg-emerald-950 relative overflow-hidden pt-[72px]">
      {/* Thematic Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80')` }}
      />
      {/* Gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-emerald-950/80 via-green-900/80 to-black/95" />

      <div className="relative z-10">
      {/* ── Hero Slider Card ── */}
      <div className="mx-6 mt-4 rounded-[2rem] overflow-hidden relative h-[360px] group shadow-2xl bg-emerald-950">

        {/* Slide images — stacked, cross-fade via opacity */}
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === currentHero ? 1 : 0, zIndex: i === currentHero ? 1 : 0 }}
          >
            {/* Full image — no zoom, fully visible */}
            <img
              src={slide.img}
              alt={slide.title || `slide-${i}`}
              className="w-full h-full object-contain object-center"
            />
            {/* Watermark cover: hides the top-right badge on img2 */}
            {!slide.hasContent && (
              <div className="absolute top-0 right-0 w-32 h-10 bg-emerald-950" />
            )}
            {/* Dark gradient only on the content slide */}
            {slide.hasContent && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
            )}
          </div>
        ))}

        {/* ── Slide content — only shown on slide 0 ── */}
        {heroSlides[currentHero].hasContent && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center px-6">
            <div className="max-w-5xl">
              {/* Badge */}
              <span
                key={`badge-${currentHero}`}
                className="inline-block mb-6 bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md text-emerald-300 text-xs font-black uppercase tracking-[0.25em] px-5 py-2 rounded-full"
                style={{ animation: 'slideUp 0.6s ease forwards' }}
              >
                {heroSlides[currentHero].badge}
              </span>

              <h1
                key={`title-${currentHero}`}
                className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none drop-shadow-2xl"
                style={{ animation: 'slideUp 0.7s 0.1s ease both' }}
              >
                {heroSlides[currentHero].title}
              </h1>
              <p
                key={`text-${currentHero}`}
                className="text-xl md:text-2xl max-w-3xl mx-auto font-medium mb-10 text-white/85 leading-relaxed drop-shadow-lg"
                style={{ animation: 'slideUp 0.7s 0.2s ease both' }}
              >
                {heroSlides[currentHero].text}
              </p>

              <div
                key={`btns-${currentHero}`}
                className="flex flex-col sm:flex-row gap-5 justify-center"
                style={{ animation: 'slideUp 0.7s 0.3s ease both' }}
              >
                <button
                  onClick={onViewServices}
                  className="bg-emerald-500 text-white px-10 py-4 rounded-full font-black text-lg shadow-xl hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Explore Services →
                </button>
                <button
                  onClick={updateMyLocation}
                  className="bg-white/10 border border-white/30 backdrop-blur-md text-white px-10 py-4 rounded-full font-black text-lg shadow-xl hover:bg-white/20 transition-all uppercase tracking-widest flex items-center gap-2"
                >
                  {updatingLocation ? 'Updating…' : '📍 My Location'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Prev / Next Arrows ── */}
        <button
          onClick={() => handleManualHeroNav('prev')}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={() => handleManualHeroNav('next')}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={28} />
        </button>

        {/* ── Dot indicators + animated progress bar ── */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentHero(i); resetHeroTimer(); }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentHero
                    ? 'bg-emerald-400 w-14 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : 'bg-white/30 w-6 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          {/* Thin progress bar that fills over SLIDE_DURATION */}
          <div className="w-40 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Services Grid Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header with Find Operators Button */}
          {/* Header without Find Operators Button */}
          <div className="relative mb-20">
            {/* Glassmorphism Card Wrapper */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-12 rounded-[4rem] shadow-2xl relative z-10 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              
              <div className="text-center relative z-10">
                <h2 className="text-black font-black uppercase tracking-[0.3em] text-[10px] mb-4 opacity-80 group-hover:tracking-[0.4em] transition-all duration-700">Marketplace</h2>
                <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                  Available <span className="text-emerald-400">Agri-Tech</span> Solutions
                </h3>
                <p className="text-white/90 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed drop-shadow-sm">
                  From precision spraying to heavy machinery rental, we provide comprehensive services to modernize your farming operations.
                </p>
              </div>
            </div>
            
            {/* Decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[100px] rounded-full -z-10"></div>
          </div>

          {/* Service Cards Redesigned */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCategories.map((service, idx) => {
              const isSolar = service.title === "Solar Panel Installation";
              return (
              <div
                key={service.id}
                onClick={isSolar ? undefined : onViewServices}
                className={`group relative bg-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ${isSolar ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:bg-white/20 hover:-translate-y-2'} shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/20 flex flex-col`}
              >
                {/* Card Header with Image */}
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={service.img}
                    alt={service.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${isSolar ? 'blur-[1px] grayscale' : 'group-hover:scale-110'}`}
                  />
                  {!isSolar && <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300"></div>}
                  {isSolar && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10">
                      Coming Soon
                    </div>
                  )}
                  {isSolar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                      <span className="text-white text-lg font-bold tracking-wide px-4 py-2 bg-yellow-600/90 rounded-full border border-yellow-400">🔒 Coming Soon</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-2xl font-black text-white mb-2 truncate group-hover:text-emerald-400 transition-colors">
                      {service.title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-4 font-medium">
                      {service.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                    {isSolar ? (
                       <span className="text-white/50 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                         Coming Soon
                       </span>
                    ) : (
                      <span className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                        View Services <ChevronRight size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={onViewServices}
              className="px-12 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              View All Services
            </button>
          </div>
        </div>
      </section >

      {/* About Platform Section (2-in-1 Unified Glassmorphism Card) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-12 rounded-[5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="rounded-[3.5rem] overflow-hidden shadow-2xl h-full border border-white/10">
              <img src={sprayingImg} alt="Agri Tech" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-6">
              <h2 className="text-black font-black uppercase tracking-[0.3em] text-[10px] opacity-80">About Our Platform</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                Revolutionizing Agriculture with <span className="text-emerald-400">Technology</span>
              </h3>
              <p className="text-white/80 leading-relaxed text-lg font-medium">
                We are building a comprehensive digital ecosystem that connects farmers with the best tools, services, and operators. Our goal is to modernize farming practices and ensure prosperity for every member of the agricultural community.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-white font-bold group-hover:translate-x-2 transition-transform">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                  <span>Verified equipment and operators</span>
                </li>
                <li className="flex items-center gap-4 text-white font-bold group-hover:translate-x-2 transition-transform delay-75">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                  <span>Real-time booking and tracking</span>
                </li>
                <li className="flex items-center gap-4 text-white font-bold group-hover:translate-x-2 transition-transform delay-150">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                  <span>Transparent pricing with no hidden fees</span>
                </li>
              </ul>
              <div className="pt-6">
                <button
                  onClick={() => navigate('/about')}
                  className="bg-emerald-500 text-white px-10 py-4 rounded-full font-black hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm"
                >
                  Read More About Us →
                </button>
              </div>
            </div>
          </div>

          {/* Decorative glow inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-all duration-700"></div>
        </div>
      </section>

      {/* Features Section */}
      < section className="py-20" >
        <div className="container mx-auto px-6">
          {/* Header Text wrapped in glassmorphism card */}
          <div className="relative mb-20 bg-white/10 backdrop-blur-2xl border border-white/20 p-12 rounded-[4rem] shadow-2xl z-10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="text-center relative z-10 animate-fade-in">
              <h2 className="text-black font-black uppercase tracking-[0.3em] text-[10px] mb-4 opacity-80 group-hover:tracking-[0.4em] transition-all duration-700">Benefits</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                Why Choose <span className="text-emerald-400">Our Platform?</span>
              </h3>
              <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed drop-shadow-sm">
                Designed with the specific needs of the farming community in mind, offering a seamless experience from booking to harvest.
              </p>
            </div>
            
            {/* Decorative background glow inside header card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/10 blur-[100px] rounded-full -z-10 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-10">
            {featureList.map((feature, index) => (
              <div
                key={index}
                className="p-12 rounded-[3.5rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                <div className="text-7xl mb-8 group-hover:scale-110 transition-transform relative z-10">{feature.icon}</div>
                <h4 className="text-2xl font-black mb-4 text-white group-hover:text-emerald-400 transition-colors uppercase tracking-widest relative z-10">{feature.title}</h4>
                <p className="text-white/60 leading-relaxed text-lg font-medium relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Call to Action Section */}
      <section className="py-32 px-6" >
        {/* Glassmorphism CTA Card */}
        <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-2xl border border-white/20 p-12 md:p-24 rounded-[5rem] shadow-2xl relative overflow-hidden text-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-black mb-8 text-white tracking-tighter">
              Ready to Transform Your <span className="text-emerald-400">Farming?</span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/80 font-medium max-w-3xl mx-auto leading-relaxed">
              Join thousands of farmers who are already using our platform to increase productivity and reduce costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={onViewServices}
                className="bg-emerald-500 text-white px-12 py-5 rounded-full font-black text-xl hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase tracking-widest"
              >
                Book a Service Now
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-12 py-5 rounded-full font-black text-xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all shadow-2xl uppercase tracking-widest"
              >
                View My Bookings
              </button>
            </div>
          </div>
          
          {/* Decorative glow */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

          {/* Support Contact */}
          <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/70 text-sm font-semibold">
            <a href="tel:+919100099575" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full transition-all text-white">
              <span>📞</span> +91 91000 99575
            </a>
            <a href="https://mail.google.com/mail/?view=cm&to=aerodronemitrasupport@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full transition-all text-white">
              <span>✉️</span> aerodronemitrasupport@gmail.com
            </a>
          </div>
        </div>
      </section >
      </div>
    </div >
  );
};

export default DashboardHome;