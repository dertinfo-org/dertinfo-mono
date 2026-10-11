---
name: Stay signed in
type: feature
status: active
updated: 2026-09-27
id: auth.session-continuity
roles: [member, group-member, group-admin, event-admin, venue-admin, dod-admin, super-admin]
---

# Feature: Stay signed in

## Description

A signed-in user can continue using the platform across page loads and within a session window without signing in again every time, until the session ends or they sign out.

## User roles

- **member**, **group-member**, **group-admin**, **event-admin**, **venue-admin**, **dod-admin**, **super-admin**

## Behaviour

- Returning to the client within a valid session keeps the user authenticated.
- Session end or [log out](auth-logout.md) requires sign-in again for protected actions.

## Limitations

- Does not grant roles the user does not have; only preserves an existing authenticated state.

> Starter stub — implementation-free; expand during reverse-engineering.

## Scenarios

```gherkin
Feature: Stay signed in
  As a visitor with a rejected session
  I want the site to leave a stale sign-in
  So that I can sign in again

  Scenario: Rejected cache returns to sign-in
    Given the browser has an Auth0 cache the tenant will reject
    When the visitor opens the dashboard
    Then the site leaves Warming up for the sign-in page
```

