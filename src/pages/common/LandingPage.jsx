import React from 'react';
import VideoSlider from '../../components/common/VideoSlider';
import Features from '../../components/common/Features';
import About from './About';
import Contact from './Contact';
import ScrollReveal from '../../components/common/ScrollReveal';

const LandingPage = () => {
    return (
        <div className="pt-[72px] min-h-screen relative overflow-hidden bg-emerald-950">
            {/* Thematic Drone/Village Background */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80')` }}
            />
            {/* Deep gradient overlay for text readability */}
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-emerald-950/80 via-green-900/80 to-black/95" />

            <div className="relative z-10 w-full h-full">
                {/* The Video Slider (Hero component) typically shouldn't have a scroll delay since it's the very first thing they see */}
                <VideoSlider />
                
                <ScrollReveal>
                    <Features />
                </ScrollReveal>
                
                <ScrollReveal>
                    <div className="py-8">
                        <About embedded={true} />
                    </div>
                </ScrollReveal>
                
                <ScrollReveal>
                    <div className="py-8 border-t border-white/10">
                        <Contact embedded={true} />
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default LandingPage;
