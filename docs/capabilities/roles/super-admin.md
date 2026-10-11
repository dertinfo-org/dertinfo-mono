---
name: Super administrator
type: role
status: deprecated
updated: 2026-07-26
id: super-admin
---

# Role: Super administrator (deprecated)

## Summary

Historically a signed-in user with platform-wide administrative authority beyond group-, event-, venue-, or DoD-scoped roles.

## Status

**Deprecated — should be removed.**

- Do not treat this as a current product role for new capability design.
- Prefer scoped roles: [Group administrator](group-admin.md), [Event administrator](event-admin.md), [Venue administrator](venue-admin.md), [Dert of Derts administrator](dod-admin.md).
- Remaining code or Auth0 claims that grant “super admin” should be planned for removal rather than expanded.

## Capabilities (legacy)

- Auth: [Log out](../features/web/auth-logout.md), [Stay signed in](../features/web/auth-session-continuity.md)
- See also: [Deprecated super-admin privilege](../features/web/super-admin-deprecated.md)

## Limitations

- Not part of the intended long-term role model.
