import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  X,
  ChevronDown,
  Download,
  Filter,
  Info,
  LocateFixed,
  Map as MapIcon,
  RotateCcw,
} from "lucide-react";
import { LayersControl, MapContainer, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import SectionReveal from "./SectionReveal";
import { chennaiZones, criteriaLabels } from "../data/chennaiZones";

const chennaiCenter = [13.0827, 80.2707];

const purposeWeights = {
  Residential: {
    population: 0.2,
    roadAccessibility: 0.2,
    landCost: 0.2,
    airQuality: 0.15,
    waterQuality: 0.15,
    floodRisk: 0.1,
  },
  Commercial: {
    population: 0.3,
    roadAccessibility: 0.25,
    landCost: 0.2,
    airQuality: 0.1,
    waterQuality: 0.05,
    floodRisk: 0.1,
  },
  Industrial: {
    population: 0.1,
    roadAccessibility: 0.3,
    landCost: 0.25,
    airQuality: 0.15,
    waterQuality: 0.05,
    floodRisk: 0.15,
  },
  Institutional: {
    population: 0.25,
    roadAccessibility: 0.25,
    landCost: 0.15,
    airQuality: 0.15,
    waterQuality: 0.1,
    floodRisk: 0.1,
  },
  "Mixed-Use": {
    population: 0.25,
    roadAccessibility: 0.25,
    landCost: 0.2,
    airQuality: 0.1,
    waterQuality: 0.1,
    floodRisk: 0.1,
  },
  "Rental / Temporary Stay": {
    population: 0.3,
    roadAccessibility: 0.25,
    landCost: 0.2,
    airQuality: 0.1,
    waterQuality: 0.05,
    floodRisk: 0.1,
  },
  Recreational: {
    population: 0.1,
    roadAccessibility: 0.2,
    landCost: 0.15,
    airQuality: 0.25,
    waterQuality: 0.2,
    floodRisk: 0.1,
  },
};

const criteriaMeta = [
  {
    key: "population",
    label: "Population",
    tooltip: "Represents the concentration of people and likely urban demand intensity.",
  },
  {
    key: "roadAccessibility",
    label: "Road Accessibility",
    tooltip: "Measures access to major roads, transport corridors, and movement efficiency.",
  },
  {
    key: "landCost",
    label: "Land Cost",
    tooltip: "Reflects affordability and land acquisition feasibility for development.",
  },
  {
    key: "airQuality",
    label: "Air Quality",
    tooltip: "Indicates environmental comfort and health quality of the area.",
  },
  {
    key: "waterQuality",
    label: "Water Quality",
    tooltip: "Assesses the suitability and reliability of water conditions in the location.",
  },
  {
    key: "floodRisk",
    label: "Flood Risk",
    tooltip: "Captures flood exposure and resilience-related planning constraints.",
  },
];

const getCategory = (score) => {
  if (score >= 0.75) {
    return "High";
  }

  if (score >= 0.55) {
    return "Medium";
  }

  return "Low";
};

const suitabilityTone = (score) => {
  if (score >= 0.75) {
    return { color: "#22c55e", label: "High suitability" };
  }

  if (score >= 0.58) {
    return { color: "#f59e0b", label: "Moderate suitability" };
  }

  return { color: "#ef4444", label: "Low suitability" };
};

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const refreshMap = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    refreshMap();
    window.addEventListener("resize", refreshMap);

    return () => window.removeEventListener("resize", refreshMap);
  }, [map]);

  return null;
}

function FindYourSpace() {
  const [purpose, setPurpose] = useState("Residential");
  const [weights, setWeights] = useState(purposeWeights.Residential);
  const [result, setResult] = useState(null);
  const [isFloatingResultOpen, setIsFloatingResultOpen] = useState(true);

  useEffect(() => {
    setWeights(purposeWeights[purpose]);
    setResult(null);
    setIsFloatingResultOpen(true);
  }, [purpose]);

  const totalWeight = useMemo(
    () => criteriaMeta.reduce((total, criterion) => total + weights[criterion.key], 0),
    [weights]
  );

  const rankedZones = useMemo(
    () =>
      chennaiZones
        .map((zone) => {
          const score = criteriaMeta.reduce(
            (total, criterion) => total + zone.criteriaScores[criterion.key] * weights[criterion.key],
            0
          );

          return {
            ...zone,
            score,
            tone: suitabilityTone(score),
          };
        })
        .sort((first, second) => second.score - first.score),
    [weights]
  );

  const visibleZones = useMemo(() => rankedZones.filter((zone) => zone.score >= 0.55).slice(0, 4), [rankedZones]);
  const bestZone = visibleZones[0] ?? rankedZones[0];

  const handleWeightChange = (key, value) => {
    setWeights((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const resetWeights = () => {
    setWeights(purposeWeights[purpose]);
    setResult(null);
    setIsFloatingResultOpen(true);
  };

  const calculateSuitability = () => {
    setResult({
      score: bestZone.score,
      category: getCategory(bestZone.score),
      zone: bestZone.name,
    });
    setIsFloatingResultOpen(true);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("GeoNest Find Your Space Report", 40, 52);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Study area: Chennai", 40, 82);
    pdf.text(`Selected purpose: ${purpose}`, 40, 100);
    pdf.text(
      `Weights: ${criteriaMeta
        .map((criterion) => `${criteriaLabels[criterion.key]} ${weights[criterion.key].toFixed(2)}`)
        .join(" | ")}`,
      40,
      118,
      { maxWidth: 520 }
    );

    if (result) {
      pdf.text(`Calculated suitability score: ${result.score.toFixed(2)} (${result.category})`, 40, 146);
      pdf.text(`Best matching area: ${result.zone}`, 40, 164);
    }

    pdf.setFont("helvetica", "bold");
    pdf.text("Recommended suitable areas", 40, 204);

    let yPosition = 230;

    visibleZones.forEach((zone, index) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${zone.name}`, 40, yPosition);
      yPosition += 16;

      pdf.setFont("helvetica", "normal");
      pdf.text(`Suitability score: ${zone.score.toFixed(2)}`, 52, yPosition);
      yPosition += 16;
      pdf.text(`Suitability class: ${zone.tone.label}`, 52, yPosition);
      yPosition += 16;
      pdf.text(zone.summary, 52, yPosition, { maxWidth: 500 });
      yPosition += 28;
    });

    pdf.setFont("helvetica", "italic");
    pdf.text(
      "Note: Polygons are prototype suitability boundaries generated for demonstration.",
      40,
      yPosition + 12,
      { maxWidth: 520 }
    );

    pdf.save("geonest-find-your-space-report.pdf");
  };

  return (
    <SectionReveal id="find-your-space" className="content-section content-section--workspace">
      <div className="section-shell">
        <div className="section-heading workspace-section-heading">
          <span className="eyebrow">Find Your Space</span>
          <h2>Explore build-ready zones with weighted suitability criteria, layered maps, and boundary outputs.</h2>
          <p>
            Select a purpose, adjust the importance of each core criterion, calculate suitability,
            and inspect the delineated areas on an interactive Chennai map.
          </p>
        </div>

        <div className="workspace-layout">
          <aside className="workspace-panel-column">
            <div className="workspace-card workspace-card--dark">
              <div className="workspace-card__heading">
                <Filter size={18} />
                <h3>Analysis controls</h3>
              </div>

              <label className="field-group" htmlFor="buildType">
                <span>Select Purpose</span>
                <div className="select-wrap">
                  <select id="buildType" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                    {Object.keys(purposeWeights).map((purposeOption) => (
                      <option key={purposeOption} value={purposeOption}>
                        {purposeOption}
                      </option>
                    ))}
                  </select>
                  <span className="select-wrap__icon" aria-hidden="true">
                    <ChevronDown size={18} />
                  </span>
                </div>
              </label>

              <div className="search-card__meta">
                <span>Total weight: {totalWeight.toFixed(2)}</span>
                <span>Default weights update automatically when the purpose changes.</span>
              </div>

              <div className="slider-stack slider-stack--spacious">
                {criteriaMeta.map((criterion) => (
                  <div key={criterion.key} className="slider-card">
                    <div className="slider-card__top">
                      <div className="slider-card__label">
                        <span>{criterion.label}</span>
                        <div className="tooltip-wrap">
                          <Info size={15} />
                          <div className="tooltip-bubble">{criterion.tooltip}</div>
                        </div>
                      </div>
                      <strong>{weights[criterion.key].toFixed(2)}</strong>
                    </div>

                    <input
                      className="weight-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={weights[criterion.key]}
                      onChange={(event) => handleWeightChange(criterion.key, event.target.value)}
                      style={{ "--slider-fill": `${weights[criterion.key] * 100}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="search-actions">
                <button className="primary-button" type="button" onClick={calculateSuitability}>
                  Calculate Suitability
                </button>
                <button className="secondary-button" type="button" onClick={resetWeights}>
                  <RotateCcw size={16} />
                  Reset Weights
                </button>
              </div>

              <div className="workspace-actions">
                <button className="primary-button" type="button" onClick={downloadPdf}>
                  <Download size={16} />
                  Download PDF
                </button>
              </div>

              {result ? (
                <div className="result-card">
                  <span className="result-card__label">Suitability Result</span>
                  <div className="result-card__row">
                    <strong>{result.score.toFixed(2)}</strong>
                    <span className={`result-pill result-pill--${result.category.toLowerCase()}`}>
                      {result.category}
                    </span>
                  </div>
                  <p>
                    Best matching area: {result.zone}. The score is derived from normalized
                    criterion values combined with your selected weights for {purpose.toLowerCase()}.
                  </p>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="workspace-map-column">
            <div className="workspace-map-card">
              <div className="workspace-map-card__header">
                <div>
                  <h3>Interactive suitability map</h3>
                  <p>
                    Switch between OpenStreetMap and satellite view. Boundary polygons show the areas
                    that best match the selected purpose and weighted criteria.
                  </p>
                </div>

                <div className="map-legend">
                  <span className="info-chip">
                    <LocateFixed size={16} />
                    Chennai focus
                  </span>
                  <span><i style={{ background: "#22c55e" }} /> High</span>
                  <span><i style={{ background: "#f59e0b" }} /> Moderate</span>
                  <span><i style={{ background: "#ef4444" }} /> Low</span>
                </div>
              </div>

              <div className="workspace-map-frame">
                <div className="workspace-map-shell">
                  <MapContainer
                    center={chennaiCenter}
                    zoom={11}
                    scrollWheelZoom
                    className="workspace-map"
                    style={{ height: "100%", width: "100%" }}
                  >
                    <MapResizeHandler />
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                          attribution="Tiles &copy; Esri"
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                      </LayersControl.BaseLayer>

                      {visibleZones.map((zone) => (
                        <LayersControl.Overlay key={zone.id} checked name={zone.name}>
                          <Polygon
                            positions={zone.polygon}
                            pathOptions={{
                              color: zone.tone.color,
                              fillColor: zone.tone.color,
                              fillOpacity: 0.3,
                              weight: 3,
                            }}
                          >
                            <Popup>
                              <strong>{zone.name}</strong>
                              <br />
                              Suitability: {zone.score.toFixed(2)}
                              <br />
                              {zone.summary}
                            </Popup>
                          </Polygon>
                        </LayersControl.Overlay>
                      ))}
                    </LayersControl>
                  </MapContainer>
                </div>
              </div>

              <div className="workspace-map-card__footer">
                <MapIcon size={16} />
                <span>Prototype delineation based on selected weights and sample urban suitability layers.</span>
              </div>
            </div>
          </div>
        </div>

        {isFloatingResultOpen ? (
          <div className="floating-result-box">
            <button
              className="floating-result-box__close"
              type="button"
              aria-label="Close top suitable area panel"
              onClick={() => setIsFloatingResultOpen(false)}
            >
              <X size={16} />
            </button>
            <span className="floating-result-box__label">Top Suitable Area</span>
            <strong>{result?.zone ?? bestZone.name}</strong>
            <div className="floating-result-box__meta">
              <span>{(result?.score ?? bestZone.score).toFixed(2)}</span>
              <span className={`result-pill result-pill--${(result?.category ?? getCategory(bestZone.score)).toLowerCase()}`}>
                {result?.category ?? getCategory(bestZone.score)}
              </span>
            </div>
            <p>{bestZone.summary}</p>
            <p className="workspace-muted">Current focus: {purpose}</p>
          </div>
        ) : null}
      </div>
    </SectionReveal>
  );
}

export default FindYourSpace;
