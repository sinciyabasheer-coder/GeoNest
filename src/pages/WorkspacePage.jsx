import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Download,
  Filter,
  Layers3,
  LocateFixed,
  Map as MapIcon,
  RotateCcw,
} from "lucide-react";
import { LayersControl, MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import {
  buildTypes,
  chennaiZones,
  criteriaLabels,
  criteriaOptions,
} from "../data/chennaiZones";

const chennaiCenter = [13.0827, 80.2707];

const suitabilityTone = (score) => {
  if (score >= 0.75) {
    return { color: "#22c55e", label: "High suitability" };
  }

  if (score >= 0.58) {
    return { color: "#f59e0b", label: "Moderate suitability" };
  }

  return { color: "#ef4444", label: "Low suitability" };
};

function WorkspacePage() {
  const [selectedBuildType, setSelectedBuildType] = useState("Residential");
  const [selectedCriteria, setSelectedCriteria] = useState([
    "population",
    "roadAccessibility",
    "waterQuality",
  ]);

  const rankedZones = useMemo(() => {
    const activeCriteria = selectedCriteria.length > 0 ? selectedCriteria : criteriaOptions;

    return chennaiZones
      .map((zone) => {
        const criteriaAverage =
          activeCriteria.reduce((total, criterion) => total + zone.criteriaScores[criterion], 0) /
          activeCriteria.length;
        const buildTypeBoost = zone.buildTypes.includes(selectedBuildType) ? 0.16 : -0.08;
        const score = Math.max(0, Math.min(1, criteriaAverage + buildTypeBoost));

        return {
          ...zone,
          score,
          tone: suitabilityTone(score),
        };
      })
      .sort((first, second) => second.score - first.score);
  }, [selectedBuildType, selectedCriteria]);

  const visibleZones = useMemo(
    () => rankedZones.filter((zone) => zone.score >= 0.55).slice(0, 4),
    [rankedZones]
  );

  const bestZone = visibleZones[0] ?? rankedZones[0];

  const toggleCriterion = (criterion) => {
    setSelectedCriteria((current) =>
      current.includes(criterion)
        ? current.filter((item) => item !== criterion)
        : [...current, criterion]
    );
  };

  const resetFilters = () => {
    setSelectedBuildType("Residential");
    setSelectedCriteria(["population", "roadAccessibility", "waterQuality"]);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const activeCriteria = selectedCriteria.length > 0 ? selectedCriteria : criteriaOptions;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("GeoNest Chennai Suitability Report", 40, 52);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Build type: ${selectedBuildType}`, 40, 82);
    pdf.text(
      `Selected criteria: ${activeCriteria.map((criterion) => criteriaLabels[criterion]).join(", ")}`,
      40,
      100,
      { maxWidth: 520 }
    );

    pdf.setFont("helvetica", "bold");
    pdf.text("Recommended zones", 40, 138);

    let yPosition = 164;

    visibleZones.forEach((zone, index) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${index + 1}. ${zone.name}`, 40, yPosition);
      yPosition += 16;

      pdf.setFont("helvetica", "normal");
      pdf.text(`Suitability score: ${(zone.score * 100).toFixed(1)}%`, 52, yPosition);
      yPosition += 16;
      pdf.text(`Suitability class: ${zone.tone.label}`, 52, yPosition);
      yPosition += 16;
      pdf.text(`Preferred uses: ${zone.buildTypes.join(", ")}`, 52, yPosition, { maxWidth: 500 });
      yPosition += 16;
      pdf.text(zone.summary, 52, yPosition, { maxWidth: 500 });
      yPosition += 28;
    });

    pdf.setFont("helvetica", "italic");
    pdf.text(
      "Note: Suitability polygons in this prototype are illustrative and focused on Chennai sample zones.",
      40,
      yPosition + 12,
      { maxWidth: 520 }
    );

    pdf.save("geonest-chennai-suitability-report.pdf");
  };

  return (
    <main className="workspace-page">
      <section className="workspace-hero">
        <div className="section-shell workspace-hero__inner">
          <div>
            <span className="eyebrow">GeoNest Workspace</span>
            <h1>Chennai land suitability analysis</h1>
            <p>
              Select what you want to build, choose the criteria, and inspect delineated suitable
              areas directly on the map.
            </p>
          </div>
          <div className="workspace-hero__chips">
            <span className="info-chip">
              <LocateFixed size={18} />
              Chennai focus
            </span>
            <span className="info-chip">
              <MapIcon size={18} />
              OSM + Satellite
            </span>
            <span className="info-chip">
              <Layers3 size={18} />
              Delineated suitability zones
            </span>
          </div>
        </div>
      </section>

      <section className="workspace-section">
        <div className="section-shell workspace-layout">
          <aside className="workspace-sidebar">
            <div className="workspace-card">
              <div className="workspace-card__heading">
                <Filter size={18} />
                <h2>Analysis controls</h2>
              </div>

              <label className="field-group" htmlFor="buildType">
                <span>What do you want to build?</span>
                <select
                  id="buildType"
                  value={selectedBuildType}
                  onChange={(event) => setSelectedBuildType(event.target.value)}
                >
                  {buildTypes.map((buildType) => (
                    <option key={buildType}>{buildType}</option>
                  ))}
                </select>
              </label>

              <div className="field-group">
                <span>Criteria selection</span>
                <div className="criteria-stack">
                  {criteriaOptions.map((criterion) => (
                    <label key={criterion} className="check-tile check-tile--light">
                      <input
                        type="checkbox"
                        checked={selectedCriteria.includes(criterion)}
                        onChange={() => toggleCriterion(criterion)}
                      />
                      <span>{criteriaLabels[criterion]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="workspace-actions">
                <button className="primary-button" type="button" onClick={downloadPdf}>
                  <Download size={16} />
                  Download PDF
                </button>
                <button className="secondary-button secondary-button--light" type="button" onClick={resetFilters}>
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            <div className="workspace-card workspace-card--summary">
              <h2>Best match</h2>
              <div className="workspace-best">
                <strong>{bestZone.name}</strong>
                <span>{(bestZone.score * 100).toFixed(1)}% suitability</span>
              </div>
              <p>{bestZone.summary}</p>
              <p className="workspace-muted">Preferred uses: {bestZone.buildTypes.join(", ")}</p>
            </div>

            <div className="workspace-card workspace-card--results">
              <h2>Ranked results</h2>
              <div className="result-list">
                {rankedZones.map((zone) => (
                  <article key={zone.id} className="result-item">
                    <div className="result-item__top">
                      <strong>{zone.name}</strong>
                      <span style={{ color: zone.tone.color }}>{(zone.score * 100).toFixed(0)}%</span>
                    </div>
                    <p>{zone.tone.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <div className="workspace-map-card">
            <div className="workspace-map-card__header">
              <div>
                <h2>Suitability map for Chennai</h2>
                <p>
                  Highlighted polygons represent the best matching areas based on selected criteria
                  and build type.
                </p>
              </div>
              <div className="map-legend">
                <span><i style={{ background: "#22c55e" }} /> High</span>
                <span><i style={{ background: "#f59e0b" }} /> Moderate</span>
                <span><i style={{ background: "#ef4444" }} /> Low</span>
              </div>
            </div>

            <div className="workspace-map-frame">
              <MapContainer center={chennaiCenter} zoom={11} scrollWheelZoom className="workspace-map">
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
                          fillOpacity: 0.28,
                          weight: 3,
                        }}
                      >
                        <Popup>
                          <strong>{zone.name}</strong>
                          <br />
                          Suitability: {(zone.score * 100).toFixed(1)}%
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
        </div>
      </section>
    </main>
  );
}

export default WorkspacePage;
