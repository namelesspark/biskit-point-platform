// src/pages/HomePage.jsx
import React from 'react';
import MainHeader from '../components/common/Header/MainHeader';
import HeroSection from '../components/home/HeroSection';
import AboutSection from '../components/home/AboutSection';
import FeatureSection from '../components/home/FeatureSection';
import Footer from '../components/common/Footer/Footer';

function HomePage() {
  return (
    <div className="home-page">
      <MainHeader />
      <HeroSection />
      <AboutSection />
      <FeatureSection />
      <Footer />
    </div>
  );
}

export default HomePage;