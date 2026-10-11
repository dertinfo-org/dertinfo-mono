---
name: User account and GDPR consent
type: feature
status: active
updated: 2026-09-27
id: account.gdpr-consent
roles: [member, group-admin, event-admin]
---

# Feature: User account and GDPR consent

## Description

Signed-in users manage account-related information and must accept the website terms and give GDPR consent. The platform operates as a **data processor**; **event administrators** are **data owners** (controllers) for event-related personal data. Users agree to the site’s terms and conditions, which are available in the [public content](public-content.md) section of the website.

## User roles

- **member** (and other signed-in users) — provide / maintain consent and account settings as required
- **event-admin** — data owners for personal data processed in the context of their events (organisational responsibility; not a separate “consent UI” for them)

## Behaviour

- Users are asked for **GDPR consent** consistent with the platform’s processor role.
- Consent is tied to acceptance of the website **terms and conditions** (publicly available).
- The left-hand menu **user account**, and the name and gravatar icon, both open the same profile and account settings. The signed-in user can see the contact information the site holds.
- On **User Settings** the user can add a first name, a surname (labelled **Family name**), and a telephone number, then save.
- On **Manage Account** the user can delete the account. Personally identifiable information is obfuscated. Attendance and other activity data can remain for reporting.

## Limitations

- Cookie consent for anonymous browsing is separate — see [Cookie consent](cookie-consent.md).
- Exact legal wording lives in the public terms / data policy pages.
- Deleting an account is checked with a disposable signed-in user. It is not run against the shared smoke event administrator or group administrator.

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

```gherkin
Feature: User account and GDPR consent
  As a signed-in user
  I want to see and update my account
  So that the site holds the right contact details

  Scenario: User opens their account from the left-hand menu
    Given the user is signed in
    When the user selects their user account in the left-hand menu
    Then the contact information the site holds is shown

  Scenario: User opens their account from the name icon
    Given the user is signed in
    When the user selects the icon that shows their name and gravatar
    Then profile and account settings open
    And that is the same place as the user account in the left-hand menu

  Scenario: User adds their name and telephone
    Given the user is on account settings
    When the user adds a first name, a surname, and a telephone number
    And saves
    Then those contact details are shown

  Scenario: User deletes their account
    Given a disposable signed-in user who is not a shared smoke administrator
    When the user opens Manage Account and deletes the account
    Then references to that user are anonymized
```

