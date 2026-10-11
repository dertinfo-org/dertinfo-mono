---
name: Dance
type: entity
status: active
updated: 2026-09-27
id: entity.dance
---

# Entity: Dance

## Description

One team's performance at one [venue](venue.md) in one [competition](competition.md). It is the unit that is scored. A dance belongs to the team's attendance on the [registration](registration.md) that entered the competition.

## What can be done

- **Generate** — event-admin, when the competition's dances are built. The competition moves to Generated. See [Competition](competition.md) and [Run competitions](../features/web/competitions-run.md).
- **Add ad hoc** — event-admin, when the competition allows extra dances after generation.
- **Enter scores** — venue-admin or event-admin, via [Venue score capture](../features/app/venue-score-capture.md). Awaiting scores becomes scores entered. [Scores](score.md) and a photographed [marking sheet](marking-sheet.md) are captured.
- **Check scores** — event-admin, via [Validate scores](../features/web/scoring-validate.md). Scores entered becomes scores checked. After that, the venue admin can no longer change the scores or the marking sheet.

## States

- **Awaiting scores** — the dance exists and no scores have been entered.
- **Scores entered** — marks have been captured, and have not yet been checked.
- **Scores checked** — the event admin has accepted the scores. The venue admin can no longer change them or the marking sheet.

**Overrun** is a flag on the dance. It records that the performance overran. It is not a lifecycle state.

See [Domain glossary](../system/domain-glossary.md).
