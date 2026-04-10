import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

function Navbar({ items, onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  return (
    <header className={`site-header ${isScrolled ? "site-header--solid" : ""}`}>
      <div className="site-header__inner">
        <button className="brand" type="button" onClick={() => handleNavigate("home")}>
          <img className="brand__logo" src="/geonest-logo.svg" alt="GeoNest logo" />
          <span className="brand__text">
            <strong>GeoNest</strong>
            <small>Urban Land Suitability Assessment System</small>
          </span>
        </button>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {items.map((item) => (
            <button key={item.id} type="button" className="nav-link" onClick={() => handleNavigate(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isMenuOpen ? (
        <nav id="mobile-nav" className="mobile-nav mobile-nav--open" aria-label="Mobile navigation">
          {items.map((item) => (
            <button key={item.id} type="button" className="nav-link" onClick={() => handleNavigate(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export default Navbar;
