// Master Zone Polygons for Backend Spatial Intersection

const chennaiZones = [
  {
    id: "omr-corridor",
    name: "OMR Innovation Corridor",
    polygon: [
      [12.943, 80.214],
      [12.954, 80.267],
      [12.919, 80.285],
      [12.894, 80.232],
    ],
    summary: "Strong corridor for technology-led commercial and rental development with high connectivity.",
  },
  {
    id: "porur-growth-belt",
    name: "Porur Growth Belt",
    polygon: [
      [13.059, 80.146],
      [13.083, 80.176],
      [13.059, 80.208],
      [13.027, 80.182],
    ],
    summary: "Balanced suburban zone with good service access and moderate land cost.",
  },
  {
    id: "guindy-adyar",
    name: "Guindy - Adyar Core",
    polygon: [
      [13.031, 80.213],
      [13.055, 80.243],
      [13.019, 80.274],
      [12.994, 80.236],
    ],
    summary: "High-demand central zone with strong institutional and healthcare potential.",
  },
  {
    id: "ambattur-industrial",
    name: "Ambattur Industrial Cluster",
    polygon: [
      [13.103, 80.131],
      [13.132, 80.158],
      [13.112, 80.19],
      [13.085, 80.166],
    ],
    summary: "Suitable for logistics, industrial support uses, and workforce-oriented rental supply.",
  },
  {
    id: "tambaram-perungalathur",
    name: "Tambaram - Perungalathur Belt",
    polygon: [
      [12.903, 80.091],
      [12.934, 80.122],
      [12.909, 80.153],
      [12.875, 80.12],
    ],
    summary: "Emerging outer belt with comparatively better affordability and resilient suitability mix.",
  },
];

module.exports = chennaiZones;
