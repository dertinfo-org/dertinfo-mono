---
name: Event
type: entity
status: active
updated: 2026-09-27
id: entity.event
---

# Entity: Event

## Description

A gathering, notably a Dert, that hosts [activities](activity.md) and [competitions](competition.md). An event administrator creates it from an event-type template. The template supplies the activity and competition structure for that event.

## What can be done

- **Create** — event-admin, via [Create event](../features/web/events-create.md). The wizard asks for an event type. The new event starts not configured.
- **Configure** — event-admin. Finishing setup moves the event to configured, including dates, location, contact, synopsis, and the activities and competitions from the template.
- **Promote** — event-admin. A promoted, configured event can appear in the public listing.
- **Open and close registration** — event-admin, by the registration open and close dates. Groups submit [registrations](registration.md) while registration is open.
- **Cancel** — event-admin. The event becomes cancelled. Its registrations become Cancelled, and the event-cancelled [email](email.md) can be sent for the registration states the organiser chooses.
- **Close** — event-admin. Confirmed registrations become Closed. New or Submitted registrations become Cancelled. See [Registration](registration.md).

## States

- **Not configured** — the event has been created and setup is not finished.
- **Configured** — setup is finished. Groups can register when the registration dates say registration is open.
- **Cancelled** — the event will not run. Registrations are cancelled.

**Promoted** is a setting: listed publicly, or not. **Visibility** is a setting: public, restricted, or private.

See [Domain glossary](../system/domain-glossary.md).
