---
name: Super-admin privilege (deprecated)
type: feature
status: deprecated
updated: 2026-07-26
id: platform.super-admin-deprecated
roles: [super-admin]
---

# Feature: Super-admin privilege (deprecated)

## Description

Platform-wide “super administrator” privilege that bypasses or extends beyond scoped group/event/venue/DoD administration.

## Status

**Deprecated — should be removed from the product.**

- Keep this page only as a marker for reverse-engineering and cleanup.
- New features must not depend on super-admin.
- Migrate any remaining behaviours to scoped roles or explicit system operations.

## User roles

- **super-admin** — legacy only; see [Super administrator](../../roles/super-admin.md)

## Behaviour

- Historically granted elevated access across the platform.

## Limitations / follow-up

- Remove role, claims, and policy paths that encode super-admin once a cleanup workstream is scheduled.
- Document replacements under the appropriate scoped role or system capability when behaviour is reassigned.
