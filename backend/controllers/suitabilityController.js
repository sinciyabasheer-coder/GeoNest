const turf = require('@turf/turf');
const GlobalMapCache = require('../state/globalMapCache');

// Advanced Spatial Aggregation Engine - Choropleth Map Generator
exports.calculateSuitability = async (req, res) => {
    try {
        const { weights } = req.body;
        if (!weights) {
            return res.status(400).json({ error: "Weights matrix required" });
        }

        // Generate dynamic Hex Grid over Chennai approx bbox
        const bbox = [80.05, 12.85, 80.30, 13.15]; 
        const cellSide = 1.5; // kilometers
        const options = {units: 'kilometers'};
        const hexGrid = turf.hexGrid(bbox, cellSide, options);

        const rankedZones = [];
        let hexIdCounter = 1;

        for (const hex of hexGrid.features) {
            const turfPoly = hex; // It's a GeoJSON polygon feature
            
            // Get centroid for reverse geocoding & display in UI
            const centroid = turf.centroid(turfPoly);
            const [lng, lat] = centroid.geometry.coordinates;

            // 1. Population Aggregation
            let popScore = 0;
            if (GlobalMapCache.population) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.population, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgPop = ptsInside.features.reduce((acc, feat) => acc + feat.properties.estimatedPopulationCurrent, 0) / ptsInside.features.length;
                    popScore = Math.min(avgPop / 400000, 1.0);
                }
            }

            // 2. Road Accessibility
            let roadScore = 0;
            if (GlobalMapCache.roads) {
                let totalS = 0;
                let count = 0;
                GlobalMapCache.roads.features.forEach(road => {
                    const centerPoint = turf.center(road);
                    if (turf.booleanPointInPolygon(centerPoint, turfPoly)) {
                        totalS += road.properties.accessibilityScore;
                        count++;
                    }
                });
                roadScore = count > 0 ? (totalS / count) / 100 : 0;
            }

            // 3. AQI Suitability (Intersecting Hexagons)
            let aqiScore = 0;
            if (GlobalMapCache.aqi) {
                let totalS = 0;
                let count = 0;
                GlobalMapCache.aqi.features.forEach(gridHex => {
                    const centerPoint = turf.center(gridHex);
                    if (turf.booleanPointInPolygon(centerPoint, turfPoly)) {
                        totalS += gridHex.properties.suitabilityScore; // 1 to 5
                        count++;
                    }
                });
                aqiScore = count > 0 ? (totalS / count) / 5 : 0;
            }

            // 4. Land Cost
            let landScore = 0;
            if (GlobalMapCache.landCost) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.landCost, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    landScore = avgS / 5;
                }
            }

            // 5. Water Quality
            let waterScore = 0;
            if (GlobalMapCache.water) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.water, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    waterScore = avgS / 5;
                }
            }

            // 6. Flood Risk
            let floodScore = 0;
            if (GlobalMapCache.flood) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.flood, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    floodScore = avgS / 5;
                } else {
                    floodScore = 1.0; // Safe
                }
            }

            // Only score hexagons that hit at least one key dataset (so we don't map the ocean entirely)
            if (roadScore > 0 || popScore > 0 || landScore > 0 || waterScore > 0) {
                const criteriaScores = {
                    population: popScore,
                    roadAccessibility: roadScore,
                    landCost: landScore,
                    airQuality: aqiScore,
                    waterQuality: waterScore,
                    floodRisk: floodScore
                };

                let finalScore = 0;
                let totalWeightSum = 0;

                Object.keys(weights).forEach(key => {
                    const weightVal = Number(weights[key]) || 0;
                    totalWeightSum += weightVal;
                    if (criteriaScores[key]) {
                        finalScore += criteriaScores[key] * weightVal;
                    }
                });

                // Normalize the score by the total weight sum to keep it in 0.0 - 1.0 range
                const normalizedScore = totalWeightSum > 0 ? (finalScore / totalWeightSum) : 0;

                rankedZones.push({
                    id: `hex-${hexIdCounter++}`,
                    name: `Hex Zone [${lat.toFixed(3)}, ${lng.toFixed(3)}]`,
                    coordinates: { lat, lng },
                    polygon: turfPoly.geometry.coordinates[0].map(c => [c[1], c[0]]), // Leaflet expects [lat, lng]
                    score: normalizedScore,
                    criteriaScores
                });
            }
        }

        rankedZones.sort((a, b) => b.score - a.score);

        return res.json({
            message: "Mathematically intersected against a live 1.5km hexagonal Choropleth grid",
            zones: rankedZones
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to run spatial aggregator" });
    }
};
