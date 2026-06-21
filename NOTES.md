# Notes

## Session 1: Understanding the domain and initial setup

I started by reading the assignment several times and collecting questions before writing any code. I grouped them into three categories:

- Technology gaps that prevented me from forming a clear mental model of the system.
- Architecture and implementation decisions.
- Areas of uncertainty where multiple reasonable approaches seemed possible.

### Understanding the geospatial stack

The largest knowledge gap was everything related to GIS and PostGIS. Since many implementation decisions depend on understanding how geospatial data is stored and queried, I spent time learning the basics before designing the schema.

I reviewed documentation and used ChatGPT as a learning tool to understand:

- GeoJSON and how it is typically used between APIs and map clients.
- PostGIS concepts such as geometry types, SRID 4326, spatial indexes and common spatial queries.
- How MikroORM migrations and seeding work.
- Whether entities were required before creating migrations.
- Different options for importing and storing geospatial data.

I had no prior experience with GIS tooling, so I intentionally focused on understanding the concepts before implementation.

### Implementation strategy

Before writing code I outlined the order in which I wanted to build the application.

I decided to work from MVP rather than implementing all requirements at once:

1. Database schema and migrations.
2. Backend with a single endpoint and no pagination.
3. Minimal frontend.
4. Basic map rendering.
5. Additional filtering and spatial functionality.
6. Pagination.
7. Nearby search endpoint.
8. One or two stretch goals if time allows.

My goal is to establish a working end-to-end architecture early and then expand it incrementally. This should make later design decisions more obvious and reduce the risk of unnecessary complexity.

### Multi-tenancy and seed data

One area of uncertainty was how to model seed data for multiple operators.

My initial idea was to split the provided parking bays between two operators. After considering the frontend requirements, I decided on a simpler approach:

- Operator A owns the seeded facility and all provided bays.
- Operator B owns a separate facility with a small number of generated test bays.

Since the frontend only visualizes a single facility, this keeps the UI simple while still allowing tenant isolation to be verified through tests and backend behaviour.

### Progress

By the end of the session I:

- Created the initial backend project structure.
- Implemented the first database migration.
- Verified the schema manually using DBeaver.
- Confirmed that PostGIS was available and the migration executed successfully.

At this stage the database schema is in place and the next step is implementing deterministic seed data import from the provided files.

## Session 2: Seeding and /v1/facilities/:facilityId/bays endpoint

This session focused on loading deterministic data and building the first API endpoint. My goal was to get a thin backend slice working so I could start the frontend map before adding filters and pagination.

### Entities

I asked Codex to add MikroORM entities based on the migration schema. Its first suggestion included complex relationship metadata that duplicated constraints already defined in the migration. I initially tried to understand every part of that mapping, but ultimately simplified the entities to the fields needed for querying and kept the migration as the source of truth for constraints and indexes.

### Domain

I considered creating separate domain models for the main entities. Since there is no domain behaviour around them, I decided to keep only the ORM entities. I added a small domain module for bay statuses and API response types; filter-related types can be added there when the endpoint gains filtering.

### Seeding

I used MikroORM's seeder infrastructure but wrote raw SQL for inserts because it made the PostGIS geometry conversion explicit. Operators could have been created through the ORM, but I kept one consistent approach for all seeded records. The inserts use upserts so the seed remains deterministic and can be run repeatedly.

### NestJS Facilities Module

I created a module for the `GET /v1/facilities/:facilityId/bays` endpoint. For now it returns bays filtered by `facilityId`, which is enough to set up the initial frontend map before implementing status, bounding-box and pagination parameters.

I chose a regular response DTO with GeoJSON geometry embedded alongside `code` and `status`, rather than returning a GeoJSON `FeatureCollection`. This should be straightforward to use in both the map and side panel, without wrapping application fields in a GeoJSON `properties` object only to unwrap them in the frontend.

### AI usage

Up to this point I used ChatGPT and Codex mainly to reduce friction while learning MikroORM, which remains my main area of uncertainty. I reviewed each proposed change, asked for the reasoning behind unfamiliar code and checked the documentation when I needed a deeper understanding. The overly complex initial entity mapping was a useful reminder not to accept generated code before understanding whether the complexity was necessary.

### Progress

By the end of the session I:

- Added minimal MikroORM entities for operators, facilities and bays.
- Implemented repeatable seed import for two operators.
- Added the first facilities module and endpoint.

The next step is creating the minimal frontend map, followed by tenant context, filtering, pagination and the remaining spatial endpoint.

## Session 3: Map and side panel

This short session focused on frontend development. My goal was to render the seeded bays on a map and add the required interaction for viewing bay details.

### Shared API contract

I considered creating shared API types for the backend and frontend. After looking into it, I decided that configuring TypeScript to share them properly would take more time than it was worth for this take-home project. Instead, I duplicated the small set of API response types in each application.

### Constant facility

I decided to store the current facility in a constant because I do not plan to add an endpoint for choosing a facility. I isolated this detail in `App.tsx`; the other components receive the facility through props and do not depend on the constant directly.

### GeoJSON properties and colouring

Turns out the bay status needs to be included in each GeoJSON feature because MapLibre uses feature properties to calculate the layer colour. This felt like the most natural use of the map API. I kept the backend contract unchanged and transformed the API response into a `FeatureCollection` in the frontend.

### Side panel feature

I used Codex to implement the side panel. I first asked it to describe its approach, adjusted the proposed plan and requested that the styling remain as lean as possible. It then implemented the feature, and I reviewed the result and fixed a few minor issues myself.

### Progress

By the end of the session I:

- Added the MapLibre map centred on the seeded facility.
- Rendered bay polygons coloured by status.
- Added bay selection and a side panel showing the code, status and area.

The next step is adding tenant context, status filtering and the remaining backend requirements.
