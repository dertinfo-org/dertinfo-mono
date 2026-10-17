---
name: Homepage account
type: feature
status: active
updated: 2026-10-11
id: auth.homepage-account
roles: [public-user, member, group-member, group-admin, event-admin, venue-admin, dod-admin, super-admin]
---

# Feature: Homepage account

## Description

On the public homepage, a visitor with an active session sees their picture. A visitor without an active session sees **Register** and **Login**.

## User roles

- **public-user** — sees **Register** and **Login** when there is no active session
- **member**, **group-member**, **group-admin**, **event-admin**, **venue-admin**, **dod-admin**, **super-admin** — when their session is active, open the same account menu from the picture

## Behaviour

- With no active session, the homepage shows **Register** and **Login**.
- **Register** starts creating an account. **Login** starts sign-in.
- With an active session, the homepage shows that person's picture and nothing else beside it.
- The picture opens a menu. The email address is at the top, then a horizontal line, then **Dashboard**, **My account**, and **Log out**. Each of those has an icon to its left.
- The same menu is used from the signed-in pages.
- **Dashboard** opens the signed-in dashboard. **My account** opens the account. **Log out** ends the session — see [Log out](auth-logout.md).
- The rest of the homepage stays available whether or not a session is active.
- A session that is no longer active shows **Register** and **Login** again.
- After a successful sign-in, a later visit to the homepage shows the signed-in person.

## Limitations

- **Register** and **Login** are not shown while an active session is shown.
- The account menu is not shown without an active session.
- The homepage does not grant extra roles. It only reflects an active session and offers those three destinations.

## Scenarios

```gherkin
Feature: Homepage account
  As a visitor
  I want the homepage to show my account when I have an active session
  So that I can open my dashboard, my account, or log out

  Scenario: Visitor without a session sees register and login
    Given the visitor has no active session
    When the visitor opens the homepage
    Then the homepage shows Register and Login

  Scenario: Signed-in visitor sees their picture
    Given the visitor has an active session
    When the visitor opens the homepage
    Then the homepage shows their picture
    And the homepage does not show Register and Login

  Scenario: Signed-in visitor opens the account menu
    Given the visitor has an active session
    When the visitor opens the account menu from their picture
    Then the menu shows their email address
    And a line separates the email from the links
    And the menu offers Dashboard, My account, and Log out

  Scenario: Session that is no longer active shows register and login
    Given the visitor's session is no longer active
    When the visitor opens the homepage
    Then the homepage shows Register and Login
```
