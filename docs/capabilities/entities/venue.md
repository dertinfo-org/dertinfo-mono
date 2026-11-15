---
name: Venue
type: entity
status: active
updated: 2026-11-01
id: entity.venue
---

# Entity: Venue

## Description

A place where part of a [competition](competition.md) is judged. A competition can use more than one venue. The main Dert competition uses five. Scores from those venues are added together for the competition result.

## What can be done

- **Create** — event-admin, via [Run competitions](../features/web/competitions-run.md). A venue belongs to an event.
- **Attach to a competition** — event-admin. The competition is then judged at that venue.
- **Assign judges** — event-admin. Each judge at the venue is given a [score set](score-set.md). See [Judge](judge.md).
- **Capture scores** — venue-admin or event-admin, via [Venue score capture](../features/app/venue-score-capture.md). Scores and [marking sheet](marking-sheet.md) photos are taken for each [dance](dance.md) at the venue.
- **View own teams' dances** — group-member or group-admin, via [View own team dances](../features/app/results-own-team-dances.md). The venue lists dances for the teams in the groups that person has joined, and no others.

## States

This entity has no lifecycle states.

See [Domain glossary](../system/domain-glossary.md).
