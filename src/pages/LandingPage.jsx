import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LocationSelector from "../components/LocationSelector";
import { User, Tractor } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

// Video Assets
import droneVid from '../assets/Crop_Drone_Spraying_Video_Generated.mp4';
import tractorVid from '../assets/Flexible Tractor Rentals.mp4';
import harvestVid from '../assets/All-in-One Harvesting.mp4';

const slides = [
    {
        vid: droneVid,
        title: "Future of Farming is Here",
        text: "Experience precision agriculture with our advanced drone spraying services."
    },
    {
        vid: tractorVid,
        title: "Modern Tractor Fleet",
        text: "High-performance tractors available for all your heavy-duty farming needs."
    },
    {
        vid: harvestVid,
        title: "Efficient Harvesting",
        text: "Maximize your yield with our state-of-the-art harvesting equipment."
    }
];

const LandingPage = () => {
    const navigate = useNavigate();
    const { fetchUserProfile } = useAuth();
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [authMode, setAuthMode] = useState('farmer-login'); // 'farmer-login', 'farmer-signup', 'provider-login', 'provider-signup'
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');

    // Video Carousel Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        village: '',   // stores mandal
        district: '',
        state: '',
        lat: null,
        lng: null
    });

    const [location, setLocation] = useState({
        state: '',
        district: '',
        mandal: ''
    });

    // Sync Location
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            state: location.state,
            district: location.district,
            village: location.mandal
        }));
    }, [location]);

    const captureLocation = () => {
        setLocationStatus('loading');
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            setLocationStatus('idle');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }));
                setLocationStatus('success');
            },
            () => {
                alert('Location permission denied');
                setLocationStatus('idle');
            }
        );
    };

    const handleSignIn = async (e, role) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });
            if (error) throw error;
            // AuthContext will handle redirect based on role
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e, role) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: authData, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (error) throw error;

            const user = authData.user;
            if (user) {
                const profileTable = role === 'farmer' ? 'farmers' : 'providers';
                const { error: profileError } = await supabase
                    .from(profileTable)
                    .insert([{
                        id: user.id,
                        farmer_name: formData.fullName,
                        phone_number: formData.phone,
                        state: formData.state,
                        district: formData.district,
                        mandal_name: formData.village,
                        lat: formData.lat,
                        lng: formData.lng
                    }]);
                if (profileError) throw profileError;
            }

            // Manually refresh profile
            await fetchUserProfile(user.id);

            alert('Registration successful. Please sign in.');
            setAuthMode(role === 'farmer' ? 'farmer-login' : 'provider-login');
            // Reset form
            setFormData({ ...formData, email: '', password: '', fullName: '', phone: '' });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Components for Forms
    const LoginForm = ({ role }) => (
        <form onSubmit={(e) => handleSignIn(e, role)} className="space-y-4">
            <h2 className="text-2xl text-center text-white mb-6 flex items-center justify-center gap-2 font-bold uppercase tracking-tight">
                {role === 'farmer' ? <User size={28} className="text-emerald-400" /> : <Tractor size={28} className="text-orange-400" />}
                {role === 'farmer' ? t('landing.farmerLogin') : t('landing.providerLogin')}
            </h2>
            <input
                type="email"
                placeholder={t('landing.emailAddress')}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-white placeholder-white/40 backdrop-blur-sm"
                required
            />
            <input
                type="password"
                placeholder={t('landing.password')}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all text-white placeholder-white/40 backdrop-blur-sm"
                required
            />
            <button className={`w-full text-white py-4 rounded-xl shadow-2xl transform active:scale-95 transition-all font-black uppercase tracking-widest text-sm ${role === 'farmer' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}>
                {loading ? t('landing.signingIn') : t('landing.signIn')}
            </button>
            <p className="text-center text-white/70 text-sm mt-4 font-medium">
                {t('landing.noAccount')} {' '}
                <button type="button" onClick={() => setAuthMode(`${role}-signup`)} className={`font-bold hover:underline ${role === 'farmer' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {t('landing.signUp')}
                </button>
            </p>
        </form>
    );

    const SignUpForm = ({ role }) => (
        <form onSubmit={(e) => handleSignUp(e, role)} className="space-y-3 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-2xl text-center text-white mb-4 flex items-center justify-center gap-2 font-bold uppercase tracking-tight">
                {role === 'farmer' ? <User size={28} className="text-emerald-400" /> : <Tractor size={28} className="text-orange-400" />}
                {role === 'farmer' ? t('landing.joinAsFarmer') : t('landing.joinAsProvider')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                <input placeholder={t('landing.fullName')} value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" required />
                <input placeholder={t('landing.phone')} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" required />
            </div>
            <input type="email" placeholder={t('landing.emailAddress')} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" required />
            <input type="password" placeholder={t('landing.password')} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" required />

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] text-white/50 mb-3 uppercase font-black tracking-widest">{t('landing.locationDetails')}</p>
                <LocationSelector value={location} onChange={setLocation} />
            </div>

            <button type="button" onClick={captureLocation} className="w-full border border-white/20 py-3 rounded-xl text-white/80 hover:bg-white/5 text-sm transition-all font-bold">
                {locationStatus === 'success' ? t('landing.locationCaptured') : t('landing.captureLocation')}
            </button>

            <button className={`w-full text-white py-4 rounded-xl shadow-2xl transform active:scale-95 transition-all mt-2 font-black uppercase tracking-widest text-sm ${role === 'farmer' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}>
                {loading ? t('landing.creatingAccount') : t('landing.createAccount')}
            </button>
            <p className="text-center text-white/70 text-sm mt-4 pb-4 font-medium">
                {t('landing.haveAccount')} {' '}
                <button type="button" onClick={() => setAuthMode(`${role}-login`)} className={`font-bold hover:underline ${role === 'farmer' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {t('landing.signIn')}
                </button>
            </p>
        </form>
    );

    return (
        <div className="relative h-screen w-full overflow-hidden bg-black font-sans">
            {/* Background Video */}
            <video key={slides[currentSlide].vid} autoPlay loop muted playsInline className="absolute w-full h-full object-cover opacity-60 transition-opacity duration-1000">
                <source src={slides[currentSlide].vid} type="video/mp4" />
            </video>

            {/* Overlay Container */}
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row shadow-2xl overflow-hidden">

                {/* Left Side: Hero Text (Hidden on mobile when form is active to save space, or kept for grandeur) */}
                <div className="hidden md:flex flex-col flex-1 items-start justify-center p-12 lg:p-24 text-white bg-gradient-to-r from-black/80 to-transparent">
                    <div className="animate-in slide-in-from-left duration-700">
                        <h1 className="text-5xl lg:text-7xl mb-6 leading-tight drop-shadow-2xl">
                            {slides[currentSlide].title}
                        </h1>
                        <p className="text-xl lg:text-2xl font-light max-w-2xl drop-shadow-lg text-slate-200">
                            {slides[currentSlide].text}
                        </p>
                    </div>
                </div>

                {/* Right Side: Auth Card */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-sm md:bg-transparent">
                    <div className="w-full max-w-md relative animate-in zoom-in duration-500 rounded-[3rem] overflow-hidden shadow-2xl">
                        {/* Blurred Image Background Overlay */}
                        <div 
                            className="absolute inset-0 z-0 bg-cover bg-center box-content scale-110 blur-xl opacity-60"
                            style={{ backgroundImage: `url('/Gemini_Generated_Image_dq9vujdq9vujdq9v.png')` }}
                        ></div>
                        
                        {/* Green Gradient Form Container */}
                        <div className="relative z-10 bg-gradient-to-br from-emerald-600/90 via-green-700/85 to-teal-900/90 p-10 border border-white/20 backdrop-blur-md">
                            <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>

                            {/* Dynamic Form Rendering */}
                            {authMode === 'farmer-login' && <LoginForm role="farmer" />}
                            {authMode === 'farmer-signup' && <SignUpForm role="farmer" />}
                            {authMode === 'provider-login' && <LoginForm role="provider" />}
                            {authMode === 'provider-signup' && <SignUpForm role="provider" />}
                        </div>
                    </div>

                    {/* Footer Provider Switch */}
                    <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                        {authMode.includes('farmer') ? (
                            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-full border border-white/10 px-8 flex items-center gap-4 shadow-2xl">
                                <span className="bg-white/10 backdrop-blur-md text-white/80 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 tracking-tight">
                                    {t('landing.areYouProvider')}
                                </span>
                                <button onClick={() => setAuthMode('provider-login')} className="bg-[oklch(95.3%_0.051_180.801)] text-emerald-950 px-6 py-2.5 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-all uppercase tracking-wider">
                                    {t('landing.providerStartHere')}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-full border border-white/10 px-8 flex items-center gap-4 shadow-2xl">
                                <span className="bg-emerald-500/10 backdrop-blur-md text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20 tracking-tight">
                                    {t('landing.lookingForServices')}
                                </span>
                                <button onClick={() => setAuthMode('farmer-login')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-black shadow-lg hover:scale-105 transition-all shadow-emerald-500/20 uppercase tracking-wider">
                                    {t('landing.farmerLogin')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
