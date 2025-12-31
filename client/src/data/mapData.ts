export interface Territory {
  id: string;
  name: string;
  continent: string;
  path: string; // SVG path command
  neighbors: string[];
  centerX: number; // For placing troop count
  centerY: number;
}

// Hex-like grid design for a futuristic look
export const mapData: Territory[] = [
  // Continent 1: "Atlantis" (Left)
  {
    id: "t1",
    name: "North Atlantis",
    continent: "Atlantis",
    // Hexagon shape
    path: "M 150,50 L 236,100 L 236,200 L 150,250 L 64,200 L 64,100 Z",
    neighbors: ["t2", "t3"],
    centerX: 150,
    centerY: 150
  },
  {
    id: "t2",
    name: "South Atlantis",
    continent: "Atlantis",
    path: "M 150,270 L 236,320 L 236,420 L 150,470 L 64,420 L 64,320 Z",
    neighbors: ["t1", "t3"],
    centerX: 150,
    centerY: 370
  },

  // Continent 2: "Midgard" (Middle)
  {
    id: "t3",
    name: "West Midgard",
    continent: "Midgard",
    path: "M 400,100 L 486,150 L 486,250 L 400,300 L 314,250 L 314,150 Z",
    neighbors: ["t1", "t2", "t4"],
    centerX: 400,
    centerY: 200
  },
  {
    id: "t4",
    name: "East Midgard",
    continent: "Midgard",
    path: "M 600,100 L 686,150 L 686,250 L 600,300 L 514,250 L 514,150 Z",
    neighbors: ["t3", "t5", "t6"],
    centerX: 600,
    centerY: 200
  },
  // Extra Midgard territory to bridge
  {
      id: "t3b",
      name: "South Midgard",
      continent: "Midgard",
      path: "M 500,320 L 586,370 L 586,470 L 500,520 L 414,470 L 414,370 Z",
      neighbors: ["t3", "t4", "t2", "t6"],
      centerX: 500,
      centerY: 420
  },

  // Continent 3: "Pacificus" (Right)
  {
    id: "t5",
    name: "North Pacificus",
    continent: "Pacificus",
    path: "M 850,50 L 936,100 L 936,200 L 850,250 L 764,200 L 764,100 Z",
    neighbors: ["t4", "t6"],
    centerX: 850,
    centerY: 150
  },
  {
    id: "t6",
    name: "South Pacificus",
    continent: "Pacificus",
    path: "M 850,270 L 936,320 L 936,420 L 850,470 L 764,420 L 764,320 Z",
    neighbors: ["t4", "t5", "t3b"],
    centerX: 850,
    centerY: 370
  }
];

export const continents = {
  "Atlantis": { color: "#3b82f6", bonus: 2 }, // Blue
  "Midgard": { color: "#10b981", bonus: 3 },  // Green
  "Pacificus": { color: "#f59e0b", bonus: 2 } // Amber
};
