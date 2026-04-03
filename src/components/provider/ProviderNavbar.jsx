import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Globe, User, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProviderNavbar = ({ toggleSidebar, isSidebarCollapsed, toggleMobileSidebar }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { userData, handleLogout } = useAuth();
    const navigate = useNavigate();

    const navLinks = [

        { to: '/provider/home', label: 'Home' },
        { to: '/provider/dashboard', label: 'Provider Dashboard' },
        { to: '/about', label: 'About Us' },
        { to: '/contact', label: 'Contact' },
    ];

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-indigo-100/50 shadow-sm shadow-indigo-50/50 transition-all duration-300">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex justify-between items-center h-24">

                    {/* Brand & Sidebar Toggle */}
                    <div className="flex items-center gap-6">
                        {/* Desktop Sidebar Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:flex p-3 rounded-xl text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                        >
                            <Menu size={26} />
                        </button>

                        {/* Mobile Sidebar Toggle */}
                        <button
                            onClick={toggleMobileSidebar}
                            className="lg:hidden p-2 rounded-lg text-black hover:bg-slate-50"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/provider/home')}>
                            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform duration-300">
                                <Globe size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700">
                                Aerodronemitra
                            </span>
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center bg-slate-50/50 p-1.5 rounded-full border border-slate-100">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden
                                    ${isActive
                                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 scale-105'
                                        : 'text-black hover:text-indigo-500 hover:bg-white/50'}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Right Section (Lang + Profile) */}
                    <div className="hidden lg:flex items-center gap-6">
                        {/* Language */}
                        <button className="flex items-center gap-2 text-black hover:text-indigo-700 font-bold text-sm bg-white hover:bg-indigo-50 px-4 py-2.5 rounded-full border border-slate-200 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md">
                            <Globe size={16} className="text-indigo-400" /> English
                        </button>

                        <div className="h-8 w-[1px] bg-slate-200"></div>

                        {/* Profile */}
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right">
                                <p className="text-sm font-bold text-black group-hover:text-indigo-700 transition-colors uppercase truncate max-w-[120px]">
                                    {userData?.full_name || "Provider"}
                                </p>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                                    {userData?.mandal_name || "Location"}, {userData?.district || ""}, {userData?.state || ""}
                                </p>
                            </div>
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-200 ring-4 ring-white group-hover:scale-105 transition-transform">
                                {(userData?.full_name || "P").charAt(0)}
                            </div>
                            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-black hover:bg-red-50 hover:text-red-500 transition-all ml-2">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navbar Menu Toggle (Right Side) */}
                    <button
                        className="lg:hidden text-black p-2 rounded-lg hover:bg-slate-100"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <MoreHorizontal size={28} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-indigo-100 p-6 absolute w-full shadow-2xl animate-in slide-in-from-top-5 z-50">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-4 rounded-xl font-bold transition-all
                                    ${isActive
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-slate-50 text-black hover:bg-slate-100'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        <hr className="border-indigo-50" />
                        <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                            <span className="font-bold text-indigo-900">English</span>
                            <Globe size={18} className="text-indigo-400" />
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-3 p-4 rounded-xl font-bold bg-red-50 text-red-500 mt-2 hover:bg-red-100 transition-colors">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default ProviderNavbar;
