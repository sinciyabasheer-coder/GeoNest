// mathematical Land Cost generation for Chennai
// Generates dummy data based on Central Peak Land Value decay algorithms modified by commercial corridors.

const getDummyLandCost = () => {
    // We define a set of anchor zones in Chennai with base "Guideline Values" (price per sq.ft in INR)
    // These act as the highest peak values.
    const priceAnchors = [
        { name: "Boat Club / Poes Garden", lat: 13.0294, lng: 80.2586, peakPriceSqFt: 35000 },
        { name: "Nungambakkam", lat: 13.0630, lng: 80.2433, peakPriceSqFt: 25000 },
        { name: "T. Nagar", lat: 13.0418, lng: 80.2341, peakPriceSqFt: 22000 },
        { name: "Anna Nagar", lat: 13.0850, lng: 80.2101, peakPriceSqFt: 18000 },
        { name: "Adyar", lat: 13.0033, lng: 80.2555, peakPriceSqFt: 16000 },
        { name: "OMR IT Corridor (Tharamani)", lat: 12.9788, lng: 80.2458, peakPriceSqFt: 12000 },
        { name: "Tambaram", lat: 12.9249, lng: 80.1000, peakPriceSqFt: 6000 },
        { name: "Porur", lat: 13.0382, lng: 80.1565, peakPriceSqFt: 8000 },
        { name: "Avadi", lat: 13.1167, lng: 80.0982, peakPriceSqFt: 4000 },
        { name: "Madhavaram", lat: 13.1488, lng: 80.2306, peakPriceSqFt: 4500 }
    ];

    // To simulate a full dataset, we generate 100 random micro-markets across Chennai's Bounding Box
    const bbox = { minLat: 12.85, maxLat: 13.20, minLng: 80.05, maxLng: 80.30 };
    const numMicroMarkets = 100;
    
    // Simple helper function to calculate Euclidean distance conceptually
    const calcDist = (lat1, lng1, lat2, lng2) => {
        const dLat = lat2 - lat1;
        const dLng = lng2 - lng1;
        return Math.sqrt(dLat * dLat + dLng * dLng); // relative distance unit
    };

    const landCostFeatures = [];

    for (let i = 0; i < numMicroMarkets; i++) {
        // Generate random coordinates within Chennai bounds
        const rLat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
        const rLng = bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng);

        // Find the absolute closest Anchor to determine the base price influence
        let closestAnchor = priceAnchors[0];
        let minDist = calcDist(rLat, rLng, closestAnchor.lat, closestAnchor.lng);

        priceAnchors.forEach(anchor => {
            let dist = calcDist(rLat, rLng, anchor.lat, anchor.lng);
            if (dist < minDist) {
                minDist = dist;
                closestAnchor = anchor;
            }
        });

        // Exponential Distance Decay Formula: Prices drop sharply the further you move from a premium anchor
        // Formula: CalculatedPrice = PeakPrice / (1 + DistanceFactor * PenaltyWeight)
        // Add random variance (+/- 10%) to simulate actual market chaos
        const distancePenalty = minDist * 100; // scaling the coordinate diff
        const rawCalculatedPrice = closestAnchor.peakPriceSqFt / (1 + Math.pow(distancePenalty, 1.8));
        
        let finalPrice = Math.round(rawCalculatedPrice);
        
        // Add +/- 10% market variance
        const variance = 1 + ((Math.random() - 0.5) * 0.2); 
        finalPrice = Math.round(finalPrice * variance);

        // Ensure a realistic absolute minimum so it doesn't go to zero in far suburbs
        const minimumSuburbValue = 1500; 
        if (finalPrice < minimumSuburbValue) finalPrice = minimumSuburbValue + Math.round(Math.random() * 500);

        // Classification for Mapping Suitability (1: Extremely Expensive, 5: Highly Affordable & Suitable)
        let suitabilityScore = 1;
        if (finalPrice <= 3000) suitabilityScore = 5;
        else if (finalPrice <= 6000) suitabilityScore = 4;
        else if (finalPrice <= 10000) suitabilityScore = 3;
        else if (finalPrice <= 18000) suitabilityScore = 2;
        else suitabilityScore = 1;

        landCostFeatures.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [rLng, rLat]
            },
            properties: {
                id: `land_microzone_${i}`,
                category: "land_cost",
                closestAnchor: closestAnchor.name,
                pricePerSqFt: finalPrice,
                priceFormatted: `₹${finalPrice.toLocaleString()}`,
                suitabilityScore: suitabilityScore // Low price = Higher suitability for most basic analyses
            }
        });
    }

    return {
        type: "FeatureCollection",
        metadata: {
            description: "Simulated Chennai Real Estate Value and Land Cost Index using Spatial Exponential Decay",
            totalMicroMarkets: numMicroMarkets
        },
        features: landCostFeatures
    };
};

module.exports = { getDummyLandCost };
