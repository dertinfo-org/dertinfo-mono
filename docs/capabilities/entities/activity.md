---
name: Activity
type: entity
status: active
updated: 2026-09-27
id: entity.activity
---

# Entity: Activity

## Description

A bookable item on an [event](event.md). There are two kinds.

- **Team activity** — a competition-style entry for a [team](team.md). It may have a price. A judged team activity is a [competition](competition.md).
- **Member activity** — a ticket-style entry for people attending, such as adult, junior, or concession.

Named price bands used when booking people onto a registration (attendance classifications) are part of this booking setup. They are not a separate object.

## What can be done

- **Supply from the event type** — event-admin, when the event is created via [Create event](../features/web/events-create.md). The template provides the starting activities.
- **Price** — event-admin. Set a price, or leave the price to be confirmed.
- **Mark sold out** — event-admin. A sold-out activity cannot take further bookings.
- **Book** — group-admin, by choosing the activity on a [registration](registration.md) via [Submit event registration](../features/web/registration-submit.md).

## States

This entity has no lifecycle states.

These settings apply:

- **Kind** — team activity, or member activity.
- **Price to be confirmed** — the price is not final yet.
- **Sold out** — no further bookings.

See [Domain glossary](../system/domain-glossary.md).
