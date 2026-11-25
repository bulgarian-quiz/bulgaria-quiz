export interface RegionMeta {
  id: string;
  x: number;
  y: number;
}

// Normalized positions match the authoritative province map used by the legacy game.
export const regionRoute: RegionMeta[] = [
  { id: "sofiaCity", x: 19, y: 50 }, { id: "pernik", x: 11, y: 52 },
  { id: "kyustendil", x: 11, y: 64 }, { id: "blagoevgrad", x: 16, y: 77 },
  { id: "pazardzhik", x: 30, y: 64 }, { id: "plovdiv", x: 40, y: 62 },
  { id: "smolyan", x: 37, y: 81 }, { id: "kardzhali", x: 48, y: 84 },
  { id: "haskovo", x: 53, y: 73 }, { id: "staraZagora", x: 51, y: 58 },
  { id: "yambol", x: 66, y: 62 }, { id: "burgas", x: 77, y: 52 },
  { id: "sliven", x: 62, y: 49 }, { id: "varna", x: 81, y: 34 },
  { id: "dobrich", x: 85, y: 20 }, { id: "silistra", x: 71, y: 15 },
  { id: "shumen", x: 71, y: 33 }, { id: "razgrad", x: 65, y: 26 },
  { id: "targovishte", x: 61, y: 34 }, { id: "ruse", x: 56, y: 21 },
  { id: "velikoTarnovo", x: 50, y: 35 }, { id: "gabrovo", x: 47, y: 45 },
  { id: "lovech", x: 36, y: 41 }, { id: "pleven", x: 36, y: 25 },
  { id: "vratsa", x: 23, y: 33 }, { id: "montana", x: 16, y: 26 },
  { id: "vidin", x: 8, y: 17 }, { id: "sofiaProvince", x: 17, y: 41 },
];