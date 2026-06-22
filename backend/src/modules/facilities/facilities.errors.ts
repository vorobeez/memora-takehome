import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class FacilityNotFoundException extends NotFoundException {
  constructor(facilityId: string) {
    super(`Facility ${facilityId} was not found`);
  }
}

export class QueryParamsValidationException extends BadRequestException {
  constructor(validationErrors: ValidationError[]) {
    super(
      `Validation errors on the folllowing properties: ${validationErrors.map((error) => error.property).join(', ')}`,
    );
  }
}

export class InvalidCursorException extends BadRequestException {
  constructor() {
    super('Invalid pagination cursor');
  }
}
