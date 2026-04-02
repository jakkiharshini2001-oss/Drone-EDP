import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Contact = ({ embedded = false }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Message Sent:", formData);
    alert(t('contact.thankYou'));
  };

  return (
    <div className={`${embedded ? 'pb-10 pt-0' : 'pt-24 min-h-screen'} bg-transparent relative overflow-hidden `}>

      <div className="relative z-10">
        {/* Hero Header */}
        <section className={`${embedded ? 'pt-0 pb-20' : 'py-20'} px-6 flex items-center justify-center overflow-hidden`}>
          <div className="relative z-10 text-center px-10 py-12 bg-white/10 backdrop-blur-2xl border border-white/40 rounded-[4rem] shadow-2xl max-w-4xl mx-auto flex flex-col items-center gap-6">

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl ">
              {t('contact.heroTitle')} <span className="text-emerald-400">{t('contact.heroTitleHighlight')}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-lg font-medium max-w-2xl mx-auto">
              {t('contact.heroSubtitle')}
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pt-10">
          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl text-center border border-white/20 hover:border-emerald-400/50 transition-all group">
              <div className="bg-emerald-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-white mb-2">{t('contact.visitUs')}</h3>
              <p className="text-white/80 text-xs leading-relaxed">123 Agri Technology Park<br />Silicon Valley Drive, Hyderabad</p>
            </div>

            <a
              href="https://mail.google.com/mail/?view=cm&to=aerodronemitrasupport@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl text-center border border-white/20 hover:border-blue-400/50 transition-all group block cursor-pointer"
            >
              <div className="bg-blue-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                <Mail size={24} />
              </div>
              <h3 className="font-bold text-white mb-2">{t('contact.mailUs')}</h3>
              <span className="text-white/80 text-xs leading-relaxed hover:text-blue-300 underline underline-offset-2 transition-colors break-all">aerodronemitrasupport@gmail.com</span>
            </a>

            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl text-center border border-white/20 hover:border-amber-400/50 transition-all group">
              <div className="bg-amber-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400">
                <Phone size={24} />
              </div>
              <h3 className="font-bold text-white mb-2">{t('contact.callUs')}</h3>
              <a href="tel:+919100099575" className="text-white/80 text-xs leading-relaxed hover:text-amber-300 underline underline-offset-2 transition-colors">+91 91000 99575</a>
            </div>
          </div>

          {/* Form and Sidebar Grid */}
          <div className="grid lg:grid-cols-3 gap-12 pb-12">
            {/* Contact Form */}
            {/* Contact Form */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-3xl p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group border border-white/20">
              {/* Decorative background shapes for added uniqueness */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>

              <div className="relative z-10">
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-md">{t('contact.sendMessage')}</h2>
                <p className="text-emerald-400 text-sm mb-10 font-bold tracking-wide uppercase">{t('contact.sendMessageSubtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2 ml-2 transition-transform duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:text-emerald-400">{t('contact.fullName')}</label>
                      <input
                        type="text" placeholder="John Doe"
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm font-bold text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:bg-white/10 shadow-inner"
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2 ml-2 transition-transform duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:text-emerald-400">{t('contact.phoneNumber')}</label>
                      <input
                        type="tel" placeholder="+91 98765 43210"
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm font-bold text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:bg-white/10 shadow-inner"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2 ml-2 transition-transform duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:text-emerald-400">{t('contact.emailAddress')}</label>
                      <input
                        type="email" placeholder="john@example.com"
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm font-bold text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:bg-white/10 shadow-inner"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2 ml-2 transition-transform duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:text-emerald-400">{t('contact.subject')}</label>
                      <input
                        type="text" placeholder={t('contact.subject')}
                        value={formData.subject}
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm font-bold text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:bg-white/10 shadow-inner"
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="group/input">
                    <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2 ml-2 transition-transform duration-300 group-focus-within/input:-translate-y-1 group-focus-within/input:text-emerald-400">{t('contact.message')}</label>
                    <textarea
                      rows="5" placeholder="Tell us about your requirements..."
                      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-sm font-bold text-white placeholder-white/40 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all hover:bg-white/10 resize-none shadow-inner"
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="mt-4 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 w-full sm:w-auto hover:bg-emerald-700 hover:scale-105 hover:shadow-xl hover:shadow-emerald-900/20 transition-all active:scale-95 group/btn">
                    <span>{t('contact.sendBtn')}</span>
                    <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all duration-300" />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[4rem] text-white border border-white/20 shadow-2xl">
                <h3 className="text-xl font-bold mb-8">{t('contact.whyPartner')}</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">1</span>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{t('contact.tech')}</h4>
                      <p className="text-white/70 text-[11px] leading-relaxed">{t('contact.techDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">2</span>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{t('contact.support')}</h4>
                      <p className="text-white/70 text-[11px] leading-relaxed">{t('contact.supportDesc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">3</span>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{t('contact.growth')}</h4>
                      <p className="text-white/70 text-[11px] leading-relaxed">{t('contact.growthDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-64 rounded-[4rem] overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80" alt="farm" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <span className="bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase w-fit mb-2">Find Us</span>
                  <h3 className="text-white font-bold leading-tight">Visit our demo farms to see technology in action.</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;