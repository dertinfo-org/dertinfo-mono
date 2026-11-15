---
name: Join a group with a pin
type: feature
status: active
updated: 2026-11-15
id: groups.join-by-pin
roles: [member, group-member]
---

# Feature: Join a group with a pin

## Description

A signed-in person can associate themselves with a [group](../../entities/group.md) by entering that group's member pin on the app. The association is for viewing that group's results. The profile lists every group they have joined, and a second pin adds another group without removing the first.

## User roles

- **member** — enter a pin and become associated with that group
- **group-member** — enter another group's pin and be associated with both

## Behaviour

- Home tells a signed-in person to open Profile and enter the pin their group was given, and that results stay hidden until the organisers publish them.
- Profile shows the signed-in person and a list headed **Your Groups**. A person who already belongs to a group sees that group there.
- **Enter Group Member Pin** asks for the pin. The prompt says that a valid pin adds the person to the group so they can view its results. **Cancel** leaves membership unchanged.
- **Save** on a valid pin adds that group. Groups already listed stay listed. The new group appears on the profile as soon as the pin is saved. The person does not sign in again.
- A pin that does not match a group does not add a group. The app says the pin is incorrect.

## Limitations

- The pin does not add the person to the group's member list used for [registration](../../entities/registration.md). A [group administrator](../../roles/group-admin.md) still maintains that list.
- Joining a group does not by itself show results. Results stay hidden until the competition is [published](../web/results-publish.md). What the person can see at a venue is [View own team dances](results-own-team-dances.md).
- Saving the pin is meant to apply the new group immediately. The profile still shows only the original group until the person signs in again. That is [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149). The scenario below is the required behaviour. The app test signs out and back in until that issue is fixed.

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Join a group with a pin
  As a group member
  I want to enter a group's member pin
  So that I can view that group's results as well as any group I already belong to

  Scenario: Group member sees the groups they already belong to
    Given the group member is signed in
    And the group member already belongs to a group
    When the group member opens their profile
    Then the profile lists that group

  Scenario: Group member joins a second group with its pin
    Given the group member is signed in
    And the group member already belongs to one group
    And another group has a member pin
    When the group member enters that pin and saves
    Then the profile lists both groups
    And the group member does not sign in again

  Scenario: Group member rejects an unknown pin
    Given the group member is signed in
    When the group member enters a pin that matches no group and saves
    Then no group is added
```
