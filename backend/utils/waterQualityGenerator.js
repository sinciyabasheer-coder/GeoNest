// Simulating Central Ground Water Board (CGWB) Observation Wells Data
// Coastal areas suffer from high Total Dissolved Solids (TDS) due to seawater intrusion.

const getWaterQualityData = () => {
    const numWells = 75; // Total observation wells to simulate
    // Chennai roughly spans Longitude 80.05 to 80.30, and Latitude 12.85 to 13.20
    const bbox = { minLat: 12.85, maxLat: 13.20, minLng: 80.05, maxLng: 80.30 };
    
    // The Bay of Bengal coast in Chennai sits near Longitude 80.26 - 80.28
    const coastlineLng = 80.27; 

    const waterFeatures = [];

    for (let i = 0; i < numWells; i++) {
        // Randomly place observation well within bounding box
        const rLat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
        const rLng = bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng);

        // --- CGWB LOGIC: Seawater Intrusion Calculation ---
        // Calculate how close the well is to the ocean (East coast)
        // If rLng is 80.26, it's right on the beach. If rLng is 80.05, it's deep inland.
        const distanceToCoast = coastlineLng - rLng; // Smaller number = closer to coast

        // Base TDS (Total Dissolved Solids in mg/L)
        let simulatedTDS = 300; // Fresh water default

        if (distanceToCoast < 0.03) {
            // Very close to coast (Within ~3km) -> Extreme seawater intrusion
            simulatedTDS = 2000 + Math.random() * 1500; // 2000 - 3500 mg/L (Brackish/Saline)
        } else if (distanceToCoast < 0.08) {
            // Moderate distance to coast (Within ~8km) -> Moderate mixing zone
            simulatedTDS = 800 + Math.random() * 1000; // 800 - 1800 mg/L (Hard water)
        } else {
            // Inland aquifers -> Mostly fresh recharge
            simulatedTDS = 200 + Math.random() * 400; // 200 - 600 mg/L (Fresh water)
        }

        // --- CGWB LOGIC: Industrial River Pollution ---
        // Cooum River cuts through the center (approx Latitude 13.07)
        // If a well is close to the river, EC and TDS increase due to sewage percolation.
        if (Math.abs(rLat - 13.07) < 0.02) {
            simulatedTDS += 500; // Add pollution penalty
        }

        // Clean up the numbers
        simulatedTDS = Math.round(simulatedTDS);

        // --- Suitability Reclassification (BIS Drinking Water Standards) ---
        // BIS Standard: Desirable limit < 500 mg/L, Permissible < 2000 mg/L
        let suitabilityScore = 1;
        let qualityCategory = "Unusable";

        if (simulatedTDS <= 500) {
            suitabilityScore = 5;
            qualityCategory = "Excellent (Fresh)";
        } else if (simulatedTDS <= 1000) {
            suitabilityScore = 4;
            qualityCategory = "Good (Acceptable)";
        } else if (simulatedTDS <= 1500) {
            suitabilityScore = 3;
            qualityCategory = "Fair (Hard)";
        } else if (simulatedTDS <= 2000) {
            suitabilityScore = 2;
            qualityCategory = "Poor (Requires RO)";
        } else {
            suitabilityScore = 1;
            qualityCategory = "Unsuitable (Saline)";
        }

        // Generate the point
        waterFeatures.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [rLng, rLat]
            },
            properties: {
                id: `cgwb_well_${i}`,
                category: "water_quality",
                agency: "Simulated Central Ground Water Board",
                totalDissolvedSolids_mgL: simulatedTDS,
                qualityCategory: qualityCategory,
                suitabilityScore: suitabilityScore // Used universally by the frontend renderer
            }
        });
    }

    return {
        type: "FeatureCollection",
        metadata: {
            description: "Simulated CGWB Groundwater Quality index identifying saline intrusion zones.",
            totalWellsTesting: numWells
        },
        features: waterFeatures
    };
};

module.exports = { getWaterQualityData };
