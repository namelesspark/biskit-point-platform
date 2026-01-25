// src/pages/DashboardPage.jsx
import React from 'react';
import DashboardHeader from '../components/common/Header/DashboardHeader';
import TapNavigation from '../components/dashboard/TabNavigation';
import UploadedSection from '../components/dashboard/UploadedSection';
import BookmarkSection from '../components/dashboard/BookmarkSection';
import TestimonialSection from '../components/dashboard/TestimonialSection';
import RankingSection from '../components/dashboard/RankingSection';
import Footer from '../components/common/Footer/Footer';

function DashboardPage() {  
  return (
    <div className="dashboard-page">
      <DashboardHeader />
      <div className="dashboard-content">
        <TapNavigation />
        <UploadedSection />
        <BookmarkSection />
        <TestimonialSection />
        <RankingSection />
      </div>
      <Footer />
    </div>
  );
}

export default DashboardPage;