---
name: Invoice
type: entity
status: active
updated: 2026-09-27
id: entity.invoice
---

# Entity: Invoice

## Description

The bill for a confirmed [registration](registration.md), addressed to the group. It carries the total, who it is invoiced to, and notes. It is created only when an event administrator confirms the registration.

## What can be done

- **Create** — happens when an event admin confirms a registration, via [Confirm registrations](../features/web/registration-confirm.md). The registration-confirmed [email](email.md) includes the invoice, pricing, and how to pay. See [Invoicing](../features/web/invoicing.md).
- **Mark paid** — event-admin, via [Invoicing](../features/web/invoicing.md). Unpaid becomes paid when payment is received.
- **Mark unpaid** — event-admin. Paid can be set back to unpaid.
- **View** — group-admin. The group admin can see whether the invoice is paid.

## States

- **Unpaid** — created with the confirmation, and payment has not been recorded.
- **Paid** — the event admin has recorded that payment was received.

See [Domain glossary](../system/domain-glossary.md).
