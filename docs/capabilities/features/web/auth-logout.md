---
name: Log out
type: feature
status: active
updated: 2026-07-26
id: auth.logout
roles: [member, group-member, group-admin, event-admin, venue-admin, dod-admin, super-admin]
---

# Feature: Log out

## Description

A signed-in user can end their authenticated session and return to an unauthenticated state.

## User roles

- Any signed-in role (**member**, **group-member**, **group-admin**, **event-admin**, **venue-admin**, **dod-admin**, **super-admin**) can sign out

## Behaviour

- User can explicitly end the session.
- After sign-out, member-only and administrator capabilities are no longer available until sign-in again.

## Limitations

- Public (unauthenticated) users have no session to end.

> Starter stub — implementation-free; expand during reverse-engineering.
