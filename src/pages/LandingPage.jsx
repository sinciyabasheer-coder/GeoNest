import { ArrowRight } from "lucide-react";

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="section-shell landing-hero__grid landing-hero__grid--single">
          <div className="landing-copy">
            <span className="eyebrow">Chennai Urban Suitability Intelligence</span>
            <div className="hero-brand-lockup">
              <img className="hero-brand-lockup__logo" src="/geonest-logo.svg" alt="GeoNest logo" />
              <div className="hero-brand-lockup__text">
                <span>GeoNest</span>
                <small>Urban Land Suitability Assessment System</small>
              </div>
            </div>
            <h1>Find suitable land across Chennai with a focused Web GIS workspace.</h1>
            <p className="hero-copy__lead">
              GeoNest helps evaluate where to build in Chennai by combining spatial criteria such as
              population, road accessibility, land cost, air quality, water quality, and flood risk
              into a map-based decision interface.
            </p>

            <div className="hero-actions">
              <a
                className="primary-button"
                href="/workspace"
                target="_blank"
                rel="noreferrer"
              >
                Find Your Space
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
