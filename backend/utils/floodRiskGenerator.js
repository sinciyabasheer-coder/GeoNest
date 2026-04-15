// Simulating OpenCity.in Chennai Flooding Data
// Based on historical GCC (Greater Chennai Corporation) water stagnation reports from 2015 & 2023 floods.

const getFloodRiskData = () => {
    // OpenCity.in data highlights specific low-lying macro-zones that act as massive bowls during monsoons
    const floodHotspots = [
        { name: "Velachery (Lake Buffer)", lat: 12.9801, lng: 80.2220, severity: "Extreme" },
        { name: "Pallikaranai Marshland Edge", lat: 12.9348, lng: 80.2137, severity: "Extreme" },
        { name: "Mudichur / Tambaram", lat: 12.9066, lng: 80.0827, severity: "High" },
        { name: "Vyasarpadi", lat: 13.1186, lng: 80.2543, severity: "High" },
        { name: "Madipakkam", lat: 12.9647, lng: 80.1961, severity: "High" },
        { name: "Kovilambakkam", lat: 12.9428, lng: 80.1830, severity: "High" },
        { name: "Korattur (Near Lake)", lat: 13.1166, lng: 80.1834, severity: "High" }
    ];

    const numStagnationPoints = 120; // Number of simulated street-level reports
    const bbox = { minLat: 12.85, maxLat: 13.20, minLng: 80.05, maxLng: 80.30 };
    
    const calcDist = (lat1, lng1, lat2, lng2) => {
        // Euclidean proxy for distance
        return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)); 
    };

    const floodFeatures = [];

    for (let i = 0; i < numStagnationPoints; i++) {
        // Generate coordinates. 
        // We will purposely cluster 50% of the points near the known hotspots to simulate real OpenCity cluster maps.
        let rLat, rLng;

        if (i < numStagnationPoints / 2) {
            // Cluster around a random hotspot
            const hotspot = floodHotspots[Math.floor(Math.random() * floodHotspots.length)];
            // Add tiny random variance (approx 1-3km radius)
            rLat = hotspot.lat + (Math.random() - 0.5) * 0.04;
            rLng = hotspot.lng + (Math.random() - 0.5) * 0.04;
        } else {
            // Randomly scattered across the rest of the city
            rLat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
            rLng = bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng);
        }

        // Determine risk score by checking distance to nearest major flood bowl
        let minHotspotDist = 999;
        floodHotspots.forEach(hotspot => {
            const dist = calcDist(rLat, rLng, hotspot.lat, hotspot.lng);
            if (dist < minHotspotDist) minHotspotDist = dist;
        });

        // Reclassification: Suitability Score (1 = Extreme Flood Risk/Not Suitable, 5 = High Elevation/Safe)
        let suitabilityScore = 5;
        let riskLevel = "Low Risk";
        let historicalStagnation = "Rare";

        if (minHotspotDist < 0.015) { // Extremely close to Velachery/Pallikaranai lake beds
            suitabilityScore = 1;
            riskLevel = "Extreme Risk";
            historicalStagnation = "Frequent (3ft+ during monsoons)";
        } else if (minHotspotDist < 0.035) { 
            suitabilityScore = 2;
            riskLevel = "High Risk";
            historicalStagnation = "Occasional (1-2ft during heavy rain)";
        } else if (minHotspotDist < 0.06) {
            suitabilityScore = 3;
            riskLevel = "Moderate Risk";
            historicalStagnation = "Street-level logging only";
        } else if (minHotspotDist < 0.1) {
            suitabilityScore = 4;
            riskLevel = "Low Risk";
            historicalStagnation = "Rare (Good drainage)";
        } else {
            suitabilityScore = 5;
            riskLevel = "Negligible Risk";
            historicalStagnation = "None reported";
        }

        floodFeatures.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [rLng, rLat]
            },
            properties: {
                id: `opencity_flood_pt_${i}`,
                category: "flood_risk",
                source: "Simulated OpenCity.in GCC Reports",
                riskLevel: riskLevel,
                historicalStagnation: historicalStagnation,
                suitabilityScore: suitabilityScore 
            }
        });
    }

    return {
        type: "FeatureCollection",
        metadata: {
            description: "Simulated Chennai Water Stagnation and Flood Risk mapping based on OpenCity historical data.",
            totalDataPoints: numStagnationPoints
        },
        features: floodFeatures
    };
};

module.exports = { getFloodRiskData };
