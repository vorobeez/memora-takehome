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
  facilityId: string;
  code: string;
  status: BayStatusValues;
  geometry: PolygonGeometry;
  area: number;
};

export type BaysResponse = Array<BayResponse>;
