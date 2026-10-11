---
name: Judge
type: entity
status: active
updated: 2026-09-27
id: entity.judge
---

# Entity: Judge

## Description

A person who marks [dances](dance.md). A venue typically has two judges. The event administrator records the judge and assigns them to a [venue](venue.md), a [competition](competition.md), and a [score set](score-set.md). That assignment is part of the judge's work on the day. It is not a separate object.

## What can be done

- **Record** — event-admin, via [Run competitions](../features/web/competitions-run.md). Name and contact details are kept for the event.
- **Assign** — event-admin. Place the judge at a venue for a competition, with the score set they mark against. That score set decides which [score categories](score-category.md) appear on their paperwork.
- **Mark** — the judge's marks are entered as [scores](score.md) by a venue admin or event admin, via [Venue score capture](../features/app/venue-score-capture.md).

## States

This entity has no lifecycle states.

See [Domain glossary](../system/domain-glossary.md).
