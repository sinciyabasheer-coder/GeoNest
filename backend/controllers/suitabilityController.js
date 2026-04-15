const turf = require('@turf/turf');
const GlobalMapCache = require('../state/globalMapCache');
const chennaiZonePolygons = require('../data/chennaiZonePolygons');

// Advanced Spatial Aggregation Engine
exports.calculateSuitability = async (req, res) => {
    try {
        const { weights } = req.body;
        if (!weights) {
            return res.status(400).json({ error: "Weights matrix required" });
        }

        // We will spatially aggregate the 6 cached datasets against each Chennai Zone
        const rankedZones = chennaiZonePolygons.map(zone => {
            // Convert zone array [lat, lng] to proper GeoJSON Polygon [[[lng, lat]]]
            const coords = zone.polygon.map(p => [p[1], p[0]]);
            coords.push(coords[0]); // Complete the ring
            const turfPoly = turf.polygon([coords]);

            // 1. Population Aggregation (Points)
            let popScore = 0;
            if (GlobalMapCache.population) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.population, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgPop = ptsInside.features.reduce((acc, feat) => acc + feat.properties.estimatedPopulationCurrent, 0) / ptsInside.features.length;
                    popScore = Math.min(avgPop / 400000, 1.0); // Normalize based on 400k max
                }
            }

            // 2. Road Accessibility (Lines) -> We check center of roads falling inside
            let roadScore = 0;
            if (GlobalMapCache.roads) {
                let totalS = 0;
                let count = 0;
                GlobalMapCache.roads.features.forEach(road => {
                    // Quick optimization: get midpoint of linestring
                    const centerPoint = turf.center(road);
                    if (turf.booleanPointInPolygon(centerPoint, turfPoly)) {
                        totalS += road.properties.accessibilityScore;
                        count++;
                    }
                });
                roadScore = count > 0 ? (totalS / count) / 100 : 0; // Normalize 0-1
            }

            // 3. AQI Suitability (Hexagons)
            let aqiScore = 0;
            if (GlobalMapCache.aqi) {
                let totalS = 0;
                let count = 0;
                GlobalMapCache.aqi.features.forEach(hex => {
                    const centerPoint = turf.center(hex);
                    if (turf.booleanPointInPolygon(centerPoint, turfPoly)) {
                        totalS += hex.properties.suitabilityScore; // 1 to 5
                        count++;
                    }
                });
                aqiScore = count > 0 ? (totalS / count) / 5 : 0;
            }

            // 4. Land Cost (Points)
            let landScore = 0;
            if (GlobalMapCache.landCost) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.landCost, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    landScore = avgS / 5;
                }
            }

            // 5. Water Quality (Points)
            let waterScore = 0;
            if (GlobalMapCache.water) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.water, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    waterScore = avgS / 5;
                }
            }

            // 6. Flood Risk (Points)
            let floodScore = 0;
            if (GlobalMapCache.flood) {
                const ptsInside = turf.pointsWithinPolygon(GlobalMapCache.flood, turfPoly);
                if (ptsInside.features.length > 0) {
                    const avgS = ptsInside.features.reduce((acc, feat) => acc + feat.properties.suitabilityScore, 0) / ptsInside.features.length;
                    floodScore = avgS / 5;
                } else {
                    // No reported stagnation points inside poly = safe
                    floodScore = 1.0; 
                }
            }

            // --- Construct Final Spatially Computed Object ---
            const criteriaScores = {
                population: popScore,
                roadAccessibility: roadScore,
                landCost: landScore,
                airQuality: aqiScore,
                waterQuality: waterScore,
                floodRisk: floodScore
            };

            // Calculate final weighted score
            let finalScore = 0;
            Object.keys(weights).forEach(key => {
                if (criteriaScores[key]) {
                    finalScore += criteriaScores[key] * weights[key];
                }
            });

            return {
                ...zone,
                score: finalScore,
                criteriaScores
            };
        });

        // Sort Highest to Lowest
        rankedZones.sort((a, b) => b.score - a.score);

        return res.json({
            message: "Mathematically intersected against 6 real-time spatial layers",
            zones: rankedZones
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to run spatial aggregator" });
    }
};
