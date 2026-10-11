# Future work from the website smoke walkthrough

**Status:** Noted — not scheduled.

Captured on 2026-09-27 while walking the website. These are product notes, not a ticket backlog. Pick them up as separate work when ready.

Items that mention a super-admin or site-admin area sit beside the current catalogue decision that [Super administrator](../../capabilities/roles/super-admin.md) is deprecated and should be removed. When those items are picked up, decide which role owns the area before building on the deprecated one.

---

## 1. Registration submit confirmation

When a group administrator submits a registration, the status becomes submitted and they stay on the same page. There is no modal and no redirect, so it is unclear whether the submission succeeded.

Show a thank-you modal, then return them automatically to the group home screen after a short countdown, or give an equivalent clear confirmation.

Related: [Submit event registration](../../capabilities/features/web/registration-submit.md), [Registration](../../capabilities/entities/registration.md).

## 2. Submitted registration: what the group can still do

On the group registration screen, a submitted registration does not say that the group can still edit it and resubmit. That is easy to read as locked.

Show what remains allowed in the submitted state, including edit and resubmit. Editing already stops once an event administrator confirms the registration.

Related: [Registration](../../capabilities/entities/registration.md), [Submit event registration](../../capabilities/features/web/registration-submit.md).

## 3. Group privacy settings

Remove the restricted visibility state from group privacy settings. It has no implementation and nobody uses it.

Validate that public and private work as intended. Private must keep that group's information off the public part of the website.

Related: [Group](../../capabilities/entities/group.md) (visibility is currently public, restricted, or private), [Public content](../../capabilities/features/web/public-content.md).

## 4. Public results screen redesign

Redesign the results screen on the public website so it is more user-friendly and more engaging.

Related: [Public content](../../capabilities/features/web/public-content.md), [Publish competition results](../../capabilities/features/web/results-publish.md).

## 5. History page redesign

Redesign the public history page so it shows all previous Derts and the people who attended them, excluding private groups. Make the page more engaging, and link each entry to the matching results page.

Related: [Public content](../../capabilities/features/web/public-content.md).

## 6. Site-admin reports

A super administrator can log into the website and open a section that only site admins can see. That section reports all events that have been run, the attendance of those events, and the revenue of those events.

## 7. Site-admin email test

In the site-admin part of the site, a super administrator can test email and confirm that it is working.

Related: [Send email](../../capabilities/features/web/send-email.md).

## 8. Site-admin messaging

In the site-admin part of the site, improve messaging so notifications can be sent into the messaging system and appear for users.

Related: [In-app notifications](../../capabilities/features/web/in-app-notifications.md).

## 9. Event setup templates

When setting up an event, the organiser can choose a template. Templates carry different marking criteria, score sheets, and categories, and those are selectable as part of event setup.

Event creation already uses an event-type template for activities and competitions. This item is the scoring side of that choice: criteria, score sheets, and categories.

Related: [Create event](../../capabilities/features/web/events-create.md), [Event](../../capabilities/entities/event.md), [Score set](../../capabilities/entities/score-set.md), [Score category](../../capabilities/entities/score-category.md), [Marking sheet](../../capabilities/entities/marking-sheet.md).

## 10. Who can create events

In the site-admin part of the site, specify the user-account emails that are allowed to create events. That setting hides or shows the create-event button for each user.

Related: [Create event](../../capabilities/features/web/events-create.md).

## 11. Homepage promotion from the event

From the admin center, turn on an organiser's ability to promote an event to the homepage. When that is on, the event homepage gains extra fields for the content that should appear on the public homepage. Filling those in promotes the event. Today that promotion is done by manually updating the HTML.

Related: [Event](../../capabilities/entities/event.md) (promote currently means the event can appear in the public listing), [Public content](../../capabilities/features/web/public-content.md).

## 12. Integration suite with a tagged smoke flow

Update the test framework so there is a full integration test suite, and so some tests — or one flow through the tests — can be tagged as the smoke test. On deploy, run that minimum set. It should stay rapid and still show that core functionality works.

Related: [Playwright standards](../../technical/standards/playwright/README.md), [tests/e2e/README.md](../../../tests/e2e/README.md).

## 13. Broken-image placeholder

Replace the image shown when an image URL fails to load. The current placeholder looks poor.

On the website that fallback is `apps/dert-web/src/client/src/app/shared/components/image-retry/image-retry.component.ts` (`assets/images/image-retry-broken.png`). The PWA uses `apps/dert-app/src/client/src/app/directives/imagecheck.directive.ts` (`assets/icon/broken.png`).

## 13. Do not return events a group cannot use

The API should not send a client events that the caller cannot use, and the website should not be the filter that makes that list safe.

`GetAvailableWithPrimaryImage` already requires `IsConfigured` plus open registration dates. The group screen still filters `isConfigured` again in `group-admin.tracker.ts` before **Available / New** and the promoted cards. That client filter is a stopgap.

When this is picked up:

- List and detail endpoints used by a group must omit events that are not configured, cancelled, or outside the registration window. `GET /event/{id}` currently calls the available list and then ignores it, returning the event by id anyway.
- Remove the client-side `isConfigured` filter once those responses are already limited to usable events.
- Keep the registration create check as a guard, not as a substitute for the list.

Related: [Create event](../../capabilities/features/web/events-create.md), [Submit event registration](../../capabilities/features/web/registration-submit.md).

## 15. Cookie consent is covered by the signed-in navigation

The cookie banner is fixed to the bottom left of the page and has no stacking order above the app. After sign-in, the navigation scroll area covers Accept Cookies, so the click never lands. The rest of the site still works without accepting cookies.

Keep the banner above the signed-in shell, and keep it in the way until the visitor accepts. The smoke suite does not wait for that layout change. It accepts cookies once when the site opens, then uses the site as if the banner is gone.

Related: [Cookie consent](../../capabilities/features/web/cookie-consent.md).
