---
name: Create event
type: feature
status: active
updated: 2026-10-03
id: events.create
roles: [event-admin]
---

# Feature: Create event

## Description

An event administrator can create a new **event** (e.g. a Dert) from the dashboard using a wizard and an **event type** template that defines the activity and competition structure.

## User roles

- **event-admin** — create and then administer events they are authorised for

## Behaviour

- From the dashboard, start **Create New Event**.
- Follow the wizard and choose an **event type**.
- The event type supplies a predefined template for activities and competitions for that event.
- A new event is not set up. Its dashboard card shows **Needs more information**, and the menu offers **Configure**.
- Until that setup is finished, the event is not offered to groups under **Registrations** → **Available / New**, and a group cannot open a registration for it.
- Setup collects dates, contact name, telephone, registration open and close, the event type, and acceptance of the terms. Submit lands on the event screen.
- From the event home, the administrator can change the event details and dates, including when registration opens and the event date, and save them.
- The event **Overview** shows how many members and guests, teams, and registrations are coming.
- **Gallery** shows the event images. The administrator can upload a photo and **Set Main** so that image is the public event image.
- **Activities** can include an individual activity and a team activity. See [Submit event registration](registration-submit.md).

## Limitations

- Ordinary members cannot create events unless they have event-admin authority (typically provisioned for organisers).

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Create event
  As an event administrator
  I want to create and set up an event
  So that groups can register for it

  Scenario: Event administrator creates an event
    Given the event administrator is signed in
    When the event administrator adds an event
    Then the event is created

  Scenario: Event is not set up
    Given the event administrator has created an event
    And setup is not finished
    When the event administrator views the dashboard card
    Then the card shows Needs more information
    And the menu offers Configure

  Scenario: Event administrator finishes setup
    Given the event is not set up
    When the event administrator enters the dates, contact name, and telephone
    And sets registration open and registration close
    And chooses event type Dancing England Rapper Tournament(Standard)
    And accepts the terms
    And submits setup
    Then the event screen is shown

  Scenario: Event administrator adds activities
    Given the event is set up
    When the event administrator adds one individual activity and one team activity
    Then both activities are on the event

  Scenario: Event administrator edits details and dates
    Given the event is set up
    When the event administrator changes when registration opens and the event date
    And saves
    Then the saved dates are shown

  Scenario: Event overview shows who is coming
    Given the event is set up
    When the event administrator opens the event homepage
    Then the overview shows the number of members and guests
    And the number of teams
    And the number of registrations

  Scenario: Event administrator sets the event image
    Given the event is set up
    When the event administrator opens Gallery and uploads a photo
    And sets that photo as the main image
    Then that image is the event image
```

