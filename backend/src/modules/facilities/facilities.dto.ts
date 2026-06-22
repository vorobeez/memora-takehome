import {
  IsIn,
  IsOptional,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';
import { BayStatus, type BayStatusValues } from 'src/domain/bay';

export type BoundingBox = [
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
];

export const parseBoundingBox = (value: unknown): BoundingBox | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parts = value.split(',');

  if (parts.length !== 4 || parts.some((part) => part.trim() === '')) {
    return undefined;
  }

  const coordinates = parts.map(Number);

  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return undefined;
  }

  const [minLng, minLat, maxLng, maxLat] = coordinates;

  if (
    minLng < -180 ||
    maxLng > 180 ||
    minLat < -90 ||
    maxLat > 90 ||
    minLng >= maxLng ||
    minLat >= maxLat
  ) {
    return undefined;
  }

  return [minLng, minLat, maxLng, maxLat];
};

export const IsBoundingBox = (validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isBoundingBox',
      validator: {
        validate: (value): boolean => parseBoundingBox(value) !== undefined,
        defaultMessage: () =>
          'bbox must be minLng,minLat,maxLng,maxLat with valid WGS84 bounds',
      },
    },
    validationOptions,
  );

export class BaysParamsDTO {
  @IsOptional()
  @IsIn(Object.values(BayStatus))
  status: BayStatusValues | undefined;

  @IsOptional()
  @IsBoundingBox()
  bbox: string | undefined;
}
