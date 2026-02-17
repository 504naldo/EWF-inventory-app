import { Category } from "./categories";

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  categories: readonly Category[];
}

export const CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    id: "fire-safety",
    name: "Fire Safety",
    icon: "🔥",
    categories: [
      "Fire Extinguishers and accessories",
      "Emergency Light Packs and accessories",
      "Batteries",
    ],
  },
  {
    id: "detection-systems",
    name: "Detection Systems",
    icon: "🔔",
    categories: [
      "Smoke Alarms",
      "Heat Detectors",
      "Smoke Detectors",
      "Indicating Devices (Pull Stations, Strobes, Buzzers etc)",
      "Backflow",
    ],
  },
  {
    id: "plumbing-fittings",
    name: "Plumbing & Fittings",
    icon: "🔧",
    categories: [
      "Steel Fittings",
      "Couplings",
      "Blaze/PVC Pipe and Fittings",
      "3-way Valves",
    ],
  },
  {
    id: "tools-parts",
    name: "Tools & Parts",
    icon: "⚙️",
    categories: [
      "Air Gauge",
      "Water Gauge",
      "Compressor Parts and Accessories",
      "1/4\" accessories",
      "wire and cable",
    ],
  },
  {
    id: "other",
    name: "Other",
    icon: "📦",
    categories: [
      "Outgoing Jobs",
      "Miscellaneous",
    ],
  },
] as const;

// Helper function to find which group a category belongs to
export function getCategoryGroup(category: Category): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(group => 
    group.categories.includes(category as any)
  );
}
