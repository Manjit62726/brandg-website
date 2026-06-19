import Nav from "@/components/Nav";
import LogoEditorAdvanced from "@/components/logo-maker/LogoEditorAdvanced";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import RevealObserver from "@/components/RevealObserver";

export default function LogoMakerPage() {
  return (
    <>
      <Nav />
      <LogoEditorAdvanced />
      <Footer />
      <BackToTop />
      <style>{`
        .nav-links { flex-direction: row !important; flex-wrap: nowrap !important; gap: 2px !important; }
      `}</style>
    </>
  );
}
