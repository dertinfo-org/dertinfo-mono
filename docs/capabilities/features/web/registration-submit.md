---
name: Submit event registration
type: feature
status: active
updated: 2026-10-03
id: registration.submit
roles: [group-admin, group-member]
---

# Feature: Submit event registration

## Description

A group secretary or administrator registers their group for an event by choosing team and member activities (and guests where needed), then submitting. Submission is not the same as confirmation.

## User roles

- **group-member** — from the group homepage, open **Registrations** and see **Available / New** events that can be registered for
- **group-admin** — open, fill, submit, and amend registrations for groups they administer

## Behaviour

- From the group homepage, **Registrations** then **Available / New** lists configured events whose registration open date is before today and whose registration close date is after today.
- When a registration is available, the group administrator proceeds to the group registration configuration and leaves the registration **New**.
- From the group homepage, **Active** opens that registration. Add a member from the members tab, a guest from the guests tab, and a team from the attending-teams tab.
- The individual activity is offered to the member and the guest. The team activity is offered to the team.
- Edit the registration while it is still **New**, and see the change saved.
- **Submit** changes the status to **Submitted**.
- The group administrator can still change a **Submitted** registration. Editing stops once an event admin **confirms** it.
- Submission notifies event admins that a registration is ready to inspect.
- A **registration submitted** email is sent automatically — see [Registration email templates](registration-email-templates.md) and [Send email](send-email.md).

## Limitations

- Confirmation, invoicing, and capacity decisions are event-admin capabilities — see [Confirm registrations](registration-confirm.md).
- A group that is not set up can still register. An event that is not set up is not listed under **Available / New** and cannot be registered for.
- There is no local mailbox in this estate. Submission is checked on the registration screen. The registration-submitted emails are not checked from the website.

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Submit event registration
  As a group administrator
  I want to register my group for an event
  So that the event knows we intend to attend

  Scenario: Group administrator sees events available for registration
    Given the group administrator is on the group homepage
    When the group administrator opens Registrations and Available / New
    Then a configured event is listed when its registration open date is before today
    And its registration close date is after today

  Scenario: Group administrator opens a registration
    Given a registration is available for the group
    When the group administrator proceeds to the group registration configuration
    Then the registration is left New

  Scenario: Group administrator adds a member to the registration
    Given the registration is New
    When the group administrator adds a member from the members tab
    Then the member is on the registration

  Scenario: Group administrator adds a guest to the registration
    Given the registration is New
    When the group administrator adds a guest from the guests tab
    Then the guest is on the registration

  Scenario: Group administrator adds a team to the registration
    Given the registration is New
    When the group administrator adds a team from the attending-teams tab
    Then the team is on the registration

  Scenario: Group administrator assigns activities
    Given the registration has one member, one guest, and one team
    And the event has an individual activity and a team activity
    Then the individual activity is offered to the member and the guest
    And the team activity is offered to the team

  Scenario: Group administrator edits a new registration
    Given activities have been assigned
    When the group administrator changes the registration
    Then the change is saved
    And the registration is still New

  Scenario: Group administrator submits the registration
    Given the registration has been edited while New
    When the group administrator opens it from the group homepage under Active
    And submits it
    Then the status is Submitted

  Scenario: Group administrator amends a submitted registration
    Given the registration is Submitted
    And it has not been confirmed
    When the group administrator changes it
    Then the change is saved
```

