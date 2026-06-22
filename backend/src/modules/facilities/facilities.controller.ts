import { Controller, Get, Param, Query } from '@nestjs/common';

import { FacilitiesService } from './facilities.service';
import { BaysResponse, BayStatusValues } from 'src/domain/bay';
import { OperatorId } from 'src/decorators/operatorId.decorator';
import { BaysParamsDTO } from './facilities.dto';

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
    @Param() { facilityId }: GetBaysParams,
    @OperatorId() operatorId: string,
    @Query('status') status: BayStatusValues | undefined,
    @Query('bbox') bbox: string | undefined,
    @Query('cursor') cursor: string | undefined,
  ): Promise<BaysResponse> {
    const paramsDto = new BaysParamsDTO();
    paramsDto.status = status;
    paramsDto.bbox = bbox;
    paramsDto.cursor = cursor;

    return this.facilitiesService.getBays(facilityId, operatorId, paramsDto);
  }
}
