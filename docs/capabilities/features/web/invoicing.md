---
name: Invoicing and payment status
type: feature
status: active
updated: 2026-10-03
id: invoicing.payment-status
roles: [event-admin, group-admin]
---

# Feature: Invoicing and payment status

## Description

When registrations are confirmed, invoices are created for groups. Event administrators mark invoices paid; group administrators can see that payment has been received.

## User roles

- **event-admin** — mark invoices paid (or unpaid) for their events
- **group-admin** — view invoice and payment status for their group

## Behaviour

- Invoices are produced on registration confirmation (with pricing and payment instructions in the confirmed email).
- From the event home, **Invoices & Payments** lists invoices for confirmed registrations. Each shows the registration total, the invoice total, the team, and **Received** or **Not yet received**.
- Event admin marks an invoice received when payment arrives. The group admin sees that mark.
- From the group homepage, **Invoices & Payments** lists what the group owes events, each **Received** or **Not yet received**.

## Limitations

- This capability describes status tracking in the platform, not a specific payment provider.

See [Confirm registrations](registration-confirm.md) and [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Invoicing and payment status
  As an event administrator
  I want to see invoices for confirmed registrations
  So that I can see who is coming, the revenue, and the teams

  Scenario: Event administrator reviews invoices
    Given a registration has been confirmed
    When the event administrator opens Invoices and Payments from the event home
    Then the invoice shows the registration total and the invoice total
    And the invoice shows the team
    And the invoice shows Received or Not yet received

  Scenario: Group administrator reviews invoices
    Given the event administrator can see the confirmed registration invoice
    When the group administrator opens Invoices and Payments from the group homepage
    Then the invoice shows Received or Not yet received
    And that mark matches whether the event administrator has marked it received
```

