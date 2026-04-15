import { AlertTriangle, ArrowDownToLine, Coins, Droplets, Route, Users, Wind, FileSpreadsheet } from "lucide-react";
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
  
  const handleDownload = async (event, datasetId, format) => {
    event.preventDefault();
    try {
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
      const response = await fetch(`${API_BASE}/datasets/${datasetId}`);
      if (!response.ok) throw new Error("Dataset not ready");
      
      let blob;
      let filename;

      if (format === 'geojson') {
        blob = await response.blob();
        filename = `geonest_${datasetId}.geojson`;
      } else if (format === 'excel') {
        const jsonData = await response.json();
        const features = jsonData.features || [];
        
        if (features.length === 0) throw new Error("No data found");
        
        // Dynamically strip properties and create MS Excel compatible CSV
        const headers = Object.keys(features[0].properties);
        let csvContent = headers.join(",") + "\n";
        
        features.forEach(f => {
          const row = headers.map(header => {
            let val = f.properties[header];
            if (val === null || val === undefined) val = "";
            val = String(val).replace(/"/g, '""');
            if (val.includes(",") || val.includes("\n") || val.includes("\"")) {
              val = `"${val}"`;
            }
            return val;
          });
          csvContent += row.join(",") + "\n";
        });
        
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `geonest_${datasetId}.csv`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
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
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <a className="secondary-button" href="/" onClick={(event) => handleDownload(event, id, 'geojson')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem' }}>
                  <ArrowDownToLine size={15} />
                  GeoJSON
                </a>
                <a className="secondary-button" href="/" onClick={(event) => handleDownload(event, id, 'excel')} style={{ flex: 1, padding: '8px 4px', fontSize: '0.85rem' }}>
                  <FileSpreadsheet size={15} />
                  Excel (CSV)
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}

export default DataProducts;
