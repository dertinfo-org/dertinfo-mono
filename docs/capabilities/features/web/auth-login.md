---
name: Log in
type: feature
status: active
updated: 2026-10-03
id: auth.login
roles: [public-user, member, group-admin, event-admin]
---

# Feature: Log in

## Description

A visitor can authenticate and become a signed-in user of the platform.

## User roles

- **public-user** — can start sign-in
- **member** — result of a successful sign-in (and higher roles inherit signed-in behaviour)
- **group-admin** — signs in with the group administrator account
- **event-admin** — signs in with the event administrator account

## Behaviour

- User can initiate sign-in from the client experiences that support it.
- After successful sign-in, the user is treated as authenticated for subsequent actions that require it.

## Limitations

- Unauthenticated users cannot access member-only or administrator capabilities.

> Starter stub — implementation-free; expand during reverse-engineering.

## Scenarios

```gherkin
Feature: Log in
  As an event administrator
  I want to log into my account
  So that I can access my dashboard

  Scenario: Event administrator signs in
    Given the event administrator is on the login page
    When the event administrator enters valid credentials
    Then the event administrator should see the dashboard

  Scenario: Group administrator signs in
    Given the group administrator is on the login page
    When the group administrator enters valid credentials
    Then the group administrator should see the dashboard
```

