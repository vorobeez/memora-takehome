import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import mikroOrmConfig from '../mikro-orm.config';
import { BaysModule } from './modules/bays';
import { FacilitiesModule } from './modules/facilities';
import { OperatorContextGuard } from './guards/operatorContext.guard';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    BaysModule,
    FacilitiesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OperatorContextGuard,
    },
  ],
})
export class AppModule {}
