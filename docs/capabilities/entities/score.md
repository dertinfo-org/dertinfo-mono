---
name: Score
type: entity
status: active
updated: 2026-09-27
id: entity.score
---

# Entity: Score

## Description

A mark, and an optional comment, for one [score category](score-category.md) on one [dance](dance.md). Scores are what the event admin checks, collates, and later publishes as competition results.

## What can be done

- **Enter** — venue-admin or event-admin, via [Venue score capture](../features/app/venue-score-capture.md). Entering scores moves the dance from awaiting scores to scores entered.
- **Check** — event-admin, via [Validate scores](../features/web/scoring-validate.md). The dance becomes scores checked. The score is then fixed: the venue admin can no longer change it.
- **Publish** — event-admin, via [Publish competition results](../features/web/results-publish.md), for the whole [competition](competition.md). After publish, a group can see its own team's scores. Other groups' detailed scores stay private. Public pages show award outcomes, not every mark.

## States

A score has no lifecycle of its own. It follows the [dance](dance.md): awaiting scores, scores entered, then scores checked.

See [Domain glossary](../system/domain-glossary.md).
