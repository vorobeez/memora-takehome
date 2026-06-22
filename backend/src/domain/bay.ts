export const BayStatus = {
  Available: 'available',
  Reserved: 'reserved',
  Occupied: 'occupied',
} as const;

export type BayStatusValues = (typeof BayStatus)[keyof typeof BayStatus];

export type Position = [longitude: number, latitude: number];

export type PolygonGeometry = {
  type: 'Polygon';
  coordinates: Position[][];
};

export type BayResponse = {
  id: string;
  operatorId: string;
  facilityId: string;
  code: string;
  status: BayStatusValues;
  geometry: PolygonGeometry;
  area: number;
};

export type BoundingBox = [
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
];

export type BaysCursor = {
  lastSeenId: string;
  facilityId: string;
  status?: BayStatusValues;
  bbox?: BoundingBox;
};

export type BaysResponse = {
  cursor: string | null;
  items: Array<BayResponse>;
};
