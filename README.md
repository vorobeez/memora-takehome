# Take-home: Parking Bay Explorer

Thanks for taking the time. This exercise is a small full-stack feature with
spatial data at its core: a PostGIS-backed REST API on NestJS and a small React
map UI that consumes it. It's deliberately close to the kind of work we do —
multi-tenant SaaS over geospatial assets — but in a neutral domain (parking), so
nobody has a head start and everybody builds the same interesting thing.

We care far more about **how you reason and the quality of a small thing** than
about how much you ship. Please read "What we're looking for" and the "Scope
guardrails" before you start.

---

## Time budget

Aim for **~4–5 focused hours**. The full list below is larger than that on
purpose — we expect you to land the **Core** cleanly and pick **one or two**
stretch goals that interest you. A tight, well-tested Core beats a sprawling,
half-working everything. If you catch yourself gold-plating, stop and jot what
you'd do next in `NOTES.md`.

---

## How you work matters more than finishing

We are explicitly **not** grading on completion. An unfinished submission with
clear thinking, clean commits, and honest notes scores higher than a "done" one
we can't follow. So:

- **Don't rush to finish.** If you run out of time mid-stretch-goal, that's
  fine — stop, and tell us where you got to and what you'd do next. We'd rather
  see three things done well than seven done shakily.
- **Work in a real git repo and push to GitHub regularly** — small, meaningful
  commits as you go, not one giant "final" commit at the end. The commit history
  is part of what we read: it shows how you break a problem down and where the
  hard parts were. Push early so we can see it evolve.
- **Keep a short dev diary** as you work (see `NOTES.md` below). A few lines per
  session — what you tackled, what surprised you, what you got stuck on, a
  decision you reversed. Rough and honest beats polished and retro-fitted.
- **If you use AI tools, great — just tell us how.** They're part of how we work
  too; we're not testing whether you can avoid them. We want to see *how you use
  them well*: what you reached for them for, what you didn't trust them with,
  where they were wrong and how you caught it, and what you changed about your
  prompt or approach. Honest, specific reflection here is a strong positive
  signal — vague "used Copilot for autocomplete" is not.

---

## The domain (just enough)

- An **Operator** is a tenant (a company that runs parking). Every row of data
  belongs to exactly one operator.
- A **Facility** belongs to an operator and has a footprint on a map (a parking
  lot / structure).
- A **Bay** is a single parking space: a polygon boundary (`geom`) and a centroid
  (`point`), plus a human-readable `code` (e.g. `L1-A-12`) and a `status`
  (`available`, `reserved`, `occupied`).
- A **Session** (optional, for a stretch goal) is the current occupancy on an
  occupied bay — a plate and a start time.

This maps onto a lot of real systems: a back-office map for operations, plus
field officers who patrol bays — keep that mental model in mind, it explains why
the API shapes look the way they do.

Real-world note: production geospatial systems often store geometry in a local
projected CRS (ours uses **SRID 25832**, the Danish national grid) and serve
**GeoJSON in WGS84 (4326)** over the API. For this exercise you may store
everything in **4326** to keep setup simple — but see the SRID stretch goal.

---

## What we give you

```
takehome/
  README.md             <- this file
  seed/
    facility.json        <- one facility (GeoJSON polygon, WGS84)
    bays.geojson         <- 60 bays (polygons + status), WGS84
  docker-compose.yml     <- Postgres + PostGIS, ready to go
```

Bring up the database:

```bash
docker compose up -d        # starts postgis/postgis:16-3.4 on localhost:5432
# db=memora user=memora password=memora
```

You scaffold the NestJS app and the React app yourself — picking and wiring the
tooling is part of the signal. Use whatever scaffolder you like (`nest new`,
`npm create vite@latest`). You may use any ORM, but we use **MikroORM** and would
enjoy seeing it; raw SQL / Prisma / TypeORM are fine if you say why.

The seed is a small, deterministic slice so grading is consistent. If you want a
real-world feed for a stretch goal, the **City of Melbourne Open Data** portal
publishes individual on-street parking-bay polygons and live bay status — a
realistic "ingest the real thing" target. Don't let it block the Core.

---

## Core (required)

### Backend — NestJS + PostGIS

1. **Schema & seed.** Model `operator`, `facility`, `bay` with proper PostGIS
   geometry columns and **GIST indexes** on the geometry. Write a migration (or
   migration-equivalent) and a seed script that loads the provided GeoJSON. Seed
   **two operators** so multi-tenancy is observable.

2. **`GET /v1/facilities/:facilityId/bays`** — list bays for a facility.
   - Returns a GeoJSON `FeatureCollection` (geometry reprojected to 4326), **or**
     a paginated DTO with geometry embedded as GeoJSON — your call, but state the
     contract.
   - Supports a **`status`** filter and a **`bbox`** filter
     (`bbox=minLng,minLat,maxLng,maxLat`) that does a real spatial query
     (`ST_Intersects` / `&&` on the geometry), not in-memory filtering.
   - **Cursor-based pagination** (not offset): a stable sort + an opaque cursor.

3. **`GET /v1/bays/nearby?lng=&lat=&radius=`** — bays within `radius` **metres**
   of a point, nearest-first, using a real distance query (`ST_DWithin` +
   `ST_Distance`, on `geography` or a projected CRS — metres, not degrees).

4. **DTO validation** with `class-validator` (validate `bbox`, `radius`, `lng`,
   `lat`, pagination params; reject garbage with 400).

5. **Don't leak the entity.** Map to a response DTO / projection — the wire shape
   is intentional, not "whatever the ORM returns."

6. **Multi-tenancy.** Requests carry an operator context (a simple `x-operator-id`
   header is fine for the exercise) and **must not** return another operator's
   bays. Show us how you'd enforce it — a guard, a query filter, or Postgres RLS
   (we use RLS in prod; a working RLS policy is a strong signal, not required).

7. **Tests.** A couple of meaningful tests — the bbox/nearby spatial queries and
   the tenant-isolation guarantee are the interesting ones. Pick a level (unit
   with a real/in-memory PG, or e2e) and justify it briefly.

### Frontend — React + MapLibre

1. A single map view (**MapLibre GL** via `react-map-gl`) centred on the seeded
   facility, rendering bays as **polygons coloured by status**.
2. Fetch via **TanStack Query**. A status filter (legend / toggles) that updates
   what's shown.
3. Click a bay → a side panel showing its `code`, `status`, and area.
4. Reasonable loading / empty / error states. It doesn't need to be pretty; it
   needs to be correct and legible. Tailwind is what we use but optional.

---

## Stretch goals (pick what interests you — don't do them all)

- **Map-driven querying.** On map move, send the viewport `bbox` to the list
  endpoint and render only what's in view (debounced). Shows you understand the
  spatial API you built.
- **SRID round-trip.** Store geometry in 25832, serve 4326, with the transform
  done in the DB (`ST_Transform`). Mirrors how real systems do it.
- **Real RLS.** Postgres row-level-security policies keyed on a
  `current_setting('app.current_operator_id')` GUC, set per-request. (Heads-up: an
  unset GUC throws — handle that.)
- **Sessions.** Add the `session` entity + a `GET /v1/bays/:id` detail endpoint
  and show current-occupancy info in the side panel.
- **Ingest real data.** Load the City of Melbourne parking-bay feed instead of
  (or alongside) the seed.
- **`docker-compose` the whole thing** so `docker compose up` brings up db + api
  + web.
- **Clustering or occupancy density** by lot/row at low zoom.

---

## What we're looking for

This is the rubric, in rough priority order:

1. **Correct spatial queries** — geometry work done in PostGIS, indexed, in the
   right units and CRS. This is the heart of the exercise.
2. **API design taste** — clean DTOs, validation, sensible status codes, a
   pagination scheme that actually works under a moving cursor, a deliberate wire
   contract.
3. **Tenant isolation** — you cannot read another operator's data, and you can
   show us why not.
4. **Code you'd be happy to maintain** — module boundaries, naming, no leaked
   entities, tests on the risky parts.
5. **Frontend correctness** — data flows cleanly from API → query cache → map;
   states handled.
6. **Judgement under a time box** — what you chose to build, and what you
   deliberately didn't (tell us in `NOTES.md`).

We are **not** scoring: visual polish, exhaustive test coverage, auth/login,
production deploy concerns, or feature breadth.

---

## Deliverable

A **GitHub repo** (link preferred over a zip — we want to see the commit
history) with:

- `backend/` and `frontend/` (and `docker-compose.yml` if you went that way).
- A real commit history — pushed incrementally as you worked, not squashed into
  one commit.
- A short **`NOTES.md`** covering:
  - **How to run it** — ideally a couple of commands.
  - **Choices & trade-offs** — the decisions you made and why; what you knowingly
    cut and what you'd do with another day.
  - **Dev diary** — a brief, roughly chronological log of how it actually went:
    what you tackled in each sitting, what surprised you, where you got stuck or
    changed your mind. A handful of bullet points is plenty; we value honesty
    over polish.
  - **AI usage** — if you used AI tools, tell us *how and why*: what you used them
    for, what you deliberately did **not**, a time they were wrong and how you
    caught it, and any thoughts on where they helped vs. got in the way. If you
    didn't use them, just say so. There's no wrong answer here — we're reading for
    self-awareness, not a particular workflow.

This file matters as much as the code — it's where you show your reasoning. A
README that lets us run the thing in a couple of commands goes a long way. Have
fun with it — parking geometry is a surprisingly nice spatial playground.
