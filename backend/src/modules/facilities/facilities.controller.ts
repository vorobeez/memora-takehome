import { Controller, Get, Param } from '@nestjs/common';

import { FacilitiesService } from './facilities.service';
import { BaysResponse } from 'src/domain/bay';
import { OperatorId } from 'src/decorators/operatorId.decorator';

type GetBaysParams = {
  facilityId: string;
};

@Controller({
  path: 'facilities',
  version: '1',
})
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get(':facilityId/bays')
  async getBays(
    @Param() params: GetBaysParams,
    @OperatorId() operatorId: string,
  ): Promise<BaysResponse> {
    return this.facilitiesService.getBays(params.facilityId, operatorId);
  }
}
