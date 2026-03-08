import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SpeedComparison from "@/components/SpeedComparison";
import UseCases from "@/components/UseCases";
import Features from "@/components/Features";
import Integrations from "@/components/Integrations";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <SpeedComparison />
        <Features />
        <UseCases />
        <Integrations />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
