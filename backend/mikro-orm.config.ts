import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'memora',
  password: process.env.DB_PASSWORD ?? 'memora',
  dbName: process.env.DB_NAME ?? 'memora',
  entities: ['dist/src/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  discovery: {
    // The first iteration is migration-first; entities are added with the API.
    warnWhenNoEntities: false,
  },
  debug: process.env.NODE_ENV !== 'production',
  extensions: [Migrator],
  migrations: {
    path: 'dist/src/migrations',
    pathTs: 'src/migrations',
  },
});
