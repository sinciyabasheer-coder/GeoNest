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
import { LayersControl, MapContainer, Polygon, GeoJSON, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import axios from "axios";
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

// Spies on layer toggles so we can render dynamic legends
function MapEventHandler({ setActiveLayers }) {
  useMapEvents({
    overlayadd(e) {
      setActiveLayers((prev) => new Set([...prev, e.name]));
    },
    overlayremove(e) {
      setActiveLayers((prev) => {
        const updated = new Set(prev);
        updated.delete(e.name);
        return updated;
      });
    },
  });
  return null;
}

function FindYourSpace() {
  const [purpose, setPurpose] = useState("Residential");
  const [weights, setWeights] = useState(purposeWeights.Residential);
  const [result, setResult] = useState(null);
  const [isFloatingResultOpen, setIsFloatingResultOpen] = useState(true);
  const [activeLayers, setActiveLayers] = useState(new Set());
  const defaultRankedZones = useMemo(() => {
    // We instantiate a default fallback view until the backend generates the true spatial overlay
    return chennaiZones.map(zone => {
      // Create a default initial score simply to prevent UI crashes before calculation
      const initialScore = criteriaMeta.reduce((t, c) => t + (zone.criteriaScores[c.key] * (1/6)), 0);
      return {
        ...zone,
        score: initialScore,
        tone: suitabilityTone(initialScore)
      };
    }).sort((a, b) => b.score - a.score);
  }, []);

  const [rankedZones, setRankedZones] = useState(defaultRankedZones);
  const [isComputing, setIsComputing] = useState(false);

  // --- BACKEND INTEGRATION STATE ---
  const [apiData, setApiData] = useState({
    population: null,
    roads: null,
    aqi: null,
    landCost: null,
    water: null,
    flood: null
  });

  // Fetch all GIS datasets from our Node.js Backend smoothly on component mount
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const baseURL = "http://localhost:3000/api/datasets";
        
        // Fetch sequentially or in parallel; parallel is faster
        const [popRes, roadRes, aqiRes, landRes, waterRes, floodRes] = await Promise.all([
          axios.get(`${baseURL}/population`).catch(() => ({ data: null })),
          axios.get(`${baseURL}/roads`).catch(() => ({ data: null })),
          axios.get(`${baseURL}/aqi`).catch(() => ({ data: null })),
          axios.get(`${baseURL}/land-cost`).catch(() => ({ data: null })),
          axios.get(`${baseURL}/water`).catch(() => ({ data: null })),
          axios.get(`${baseURL}/flood`).catch(() => ({ data: null }))
        ]);

        setApiData({
          population: popRes.data,
          roads: roadRes.data,
          aqi: aqiRes.data,
          landCost: landRes.data,
          water: waterRes.data,
          flood: floodRes.data
        });
        
        console.log("Successfully loaded simulated GIS APIs:", popRes.data, roadRes.data);
      } catch (err) {
        console.error("Backend offline or failed to fetch GIS data:", err);
      }
    };
    
    fetchBackendData();
  }, []);

  useEffect(() => {
    setWeights(purposeWeights[purpose]);
    setResult(null);
    setIsFloatingResultOpen(true);
  }, [purpose]);

  const totalWeight = useMemo(
    () => criteriaMeta.reduce((total, criterion) => total + weights[criterion.key], 0),
    [weights]
  );

  // Remove the old synchronous useMemo for rankedZones.
  // The map and results will now mathematically rely on the Backend API!

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

  const calculateSuitability = async () => {
    setIsComputing(true);
    try {
      // POST the dynamic weights matrix to the advanced backend Spatial Engine
      const res = await axios.post("http://localhost:3000/api/suitability/calculate", {
        weights: weights
      });

      if (res.data.zones) {
        // Map backend scores back into UI Tone logic
        const formattedZones = res.data.zones.map(z => ({
          ...z,
          tone: suitabilityTone(z.score)
        }));
        setRankedZones(formattedZones);
        
        // Update popup result UI
        const newBest = formattedZones[0];
        setResult({
          score: newBest.score,
          category: getCategory(newBest.score),
          zone: newBest.name,
        });
        setIsFloatingResultOpen(true);
      }
    } catch (err) {
      alert("Error: Ensure your Node backend server is running offline!");
      console.error(err);
    } finally {
      setIsComputing(false);
    }
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
                <button className="primary-button" type="button" onClick={calculateSuitability} disabled={isComputing}>
                  {isComputing ? 'Calculating Spatial Overlays...' : 'Calculate Suitability'}
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
                
                {/* Dynamically expanding Legend System for Layer checking */}
                {activeLayers.has("☁️ Live Data: AQI Suitability Hex-Grid") && (
                  <div className="map-legend map-legend--dynamic" style={{ marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                    <span className="info-chip">Air Quality Suitability</span>
                    <span><i style={{ background: "#22c55e", opacity: 0.8 }} /> Excellent</span>
                    <span><i style={{ background: "#84cc16", opacity: 0.8 }} /> Good</span>
                    <span><i style={{ background: "#f59e0b", opacity: 0.8 }} /> Satisfactory</span>
                    <span><i style={{ background: "#ef4444", opacity: 0.8 }} /> Moderate/Poor</span>
                    <span><i style={{ background: "#b91c1c", opacity: 0.8 }} /> Unhealthy</span>
                  </div>
                )}
                
                {activeLayers.has("☁️ Live Data: CGWB Water Quality") && (
                  <div className="map-legend map-legend--dynamic" style={{ marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                    <span className="info-chip">Water Salinity (TDS)</span>
                    <span><i style={{ background: "#0ea5e9", opacity: 0.8, borderRadius: "50%" }} /> Fresh Recharge</span>
                    <span><i style={{ background: "#ef4444", opacity: 0.8, borderRadius: "50%" }} /> Saline / Hard Water</span>
                  </div>
                )}
                
                {activeLayers.has("☁️ Live Data: Flood Risk Hotspots") && (
                  <div className="map-legend map-legend--dynamic" style={{ marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                    <span className="info-chip">Stagnation Risk</span>
                    <span><i style={{ background: "#1e3a8a", opacity: 0.8, borderRadius: "50%" }} /> Low Risk</span>
                    <span><i style={{ background: "#93c5fd", opacity: 0.8, borderRadius: "50%" }} /> Frequent Logging</span>
                  </div>
                )}
                
                {activeLayers.has("☁️ Live Data: Road Accessibility Network") && (
                  <div className="map-legend map-legend--dynamic" style={{ marginTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                    <span className="info-chip">Road Network Accessibility</span>
                    <span><i style={{ background: "#22c55e", height: "3px", width: "16px", borderRadius: "1px", position: "relative", top: "-2px" }} /> High Connectivity</span>
                    <span><i style={{ background: "#f59e0b", height: "3px", width: "16px", borderRadius: "1px", position: "relative", top: "-2px" }} /> Moderate Connectivity</span>
                  </div>
                )}

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
                    <MapEventHandler setActiveLayers={setActiveLayers} />
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

                      {/* Dynamic API Layers injected perfectly from the Backend Server */}
                      {apiData.population && (
                        <LayersControl.Overlay name="☁️ Live Data: Population Density Nodes">
                          <GeoJSON 
                            data={apiData.population} 
                            pointToLayer={(feature, latlng) => {
                               // Make it a beautiful red circle marker
                               return window.L.circleMarker(latlng, {
                                 radius: 8,
                                 fillColor: "#ef4444",
                                 color: "#b91c1c",
                                 weight: 2,
                                 opacity: 1,
                                 fillOpacity: 0.7
                               }).bindPopup(`<strong>${feature.properties.microZoneName}</strong><br/>Category: ${feature.properties.demandCategory}<br/>Projected Population: ${feature.properties.projectedPopulation}`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}

                      {apiData.roads && (
                        <LayersControl.Overlay name="☁️ Live Data: Road Accessibility Network">
                          <GeoJSON 
                            data={apiData.roads} 
                            style={(feature) => ({
                              color: feature.properties.accessibilityScore > 85 ? "#22c55e" : "#f59e0b",
                              weight: feature.properties.accessibilityScore > 85 ? 4 : 2,
                              opacity: 0.8
                            })}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>Class: ${feature.properties.roadClass}<br/>Score: ${feature.properties.accessibilityScore}`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}

                      {apiData.aqi && (
                        <LayersControl.Overlay name="☁️ Live Data: AQI Suitability Hex-Grid">
                          <GeoJSON 
                            data={apiData.aqi} 
                            style={(feature) => {
                              // Color code based on Suitability 1-5
                              const colors = ["#b91c1c", "#ef4444", "#f59e0b", "#84cc16", "#22c55e"];
                              return {
                                color: colors[feature.properties.suitabilityScore - 1] || "#888",
                                weight: 1,
                                fillOpacity: 0.4
                              };
                            }}
                            onEachFeature={(feature, layer) => {
                              layer.bindPopup(`<strong>AQI Simulated Region</strong><br/>Air Quality: ${feature.properties.simulatedAqiRange}<br/>Suitability Score: ${feature.properties.suitabilityScore}/5`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}

                      {apiData.landCost && (
                        <LayersControl.Overlay name="☁️ Live Data: Land Cost Points">
                          <GeoJSON 
                            data={apiData.landCost} 
                            pointToLayer={(feature, latlng) => {
                               return window.L.circleMarker(latlng, {
                                 radius: 6,
                                 fillColor: "#3b82f6",
                                 color: "#1d4ed8",
                                 weight: 2,
                                 fillOpacity: 0.8
                               }).bindPopup(`<strong>Micro-Market</strong><br/>Anchored to: ${feature.properties.closestAnchor}<br/>Price: ${feature.properties.priceFormatted} per sq.ft <br/>Suitability: ${feature.properties.suitabilityScore}/5`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}

                      {apiData.water && (
                        <LayersControl.Overlay name="☁️ Live Data: CGWB Water Quality">
                          <GeoJSON 
                            data={apiData.water} 
                            pointToLayer={(feature, latlng) => {
                               return window.L.circleMarker(latlng, {
                                 radius: 7,
                                 fillColor: feature.properties.suitabilityScore < 3 ? "#ef4444" : "#0ea5e9",
                                 color: "#fff",
                                 weight: 2,
                                 fillOpacity: 0.9
                               }).bindPopup(`<strong>CGWB Observation Point</strong><br/>TDS: ${feature.properties.totalDissolvedSolids_mgL} mg/L<br/>Quality: ${feature.properties.qualityCategory}`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}

                      {apiData.flood && (
                        <LayersControl.Overlay name="☁️ Live Data: Flood Risk Hotspots">
                          <GeoJSON 
                            data={apiData.flood} 
                            pointToLayer={(feature, latlng) => {
                               return window.L.circleMarker(latlng, {
                                 radius: 5,
                                 fillColor: feature.properties.suitabilityScore < 3 ? "#93c5fd" : "#1e40af",
                                 color: "#1e3a8a",
                                 weight: 1,
                                 fillOpacity: 0.8
                               }).bindPopup(`<strong>Reported Stagnation</strong><br/>Risk: ${feature.properties.riskLevel}<br/>History: ${feature.properties.historicalStagnation}`);
                            }}
                          />
                        </LayersControl.Overlay>
                      )}
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
            <strong>{result?.zone ?? bestZone?.name ?? "Calculating..."}</strong>
            <div className="floating-result-box__meta">
              <span>{(result?.score ?? bestZone?.score ?? 0).toFixed(2)}</span>
              <span className={`result-pill result-pill--${(result?.category ?? getCategory(bestZone?.score ?? 0)).toLowerCase()}`}>
                {result?.category ?? getCategory(bestZone?.score ?? 0)}
              </span>
            </div>
            <p>{bestZone?.summary}</p>
            <p className="workspace-muted">Current focus: {purpose}</p>
          </div>
        ) : null}
      </div>
    </SectionReveal>
  );
}

export default FindYourSpace;
