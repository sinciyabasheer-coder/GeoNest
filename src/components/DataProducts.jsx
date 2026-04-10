import { AlertTriangle, ArrowDownToLine, Coins, Droplets, Route, Users, Wind } from "lucide-react";
import SectionReveal from "./SectionReveal";

const datasets = [
  {
    title: "Population Data",
    description: "Demographic density surfaces for identifying demand centers and settlement pressure.",
    icon: Users,
  },
  {
    title: "Road Accessibility",
    description: "Connectivity and accessibility layers for evaluating movement corridors and travel reach.",
    icon: Route,
  },
  {
    title: "Land Cost",
    description: "Land valuation and affordability layers used to compare acquisition feasibility across sites.",
    icon: Coins,
  },
  {
    title: "Air Quality Index",
    description: "Environmental quality observations to support healthier location recommendations.",
    icon: Wind,
  },
  {
    title: "Water Quality",
    description: "Water condition datasets for screening service suitability and environmental reliability.",
    icon: Droplets,
  },
  {
    title: "Flood Risk",
    description: "Flood hazard and susceptibility layers for filtering vulnerable land from suitable zones.",
    icon: AlertTriangle,
  },
];

function DataProducts() {
  return (
    <SectionReveal id="data-products" className="content-section">
      <div className="section-shell">
        <div className="section-heading">
          <span className="eyebrow">Data & Products</span>
          <h2>Curated GIS-ready layers and planning products for suitability workflows.</h2>
          <p>
            Each dataset card represents a core input that can be combined into weighted suitability
            models, thematic dashboards, or downloadable project outputs.
          </p>
        </div>

        <div className="dataset-grid">
          {datasets.map(({ title, description, icon: Icon }) => (
            <article key={title} className="dataset-card">
              <div className="dataset-card__icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <a className="secondary-button" href="/" onClick={(event) => event.preventDefault()}>
                <ArrowDownToLine size={16} />
                Download
              </a>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

export default DataProducts;
