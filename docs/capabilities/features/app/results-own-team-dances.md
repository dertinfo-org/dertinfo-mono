---
name: View own team dances
type: feature
status: active
updated: 2026-11-15
id: results.own-team-dances
roles: [group-member, group-admin]
---

# Feature: View own team dances

## Description

On the app, a person associated with one or more [groups](../../entities/group.md) can open a [venue](../../entities/venue.md) and see the [dances](../../entities/dance.md) of the teams in those groups. Dances for every other team stay hidden. Results for a dance stay hidden until that competition is published.

## User roles

- **group-member** — see the dances of the teams in the groups they have joined
- **group-admin** — see the dances of the teams in the groups they administer, in the same way

## Behaviour

- The menu names the venue currently being looked at. Opening that venue shows its dances for the person's groups.
- Each listed dance is identified by its team.
- The list includes a dance for each team that belongs to a group the person has joined, at that venue. A person in two groups sees both groups' teams. A person in one group does not see the other group's team.
- Opening a dance whose competition is not [results published](../web/results-publish.md) does not show the scores or the score sheets. The dance itself remains listed.
- After results are published, the person can see the scores and score sheets for those same teams only. See [Publish competition results](../web/results-publish.md).
- Joining another group with its pin widens the list to that group's teams. See [Join a group with a pin](groups-join-by-pin.md). The wider list is meant to be available as soon as the pin is saved. Until [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149) is fixed, the new teams appear after the person signs in again.

## Limitations

- This is not [venue score capture](venue-score-capture.md). A group member does not enter marks or take score-sheet photos.
- Dances at a venue the person is not looking at are not listed.
- Teams are not chosen one by one. Membership is of the group, and every team of that group at the venue is included.

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: View own team dances
  As a group member
  I want to see the dances of the teams in my groups
  So that I can follow those teams and see their results only when they are published

  Scenario: Group member sees only their own team's dance
    Given the group member belongs to one group
    And that group's team has a dance at the venue
    And another group's team also has a dance at the same venue
    When the group member opens that venue
    Then the group's own team dance is listed
    And the other group's dance is not listed

  Scenario: Unpublished results stay hidden
    Given the group member can see their team's dance
    And that competition's results are not published
    When the group member opens the dance
    Then the results are not shown

  Scenario: Group member sees a dance for each group they have joined
    Given the group member belongs to two groups
    And each group has a team with a dance at the venue
    When the group member opens that venue
    Then both teams' dances are listed
    And no dance from any other group is listed
```
