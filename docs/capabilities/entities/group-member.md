---
name: Group member
type: entity
status: active
updated: 2026-10-04
id: entity.group-member
---

# Entity: Group member

## Description

A person on a [group](group.md)'s list. Members are not permanently assigned to teams. A guest is the same object with type guest: booked like a member, labelled as a non-dancer companion (for example a spouse), and the usual first cut when capacity is tight.

## What can be done

- **Add** — group-admin, via [Create and manage group](../features/web/groups-manage.md).
- **Update** — group-admin. Change the name, contact details, date of birth, date joined, and whether the person is a member or a guest. Attendances name the event and the ticket types.
- **Remove** — group-admin.
- **Include on a registration** — group-admin, while a [registration](registration.md) is still editable. Guests and dancers are both lines on that registration.

## States

This entity has no lifecycle states.

**Member type** is a setting: active member, or guest.

See [Domain glossary](../system/domain-glossary.md).
