---
name: Score set
type: entity
status: active
updated: 2026-09-27
id: entity.score-set
---

# Entity: Score set

## Description

The subset of [score categories](score-category.md) given to a [judge](judge.md) at a [venue](venue.md). It is used to build that judge's paperwork for each [dance](dance.md). A competition can have more than one score set when judges mark different criteria.

## What can be done

- **Configure** — event-admin, via [Run competitions](../features/web/competitions-run.md). Name the set and choose which score categories it includes.
- **Allocate** — event-admin. Give the set to a judge at a venue for a competition. That judge's sheet uses those categories.
- **Use when capturing scores** — venue-admin or event-admin, via [Venue score capture](../features/app/venue-score-capture.md). The scores entered for that judge follow the set.

## States

This entity has no lifecycle states.

See [Domain glossary](../system/domain-glossary.md).
