import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Bay } from '../../entities/bay.entity';
import { BaysController } from './bays.controller';
import { BaysService } from './bays.service';

@Module({
  imports: [MikroOrmModule.forFeature([Bay])],
  controllers: [BaysController],
  providers: [BaysService],
})
export class BaysModule {}
