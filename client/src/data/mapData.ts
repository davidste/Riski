export interface Territory {
  id: string;
  name: string;
  continent: string;
  path: string; // SVG path command
  neighbors: string[];
  centerX: number; // For placing troop count
  centerY: number;
}

export const mapData: Territory[] = [
  // Continent 1: "Atlantis" (Left)
  {
    id: "t1",
    name: "North Atlantis",
    continent: "Atlantis",
    path: "M 50,50 L 250,50 L 250,250 L 50,250 Z",
    neighbors: ["t2", "t3"],
    centerX: 150,
    centerY: 150
  },
  {
    id: "t2",
    name: "South Atlantis",
    continent: "Atlantis",
    path: "M 50,260 L 250,260 L 250,460 L 50,460 Z",
    neighbors: ["t1", "t3"],
    centerX: 150,
    centerY: 360
  },

  // Continent 2: "Midgard" (Middle)
  {
    id: "t3",
    name: "West Midgard",
    continent: "Midgard",
    path: "M 300,50 L 500,50 L 500,460 L 300,460 Z",
    neighbors: ["t1", "t2", "t4"],
    centerX: 400,
    centerY: 255
  },
  {
    id: "t4",
    name: "East Midgard",
    continent: "Midgard",
    path: "M 510,50 L 710,50 L 710,460 L 510,460 Z",
    neighbors: ["t3", "t5", "t6"],
    centerX: 610,
    centerY: 255
  },

  // Continent 3: "Pacificus" (Right)
  {
    id: "t5",
    name: "North Pacificus",
    continent: "Pacificus",
    path: "M 760,50 L 960,50 L 960,250 L 760,250 Z",
    neighbors: ["t4", "t6"],
    centerX: 860,
    centerY: 150
  },
  {
    id: "t6",
    name: "South Pacificus",
    continent: "Pacificus",
    path: "M 760,260 L 960,260 L 960,460 L 760,460 Z",
    neighbors: ["t4", "t5"],
    centerX: 860,
    centerY: 360
  }
];

export const continents = {
  "Atlantis": { color: "#ffcccc", bonus: 2 },
  "Midgard": { color: "#ccffcc", bonus: 3 },
  "Pacificus": { color: "#ccccff", bonus: 2 }
};
