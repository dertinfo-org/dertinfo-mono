---
name: Authenticated session
type: system
status: active
updated: 2026-07-26
id: system.authenticated-session
roles: [member, group-member, group-admin, event-admin, venue-admin, dod-admin, super-admin]
---

# System capability: Authenticated session

## Purpose

The platform can recognise a signed-in user for the duration of a valid session and associate subsequent actions with that user.

## Behaviour

- After [log in](../features/web/auth-login.md), the platform treats the user as authenticated.
- [Stay signed in](../features/web/auth-session-continuity.md) describes continuity across navigations.
- [Log out](../features/web/auth-logout.md) ends the session.

## Dependencies

None at the capability layer (see technical docs for how sessions are implemented).

## Security considerations

- Session continuity must not elevate privileges beyond the user’s roles.
- Ending a session must revoke access to protected capabilities.

> Starter stub — implementation-free; expand during reverse-engineering.
