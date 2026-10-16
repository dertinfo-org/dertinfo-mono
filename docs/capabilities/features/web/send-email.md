---
name: Send email
type: feature
status: active
updated: 2026-10-16
id: messaging.send-email
roles: [event-admin, group-admin]
---

# Feature: Send email

## Description

The platform can send transactional and notification emails (for example registration lifecycle messages) through a configured third-party email provider.

## Providers

Either of the following may be used when an active account is configured:

- **SendGrid**
- **Mailgun**

## User roles

- Triggered by platform workflows (e.g. registration submit/confirm) rather than as a free-form “compose email” capability for every user.
- Event and group admins experience emails as recipients (and event admins may maintain related [registration email templates](registration-email-templates.md)).

## Behaviour

- Outbound email is delivered via the active provider account.
- Used by registration and related flows — see [Registration email templates](registration-email-templates.md).
- System Admin includes an email test. The person enters a from address, a from name, a to address, a subject, and an HTML body. The page reports whether the configured provider accepted that message. It is a configuration check, not a compose tool.

## Limitations

- Requires a working provider account and configuration for the environment.
- Provider choice and credentials are operational/configuration concerns outside capability narrative detail.
- The email test reports that the provider accepted the message. It does not confirm that the message arrived in an inbox.
