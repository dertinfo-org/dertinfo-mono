---
name: Member
type: role
status: active
updated: 2026-07-26
id: member
---

# Role: Member

## Summary

A signed-in user of the platform. Any member may create a group; further powers depend on additional scoped roles.

## Capabilities

- [Log in](../features/web/auth-login.md) / [Log out](../features/web/auth-logout.md) / [Stay signed in](../features/web/auth-session-continuity.md)
- [User account and GDPR consent](../features/web/account-gdpr-consent.md)
- [Create and manage group](../features/web/groups-manage.md) — **create** a group only; managing requires group-admin
- [Dert of Derts](../features/web/dod-programme.md) — as the product allows
- [In-app notifications](../features/web/in-app-notifications.md) — rarely used

## Limitations

- Cannot manage a group without [Group administrator](group-admin.md).
- Event, venue, and DoD admin powers need the corresponding roles.
- Platform-wide [super-admin](super-admin.md) is **deprecated**.

See [Domain glossary](../system/domain-glossary.md).
