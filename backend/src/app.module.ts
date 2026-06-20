import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';
import { FacilitiesModule } from './modules/facilities';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig), FacilitiesModule],
})
export class AppModule {}
