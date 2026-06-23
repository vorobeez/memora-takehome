# Notes

This is the short submission guide and development summary. A more detailed chronological account is available in the [extended dev diary](./NOTES_LONG.md).

## How to run

### Prerequisites

- Node.js and npm.
- Docker with Docker Compose.

Install the backend and frontend dependencies from the repository root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Start Postgres with PostGIS:

```bash
npm run db:up
```

Then start the backend and frontend from the repository root in separate terminals:

```bash
npm run be:dev
```

```bash
npm run fe:dev
```

The backend applies migrations and imports the deterministic seed data during startup. The API is available at `http://localhost:3000` and the frontend at `http://localhost:5173`.

With the database running, execute the e2e suite from the repository root:

```bash
npm run be:test:e2e
```

## Choices and trade-offs

- **Spatial storage:** I stored the exercise data in SRID 4326 because both seed files and the API contract use WGS84 GeoJSON. For metre-based nearby search I cast coordinates to `geography`, so distance calculations are not performed in degrees. I did not implement the 25832 round-trip stretch goal within the time box.
- **Schema:** I followed a migration-first approach: geometry columns, foreign keys, constraints and GIST indexes are defined in the migration, while MikroORM entities stay minimal and are used mainly for querying.
- **Seeding:** I used raw SQL in the seeder because it made the GeoJSON-to-PostGIS conversion explicit and repeatable. The seed uses upserts so startup remains deterministic.
- **Multi-tenancy:** Requests use an `x-operator-id` context established by a NestJS guard, and every relevant query filters by that operator. This is intentionally a simple exercise-level substitute for authentication, not a production identity mechanism.
- **API response:** I chose not to return a full `FeatureCollection` from the backend because the UI also needs ordinary fields such as code, status and area for the side panel.
- **Pagination:** The facilities endpoint uses a stable ID order and an opaque cursor bound to the facility and active filters. A cursor reused with different query state is rejected with `400` rather than silently restarting pagination.
- **Testing:** I chose e2e tests against real PostGIS for tenant isolation and spatial behaviour. These paths cross validation, request context, ORM query construction and database semantics, so mocked unit tests offered less confidence.
- **Scope:** I stopped after completing the core rather than pursuing stretch goals. The UI is intentionally functional and lean; production authentication, deployment and broad test coverage are outside the time box.

## What I would do next

- Add backend and frontend services to Docker Compose so the complete application can be installed and started with one command. This would reduce host-machine assumptions and improve developer experience.
- Enforce tenant isolation in PostgreSQL with row-level security using an operator ID stored in `current_setting`, while retaining application-level filters as defence in depth.

## Dev diary

### Session 1 — Domain and setup

- I began by learning the GIS concepts that were new to me: GeoJSON, SRIDs, PostGIS geometry types, spatial indexes and metre-based distance queries.
- I planned an incremental path from schema to a thin backend and frontend slice instead of attempting every requirement at once.
- I seeded one main facility for the first operator and a small second facility for another operator, so tenant isolation could be tested while keeping the frontend focused on a single facility.

### Session 2 — Seed and first endpoint

- I created migration-first entities and a repeatable raw-SQL seeder.
- I asked Codex to scaffold the initial MikroORM entities, but the first version included relationship metadata that felt unnecessary for this migration-first design. I simplified the entities and kept constraints and indexes in the migration.
- I added the first facilities endpoint and settled on a regular response DTO with embedded GeoJSON.
- This established enough of the backend contract to begin the map before adding filters and pagination.

### Session 3 — Map and interaction

- I added the MapLibre view, transformed API results into a frontend `FeatureCollection` and coloured polygons by status.
- I decided against configuring shared TypeScript types because the contract was small and the setup cost was not justified.
- I added bay selection and a side panel showing code, status and area.

### Session 4 — Completing the core

- I added tenant context, status and bounding-box filters, then moved the meaningful coverage from heavily mocked unit tests to e2e tests.
- I implemented cursor pagination myself because I wanted to understand it in detail, using AI mainly for design discussion and review.
- I added automatic frontend page loading and the nearby endpoint using `ST_DWithin` and `ST_Distance` on `geography`.
- I stopped at the completed core and left stretch goals for the next iteration.

## AI usage

I used ChatGPT as a learning partner for unfamiliar GIS and MikroORM concepts, and Codex for planning, review and implementation where an existing project pattern made the task well bounded. Examples include the side panel, status control, bounding-box filtering, infinite-query wiring and the nearby bays module.

I deliberately implemented cursor pagination myself because it was new to me and delegating it immediately would have skipped the learning I wanted from the assignment. I then used Codex to review the cursor structure, filter matching and keyset query.

I did not accept generated changes without review. Early entity scaffolding introduced relationships and metadata that were unnecessary for this migration-first design, so I removed them. Codex also generated service tests with more mocking than I found useful; I discarded that direction and moved the coverage to real e2e tests. These cases reinforced that AI was most effective when the boundaries and existing patterns were clear, and less useful when it tried to choose architecture or test seams on my behalf.
