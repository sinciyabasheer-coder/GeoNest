import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import FindYourSpace from "./components/FindYourSpace";
import DataProducts from "./components/DataProducts";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "find-your-space", label: "Find Your Space" },
  { id: "data-products", label: "Data & Products" },
  { id: "contact", label: "Contact" },
];

function App() {
  const scrollToSection = (sectionId) => {
    if (sectionId === "find-your-space") {
      window.open("/app", "_blank");
      return;
    }
    
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className="app-shell">
          <Navbar items={navItems} onNavigate={scrollToSection} />
          <main>
            <Home />
            <About />
            <DataProducts />
            <Contact />
          </main>
          <Footer />
        </div>
      } />
      <Route path="/app" element={<FindYourSpace />} />
    </Routes>
  );
}

export default App;
