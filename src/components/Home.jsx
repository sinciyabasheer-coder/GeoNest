import { ArrowRight, CheckCircle2, Layers3, LocateFixed } from "lucide-react";
import SectionReveal from "./SectionReveal";

function Home({ onNavigate }) {
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

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate("find-your-space")}>
              Find Ideal Location
              <ArrowRight size={18} />
            </button>
            <div className="hero-stat">
              <CheckCircle2 size={18} />
              <span>Decision-support workflow available in the Find Your Space section.</span>
            </div>
          </div>

          <div className="hero-highlights">
            <div className="info-chip">
              <Layers3 size={18} />
              <span>Multi-criteria urban suitability analysis</span>
            </div>
            <div className="info-chip">
              <LocateFixed size={18} />
              <span>Map-based planning for professional GIS workflows</span>
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

export default Home;
