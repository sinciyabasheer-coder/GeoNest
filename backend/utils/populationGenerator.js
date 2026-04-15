// Population Dummy Data Generator for Chennai (Option 1)
// We use the Compound Annual Growth Rate (CAGR) formula: P = P0 * (1 + r)^t

const getProjectedPopulation = () => {
    // A comprehensive set of major zones representing "Whole Chennai"
    const zones = [
        // Central / CORE (Saturated, very low growth)
        { name: "Anna Nagar", lat: 13.0850, lng: 80.2101, basePop2011: 350000, growthRate: 0.012 },
        { name: "T. Nagar", lat: 13.0418, lng: 80.2341, basePop2011: 280000, growthRate: 0.010 }, 
        { name: "Mylapore", lat: 13.0368, lng: 80.2676, basePop2011: 150000, growthRate: 0.010 },
        { name: "Egmore", lat: 13.0732, lng: 80.2609, basePop2011: 120000, growthRate: 0.008 },
        { name: "Nungambakkam", lat: 13.0630, lng: 80.2433, basePop2011: 100000, growthRate: 0.009 },

        // South Chennai (High growth IT Corridors & Suburbs)
        { name: "OMR (Sholinganallur)", lat: 12.8988, lng: 80.2265, basePop2011: 90000, growthRate: 0.065 },
        { name: "Velachery", lat: 12.9815, lng: 80.2180, basePop2011: 180000, growthRate: 0.035 },
        { name: "Tambaram", lat: 12.9249, lng: 80.1000, basePop2011: 210000, growthRate: 0.040 },
        { name: "Adyar", lat: 13.0033, lng: 80.2555, basePop2011: 110000, growthRate: 0.011 },
        { name: "Thiruvanmiyur", lat: 12.9863, lng: 80.2605, basePop2011: 95000, growthRate: 0.015 },
        { name: "Pallavaram", lat: 12.9675, lng: 80.1491, basePop2011: 140000, growthRate: 0.038 },

        // West Chennai (Industrial & rapidly developing)
        { name: "Porur", lat: 13.0382, lng: 80.1565, basePop2011: 110000, growthRate: 0.045 },
        { name: "Ambattur", lat: 13.1143, lng: 80.1548, basePop2011: 290000, growthRate: 0.030 },
        { name: "Avadi", lat: 13.1167, lng: 80.0982, basePop2011: 250000, growthRate: 0.035 },
        { name: "Poonamallee", lat: 13.0473, lng: 80.0945, basePop2011: 85000, growthRate: 0.042 },

        // North Chennai (Dense, older settlements with industrial growth)
        { name: "Tiruvottiyur", lat: 13.1611, lng: 80.3005, basePop2011: 210000, growthRate: 0.020 },
        { name: "Royapuram", lat: 13.1137, lng: 80.2954, basePop2011: 180000, growthRate: 0.015 },
        { name: "Madhavaram", lat: 13.1488, lng: 80.2306, basePop2011: 115000, growthRate: 0.025 },
        { name: "Perambur", lat: 13.1093, lng: 80.2374, basePop2011: 160000, growthRate: 0.018 }
    ];

    const currentYear = new Date().getFullYear();
    const timeDelta = currentYear - 2011; // Automatically calculates time since 2011

    // Convert into a standard GeoJSON FeatureCollection structure 
    // This is the industry standard for GIS mapping applications (React-Leaflet loves this)
    const geoJsonFeatures = zones.map(zone => {
        const projectedPop = Math.round(zone.basePop2011 * Math.pow((1 + zone.growthRate), timeDelta));
        
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [zone.lng, zone.lat] // GeoJSON format is [longitude, latitude]
            },
            properties: {
                id: zone.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                zoneName: zone.name,
                basePopulation2011: zone.basePop2011,
                estimatedPopulationCurrent: projectedPop,
                growthRateUsed: `${(zone.growthRate * 100).toFixed(1)}%`,
                category: "population_density"
            }
        };
    });

    return {
        type: "FeatureCollection",
        metadata: {
            description: `Projected population data from 2011 to ${currentYear} using CAGR`,
            totalZonesCount: zones.length
        },
        features: geoJsonFeatures
    };
};

module.exports = { getProjectedPopulation };

// If you want to test it locally, uncomment below:
// console.log(JSON.stringify(getProjectedPopulation(), null, 2));
