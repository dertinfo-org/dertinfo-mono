---
name: Registration
type: entity
status: active
updated: 2026-10-12
id: entity.registration
---

# Entity: Registration

## Description

A [group](group.md)'s request to attend an [event](event.md): which teams and members (including guests) are coming, and which [activities](activity.md) they want. Team attendance and member attendance are the lines inside a registration. They are not separate objects.

Submission is not confirmation. The registration stays unconfirmed until an event administrator confirms it.

## What can be done

- **Create / edit** — group-admin, while the registration is New or Submitted, via [Submit event registration](../features/web/registration-submit.md). Creation walks the event overview, the published tickets, the group's teams and people, the chosen tickets, a summary, and the terms. The registration starts **New**. Team activities, member activities, and guests can still be changed afterwards.
- **Submit** — group-admin, via [Submit event registration](../features/web/registration-submit.md). New or Submitted becomes Submitted. The registration becomes visible to the event admin. A registration-submitted [email](email.md) is sent, with the team and member activities requested.
- **Confirm** — event-admin, via [Confirm registrations](../features/web/registration-confirm.md). Submitted becomes Confirmed. An [invoice](invoice.md) is created. A registration-confirmed [email](email.md) is sent, with pricing and how to pay. The group admin can no longer edit the registration.
- **Close** — when the event closes. Confirmed becomes Closed. New or Submitted becomes Cancelled.
- **Cancel** — when the event or group is deleted, or the event is cancelled. The registration becomes Cancelled. Event cancellation can send the event-cancelled [email](email.md).

## States

- **New** — started, and not yet submitted. The group admin can edit it.
- **Submitted** — sent to the event. Visible to the event admin. The group admin can still edit it. The registration-submitted email has been sent.
- **Confirmed** — accepted by the event admin. An invoice exists. The group admin can no longer edit it. The registration-confirmed email has been sent.
- **Closed** — the event has closed a confirmed registration.
- **Cancelled** — withdrawn because the event or group was removed or cancelled, or because an unconfirmed registration was closed with the event.

See [Domain glossary](../system/domain-glossary.md).
