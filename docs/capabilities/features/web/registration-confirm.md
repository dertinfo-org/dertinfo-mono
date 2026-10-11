---
name: Confirm registrations
type: feature
status: active
updated: 2026-10-03
id: registration.confirm
roles: [event-admin]
---

# Feature: Confirm registrations

## Description

Event administrators inspect submitted registrations during the registration period and, when capacity allows, confirm them. Confirmation creates invoices for group secretaries.

## User roles

- **event-admin** — inspect and confirm registrations for their events

## Behaviour

- Review submitted (unconfirmed) registrations from groups.
- At the end of the registration period, decide capacity; confirm registrations when appropriate.
- Confirmation creates **invoices** and triggers the **registration confirmed** email (invoice, pricing, how to pay) — see [Registration email templates](registration-email-templates.md), [Send email](send-email.md), and [Invoicing](invoicing.md).
- If attendance must be reduced, organisers typically ask groups to cut **guests** before dancers.

## Limitations

- Groups cannot confirm their own registrations.
- Payment collection is outside automated card capture in this overview; marking paid is separate — see [Invoicing](invoicing.md).

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Confirm registrations
  As an event administrator
  I want to confirm a submitted registration
  So that the group is accepted and can no longer edit it

  Scenario: Event administrator confirms a registration
    Given a registration is Submitted
    And the group administrator has amended it since submit
    When the event administrator confirms it
    Then the registration is confirmed
    And the group administrator can no longer edit it
```

