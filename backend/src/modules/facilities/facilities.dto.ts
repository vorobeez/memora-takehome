import { IsIn, IsOptional } from 'class-validator';
import { BayStatus, type BayStatusValues } from 'src/domain/bay';

export class BaysParamsDTO {
  @IsOptional()
  @IsIn(Object.values(BayStatus))
  status: BayStatusValues | undefined;
}
