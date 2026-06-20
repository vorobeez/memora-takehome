# Notes

## Session 1 — Understanding the domain and initial setup

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
