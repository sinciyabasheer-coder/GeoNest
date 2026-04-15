const { hexGrid, distance, center } = require('@turf/turf');

// We simulate a completed GIS workflow (Interpolation -> Raster -> Reclassification)
// By outputting the final reclassified 'Suitability Layer' as a GeoJSON Hexagonal Vector Grid.

const getAqiSuitabilityGrid = () => {
    // 1. Define the spatial bounding box for the Greater Chennai Area
    // [minX, minY, maxX, maxY] (Longitude, Latitude)
    const bbox = [80.12, 12.85, 80.32, 13.25];
    
    // 2. Create the Grid: 1 kilometer wide hexagons to simulate the Raster surface
    const cellSide = 1; 
    const options = { units: 'kilometers' };
    const grid = hexGrid(bbox, cellSide, options);

    // 3. Define "Pollution Hotspots" in Chennai (e.g., Manali Petrochemicals in North Chennai)
    // Coords: [Longitude, Latitude]
    const industrialHotspot1 = [80.2600, 13.1600]; // Manali Area 
    const industrialHotspot2 = [80.1550, 13.0800]; // Ambattur Industrial Estate

    // 4. Iterate over the grid, calculating mathematical Suitability Scores
    grid.features.forEach((cell, index) => {
        // Find the center of this specific hexagon cell
        const cellCenter = center(cell);
        
        // Calculate the distance from this cell to the heavy industrial zones
        const distToManali = distance(cellCenter, industrialHotspot1, options);
        const distToAmbattur = distance(cellCenter, industrialHotspot2, options);
        
        // Take the closest polluting hotspot
        const minDistanceToPollution = Math.min(distToManali, distToAmbattur);

        // 5. Reclassify based on distance (Simulating AQI interpolation logic)
        // The further from factories, the better the air, the higher the suitability score (1-5).
        let suitabilityScore = 1; // Default poor
        let aqiString = "Poor";

        if (minDistanceToPollution < 3) {
            suitabilityScore = 1; // Very close to factories
            aqiString = "Unhealthy (> 200 AQI)";
        } else if (minDistanceToPollution < 7) {
            suitabilityScore = 2; // Moderately close
            aqiString = "Moderate (101 - 200 AQI)";
        } else if (minDistanceToPollution < 12) {
            suitabilityScore = 3; // Average city air
            aqiString = "Satisfactory (51 - 100 AQI)";
        } else if (minDistanceToPollution < 18) {
            suitabilityScore = 4; // Good air
            aqiString = "Good (25 - 50 AQI)";
        } else {
            suitabilityScore = 5; // Coastal / Far Suburbs
            aqiString = "Excellent (0 - 25 AQI)";
        }

        // Overwrite slightly if it's right on the Marina Beach coast (Longitude > 80.27)
        // Ocean breeze tends to lower PM2.5 heavily regardless of distance.
        if (cellCenter.geometry.coordinates[0] > 80.27 && suitabilityScore < 4) {
            suitabilityScore += 1;
        }

        // Attach the calculated data to the Grid Cell properties
        cell.properties = {
            id: `aqi_hex_${index}`,
            category: "air_quality_suitability",
            suitabilityScore: suitabilityScore, // Critical for user's requested workflow
            simulatedAqiRange: aqiString,
            distanceToPollutantKm: minDistanceToPollution.toFixed(2)
        };
    });

    return grid; // Returns the full FeatureCollection GeoJSON Array
};

module.exports = { getAqiSuitabilityGrid };
