# System Admin can send one email to check the provider

## Summary of the work completed

System Admin now has an Email test page at `/systemadmin/email-test`. A super administrator enters a from address, a from name, a to address, and a subject, and the page already contains a short HTML body. The from name is the display name on the message, the same slot a registration email fills from the event contact name. Test sends that message through the same email service the API already uses. Today that service is Mailgun. The page shows the provider's acceptance message, or the error, including a disabled setting or a rejected from address. Acceptance means Mailgun accepted the message. It does not confirm that the message arrived in an inbox.

The previous `POST api/sendemail/test-email-send` action always wrote to `dertinfo@gmail.com` from the configured default from address, and any signed-in user could call it. That action now takes the addresses from the page and requires the super-administrator policy.

## Why the work was completed

There was no way to check that the configured email provider would accept a message from a chosen from address to a chosen to address. The fixed test send could not answer that, and it was open to every signed-in user.

## Date the work was started

2026-10-16

## Date the work was completed

2026-10-16

## Issues that were encountered on the way

Mailgun's HTTP error responses often leave RestSharp's `ErrorMessage` empty. The send failure now includes the response body, so a rejected from domain or a bad key is visible on the page.

When Mailgun is disabled, the shared send method still returns without sending, so registration mail does not fail closed. The test action treats that disabled setting as an error instead of a success.

## References to any best practices that we found

- [Mailgun send message](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain--messages) — a successful response means the message was accepted for delivery.
- The test action uses the existing `SuperAdministratorOnlyPolicy`, the same gate as the other System Admin API actions.

## Any remaining issues that we may wish to address

- The page does not confirm inbox delivery.
- System Admin still depends on the deprecated super-admin claim. This page uses that existing gate.
- The SendGrid sender remains in the code and is not registered. The test follows whichever `IEmailSendingService` is registered, which is Mailgun.
