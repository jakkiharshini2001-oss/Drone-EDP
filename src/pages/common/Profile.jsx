import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LocationSelector from '../../components/LocationSelector';
import { User, Mail, Phone, MapPin, Edit2, Save, X, ArrowLeft } from 'lucide-react';

const Profile = () => {
    const { userData, setUserData } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    // Ensure background is active
    useEffect(() => {
        document.body.classList.add("show-bg");
    }, []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data state
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        state: '',
        district: '',
        mandal_name: '',
        lat: null,
        lng: null
    });

    // Location selector state
    const [location, setLocation] = useState({
        state: '',
        district: '',
        mandal: ''
    });

    // Initialize form data from userData
    useEffect(() => {
        if (userData) {
            setFormData({
                full_name: userData.full_name || '',
                phone_number: userData.phone_number || '',
                email: userData.email || '',
                state: userData.state || '',
                district: userData.district || '',
                mandal_name: userData.mandal_name || '',
                lat: userData.lat || null,
                lng: userData.lng || null
            });

            setLocation({
                state: userData.state || '',
                district: userData.district || '',
                mandal: userData.mandal_name || ''
            });
        }
    }, [userData]);

    // Sync location selector to form data
    useEffect(() => {
        if (isEditing) {
            setFormData(prev => ({
                ...prev,
                state: location.state,
                district: location.district,
                mandal_name: location.mandal
            }));
        }
    }, [location, isEditing]);

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
        setSuccess('');
        // Reset form data to original userData
        if (userData) {
            setFormData({
                full_name: userData.full_name || '',
                phone_number: userData.phone_number || '',
                email: userData.email || '',
                state: userData.state || '',
                district: userData.district || '',
                mandal_name: userData.mandal_name || '',
                lat: userData.lat || null,
                lng: userData.lng || null
            });

            setLocation({
                state: userData.state || '',
                district: userData.district || '',
                mandal: userData.mandal_name || ''
            });
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.full_name || !formData.phone_number) {
                setError('Full name and phone number are required');
                setLoading(false);
                return;
            }

            // Determine which table to update based on user role
            const tableName = userData.user_role === 'farmer' ? 'farmers' : 'providers';

            // Update profile in Supabase
            const { data, error: updateError } = await supabase
                .from(tableName)
                .update({
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    state: formData.state,
                    district: formData.district,
                    mandal_name: formData.mandal_name,
                    lat: formData.lat,
                    lng: formData.lng
                })
                .eq('id', userData.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update local userData context
            setUserData({
                ...userData,
                ...data
            });

            setSuccess('Profile updated successfully!');
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Profile update error:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const captureLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }));
                setSuccess('Location captured successfully!');
                setTimeout(() => setSuccess(''), 3000);
            },
            () => {
                alert('Location permission denied');
            }
        );
    };

    if (!userData) {
        return (
            <div className="min-h-screen pt-24 bg-transparent flex items-center justify-center">
                <p className="text-black">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-black hover:text-black transition-colors font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span className="text-black">Back</span>
                </button>
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {formData.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-black">{formData.full_name}</h1>
                                <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide">
                                    {userData.user_role}
                                </p>
                            </div>
                        </div>

                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-all font-semibold"
                            >
                                <Edit2 size={18} />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 bg-slate-200 text-black px-6 py-3 rounded-lg hover:bg-slate-300 transition-all font-semibold"
                                    disabled={loading}
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all font-semibold"
                                    disabled={loading}
                                >
                                    <Save size={18} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                            {error}
                        </div>
                    )}
                </div>

                {/* Profile Information */}
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-black mb-6">Profile Information</h2>

                    <div className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                                <User size={16} />
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="Enter your full name"
                                    required
                                />
                            ) : (
                                <p className="text-lg text-black font-medium bg-white px-4 py-3 rounded-lg border border-gray-100">
                                    {formData.full_name}
                                </p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                                <Phone size={16} />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            ) : (
                                <p className="text-lg text-black font-medium bg-white px-4 py-3 rounded-lg border border-gray-100">
                                    {formData.phone_number}
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
                                <MapPin size={16} />
                                Location
                            </label>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <LocationSelector value={location} onChange={setLocation} />
                                    <button
                                        type="button"
                                        onClick={captureLocation}
                                        className="w-full border-2 border-indigo-200 text-indigo-600 px-4 py-3 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
                                    >
                                        {formData.lat && formData.lng ? '✓ GPS Location Captured' : '📍 Capture GPS Location'}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white px-4 py-3 rounded-lg border border-gray-100">
                                    <p className="text-lg text-black font-medium">
                                        {formData.mandal_name}, {formData.district}, {formData.state}
                                    </p>
                                    {formData.lat && formData.lng && (
                                        <p className="text-sm text-black mt-1">
                                            GPS: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
