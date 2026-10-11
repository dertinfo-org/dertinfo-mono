---
name: Create and manage group
type: feature
status: active
updated: 2026-10-04
id: groups.manage
roles: [member, group-admin]
---

# Feature: Create and manage group

## Description

A signed-in user can **create** a **group** (sword-dancing club). Only **group administrators** can manage that group afterwards (members, teams, registrations, images, and related details).

## User roles

- **member** — any logged-in website user may **create** a new group (no extra restriction). Creating a group typically makes them a group admin for it.
- **group-admin** — **manage** groups they are authorised for. Ordinary group **members** cannot manage the group.

## Behaviour (group admin)

- A new group is not set up. Its dashboard card shows **Needs more information**. The card menu offers **Configure**, and opening the card starts group setup.
- After setup, that overlay is gone and the menu offers **Admin**.
- Creating a group already produces a team with the group's name. The group admin does not create that first team.
- View registrations for the group. See [Submit event registration](registration-submit.md). Each registration names the event, how many people and teams are on it, and whether it is still open.
- Add and remove **members** and **guests** from **Members & Guests**. They are the same record, distinguished by type. Edit their name, contact, date of birth, date joined, and member or guest. Their attendances name the event and the ticket types.
- Add and remove **teams**; update the team and its bio; see events that team attended with the group; choose a picture from the gallery for that team; delete a team.
- Upload images in **Gallery** and **Set Main**. That image is the one used on other pages where the group is shown. Images are processed by [Image handling](../../system/image-handling.md).
- **Settings** includes the email used for correspondence for the group.
- **Privacy Settings** are **Public** (the group may appear on the public website), **Private** (it does not appear on any public part of the website), or **Restricted** (it is shared only with consent).
- **Edit registrations** while they are still open — registrations stop being editable by the group once an **event admin confirms** the registration.
- Cannot create an **event** — see [Create event](events-create.md).

## Behaviour (viewing the group)

- A configured group on the dashboard offers **View**. That opens the group without the admin sections: the name, the description, and the events the group is registered for.
- A group administrator on that screen can switch to the admin sections.
- Opening an event there shows that group's registration for it, including the teams and activities. When results are published, the group's own marking sheets are shown. Until then, the screen says results are not yet published.

## Limitations

- Group members without admin rights cannot manage members, teams, images, or registrations.
- Confirmed registrations are no longer editable by the group admin.
- A group that is not set up can still be registered. Stopping that is future work and is not a smoke check.

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: Create and manage group
  As a group administrator
  I want to set up my group
  So that it can take part in events

  Scenario: Group administrator creates a group
    Given the group administrator is signed in
    When the group administrator adds a group
    Then the group is created

  Scenario: Group is not set up
    Given the group administrator has created a group
    And setup is not finished
    When the group administrator views the dashboard card
    Then the card shows Needs more information
    And the menu offers Configure
    And opening the card starts group setup

  Scenario: Group administrator finishes setup
    Given the group is not set up
    When the group administrator finishes group setup
    Then the Needs more information overlay is gone
    And the menu offers Admin

  Scenario: Group administrator adds a member
    Given the group is set up
    When the group administrator adds a member on Members and Guests
    Then the member is on the group
    And the member is Homer Simpson

  Scenario: Group administrator adds a guest
    Given the group is set up
    When the group administrator adds a guest on Members and Guests
    Then the guest is on the group
    And the guest is Marge Simpson

  Scenario: Group already has its default team
    Given the group is set up
    When the group administrator opens Teams
    Then the list already contains a team named the same as the group

  Scenario: Group administrator adds a team
    Given the default team is already there
    When the group administrator adds a second team from Teams
    Then the second team is on the group

  Scenario: Group administrator uploads an image
    Given the group administrator has created a group
    When the group administrator uploads a photo
    Then the photo appears in the group gallery

  Scenario: Group administrator sets the default image
    Given the group gallery has an uploaded photo
    When the group administrator sets that photo as the main image
    Then that image is the one used where the group is shown

  Scenario: Group administrator edits members and guests
    Given the group has a member and a guest
    When the group administrator edits their details on Members and Guests
    Then the details are saved
    And their attendances at events the group has attended are visible

  Scenario: Group administrator edits a team
    Given the group has a second team
    And the gallery has an image
    When the group administrator edits the team and its bio
    Then the team shows the events it attended with the group
    And the group administrator can choose a different gallery picture for that team

  Scenario: Group administrator edits group settings
    Given the group is set up
    When the group administrator opens Settings and changes the correspondence email
    Then the email is saved

  Scenario: Group administrator sets privacy
    Given the group is set up
    When the group administrator opens Privacy Settings
    Then Public means the group may appear on the public website
    And Private means the group does not appear on any public part of the website
    And Restricted means the group is shared only with consent
    And the chosen setting is saved
```

