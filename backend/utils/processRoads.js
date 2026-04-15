const fs = require('fs');
const path = require('path');

const RAW_DATA_PATH = path.join(__dirname, '../data/CHENNAI_ROAD_JSON.json');
const PROCESSED_DATA_PATH = path.join(__dirname, '../data/processed_roads.geojson');

console.log('Starting Road Shapefile processing...');

try {
  // Read the raw 22MB JSON file
  const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
  
  // We only want major arterials to prevent the React frontend from lagging,
  // and these are the roads that dictate macro-level accessibility.
  const majorRoadClasses = ['primary', 'secondary', 'tertiary', 'trunk', 'motorway', 'primary_link', 'secondary_link'];
  
  const geoJsonFeatures = [];

  rawData.features.forEach(feature => {
    const attrs = feature.attributes;
    const fclass = attrs.fclass;

    if (majorRoadClasses.includes(fclass)) {
      // Calculate a realistic Accessibility Score based on road type
      let baseScore = 50;
      
      // Based on your specific classification where Primary = National Highway:
      if (['primary', 'motorway'].includes(fclass)) baseScore = 90; // Highest Accessibility
      else if (['trunk', 'primary_link'].includes(fclass)) baseScore = 80; // High Accessibility
      else if (['secondary', 'secondary_link'].includes(fclass)) baseScore = 65; // Moderate Accessibility
      
      // Add slight randomness (0-9 points) to emulate traffic gradients
      const accessibilityScore = baseScore + Math.floor(Math.random() * 10); 

      // Convert ESRI Polyline paths to GeoJSON LineString coordinates
      // ESRI format: paths: [[[x, y], [x, y]]]
      const coordinates = feature.geometry.paths[0];

      geoJsonFeatures.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates
        },
        properties: {
          id: attrs.osm_id || attrs.FID,
          name: attrs.name && attrs.name.trim() !== "" ? attrs.name : "Unnamed Corridor",
          roadClass: fclass,
          accessibilityScore: accessibilityScore,
          category: "road_accessibility"
        }
      });
    }
  });

  const geoJsonFeatureCollection = {
    type: "FeatureCollection",
    metadata: {
      description: "Processed Major Roads for Chennai with Accessibility Scores",
      totalFeaturesCount: geoJsonFeatures.length
    },
    features: geoJsonFeatures
  };

  fs.writeFileSync(PROCESSED_DATA_PATH, JSON.stringify(geoJsonFeatureCollection));
  
  console.log(`Successfully processed ESRI JSON.`);
  console.log(`Filtered down to ${geoJsonFeatures.length} major corridors.`);
  console.log(`Saved optimized GeoJSON to: ${PROCESSED_DATA_PATH}`);

} catch (err) {
  console.error('Error processing the file:', err);
}
