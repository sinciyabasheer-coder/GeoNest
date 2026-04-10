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
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="app-shell">
      <Navbar items={navItems} onNavigate={scrollToSection} />
      <main>
        <Home onNavigate={scrollToSection} />
        <About />
        <FindYourSpace />
        <DataProducts />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
