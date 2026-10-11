---
name: Group
type: entity
status: active
updated: 2026-10-04
id: entity.group
---

# Entity: Group

## Description

A sword-dancing club. A group has members, teams, images, and registrations for events. Any signed-in user can create a group and becomes its group administrator.

## What can be done

- **Create** — member, via [Create and manage group](../features/web/groups-manage.md). The new group starts not configured, and the creator becomes a group admin for it.
- **Configure** — group-admin. Finishing the group's details moves it from not configured to configured.
- **Manage members and teams** — group-admin. Add and remove [group members](group-member.md) and [teams](team.md), including guests.
- **Upload images** — group-admin. Pictures are resized for reuse by [Image handling](../system/image-handling.md). See [Image](image.md).
- **View** — member or group-admin. From the dashboard, **View** opens the group without the admin sections: the name, the description, and the events the group is registered for. A group administrator can switch from there into admin. Opening an event shows that registration. Published marking sheets for the group's own team are on that screen. See [Publish competition results](../features/web/results-publish.md).
- **View registrations** — group-admin. See [Registration](registration.md).
- **Delete** — group-admin. Active registrations for the group become Cancelled.

## States

- **Not configured** — the group has been created and setup is not finished.
- **Configured** — setup is finished.

**Visibility** is a setting: **public** (may appear on the public website), **private** (does not appear on any public part of the website), or **restricted** (shared only with consent).

See [Domain glossary](../system/domain-glossary.md).
