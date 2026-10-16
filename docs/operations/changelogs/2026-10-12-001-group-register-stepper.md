# Group registration collects teams, people, and tickets before it is created

## Summary of the work completed

The group register stepper now has six steps: overview, tickets and pricing, teams and people, activities, summary, and terms. Overview labels the event, dates, and location and shows the event image when one is available. Tickets, teams, people, activities, and the summary are tables. Teams and people can be filtered on the page, five at a time, and the summary shows a total. A group administrator can see published ticket prices, tick existing teams and people, and tick tickets for each of them. The default ticket starts selected. Sold-out tickets stay visible and cannot be chosen. Submit creates the registration, attaches those choices, and opens the registration page. [Submit event registration](../../capabilities/features/web/registration-submit.md) describes those steps, including the Gherkin. The organiser activity routes are unchanged. Two new event routes, `published-individual-activities` and `published-team-activities`, return `ActivityDto` only while registration is open, the event has not started, and the event is not private.

## Why the work was completed

Registering previously created an empty registration after a short overview and a terms checkbox. Teams, people, and tickets were chosen afterwards. The stepper now collects that information first, while the registration page remains the place to edit it. The organiser activity payload includes how many people are already attending and the takings, so the new routes return the catalogue only: title, description, price, default flag, and sold out.

## Date the work was started

2026-10-11

## Date the work was completed

2026-10-12

## Issues that were encountered on the way

The existing event activity routes are limited to event administrators and include attendance counts and sales totals. A group administrator needs the price list before a registration exists, and a registration cannot be created until the terms are agreed. The published routes return `ActivityDto` and refuse the call when the event is missing or outside the registration window.

## References to any best practices that we found

- [Resource-based authorization in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased) — the published catalogue uses its own policy, separate from the organiser activity policy.
- The register page keeps each list on the tracker and does not ask for it again when the stepper moves, matching the other group and registration pages.

## Any remaining issues that we may wish to address

- New members, guests, and teams are still added on the registration page after the registration exists.
- Availability is the sold-out flag. There is no remaining-places count on the published catalogue.
- A private event is never published. It should be published when the group administrator is the person who created the event. The event row does not record that link, so there is no exception yet.
