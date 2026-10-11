---
name: Platform capability catalogue
type: index
status: active
updated: 2026-09-27
---

# Platform capability catalogue

Describes **WHAT** the platform can do for sword-dancing clubs, Dert events, and related programmes. Detached from technical implementation.

Start with the [Domain glossary](system/domain-glossary.md).

## Structure

- [Roles](roles/) — who can act
- [Features](features/) — user-facing capabilities. Website features are in [web](features/web/). App features are in [app](features/app/).
- [Entities](#entities) — objects in the platform, and how features change them
- [System](system/) — cross-cutting behaviour and glossary
- Inventory: [`capabilities.yaml`](capabilities.yaml)

## Primary features

| Area | Features |
|------|----------|
| Groups & events | [Create and manage group](features/web/groups-manage.md), [Create event](features/web/events-create.md) |
| Registration & money | [Submit registration](features/web/registration-submit.md), [Confirm registrations](features/web/registration-confirm.md), [Invoicing](features/web/invoicing.md) |
| Competition day | [Run competitions](features/web/competitions-run.md), [Venue score capture](features/app/venue-score-capture.md), [Validate scores](features/web/scoring-validate.md), [Publish results](features/web/results-publish.md) |
| Public & DoD | [Public content](features/web/public-content.md), [Cookie consent](features/web/cookie-consent.md), [Dert of Derts](features/web/dod-programme.md) |
| Account & consent | [User account and GDPR consent](features/web/account-gdpr-consent.md) |
| Messaging | [Send email](features/web/send-email.md), [In-app notifications](features/web/in-app-notifications.md) (rarely used) |
| Auth | [Log in](features/web/auth-login.md), [Log out](features/web/auth-logout.md), [Stay signed in](features/web/auth-session-continuity.md) |

## Entities

Objects in the platform. Each page says what the object is, what can be done to it, and which states it can be in. Short definitions stay in the [Domain glossary](system/domain-glossary.md).

| Area | Entities |
|------|----------|
| Groups | [Group](entities/group.md), [Group member](entities/group-member.md), [Team](entities/team.md) |
| Events and registration | [Event](entities/event.md), [Activity](entities/activity.md), [Registration](entities/registration.md), [Invoice](entities/invoice.md), [Email](entities/email.md), [Email template](entities/email-template.md) |
| Competition day | [Competition](entities/competition.md), [Venue](entities/venue.md), [Dance](entities/dance.md), [Judge](entities/judge.md), [Score](entities/score.md), [Score category](entities/score-category.md), [Score set](entities/score-set.md), [Marking sheet](entities/marking-sheet.md) |
| Shared | [Image](entities/image.md) |
| Dert of Derts | [Submission](entities/dod-submission.md), [Result](entities/dod-result.md) |

## System

- [Domain glossary](system/domain-glossary.md)
- [Authenticated session](system/authenticated-session.md)
- [Image handling](system/image-handling.md) — resize uploads for reuse across the app

## Additional

- [Registration email templates](features/web/registration-email-templates.md) — supporting templates for submit / confirm / cancel

## Deprecated

- [Super administrator](roles/super-admin.md) / [Super-admin privilege](features/web/super-admin-deprecated.md) — should be removed

Roles may combine on one account. Auth0 claim mapping: [Authentication](../technical/subsystems/authentication.md).

## How to update

1. Edit markdown (role / feature / entity / system).
2. Update `capabilities.yaml` with the same `id`.
3. Do not regenerate markdown from YAML.
4. Keep descriptions implementation-free.

See [Documentation guide](../documentation-guide.md).
