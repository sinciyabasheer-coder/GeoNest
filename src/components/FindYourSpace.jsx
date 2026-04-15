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
import { LayersControl, MapContainer, Polygon, GeoJSON, Popup, TileLayer, useMap, useMapEvents, LayerGroup } from "react-leaflet";
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
  if (score >= 0.80) return "Excellent";
  if (score >= 0.70) return "Good";
  if (score >= 0.60) return "Moderate";
  if (score >= 0.50) return "Fair";
  return "Poor";
};

const suitabilityTone = (score) => {
  if (score >= 0.80) return { color: "#22c55e", label: "Excellent Suitability" }; // Green
  if (score >= 0.70) return { color: "#84cc16", label: "Good Suitability" };      // Yellow-Green
  if (score >= 0.60) return { color: "#f59e0b", label: "Moderate Suitability" };  // Orange
  if (score >= 0.50) return { color: "#f97316", label: "Fair Suitability" };      // Dark Orange
  return { color: "#ef4444", label: "Poor Suitability" };                         // Red
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
  const [rankedZones, setRankedZones] = useState([]);
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

  const bestZone = rankedZones[0] ?? null;

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

      if (res.data.zones && res.data.zones.length > 0) {
        // Map backend scores back into UI Tone logic
        const formattedZones = res.data.zones.map(z => ({
          ...z,
          tone: suitabilityTone(z.score)
        }));
        setRankedZones(formattedZones);
        
        // Reverse Geocode Top 3 to get localized Neighborhood place names (zoom=14)
        const top3 = formattedZones.slice(0, 3);
        const namePromises = top3.map(z => 
           axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${z.coordinates.lat}&lon=${z.coordinates.lng}&zoom=14`)
             .then(r => r.data.display_name ? r.data.display_name.split(',').slice(0, 3).join(',') : z.name)
             .catch(() => z.name)
        );
        const resolvedNames = await Promise.all(namePromises);
        
        top3.forEach((z, i) => z.resolvedName = resolvedNames[i]);
        
        // Update popup result UI
        const newBest = top3[0];
        setResult({
          score: newBest.score,
          category: getCategory(newBest.score),
          zone: newBest.resolvedName,
          coordinates: newBest.coordinates,
          runnerUps: top3.slice(1)
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

  const getBase64ImageFromUrl = async (imageUrl) => {
    const res = await axios.get(imageUrl, { responseType: 'blob' });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(res.data);
    });
  };

  const downloadPdf = async () => {
    setIsComputing(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      pdf.setFillColor(30, 41, 59); // dark slate
      pdf.rect(0, 0, 595, 80, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text("GeoNest Suitability Report", 40, 50);

      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, 420, 110);

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Analysis Parameters", 40, 110);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(40, 120, 555, 120);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Target Purpose:`, 40, 140);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${purpose}`, 140, 140);

      let yPos = 160;
      pdf.setFont("helvetica", "normal");
      pdf.text("Criterion Weights:", 40, yPos);
      yPos += 20;

      const weightString = criteriaMeta
          .map((c) => `${criteriaLabels[c.key]}: ${weights[c.key].toFixed(2)}`)
          .join("  |  ");
      
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      const splitWeights = pdf.splitTextToSize(weightString, 515);
      pdf.text(splitWeights, 40, yPos);
      yPos += splitWeights.length * 15 + 20;

      if (result) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(40, yPos, 555, yPos);
        yPos += 25;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(20, 83, 45); // dark green
        pdf.text("Top Recommended Location", 40, yPos);
        yPos += 25;

        pdf.setFontSize(12);
        pdf.setTextColor(50, 50, 50);
        
        pdf.setFont("helvetica", "bold");
        pdf.text("Area Name:", 40, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${result.zone}`, 120, yPos, { maxWidth: 400 });
        yPos += 20;

        pdf.setFont("helvetica", "bold");
        pdf.text("Coordinates:", 40, yPos);
        pdf.setFont("helvetica", "normal");
        if (result.coordinates) {
          pdf.text(`${result.coordinates.lat.toFixed(4)}, ${result.coordinates.lng.toFixed(4)}`, 120, yPos);
        }
        yPos += 20;

        pdf.setFont("helvetica", "bold");
        pdf.text("Final Score:", 40, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${result.score.toFixed(2)} / 1.00  (${result.category})`, 120, yPos);
        yPos += 30;
      }

      pdf.setDrawColor(200, 200, 200);
      pdf.line(40, yPos, 555, yPos);
      yPos += 25;

      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Alternative Suitable Zones", 40, yPos);
      yPos += 25;

      if (result && result.runnerUps) {
        result.runnerUps.forEach((zone, index) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.text(`#${index + 2}: ${zone.resolvedName || zone.name}`, 40, yPos, { maxWidth: 500 });
          yPos += 15;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.text(`Score: ${zone.score.toFixed(2)} | Class: ${zone.tone.label}`, 55, yPos);
          yPos += 20;
        });
      }

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Generated by GeoNest Spatial Engine - Dynamic GIS Interpolation Framework", 40, yPos + 30);

      pdf.save("geonest-find-your-space-report.pdf");
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="app-dashboard-layout">
      {/* ------------------------ LEFT PANEL ------------------------ */}
      <aside className="dashboard-panel dashboard-panel--left" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="workspace-card__heading" style={{ marginBottom: "1rem" }}>
          <Filter size={20} />
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Analysis Controls</h2>
        </div>

        <label className="field-group" htmlFor="buildType">
          <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>Select Purpose</span>
          <div className="select-wrap" style={{ marginBottom: "0.5rem" }}>
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

        <div className="search-card__meta" style={{ marginBottom: "1rem" }}>
          <span>Total weight: {totalWeight.toFixed(2)}</span>
        </div>

        <div className="slider-stack slider-stack--spacious" style={{ flexGrow: 1, overflowY: "auto", paddingRight: "0.5rem", marginBottom: "1rem" }}>
          {criteriaMeta.map((criterion) => (
            <div key={criterion.key} className="slider-card" style={{ marginBottom: "0.75rem" }}>
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

        <div className="search-actions" style={{ marginTop: "auto", gap: "0.75rem" }}>
          <button className="primary-button" type="button" onClick={calculateSuitability} disabled={isComputing} style={{ width: "100%", justifyContent: "center" }}>
            {isComputing ? 'Calculating...' : 'Calculate Suitability'}
          </button>
          <button className="secondary-button" type="button" onClick={resetWeights} style={{ width: "100%", justifyContent: "center" }}>
            <RotateCcw size={16} />
            Reset Weights
          </button>
        </div>
      </aside>

      {/* ------------------------ CENTER PANEL ------------------------ */}
      <main className="dashboard-panel dashboard-panel--center">
        <MapContainer
          center={chennaiCenter}
          zoom={11}
          scrollWheelZoom
          className="workspace-map"
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <MapResizeHandler />
          <MapEventHandler setActiveLayers={setActiveLayers} />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {rankedZones.length > 0 && (
              <LayersControl.Overlay checked name="Suitability Heatmap Grid">
                <LayerGroup>
                  {rankedZones.map((zone) => (
                    <Polygon
                      key={zone.id}
                      positions={zone.polygon}
                      pathOptions={{
                        color: zone.tone.color,
                        fillColor: zone.tone.color,
                        fillOpacity: 0.4,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        <strong>{zone.resolvedName || zone.name}</strong><br />
                        Suitability: {zone.score.toFixed(2)}
                      </Popup>
                    </Polygon>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>
            )}

            {apiData.population && (
              <LayersControl.Overlay name="☁️ Data: Population Density Nodes">
                <GeoJSON 
                  data={apiData.population} 
                  pointToLayer={(feature, latlng) => {
                     return window.L.circleMarker(latlng, {
                       radius: 8, fillColor: "#ef4444", color: "#b91c1c", weight: 2, fillOpacity: 0.7
                     }).bindPopup(`<strong>${feature.properties.microZoneName}</strong><br/>Pop: ${feature.properties.projectedPopulation}`);
                  }}
                />
              </LayersControl.Overlay>
            )}

            {apiData.roads && (
              <LayersControl.Overlay name="☁️ Data: Road Accessibility Network">
                <GeoJSON 
                  data={apiData.roads} 
                  style={(feature) => ({
                    color: feature.properties.accessibilityScore > 85 ? "#22c55e" : "#f59e0b",
                    weight: feature.properties.accessibilityScore > 85 ? 4 : 2,
                    opacity: 0.8
                  })}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`<strong>${feature.properties.name}</strong><br/>Score: ${feature.properties.accessibilityScore}`);
                  }}
                />
              </LayersControl.Overlay>
            )}

            {apiData.aqi && (
              <LayersControl.Overlay name="☁️ Data: AQI Suitability Hex-Grid">
                <GeoJSON 
                  data={apiData.aqi} 
                  style={(feature) => {
                    const colors = ["#b91c1c", "#ef4444", "#f59e0b", "#84cc16", "#22c55e"];
                    return {
                      color: colors[feature.properties.suitabilityScore - 1] || "#888",
                      weight: 1, fillOpacity: 0.4
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    layer.bindPopup(`<strong>AQI Simulated Region</strong><br/>Score: ${feature.properties.suitabilityScore}/5`);
                  }}
                />
              </LayersControl.Overlay>
            )}

            {apiData.landCost && (
              <LayersControl.Overlay name="☁️ Data: Land Cost Points">
                <GeoJSON 
                  data={apiData.landCost} 
                  pointToLayer={(feature, latlng) => {
                     return window.L.circleMarker(latlng, {
                       radius: 6, fillColor: "#3b82f6", color: "#1d4ed8", weight: 2, fillOpacity: 0.8
                     }).bindPopup(`<strong>Micro-Market</strong><br/>Price: ${feature.properties.priceFormatted} per sq.ft`);
                  }}
                />
              </LayersControl.Overlay>
            )}

            {apiData.water && (
              <LayersControl.Overlay name="☁️ Data: CGWB Water Quality">
                <GeoJSON 
                  data={apiData.water} 
                  pointToLayer={(feature, latlng) => {
                     return window.L.circleMarker(latlng, {
                       radius: 7, fillColor: feature.properties.suitabilityScore < 3 ? "#ef4444" : "#0ea5e9", color: "#fff", weight: 2, fillOpacity: 0.9
                     }).bindPopup(`<strong>CGWB Observation Point</strong><br/>TDS: ${feature.properties.totalDissolvedSolids_mgL} mg/L`);
                  }}
                />
              </LayersControl.Overlay>
            )}

            {apiData.flood && (
              <LayersControl.Overlay name="☁️ Data: Flood Risk Hotspots">
                <GeoJSON 
                  data={apiData.flood} 
                  pointToLayer={(feature, latlng) => {
                     return window.L.circleMarker(latlng, {
                       radius: 5, fillColor: feature.properties.suitabilityScore < 3 ? "#93c5fd" : "#1e40af", color: "#1e3a8a", weight: 1, fillOpacity: 0.8
                     }).bindPopup(`<strong>Reported Stagnation</strong><br/>Risk: ${feature.properties.riskLevel}`);
                  }}
                />
              </LayersControl.Overlay>
            )}
          </LayersControl>
        </MapContainer>
      </main>

      {/* ------------------------ RIGHT PANEL ------------------------ */}
      <aside className="dashboard-panel dashboard-panel--right" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "100%" }}>
        
        {/* Dynamic Legends */}
        <div className="workspace-card__heading" style={{ marginBottom: "1.25rem" }}>
          <LocateFixed size={20} />
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Map Legend</h2>
        </div>

        <div style={{ background: "rgba(8, 21, 33, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
            Suitability Core Layer
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#22c55e", width: "12px", height: "12px", borderRadius: "2px" }} /> Excellent</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#84cc16", width: "12px", height: "12px", borderRadius: "2px" }} /> Good</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#f59e0b", width: "12px", height: "12px", borderRadius: "2px" }} /> Moderate</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#f97316", width: "12px", height: "12px", borderRadius: "2px" }} /> Fair</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#ef4444", width: "12px", height: "12px", borderRadius: "2px" }} /> Poor</div>
          </div>
        </div>

        {activeLayers.has("☁️ Data: AQI Suitability Hex-Grid") && (
          <div style={{ background: "rgba(8, 21, 33, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              Air Quality Density
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#22c55e", width: "12px", height: "12px", borderRadius: "2px" }} /> Target</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#b91c1c", width: "12px", height: "12px", borderRadius: "2px" }} /> Unhealthy</div>
            </div>
          </div>
        )}
        
        {activeLayers.has("☁️ Data: CGWB Water Quality") && (
          <div style={{ background: "rgba(8, 21, 33, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              Water Salinity Points
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#0ea5e9", width: "12px", height: "12px", borderRadius: "50%" }} /> Fresh Flow Recharge</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#ef4444", width: "12px", height: "12px", borderRadius: "50%" }} /> Saline Contamination</div>
            </div>
          </div>
        )}
        
        {activeLayers.has("☁️ Data: Flood Risk Hotspots") && (
           <div style={{ background: "rgba(8, 21, 33, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
             <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
               Flood Hotspots
             </div>
             <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#1e3a8a", width: "12px", height: "12px", borderRadius: "50%" }} /> Safe Evaluation</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#93c5fd", width: "12px", height: "12px", borderRadius: "50%" }} /> Recurring Floods</div>
             </div>
           </div>
        )}
        
        {activeLayers.has("☁️ Data: Road Accessibility Network") && (
          <div style={{ background: "rgba(8, 21, 33, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
              Road Links
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#22c55e", width: "20px", height: "4px", borderRadius: "2px" }} /> Super Corridor</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}><i style={{ background: "#f59e0b", width: "20px", height: "4px", borderRadius: "2px" }} /> Standard Link</div>
            </div>
          </div>
        )}

        {/* Results Block (Moved to Middle) */}
        <div className="workspace-card__heading" style={{ marginTop: "2rem", marginBottom: "1rem" }}>
          <MapIcon size={20} />
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Suitability Report</h2>
        </div>
        
        {result ? (
          <div className="result-card" style={{ marginTop: 0 }}>
            <span className="result-card__label" style={{ display: "block", marginBottom: "0.5rem" }}>Top Output</span>
            <div className="result-card__row" style={{ marginTop: 0 }}>
              <strong>{result.score.toFixed(2)}</strong>
              <span className={`result-pill result-pill--${result.category.toLowerCase()}`}>
                {result.category}
              </span>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <strong style={{ fontSize: "1.1rem" }}>{result.zone}</strong>
              {result.coordinates && (
                <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.35rem" }}>
                  Lat: {result.coordinates.lat.toFixed(4)}<br/>
                  Lng: {result.coordinates.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="result-card" style={{ marginTop: 0, opacity: 0.6, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
             <span>No area analyzed yet.</span>
             <small>Click 'Calculate Suitability' to generate a report.</small>
          </div>
        )}

        {/* Spacer to push PDF directly to the bottom */}
        <div style={{ flexGrow: 1 }}></div>

        {/* PDF Button (Moved to Bottom) */}
        <button className="primary-button" type="button" onClick={downloadPdf} disabled={!result} style={{ width: "100%", justifyContent: "center", marginTop: "1rem", opacity: result ? 1 : 0.5 }}>
          <Download size={16} />
          Export PDF Report
        </button>
      </aside>
    </div>
  );
}

export default FindYourSpace;
