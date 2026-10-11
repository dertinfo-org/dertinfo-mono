---
name: Email
type: entity
status: active
updated: 2026-09-27
id: entity.email
---

# Entity: Email

## Description

A message the platform sends. It is built from an event's [email template](email-template.md) and the details of the entity that triggered it. People do not compose these messages. A registration or event change sends them.

Delivery uses [Send email](../features/web/send-email.md). The wording comes from [Registration email templates](../features/web/registration-email-templates.md).

## What can be done

- **Registration submitted** — sent when a group admin submits a [registration](registration.md). The message summarises the team and member activities requested. The event admin can see the registration. The group admin receives the email.
- **Registration confirmed** — sent when an event admin confirms a registration. The message includes the [invoice](invoice.md), pricing, and how the group admin should pay.
- **Event cancelled** — sent when an event admin cancels an [event](event.md), for the registration states the organiser chooses to notify. The message tells the group the event is cancelled.

## States

This entity has no lifecycle states. Each email is one of the three kinds above, sent once for the change that triggered it.

See [Domain glossary](../system/domain-glossary.md).
