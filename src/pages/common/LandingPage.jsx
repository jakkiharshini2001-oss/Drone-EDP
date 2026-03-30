import React from 'react';
import VideoSlider from '../../components/common/VideoSlider';
import Features from '../../components/common/Features';
import About from './About';
import Contact from './Contact';

const LandingPage = () => {
    return (
        <div className="pt-[72px]">
            <VideoSlider />
            <Features />
            <About embedded={true} />
            <Contact embedded={true} />
        </div>
    );
};

export default LandingPage;
