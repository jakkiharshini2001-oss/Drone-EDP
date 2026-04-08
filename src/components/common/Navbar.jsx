import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X, Globe, User } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useUI } from "../../context/UIContext";
import { useLanguage } from "../../context/LanguageContext";

const Navbar = ({ isLoggedIn, userData, onAuthClick, onLogout, onNavigate }) => {
  const { toggleMobileSidebar, toggleSidebar } = useUI();
  const { t, langDisplayName, setLanguage } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = ['English', 'हिन्दी (Hindi)', 'తెలుగు (Telugu)'];

  const handleNavClick = (view) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname === `/${path}`;
  };
  const isLandingPage = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 px-6 py-4 flex items-center justify-between text-black bg-[oklch(93%_0.007_106.5)]
      ${isScrolled ? 'shadow-md border-b border-slate-200' : 'border-b border-transparent'}`}>

      {/* Brand Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick(isLoggedIn ? (userData?.user_role === 'provider' ? 'provider/home' : 'dashboard') : '')}>
          <img src={logo} alt="Aerodronemitra " className="w-10 h-10 object-contain transition-all duration-300 " />
          <span className={`font-black tracking-tighter uppercase transition-all duration-300 text-xl text-green-600`}>
            Aerodronemitra
          </span>
        </div>
      </div>

      {/* Desktop Navigation Links - Hidden on Landing Page */}
      {!isLandingPage && (
        <div className="hidden md:flex items-center bg-slate-50/50 p-1.5 rounded-full border border-slate-100 gap-1">
          {isLoggedIn && userData?.user_role === 'provider' ? (
            <>
              <button
                onClick={() => handleNavClick('provider/home')}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => handleNavClick('provider/dashboard')}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
              >
                {t('nav.dashboard')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick(isLoggedIn ? 'dashboard' : '')}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
              >
                {t('nav.home')}
              </button>
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => handleNavClick('services')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
                  >
                    {t('nav.services')}
                  </button>
                  <button
                    onClick={() => handleNavClick('my-bookings')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
                  >
                    {t('nav.myBookings')}
                  </button>
                </>
              )}
            </>
          )}

          {/* Common Links */}
          <button
            onClick={() => handleNavClick('about')}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
          >
            {t('nav.aboutUs')}
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 text-black hover:bg-slate-200"
          >
            {t('nav.contact')}
          </button>
        </div>
      )}


      {/* Actions Section */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 bg-slate-100 rounded-lg text-black font-bold hover:bg-slate-200 transition-all px-4 py-2 text-xs border border-slate-200"
          >
            <Globe size={14} className="text-black" /> {langDisplayName}
          </button>
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-slate-100 overflow-hidden z-50">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLanguage(l);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${langDisplayName === l ? 'bg-slate-100 text-black font-extrabold' : 'text-black hover:bg-slate-50'
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Auth Section */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAuthClick('farmer')}
              className="bg-green-500 text-white rounded-full font-extrabold shadow-lg hover:bg-green-700 active:scale-95 transition-all px-6 py-2 text-sm shadow-green-600/20"
            >
              {t('nav.login')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 border-l pl-4 border-slate-200">
            <div className="hidden lg:flex flex-col items-end text-right">
              <p className="text-black font-bold text-sm uppercase truncate max-w-[200px]">
                {userData?.full_name}
              </p>
              <p className="text-agri-green font-semibold text-[10px] uppercase tracking-wide">
                {userData?.user_role}
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="bg-indigo-50 text-black p-2 rounded-lg hover:bg-indigo-100 transition-all group"
                title="Profile"
              >
                <User size={18} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-indigo-50 rounded-xl shadow-xl py-2 border border-indigo-100 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      handleNavClick('profile');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <User size={16} />
                    {t('nav.profileSettings')}
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-black"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[oklch(93%_0.007_106.5)] shadow-2xl border-t border-slate-200 md:hidden flex flex-col p-6 gap-6 font-bold text-black animate-in slide-in-from-top duration-300">
          <button onClick={() => handleNavClick(isLoggedIn ? (userData?.user_role === 'provider' ? 'provider/home' : 'dashboard') : '')} className="text-left py-2 border-b border-slate-100">{t('nav.home')}</button>

          {isLoggedIn && userData?.user_role === 'provider' ? (
            <button onClick={() => handleNavClick('provider-manage')} className="text-left py-2 border-b border-slate-100 text-agri-green">
              {t('nav.providerDashboard')}
            </button>
          ) : (
            <>
              {isLoggedIn && (
                <button onClick={() => handleNavClick('services')} className="text-left py-2 border-b border-slate-100">{t('nav.services')}</button>
              )}

              {isLoggedIn && (
                <button onClick={() => handleNavClick('bookings')} className="text-left py-2 border-b border-slate-100 text-agri-green">
                  {t('nav.myBookings')}
                </button>
              )}
            </>
          )}

          {isLoggedIn && (
            <>
              <button onClick={() => handleNavClick('about')} className="text-left py-2 border-b border-slate-100">{t('nav.aboutUs')}</button>
              <button onClick={() => handleNavClick('contact')} className="text-left py-2">{t('nav.contact')}</button>
            </>
          )}

          {!isLoggedIn && (
            <>
              <button onClick={() => handleNavClick('about')} className="text-left py-2 border-b border-slate-100">{t('nav.aboutUs')}</button>
              <button onClick={() => handleNavClick('contact')} className="text-left py-2 border-b border-slate-100">{t('nav.contact')}</button>
              <button
                onClick={() => onAuthClick('farmer')}
                className="w-full text-center py-3 bg-agri-green text-white rounded-xl font-bold shadow-lg"
              >
                {t('nav.login')}
              </button>
            </>
          )}

          {/* Mobile Language Switcher */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Language</p>
            <div className="flex flex-col gap-1">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLanguage(l);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${langDisplayName === l ? 'bg-green-600 text-white font-extrabold' : 'text-black hover:bg-black/5 text-black font-medium'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
