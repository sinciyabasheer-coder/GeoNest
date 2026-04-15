import { AlertTriangle, ArrowDownToLine, Coins, Droplets, Route, Users, Wind } from "lucide-react";
import SectionReveal from "./SectionReveal";

const datasets = [
  {
    id: "population",
    title: "Population Data",
    description: "Demographic density surfaces for identifying demand centers and settlement pressure.",
    icon: Users,
  },
  {
    id: "roads",
    title: "Road Accessibility",
    description: "Connectivity and accessibility layers for evaluating movement corridors and travel reach.",
    icon: Route,
  },
  {
    id: "land-cost",
    title: "Land Cost",
    description: "Land valuation and affordability layers used to compare acquisition feasibility across sites.",
    icon: Coins,
  },
  {
    id: "aqi",
    title: "Air Quality Index",
    description: "Environmental quality observations to support healthier location recommendations.",
    icon: Wind,
  },
  {
    id: "water",
    title: "Water Quality",
    description: "Water condition datasets for screening service suitability and environmental reliability.",
    icon: Droplets,
  },
  {
    id: "flood",
    title: "Flood Risk",
    description: "Flood hazard and susceptibility layers for filtering vulnerable land from suitable zones.",
    icon: AlertTriangle,
  },
];

function DataProducts() {
  
  // Triggers a real browser download from our Node.js Backend 
  const handleDownload = async (event, datasetId) => {
    event.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/datasets/${datasetId}`);
      if (!response.ok) throw new Error("Dataset not ready");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `geonest_${datasetId}.geojson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error downloading dataset. Ensure backend is running!");
      console.error(error);
    }
  };

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
          {datasets.map(({ id, title, description, icon: Icon }) => (
            <article key={id} className="dataset-card">
              <div className="dataset-card__icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <a className="secondary-button" href="/" onClick={(event) => handleDownload(event, id)}>
                <ArrowDownToLine size={16} />
                Download GeoJSON
              </a>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

export default DataProducts;
