const GlobalMapCache = require('../state/globalMapCache');

// Base dataset metadata sent to the frontend
const datasetMetadata = [
  { id: 'population', title: "Population Data", description: "Demographic density surfaces with custom algorithms.", iconName: "Users" },
  { id: 'roads', title: "Road Accessibility", description: "Scored accessibility index from raw CHENNAI_ROAD_JSON", iconName: "Route" },
  { id: 'land-cost', title: "Land Cost", description: "Land valuation... ", iconName: "Coins" },
  { id: 'aqi', title: "Air Quality Index", description: "Environmental quality...", iconName: "Wind" },
  { id: 'water', title: "Water Quality", description: "Water condition datasets...", iconName: "Droplets" },
  { id: 'flood', title: "Flood Risk", description: "Flood hazard and susceptibility...", iconName: "AlertTriangle" },
];

exports.getAllDatasets = async (req, res) => {
  try {
    res.json(datasetMetadata);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getDatasetById = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (id === 'population') {
      return res.json(GlobalMapCache.population);
    }
    
    if (id === 'roads') {
      if (GlobalMapCache.roads) {
        return res.json(GlobalMapCache.roads);
      } else {
        return res.status(404).json({ error: "Road shapes not processed yet." });
      }
    }

    if (id === 'aqi') {
      return res.json(GlobalMapCache.aqi);
    }
    
    if (id === 'land-cost') {
      return res.json(GlobalMapCache.landCost);
    }
    
    if (id === 'water') {
      return res.json(GlobalMapCache.water);
    }
    
    if (id === 'flood') {
      return res.json(GlobalMapCache.flood);
    }

    // Placeholder for other datasets
    res.json({ message: `Fetching dummy spatial data for: ${id}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
