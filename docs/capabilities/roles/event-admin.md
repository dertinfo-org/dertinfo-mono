---
name: Event administrator
type: role
status: active
updated: 2026-10-11
id: event-admin
---

# Role: Event administrator

## Summary

Administers one or more **events** (e.g. Dert): create event, registrations, invoicing, competitions, score validation, reporting, and publishing results. Typical website “organiser” role.

## Capabilities

- [Create event](../features/web/events-create.md)
- [Confirm registrations](../features/web/registration-confirm.md)
- [Invoicing and payment status](../features/web/invoicing.md) — mark invoices paid
- [Registration email templates](../features/web/registration-email-templates.md)
- [Run competitions](../features/web/competitions-run.md)
- [Venue score capture](../features/app/venue-score-capture.md) — may also enter scores live at a venue
- [Validate scores](../features/web/scoring-validate.md)
- [Publish competition results](../features/web/results-publish.md)
- [Send email](../features/web/send-email.md) — registration and related outbound mail
- [In-app notifications](../features/web/in-app-notifications.md) — rarely used
- Auth: [Log out](../features/web/auth-logout.md), [Stay signed in](../features/web/auth-session-continuity.md), [Homepage account](../features/web/homepage-account.md)

## Limitations

- After scores are checked, venue admins can no longer edit those scores/sheets.
- A separate “competition admin” role is not used in current practice.
- As **data owners** for event-related personal data, event admins hold organisational responsibility under GDPR — see [User account and GDPR consent](../features/web/account-gdpr-consent.md).

See [Domain glossary](../system/domain-glossary.md).
