---
name: Venue score capture
type: feature
status: active
updated: 2026-10-11
id: scoring.venue-capture
roles: [venue-admin, event-admin]
---

# Feature: Venue score capture

## Description

During competition, scores for a dance can be entered live and printed judge score sheets photographed and uploaded (typically via the **app**).

## User roles

- **venue-admin** — capture scores and score-sheet images for venues they administer
- **event-admin** — may also perform live score entry at the venue

## Behaviour

- For a given **dance** at a venue, enter scores (judge × score category × dance).
- Photograph filled-in printed score sheets and upload them.
- Enables rapid capture so scores can be reviewed centrally.

## Limitations

- Captured scores are not final until [validated](../web/scoring-validate.md).
- Once scores have been **checked/validated**, the **venue admin can no longer change** those scores or score sheets.
- **Publishing** results is exclusively an event-admin function — see [Publish competition results](../web/results-publish.md).

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Venue score capture
  As a venue administrator
  I want to enter scores and photograph the marking sheets for a dance
  So that the dance can be reviewed centrally

  Scenario: Venue administrator signs in
    Given the venue administrator is not signed in
    When the venue administrator signs in on the app
    Then the app shows that they are signed in

  Scenario: Venue administrator opens the first dance awaiting scores
    Given the venue administrator is signed in
    When the venue administrator opens the first venue
    And opens the first dance still awaiting scores
    Then that dance is open

  Scenario: Venue administrator rejects an out-of-range score
    Given a dance is open and awaiting scores
    When the venue administrator enters a mark above that category's maximum
    Then the mark is rejected
    And Send Scores stays disabled
    When the mark is corrected to a valid score
    Then Send Scores can be used

  Scenario: Venue administrator sends the scores
    Given every category has a valid mark
    When the venue administrator sends the scores
    Then the app asks for the marking-sheet photos

  Scenario: Venue administrator photographs the score sheets
    Given the scores have been sent
    When the venue administrator takes two marking-sheet photos
    Then both photos appear as resized images

  Scenario: Venue administrator confirms the dance is completed
    Given the scores and photos have been captured
    When the venue administrator returns to the dance list
    Then that dance is under Completed Dances
    And it is no longer under Expected Dances

  Scenario: Venue administrator confirms the scores and photos remain
    Given the dance is completed
    When the venue administrator opens that dance again
    Then the marks are the marks that were sent
    And both photos are still there
```
