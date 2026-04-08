import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import backgroundImg from '../../assets/background.jpg';

const About = ({ embedded = false }) => {
  const { t } = useLanguage();


  return (
    <div className={`${embedded ? 'py-10' : 'pt-[72px]'} min-h-screen relative overflow-hidden ${embedded ? 'bg-transparent' : 'bg-emerald-950'}`}>
      {!embedded && (
        <>
          {/* Background image */}
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: `url('${backgroundImg}')` }}
          />
          {/* Emerald gradient overlay */}
          <div className="fixed inset-0 z-0 bg-gradient-to-b from-emerald-950/80 via-green-900/80 to-black/95" />
        </>
      )}


      <div className="relative z-10">

        {/* Hero Section */}
        <section className="relative flex items-start justify-center overflow-hidden py-8">

          <div className="relative z-10 text-center px-10 py-12 md:py-16 bg-white/20 backdrop-blur-2xl border border-white/40 rounded-[6rem] shadow-2xl max-w-5xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight drop-shadow-xl ">
              {t('about.heroTitle')} <span className="text-green-500">{t('about.heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-white leading-relaxed drop-shadow-lg font-medium max-w-3xl mx-auto">
              {t('about.heroText')}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className={`${embedded ? 'pt-12 pb-4' : 'py-12'} max-w-7xl mx-auto px-6`}>
          <div className="bg-white/20 backdrop-blur-2xl border border-white/40 p-12 rounded-[5rem] shadow-2xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-12">
                <div className="group">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl group-hover:scale-110 transition-transform">🎯</span>
                    <h2 className="text-4xl font-bold text-white drop-shadow-lg">{t('about.ourMission')}</h2>
                  </div>
                  <p className="text-white/90 leading-relaxed text-lg drop-shadow-md">
                    {t('about.missionText')}
                  </p>
                </div>
                <div className="group border-t border-white/10 pt-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl group-hover:scale-110 transition-transform">👁️</span>
                    <h2 className="text-4xl font-bold text-white drop-shadow-lg">{t('about.ourVision')}</h2>
                  </div>
                  <p className="text-white/90 leading-relaxed text-lg drop-shadow-md">
                    {t('about.visionText')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white/20">
                  <img
                    src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1000"
                    alt="Smart Farming"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-agri-green/10 mix-blend-multiply" />
                  <div className="absolute bottom-10 left-10 text-white">
                    <h3 className="text-4xl font-bold italic drop-shadow-xl">{t('about.smartFarming')}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!embedded && (
          <>

            {/* Why Choose Us */}
            <section className="py-12 bg-transparent">
              <div className="max-w-7xl mx-auto px-6">
                <div className="bg-white/20 backdrop-blur-2xl border border-white/40 p-12 rounded-[5rem] shadow-2xl flex flex-col gap-16">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-5xl font-black text-white mb-6 drop-shadow-xl">{t('about.whyChooseUs')}</h2>
                    <p className="text-white/90 text-xl drop-shadow-lg">{t('about.whyChooseSubtitle')}</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-12">
                    {[
                      { icon: '👥', title: t('about.easyBooking'), desc: t('about.easyBookingDesc') },
                      { icon: '✅', title: t('about.verifiedQuality'), desc: t('about.verifiedQualityDesc') },
                      { icon: '📍', title: t('about.transparentPricing'), desc: t('about.transparentPricingDesc') }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-md p-10 rounded-[3rem] shadow-xl border border-white/10 hover:bg-white/20 hover:-translate-y-2 transition-all duration-300 group text-center">
                        <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">{item.icon}</div>
                        <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">{item.title}</h3>
                        <p className="text-white/80 text-lg leading-relaxed drop-shadow-md">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}


      </div>
    </div>
  );
};

export default About;