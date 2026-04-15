const fs = require('fs');
const path = require('path');

const { getProjectedPopulation } = require('../utils/populationGenerator');
const { getAqiSuitabilityGrid } = require('../utils/aqiGenerator');
const { getDummyLandCost } = require('../utils/landCostGenerator');
const { getWaterQualityData } = require('../utils/waterQualityGenerator');
const { getFloodRiskData } = require('../utils/floodRiskGenerator');

console.log("Initializing Global Spatial Cache...");

// Load the one fully static file we have (Roads)
const roadsPath = path.join(__dirname, '../data/processed_roads.geojson');
let roadsGeoJSON = null;
if (fs.existsSync(roadsPath)) {
    roadsGeoJSON = JSON.parse(fs.readFileSync(roadsPath, 'utf8'));
}

// Generate the chaotic random ones EXACTLY ONCE and lock them in memory
const GlobalMapCache = {
    population: getProjectedPopulation(),
    roads: roadsGeoJSON,
    aqi: getAqiSuitabilityGrid(),
    landCost: getDummyLandCost(),
    water: getWaterQualityData(),
    flood: getFloodRiskData()
};

module.exports = GlobalMapCache;
