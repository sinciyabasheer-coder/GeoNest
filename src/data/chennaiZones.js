export const criteriaOptions = [
  "population",
  "roadAccessibility",
  "landCost",
  "airQuality",
  "waterQuality",
  "floodRisk",
];

export const criteriaLabels = {
  population: "Population",
  roadAccessibility: "Road Accessibility",
  landCost: "Land Cost",
  airQuality: "Air Quality",
  waterQuality: "Water Quality",
  floodRisk: "Flood Risk",
};

export const buildTypes = [
  "Residential",
  "Commercial",
  "Hospital",
  "Rental",
  "Industrial",
];

export const chennaiZones = [
  {
    id: "omr-corridor",
    name: "OMR Innovation Corridor",
    buildTypes: ["Commercial", "Rental", "Industrial"],
    polygon: [
      [12.943, 80.214],
      [12.954, 80.267],
      [12.919, 80.285],
      [12.894, 80.232],
    ],
    criteriaScores: {
      population: 0.78,
      roadAccessibility: 0.9,
      landCost: 0.38,
      airQuality: 0.58,
      waterQuality: 0.61,
      floodRisk: 0.42,
    },
    summary: "Strong corridor for technology-led commercial and rental development with high connectivity.",
  },
  {
    id: "porur-growth-belt",
    name: "Porur Growth Belt",
    buildTypes: ["Residential", "Hospital", "Rental"],
    polygon: [
      [13.059, 80.146],
      [13.083, 80.176],
      [13.059, 80.208],
      [13.027, 80.182],
    ],
    criteriaScores: {
      population: 0.74,
      roadAccessibility: 0.79,
      landCost: 0.57,
      airQuality: 0.67,
      waterQuality: 0.63,
      floodRisk: 0.56,
    },
    summary: "Balanced suburban zone with good service access and moderate land cost.",
  },
  {
    id: "guindy-adyar",
    name: "Guindy - Adyar Core",
    buildTypes: ["Commercial", "Hospital"],
    polygon: [
      [13.031, 80.213],
      [13.055, 80.243],
      [13.019, 80.274],
      [12.994, 80.236],
    ],
    criteriaScores: {
      population: 0.86,
      roadAccessibility: 0.84,
      landCost: 0.29,
      airQuality: 0.49,
      waterQuality: 0.55,
      floodRisk: 0.37,
    },
    summary: "High-demand central zone with strong institutional and healthcare potential.",
  },
  {
    id: "ambattur-industrial",
    name: "Ambattur Industrial Cluster",
    buildTypes: ["Industrial", "Commercial", "Rental"],
    polygon: [
      [13.103, 80.131],
      [13.132, 80.158],
      [13.112, 80.19],
      [13.085, 80.166],
    ],
    criteriaScores: {
      population: 0.68,
      roadAccessibility: 0.82,
      landCost: 0.64,
      airQuality: 0.46,
      waterQuality: 0.59,
      floodRisk: 0.61,
    },
    summary: "Suitable for logistics, industrial support uses, and workforce-oriented rental supply.",
  },
  {
    id: "tambaram-perungalathur",
    name: "Tambaram - Perungalathur Belt",
    buildTypes: ["Residential", "Rental", "Hospital"],
    polygon: [
      [12.903, 80.091],
      [12.934, 80.122],
      [12.909, 80.153],
      [12.875, 80.12],
    ],
    criteriaScores: {
      population: 0.72,
      roadAccessibility: 0.76,
      landCost: 0.7,
      airQuality: 0.69,
      waterQuality: 0.66,
      floodRisk: 0.63,
    },
    summary: "Emerging outer belt with comparatively better affordability and resilient suitability mix.",
  },
];
