---
name: Validate scores
type: feature
status: active
updated: 2026-07-26
id: scoring.validate
roles: [event-admin]
---

# Feature: Validate scores

## Description

Event administrators review uploaded score sheets and entered scores, check they are correct, and accept them as the validated scores for a dance. After that check, venue admins lose the ability to change those scores or sheets.

## User roles

- **event-admin** — review and validate scores for competitions in their events; may also have entered scores at the venue

## Behaviour

- Inspect scores and score-sheet images (filterable in competition views by venue, team, award — see [Run competitions](competitions-run.md)).
- Confirm correctness; validated scores become the accepted result for that dance.
- After validation/check, **venue admins cannot edit** those scores or score sheets further.
- In current practice, score checking is done by event administrators (a separate competition-admin role is not used).

## Limitations

- Public award results appear only after [Publish competition results](results-publish.md) (event admin only).

See [Venue score capture](../app/venue-score-capture.md) and [Domain glossary](../../system/domain-glossary.md).
