import { NotFoundException } from '@nestjs/common';

export class FacilityNotFound extends NotFoundException {
  constructor(facilityId: string) {
    super(`Facility ${facilityId} was not found`);
  }
}
