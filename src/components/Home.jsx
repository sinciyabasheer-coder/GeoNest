import { ArrowRight } from "lucide-react";
import SectionReveal from "./SectionReveal";

function Home() {
  return (
    <SectionReveal id="home" className="hero-section">
      <div className="section-shell hero-grid hero-grid--intro">
        <div className="hero-copy hero-copy--intro">
          <span className="eyebrow">Geospatial Intelligence for Better Urban Decisions</span>
          <div className="hero-brand-lockup">
            <img className="hero-brand-lockup__logo" src="/geonest-logo.svg" alt="GeoNest logo" />
            <div className="hero-brand-lockup__text">
              <span>GeoNest</span>
              <small>Urban Land Suitability Assessment System</small>
            </div>
          </div>
          <h1>GeoNest: Smart Urban Land Suitability Platform</h1>
          <p className="hero-copy__lead">
            Evaluate land potential with GIS-driven suitability layers, environmental indicators,
            and infrastructure signals tailored for urban planning and smart site selection.
          </p>

          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: '3rem' }}>
            <a 
              className="primary-button" 
              href="/app" 
              target="_blank" 
              style={{ fontSize: '1.25rem', padding: '1rem 2.5rem', minHeight: '4.5rem', borderRadius: '100px', boxShadow: '0 20px 40px rgba(45, 212, 191, 0.4)' }}
            >
              Find Your Space
              <ArrowRight size={24} />
            </a>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

export default Home;
