---
name: Submit event registration
type: feature
status: active
updated: 2026-10-17
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
- Opening an available event starts registration. The registration is not created until the terms are agreed. The steps are overview, tickets and pricing, teams and people, activities, summary, and terms.
- **Overview** shows the event name, its dates, and its location. The event picture is shown when the event has one.
- **Tickets and pricing** lists the published tickets for individuals and the published tickets for teams. Each row shows the ticket name, the description, the price, and whether it is available or sold out. Prices are withheld until registration has opened, and they are withheld again after registration has closed, after the event has started, or when the event is private.
- **Teams and people** lists the group's existing teams, members, and guests. The administrator ticks who is coming. New people and teams are not created here. Each list shows five rows at first, can be searched, and can show the rest. A tick stays when that row is hidden. The number of selected teams and the number of selected people are shown.
- **Activities** lists each selected team with the team tickets, and each selected person with the individual tickets. A team or a person can take more than one ticket. A default ticket that is not sold out starts ticked. A sold-out ticket stays visible and cannot be ticked. Teams and people are separate lists.
- **Summary** lists each ticked ticket: who is attending, whether they are a team, a member, or a guest, the ticket, and the price. The total of the known prices is shown. A price that is still to be confirmed is left out of that total.
- Agreeing to the terms and submitting creates the registration and opens it. The registration is **New**. A registration can be created with nobody ticked.
- From the group homepage, **Active** opens that registration. Add a member from the members tab, a guest from the guests tab, and a team from the attending-teams tab.
- The individual activity is offered to the member and the guest. The team activity is offered to the team.
- Edit the registration while it is still **New**, and see the change saved.
- **Submit** changes the status to **Submitted**.
- The group administrator can still change a **Submitted** registration. Editing stops once an event admin **confirms** it.
- Submission notifies event admins that a registration is ready to inspect.
- A **registration submitted** email is sent automatically — see [Registration email templates](registration-email-templates.md) and [Send email](send-email.md).

## Limitations

- Confirmation, invoicing, and capacity decisions are event-admin capabilities — see [Confirm registrations](registration-confirm.md).
- A group that is not set up cannot register. An event that is not set up is not listed under **Available / New** and cannot be registered for.
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

  Scenario: Group administrator reviews the event before registering
    Given a registration is available for the group
    When the group administrator opens the event registration
    Then the event name, dates, and location are shown
    And the event picture is shown when the event has one

  Scenario: Group administrator sees published tickets
    Given the group administrator is registering for an event
    Then tickets for individuals and tickets for teams are listed
    And each ticket shows its name, description, price, and whether it is available

  Scenario: Group administrator chooses teams and people
    Given the group has teams, members, and guests
    When the group administrator ticks a team and a person
    Then those choices stay ticked
    And five rows are shown at first
    And the list can be searched
    And the number selected is shown

  Scenario: Group administrator chooses tickets
    Given teams and people have been ticked
    Then each selected team is offered the team tickets
    And each selected person is offered the individual tickets
    And a default ticket that is not sold out starts ticked
    And a sold-out ticket is shown and cannot be ticked

  Scenario: Group administrator reviews the registration summary
    Given tickets have been ticked
    Then the summary names who is attending, whether they are a team, a member, or a guest, the ticket, and the price
    And the total of the known prices is shown

  Scenario: Group administrator creates the registration
    Given the group administrator has agreed to the terms
    When the group administrator submits the registration
    Then the registration is created
    And the registration is left New

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

