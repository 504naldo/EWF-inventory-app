export const CATEGORIES = [
  "Fire Extinguishers and accessories",
  "Emergency Light Packs and accessories",
  "Batteries",
  "Steel Fittings",
  "Couplings",
  "Smoke Alarms",
  "Heat Detectors",
  "Smoke Detectors",
  "Backflow",
  "Indicating Devices (Pull Stations, Strobes, Buzzers etc)",
  "Blaze/PVC Pipe and Fittings",
  "Outgoing Jobs",
  "Compressor Parts and Accessories",
  "Miscellaneous",
] as const;

export type Category = typeof CATEGORIES[number];
