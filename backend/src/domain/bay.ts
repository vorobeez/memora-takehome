export const BayStatus = {
  Available: 'available',
  Reserved: 'reserved',
  Occupied: 'occupied',
} as const;

export type BayStatusValues = (typeof BayStatus)[keyof typeof BayStatus];
