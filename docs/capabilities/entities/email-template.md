---
name: Email template
type: entity
status: active
updated: 2026-09-27
id: entity.email-template
---

# Entity: Email template

## Description

The template name, subject, and body an [event](event.md) uses when it sends an [email](email.md). Each event has templates for the registration lifecycle. The sent email fills that wording with the registration, invoice, or cancellation it is about.

## What can be done

- **Maintain** — event-admin, via [Registration email templates](../features/web/registration-email-templates.md). Edit the template name, subject, and body for each kind.
- **Use** — the platform, when a registration is submitted or confirmed, or when the event is cancelled. See [Email](email.md) and [Send email](../features/web/send-email.md).

## States

This entity has no lifecycle states.

**Kind** is a setting, matching the email it produces:

- **Registration submitted**
- **Registration confirmed**
- **Event cancelled**

See [Domain glossary](../system/domain-glossary.md).
