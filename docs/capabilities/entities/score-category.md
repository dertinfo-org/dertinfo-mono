---
name: Score category
type: entity
status: active
updated: 2026-09-27
id: entity.score-category
---

# Entity: Score category

## Description

One marking criterion on a [competition](competition.md). The usual main-competition set is music, stepping, sword handling, dance technique, presentation, characters, and buzz. Traditional and DERTY use different sets. Each category has a maximum mark and a sort order. A [score](score.md) is a mark against one category for one dance.

## What can be done

- **Configure** — event-admin, with the competition, via [Run competitions](../features/web/competitions-run.md). Set the name, description, maximum marks, and sort order.
- **Include in a score set** — event-admin. A [score set](score-set.md) is the subset of categories given to a judge.
- **Mark** — venue-admin or event-admin. Each entered score is against one category. See [Venue score capture](../features/app/venue-score-capture.md).

## States

This entity has no lifecycle states.

See [Domain glossary](../system/domain-glossary.md).
