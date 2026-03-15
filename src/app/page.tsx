import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustedBy from "@/components/TrustedBy";
import SpeedComparison from "@/components/SpeedComparison";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import Comparison from "@/components/Comparison";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Integrations from "@/components/Integrations";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <SpeedComparison />
        <Features />
        <HowItWorks />
        <UseCases />
        <Comparison />
        <Pricing />
        <Testimonials />
        <Integrations />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
