---
name: Image
type: entity
status: active
updated: 2026-09-27
id: entity.image
---

# Entity: Image

## Description

A picture used by the platform. An image can be attached to a [group](group.md), a [team](team.md), an [event](event.md), or a [marking sheet](marking-sheet.md). Uploading an image resizes it so the same picture can be reused at different sizes. See [Image handling](../system/image-handling.md).

## What can be done

- **Upload** — group-admin, for a group or team, via [Create and manage group](../features/web/groups-manage.md). Event admins upload event images. Venue admins and event admins upload marking-sheet photos via [Venue score capture](../features/app/venue-score-capture.md).
- **Attach** — the uploader, to the group, team, event, or dance the picture belongs to.
- **Mark for removal** — an administrator of that picture. The image is then due to be removed.

## States

This entity has no lifecycle states.

These settings apply:

- **Marked for removal** — due to be taken away.
- **Protected** — kept, including default images.

See [Domain glossary](../system/domain-glossary.md).
