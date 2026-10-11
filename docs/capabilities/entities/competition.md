---
name: Competition
type: entity
status: active
updated: 2026-09-27
id: entity.competition
---

# Entity: Competition

## Description

A judged [team activity](activity.md) inside an [event](event.md). A typical Dert has four: **Main** (five venues), **Traditional** (a different marking set), **Spotlight**, and **DERTY** (Dancing England Rapper Tournament Youth; a different marking set). A team may enter one or more. Multi-venue competitions add scores across venues.

Awards are calculated from the scores. They are not stored as their own object. For the main competition they are typically best newcomer, veterans, **Steve Marris** (includes characters), and **overall winner** (excludes characters). Entry attributes are tags on a team's entry — such as newcomer, veterans, and characters — used by those calculations. The assignment of a team to a competition (the competition entry) is part of populating this competition. It is not a separate object.

## What can be done

- **Create** — event-admin, from the event-type template, via [Create event](../features/web/events-create.md) and [Run competitions](../features/web/competitions-run.md). Starts as New.
- **Populate** — event-admin. Attach entrants from confirmed [registrations](registration.md). New becomes Populated.
- **Generate** — event-admin. Build the [dances](dance.md) and the paperwork for the judges and [score sets](score-set.md). Populated becomes Generated.
- **Collate** — event-admin. Bring scores together so reporting can identify award winners.
- **Publish** — event-admin, via [Publish competition results](../features/web/results-publish.md), after the awards ceremony. The competition becomes Published. Award outcomes are public. Group admins and members of a team can see that team's scores and [marking sheets](marking-sheet.md) in the app. Further changes stop.

## States

- **New** — created, with no entrants attached.
- **Populated** — entrants from confirmed registrations are attached.
- **Generated** — dances and paperwork have been built. This follows Populated.
- **Published** — results are public. No further changes.

**Results collated** is a setting used while working out awards, before or as results are published. **Testing mode** allows actions that the usual sequence would block. **Ad hoc dances** allows an extra dance to be added after generation.

See [Domain glossary](../system/domain-glossary.md).
