import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import LogoMaker from "@/components/LogoMaker";
import Process from "@/components/Process";
import Clients from "@/components/Clients";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import RevealObserver from "@/components/RevealObserver";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <About />
      <Services />
      <LogoMaker />
      <Process />
      <Clients />
      <Team />
      <Contact />
      <Footer />
      <BackToTop />
      <RevealObserver />
    </>
  );
}
