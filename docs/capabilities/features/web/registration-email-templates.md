---
name: Registration email templates
type: feature
status: active
updated: 2026-09-27
id: registration.email-templates
roles: [event-admin, group-admin]
---

# Feature: Registration email templates (additional)

Supporting capability for registration and invoicing — important and widely used, documented here as an **additional** feature rather than a primary domain.

## Description

Events use email templates that are sent automatically (or available when needed) around registration lifecycle.

## Templates

| Template | When | Content focus |
|----------|------|----------------|
| **Registration submitted** | Automatic when a group submits a registration | Summary of requested team/member activities and tickets |
| **Registration confirmed** | Automatic when an event admin confirms a registration | Invoice, pricing, and how the group admin should pay |
| **Event cancelled** | When an event must be cancelled | Cancellation communication |

## User roles

- **group-admin** — receives submitted/confirmed (and cancellation) emails for their registrations
- **event-admin** — from a configured event, open **Email Templates**, choose a template, and edit it

## Behaviour

- From the event home, **Email Templates** offers **Registration Submission**, **Registration Confirmation**, and **Event Cancelled**.
- For the chosen template, the event administrator can change the template name, the subject, and the body, then save.
- Submitted and confirmed emails are tied to [Submit event registration](registration-submit.md) and [Confirm registrations](registration-confirm.md).
- Confirmed email supports the [Invoicing](invoicing.md) path.
- Delivery uses the platform [Send email](send-email.md) capability (SendGrid or Mailgun).

## Scenarios

```gherkin
Feature: Registration email templates
  As an event administrator
  I want to edit the emails sent during registration
  So that the wording matches the event

  Scenario: Event administrator edits the registration submission email
    Given the event is set up
    When the event administrator opens Email Templates
    And chooses Registration Submission
    And changes the template name, subject, and body
    And saves
    Then the registration submission template shows the saved wording

  Scenario: Event administrator edits the registration confirmation email
    Given the event is set up
    When the event administrator opens Email Templates
    And chooses Registration Confirmation
    And changes the template name, subject, and body
    And saves
    Then the registration confirmation template shows the saved wording

  Scenario: Event administrator edits the event cancelled email
    Given the event is set up
    When the event administrator opens Email Templates
    And chooses Event Cancelled
    And changes the template name, subject, and body
    And saves
    Then the event cancelled template shows the saved wording
```


## Limitations

- There is no local mailbox in this estate. Saving a template is checked on the template screen. The sent emails are not checked from the website.
