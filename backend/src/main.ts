import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const orm = app.get(MikroORM);

  await orm.migrator.up();
  await orm.seeder.seed();

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
