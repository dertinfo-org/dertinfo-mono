---
name: Marking sheet
type: entity
status: active
updated: 2026-10-04
id: entity.marking-sheet
---

# Entity: Marking sheet

## Description

The paper score sheet for a [dance](dance.md). It is printed for the judges, filled in at the venue, then photographed and uploaded, usually from the app. The photo is an [image](image.md). After the competition is published, a group can see its own team's sheets. Other groups cannot.

## What can be done

- **Prepare** — event-admin, when dances and paperwork are generated for the [competition](competition.md). See [Run competitions](../features/web/competitions-run.md).
- **Photograph and upload** — venue-admin or event-admin, via [Venue score capture](../features/app/venue-score-capture.md). [Image handling](../system/image-handling.md) resizes the photo.
- **Check** — event-admin, via [Validate scores](../features/web/scoring-validate.md). Once the dance is scores checked, the venue admin can no longer change the sheet.
- **View after publish** — group-admin, group-member, or member associated with the team, on the website group view or in the app, after [Publish competition results](../features/web/results-publish.md).

## States

A marking sheet follows the [dance](dance.md). It can be replaced until the dance is scores checked. After that check it is locked.

See [Domain glossary](../system/domain-glossary.md).
