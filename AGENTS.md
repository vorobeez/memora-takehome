# AGENTS.md

## Project goals

This is a take-home assignment focused on:

- spatial queries with PostGIS
- multi-tenant data isolation
- clear engineering reasoning
- pragmatic implementation over completeness

## Scope

Prioritize:

1. Working schema and migrations
2. Seed data import
3. Facility bays API
4. Map rendering
5. Spatial queries
6. Tests

Do not introduce additional features unless explicitly required.

## Data model

- Facility belongs to an Operator
- Bay belongs to a Facility
- Bay stores operator_id directly for simpler tenant filtering

## GIS assumptions

- Store geometries using SRID 4326
- Use PostGIS for spatial operations
- Prefer database-side spatial filtering
- Return GeoJSON to the frontend

## AI usage

AI tools may be used for:

- scaffolding
- documentation lookup
- boilerplate generation
