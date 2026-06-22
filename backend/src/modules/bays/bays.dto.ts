import {
  IsLatitude,
  IsLongitude,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';

export const parseRadius = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const radius = Number(value);

  return Number.isFinite(radius) && radius > 0 ? radius : undefined;
};

const IsRadius = (validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isRadius',
      validator: {
        validate: (value): boolean => parseRadius(value) !== undefined,
        defaultMessage: () => 'radius must be a positive number',
      },
    },
    validationOptions,
  );

export class NearbyBaysParamsDTO {
  @IsLongitude()
  lng: string | undefined;

  @IsLatitude()
  lat: string | undefined;

  @IsRadius()
  radius: string | undefined;
}
