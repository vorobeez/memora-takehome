import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class NearbyBaysParamsValidationException extends BadRequestException {
  constructor(validationErrors: ValidationError[]) {
    super(
      `Validation errors on the following properties: ${validationErrors.map((error) => error.property).join(', ')}`,
    );
  }
}
