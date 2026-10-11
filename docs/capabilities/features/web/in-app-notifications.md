---
name: In-app notifications
type: feature
status: active
updated: 2026-09-27
id: messaging.in-app-notifications
roles: [member, group-admin, event-admin]
---

# Feature: In-app notifications

## Description

The platform can show **in-app notifications** to signed-in users (for example in the website shell). The capability exists in the product but is **rarely used** in practice.

## User roles

- Signed-in users may receive or view notifications where enabled
- System / event administration may create or manage notification content where the product supports it

## Behaviour

- A signed-in user selects the notifications icon and a side page of their notifications becomes visible.
- Not a primary day-to-day workflow for most organisers or groups.

## Limitations

- Rarely used — do not assume organisers rely on it.
- Outbound email remains the main automated communication path — see [Send email](send-email.md) and [Registration email templates](registration-email-templates.md).

## Scenarios

```gherkin
Feature: In-app notifications
  As a signed-in user
  I want to open my notifications
  So that I can see them

  Scenario: User opens notifications
    Given the user is signed in
    When the user selects the notifications icon
    Then a side page of their notifications is visible
```

