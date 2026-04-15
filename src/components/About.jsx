import { DatabaseZap, Globe2, MapPinned, Waypoints } from "lucide-react";
import SectionReveal from "./SectionReveal";

const features = [
  {
    title: "Smart Location Analysis",
    description:
      "Identify urban parcels with stronger development potential by screening demographic, mobility, and environmental indicators together.",
    icon: MapPinned,
  },
  {
    title: "Multi-Criteria Evaluation",
    description:
      "Combine weighted factors such as population, traffic, road access, and climate conditions to support transparent ranking decisions.",
    icon: Waypoints,
  },
  {
    title: "Real-Time Data Integration",
    description:
      "Design the platform to absorb dynamic datasets and refresh planning assumptions as city conditions evolve.",
    icon: DatabaseZap,
  },
  {
    title: "User-Friendly Web GIS",
    description:
      "Translate complex GIS outputs into an accessible interface for planners, researchers, and decision-makers.",
    icon: Globe2,
  },
];

function About() {
  return (
    <SectionReveal id="about" className="content-section">
      <div className="section-shell">
        <div className="section-heading">
          <span className="eyebrow">About GeoNest</span>
          <h2>Purpose-built for urban suitability analysis and informed geospatial decisions.</h2>
        </div>

        <div className="about-layout">
          <div className="about-copy">
            <p>
              GeoNest is a conceptual Web GIS platform designed to help users discover ideal urban
              locations for residential, commercial, healthcare, and rental development. It brings
              together essential land suitability indicators into a single digital workspace where
              planners can compare options quickly and consistently.
            </p>
            <p>
              Urban land suitability analysis matters because land decisions shape long-term access,
              livability, investment value, and environmental resilience. By evaluating how
              different criteria interact across space, the platform supports better outcomes than
              relying on intuition or isolated datasets.
            </p>
            <p>
              GIS plays the core decision-making role by connecting datasets to geography. It helps
              reveal patterns, trade-offs, and high-potential zones through spatial analysis,
              allowing stakeholders to prioritize locations with stronger evidence and clearer
              justification.
            </p>
          </div>

          <div className="feature-grid">
            {features.map(({ title, description, icon: Icon }) => (
              <article key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

export default About;
