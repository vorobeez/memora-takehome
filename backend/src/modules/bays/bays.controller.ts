import { Controller, Get, Query } from '@nestjs/common';

import { BayResponse } from 'src/domain/bay';
import { OperatorId } from 'src/decorators/operatorId.decorator';
import { NearbyBaysParamsDTO } from './bays.dto';
import { BaysService } from './bays.service';

@Controller({
  path: 'bays',
  version: '1',
})
export class BaysController {
  constructor(private readonly baysService: BaysService) {}

  @Get('nearby')
  async getNearby(
    @OperatorId() operatorId: string,
    @Query('lng') lng: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('radius') radius: string | undefined,
  ): Promise<Array<BayResponse>> {
    const paramsDto = new NearbyBaysParamsDTO();
    paramsDto.lng = lng;
    paramsDto.lat = lat;
    paramsDto.radius = radius;

    return this.baysService.getNearby(operatorId, paramsDto);
  }
}
