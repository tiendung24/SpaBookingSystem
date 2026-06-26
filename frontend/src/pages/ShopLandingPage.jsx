
import TopNavBar from '../components/shop/TopNavBar';
import HeroSection from '../components/shop/HeroSection';
import ProblemSection from '../components/shop/ProblemSection';
import FeaturesSection from '../components/shop/FeaturesSection';
import PricingSection from '../components/shop/PricingSection';
import CTASection from '../components/shop/CTASection';
import Footer from '../components/shop/Footer';

export default function ShopLandingPage() {
  return (
    <div className="min-h-screen bg-white text-main selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopNavBar />
      <main className="pt-20">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

